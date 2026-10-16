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
    for (let y = height - 170; y < height - 65; y++) for (let x = 30; x < 350; x++)
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

test("Sparxie can be held and thrown with a finger", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => { Math.random = () => .12; });
    await page.goto("./");
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
