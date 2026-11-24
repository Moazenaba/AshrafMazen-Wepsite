// Draws the site icons from one design (green rounded square, gold «أ» in the site's Amiri font):
//   public/favicon.ico (48×48, PNG inside), public/favicon-48.png, favicon-96.png, favicon-192.png, favicon-512.png,
//   public/apple-touch-icon.png (180×180).
// Google shows a favicon next to the site in results only from a raster icon it can fetch (a multiple of 48 px);
// the old favicon.svg drew the letter as <text> in "serif", which has no Arabic glyph on many renderers.
//   node scripts/make-icons.mjs        (npm run icons)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { root } from './site-data.mjs';

const font = `data:font/woff2;base64,${readFileSync(resolve(root, 'public/fonts/amiri-arabic-700-normal.woff2')).toString('base64')}`;
const html = (size, rounded) => `<!doctype html><html><head><style>
@font-face{font-family:Amiri;font-weight:700;src:url(${font})}
html,body{margin:0;width:${size}px;height:${size}px;background:transparent}
div{width:${size}px;height:${size}px;border-radius:${rounded ? size * 0.22 : 0}px;background:#0f5c43;display:flex;align-items:center;
  justify-content:center;font-family:Amiri;font-weight:700;color:#e6c36a;font-size:${size * 0.62}px;line-height:1;box-sizing:border-box}
span{display:block;transform:translateY(${size * 0.1}px)}
</style></head><body><div><span>أ</span></div></body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage();
const draw = async (size, rounded = true) => {
  await tab.setViewportSize({ width: size, height: size });
  await tab.setContent(html(size, rounded));
  await tab.evaluate(() => document.fonts.ready);
  return tab.screenshot({ omitBackground: true });
};

const out = (name, buf) => writeFileSync(resolve(root, 'public', name), buf);
for (const size of [48, 96, 192, 512]) out(`favicon-${size}.png`, await draw(size));
out('apple-touch-icon.png', await draw(180, false)); // iOS rounds the corners itself

// favicon.ico = a 6-byte header + one 16-byte directory entry + the 48×48 PNG
const png = await draw(48);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0);
head.writeUInt16LE(1, 2); // icon
head.writeUInt16LE(1, 4); // one image
head.writeUInt8(48, 6);
head.writeUInt8(48, 7);
head.writeUInt16LE(1, 10); // planes
head.writeUInt16LE(32, 12); // bits per pixel
head.writeUInt32LE(png.length, 14);
head.writeUInt32LE(22, 18);
out('favicon.ico', Buffer.concat([head, png]));

await browser.close();
console.log('icons written to public/');
