/**
 * Chrome Web Store listing images, written to docs/store. Run with `npm run store-assets`.
 * Screenshots are 1280x800 and promo tiles 440x280 / 1400x560, all saved without an alpha channel.
 */
import { chromium, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { chatUrl, launch, ui } from '../e2e/harness';
import { CHATS } from '../fixtures/sites';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../docs/store');
mkdirSync(out, { recursive: true });
const kyoto = CHATS.kyoto!.turns;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function save(page: Page, name: string) {
  const png = PNG.sync.read(await page.screenshot({ type: 'png' }));
  writeFileSync(path.join(out, name), PNG.sync.write(png, { colorType: 2 }));
}

test('screenshots', async () => {
  const context = await launch({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(chatUrl('chatgpt'));
  const { fab, item, input } = ui(page);

  // 1. The list, part-way through a long chat.
  await fab.click();
  await item(kyoto[3]!.q).click();
  await sleep(1800);
  await fab.click();
  await item(kyoto[4]!.q).hover();
  await sleep(300);
  await save(page, 'screenshot-1-list.png');

  // 2. Search.
  await input.fill('book');
  await sleep(300);
  await save(page, 'screenshot-2-search.png');

  // 3. Just landed on a question (highlight still visible).
  await page.keyboard.press('Enter');
  await sleep(650);
  await save(page, 'screenshot-3-hop.png');

  // 4. Dark theme.
  await sleep(1500);
  await page.evaluate(() => window.__setDark(true));
  await fab.click();
  await item(kyoto[6]!.q).hover();
  await sleep(300);
  await save(page, 'screenshot-4-dark.png');
  await page.keyboard.press('Escape');

  // 5. Another chat, its own list.
  await page.evaluate(() => window.__setDark(false));
  await page.locator('aside a', { hasText: 'Sourdough' }).click();
  await fab.click();
  await sleep(300);
  await save(page, 'screenshot-5-other-chat.png');
  await context.close();
});

test('promo tiles', async () => {
  const icon = readFileSync(path.resolve(here, '../../icons/icon.svg'), 'utf8');
  const browser = await chromium.launch();
  for (const [name, width, height, scale] of [
    ['promo-small-440x280.png', 440, 280, 1],
    ['promo-marquee-1400x560.png', 1400, 560, 2.2],
  ] as const) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(`
      <style>
        * { margin: 0; box-sizing: border-box; }
        body { width: ${width}px; height: ${height}px; display: grid; place-items: center;
          background: radial-gradient(120% 140% at 15% 0%, #f4f4ff 0%, #e6e6fb 45%, #d5d5f6 100%);
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1d1d22; }
        .wrap { display: flex; align-items: center; gap: ${22 * scale}px; }
        svg { width: ${84 * scale}px; height: ${84 * scale}px; border-radius: ${20 * scale}px; box-shadow: 0 ${8 * scale}px ${24 * scale}px rgba(74, 74, 196, .35); }
        h1 { font-size: ${40 * scale}px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
        p { margin-top: ${10 * scale}px; font-size: ${15.5 * scale}px; line-height: 1.35; color: #4b4b5a; max-width: ${250 * scale}px; }
      </style>
      <div class="wrap">${icon}<div><h1>HopBack</h1><p>Jump back to any question you asked in an AI chat.</p></div></div>`);
    await save(page, name);
    await page.close();
  }
  await browser.close();
});
