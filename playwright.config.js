const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  expect: {
    timeout: 5000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // CI 时可启用全部浏览器: npx playwright test --project=chromium,firefox,webkit
  ],

  webServer: {
    command: 'python3 -m http.server 8080 --bind 0.0.0.0',
    port: 8080,
    reuseExistingServer: !process.env.CI,
  },
});
