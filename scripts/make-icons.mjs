// Rasterises icons/icon.svg into the PNG sizes Chrome wants, using Playwright's Chromium.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../icons');
const svg = await readFile(path.join(dir, 'icon.svg'), 'utf8');
const browser = await chromium.launch();
for (const size of [16, 32, 48, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // The Web Store wants the 128px icon as 96px artwork with 16px of transparent padding.
  const art = size === 128 ? 96 : size;
  const pad = (size - art) / 2;
  await page.setContent(`<style>*{margin:0}html{background:transparent}svg{display:block;width:${art}px;height:${art}px;padding:${pad}px}</style>${svg}`);
  await page.screenshot({ path: path.join(dir, `icon-${size}.png`), omitBackground: true });
  await page.close();
}
await browser.close();
console.log('icons written');
