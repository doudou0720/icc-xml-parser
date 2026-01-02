# @icc-xml-parser/vue-component

## 概述

@icc-xml-parser/vue-component 是基于 @icc-xml-parser/core 构建的 Vue 3 组件，用于在 Vue 应用中轻松集成 ICC-CE XML 墨迹查看功能。该组件提供了完整的墨迹渲染、文件上传和示例数据加载功能，支持灵活的参数配置。

## 功能特性

- ✅ Vue 3 组件
- ✅ 支持文件上传
- ✅ 内置示例数据
- ✅ 可配置的组件属性
- ✅ 清晰的事件机制
- ✅ 类型安全的 TypeScript API
- ✅ 响应式设计

## 安装

```bash
npm install @icc-xml-parser/vue-component vue @icc-xml-parser/core pixi.js
```

## 组件 API

### Props

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| modelValue | string  InkCanvasStrokes | undefined | 传入的 XML 字符串或解析后的墨迹数据 |
| width | number  string | "100%" | 组件宽度 |
| height | number  string | "600px" | 组件高度 |
| backgroundColor | string | "#ffffff" | 画布背景颜色 |

### Emits

| 事件名 | 参数 | 描述 |
|--------|------|------|
| update:modelValue | InkCanvasStrokes | 当墨迹数据加载或更新时触发 |
| load | InkCanvasStrokes | 当墨迹数据成功加载时触发 |
| error | Error | 当发生错误时触发 |

## 使用示例

### 基本使用

```vue
<template>
  <div>
    <h1>ICC-CE XML 墨迹查看器</h1>
    <IccXmlViewer />
  </div>
</template>

<script setup lang="ts">
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
</script>
```

### 自定义尺寸和背景色

```vue
<template>
  <div>
    <IccXmlViewer
      width="800px"
      height="500px"
      backgroundColor="#f5f5f5"
    />
  </div>
</template>

<script setup lang="ts">
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
</script>
```

### 使用 v-model 绑定数据

```vue
<template>
  <div>
    <IccXmlViewer v-model="inkData" />
    <div v-if="inkData">
      <h3>已加载的墨迹数据</h3>
      <p>版本：{{ inkData.version }}</p>
      <p>笔画数量：{{ inkData.strokeCount }}</p>
      <p>保存时间：{{ inkData.saveTime }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
import type { InkCanvasStrokes } from '@icc-xml-parser/core';

const inkData = ref<InkCanvasStrokes | undefined>(undefined);
</script>
```

### 监听事件

```vue
<template>
  <div>
    <IccXmlViewer
      @load="handleLoad"
      @error="handleError"
    />
    <div class="status">{{ status }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
import type { InkCanvasStrokes } from '@icc-xml-parser/core';

const status = ref<string>('就绪');

const handleLoad = (data: InkCanvasStrokes) => {
  status.value = `成功加载 ${data.strokeCount} 条笔画`;
};

const handleError = (error: Error) => {
  status.value = `错误：${error.message}`;
};
</script>

<style scoped>
.status {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}
</style>
```

### 传入预解析的数据

```vue
<template>
  <div>
    <IccXmlViewer :modelValue="preloadedData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
import { ICCXmlParser } from '@icc-xml-parser/core';
import type { InkCanvasStrokes } from '@icc-xml-parser/core';

const preloadedData = ref<InkCanvasStrokes | undefined>(undefined);

onMounted(async () => {
  // 从服务器或本地存储获取 XML 字符串
  const xmlString = await fetchXmlData();
  // 解析 XML 数据
  preloadedData.value = ICCXmlParser.parseXml(xmlString);
});

async function fetchXmlData(): Promise<string> {
  // 模拟从服务器获取 XML 数据
  return `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<InkCanvasStrokes Version="1.0" StrokeCount="1" SaveTime="2023-05-20 14:30:45">
  <Stroke DrawingAttributes="Color=#FFFF0000;Width=5;Height=5;FitToCurve=True;IsHighlighter=False;IgnorePressure=False;StylusTip=Ellipse;">
    <StylusPoints>
      <StylusPoint X="100" Y="100" PressureFactor="0.5" />
      <StylusPoint X="200" Y="200" PressureFactor="0.8" />
    </StylusPoints>
  </Stroke>
</InkCanvasStrokes>`;
}
</script>
```

### 使用自定义 UI

```vue
<template>
  <div>
    <h1>自定义 ICC-CE XML 查看器</h1>
    
    <!-- 自定义 UI -->
    <div class="custom-ui">
      <input type="file" accept=".xml" @change="handleFileUpload" />
      <button @click="loadSample">加载示例</button>
      <button @click="clear">清除</button>
    </div>
    
    <!-- 使用插槽覆盖默认 UI -->
    <IccXmlViewer :modelValue="inkData">
      <!-- 这里可以放置自定义内容，组件内部不会显示默认 UI -->
    </IccXmlViewer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
import { ICCXmlParser, InkRenderer } from '@icc-xml-parser/core';
import type { InkCanvasStrokes } from '@icc-xml-parser/core';

const inkData = ref<InkCanvasStrokes | undefined>(undefined);

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const text = await file.text();
    inkData.value = ICCXmlParser.parseXml(text);
  }
};

const loadSample = () => {
  inkData.value = InkRenderer.createSampleData();
};

const clear = () => {
  inkData.value = undefined;
};
</script>

<style scoped>
.custom-ui {
  margin-bottom: 20px;
}

.custom-ui input[type="file"] {
  margin-right: 10px;
}

.custom-ui button {
  margin-right: 10px;
  padding: 8px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## 组件注册

### 局部注册

```vue
<template>
  <IccXmlViewer />
</template>

<script setup lang="ts">
import { IccXmlViewer } from '@icc-xml-parser/vue-component';
</script>
```

### 全局注册

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { IccXmlViewerPlugin } from '@icc-xml-parser/vue-component';

const app = createApp(App);
app.use(IccXmlViewerPlugin);
app.mount('#app');
```

然后在任何组件中都可以直接使用：

```vue
<template>
  <IccXmlViewer />
</template>
```

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT
