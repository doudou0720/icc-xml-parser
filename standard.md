# ICC-CE XML 导出格式知识库

## 1. 概述

ICC-CE（Ink Canvas for Class）支持将墨迹以XML格式导出，便于数据交换和二次开发。XML导出格式采用结构化设计，包含墨迹的所有关键信息，包括触笔点坐标、压力值、颜色、宽度等属性。

### 1.1 支持的导出模式

- **单页XML导出**：将当前页面的墨迹保存为单个XML文件
- **多页XML压缩包导出**：将多个页面的墨迹保存为ZIP压缩包，每个页面对应一个XML文件

## 2. 单页XML文档结构

```xml
<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<InkCanvasStrokes Version="1.0" StrokeCount="1" SaveTime="2023-05-20 14:30:45">
  <Stroke DrawingAttributes="Color=#FF000000;Width=5;Height=5;FitToCurve=False;IsHighlighter=False;IgnorePressure=False;StylusTip=Ellipse;">
    <StylusPoints>
      <StylusPoint X="100" Y="200" PressureFactor="0.5" />
      <StylusPoint X="110" Y="210" PressureFactor="0.6" />
      <StylusPoint X="120" Y="220" PressureFactor="0.7" />
      <!-- 更多触笔点 -->
    </StylusPoints>
  </Stroke>
  <!-- 更多墨迹 -->
</InkCanvasStrokes>
```

## 3. 元素和属性说明

### 3.1 InkCanvasStrokes（根元素）

| 属性名 | 类型 | 描述 |
|--------|------|------|
| Version | 字符串 | XML格式版本号，当前为"1.0" |
| StrokeCount | 整数 | 墨迹数量 |
| SaveTime | 字符串 | 保存时间，格式为"yyyy-MM-dd HH:mm:ss" |

### 3.2 Stroke（墨迹元素）

| 属性名 | 类型 | 描述 |
|--------|------|------|
| DrawingAttributes | 字符串 | 墨迹属性，包含颜色、宽度、高度等信息（详见3.4节） |

### 3.3 StylusPoints（触笔点集合）

包含多个StylusPoint元素，每个元素代表一个触笔点。

### 3.4 StylusPoint（触笔点元素）

| 属性名 | 类型 | 描述 |
|--------|------|------|
| X | 浮点数 | 触笔点X坐标 |
| Y | 浮点数 | 触笔点Y坐标 |
| PressureFactor | 浮点数 | 压力因子，范围0.0-1.0 |

### 3.5 DrawingAttributes属性格式

DrawingAttributes属性采用分号分隔的键值对格式：

```
Color=#FF000000;Width=5;Height=5;FitToCurve=False;IsHighlighter=False;IgnorePressure=False;StylusTip=Ellipse;
```

| 键名 | 类型 | 描述 |
|------|------|------|
| Color | 字符串 | 墨迹颜色，采用ARGB格式（如#FF000000表示黑色） |
| Width | 浮点数 | 墨迹宽度 |
| Height | 浮点数 | 墨迹高度 |
| FitToCurve | 布尔值 | 是否使用曲线拟合 |
| IsHighlighter | 布尔值 | 是否为荧光笔效果 |
| IgnorePressure | 布尔值 | 是否忽略压力感应 |
| StylusTip | 字符串 | 笔尖形状（Ellipse/Circle/Rectangle/Square） |

## 4. 多页XML压缩包结构

当导出多页墨迹时，系统会创建一个ZIP压缩包，包含以下内容：

```
├── page_0001.xml      # 第1页墨迹XML文件
├── page_0002.xml      # 第2页墨迹XML文件
├── page_0003.xml      # 第3页墨迹XML文件
└── metadata.txt       # 元数据信息
```

### 4.1 metadata.txt格式

```
保存时间: 2023-05-20 14:30:45
总页数: 3
模式: 白板
格式: XML
当前页面: 1
总页面数: 3
页面 1: 10 条墨迹
页面 2: 5 条墨迹
页面 3: 8 条墨迹
```

## 5. 元素信息JSON文件

导出XML时，系统会同时创建一个`.elements.json`文件，用于存储画布上的元素信息（如图像）：

```json
[
  {
    "Type": "Image",
    "SourcePath": "C:\\Images\\example.png",
    "Left": 100,
    "Top": 200,
    "Width": 300,
    "Height": 200,
    "Stretch": "Fill"
  }
]
```

| 字段名 | 类型 | 描述 |
|--------|------|------|
| Type | 字符串 | 元素类型（当前仅支持"Image"） |
| SourcePath | 字符串 | 图像文件路径 |
| Left | 浮点数 | 元素左上角X坐标 |
| Top | 浮点数 | 元素左上角Y坐标 |
| Width | 浮点数 | 元素宽度 |
| Height | 浮点数 | 元素高度 |
| Stretch | 字符串 | 拉伸方式（Fill/Uniform/UniformToFill/None） |

## 6. XML解析和生成代码示例

### 6.1 保存墨迹为XML

```csharp
private void SaveStrokesAsXML(StrokeCollection strokes, string xmlPath)
{
    XDocument doc = new XDocument(
        new XDeclaration("1.0", "utf-8", "yes"),
        new XElement("InkCanvasStrokes",
            new XAttribute("Version", "1.0"),
            new XAttribute("StrokeCount", strokes.Count),
            new XAttribute("SaveTime", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")),
            from stroke in strokes
            select new XElement("Stroke",
                new XAttribute("DrawingAttributes", SerializeDrawingAttributes(stroke.DrawingAttributes)),
                new XElement("StylusPoints",
                    from point in stroke.StylusPoints
                    select new XElement("StylusPoint",
                        new XAttribute("X", point.X),
                        new XAttribute("Y", point.Y),
                        new XAttribute("PressureFactor", point.PressureFactor)
                    )
                )
            )
        )
    );
    
    using (var writer = new XmlTextWriter(xmlPath, Encoding.UTF8))
    {
        writer.Formatting = Formatting.Indented;
        doc.Save(writer);
    }
}

private string SerializeDrawingAttributes(DrawingAttributes da)
{
    var sb = new StringBuilder();
    sb.Append($"Color={da.Color};");
    sb.Append($"Width={da.Width};");
    sb.Append($"Height={da.Height};");
    sb.Append($"FitToCurve={da.FitToCurve};");
    sb.Append($"IsHighlighter={da.IsHighlighter};");
    sb.Append($"IgnorePressure={da.IgnorePressure};");
    sb.Append($"StylusTip={da.StylusTip};");
    return sb.ToString();
}
```

### 6.2 从XML加载墨迹

```csharp
public void OpenXMLStrokeFile(string filePath)
{
    XDocument doc = XDocument.Load(filePath);
    var root = doc.Root;
    if (root == null || root.Name != "InkCanvasStrokes")
    {
        throw new Exception("无效的XML墨迹文件格式");
    }

    var strokes = new StrokeCollection();
    foreach (var strokeElement in root.Elements("Stroke"))
    {
        var drawingAttributesStr = strokeElement.Attribute("DrawingAttributes")?.Value ?? "";
        var da = ParseDrawingAttributes(drawingAttributesStr);

        var stylusPoints = new StylusPointCollection();
        var stylusPointsElement = strokeElement.Element("StylusPoints");
        if (stylusPointsElement != null)
        {
            foreach (var pointElement in stylusPointsElement.Elements("StylusPoint"))
            {
                double x = double.Parse(pointElement.Attribute("X")?.Value ?? "0");
                double y = double.Parse(pointElement.Attribute("Y")?.Value ?? "0");
                float pressure = float.Parse(pointElement.Attribute("PressureFactor")?.Value ?? "0.5");
                stylusPoints.Add(new StylusPoint(x, y, pressure));
            }
        }

        if (stylusPoints.Count > 0)
        {
            var stroke = new Stroke(stylusPoints) { DrawingAttributes = da };
            strokes.Add(stroke);
        }
    }
    
    // 使用加载的墨迹
    inkCanvas.Strokes.Add(strokes);
}

private DrawingAttributes ParseDrawingAttributes(string attributesStr)
{
    var da = new DrawingAttributes();
    var parts = attributesStr.Split(';');
    foreach (var part in parts)
    {
        var kv = part.Split('=');
        if (kv.Length == 2)
        {
            var key = kv[0].Trim();
            var value = kv[1].Trim();
            switch (key)
            {
                case "Color":
                    da.Color = (Color)ColorConverter.ConvertFromString(value);
                    break;
                case "Width":
                    da.Width = double.Parse(value);
                    break;
                case "Height":
                    da.Height = double.Parse(value);
                    break;
                case "FitToCurve":
                    da.FitToCurve = bool.Parse(value);
                    break;
                case "IsHighlighter":
                    da.IsHighlighter = bool.Parse(value);
                    break;
                case "IgnorePressure":
                    da.IgnorePressure = bool.Parse(value);
                    break;
                case "StylusTip":
                    da.StylusTip = (StylusTip)Enum.Parse(typeof(StylusTip), value);
                    break;
            }
        }
    }
    return da;
}
```

## 7. 最佳实践

1. **文件命名**：单页XML文件通常使用`.xml`扩展名，多页压缩包使用`.zip`扩展名
2. **编码格式**：使用UTF-8编码以支持国际化
3. **版本控制**：保留Version属性以支持未来格式升级
4. **数据验证**：加载XML时进行格式验证，确保数据完整性
5. **性能优化**：处理大量墨迹时考虑分页或流式处理

## 8. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0 | 2023-05-01 | 初始版本，支持基本墨迹属性和触笔点数据 |

## 9. 相关功能

- **自动保存**：支持将墨迹自动保存为XML格式
- **Dlass上传**：支持将XML文件上传到Dlass云服务
- **多格式支持**：除XML外，还支持ICSTK（二进制）和图像格式
- **插件扩展**：通过插件可以扩展导出格式和功能

---

**作者**：ICC-CE开发团队  
**最后更新**：2023-05-20