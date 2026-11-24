// Draws public/og-image.png (1200×630): the share picture of pages without their own (links on WhatsApp, Facebook, X).
// The site's own fonts and colours, the sheikh's name and the domain. Run again only to change it:
//   node scripts/make-og-image.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { root } from './site-data.mjs';

const font = (file) => `data:font/woff2;base64,${readFileSync(resolve(root, 'public/fonts', file)).toString('base64')}`;
const html = `<!doctype html><html lang="ar" dir="rtl"><head><style>
@font-face{font-family:Ruqaa;src:url(${font('aref-ruqaa-arabic-700-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:600;src:url(${font('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:CairoL;font-weight:600;src:url(${font('cairo-latin-600-normal.woff2')})}
html,body{margin:0;width:1200px;height:630px}
body{background:#faf6ee;display:flex;align-items:center;justify-content:center;font-family:Cairo}
.card{box-sizing:border-box;width:1120px;height:550px;border:3px solid #0f5c43;border-radius:28px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:18px;background:radial-gradient(circle at 50% 30%,#fffdf7,#f3ead6)}
h1{font-family:Ruqaa;font-size:150px;line-height:1.1;margin:0;color:#0f5c43}
p{margin:0;font-size:46px;color:#57534e}
.rule{width:220px;height:4px;background:#b8913a;border-radius:2px}
.url{font-family:CairoL;font-size:34px;color:#0f5c43;letter-spacing:1px;direction:ltr}
</style></head><body><div class="card"><h1>الشيخ أشرف مازن</h1><div class="rule"></div>
<p>دروس وخطب ومحاضرات علمية</p><div class="url">ashrafmazen.com</div></div></body></html>`;

const browser = await chromium.launch();
const pageTab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await pageTab.setContent(html);
await pageTab.evaluate(() => document.fonts.ready);
await pageTab.screenshot({ path: resolve(root, 'public/og-image.png') });
await browser.close();
console.log('public/og-image.png written');
