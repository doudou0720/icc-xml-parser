// ICC-CE XML Export Format TypeScript Interfaces

// Stylus tip shapes
export type StylusTip = "Ellipse" | "Circle" | "Rectangle" | "Square";

// Image stretch modes
export type StretchMode = "Fill" | "Uniform" | "UniformToFill" | "None";

// Drawing attributes interface
export interface DrawingAttributes {
  color: string;
  width: number;
  height: number;
  fitToCurve: boolean;
  isHighlighter: boolean;
  ignorePressure: boolean;
  stylusTip: StylusTip;
}

// Individual stylus point
export interface StylusPoint {
  x: number;
  y: number;
  pressureFactor: number;
}

// Stroke interface
export interface Stroke {
  drawingAttributes: DrawingAttributes;
  stylusPoints: StylusPoint[];
}

// Root XML element interface
export interface InkCanvasStrokes {
  version: string;
  strokeCount: number;
  saveTime: string;
  strokes: Stroke[];
}

// Elements JSON interface for images
export interface CanvasElement {
  type: "Image";
  sourcePath: string;
  left: number;
  top: number;
  width: number;
  height: number;
  stretch: StretchMode;
}

// Metadata interface
export interface Metadata {
  saveTime: string;
  totalPages: number;
  mode: string;
  format: string;
  currentPage: number;
  pageCounts: Record<number, number>;
}
