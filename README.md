# 智能双语翻译与词汇学习工具

## 📦 项目说明

本项目是一个基于 Node.js 的网页应用，支持输入 chinadaily 新闻链接并自动生成中英文对照翻译、CET-4+ 单词表、图文展示和语音朗读功能。

## 🧰 技术栈

- Node.js + Express
- Puppeteer（网页抓取）
- Google Translate API（翻译）
- HTMLCSSJS 前端
- 支持部署到 Render  Railway  Heroku

## 🚀 部署步骤（以 Render 为例）

1. 创建 GitHub 仓库并上传本项目的全部文件；
2. 登录 [Render](httpsdashboard.render.com)； 
3. 点击 “New Web Service”；
4. 连接你的 GitHub 仓库；
5. 设置以下参数：
   - Branch `main`
   - Root Directory ``
   - Build Command `npm install`
   - Start Command `npm start`
6. 点击 “Deploy”，等待构建完成；
7. 访问你获得的公网 URL 即可使用！

## ✅ 功能一览

- 输入 chinadaily 文章链接；
- 自动生成中英文对照翻译；
- 提取 CET-4+ 单词并标注音标；
- 支持点击播放英文或中文段落语音；
- 展示原文图片；
- 提供跳转查看原文按钮；

## 📝 注意事项

- Puppeteer 在云端部署时需要加上 `--no-sandbox` 参数；
- 如果翻译失败，请检查网络或尝试更换翻译服务（如接入 DeepL）；
- 本项目默认使用模拟数据作为测试，实际部署后会自动抓取真实网页内容。

## 💡 进阶建议

- 添加用户历史记录功能；
- 支持导出 PDF；
- 实现单词点击查词典；
- 增加多语言支持；
- 使用数据库保存常用文章。

Enjoy your bilingual learning journey!