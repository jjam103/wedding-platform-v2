import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Configures end-to-end testing with multiple browsers and devices.
 * Uses global authentication setup to avoid repeated logins.
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5 * 1000,
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Limit workers to prevent overwhelming the dev server
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 15 * 1000,
    
    // Action timeout
    actionTimeout: 10 * 1000,
  },

  // Configure projects for major browsers
  // Run only Chromium by default to speed up tests
  // Use --project flag to run specific browsers
  projects: [
    // Setup project - runs first to authenticate (no storageState)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        // Don't use storageState for setup - we're creating it
        storageState: undefined,
      },
    },
    
    // Test projects - depend on setup and use saved auth
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Uncomment to test other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    // Tablet viewports
    // {
    //   name: 'iPad',
    //   use: { ...devices['iPad Pro'] },
    // },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Use test environment variables
      NODE_ENV: 'test',
    },
  },
});
