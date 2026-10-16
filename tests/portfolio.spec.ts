import { test, expect } from "@playwright/test";
test("cinematic forward / reverse, skip, resize and persistent windows", async ({
  page,
}) => {
  // Includes two WebGL transitions, a screenshot and a resize on software-rendered CI.
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().includes("127.0.0.1"))
      failed.push(r.url());
  });
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveAttribute("data-scene-ready","true");
  await expect(page.locator(".scene canvas")).toBeVisible();
  const initial = await page.locator(".desktop-surface").getAttribute("style");
  await page.evaluate(() => scrollTo(0, innerHeight * 2));
  await expect.poll(()=>page.locator(".desktop-surface").getAttribute("style"),{timeout:15000}).not.toEqual(initial);
  await page.screenshot({ path: "../../work/scene-checked.png" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(700);
  await expect(page.locator(".experience-stage")).not.toHaveClass(/is-active/);
  await page.getByRole("button", { name: "Пропустить интро" }).click();
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await page
    .getByRole("button", { name: "Открыть AI-Hunter", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "AI-Hunter", exact: true }),
  ).toBeVisible();
  const dockedY=await page.evaluate(()=>scrollY);
  await page.mouse.move(1380,800);
  await page.mouse.wheel(0,700);
  await page.waitForTimeout(900);
  expect(await page.evaluate(()=>scrollY)).toBe(dockedY);
  await page.mouse.wheel(0,-30);
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await page.mouse.wheel(0,-100);
  await expect(page.locator(".desktop-surface")).toHaveAttribute("inert", "");
  await page.waitForTimeout(1100);
  await page.mouse.wheel(0,1000);
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await expect(
    page.getByRole("dialog", { name: "AI-Hunter", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.waitForTimeout(800);
  await page
    .getByRole("button", { name: "Пропустить интро" })
    .click({ timeout: 2000 })
    .catch(() => {});
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
test("window drag, focus, minimize, restore, maximize, keyboard and terminal", async ({
  page,
}) => {
  await page.goto("./?lite=1");
  await page
    .getByRole("button", { name: "Открыть Обо мне", exact: true })
    .click();
  const about = page.getByRole("dialog", { name: "Обо мне", exact: true });
  await expect(about).toBeVisible();
  await expect.poll(()=>about.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  const title = about.locator(".window-title");
  const before = await about.boundingBox();
  const b = await title.boundingBox();
  await page.mouse.move(b!.x + 150, b!.y + 20);
  await page.mouse.down();
  await page.mouse.move(b!.x + 250, b!.y + 60);
  await page.mouse.up();
  const after = await about.boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x + 50);
  await title.focus();
  await page.keyboard.press("Alt+ArrowLeft");
  expect((await about.boundingBox())!.x).toBeLessThan(after!.x);
  await page.getByRole("button", { name: "Свернуть Обо мне" }).click();
  await expect(about).not.toBeVisible();
  await page
    .getByRole("button", { name: "Обо мне — панель", exact: true })
    .click();
  await expect(about).toBeVisible();
  await page.getByRole("button", { name: "Развернуть Обо мне" }).click();
  await expect.poll(async()=>(await about.boundingBox())!.width).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "Закрыть Обо мне" }).click();
  await expect(
    page.getByRole("button", { name: "Открыть Обо мне", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Открыть Терминал", exact: true })
    .click();
  const input = page.getByRole("textbox", { name: "Команда терминала" });
  await input.fill("projects");
  await input.press("Enter");
  await expect(page.locator(".terminal pre")).toContainText(
    "https://github.com/Yernaribadulla/voxbridge",
  );
  await input.fill("rm -rf /");
  await input.press("Enter");
  await expect(page.locator(".terminal pre")).toContainText(
    "Команда не найдена",
  );
  await page.screenshot({ path: "../../work/terminal-checked.png" });
});
test("mobile and project links", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?lite=1");
  await page.screenshot({ path: "../../work/mobile-checked.png" });
  for (const name of ["AI-Hunter", "Outreach Agent", "VoxBridge", "Штиль"]) {
    await page
      .getByRole("button", { name: `Открыть ${name}`, exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name, exact: true });
    await expect(dialog).toBeVisible();
    expect((await dialog.boundingBox())!.width).toBeLessThan(390);
    const links = await dialog
      .locator("a")
      .evaluateAll((a) => a.map((n) => (n as HTMLAnchorElement).href));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((h) => h.startsWith("https://"))).toBe(true);
    await page.getByRole("button", { name: `Закрыть ${name}` }).click();
  }
  await page
    .getByRole("button", { name: "Открыть Обо мне", exact: true })
    .click();
  await page.screenshot({ path: "../../work/mobile-window.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("phone opens a readable OS without loading the 3D scene", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveClass(/is-simple/);
  await expect(page.locator(".scene canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Открыть Штиль", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Штиль", exact: true });
  await expect(dialog).toBeVisible();
  await expect.poll(async () => (await dialog.boundingBox())!.width).toBe(390);
  await expect(page.getByRole("navigation", { name: "Панель приложений" })).toBeHidden();
  await page.getByRole("button", { name: "Закрыть Штиль" }).click();
  await expect(page.getByRole("navigation", { name: "Панель приложений" })).toBeVisible();
});
test("reduced motion avoids loading WebGL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Открыть Контакты", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /yernaribadulla@gmail/ }),
  ).toBeVisible();
});
test("WebGL unavailable still permits projects", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveClass(/is-simple/);
  await page
    .getByRole("button", { name: "Открыть VoxBridge", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "VoxBridge", exact: true }),
  ).toBeVisible();
});
test("missing 3D asset falls back to desktop", async ({ page }) => {
  await page.route("**/models/sofa.glb", (r) => r.abort());
  await page.goto("./");
  await expect(page.locator(".experience-stage")).toHaveClass(/is-simple/, {
    timeout: 25000,
  });
  await page
    .getByRole("button", { name: "Открыть AI-Hunter", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "AI-Hunter", exact: true }),
  ).toBeVisible();
});
test("direct desktop anchor", async ({ page }) => {
  await page.goto("./#desktop");
  await expect(page.locator(".experience-stage")).toHaveClass(/is-active/);
  await page
    .getByRole("button", { name: "Открыть Контакты", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Контакты", exact: true }),
  ).toBeVisible();
});
