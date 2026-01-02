import { Application } from 'pixi.js';
import { ICCXmlParser, InkRenderer, InkCanvasStrokes } from '@icc-xml-parser/core';

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

// 应用状态
let app: Application | null = null;
let inkRenderer: InkRenderer | null = null;

// 拖动和缩放状态
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

interface ZoomState {
  scale: number;
  minZoom: number;
  maxZoom: number;
  isZooming: boolean;
  startScale: number;
  initialDistance: number;
}

const dragState: DragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0
};

const zoomState: ZoomState = {
  scale: 1,
  minZoom: 0.1,
  maxZoom: 5,
  isZooming: false,
  startScale: 1,
  initialDistance: 0
};

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

// 获取两点之间的距离
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 获取触摸事件的中心点
function getTouchCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
}

// 设置元素变换
function setTransform(element: HTMLElement, x: number, y: number, scale: number): void {
  element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

// 处理边界检测
function checkBounds(x: number, y: number, element: HTMLElement): { x: number; y: number } {
  if (!container) return { x, y };
  
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  
  const elementWidth = elementRect.width * zoomState.scale;
  const elementHeight = elementRect.height * zoomState.scale;
  
  // 计算边界限制
  const minX = Math.min(0, containerRect.width - elementWidth);
  const minY = Math.min(0, containerRect.height - elementHeight);
  const maxX = Math.max(0, containerRect.width - elementWidth);
  const maxY = Math.max(0, containerRect.height - elementHeight);
  
  // 确保元素不会超出容器
  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY))
  };
}

// 处理缩放
function handleZoom(delta: number, centerX: number, centerY: number): void {
  if (!app || !container) return;
  
  const newScale = Math.max(zoomState.minZoom, Math.min(zoomState.maxZoom, zoomState.scale * delta));
  
  if (newScale !== zoomState.scale) {
    zoomState.scale = newScale;
    updateZoomLevelDisplay();
    
    // 以中心点进行缩放，需要调整位置
    if (app.canvas) {
      // 这里假设app.canvas是可拖动的元素
      // 实际实现中可能需要调整InkRenderer的缩放逻辑
    }
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
  if (!container) return;
  
  // 鼠标拖动事件
  container.addEventListener('mousedown', (e) => {
    // 只允许左键拖动
    if (e.button !== 0) return;
    
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    
    // 获取当前元素的transform值
    const transform = window.getComputedStyle(container).transform;
    const matrix = new DOMMatrix(transform);
    dragState.initialX = matrix.m41;
    dragState.initialY = matrix.m42;
    
    container.classList.add('dragging');
    e.preventDefault();
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!dragState.isDragging) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    let newX = dragState.initialX + deltaX;
    let newY = dragState.initialY + deltaY;
    
    // 应用边界检测
    const bounded = checkBounds(newX, newY, container);
    newX = bounded.x;
    newY = bounded.y;
    
    // 应用变换
    container.style.transform = `translate(${newX}px, ${newY}px) scale(${zoomState.scale})`;
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
      
      const transform = window.getComputedStyle(container).transform;
      const matrix = new DOMMatrix(transform);
      dragState.initialX = matrix.m41;
      dragState.initialY = matrix.m42;
      
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
      const deltaX = e.touches[0].clientX - dragState.startX;
      const deltaY = e.touches[0].clientY - dragState.startY;
      
      let newX = dragState.initialX + deltaX;
      let newY = dragState.initialY + deltaY;
      
      const bounded = checkBounds(newX, newY, container);
      newX = bounded.x;
      newY = bounded.y;
      
      container.style.transform = `translate(${newX}px, ${newY}px) scale(${zoomState.scale})`;
    } else if (e.touches.length === 2 && zoomState.isZooming) {
      // 双指缩放
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / zoomState.initialDistance;
      const newScale = Math.max(zoomState.minZoom, Math.min(zoomState.maxZoom, zoomState.startScale * scaleChange));
      
      if (newScale !== zoomState.scale) {
        zoomState.scale = newScale;
        updateZoomLevelDisplay();
        
        const center = getTouchCenter(e.touches[0], e.touches[1]);
        // 这里可以添加缩放中心逻辑
        
        container.style.transform = `translate(${dragState.initialX}px, ${dragState.initialY}px) scale(${zoomState.scale})`;
      }
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
    
    // 更新transform
    container.style.transform = `translate(${dragState.initialX}px, ${dragState.initialY}px) scale(${zoomState.scale})`;
  });
  
  // 缩放控件事件
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      handleZoom(1.1, 0, 0);
      container.style.transform = `translate(${dragState.initialX}px, ${dragState.initialY}px) scale(${zoomState.scale})`;
    });
  }
  
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      handleZoom(0.9, 0, 0);
      container.style.transform = `translate(${dragState.initialX}px, ${dragState.initialY}px) scale(${zoomState.scale})`;
    });
  }
  
  if (resetZoomBtn) {
    resetZoomBtn.addEventListener('click', () => {
      // 重置缩放和位置
      zoomState.scale = 1;
      dragState.initialX = 0;
      dragState.initialY = 0;
      updateZoomLevelDisplay();
      container.style.transform = `translate(0, 0) scale(1)`;
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