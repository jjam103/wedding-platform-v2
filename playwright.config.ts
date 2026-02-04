import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load E2E environment variables from .env.e2e
dotenv.config({ path: '.env.e2e' });

/**
 * Playwright E2E Test Configuration
 * 
 * Configures end-to-end testing with multiple browsers and devices.
 * Uses global authentication setup to avoid repeated logins.
 * 
 * Environment variables are loaded from .env.e2e for E2E-specific configuration.
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  
  // Global setup and teardown
  globalSetup: require.resolve('./__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/e2e/global-teardown.ts'),
  
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
  // Worker configuration: Use E2E_WORKERS from .env.e2e, default to 4 local / 2 CI
  workers: process.env.E2E_WORKERS 
    ? parseInt(process.env.E2E_WORKERS, 10) 
    : (process.env.CI ? 2 : 4),
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
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
      // Pass all E2E environment variables to Next.js server
      NODE_ENV: 'test',
      
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      
      // External Services (Mock Credentials)
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
      RESEND_API_KEY: process.env.RESEND_API_KEY || '',
      B2_ACCESS_KEY_ID: process.env.B2_ACCESS_KEY_ID || '',
      B2_SECRET_ACCESS_KEY: process.env.B2_SECRET_ACCESS_KEY || '',
      B2_ENDPOINT: process.env.B2_ENDPOINT || '',
      B2_REGION: process.env.B2_REGION || '',
      B2_BUCKET_ID: process.env.B2_BUCKET_ID || '',
      B2_BUCKET_NAME: process.env.B2_BUCKET_NAME || '',
      CLOUDFLARE_CDN_URL: process.env.CLOUDFLARE_CDN_URL || '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    },
  },
});
