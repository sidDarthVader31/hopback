import { test as base, chromium, type BrowserContext, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageHtml, SITES } from '../fixtures/sites';

declare global {
  /** Hooks the fixture pages expose for driving a fake conversation. */
  interface Window {
    __switchChat(id: string): void;
    __addTurn(question: string, answer: string): void;
    __prependTurn(question: string, answer: string): void;
    __setDark(on: boolean): void;
  }
}

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
const origins = new Map(Object.entries(SITES).map(([id, site]) => [site.origin, id]));

/** Chromium with the built extension loaded, and the supported sites served from fixtures. */
export async function launch(options: Parameters<typeof chromium.launchPersistentContext>[1] = {}): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    ...options,
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
  });
  // Requests to the real hostnames never leave the machine: the manifest's
  // match patterns are exercised for real, against our stand-in pages.
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    const site = origins.get(url.origin);
    if (!site) return route.abort();
    const chat = url.pathname.split('/').pop() || 'kyoto';
    return route.fulfill({ contentType: 'text/html', body: pageHtml(site, chat) });
  });
  return context;
}

export const test = base.extend<{ page: Page }, { extension: BrowserContext }>({
  extension: [
    async ({}, use) => {
      const context = await launch();
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],
  page: async ({ extension }, use) => {
    const page = await extension.newPage();
    await use(page);
    await page.close();
  },
});

export const siteIds = Object.keys(SITES);
export const chatUrl = (site: string, chat = 'kyoto') => `${SITES[site]!.origin}/c/${chat}`;

/** Handles on HopBack's UI (Playwright locators pierce the open shadow root). */
export function ui(page: Page) {
  const host = page.locator('#hopback-root');
  return {
    host,
    fab: host.locator('.fab'),
    badge: host.locator('.badge'),
    panel: host.locator('.panel'),
    input: host.locator('input'),
    items: host.locator('.item'),
    item: (text: string): Locator => host.locator('.item', { hasText: text }),
  };
}

/** Viewport-relative top of the question with this text. */
export function questionTop(page: Page, text: string): Promise<number> {
  return page.evaluate((t) => {
    const rows = [...document.querySelectorAll('.row-user')];
    return rows.find((r) => r.textContent!.includes(t))!.getBoundingClientRect().top;
  }, text);
}
