# 贡献指南

欢迎您参与 icc-xml-parser 项目的开发！为了保持代码质量和协作效率，我们制定了以下贡献规范，请您在提交代码或创建 PR 前仔细阅读。

## 开发环境设置

1. **克隆仓库**
   ```bash
   git clone https://github.com/doudou0720/icc-xml-parser.git
   cd icc-xml-parser
   ```

2. **安装依赖**
   我们使用 pnpm 管理依赖，请确保您已安装 pnpm：
   ```bash
   pnpm install
   ```

3. **运行开发服务器**
   ```bash
   pnpm dev
   ```

## 提交规范

所有提交信息必须严格遵循 [约定式提交规范](https://www.conventionalcommits.org/zh-hans/v1.0.0/)。

### 提交格式

```text
<类型>[可选 范围]: <描述>

[可选 正文]

[可选 脚注]
```

### 提交类型

- **feat**: 新增功能（对应语义化版本的 MINOR）
- **fix**: 修复 bug（对应语义化版本的 PATCH）
- **BREAKING CHANGE**: 引入破坏性变更（对应语义化版本的 MAJOR）
- **build**: 修改构建系统或外部依赖
- **chore**: 非业务性代码修改（如构建流程、工具配置等）
- **ci**: 修改持续集成流程
- **docs**: 修改文档
- **style**: 代码样式调整（不影响功能）
- **refactor**: 代码重构（不修改功能逻辑）
- **perf**: 性能优化
- **test**: 修改测试用例

### 示例

```text
feat(parser): 添加支持解析嵌套数组的功能

fix(renderer): 修复渲染时的内存泄漏问题

chore!: 移除对 Node.js 14 的支持

BREAKING CHANGE: 最低支持版本提升至 Node.js 16
```

## GPG 签名要求

为了确保提交的真实性和完整性，**所有提交和 PR 必须使用 GPG 签名**，否则你的贡献可能会被拒绝，_特殊原因除外_。

### 验证签名

提交后可以使用以下命令验证签名：
```bash
git log --show-signature -1
```

## 代码审查和 PR 流程

1. **创建分支**
   从 `main` 分支创建新的功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发和提交**
   - 编写代码，确保通过所有测试
   - 按照提交规范提交代码
   - 确保所有提交都有 GPG 签名

3. **创建 PR**
   - 推送到远程仓库：`git push origin <feature type>/<your-feature-name>`
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 描述，说明变更内容和目的

4. **代码审查**
   - 项目维护者会进行代码审查
   - 根据反馈进行修改
   - 确保所有测试通过

5. **合并 PR**
   审查通过后，PR 将被合并到 `dev` 分支，并于一定时期由维护者合并到 `main` 分支

## 其他贡献方式

- 报告 bug
- ~~提出新功能建议~~等我先把基础功能做完
- ~~改进文档~~还没有
- 参与社区讨论

## 行为准则

请遵守项目的行为准则，保持友好、尊重的沟通方式，否则你可能会临时或永久被阻止向项目提出任何意见。

---

感谢您的贡献！