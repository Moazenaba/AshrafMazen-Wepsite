// Draws the site icons from the logo mark (orange dome + «منها», scripts/assets/logo.png) on a white rounded square:
//   public/favicon.ico (48×48, PNG inside), public/favicon-48.png, favicon-96.png, favicon-192.png, favicon-512.png,
//   public/apple-touch-icon.png (180×180).
// The words «منهاج أهل السنة» under the mark are left out: unreadable at tab size.
// Google shows a favicon next to the site in results only from a raster icon it can fetch (a multiple of 48 px).
//   node scripts/make-icons.mjs        (npm run icons)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { root } from './site-data.mjs';

const logo = `data:image/png;base64,${readFileSync(resolve(root, 'scripts/assets/logo.png')).toString('base64')}`;
const MARK_BOTTOM = 0.7; // fraction of the logo height: the mark ends above the line and the words

const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.setContent('<!doctype html><html><body style="margin:0;background:transparent"></body></html>');

// Runs in the page: finds the mark (orange pixels) and draws it centred on a white (rounded) square.
const paint = async ({ src, size, rounded, markBottom }) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const work = document.createElement('canvas');
  work.width = img.width;
  work.height = img.height;
  const w = work.getContext('2d');
  w.drawImage(img, 0, 0);
  const data = w.getImageData(0, 0, img.width, img.height).data;
  let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0;
  const maxY = Math.floor(img.height * markBottom);
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      if (data[i] - data[i + 2] > 60) { // orange: much more red than blue
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  // Mark only, background made transparent (alpha from how far the pixel is from the light grey).
  const mw = x1 - x0 + 1, mh = y1 - y0 + 1;
  const mark = document.createElement('canvas');
  mark.width = mw;
  mark.height = mh;
  const m = mark.getContext('2d');
  const part = w.getImageData(x0, y0, mw, mh);
  const bg = 246, orange = [255, 140, 66];
  for (let i = 0; i < part.data.length; i += 4) {
    const a = Math.max(0, Math.min(1, (bg - part.data[i + 2]) / (bg - orange[2])));
    part.data[i] = orange[0]; part.data[i + 1] = orange[1]; part.data[i + 2] = orange[2];
    part.data[i + 3] = Math.round(a * 255);
  }
  m.putImageData(part, 0, 0);

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const o = out.getContext('2d');
  o.fillStyle = '#ffffff';
  o.beginPath();
  o.roundRect(0, 0, size, size, rounded ? size * 0.22 : 0);
  o.fill();
  const box = size * 0.84;
  const scale = Math.min(box / mw, box / mh);
  const dw = mw * scale, dh = mh * scale;
  o.imageSmoothingQuality = 'high';
  o.drawImage(mark, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return out.toDataURL('image/png').split(',')[1];
};
const draw = async (size, rounded = true) =>
  Buffer.from(await tab.evaluate(paint, { src: logo, size, rounded, markBottom: MARK_BOTTOM }), 'base64');

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
