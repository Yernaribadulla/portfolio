import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
const productsWindow = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: 'Digital Products', exact: true });

test('catalogue, detail, reload and browser history stay in the native shell', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./#desktop');
  await page.getByRole('button', { name: 'Открыть Digital Products', exact: true }).click();
  await expect(page).toHaveURL(/#products$/);
  await productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true }).click();
  await expect(page).toHaveURL(/#products\/dentara$/);
  await expect(productsWindow(page).getByRole('heading', { name: 'DENTARA', exact: true })).toBeVisible();
  await expect(productsWindow(page).locator('.product-purchase')).toContainText('$19.00');
  await expect(productsWindow(page).locator('.product-status')).toHaveText('In review');
  await expect(productsWindow(page).getByRole('link', { name: /Buy/ })).toHaveCount(0);
  await expect(productsWindow(page).getByRole('link', { name: 'Live demo', exact: true })).toHaveAttribute('href', /^https:\/\//);
  await expect(productsWindow(page).getByRole('link', { name: 'Product page', exact: true })).toHaveAttribute('rel', 'noopener noreferrer');
  await page.reload();
  await expect(productsWindow(page).getByRole('heading', { name: 'DENTARA', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#products$/);
  await expect(productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true })).toBeVisible();
  await page.goForward();
  await expect(productsWindow(page).getByRole('heading', { name: 'DENTARA', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть Digital Products', exact: true }).click();
  await expect(page).toHaveURL(/#desktop$/);
  await expect(productsWindow(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('unknown and malformed product links offer a working way back', async ({ page }) => {
  for (const id of ['missing-product', '%E0%A4%A']) {
    await page.goto(`./#products/${id}`);
    await expect(productsWindow(page).getByRole('heading', { name: 'Product not found' })).toBeVisible();
    await productsWindow(page).getByRole('link', { name: 'All products' }).click();
    await expect(productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true })).toBeVisible();
  }
});

test('draft products are absent from the public catalogue and direct detail routes', async ({ page }) => {
  await page.route('**/public/products.json*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace(/"status":"in_review"/g, '"status":"draft"') });
  });
  await page.goto('./#products');
  await expect(productsWindow(page).getByText('No products are listed yet.')).toBeVisible();
  await expect(productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true })).toHaveCount(0);
  await page.goto('./#products/dentara');
  await expect(productsWindow(page).getByRole('heading', { name: 'Product not found' })).toBeVisible();
  await expect(productsWindow(page).getByRole('heading', { name: 'DENTARA', exact: true })).toHaveCount(0);
});

test('catalogue price and review status appear before the preview and without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('./#products');
  const card = productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true });
  await expect(card.locator('.product-status')).toBeInViewport({ ratio: 1 });
  await expect(card.locator('.product-card-price')).toBeInViewport({ ratio: 1 });
  const priceBox = await card.locator('.product-card-price').boundingBox();
  const imageBox = await card.locator('.product-visual').boundingBox();
  expect(priceBox!.y + priceBox!.height).toBeLessThanOrEqual(imageBox!.y);
  expect(imageBox!.height).toBeLessThanOrEqual(180);
});

test('a purchase link requires both availability and a safe HTTPS destination', async ({ page }) => {
  for (const scenario of [
    { status: 'available', url: 'https://example.com/verified-listing', canBuy: true },
    { status: 'in_review', url: 'https://example.com/verified-listing', canBuy: false },
    { status: 'available', url: 'javascript:alert(1)', canBuy: false },
  ]) {
    await page.goto('about:blank');
    // Change only the incoming catalogue module, without altering the real catalogue.
    await page.route('**/public/products.json*', async route => {
      const response = await route.fetch();
      const source = (await response.text())
        .replace(/"status":"in_review"/g, `"status":${JSON.stringify(scenario.status)}`)
        .replace(/"purchase_url":null/g, `"purchase_url":${JSON.stringify(scenario.url)}`);
      await route.fulfill({ response, body: source });
    });
    await page.goto('./#products/dentara');
    await expect(productsWindow(page).getByRole('heading', { name: 'DENTARA', exact: true })).toBeVisible();
    const buy = productsWindow(page).getByRole('link', { name: 'Buy on marketplace', exact: true });
    await expect(buy).toHaveCount(scenario.canBuy ? 1 : 0);
    if (scenario.canBuy) await expect(buy).toHaveAttribute('href', scenario.url);
    await page.unroute('**/public/products.json*');
  }
});

for (const width of [320, 390, 768]) {
  test(`product details remain readable and scrollable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('./#products/dentara');
    const panel = productsWindow(page);
    await expect(panel.getByRole('heading', { name: 'DENTARA', exact: true })).toBeVisible();
    await expect.poll(() => panel.locator('.product-visual').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await panel.getByRole('heading', { name: 'Before you buy' }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole('heading', { name: 'Before you buy' })).toBeInViewport();
    expect(await panel.locator('.window-body').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Закрыть Digital Products', exact: true }).click();
    const dock = page.getByRole('navigation', { name: 'Панель приложений' });
    const bounds = await dock.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
  });
}

test('products preserve other windows and reuse the Horizon renderer', async ({ page }) => {
  await page.goto('./#desktop');
  const canvas = page.locator('.horizon-root canvas');
  await expect(canvas).toBeVisible();
  const original = await canvas.elementHandle();
  await page.getByRole('button', { name: 'Открыть AI-Hunter', exact: true }).click();
  await page.getByRole('button', { name: 'Digital Products — панель', exact: true }).click();
  await expect(productsWindow(page)).toBeVisible();
  await productsWindow(page).getByRole('link', { name: 'View DENTARA', exact: true }).click();
  await expect(canvas).toHaveCount(1);
  expect(await canvas.evaluate((node, before) => node === before, original)).toBe(true);
  await page.getByRole('button', { name: 'Закрыть Digital Products', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'AI-Hunter', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Обсерватория', exact: true }).click();
  await expect(page).toHaveURL(/#observatory\/1$/);
  await page.getByRole('button', { name: 'Вернуться к портфолио', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'AI-Hunter', exact: true })).toBeVisible();
  expect(await canvas.evaluate((node, before) => node === before, original)).toBe(true);
});
