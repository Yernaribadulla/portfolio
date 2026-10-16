import { test, expect } from "@playwright/test";
test("contact controls work without a desktop email handler", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 722, height: 715 });
  await page.goto("./?lite=1");
  await page
    .getByRole("button", { name: "Написать письмо", exact: true })
    .click();
  const contact = page.getByRole("dialog", { name: "Контакты", exact: true });
  await expect(contact).toBeVisible();
  await page
    .getByRole("button", { name: "Скопировать email", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Email скопирован");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "yernaribadulla@gmail.com",
  );
  await expect(
    page.getByRole("link", { name: "Открыть Gmail ↗" }),
  ).toHaveAttribute("href", /mail.google.com/);
  await page
    .getByRole("button", { name: "Закрыть Контакты", exact: true })
    .click();
  await expect(contact).toHaveAttribute("data-exiting", "true");
  await expect(contact).toHaveCount(0);
  await page.getByRole("button", { name: "Открыть Контакты", exact: true }).click();
  await expect(contact).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.screenshot({ path: "../../work/contact-updated.png" });
});
test("terminal history, completion, commands and application launching", async ({
  page,
}) => {
  await page.goto("./?lite=1");
  await page
    .getByRole("button", { name: "Открыть Терминал", exact: true })
    .click();
  const input = page.getByRole("textbox", { name: "Команда терминала" });
  await input.fill("ski");
  await input.press("Tab");
  await expect(input).toHaveValue("skills");
  await input.press("Enter");
  await expect(page.locator(".terminal pre")).toContainText("FastAPI");
  await input.fill("whoami");
  await input.press("Enter");
  await input.fill("draft");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("whoami");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("skills");
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("draft");
  await input.fill("open vox");
  await input.press("Tab");
  await expect(input).toHaveValue("open voxbridge");
  await input.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "VoxBridge", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Закрыть VoxBridge", exact: true })
    .click();
  await input.fill("clear");
  await input.press("Enter");
  await expect(page.locator(".terminal pre")).toHaveText("");
  await page.getByRole("button", { name: "help", exact: true }).click();
  await expect(page.locator(".terminal pre")).toContainText("open <имя>");
  await page.screenshot({ path: "../../work/terminal-updated.png" });
});
test("clock follows the device timezone from the first rendered frame", async ({
  browser,
}) => {
  for (const [timezoneId, time] of [
    ["Europe/London", "13:00"],
    ["Asia/Tokyo", "21:00"],
  ]) {
    const context = await browser.newContext({ timezoneId, locale: "en-GB" });
    const page = await context.newPage();
    await page.clock.install({ time: new Date("2026-10-16T12:00:00Z") });
    await page.goto("http://127.0.0.1:5173/portfolio/?lite=1");
    await expect(page.getByLabel("Местное время устройства")).toHaveText(time);
    await expect(page.locator("time")).toHaveAttribute("title", timezoneId);
    await context.close();
  }
});
test("native laptop display aspect stays independent of browser aspect", async ({
  page,
}) => {
  await page.setViewportSize({ width: 722, height: 715 });
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveAttribute("data-scene-ready","true");
  await page.evaluate(() => scrollTo(0, innerHeight * 4.5 * 0.7));
  await expect
    .poll(() =>
      page
        .locator(".desktop-surface")
        .evaluate((el) => Number(el.style.opacity)),
    )
    .toBeGreaterThan(0.9);
  const aspect = await page
    .locator(".desktop-surface")
    .evaluate((el) => parseFloat(el.style.width) / parseFloat(el.style.height));
  expect(aspect).toBeCloseTo(0.454 / 0.284, 2);
  await page.screenshot({ path: "../../work/laptop-aspect-fixed.png" });
  await page.getByRole("button", { name: "Пропустить интро" }).click();
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await expect
    .poll(() =>
      page
        .locator(".desktop-surface")
        .evaluate((el) => parseFloat(el.style.width)),
    )
    .toBeCloseTo(722, 0);
  await page.screenshot({ path: "../../work/desktop-722-fixed.png" });
});
