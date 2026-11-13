/**
 * Regenerates docs/media from the real built extension running on the fixture
 * pages, so the README always shows the current UI. Run with `npm run media`.
 */
import { test, type Page } from '@playwright/test';
import gifenc from 'gifenc';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { chatUrl, launch, ui } from '../e2e/harness';
import { CHATS } from '../fixtures/sites';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/media');
mkdirSync(out, { recursive: true });

const { applyPalette, GIFEncoder, quantize } = gifenc;
const GIF = { width: 800, height: 500 };
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const kyoto = CHATS.kyoto!.turns;

/** Screenshots don't include the mouse pointer, so draw one that follows it. */
async function showCursor(page: Page) {
  await page.evaluate(() => {
    const dot = document.createElement('div');
    dot.style.cssText =
      'position:fixed;z-index:2147483647;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;' +
      'background:rgba(30,30,40,.55);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);pointer-events:none;' +
      'transition:transform .12s;will-change:left,top';
    document.documentElement.append(dot);
    addEventListener('mousemove', (e) => { dot.style.left = `${e.clientX}px`; dot.style.top = `${e.clientY}px`; }, true);
    addEventListener('mousedown', () => (dot.style.transform = 'scale(.7)'), true);
    addEventListener('mouseup', () => (dot.style.transform = ''), true);
  });
}

let mouse = { x: 500, y: 300 };
async function glide(page: Page, x: number, y: number, ms = 500) {
  const steps = Math.max(1, Math.round(ms / 25));
  const from = mouse;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t * t * (3 - 2 * t);
    await page.mouse.move(from.x + (x - from.x) * ease, from.y + (y - from.y) * ease);
    await sleep(25);
  }
  mouse = { x, y };
}

async function glideTo(page: Page, locator: ReturnType<Page['locator']>, ms?: number) {
  const box = (await locator.boundingBox())!;
  await glide(page, box.x + Math.min(box.width / 2, 150), box.y + box.height / 2, ms);
}

async function clickAt(page: Page, locator: ReturnType<Page['locator']>) {
  await glideTo(page, locator);
  await sleep(150);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
}

/** Records screenshots while `actions` runs and writes them out as a GIF. */
async function recordGif(page: Page, name: string, actions: () => Promise<void>) {
  const frames: { data: Buffer; at: number }[] = [];
  let recording = true;
  const loop = (async () => {
    while (recording) {
      const at = Date.now();
      frames.push({ data: await page.screenshot({ type: 'png' }), at });
      await sleep(Math.max(0, 80 - (Date.now() - at)));
    }
  })();
  await actions();
  recording = false;
  await loop;

  // Encode only what changed between frames: unchanged pixels become
  // transparent and identical frames just extend the previous delay.
  const TRANSPARENT = 255;
  const gif = GIFEncoder();
  let previous: Buffer | undefined;
  let pending: { index: Uint8Array; palette: number[][]; width: number; height: number; delay: number; first: boolean } | undefined;
  const flush = () => {
    if (!pending) return;
    const { index, palette, width, height, delay, first } = pending;
    gif.writeFrame(index, width, height, { palette, delay, dispose: 1, ...(first ? {} : { transparent: true, transparentIndex: TRANSPARENT }) });
  };
  frames.forEach((frame, i) => {
    const { data, width, height } = PNG.sync.read(frame.data);
    const delay = i + 1 < frames.length ? frames[i + 1]!.at - frame.at : 2000;
    if (previous && pending && data.equals(previous)) {
      pending.delay += delay;
      return;
    }
    flush();
    const palette = quantize(data, 255);
    const index = applyPalette(data, palette);
    if (previous) {
      for (let p = 0; p < index.length; p++) {
        const o = p * 4;
        if (data[o] === previous[o] && data[o + 1] === previous[o + 1] && data[o + 2] === previous[o + 2]) index[p] = TRANSPARENT;
      }
    }
    pending = { index, palette, width, height, delay, first: !previous };
    previous = data;
  });
  flush();
  gif.finish();
  writeFileSync(path.join(out, name), gif.bytes());
}

test('screenshots', async () => {
  const context = await launch({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(chatUrl('chatgpt'));
  const { fab, item, input } = ui(page);

  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((dark) => window.__setDark(dark), theme === 'dark');
    await fab.click();
    await item(kyoto[3]!.q).click();
    await sleep(1800);
    await fab.click();
    await item(kyoto[4]!.q).hover();
    await sleep(300);
    await page.screenshot({ path: path.join(out, `panel-${theme}.png`) });
    await page.keyboard.press('Escape');
  }

  await page.evaluate(() => window.__setDark(false));
  await fab.click();
  await input.fill('book');
  await sleep(300);
  await page.screenshot({ path: path.join(out, 'search.png') });
  await context.close();
});

test('gifs', async () => {
  const context = await launch({ viewport: GIF, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const { fab, item, input } = ui(page);

  // Hero: lost at the bottom of a long chat, two clicks back to the question.
  await page.goto(chatUrl('chatgpt'));
  await showCursor(page);
  await page.mouse.move(mouse.x, mouse.y);
  await page.evaluate(() => document.getElementById('scroller')!.scrollTo({ top: 99999 }));
  await sleep(400);
  await recordGif(page, 'hero.gif', async () => {
    await sleep(900);
    await clickAt(page, fab);
    await sleep(700);
    await glideTo(page, item(kyoto[5]!.q), 500);
    await glideTo(page, item(kyoto[2]!.q), 600);
    await sleep(350);
    await clickAt(page, item(kyoto[2]!.q));
    await sleep(2400);
    await clickAt(page, fab);
    await sleep(500);
    await clickAt(page, item(kyoto[6]!.q));
    await sleep(2400);
  });

  // Search.
  await page.goto(chatUrl('chatgpt'));
  await showCursor(page);
  await recordGif(page, 'search.gif', async () => {
    await sleep(500);
    await clickAt(page, fab);
    await sleep(600);
    await input.pressSequentially('autumn', { delay: 110 });
    await sleep(900);
    await page.keyboard.press('Enter');
    await sleep(2300);
  });

  // Keyboard hops, no panel.
  await page.goto(chatUrl('chatgpt'));
  await recordGif(page, 'keyboard.gif', async () => {
    await sleep(500);
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp']) {
      await page.keyboard.press(`Alt+Shift+${key}`);
      await sleep(1500);
    }
  });

  // Switching chats.
  await page.goto(chatUrl('chatgpt'));
  await showCursor(page);
  await recordGif(page, 'switch-chats.gif', async () => {
    await sleep(400);
    await clickAt(page, fab);
    await sleep(1100);
    await clickAt(page, page.locator('aside a', { hasText: 'Sourdough' }));
    await sleep(700);
    await clickAt(page, fab);
    await sleep(1600);
  });

  await context.close();
});
