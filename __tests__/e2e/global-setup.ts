/**
 * E2E Global Setup
 * 
 * Runs before all E2E tests to prepare the test environment.
 * This includes:
 * - Verifying test database connection
 * - Cleaning up any leftover test data
 * - Verifying Next.js server is running
 * - Creating admin authentication state
 */

import { chromium, FullConfig } from '@playwright/test';
import { createTestClient } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

/**
 * Global setup function
 * Called once before all tests run
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 E2E Global Setup Starting...\n');
  
  try {
    // 1. Verify test database connection
    console.log('📊 Verifying test database connection...');
    await verifyDatabaseConnection();
    console.log('✅ Test database connected\n');
    
    // 2. Clean up any leftover test data
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData();
    console.log('✅ Test data cleaned\n');
    
    // 3. Verify Next.js server is running
    console.log('🌐 Verifying Next.js server...');
    const baseURL = getBaseURL(config);
    await verifyNextJsServer(baseURL);
    console.log('✅ Next.js server is running\n');
    
    // 4. Create admin authentication state
    console.log('🔐 Setting up admin authentication...');
    await createAdminAuthState(baseURL);
    console.log('✅ Admin authentication saved\n');
    
    console.log('✨ E2E Global Setup Complete!\n');
  } catch (error) {
    console.error('\n❌ E2E Global Setup Failed:', error);
    throw error;
  }
}

/**
 * Verify test database connection
 * Ensures the test database is accessible and properly configured
 */
async function verifyDatabaseConnection(): Promise<void> {
  try {
    // Use service role key for database verification to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try a simple query to verify connection
    const { error } = await supabase
      .from('guests')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    
    // Verify we're using the test database
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    
    // Check if URL contains test database identifier
    if (!url.includes('olcqaawrpnanioaorfer')) {
      console.warn('⚠️  Warning: Database URL does not appear to be the test database');
      console.warn(`   Current URL: ${url}`);
    }
  } catch (error) {
    throw new Error(
      `Test database connection failed: ${error instanceof Error ? error.message : String(error)}\n` +
      'Please ensure:\n' +
      '  1. Test database is running\n' +
      '  2. Environment variables are set correctly\n' +
      '  3. Database migrations are applied'
    );
  }
}

/**
 * Clean up any leftover test data
 * Ensures a clean slate for test execution
 */
async function cleanupTestData(): Promise<void> {
  try {
    await cleanup();
  } catch (error) {
    console.warn('⚠️  Warning: Test data cleanup encountered errors:', error);
    console.warn('   Continuing with setup...');
  }
}

/**
 * Get base URL from Playwright config
 */
function getBaseURL(config: FullConfig): string {
  // Try to get baseURL from first project
  const baseURL = config.projects[0]?.use?.baseURL;
  
  if (!baseURL) {
    throw new Error(
      'Base URL not configured in Playwright config.\n' +
      'Please set baseURL in playwright.config.ts'
    );
  }
  
  return baseURL;
}

/**
 * Verify Next.js server is running and accessible
 */
async function verifyNextJsServer(baseURL: string): Promise<void> {
  const maxRetries = 30; // 30 retries = 30 seconds
  const retryDelay = 1000; // 1 second between retries
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(baseURL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Playwright-E2E-Setup',
        },
      });
      
      if (response.ok) {
        return; // Server is running
      }
      
      throw new Error(`Server returned status ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Next.js server not accessible at ${baseURL}\n` +
          `Error: ${error instanceof Error ? error.message : String(error)}\n` +
          'Please ensure:\n' +
          '  1. Next.js dev server is running (npm run dev)\n' +
          '  2. Server is listening on the correct port\n' +
          '  3. No firewall blocking the connection'
        );
      }
      
      // Wait before retrying
      if (i === 0) {
        console.log(`   Waiting for server to start (${maxRetries} seconds max)...`);
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Create admin authentication state
 * Creates a browser session with admin credentials and saves it for tests
 */
async function createAdminAuthState(baseURL: string): Promise<void> {
  // Get admin credentials from environment
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password';
  
  // Try to ensure admin user exists (but don't fail if it already exists)
  try {
    await ensureAdminUserExists(adminEmail, adminPassword);
  } catch (error) {
    console.log(`   Note: Admin user setup skipped (${error instanceof Error ? error.message : String(error)})`);
    console.log(`   Will attempt login with existing credentials...`);
  }
  
  const browser = await chromium.launch();
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to admin login page
    await page.goto(`${baseURL}/auth/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    console.log(`   Navigated to login page`);
    
    // Fill in login form using id selectors
    await page.fill('#email', adminEmail);
    await page.fill('#password', adminPassword);
    
    console.log(`   Filled login form`);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    console.log(`   Submitted login form, waiting for navigation...`);
    
    // Wait a moment for any error messages or navigation
    await page.waitForTimeout(2000);
    
    // Check if there's an error message
    const errorElement = page.locator('.bg-volcano-50, [class*="error"]');
    const hasError = await errorElement.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorElement.textContent();
      console.log(`   ⚠️  Login error message: ${errorText}`);
    }
    
    // Check current URL
    const currentURL = page.url();
    console.log(`   Current URL after login: ${currentURL}`);
    
    // Wait for navigation to admin dashboard (match /admin with or without trailing slash)
    await page.waitForURL(/\/admin\/?$/, {
      timeout: 10000,
    });
    
    // Verify we're logged in by checking for admin UI elements
    const isLoggedIn = await page.locator('[data-testid="admin-dashboard"], .admin-layout, nav').first().isVisible();
    
    if (!isLoggedIn) {
      throw new Error('Admin login succeeded but admin UI not visible');
    }
    
    // Save authentication state
    await context.storageState({ path: '.auth/user.json' });
    
    console.log(`   Logged in as: ${adminEmail}`);
  } catch (error) {
    throw new Error(
      `Failed to create admin authentication state: ${error instanceof Error ? error.message : String(error)}\n` +
      'Please ensure:\n' +
      '  1. Admin user exists in test database\n' +
      '  2. Admin credentials are correct\n' +
      '  3. Login page is accessible\n' +
      '  4. Admin dashboard route exists'
    );
  } finally {
    await browser.close();
  }
}

/**
 * Ensure admin user exists in test database
 * Creates admin user if it doesn't exist
 */
async function ensureAdminUserExists(email: string, password: string): Promise<void> {
  try {
    const supabase = createTestClient();
    
    // Check if admin user already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log(`   Admin user already exists: ${email}`);
      return;
    }
    
    // Create admin user using Supabase Auth Admin API
    // Note: This requires service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    
    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    if (!authData.user) {
      throw new Error('User creation succeeded but no user returned');
    }
    
    // Create admin_users record with owner role
    const { error: userError } = await adminClient
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        role: 'owner',
        is_active: true,
      });
    
    if (userError) {
      // Clean up auth user if admin_users table insert fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }
    
    console.log(`   Created admin user: ${email}`);
  } catch (error) {
    console.warn(`   Warning: Could not ensure admin user exists: ${error instanceof Error ? error.message : String(error)}`);
    console.warn('   Continuing with setup - login may fail if user does not exist');
  }
}

export default globalSetup;
