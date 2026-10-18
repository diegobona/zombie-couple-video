import { defineConfig, devices } from '@playwright/test'

// No database setup/cleanup: all analytics ingestion and trial requests are mocked.
export default defineConfig({
  testDir: './specs', testMatch: 'analytics.spec.ts', workers: 1, retries: 0,
  reporter: [['list']], outputDir: '../../test-results/analytics-e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:7015',
    ...devices['Desktop Edge'], channel: 'msedge',
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
})
