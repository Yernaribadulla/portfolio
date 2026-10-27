import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Software-rendered CI retains real WebGL and all behavioral assertions.
// A smaller drawing buffer bounds GPU emulation cost; this is not visual parity QA.
export default defineConfig(base, {
  // Switching Studio -> Orbital initializes two real 3D scenes on a CPU-only runner.
  // Keep individual assertion deadlines; allow up to 90s for the complete scenario.
  timeout: 90_000,
  use: { ...base.use, viewport: { width: 960, height: 640 }, deviceScaleFactor: 0.35 },
});
