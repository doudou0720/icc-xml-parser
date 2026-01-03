import { Application } from 'pixi.js';
import { ICCXmlParser, InkRenderer, InkCanvasStrokes } from '@icc-xml-parser/core';
import { 
  DragState, ZoomState, 
  getDistance, getTouchCenter, setTransform, checkBounds, handleZoom as calculateZoom, 
  calculateDragDelta, initDragState, initZoomState
} from '@icc-xml-parser/util';

// DOM元素
const container = document.getElementById('container');
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const sampleBtn = document.getElementById('sampleBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const zoomLevel = document.getElementById('zoomLevel');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const resetZoomBtn = document.getElementById('resetZoomBtn');
const resetPositionBtn = document.getElementById('resetPositionBtn');

// 应用状态
let app: Application | null = null;
let inkRenderer: InkRenderer | null = null;
let stage: any = null; // 保存stage引用

// 更新状态显示
function updateStatus(message: string): void {
  if (status) {
    status.textContent = message;
  }
}

// 更新缩放级别显示
function updateZoomLevelDisplay(): void {
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(zoomState.scale * 100)}%`;
  }
}

// 初始化拖动和缩放状态
const dragState = initDragState();
const zoomState = initZoomState(0.1, 5);

// 处理缩放
function handleZoom(delta: number, centerX: number, centerY: number): void {
  if (!app || !stage || !container) return;
  
  // 获取容器的位置信息
  const containerRect = container.getBoundingClientRect();
  
  // 计算中心点在容器坐标系中的位置
  const localCenterX = centerX - containerRect.left;
  const localCenterY = centerY - containerRect.top;
  
  // 保存当前缩放中心点
  zoomState.centerX = localCenterX;
  zoomState.centerY = localCenterY;
  
  // 计算新的缩放比例
  const newScale = calculateZoom({
    currentScale: zoomState.scale,
    delta,
    minZoom: zoomState.minZoom!,
    maxZoom: zoomState.maxZoom!
  });
  
  if (newScale !== zoomState.scale) {
    // 计算元素相对中心点的偏移
    const offsetX = stage.position.x - localCenterX;
    const offsetY = stage.position.y - localCenterY;
    
    // 应用缩放并调整位置，保持中心点不变
    const scaleRatio = newScale / zoomState.scale;
    stage.position.x = localCenterX + offsetX * scaleRatio;
    stage.position.y = localCenterY + offsetY * scaleRatio;
    
    // 更新缩放比例
    zoomState.scale = newScale;
    updateZoomLevelDisplay();
    
    // 更新stage的scale
    stage.scale.x = zoomState.scale;
    stage.scale.y = zoomState.scale;
  }
}

// 渲染墨迹数据
async function renderInkData(data: string | InkCanvasStrokes): Promise<void> {
  if (!inkRenderer) return;
  
  try {
    let inkData: InkCanvasStrokes;
    
    if (typeof data === 'string') {
      // 如果是XML字符串，解析它
      inkData = ICCXmlParser.parseXml(data);
    } else {
      // 如果已经是解析后的对象，直接使用
      inkData = data;
    }
    
    // 渲染墨迹
    inkRenderer.render(inkData);
    
    // 更新状态
    updateStatus(`已加载：${inkData.strokeCount} 条墨迹 (版本 ${inkData.version})`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('未知错误');
    updateStatus(`错误：${err.message}`);
    console.error('渲染错误:', err);
  }
}

// 处理文件上传
async function handleFileUpload(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    try {
      updateStatus('正在加载 XML 文件...');
      const text = await file.text();
      await renderInkData(text);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('文件读取错误');
      updateStatus(`错误：${err.message}`);
      console.error('文件读取错误:', err);
    }
  }
}

// 加载示例数据
function loadSampleData(): void {
  if (!inkRenderer) return;
  
  try {
    // 使用InkRenderer的静态方法创建示例数据
    const sampleData = InkRenderer.createSampleData();
    inkRenderer.render(sampleData);
    updateStatus(`已加载示例数据：${sampleData.strokeCount} 条墨迹`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('示例数据加载错误');
    updateStatus(`错误：${err.message}`);
    console.error('示例数据加载错误:', err);
  }
}

// 清除画布
function clearCanvas(): void {
  if (inkRenderer) {
    inkRenderer.clear();
    updateStatus('已清除所有墨迹');
  }
}

// 从URL参数加载数据
async function loadDataFromUrl(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const filePath = urlParams.get('file');
  const xmlContent = urlParams.get('xml');
  
  if (xmlContent) {
    // 从URL参数获取XML内容
    try {
      updateStatus('正在加载 URL 中的 XML 数据...');
      await renderInkData(decodeURIComponent(xmlContent));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('URL XML 解析错误');
      updateStatus(`错误：${err.message}`);
      console.error('URL XML 解析错误:', err);
    }
  } else if (filePath) {
    // 从URL加载文件
    try {
      updateStatus(`正在加载文件：${filePath}...`);
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`文件加载失败：${response.status}`);
      }
      const text = await response.text();
      await renderInkData(text);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('文件加载错误');
      updateStatus(`错误：${err.message}`);
      console.error('文件加载错误:', err);
    }
  }
}

// 初始化拖动和缩放功能
function initDragAndZoom(): void {
  if (!container || !app || !stage) return;
  
  // 鼠标拖动事件
  container.addEventListener('mousedown', (e) => {
    // 只允许左键拖动
    if (e.button !== 0) return;
    
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    
    // 获取当前stage的position值
    dragState.initialX = stage.position.x;
    dragState.initialY = stage.position.y;
    
    container.classList.add('dragging');
    e.preventDefault();
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!dragState.isDragging) return;
    
    // 计算拖动位移
    const delta = calculateDragDelta(dragState, e.clientX, e.clientY);
    
    // 直接应用变换到stage，取消边界限制
    stage.position.x = delta.x;
    stage.position.y = delta.y;
    e.preventDefault();
  });
  
  window.addEventListener('mouseup', () => {
    if (dragState.isDragging) {
      dragState.isDragging = false;
      container.classList.remove('dragging');
    }
  });
  
  // 触摸拖动事件
  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      // 单指拖动
      dragState.isDragging = true;
      dragState.startX = e.touches[0].clientX;
      dragState.startY = e.touches[0].clientY;
      
      // 获取当前stage的position值
      dragState.initialX = stage.position.x;
      dragState.initialY = stage.position.y;
      
      container.classList.add('dragging');
    } else if (e.touches.length === 2) {
      // 双指缩放
      zoomState.isZooming = true;
      zoomState.startScale = zoomState.scale;
      zoomState.initialDistance = getDistance(e.touches[0], e.touches[1]);
      container.classList.add('zooming');
    }
    e.preventDefault();
  });
  
  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && dragState.isDragging) {
      // 单指拖动
      const delta = calculateDragDelta(dragState, e.touches[0].clientX, e.touches[0].clientY);
      
      // 直接应用变换到stage，取消边界限制
      stage.position.x = delta.x;
      stage.position.y = delta.y;
    } else if (e.touches.length === 2 && zoomState.isZooming) {
      // 双指缩放
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      // 计算当前触摸中心点
      const center = getTouchCenter(touch1, touch2);
      
      // 计算缩放比例变化
      const currentDistance = getDistance(touch1, touch2);
      const scaleChange = currentDistance / zoomState.initialDistance;
      
      // 调用handleZoom函数，使用触摸中心点作为缩放中心
      handleZoom(scaleChange, center.x, center.y);
    }
    e.preventDefault();
  });
  
  container.addEventListener('touchend', (e) => {
    if (dragState.isDragging) {
      dragState.isDragging = false;
      container.classList.remove('dragging');
    }
    
    if (zoomState.isZooming) {
      zoomState.isZooming = false;
      container.classList.remove('zooming');
    }
  });
  
  // 鼠标滚轮缩放
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // 计算缩放方向和比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    handleZoom(delta, e.clientX, e.clientY);
  });
  
  // 缩放控件事件
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      handleZoom(1.1, 0, 0);
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      handleZoom(0.9, 0, 0);
    });
  }
  
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', () => {
      // 重置缩放
      zoomState.scale = 1;
      stage.scale.x = 1;
      stage.scale.y = 1;
      updateZoomLevelDisplay();
    });
  }
  
  if (resetPositionBtn) {
    resetPositionBtn.addEventListener('click', () => {
      // 重置位置
      stage.position.x = 0;
      stage.position.y = 0;
      // 更新初始位置，确保下次拖动正确
      dragState.initialX = 0;
      dragState.initialY = 0;
    });
  }
}

// 初始化应用
async function initApp(): Promise<void> {
  if (!container) {
    updateStatus('错误：容器元素不存在');
    return;
  }
  
  try {
    // 创建Pixi应用
    app = new Application();
    
    // 初始化应用
    await app.init({
      background: '#ffffff',
      resizeTo: container,
      antialias: true, // 启用抗锯齿
      resolution: window.devicePixelRatio // 支持高DPI屏幕
    });
    
    if (app) {
      container.appendChild(app.canvas);
      inkRenderer = new InkRenderer(app);
      
      // 保存stage引用
      stage = app.stage;
      
      // 绑定事件监听器
      if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
      }
      
      if (sampleBtn) {
        sampleBtn.addEventListener('click', loadSampleData);
      }
      
      if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
      }
      
      // 初始化拖动和缩放功能
      initDragAndZoom();
      
      // 从URL参数加载数据
      await loadDataFromUrl();
      
      updateStatus('就绪：请选择 XML 文件或加载示例数据');
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('初始化错误');
    updateStatus(`初始化错误：${err.message}`);
    console.error('初始化错误:', err);
  }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);

// 清理资源
window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
    app = null;
  }
  inkRenderer = null;
});