<template>
  <div class="icc-xml-viewer" :style="containerStyle">
    <div ref="containerRef" class="viewer-container" :style="contentStyle">
      <!-- Pixi canvas will be appended here -->
    </div>
    <slot v-if="!modelValue">
      <div class="default-ui">
        <h3>ICC-CE XML 墨迹查看器</h3>
        <input
          type="file"
          accept=".xml"
          @change="handleFileUpload"
          class="file-input"
        />
        <button @click="loadSampleData" class="sample-btn">加载示例数据</button>
        <button @click="clearCanvas" class="clear-btn">清除</button>
        <div class="status">{{ status }}</div>
      </div>
    </slot>
    <!-- 缩放控件 -->
    <div class="zoom-controls">
      <button @click="zoomOut" class="zoom-btn">-</button>
      <div class="zoom-level">{{ Math.round(zoomState.scale * 100) }}%</div>
      <button @click="zoomIn" class="zoom-btn">+</button>
      <button @click="resetZoom" class="zoom-btn">重置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import { Application } from 'pixi.js';
import { ICCXmlParser, InkRenderer, InkCanvasStrokes } from '@icc-xml-parser/core';

// Props定义
interface Props {
  modelValue?: string | InkCanvasStrokes;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  // 拖动相关Props
  draggable?: boolean;
  dragHandle?: string;
  dragStyles?: Record<string, string>;
  // 缩放相关Props
  zoomable?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '600px',
  backgroundColor: '#ffffff',
  modelValue: undefined,
  // 拖动默认值
  draggable: true,
  dragHandle: '',
  dragStyles: () => ({ cursor: 'grabbing', opacity: '0.8' }),
  // 缩放默认值
  zoomable: true,
  minZoom: 0.1,
  maxZoom: 5
});

// Emits定义
interface Emits {
  (e: 'update:modelValue', value: InkCanvasStrokes): void;
  (e: 'load', value: InkCanvasStrokes): void;
  (e: 'error', error: Error): void;
  // 拖动相关事件
  (e: 'drag-start', element: HTMLDivElement, event: MouseEvent | TouchEvent): void;
  (e: 'drag-move', element: HTMLDivElement, position: { x: number; y: number }, event: MouseEvent | TouchEvent): void;
  (e: 'drag-end', element: HTMLDivElement, position: { x: number; y: number }, event: MouseEvent | TouchEvent): void;
  // 缩放相关事件
  (e: 'zoom-start', element: HTMLDivElement, scale: number, event: WheelEvent | TouchEvent): void;
  (e: 'zoom-change', element: HTMLDivElement, scale: number, position: { x: number; y: number }, event: WheelEvent | TouchEvent): void;
  (e: 'zoom-end', element: HTMLDivElement, scale: number, position: { x: number; y: number }, event: WheelEvent | TouchEvent): void;
}

const emit = defineEmits<Emits>();

// 组件状态
const containerRef = ref<HTMLDivElement | null>(null);
const app: ref<Application | null> = ref(null);
const inkRenderer: ref<InkRenderer | null> = ref(null);
const status = ref<string>('就绪：请选择 XML 文件');

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
  isZooming: boolean;
  startScale: number;
  initialDistance: number;
}

const position = ref({ x: 0, y: 0 });
const dragState: DragState = {
  isDragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0
};

const zoomState: ZoomState = {
  scale: 1,
  isZooming: false,
  startScale: 1,
  initialDistance: 0
};

// 当前应用的样式
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: props.backgroundColor,
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  touchAction: 'none',
  userSelect: 'none',
  cursor: dragState.isDragging ? 'grabbing' : 'grab'
}));

// 内容容器样式
const contentStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoomState.scale})`,
  transition: dragState.isDragging || zoomState.isZooming ? 'none' : 'transform 0.1s ease',
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}));

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

// 处理边界检测
function checkBounds(x: number, y: number): { x: number; y: number } {
  if (!containerRef.value) return { x, y };
  
  const parentElement = containerRef.value.parentElement;
  if (!parentElement) return { x, y };
  
  const containerRect = parentElement.getBoundingClientRect();
  const elementWidth = containerRect.width * zoomState.scale;
  const elementHeight = containerRect.height * zoomState.scale;
  
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
  if (!props.zoomable || !containerRef.value) return;
  
  const newScale = Math.max(props.minZoom, Math.min(props.maxZoom, zoomState.scale * delta));
  
  if (newScale !== zoomState.scale) {
    zoomState.scale = newScale;
    emit('zoom-change', containerRef.value, zoomState.scale, position.value, event as any);
  }
}

// 缩放控制方法
function zoomIn(): void {
  handleZoom(1.1, 0, 0);
}

function zoomOut(): void {
  handleZoom(0.9, 0, 0);
}

function resetZoom(): void {
  zoomState.scale = 1;
  position.value = { x: 0, y: 0 };
  if (containerRef.value) {
    emit('zoom-change', containerRef.value, zoomState.scale, position.value, event as any);
  }
}

// 初始化拖动和缩放事件
function initDragAndZoom(): void {
  if (!containerRef.value) return;
  
  const container = containerRef.value;
  const parentContainer = container.parentElement!;
  
  // 鼠标拖动事件
  parentContainer.addEventListener('mousedown', (e) => {
    // 只允许左键拖动
    if (e.button !== 0 || !props.draggable) return;
    
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.initialX = position.value.x;
    dragState.initialY = position.value.y;
    
    emit('drag-start', container, e);
    e.preventDefault();
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!dragState.isDragging || !props.draggable) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    let newX = dragState.initialX + deltaX;
    let newY = dragState.initialY + deltaY;
    
    // 应用边界检测
    const bounded = checkBounds(newX, newY);
    newX = bounded.x;
    newY = bounded.y;
    
    // 更新位置
    position.value = { x: newX, y: newY };
    emit('drag-move', container, position.value, e);
    e.preventDefault();
  });
  
  window.addEventListener('mouseup', (e) => {
    if (dragState.isDragging && props.draggable) {
      dragState.isDragging = false;
      emit('drag-end', container, position.value, e);
    }
  });
  
  // 触摸拖动事件
  parentContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1 && props.draggable) {
      // 单指拖动
      dragState.isDragging = true;
      dragState.startX = e.touches[0].clientX;
      dragState.startY = e.touches[0].clientY;
      dragState.initialX = position.value.x;
      dragState.initialY = position.value.y;
      
      emit('drag-start', container, e);
    } else if (e.touches.length === 2 && props.zoomable) {
      // 双指缩放
      zoomState.isZooming = true;
      zoomState.startScale = zoomState.scale;
      zoomState.initialDistance = getDistance(e.touches[0], e.touches[1]);
      emit('zoom-start', container, zoomState.scale, e);
    }
    e.preventDefault();
  });
  
  parentContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && dragState.isDragging && props.draggable) {
      // 单指拖动
      const deltaX = e.touches[0].clientX - dragState.startX;
      const deltaY = e.touches[0].clientY - dragState.startY;
      
      let newX = dragState.initialX + deltaX;
      let newY = dragState.initialY + deltaY;
      
      // 应用边界检测
      const bounded = checkBounds(newX, newY);
      newX = bounded.x;
      newY = bounded.y;
      
      // 更新位置
      position.value = { x: newX, y: newY };
      emit('drag-move', container, position.value, e);
    } else if (e.touches.length === 2 && zoomState.isZooming && props.zoomable) {
      // 双指缩放
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / zoomState.initialDistance;
      const newScale = Math.max(props.minZoom, Math.min(props.maxZoom, zoomState.startScale * scaleChange));
      
      if (newScale !== zoomState.scale) {
        zoomState.scale = newScale;
        emit('zoom-change', container, zoomState.scale, position.value, e);
      }
    }
    e.preventDefault();
  });
  
  parentContainer.addEventListener('touchend', (e) => {
    if (dragState.isDragging && props.draggable) {
      dragState.isDragging = false;
      emit('drag-end', container, position.value, e);
    }
    
    if (zoomState.isZooming && props.zoomable) {
      zoomState.isZooming = false;
      emit('zoom-end', container, zoomState.scale, position.value, e);
    }
  });
  
  // 鼠标滚轮缩放
  parentContainer.addEventListener('wheel', (e) => {
    if (!props.zoomable) return;
    
    e.preventDefault();
    
    // 计算缩放方向和比例
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    handleZoom(delta, e.clientX, e.clientY);
  });
}

// 初始化Pixi应用
onMounted(() => {
  if (!containerRef.value) return;
  
  // 创建Pixi应用
  app.value = new Application();
  
  // 初始化应用
  app.value.init({
    background: props.backgroundColor,
    resizeTo: containerRef.value
  }).then(() => {
    if (containerRef.value && app.value) {
      containerRef.value.appendChild(app.value.canvas);
      inkRenderer.value = new InkRenderer(app.value);
      
      // 初始化拖动和缩放事件
      initDragAndZoom();
      
      // 如果有初始数据，渲染它
      if (props.modelValue) {
        renderInkData(props.modelValue);
      }
    }
  }).catch(error => {
    emit('error', error);
    status.value = `初始化错误：${error.message}`;
  });
});

// 监听modelValue变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && inkRenderer.value) {
      renderInkData(newValue);
    }
  },
  { deep: true }
);

// 渲染墨迹数据
async function renderInkData(data: string | InkCanvasStrokes) {
  if (!inkRenderer.value) return;
  
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
    inkRenderer.value.render(inkData);
    
    // 更新状态和事件
    status.value = `已加载：${inkData.strokeCount} 条墨迹 (版本 ${inkData.version})`;
    emit('update:modelValue', inkData);
    emit('load', inkData);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('未知错误');
    emit('error', err);
    status.value = `错误：${err.message}`;
  }
}

// 处理文件上传
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    try {
      status.value = '正在加载 XML 文件...';
      const text = await file.text();
      await renderInkData(text);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('文件读取错误');
      emit('error', err);
      status.value = `错误：${err.message}`;
    }
  }
}

// 加载示例数据
function loadSampleData() {
  if (!inkRenderer.value) return;
  
  try {
    // 使用InkRenderer的静态方法创建示例数据
    const sampleData = InkRenderer.createSampleData();
    inkRenderer.value.render(sampleData);
    status.value = `已加载示例数据：${sampleData.strokeCount} 条墨迹`;
    emit('update:modelValue', sampleData);
    emit('load', sampleData);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('示例数据加载错误');
    emit('error', err);
    status.value = `错误：${err.message}`;
  }
}

// 清除画布
function clearCanvas() {
  if (inkRenderer.value) {
    inkRenderer.value.clear();
    status.value = '已清除所有墨迹';
  }
}

// 组件销毁前清理资源
onBeforeUnmount(() => {
  if (app.value) {
    app.value.destroy();
    app.value = null;
  }
  inkRenderer.value = null;
});
</script>

<style scoped>
.icc-xml-viewer {
  font-family: Arial, sans-serif;
}

.viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.default-ui {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.default-ui h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.file-input {
  margin-bottom: 10px;
  display: block;
}

.sample-btn {
  padding: 8px 12px;
  margin-right: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.sample-btn:hover {
  background: #45a049;
}

.clear-btn {
  padding: 8px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn:hover {
  background: #da190b;
}

.status {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}

/* 缩放控件样式 */
.zoom-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  gap: 10px;
  align-items: center;
}

.zoom-btn {
  padding: 8px 12px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 30px;
  text-align: center;
}

.zoom-btn:hover {
  background: #1976D2;
}

.zoom-level {
  font-size: 14px;
  color: #333;
  min-width: 60px;
  text-align: center;
}

/* 触摸反馈样式 */
@media (hover: none) and (pointer: coarse) {
  .icc-xml-viewer {
    cursor: default;
  }
}
</style>