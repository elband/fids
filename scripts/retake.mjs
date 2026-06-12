import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://fids.test:8080';
const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

const RETAKE = [
  { name: '07-worldclock',  url: '/public/world-clock',  wait: 5000 },
  { name: '08-ads-display', url: '/public/advertisement', wait: 4000 },
  { name: '09-public-screen', url: '/public/screen',     wait: 5000 },
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors',
           '--host-resolver-rules=MAP fids.test 127.0.0.1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  for (const p of RETAKE) {
    console.log(`📸 Retaking: ${p.name}`);
    await page.goto(BASE_URL + p.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, p.wait));
    await page.screenshot({ path: path.join(OUT_DIR, `${p.name}.png`), fullPage: false });
    console.log(`   ✅ done`);
  }

  await browser.close();
  console.log('Done!');
})();
