import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { defineBddProject } from 'playwright-bdd';

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
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      ...defineBddProject({
        name: 'admin',
        features: 'features/admin/**/*.feature',
        steps: 'steps/admin/**/*.ts',
        tags: 'not @unscripted',
      }),
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://ec-medusa-app.onrender.com/app',
      },
    },
    // Marketplace stays out of this run until MARKETPLACE_BASE_URL is set.
    ...(process.env.MARKETPLACE_BASE_URL
      ? [
          {
            ...defineBddProject({
              name: 'marketplace',
              features: 'features/marketplace/**/*.feature',
              steps: 'steps/marketplace/**/*.ts',
              tags: 'not @unscripted',
            }),
            use: {
              ...devices['Desktop Chrome'],
              baseURL: process.env.MARKETPLACE_BASE_URL,
            },
          },
        ]
      : []),
  ],
});