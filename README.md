# Rayn AI Product Portfolio

公开脱敏、可离线运行的 AI 产品作品集。作品集只提供项目索引与说明层，四个项目页直接嵌入原项目的前端产物：LLM Wiki、金融数据 Skill 评测、用户反馈归因 Dashboard 与 FinClaw 网页预览。

```bash
npm install
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

可替换的个人信息与案例文案位于 `src/data/content.ts`。静态演示文件位于 `public/demos`：原页面结构、样式和操作路径保持不变；仅对原本需要服务端的数据请求提供本地脱敏静态数据，不调用模型、金融数据、微信生态或任何后端接口。

`demo-src` 保存可重新构建的公开演示副本，原始项目目录不会被修改。`public/demos/web-forge/index.html` 是完整的单文件网页预览产物。

## GitHub Pages

项目使用 Hash 路由与相对静态资源路径，支持发布至 GitHub Pages 的仓库子路径。推送到 `main` 分支后，`.github/workflows/deploy-pages.yml` 会构建 `dist` 并发布网站；在仓库的 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。
