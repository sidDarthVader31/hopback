import { expect } from '@playwright/test';
import { CHATS } from '../fixtures/sites';
import { chatUrl, questionTop, siteIds, test, ui } from './harness';

const kyoto = CHATS.kyoto!.turns;
const sourdough = CHATS.sourdough!.turns;

/** The question has come to rest near the top of the scrolling area (below the 56px header). */
async function expectHoppedTo(page: Parameters<typeof questionTop>[0], text: string) {
  await expect.poll(() => questionTop(page, text), { timeout: 5000 }).toBeGreaterThan(56);
  await expect.poll(() => questionTop(page, text), { timeout: 5000 }).toBeLessThan(200);
}

for (const site of siteIds) {
  test.describe(site, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(chatUrl(site));
    });

    test('shows a button with the number of questions', async ({ page }) => {
      await expect(ui(page).badge).toHaveText(String(kyoto.length));
    });

    test('lists every question and hops to the one you click', async ({ page }) => {
      const { fab, items, item, panel } = ui(page);
      await fab.click();
      await expect(items).toHaveCount(kyoto.length);
      await expect(items.locator('.text')).toHaveText(kyoto.map((t) => t.q));

      const target = kyoto[5]!.q;
      expect(await questionTop(page, target)).toBeGreaterThan(1000);
      await item(target).click();
      await expect(panel).toBeHidden();
      await expectHoppedTo(page, target);
    });

    test('picks up a question asked after load', async ({ page }) => {
      const { fab, badge, items } = ui(page);
      await page.evaluate(() => window.__addTurn('One more thing: what about tipping?', 'Not expected.'));
      await expect(badge).toHaveText(String(kyoto.length + 1));
      await fab.click();
      await expect(items.last()).toContainText('what about tipping?');
    });

    test('swaps the list when you switch chats', async ({ page }) => {
      const { fab, badge, items, panel } = ui(page);
      await fab.click();
      await expect(panel).toBeVisible();
      await page.locator('aside a', { hasText: 'Sourdough' }).click();
      await expect(panel).toBeHidden();
      await expect(badge).toHaveText(String(sourdough.length));
      await fab.click();
      await expect(items.locator('.text')).toHaveText(sourdough.map((t) => t.q));
    });

    test('hides in an empty chat and returns when a chat has questions', async ({ page }) => {
      const { fab } = ui(page);
      await page.evaluate(() => window.__switchChat('empty'));
      await expect(fab).toBeHidden();
      await page.evaluate(() => window.__switchChat('sourdough'));
      await expect(fab).toBeVisible();
    });
  });
}

test.describe('interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(chatUrl('chatgpt'));
    await expect(ui(page).badge).toHaveText(String(kyoto.length));
  });

  test('keyboard: open, search, hop, close', async ({ page }) => {
    const { panel, input, items } = ui(page);
    await page.keyboard.press('Alt+KeyJ');
    await expect(panel).toBeVisible();
    await expect(input).toBeFocused();

    await page.keyboard.type('rail pass');
    await expect(items).toHaveCount(1);
    await expect(items.locator('mark')).toHaveText(['rail', 'pass']);
    await page.keyboard.press('Enter');
    await expect(panel).toBeHidden();
    await expectHoppedTo(page, kyoto[2]!.q);

    await page.keyboard.press('Alt+KeyJ');
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('keyboard: hop to next and previous question without the panel', async ({ page }) => {
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expectHoppedTo(page, kyoto[0]!.q);
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expectHoppedTo(page, kyoto[1]!.q);
    await page.keyboard.press('Alt+Shift+ArrowDown');
    await expectHoppedTo(page, kyoto[2]!.q);
    await page.keyboard.press('Alt+Shift+ArrowUp');
    await expectHoppedTo(page, kyoto[1]!.q);
  });

  test('marks the question you are currently reading', async ({ page }) => {
    const { fab, item } = ui(page);
    await fab.click();
    await item(kyoto[3]!.q).click();
    await expectHoppedTo(page, kyoto[3]!.q);
    await fab.click();
    await expect(item(kyoto[3]!.q)).toHaveClass(/current/);
    await expect(ui(page).host.locator('.item.current')).toHaveCount(1);
  });

  test('picks up older messages loaded above', async ({ page }) => {
    const { fab, badge, items } = ui(page);
    await page.evaluate(() => window.__prependTurn('Earlier: when is the best time to visit Japan?', 'Spring or autumn.'));
    await expect(badge).toHaveText(String(kyoto.length + 1));
    await fab.click();
    await expect(items.first()).toContainText('best time to visit Japan');
    await expect(items.first().locator('.num')).toHaveText('1');
  });

  test('the toolbar icon opens and closes the list', async ({ page, extension }) => {
    const { panel } = ui(page);
    const worker = extension.serviceWorkers()[0] ?? (await extension.waitForEvent('serviceworker'));
    const clickIcon = () =>
      worker.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        // @ts-expect-error dispatch is how Chromium fires extension events in tests
        chrome.action.onClicked.dispatch(tab);
      });
    await page.bringToFront();
    await clickIcon();
    await expect(panel).toBeVisible();
    await clickIcon();
    await expect(panel).toBeHidden();
  });

  test('closes when you click outside', async ({ page }) => {
    const { fab, panel } = ui(page);
    await fab.click();
    await expect(panel).toBeVisible();
    await page.locator('header').click();
    await expect(panel).toBeHidden();
  });

  test('matches the page theme', async ({ page }) => {
    const { fab, host, panel } = ui(page);
    await fab.click();
    await expect(host).toHaveAttribute('data-theme', 'light');
    await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.__setDark(true));
    await fab.click();
    await expect(host).toHaveAttribute('data-theme', 'dark');
    await expect(panel).toHaveCSS('background-color', 'rgb(32, 32, 36)');
  });

  test('the button can be dragged and still opens on click', async ({ page }) => {
    const { fab, panel } = ui(page);
    const before = (await fab.boundingBox())!;
    await page.mouse.move(before.x + 22, before.y + 22);
    await page.mouse.down();
    await page.mouse.move(before.x + 22, before.y + 172, { steps: 5 });
    await page.mouse.up();
    const after = (await fab.boundingBox())!;
    expect(after.y - before.y).toBeGreaterThan(120);
    await expect(panel).toBeHidden();
    await fab.click();
    await expect(panel).toBeVisible();
  });

  test('remembers where the button was dragged to', async ({ page, extension }) => {
    const { fab } = ui(page);
    const before = (await fab.boundingBox())!;
    await page.mouse.move(before.x + 22, before.y + 22);
    await page.mouse.down();
    await page.mouse.move(before.x + 22, before.y - 128, { steps: 5 });
    await page.mouse.up();
    const moved = (await fab.boundingBox())!;

    const second = await extension.newPage();
    await second.goto(chatUrl('claude'));
    await expect.poll(async () => Math.abs(((await ui(second).fab.boundingBox())?.y ?? 0) - moved.y)).toBeLessThan(2);
    await second.close();
  });

  test('does nothing on sites it does not support', async ({ page, extension }) => {
    await extension.route('https://example.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<div data-message-author-role="user">hi</div>' }));
    await page.goto('https://example.com/');
    await expect(page.locator('#hopback-root')).toHaveCount(0);
  });
});
