import { test, expect } from "@playwright/test";

test("Sparxie can be grabbed and thrown by its visible pixels", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { originalRandom?: typeof Math.random }).originalRandom = Math.random;
    Math.random = () => .12;
  });
  await page.goto("./?lite=1");
  const canvas = page.locator(".sparxie-rain");
  const summon = page.getByRole("button", { name: "Вызвать объект" });
  await expect(summon).toBeVisible();
  await summon.click();
  await expect(canvas).toHaveAttribute("data-count", "1");
  await page.waitForTimeout(2400);
  await page.screenshot({ path: "../../work/sparxie-one.png" });
  const pixel = await canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement, { width, height } = c;
    const data = c.getContext("2d")!.getImageData(0, 0, width, height).data;
    const bounds = c.getBoundingClientRect();
    for (let y = height - 70; y < height - 3; y++) for (let x = 30; x < 350; x++)
      if (data[(y * width + x) * 4 + 3] > 200 && data[((y + 2) * width + x + 2) * 4 + 3] > 200)
        return { x: bounds.x + x + 2, y: bounds.y + y + 2 };
    return null;
  });
  expect(pixel).not.toBeNull();
  await page.mouse.move(pixel!.x, pixel!.y);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-dragging", "true");
  await page.mouse.move(pixel!.x + 150, pixel!.y - 100, { steps: 8 });
  await page.mouse.up();
  await expect(canvas).toHaveAttribute("data-dragging", "false");
  await page.evaluate(() => {
    Math.random = (window as typeof window & { originalRandom: typeof Math.random }).originalRandom;
  });
  await page.evaluate(() => {
    for (let i = 0; i < 520; i++) window.dispatchEvent(new Event("summon-sparxie"));
  });
  await expect(canvas).toHaveAttribute("data-count", "500");
  await expect(canvas).toHaveAttribute("data-active", "500", { timeout: 35_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "../../work/sparxie-many.png" });
});

test("Sparxie lands on the dock only when above it", async ({ page }) => {
  await page.goto("./?lite=1");
  const summon = page.getByRole("button", { name: "Вызвать объект" });
  const canvas = page.locator(".sparxie-rain");
  await page.evaluate(() => { Math.random = () => .12; });
  await summon.click();
  await expect(canvas).toHaveAttribute("data-active", "1");
  await page.evaluate(() => { Math.random = () => .5; });
  await summon.click();
  await page.waitForTimeout(2700);
  const positions = await canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement;
    const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    const dock = document.querySelector(".dock")!.getBoundingClientRect();
    const bounds = c.getBoundingClientRect();
    const bottom = (left: number, right: number) => {
      for (let y = c.height - 1; y >= 0; y--)
        for (let x = left; x < right; x++)
          if (data[(y * c.width + x) * 4 + 3] > 180) return y;
      return -1;
    };
    return { side: bottom(140, 250), center: bottom(680, 770),
      dockTop: dock.top - bounds.top, height: c.height };
  });
  expect(positions.side).toBeGreaterThan(positions.dockTop + 35);
  expect(positions.side).toBeGreaterThan(positions.height - 8);
  expect(positions.center).toBeLessThanOrEqual(positions.dockTop + 3);
  expect(positions.center).toBeGreaterThan(positions.dockTop - 8);
  const sidePixel = await canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement, bounds = c.getBoundingClientRect();
    const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    for (let y = c.height - 50; y < c.height - 8; y++)
      for (let x = 150; x < 230; x++)
        if (data[(y * c.width + x) * 4 + 3] > 200) return { x: bounds.x + x, y: bounds.y + y };
    return null;
  });
  expect(sidePixel).not.toBeNull();
  const dock = await page.locator(".dock").boundingBox();
  await page.mouse.move(sidePixel!.x, sidePixel!.y);
  await page.mouse.down();
  await expect(canvas).toHaveAttribute("data-dragging", "true");
  await page.mouse.move(dock!.x + 45, sidePixel!.y, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const insideDock = await canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement, bounds = c.getBoundingClientRect();
    const dock = document.querySelector(".dock")!.getBoundingClientRect();
    const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    for (let y = Math.ceil(dock.top - bounds.top + 4); y < Math.min(c.height, dock.bottom - bounds.top); y++)
      for (let x = Math.ceil(dock.left - bounds.left + 4); x < dock.right - bounds.left - 4; x++)
        if (data[(y * c.width + x) * 4 + 3] > 180) return true;
    return false;
  });
  expect(insideDock).toBe(false);
});

test("a settled pile stays still", async ({ page }) => {
  await page.goto("./?lite=1");
  await page.evaluate(() => { Math.random = () => .5; });
  const canvas = page.locator(".sparxie-rain");
  for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Вызвать объект" }).click();
  await expect(canvas).toHaveAttribute("data-active", "6");
  await page.waitForTimeout(6500);
  const sample = async () => canvas.evaluate((element) => {
    const c = element as HTMLCanvasElement;
    const context = c.getContext("2d")!;
    const x = Math.floor(c.width / 2) - 100;
    return Array.from(context.getImageData(x, c.height - 340, 200, 260).data);
  });
  const before = await sample();
  await page.waitForTimeout(400);
  const after = await sample();
  let changed = 0;
  for (let i = 3; i < before.length; i += 4) if (before[i] !== after[i]) changed++;
  expect(changed).toBeLessThan(60);
});

test("Sparxie can be held and thrown with a finger", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => { Math.random = () => .12; });
    await page.goto("./");
    const outreach = page.locator('.desktop-icon[data-app="outreach"] .app-icon');
    await expect(outreach.locator("svg.outreach-mark")).toBeVisible();
    await expect(outreach).toHaveText("");
    await page.getByRole("button", { name: "Вызвать объект" }).click();
    const canvas = page.locator(".sparxie-rain");
    await page.waitForTimeout(2300);
    const pixel = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement, data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      const bounds = c.getBoundingClientRect();
      for (let y = c.height - 165; y < c.height - 65; y++) for (let x = 20; x < 100; x++)
        if (data[(y * c.width + x) * 4 + 3] > 200 && data[((y + 2) * c.width + x + 2) * 4 + 3] > 200)
          return { x: bounds.x + x + 2, y: bounds.y + y + 2 };
      return null;
    });
    expect(pixel).not.toBeNull();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pixel!.x, y: pixel!.y, id: 1 }] });
    await expect(canvas).toHaveAttribute("data-dragging", "true");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: pixel!.x + 110, y: pixel!.y - 130, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(canvas).toHaveAttribute("data-dragging", "false");
  } finally {
    await context.close();
  }
});
