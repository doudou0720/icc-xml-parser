import IccXmlViewer from './IccXmlViewer.vue';
import type { App } from 'vue';

// 组件安装函数
export const IccXmlViewerPlugin = {
  install(app: App) {
    app.component('IccXmlViewer', IccXmlViewer);
  }
};

// 导出组件
export { IccXmlViewer };

export default IccXmlViewer;