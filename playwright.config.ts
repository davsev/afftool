import { defineConfig, devices } from '@playwright/test'

const executablePath = process.env.PW_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3100',
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], permissions: ['clipboard-read', 'clipboard-write'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start -- -p 3100', port: 3100, reuseExistingServer: true, timeout: 120_000 },
})
