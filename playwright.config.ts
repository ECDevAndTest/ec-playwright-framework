import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

function projectRoot(start: string) {
  let directory = path.resolve(start);

  while (!fs.existsSync(path.join(directory, 'playwright.config.ts'))) {
    const parent = path.dirname(directory);
    if (parent === directory) {
      return path.resolve(start);
    }
    directory = parent;
  }

  return directory;
}

dotenv.config({ path: path.join(projectRoot(process.cwd()), '.env') });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: process.env.MEDUSA_BASE_URL ?? 'http://localhost:9000',
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});