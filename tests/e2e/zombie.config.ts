import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs', testMatch: 'zombie-couple.spec.ts', workers: 1, retries: 0,
  reporter: [['list']], outputDir: '../../test-results/zombie-e2e',
  use: { baseURL: 'http://127.0.0.1:7001', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
})
