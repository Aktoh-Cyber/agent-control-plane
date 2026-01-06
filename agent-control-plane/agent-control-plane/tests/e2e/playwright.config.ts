/**
 * Playwright Configuration for E2E Tests
 */

import { defineConfig } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-reports/e2e-html' }],
    ['json', { outputFile: 'test-reports/e2e-results.json' }],
    ['junit', { outputFile: 'test-reports/e2e-junit.xml' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'global-teardown.ts'),
  projects: [
    {
      name: 'swarm-workflows',
      testMatch: '**/swarm-workflows.test.ts',
      timeout: 120000,
    },
    {
      name: 'coordination',
      testMatch: '**/coordination.test.ts',
      timeout: 120000,
    },
    {
      name: 'integration',
      testMatch: '**/integration.test.ts',
      timeout: 180000,
    },
  ],
});
