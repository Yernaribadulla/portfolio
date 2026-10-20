import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5180/portfolio/",
    viewport: { width: 1440, height: 900 },
    headless: true,
  },
  reporter: "list",
  webServer: {
    command: "npm run dev -- --port 5180 --strictPort",
    url: "http://127.0.0.1:5180/portfolio/",
    reuseExistingServer: true,
  },
});
