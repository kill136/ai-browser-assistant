# AI Browser Assistant

AI Browser Assistant 是一个智能的浏览器扩展，它可以帮助用户过滤广告内容，优化搜索结果排序，并提供上下文建议。

## 功能特点

- 🛡️ 智能广告拦截：使用 AI 技术识别和过滤广告内容
- 🔄 搜索结果重排序：根据相关性自动优化搜索结果的显示顺序
- 💡 上下文建议：提供智能的上下文相关建议
- ⚙️ 多 AI 提供商支持：支持 OpenAI、Claude、SiliconFlow 等多个 AI 服务提供商
- 🎯 实时分析：实时分析页面内容和搜索结果
- 🎨 简洁的用户界面：包含弹出窗口和浮动选项面板

## 安装

1. 克隆仓库：
bash
git clone https://github.com/yourusername/ai-browser-assistant.git

2. 安装依赖：
bash
npm install
3. 构建项目：
bash
npm run build

4. 在 Chrome 浏览器中加载扩展：
   - 打开 Chrome 扩展管理页面 (chrome://extensions/)
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 配置

1. 点击扩展图标，打开设置页面
2. 选择 AI 服务提供商（OpenAI、Claude、SiliconFlow 等）
3. 输入对应的 API 密钥
4. 选择要使用的 AI 模型
5. 保存设置

## 开发

- 开发模式（支持热重载）：
bash
npm run dev
- 构建生产版本
bash
npm run buil
- 运行测试：
bash
npm test
- 代码检查：
bash
npm run lint

## 技术栈

- JavaScript/ES6+
- Chrome Extensions API
- Webpack
- AI APIs (OpenAI, Claude, SiliconFlow)
- CSS3

## 项目结构
ai-browser-assistant/
├── src/
│ ├── background/ # 后台脚本
│ ├── content/ # 内容脚本
│ ├── popup/ # 弹出窗口
│ ├── options/ # 选项页面
│ ├── utils/ # 工具函数
│ └── manifest.json # 扩展配置文件
├── dist/ # 构建输出目录
├── tests/ # 测试文件
└── webpack.config.js # Webpack 配置

## 贡献

欢迎提交 Pull Request 或创建 Issue！

## 许可证

本项目采用 GNU General Public License v3 (GPLv3) 许可证，并附加以下限制：

1. 禁止商业使用：
   - 未经版权所有者明确书面许可，不得将本软件用于商业目的
   - 这包括但不限于销售本软件或将其集成到商业产品中

2. 强制开源要求：
   - 任何基于本项目的衍生作品必须以相同的许可条款开源
   - 必须提供完整的源代码

3. 署名要求：
   - 必须保留原始项目的署名信息
   - 必须明确说明对原始代码的修改

详细条款请查看 [LICENSE](LICENSE) 文件。

### 使用限制

- ❌ 不得用于商业目的
- ✅ 可以私人使用
- ✅ 可以修改源代码
- ✅ 可以分发源代码
- ❗ 修改后的代码必须开源
- ❗ 必须保留版权信息

如果您需要将本项目用于商业目的，请联系版权所有者获取书面授权。