/**
 * Guest Authentication Helpers for E2E Tests
 * 
 * Provides reusable functions for guest authentication in E2E tests.
 * Handles environment variable access, session creation, and verification.
 * 
 * @module guestAuthHelpers
 */

import { Page } from '@playwright/test';
import { createServiceClient } from './testDb';

/**
 * Create a guest session in the database and set the cookie in the browser
 * 
 * ENHANCED: Now uses API endpoint for session creation to ensure proper
 * authentication flow and cookie setting mechanism.
 * 
 * @param page - Playwright page object
 * @param guestId - ID of the guest to create session for
 * @returns Session token
 * 
 * @example
 * const token = await createGuestSessionForTest(page, 'guest-123');
 */
export async function createGuestSessionForTest(
  page: Page,
  guestId: string
): Promise<string> {
  const supabase = createServiceClient();
  
  console.log('[E2E Test] Creating guest session for:', guestId);
  
  // Get guest email for API authentication
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .select('email')
    .eq('id', guestId)
    .single();
  
  if (guestError || !guest) {
    throw new Error(`Failed to find guest: ${guestError?.message}`);
  }
  
  console.log('[E2E Test] Guest email:', guest.email);
  
  // Use API endpoint to create session (ensures proper flow)
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const response = await page.request.post(`${baseUrl}/api/auth/guest/email-match`, {
    data: { email: guest.email },
  });
  
  if (!response.ok()) {
    const errorText = await response.text();
    console.error('[E2E Test] API error:', errorText);
    throw new Error(`Failed to create session via API: ${response.status()}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(`Session creation failed: ${result.error?.message}`);
  }
  
  console.log('[E2E Test] Session created via API');
  
  // Wait for session to be fully created in database
  let attempts = 0;
  let sessionToken: string | null = null;
  
  while (attempts < 10 && !sessionToken) {
    const { data: sessions } = await supabase
      .from('guest_sessions')
      .select('token')
      .eq('guest_id', guestId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (sessions && sessions.length > 0) {
      sessionToken = sessions[0].token;
      break;
    }
    
    attempts++;
    await page.waitForTimeout(200);
  }
  
  if (!sessionToken) {
    throw new Error('Session token not found after creation');
  }
  
  console.log('[E2E Test] Session token retrieved:', sessionToken.substring(0, 8));
  
  // Set guest_session cookie in browser
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await page.context().addCookies([{
    name: 'guest_session',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    expires: Math.floor(expiresAt.getTime() / 1000),
  }]);
  
  console.log('[E2E Test] Guest session cookie set in browser');
  
  // Verify cookie was set
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'guest_session');
  
  if (!sessionCookie) {
    throw new Error('Guest session cookie was not set');
  }
  
  console.log('[E2E Test] Cookie verified:', sessionCookie.value.substring(0, 8));
  
  // Wait for cookie to fully propagate
  await page.waitForTimeout(500);
  
  return sessionToken;
}

/**
 * Authenticate as a guest user by email
 * Creates guest if doesn't exist, creates session, and sets cookie
 * 
 * @param page - Playwright page object
 * @param email - Guest email address
 * @param groupId - Optional group ID for the guest
 * @returns Guest ID and session token
 * 
 * @example
 * const { guestId, token } = await authenticateAsGuestForTest(page, 'test@example.com');
 */
export async function authenticateAsGuestForTest(
  page: Page,
  email: string,
  groupId?: string
): Promise<{ guestId: string; token: string }> {
  const supabase = createServiceClient();
  
  console.log('[E2E Test] Authenticating as guest:', email);
  
  // Find existing guest
  let { data: guest } = await supabase
    .from('guests')
    .select('*')
    .eq('email', email)
    .single();
  
  if (!guest) {
    console.log('[E2E Test] Guest not found, creating new guest');
    
    // Create test group if not provided
    let testGroupId = groupId;
    if (!testGroupId) {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: `Test Group ${Date.now()}`,
        })
        .select()
        .single();
      
      if (groupError || !group) {
        throw new Error(`Failed to create test group: ${groupError?.message}`);
      }
      
      testGroupId = group.id;
    }
    
    // Create test guest
    const { data: newGuest, error } = await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest',
        email: email,
        group_id: testGroupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        auth_method: 'email_matching',
      })
      .select()
      .single();
    
    if (error || !newGuest) {
      console.error('[E2E Test] Failed to create guest:', error);
      throw new Error(`Failed to create guest: ${error?.message}`);
    }
    
    guest = newGuest;
    console.log('[E2E Test] Guest created:', guest.id);
  } else {
    console.log('[E2E Test] Using existing guest:', guest.id);
  }
  
  // Create session
  const token = await createGuestSessionForTest(page, guest.id);
  
  return { guestId: guest.id, token };
}

/**
 * Navigate to guest dashboard and verify authentication
 * 
 * @param page - Playwright page object
 * @param timeout - Optional timeout in milliseconds (default: 30000)
 * 
 * @example
 * await navigateToGuestDashboard(page);
 */
export async function navigateToGuestDashboard(
  page: Page,
  timeout: number = 60000
): Promise<void> {
  console.log('[E2E Test] Navigating to guest dashboard');
  
  await page.goto('/guest/dashboard', { 
    waitUntil: 'domcontentloaded',
    timeout 
  });
  
  await page.waitForSelector('h1, h2, [data-testid="guest-dashboard"]', { 
    timeout: 10000 
  });
  
  const currentUrl = page.url();
  if (currentUrl.includes('/auth/guest-login')) {
    await page.screenshot({ 
      path: 'test-results/guest-auth-failure.png', 
      fullPage: true 
    });
    throw new Error('Guest authentication failed - redirected to login page');
  }
  
  console.log('[E2E Test] Successfully navigated to guest dashboard');
}

/**
 * Clean up guest session and related data
 * 
 * @param guestId - ID of the guest to clean up
 * @param groupId - Optional group ID to clean up
 * 
 * @example
 * await cleanupGuestSession('guest-123', 'group-456');
 */
export async function cleanupGuestSession(
  guestId: string,
  groupId?: string
): Promise<void> {
  const supabase = createServiceClient();
  
  console.log('[E2E Test] Cleaning up guest session:', guestId);
  
  // Delete guest sessions
  await supabase
    .from('guest_sessions')
    .delete()
    .eq('guest_id', guestId);
  
  // Delete guest
  await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);
  
  // Delete group if provided
  if (groupId) {
    await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
  }
  
  console.log('[E2E Test] Cleanup complete');
}

export default {
  createGuestSessionForTest,
  authenticateAsGuestForTest,
  navigateToGuestDashboard,
  cleanupGuestSession,
};
