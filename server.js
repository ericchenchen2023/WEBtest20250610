const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

const app = express();

// ✅ 使用 CORS 并指定允许的源
app.use(cors({
  origin: "https://ericchenchen2023.github.io",  // 替换为你的 GitHub Pages 地址
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// CET-4+ 单词库
const cet4Words = new Set([
  'participants', 'multisport', 'autonomous',
  'maneuvering', 'challenging', 'contestants', 'rapids'
]);

async function fetchPage(url) {
  console.log(`🔍 正在抓取页面: ${url}`);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 120000
    });

    // 模拟滚动到底部，触发 JS 加载
    await page.evaluate(() => {
      window.scrollBy(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(5000);

    const content = await page.evaluate(() => {
      const container = document.querySelector('.article-content') ||
                         document.querySelector('.main_art') ||
                         document.querySelector('#Content') ||
                         document.body;

      const paras = Array.from(container.querySelectorAll('p, span'))
                         .filter(el => el.offsetHeight > 0)
                         .map(p => p.innerText.trim())
                         .filter(Boolean);

      const images = Array.from(container.querySelectorAll('img'))
                         .map(img => img.src)
                         .filter(src => src && src.startsWith('http'));

      return { paras, images };
    });

    console.log(`✅ 成功抓取到 ${content.paras.length} 段文字`);

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

    const translations = content.paras.map((en, i) => ({
      en,
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

app.get('/', (req, res) => {
  res.json({ message: "智能双语翻译工具 API 已启动！", usage: "POST /fetch" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 服务运行在端口 ${PORT}`);
});
