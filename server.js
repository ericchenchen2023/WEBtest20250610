const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();
app.use(cors());
app.use(express.json());

// CET-4+ 单词库（示例）
const cet4Words = new Set([
  'participants', 'multisport', 'autonomous',
  'maneuvering', 'challenging', 'contestants', 'rapids'
]);

// 抓取并处理网页内容
async function fetchPage(url) {
  console.log(`🔍 正在抓取页面: ${url}`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });

  const page = await browser.newPage();

  try {
    // 设置 User-Agent，模拟真实浏览器
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 访问目标 URL，延长超时时间为 120 秒
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 120000
    });

    // 模拟滚动到底部，触发 JS 动态加载内容
    await page.evaluate(() => {
      window.scrollBy(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(5000); // 等待内容加载完成

    // 尝试定位文章正文容器
    const content = await page.evaluate(() => {
      const container = document.querySelector('.article-content') ||
                         document.querySelector('.main_art') ||
                         document.querySelector('#Content') ||
                         document.querySelector('.content') ||
                         document.body;

      // 提取多种可能的段落标签（如 p、span、div）
      const paras = Array.from(container.querySelectorAll('p, span, div'))
                         .filter(el => el.offsetHeight > 0) // 过滤隐藏元素
                         .map(el => el.innerText.trim())
                         .filter(Boolean);

      // 提取图片链接
      const images = Array.from(container.querySelectorAll('img'))
                         .map(img => img.src)
                         .filter(src => src && src.startsWith('http'));

      return { paras, images };
    });

    console.log(`✅ 成功抓取到 ${content.paras.length} 段文字`);

    // 翻译段落（带超时机制）
    const translatedParas = [];
    for (let para of content.paras) {
      try {
        const zh = await require('translate-google')(para, { to: 'zh-cn' });
        translatedParas.push(zh);
      } catch (e) {
        console.error("❌ 翻译失败:", e.message);
        translatedParas.push("[翻译失败]");
      }
    }

    // 提取关键词
    const translations = content.paras.map((en, i) => ({
      en: en,
      zh: translatedParas[i],
      vocab: [...cet4Words].filter(word => en.toLowerCase().includes(word))
    }));

    return {
      translations,
      images: content.images,
      sourceUrl: url
    };

  } finally {
    await browser.close();
  }
}

// API 接口：POST /fetch
app.post('/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    console.warn("⚠️ 缺少 URL 参数");
    return res.status(400).json({ error: "缺少参数", message: "Missing URL" });
  }

  try {
    const data = await fetchPage(url);
    console.log(`📩 返回 ${data.translations.length} 条翻译结果`);
    res.json(data);
  } catch (err) {
    console.error("💥 抓取失败:", err.message);
    res.status(500).json({ error: "抓取失败", message: err.message });
  }
});

// 可选：添加欢迎页
app.get('/', (req, res) => {
  res.json({ message: "智能双语翻译工具 API 已启动！", usage: "POST /fetch" });
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 服务运行在端口 ${PORT}`);
});
