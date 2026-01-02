# @icc-xml-parser/core

## 概述

@icc-xml-parser/core 是 ICC-CE XML 导出格式的核心解析和渲染库。它提供了完整的 XML 解析功能和基于 PixiJS 的墨迹渲染能力，不依赖任何前端框架，保持纯功能模块特性。

## 功能特性

- ✅ ICC-CE XML 格式解析
- ✅ XML 生成功能
- ✅ 基于 PixiJS 的墨迹渲染
- ✅ 支持多种墨迹属性（颜色、宽度、压力等）
- ✅ 支持曲线拟合
- ✅ 类型安全的 TypeScript API

## 安装

```bash
npm install @icc-xml-parser/core pixi.js
```

## 核心 API

### 类型定义

```typescript
// 笔尖形状
export type StylusTip = "Ellipse" | "Circle" | "Rectangle" | "Square";

// 绘图属性
export interface DrawingAttributes {
  color: string; // ARGB格式，如 #FF000000
  width: number; // 线条宽度
  height: number; // 线条高度
  fitToCurve: boolean; // 是否使用曲线拟合
  isHighlighter: boolean; // 是否为荧光笔效果
  ignorePressure: boolean; // 是否忽略压力
  stylusTip: StylusTip; // 笔尖形状
}

// 触笔点
export interface StylusPoint {
  x: number; // X坐标
  y: number; // Y坐标
  pressureFactor: number; // 压力因子（0.0-1.0）
}

// 墨迹笔画
export interface Stroke {
  drawingAttributes: DrawingAttributes;
  stylusPoints: StylusPoint[];
}

// 墨迹画布数据
export interface InkCanvasStrokes {
  version: string; // 版本号
  strokeCount: number; // 笔画数量
  saveTime: string; // 保存时间
  strokes: Stroke[]; // 笔画数组
}
```

### ICCXmlParser 类

#### parseXml(xmlString: string): InkCanvasStrokes
将 XML 字符串解析为 InkCanvasStrokes 对象。

```typescript
import { ICCXmlParser } from '@icc-xml-parser/core';

const xmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<InkCanvasStrokes Version="1.0" StrokeCount="1" SaveTime="2023-05-20 14:30:45">
  <Stroke DrawingAttributes="Color=#FFFF0000;Width=5;Height=5;FitToCurve=True;IsHighlighter=False;IgnorePressure=False;StylusTip=Ellipse;">
    <StylusPoints>
      <StylusPoint X="100" Y="100" PressureFactor="0.5" />
      <StylusPoint X="200" Y="200" PressureFactor="0.8" />
    </StylusPoints>
  </Stroke>
</InkCanvasStrokes>`;

const inkData = ICCXmlParser.parseXml(xmlString);
console.log(inkData);
```

#### generateXml(inkData: InkCanvasStrokes): string
将 InkCanvasStrokes 对象生成 XML 字符串。

```typescript
import { ICCXmlParser, InkCanvasStrokes } from '@icc-xml-parser/core';

const inkData: InkCanvasStrokes = {
  version: "1.0",
  strokeCount: 1,
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
        stylusTip: "Ellipse"
      },
      stylusPoints: [
        { x: 100, y: 100, pressureFactor: 0.5 },
        { x: 200, y: 200, pressureFactor: 0.8 }
      ]
    }
  ]
};

const xmlString = ICCXmlParser.generateXml(inkData);
console.log(xmlString);
```

#### loadFromFile(file: File): Promise<InkCanvasStrokes>
从 File 对象加载并解析 XML 文件。

```typescript
import { ICCXmlParser } from '@icc-xml-parser/core';

const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) {
    const inkData = await ICCXmlParser.loadFromFile(file);
    console.log(inkData);
  }
});
```

### InkRenderer 类

#### constructor(app: Application)
创建一个新的 InkRenderer 实例。

#### render(inkData: InkCanvasStrokes): void
渲染墨迹数据到 PixiJS 应用。

#### clear(): void
清除所有渲染的墨迹。

#### static createSampleData(): InkCanvasStrokes
创建示例墨迹数据用于测试。

```typescript
import { Application } from 'pixi.js';
import { InkRenderer } from '@icc-xml-parser/core';

// 创建 Pixi 应用
const app = new Application();
await app.init({ width: 800, height: 600, background: '#ffffff' });
document.body.appendChild(app.canvas);

// 创建墨迹渲染器
const inkRenderer = new InkRenderer(app);

// 渲染示例数据
inkRenderer.render(InkRenderer.createSampleData());
```

## 使用示例

### 完整示例

```typescript
import { Application } from 'pixi.js';
import { ICCXmlParser, InkRenderer } from '@icc-xml-parser/core';

// 创建 Pixi 应用
const app = new Application();
await app.init({ width: 800, height: 600, background: '#ffffff' });
document.body.appendChild(app.canvas);

// 创建墨迹渲染器
const inkRenderer = new InkRenderer(app);

// 从 XML 字符串解析墨迹数据
const xmlString = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<InkCanvasStrokes Version="1.0" StrokeCount="1" SaveTime="2023-05-20 14:30:45">
  <Stroke DrawingAttributes="Color=#FFFF0000;Width=5;Height=5;FitToCurve=True;IsHighlighter=False;IgnorePressure=False;StylusTip=Ellipse;">
    <StylusPoints>
      <StylusPoint X="100" Y="100" PressureFactor="0.5" />
      <StylusPoint X="150" Y="120" PressureFactor="0.6" />
      <StylusPoint X="200" Y="100" PressureFactor="0.7" />
    </StylusPoints>
  </Stroke>
</InkCanvasStrokes>`;

const inkData = ICCXmlParser.parseXml(xmlString);

// 渲染墨迹
inkRenderer.render(inkData);
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT
