import { Application } from "pixi.js";
import { ICCXmlParser } from "./icc-xml-parser";
import { InkRenderer } from "./ink-renderer";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application with antialiasing enabled
  await app.init({
    background: "#ffffff",
    resizeTo: window,
    antialias: true, // Enable antialiasing to smooth edges
    resolution: window.devicePixelRatio // Support high-DPI screens
  });

  // Append the application canvas to the document body
  const container = document.getElementById("pixi-container");
  if (!container) {
    throw new Error('找不到 pixi-container 元素');
  }
  container.appendChild(app.canvas);

  // Create ink renderer
  const inkRenderer = new InkRenderer(app);

  // Create UI elements
  createUI(inkRenderer);

  // Render sample data initially
  inkRenderer.render(InkRenderer.createSampleData());
})();

/**
 * Creates UI elements for file upload and display
 */
function createUI(inkRenderer: InkRenderer): void {
  // Create container for UI
  const uiContainer = document.createElement("div");
  uiContainer.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    font-family: Arial, sans-serif;
    z-index: 100;
  `;

  // Create title
  const title = document.createElement("h3");
  title.textContent = "ICC-CE XML 墨迹查看器";
  title.style.margin = "0 0 10px 0";
  title.style.color = "#333";
  uiContainer.appendChild(title);

  // Create file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".xml";
  fileInput.style.marginBottom = "10px";
  uiContainer.appendChild(fileInput);

  // Create status text
  const status = document.createElement("div");
  status.textContent = "就绪：请选择 XML 文件";
  status.style.fontSize = "12px";
  status.style.color = "#666";
  status.style.marginBottom = "10px";
  uiContainer.appendChild(status);

  // Create load sample button
  const sampleBtn = document.createElement("button");
  sampleBtn.textContent = "加载示例数据";
  sampleBtn.style.cssText = `
    padding: 8px 12px;
    margin-right: 10px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  sampleBtn.onclick = () => {
    inkRenderer.render(InkRenderer.createSampleData());
    status.textContent = "已加载示例数据";
  };
  uiContainer.appendChild(sampleBtn);

  // Create clear button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "清除";
  clearBtn.style.cssText = `
    padding: 8px 12px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  `;
  clearBtn.onclick = () => {
    inkRenderer.clear();
    status.textContent = "已清除所有墨迹";
  };
  uiContainer.appendChild(clearBtn);

  // Add UI to document
  document.body.appendChild(uiContainer);

  // Handle file upload
  fileInput.addEventListener("change", async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        status.textContent = "正在加载 XML 文件...";
        const inkData = await ICCXmlParser.loadFromFile(file);
        inkRenderer.render(inkData);
        status.textContent = `已加载：${inkData.strokeCount} 条墨迹 (版本 ${inkData.version})`;
      } catch (error) {
        status.textContent = `错误：${error instanceof Error ? error.message : "未知错误"}`;
        console.error("Error loading XML:", error);
      }
    }
  });
}


