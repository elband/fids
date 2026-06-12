import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://fids.test:8080';
const OUT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  // Public display screens (no login)
  { name: '01-welcome',          url: '/',                              width: 1920, height: 1080 },
  { name: '02-departure-display',url: '/public/flight/departure',       width: 1920, height: 1080 },
  { name: '03-arrival-display',  url: '/public/flight/arrival',         width: 1920, height: 1080 },
  { name: '04-checkin-display',  url: '/public/gate/checkin',           width: 1920, height: 1080 },
  { name: '05-gate-display',     url: '/public/gate/boarding',          width: 1920, height: 1080 },
  { name: '06-baggage-display',  url: '/public/gate/baggageclaim',      width: 1920, height: 1080 },
  { name: '07-worldclock',       url: '/public/world-clock',            width: 1920, height: 1080 },
  { name: '08-ads-display',      url: '/public/advertisement',          width: 1920, height: 1080 },
  { name: '09-public-screen',    url: '/public/screen',                 width: 1920, height: 1080 },
  // Auth
  { name: '10-login',            url: '/login',                         width: 1440, height: 900  },
];

const ADMIN_PAGES = [
  { name: '11-admin-dashboard',  url: '/admin/dashboard',               width: 1440, height: 900  },
  { name: '12-admin-flights',    url: '/admin/daily-departures',         width: 1440, height: 900  },
  { name: '13-admin-arrivals',   url: '/admin/daily-arrivals',           width: 1440, height: 900  },
  { name: '14-admin-airlines',   url: '/admin/airlines',                 width: 1440, height: 900  },
  { name: '15-admin-gates',      url: '/admin/gates',                    width: 1440, height: 900  },
  { name: '16-admin-announcements',url:'/admin/public-announcements',    width: 1440, height: 900  },
  { name: '17-admin-ads',        url: '/admin/advertisements',           width: 1440, height: 900  },
  { name: '18-admin-reports',    url: '/admin/reports/departures',       width: 1440, height: 900  },
  { name: '19-admin-display-settings',url:'/admin/display-settings',    width: 1440, height: 900  },
  { name: '20-admin-ntp',        url: '/admin/ntp-settings',             width: 1440, height: 900  },
];

async function shot(page, name, url, width, height) {
  console.log(`📸 ${name} — ${url}`);
  await page.setViewport({ width, height });
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500)); // let React render
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`   ✅ saved → ${file}`);
}

async function login(page) {
  console.log('\n🔐 Logging in as admin...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2' });
  await page.type('input[name="email"]', 'admin@local.test');
  await page.type('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  console.log('   ✅ Logged in');
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--host-resolver-rules=MAP fids.test 127.0.0.1'],
  });

  const page = await browser.newPage();

  // Public pages
  console.log('\n=== PUBLIC PAGES ===');
  for (const p of PAGES) {
    try {
      await shot(page, p.name, p.url, p.width, p.height);
    } catch (e) {
      console.error(`   ❌ ${p.name}: ${e.message}`);
    }
  }

  // Login then admin pages
  console.log('\n=== ADMIN PAGES ===');
  try {
    await login(page);
    for (const p of ADMIN_PAGES) {
      try {
        await shot(page, p.name, p.url, p.width, p.height);
      } catch (e) {
        console.error(`   ❌ ${p.name}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('   ❌ Login failed:', e.message);
  }

  await browser.close();
  console.log('\n🎉 Done! Screenshots saved to:', OUT_DIR);
})();
