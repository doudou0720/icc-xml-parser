import { Application, Graphics } from "pixi.js";
import { InkCanvasStrokes, Stroke } from "./icc-xml-types";

/**
 * Renders ICC-CE ink strokes using PixiJS
 */
export class InkRenderer {
  private app: Application;
  private graphics: Graphics;

  /**
   * Creates a new InkRenderer
   */
  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
    this.app.stage.addChild(this.graphics);
  }

  /**
   * Clears all rendered strokes
   */
  clear(): void {
    this.graphics.clear();
  }

  /**
   * Renders all strokes from InkCanvasStrokes data
   */
  render(inkData: InkCanvasStrokes): void {
    this.clear();

    for (const stroke of inkData.strokes) {
      this.renderStroke(stroke);
    }
  }

  /**
   * Renders a single stroke
   */
  private renderStroke(stroke: Stroke): void {
    const { drawingAttributes, stylusPoints } = stroke;

    if (stylusPoints.length < 2) {
      return; // Need at least 2 points to draw a line
    }

    // Set stroke color
    const color = this.hexToRgb(drawingAttributes.color);
    if (!color) return;

    // Start drawing with v8 syntax
    this.graphics
      .setStrokeStyle({
        width: drawingAttributes.width,
        color: (color.r << 16) | (color.g << 8) | color.b,
        alpha: color.a / 255,
      })
      .moveTo(stylusPoints[0].x, stylusPoints[0].y);

    if (drawingAttributes.fitToCurve) {
      // Use curve fitting for smoother lines
      this.renderCurve(stylusPoints);
    } else {
      // Simple line drawing
      this.renderLines(stylusPoints);
    }

    // End stroke
    this.graphics.stroke();
  }

  /**
   * Renders strokes as simple lines between points
   */
  private renderLines(points: Array<{ x: number; y: number }>): void {
    for (let i = 1; i < points.length; i++) {
      this.graphics.lineTo(points[i].x, points[i].y);
    }
  }

  /**
   * Renders strokes with curve fitting (simplified Bezier curve)
   */
  private renderCurve(points: Array<{ x: number; y: number }>): void {
    // 平滑曲线算法：使用Catmull-Rom样条转换为贝塞尔曲线
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i === 0 ? points[i] : points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

      // 计算贝塞尔曲线的控制点
      const tension = 0.5; // 曲线张力，0.5为默认值
      
      // Catmull-Rom样条到贝塞尔曲线的转换公式
      const cp1x = p1.x + (p2.x - p0.x) * tension * 0.5;
      const cp1y = p1.y + (p2.y - p0.y) * tension * 0.5;
      const cp2x = p2.x - (p3.x - p1.x) * tension * 0.5;
      const cp2y = p2.y - (p3.y - p1.y) * tension * 0.5;

      this.graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  }

  /**
   * Converts ARGB hex string to RGBA object
   */
  private hexToRgb(
    hex: string,
  ): { r: number; g: number; b: number; a: number } | null {
    // Remove # if present
    hex = hex.replace("#", "");

    // Parse ARGB format (8 characters)
    if (hex.length === 8) {
      const a = parseInt(hex.substring(0, 2), 16);
      const r = parseInt(hex.substring(2, 4), 16);
      const g = parseInt(hex.substring(4, 6), 16);
      const b = parseInt(hex.substring(6, 8), 16);

      return { r, g, b, a };
    }

    // Parse RGB format (6 characters)
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      return { r, g, b, a: 255 };
    }

    return null;
  }

  /**
   * Creates a sample InkCanvasStrokes object for testing
   */
  static createSampleData(): InkCanvasStrokes {
    return {
      version: "1.0",
      strokeCount: 2,
      saveTime: new Date().toISOString(),
      strokes: [
        {
          drawingAttributes: {
            color: "#FFFF0000",
            width: 5,
            height: 5,
            fitToCurve: true,
            isHighlighter: false,
            ignorePressure: false,
            stylusTip: "Ellipse",
          },
          stylusPoints: [
            { x: 100, y: 100, pressureFactor: 0.5 },
            { x: 150, y: 120, pressureFactor: 0.6 },
            { x: 200, y: 100, pressureFactor: 0.7 },
            { x: 250, y: 150, pressureFactor: 0.8 },
            { x: 300, y: 120, pressureFactor: 0.9 },
          ],
        },
        {
          drawingAttributes: {
            color: "#FF0000FF",
            width: 3,
            height: 3,
            fitToCurve: true,
            isHighlighter: false,
            ignorePressure: true,
            stylusTip: "Circle",
          },
          stylusPoints: [
            { x: 150, y: 200, pressureFactor: 0.5 },
            { x: 180, y: 220, pressureFactor: 0.5 },
            { x: 210, y: 200, pressureFactor: 0.5 },
            { x: 240, y: 230, pressureFactor: 0.5 },
            { x: 270, y: 210, pressureFactor: 0.5 },
            { x: 300, y: 240, pressureFactor: 0.5 },
          ],
        },
      ],
    };
  }
}