/**
 * E2E Configuration Verification Test
 * 
 * This test verifies that Playwright is properly configured and can access
 * environment variables from .env.e2e
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Configuration Verification', () => {
  test('should load environment variables from .env.e2e', async () => {
    // Verify required environment variables are accessible
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    expect(process.env.E2E_BASE_URL).toBeDefined();
    expect(process.env.E2E_WORKERS).toBeDefined();
    
    // Verify values are correct
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://olcqaawrpnanioaorfer.supabase.co');
    expect(process.env.E2E_BASE_URL).toBe('http://localhost:3000');
    expect(process.env.E2E_WORKERS).toBe('2');
    
    console.log('✅ All environment variables loaded correctly');
  });
  
  test('should load mock service credentials', async () => {
    // Verify mock credentials are loaded
    expect(process.env.B2_ACCESS_KEY_ID).toBe('test-b2-access-key-id');
    expect(process.env.RESEND_API_KEY).toBe('test-resend-api-key');
    expect(process.env.TWILIO_ACCOUNT_SID).toBe('test-twilio-account-sid');
    expect(process.env.GEMINI_API_KEY).toBe('test-gemini-api-key');
    
    console.log('✅ All mock service credentials loaded correctly');
  });
  
  test('should have correct E2E configuration', async () => {
    // Verify E2E-specific configuration
    expect(process.env.E2E_HEADLESS).toBe('true');
    expect(process.env.E2E_TIMEOUT).toBe('30000');
    expect(process.env.E2E_SCREENSHOT_ON_FAILURE).toBe('true');
    expect(process.env.E2E_VIDEO).toBe('retain-on-failure');
    expect(process.env.E2E_TRACE).toBe('retain-on-failure');
    
    console.log('✅ E2E configuration loaded correctly');
  });
});
