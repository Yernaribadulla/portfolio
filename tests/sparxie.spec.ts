import { test, expect } from "@playwright/test";

test("Sparxie falls from the top and stops at 100 objects", async ({ page }) => {
  await page.goto("./?lite=1");
  const canvas = page.locator(".sparxie-rain");
  const summon = page.getByRole("button", { name: "Вызвать объект" });
  await expect(summon).toBeVisible();
  await summon.click();
  await expect(canvas).toHaveAttribute("data-count", "1");
  await page.waitForTimeout(900);
  await page.screenshot({ path: "../../work/sparxie-one.png" });
  await page.evaluate(() => {
    for (let i = 0; i < 120; i++) window.dispatchEvent(new Event("summon-sparxie"));
  });
  await expect(canvas).toHaveAttribute("data-count", "100");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "../../work/sparxie-many.png" });
});
