import { Graphics } from 'pixi.js';
/**
 * Renders ICC-CE ink strokes using PixiJS
 */
export class InkRenderer {
    /**
     * Creates a new InkRenderer
     */
    constructor(app) {
        Object.defineProperty(this, "app", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "graphics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.app = app;
        this.graphics = new Graphics();
        this.app.stage.addChild(this.graphics);
    }
    /**
     * Clears all rendered strokes
     */
    clear() {
        this.graphics.clear();
    }
    /**
     * Renders all strokes from InkCanvasStrokes data
     */
    render(inkData) {
        this.clear();
        for (const stroke of inkData.strokes) {
            this.renderStroke(stroke);
        }
    }
    /**
     * Renders a single stroke
     */
    renderStroke(stroke) {
        const { drawingAttributes, stylusPoints } = stroke;
        if (stylusPoints.length < 2) {
            return; // Need at least 2 points to draw a line
        }
        // Set stroke color
        const color = this.hexToRgb(drawingAttributes.color);
        if (!color)
            return;
        // Start drawing with v8 syntax
        this.graphics
            .lineStyle(drawingAttributes.width, (color.r << 16) | (color.g << 8) | color.b, color.a / 255)
            .moveTo(stylusPoints[0].x, stylusPoints[0].y);
        if (drawingAttributes.fitToCurve) {
            // Use curve fitting for smoother lines
            this.renderCurve(stylusPoints);
        }
        else {
            // Simple line drawing
            this.renderLines(stylusPoints);
        }
        // End stroke
        this.graphics.stroke();
    }
    /**
     * Renders strokes as simple lines between points
     */
    renderLines(points) {
        for (let i = 1; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }
    }
    /**
     * Renders strokes with curve fitting (simplified Bezier curve)
     */
    renderCurve(points) {
        for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            // Calculate control points for smooth curve
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            this.graphics.bezierCurveTo(cp1x, cp1y, cp1x, cp1y, p2.x, p2.y);
        }
    }
    /**
     * Converts ARGB hex string to RGBA object
     */
    hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
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
    static createSampleData() {
        return {
            version: '1.0',
            strokeCount: 2,
            saveTime: new Date().toISOString(),
            strokes: [
                {
                    drawingAttributes: {
                        color: '#FFFF0000',
                        width: 5,
                        height: 5,
                        fitToCurve: true,
                        isHighlighter: false,
                        ignorePressure: false,
                        stylusTip: 'Ellipse'
                    },
                    stylusPoints: [
                        { x: 100, y: 100, pressureFactor: 0.5 },
                        { x: 150, y: 120, pressureFactor: 0.6 },
                        { x: 200, y: 100, pressureFactor: 0.7 },
                        { x: 250, y: 150, pressureFactor: 0.8 },
                        { x: 300, y: 120, pressureFactor: 0.9 }
                    ]
                },
                {
                    drawingAttributes: {
                        color: '#FF0000FF',
                        width: 3,
                        height: 3,
                        fitToCurve: true,
                        isHighlighter: false,
                        ignorePressure: true,
                        stylusTip: 'Circle'
                    },
                    stylusPoints: [
                        { x: 150, y: 200, pressureFactor: 0.5 },
                        { x: 180, y: 220, pressureFactor: 0.5 },
                        { x: 210, y: 200, pressureFactor: 0.5 },
                        { x: 240, y: 230, pressureFactor: 0.5 },
                        { x: 270, y: 210, pressureFactor: 0.5 },
                        { x: 300, y: 240, pressureFactor: 0.5 }
                    ]
                }
            ]
        };
    }
}
