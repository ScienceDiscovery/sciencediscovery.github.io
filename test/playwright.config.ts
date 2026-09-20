import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../test',
  testMatch: 'journey-*.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 45_000,
  outputDir: './test-results',
  reporter: [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run serve --prefix ..',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  }
})
