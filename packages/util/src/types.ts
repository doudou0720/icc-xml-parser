// 拖动状态接口
export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

// 缩放状态接口
export interface ZoomState {
  scale: number;
  minZoom?: number;
  maxZoom?: number;
  isZooming: boolean;
  startScale: number;
  initialDistance: number;
  centerX: number;
  centerY: number;
}

// 边界检测配置接口
export interface CheckBoundsConfig {
  container: HTMLElement;
  element: any; // 支持HTMLElement或Pixi.Container
  scale: number;
  app?: any; // Pixi应用实例，用于获取渲染器尺寸
}

// 缩放配置接口
export interface ZoomConfig {
  currentScale: number;
  delta: number;
  minZoom: number;
  maxZoom: number;
}

// 位置接口
export interface Position {
  x: number;
  y: number;
}