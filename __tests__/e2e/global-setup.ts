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
  // Note: E2E database uses admin@example.com, not admin@test.com
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'test-password-123';
  
  // Try to ensure admin user exists (but don't fail if it already exists)
  try {
    await ensureAdminUserExists(adminEmail, adminPassword);
  } catch (error) {
    console.log(`   Note: Admin user setup skipped (${error instanceof Error ? error.message : String(error)})`);
    console.log(`   Will attempt login with existing credentials...`);
  }
  
  // Step 1: Authenticate using Supabase API to get session
  console.log(`   Authenticating via Supabase API...`);
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  
  if (authError || !authData.session) {
    throw new Error(
      `Failed to authenticate: ${authError?.message || 'No session created'}\n` +
      'Please ensure:\n' +
      '  1. Admin user exists in test database\n' +
      '  2. Admin credentials are correct (E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD)\n' +
      '  3. Supabase credentials are correct'
    );
  }
  
  console.log(`   ✅ API authentication successful (User ID: ${authData.user.id})`);
  
  // Step 2: Create storage state from API session
  // This is more reliable than browser login form
  console.log(`   Creating storage state from API session...`);
  
  // Ensure .auth directory exists
  const fs = await import('fs');
  const path = await import('path');
  const authDir = path.join(process.cwd(), '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true});
  }
  
  // Create Playwright storage state format
  // This matches what Playwright's context.storageState() would create
  const storageState = {
    cookies: [
      {
        name: 'sb-olcqaawrpnanioaorfer-auth-token',
        value: JSON.stringify({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_in: authData.session.expires_in,
          expires_at: authData.session.expires_at,
          token_type: authData.session.token_type,
          user: authData.session.user,
        }),
        domain: new URL(baseURL).hostname,
        path: '/',
        expires: authData.session.expires_at || -1,
        httpOnly: false,
        secure: baseURL.startsWith('https'),
        sameSite: 'Lax',
      },
    ],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          {
            name: 'sb-olcqaawrpnanioaorfer-auth-token',
            value: JSON.stringify({
              access_token: authData.session.access_token,
              refresh_token: authData.session.refresh_token,
              expires_in: authData.session.expires_in,
              expires_at: authData.session.expires_at,
              token_type: authData.session.token_type,
              user: authData.session.user,
            }),
          },
        ],
      },
    ],
  };
  
  // Save storage state to file
  const authStatePath = path.join(authDir, 'admin.json');
  fs.writeFileSync(authStatePath, JSON.stringify(storageState, null, 2));
  
  console.log(`   ✅ Storage state created from API session`);
  console.log(`   Auth state saved to: .auth/admin.json`);
  
  // Step 3: Verify authentication works by loading admin page
  console.log(`   Verifying authentication...`);
  const browser = await chromium.launch();
  
  try {
    const context = await browser.newContext({
      storageState: authStatePath,
    });
    const page = await context.newPage();
    
    // Navigate to admin page
    await page.goto(`${baseURL}/admin`, {
      waitUntil: 'commit',
      timeout: 30000,
    });
    await page.waitForTimeout(1000); // Wait for React hydration
    
    // Check current URL - should not redirect to login
    const currentURL = page.url();
    console.log(`   Current URL: ${currentURL}`);
    
    if (currentURL.includes('/auth/login')) {
      throw new Error(
        `Authentication failed - redirected to login page.\n` +
        `Please verify:\n` +
        `  1. Admin user exists: ${adminEmail}\n` +
        `  2. Session is valid\n` +
        `  3. Storage state format is correct`
      );
    }
    
    // Verify admin UI is visible
    const hasAdminUI = await page.locator('nav, [role="navigation"], main').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!hasAdminUI) {
      throw new Error('Admin UI not visible after authentication');
    }
    
    console.log(`   ✅ Admin UI is visible`);
    console.log(`   ✅ Authentication verified`);
    console.log(`   Logged in as: ${adminEmail}`);
  } catch (error) {
    throw new Error(
      `Failed to verify admin authentication: ${error instanceof Error ? error.message : String(error)}\n` +
      'Please ensure:\n' +
      '  1. Admin user exists in test database\n' +
      '  2. Supabase credentials are correct\n' +
      '  3. Storage state format is correct'
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
    
    // Check if admin user already exists in users table
    // Note: RLS policies check users table via get_user_role() function
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log(`   Admin user already exists: ${email} (role: ${existingUser.role})`);
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
    
    // Create users record with super_admin role
    // Note: RLS policies check users table via get_user_role() function
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'super_admin',
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
