import type { DragState, ZoomState, CheckBoundsConfig, ZoomConfig, Position } from './types';

// 获取两点之间的距离
export function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 获取触摸事件的中心点
export function getTouchCenter(touch1: Touch, touch2: Touch): Position {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  };
}

// 设置元素变换
export function setTransform(element: any, x: number, y: number, scale: number): void {
  // 检测是否为Pixi.Container对象
  if (element && typeof element.position === 'object' && typeof element.scale === 'object') {
    // Pixi容器：设置position和scale属性
    element.position.x = x;
    element.position.y = y;
    element.scale.x = scale;
    element.scale.y = scale;
  } else if (element instanceof HTMLElement) {
    // HTMLElement：使用CSS transform
    element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }
}

// 处理边界检测
export function checkBounds(x: number, y: number, config: CheckBoundsConfig): Position {
  const { container, element, scale, app } = config;
  
  const containerRect = container.getBoundingClientRect();
  
  let elementWidth: number;
  let elementHeight: number;
  
  // 检测是否为Pixi.Container对象
  if (element && typeof element.position === 'object' && app) {
    // Pixi容器：使用应用的渲染器尺寸
    const renderer = app.renderer;
    elementWidth = renderer.width * scale;
    elementHeight = renderer.height * scale;
  } else if (element instanceof HTMLElement) {
    // HTMLElement：使用DOM元素尺寸
    elementWidth = element.offsetWidth * scale;
    elementHeight = element.offsetHeight * scale;
  } else {
    // 无法获取尺寸，返回原始位置
    return { x, y };
  }
  
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
export function handleZoom(config: ZoomConfig): number {
  const { currentScale, delta, minZoom, maxZoom } = config;
  return Math.max(minZoom, Math.min(maxZoom, currentScale * delta));
}

// 计算拖动位移
export function calculateDragDelta(
  dragState: DragState,
  clientX: number,
  clientY: number
): Position {
  const deltaX = clientX - dragState.startX;
  const deltaY = clientY - dragState.startY;
  
  return {
    x: dragState.initialX + deltaX,
    y: dragState.initialY + deltaY
  };
}

// 初始化拖动状态
export function initDragState(): DragState {
  return {
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  };
}

// 初始化缩放状态
export function initZoomState(minZoom: number = 0.1, maxZoom: number = 5): ZoomState {
  return {
    scale: 1,
    minZoom,
    maxZoom,
    isZooming: false,
    startScale: 1,
    initialDistance: 0,
    centerX: 0,
    centerY: 0
  };
}