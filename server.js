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

async function fetchPage(url) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const content = await page.evaluate(() => {
    const paras = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(Boolean);
    const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
    return { paras, images };
  });

  await browser.close();

  // 翻译段落
  const translatedParas = [];
  for (let para of content.paras) {
    try {
      const zh = await require('translate-google')(para, { to: 'zh-cn' });
      translatedParas.push(zh);
    } catch (e) {
      translatedParas.push("[翻译失败]");
    }
  }

  // 提取关键词
  const translations = content.paras.map((en, i) => ({
    en,
    zh: translatedParas[i],
    vocab: [...cet4Words].filter(word => en.toLowerCase().includes(word))
  }));

  return {
    translations,
    images: content.images.filter(src => src.startsWith('http')),
    sourceUrl: url
  };
}

app.post('/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const data = await fetchPage(url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("抓取失败");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
