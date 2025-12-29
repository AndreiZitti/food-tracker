import { defineConfig, devices } from '@playwright/test';

/**
 * FitTrack Playwright Configuration
 *
 * Comprehensive E2E testing setup for the calorie/macro tracker PWA.
 * Optimized for mobile-first testing with screenshot capture points.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the dev server
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying a failed test
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'on-first-retry',

    // Viewport settings - mobile-first
    viewport: { width: 375, height: 667 },

    // Emulate mobile device
    isMobile: true,
    hasTouch: true,

    // Accept downloads
    acceptDownloads: true,
  },

  // Configure projects for different devices
  projects: [
    // Mobile Safari (iPhone 12)
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        // Default project for mobile-first testing
      },
    },

    // Mobile Chrome (Pixel 5)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },

    // Desktop Chrome (for debugging)
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        isMobile: false,
        hasTouch: false,
      },
    },

    // PWA installed mode
    {
      name: 'pwa',
      use: {
        ...devices['iPhone 12'],
        // Simulate standalone mode (PWA installed)
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',

  // Folder for test snapshots
  snapshotDir: './e2e/snapshots',

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Global timeout for each test
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5 * 1000,
    // Screenshot comparison options
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },
});
