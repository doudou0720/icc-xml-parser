// @icc-xml-parser/core public API

// Export types
export type {
  StylusTip,
  StretchMode,
  DrawingAttributes,
  StylusPoint,
  Stroke,
  InkCanvasStrokes,
  CanvasElement,
  Metadata
} from './icc-xml-types';

// Export core classes
export { ICCXmlParser } from './icc-xml-parser';
export { InkRenderer } from './ink-renderer';

// Export utility functions
export { InkRenderer as createSampleData } from './ink-renderer';
