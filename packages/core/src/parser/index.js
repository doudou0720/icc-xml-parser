/**
 * Parses ICC-CE XML format into TypeScript objects
 */
export class ICCXmlParser {
    /**
     * Parses XML string into InkCanvasStrokes object
     */
    static parseXml(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        // Get root element
        const root = xmlDoc.getElementsByTagName('InkCanvasStrokes')[0];
        if (!root) {
            throw new Error('Invalid XML format: Missing InkCanvasStrokes root element');
        }
        // Parse root attributes
        const version = root.getAttribute('Version') || '1.0';
        const strokeCount = parseInt(root.getAttribute('StrokeCount') || '0', 10);
        const saveTime = root.getAttribute('SaveTime') || '1970-01-01T00:00:00.000Z';
        // Parse strokes
        const strokes = [];
        const strokeElements = root.getElementsByTagName('Stroke');
        for (let i = 0; i < strokeElements.length; i++) {
            const strokeElement = strokeElements[i];
            const stroke = this.parseStroke(strokeElement);
            strokes.push(stroke);
        }
        return {
            version,
            strokeCount,
            saveTime,
            strokes
        };
    }
    /**
     * Parses a single Stroke element
     */
    static parseStroke(strokeElement) {
        // Parse drawing attributes
        const drawingAttributesStr = strokeElement.getAttribute('DrawingAttributes') || '';
        const drawingAttributes = this.parseDrawingAttributes(drawingAttributesStr);
        // Parse stylus points
        const stylusPoints = [];
        const stylusPointsElement = strokeElement.getElementsByTagName('StylusPoints')[0];
        if (stylusPointsElement) {
            const pointElements = stylusPointsElement.getElementsByTagName('StylusPoint');
            for (let i = 0; i < pointElements.length; i++) {
                const pointElement = pointElements[i];
                const point = this.parseStylusPoint(pointElement);
                stylusPoints.push(point);
            }
        }
        return {
            drawingAttributes,
            stylusPoints
        };
    }
    /**
     * Parses DrawingAttributes string into object
     */
    static parseDrawingAttributes(attributesStr) {
        const attributes = {};
        // Split by semicolon and parse key-value pairs
        const parts = attributesStr.split(';').filter(part => part.trim() !== '');
        for (const part of parts) {
            const [key, value] = part.split('=').map(item => item.trim());
            if (key && value) {
                attributes[key] = value;
            }
        }
        const validStylusTips = ['Ellipse', 'Circle', 'Rectangle', 'Square'];
        const stylusTipValue = attributes.StylusTip || 'Ellipse';
        const stylusTip = validStylusTips.includes(stylusTipValue)
            ? stylusTipValue
            : 'Ellipse';
        return {
            color: attributes.Color || '#FF000000',
            width: parseFloat(attributes.Width || '5'),
            height: parseFloat(attributes.Height || '5'),
            fitToCurve: attributes.FitToCurve === 'True',
            isHighlighter: attributes.IsHighlighter === 'True',
            ignorePressure: attributes.IgnorePressure === 'True',
            stylusTip
        };
    }
    /**
     * Parses a single StylusPoint element
     */
    static parseStylusPoint(pointElement) {
        return {
            x: parseFloat(pointElement.getAttribute('X') || '0'),
            y: parseFloat(pointElement.getAttribute('Y') || '0'),
            pressureFactor: parseFloat(pointElement.getAttribute('PressureFactor') || '0.5')
        };
    }
    /**
     * Generates XML string from InkCanvasStrokes object
     */
    static generateXml(inkData) {
        let xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
`;
        xml += `<InkCanvasStrokes Version="${inkData.version}" StrokeCount="${inkData.strokeCount}" SaveTime="${inkData.saveTime}">
`;
        for (const stroke of inkData.strokes) {
            xml += `  <Stroke DrawingAttributes="${this.serializeDrawingAttributes(stroke.drawingAttributes)}">
`;
            xml += `    <StylusPoints>
`;
            for (const point of stroke.stylusPoints) {
                xml += `      <StylusPoint X="${point.x}" Y="${point.y}" PressureFactor="${point.pressureFactor}" />
`;
            }
            xml += `    </StylusPoints>
`;
            xml += `  </Stroke>
`;
        }
        xml += `</InkCanvasStrokes>`;
        return xml;
    }
    /**
     * Serializes DrawingAttributes object to string format
     */
    static serializeDrawingAttributes(attributes) {
        const boolToString = (value) => value ? 'True' : 'False';
        return `Color=${attributes.color};Width=${attributes.width};Height=${attributes.height};FitToCurve=${boolToString(attributes.fitToCurve)};IsHighlighter=${boolToString(attributes.isHighlighter)};IgnorePressure=${boolToString(attributes.ignorePressure)};StylusTip=${attributes.stylusTip};`;
    }
    /**
     * Loads XML from a File object
     */
    static async loadFromFile(file) {
        const text = await file.text();
        return this.parseXml(text);
    }
}

