import { test, expect } from '@playwright/test';

test('one renderer, persistent project windows, chapters and browser history', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./');
  const canvas = page.locator('.horizon-root canvas');
  await expect(canvas).toBeVisible();
  expect(await page.locator('.orbital-desktop').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const firstCanvas = await canvas.elementHandle();
  await page.getByRole('button', { name: 'Открыть AI-Hunter', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'AI-Hunter', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Обсерватория', exact: true }).click();
  await expect(page).toHaveURL(/#observatory\/1$/);
  expect(await canvas.evaluate((current, first) => current === first, firstCanvas)).toBe(true);
  for (const name of ['02 ACCRETION', '03 GRAVITY', '04 EVENT HORIZON', '05 BEYOND']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-current', 'step');
  }
  await expect(page.getByText('SPECULATIVE VISUALIZATION', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Вернуться к портфолио', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'AI-Hunter', exact: true })).toBeVisible();
  expect(await canvas.evaluate((current, first) => current === first, firstCanvas)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL(/#observatory\/5$/);
  expect(errors).toEqual([]);
});

test('parameters reach the shader and freeze stops simulation time', async ({ page }) => {
  await page.goto('./#observatory/3');
  const scene = page.getByTestId('webgl-scene');
  await expect(scene).toHaveAttribute('data-time', /[1-9]/);
  await page.getByRole('button', { name: 'Open simulation controls' }).click();
  await page.getByRole('slider', { name: 'Mass', exact: true }).press('End');
  await expect.poll(async () => JSON.parse((await scene.getAttribute('data-parameters'))!).mass).toBeGreaterThan(1.60);
  await page.getByRole('button', { name: 'Close controls' }).click();
  await page.getByRole('button', { name: 'Freeze time', exact: true }).click();
  await page.waitForTimeout(120);
  const frozen = await scene.getAttribute('data-time');
  await page.waitForTimeout(250);
  expect(await scene.getAttribute('data-time')).toBe(frozen);
  await page.getByRole('button', { name: 'Resume time', exact: true }).click();
  await expect.poll(() => scene.getAttribute('data-time')).not.toBe(frozen);
});

test('mobile terminal can launch the observatory and return to its history', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Терминал — панель', exact: true }).click();
  const command = page.getByRole('textbox', { name: 'Команда терминала' });
  await command.fill('open event-horizon');
  await command.press('Enter');
  await expect(page).toHaveURL(/#observatory\/1$/);
  await page.getByRole('button', { name: 'Вернуться к портфолио', exact: true }).click();
  await expect(page.locator('.terminal pre')).toContainText('Открыто: Event Horizon');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('graphics failure leaves all portfolio content accessible', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type.includes('webgl')) return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Открыть VoxBridge', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'VoxBridge', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Обсерватория', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('WebGL 2 is unavailable');
  await page.locator('.emergency-return').click();
  await expect(page.getByRole('dialog', { name: 'VoxBridge', exact: true })).toBeVisible();
});

test('studio unpins before unmount and restores the orbital renderer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('./#studio');
  await expect(page.locator('.experience-stage')).toHaveAttribute('data-scene-ready', 'true');
  await page.getByRole('button', { name: 'Пропустить интро', exact: true }).click();
  await expect(page).toHaveURL(/#studio\/desktop$/);
  await page.getByRole('button', { name: 'На орбиту', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'IDEAS IN ORBIT. 01—05' })).toBeVisible();
  await expect(page.locator('.horizon-root canvas')).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  expect(errors).toEqual([]);
});
