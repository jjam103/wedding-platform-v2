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
  
  // Maximum time one test can run (increased for slower operations)
  timeout: 60 * 1000, // Increased from 30s to 60s
  
  // Expect timeout for assertions (increased for slower elements)
  expect: {
    timeout: 10 * 1000, // Increased from 5s to 10s
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once locally to handle flaky tests
  // Worker configuration: TEMPORARILY SET TO 1 for race condition testing
  // Normal: 4 workers for parallel execution against production build
  // Production build is more stable and can handle parallel load better than dev server
  // Historical data (Feb 15, 2026): 4 workers achieved 245 passing tests with 58% faster execution
  // See: E2E_FEB15_2026_SWITCH_TO_PRODUCTION_BUILD.md for details
  workers: 1,
  
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
    
    // Navigation timeout (increased for slower page loads)
    navigationTimeout: 30 * 1000, // Increased from 15s to 30s
    
    // Action timeout (increased for slower interactions)
    actionTimeout: 15 * 1000, // Increased from 10s to 15s
  },

  // Configure projects for major browsers
  // Run only Chromium by default to speed up tests
  // Use --project flag to run specific browsers
  projects: [
    // Admin tests - use authenticated state
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Load admin authentication state for admin tests
        // This file is created by global-setup.ts
        storageState: '.auth/admin.json',
      },
    },

    // Uncomment to test other browsers
    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     storageState: '.auth/admin.json',
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     storageState: '.auth/admin.json',
    //   },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { 
    //     ...devices['Pixel 5'],
    //     storageState: '.auth/admin.json',
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { 
    //     ...devices['iPhone 12'],
    //     storageState: '.auth/admin.json',
    //   },
    // },

    // Tablet viewports
    // {
    //   name: 'iPad',
    //   use: { 
    //     ...devices['iPad Pro'],
    //     storageState: '.auth/admin.json',
    //   },
    // },
  ],

  // Run local dev server before starting tests
  // Use Webpack instead of Turbopack to avoid route discovery issues
  // See: E2E_PHASE1_ONLINE_RESEARCH_FINDINGS.md for details
  // 
  // PRODUCTION MODE FIX (Feb 15, 2026):
  // When E2E_USE_PRODUCTION=true, we expect the production server to already be running.
  // We skip webServer config entirely in production mode.
  ...(process.env.E2E_USE_PRODUCTION === 'true' ? {} : {
    webServer: {
      // Dev mode: Start dev server
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes for dev server startup
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // Pass all E2E environment variables to Next.js server
        NODE_ENV: 'test',
        // CRITICAL: Use NEXT_PUBLIC_ prefix so Next.js exposes it to runtime
        NEXT_PUBLIC_E2E_TEST: process.env.NEXT_PUBLIC_E2E_TEST || 'true',
        
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
  }),
});
