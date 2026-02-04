/**
 * E2E Test: Guest Authentication (Consolidated)
 * 
 * Consolidated from:
 * - guestAuthenticationFlow.spec.ts (7 tests)
 * - guestEmailMatchingAuth.spec.ts (9 tests)
 * - guestMagicLinkAuth.spec.ts (13 tests)
 * 
 * This file contains 15 unique tests covering all guest authentication scenarios:
 * - Email matching authentication
 * - Magic link authentication
 * - Auth state management
 * - Error handling
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.7, 5.9, 5.10, 22.4
 * Tasks: 7.3, 7.4, 62.1
 */

import { test, expect } from '@playwright/test';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

test.describe('Guest Authentication', () => {
  let testGuestEmail: string;
  let testGuestId: string;
  let testGroupId: string;

  test.beforeEach(async () => {
    // Create test data
    const supabase = createTestClient();

    // Create test group
    const { data: group, error: groupError } = await supabase
      .from('guest_groups')
      .insert({
        name: 'Test Family',
        group_owner_id: null,
      })
      .select()
      .single();

    if (groupError || !group) {
      throw new Error('Failed to create test group');
    }

    testGroupId = group.id;

    // Create test guest with email_matching auth method (default)
    testGuestEmail = `test-guest-${Date.now()}@example.com`;
    
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest',
        email: testGuestEmail,
        group_id: testGroupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        auth_method: 'email_matching',
      })
      .select()
      .single();

    if (guestError || !guest) {
      throw new Error('Failed to create test guest');
    }

    testGuestId = guest.id;
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanup();
  });

  // ============================================================================
  // Section 1: Email Matching Authentication (5 tests)
  // ============================================================================

  test('should successfully authenticate with email matching', async ({ page }) => {
    // Navigate to guest login page
    await page.goto('/auth/guest-login');
    await expect(page.locator('h1')).toContainText('Welcome to Our Wedding');

    // Verify Email Login tab is active by default
    const emailTab = page.locator('button:has-text("Email Login")');
    await expect(emailTab).toHaveClass(/bg-emerald-600/);

    // Fill in email and submit
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');

    // Wait for redirect to dashboard
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/guest/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/auth/guest-login');

    // Fill in non-existent email
    await page.fill('#email-matching-input', 'nonexistent@example.com');
    await page.click('button[type="submit"]:has-text("Log In")');

    // Wait for error message
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-800')).toContainText(/not found|not configured/i);

    // Verify we're still on login page
    await expect(page).toHaveURL('/auth/guest-login');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/guest-login');

    // Fill in invalid email
    await page.fill('#email-matching-input', 'invalid-email');
    await page.click('button[type="submit"]:has-text("Log In")');

    // Browser validation should prevent submission
    const emailInput = page.locator('#email-matching-input');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should show loading state during authentication', async ({ page }) => {
    await page.goto('/auth/guest-login');

    // Fill in email
    await page.fill('#email-matching-input', testGuestEmail);

    // Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Log In")');
    await submitButton.click();

    // Verify button is disabled during loading
    await expect(submitButton).toBeDisabled();
  });

  test('should create session cookie on successful authentication', async ({ page, context }) => {
    await page.goto('/auth/guest-login');

    // Fill in email and submit
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');

    // Wait for redirect
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Verify session cookie was set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'guest_session');
    
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.value).toBeTruthy();
  });

  // ============================================================================
  // Section 2: Magic Link Authentication (5 tests)
  // ============================================================================

  test('should successfully request and verify magic link', async ({ page }) => {
    // Update guest to use magic_link auth method
    const supabase = createTestClient();
    await supabase
      .from('guests')
      .update({ auth_method: 'magic_link' })
      .eq('id', testGuestId);

    // Navigate to guest login page
    await page.goto('/auth/guest-login');

    // Switch to Magic Link tab
    await page.click('button:has-text("Magic Link")');
    const magicLinkTab = page.locator('button:has-text("Magic Link")');
    await expect(magicLinkTab).toHaveClass(/bg-emerald-600/);

    // Fill in email and submit
    await page.fill('#magic-link-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Send Magic Link")');

    // Wait for success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    await expect(page.locator('.text-green-800')).toContainText(/check your email/i);
    await expect(page.locator('.text-green-800')).toContainText('15 minutes');

    // Get the token from database (simulating clicking email link)
    const { data: tokens, error } = await supabase
      .from('magic_link_tokens')
      .select('token')
      .eq('guest_id', testGuestId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(error).toBeNull();
    expect(tokens).toHaveLength(1);
    const token = tokens![0].token;

    // Navigate to verification page with token
    await page.goto(`/auth/guest-login/verify?token=${token}`);

    // Wait for verification and redirect
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL('/guest/dashboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show success message after requesting magic link', async ({ page }) => {
    // Update guest to use magic_link auth method
    const supabase = createTestClient();
    await supabase
      .from('guests')
      .update({ auth_method: 'magic_link' })
      .eq('id', testGuestId);

    await page.goto('/auth/guest-login');

    // Switch to Magic Link tab
    await page.click('button:has-text("Magic Link")');

    // Fill in email and submit
    await page.fill('#magic-link-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Send Magic Link")');

    // Verify success message
    await expect(page.locator('.bg-green-50')).toBeVisible();
    await expect(page.locator('.text-green-800')).toContainText('Check your email for a login link');
    await expect(page.locator('.text-green-800')).toContainText('15 minutes');

    // Verify email input was cleared
    const emailInput = page.locator('#magic-link-input');
    await expect(emailInput).toHaveValue('');
  });

  test('should show error for expired magic link', async ({ page }) => {
    // Create an expired token directly in database
    const supabase = createTestClient();
    
    // Generate token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Create expired token (expired 1 hour ago)
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000);
    
    await supabase.from('magic_link_tokens').insert({
      guest_id: testGuestId,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: 'test',
      user_agent: 'test',
    });

    // Navigate to verification page with expired token
    await page.goto(`/auth/guest-login/verify?token=${token}`);

    // Verify error message
    await expect(page.locator('h1')).toContainText('Link Expired');
    await expect(page.locator('p')).toContainText('This magic link has expired');
    await expect(page.locator('p')).toContainText('15 minutes');

    // Verify action buttons are present
    await expect(page.locator('button:has-text("Request New Magic Link")')).toBeVisible();
    await expect(page.locator('button:has-text("Go to Home Page")')).toBeVisible();
  });

  test('should show error for already used magic link', async ({ page }) => {
    // Update guest to use magic_link auth method
    const supabase = createTestClient();
    await supabase
      .from('guests')
      .update({ auth_method: 'magic_link' })
      .eq('id', testGuestId);

    // Request magic link
    await page.goto('/auth/guest-login');
    await page.click('button:has-text("Magic Link")');
    await page.fill('#magic-link-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Send Magic Link")');
    await expect(page.locator('.bg-green-50')).toBeVisible();

    // Get token from database
    const { data: tokens } = await supabase
      .from('magic_link_tokens')
      .select('token')
      .eq('guest_id', testGuestId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);

    const token = tokens![0].token;

    // Use the token once
    await page.goto(`/auth/guest-login/verify?token=${token}`);
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Try to use the same token again
    await page.goto(`/auth/guest-login/verify?token=${token}`);

    // Verify error message
    await expect(page.locator('h1')).toContainText('Link Already Used');
    await expect(page.locator('p')).toContainText('This magic link has already been used');
    await expect(page.locator('p')).toContainText('Each link can only be used once');
  });

  test('should show error for invalid or missing token', async ({ page }) => {
    // Test invalid token format
    await page.goto('/auth/guest-login/verify?token=invalid-token');
    await expect(page.locator('h1')).toContainText('Invalid Link');
    await expect(page.locator('p')).toContainText(/invalid|format/i);

    // Test missing token
    await page.goto('/auth/guest-login/verify');
    await expect(page.locator('h1')).toContainText('Missing Token');
    await expect(page.locator('p')).toContainText('No verification token was provided');

    // Test non-existent token (valid format but doesn't exist)
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    await page.goto(`/auth/guest-login/verify?token=${token}`);
    await expect(page.locator('h1')).toContainText('Invalid Link');
    await expect(page.locator('p')).toContainText(/invalid|expired/i);
  });

  // ============================================================================
  // Section 3: Auth State Management (3 tests)
  // ============================================================================

  test('should complete logout flow', async ({ page, context }) => {
    // Step 1: Login first
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Step 2: Verify we're logged in
    await expect(page).toHaveURL('/guest/dashboard');
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'guest_session');
    expect(sessionCookie).toBeDefined();

    // Step 3: Find and click logout button
    const logoutButton = page.locator('button:has-text("Log Out"), button:has-text("Logout"), a:has-text("Log Out")').first();
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Step 4: Wait for redirect to login page
    await page.waitForURL('/auth/guest-login', { timeout: 5000 });

    // Step 5: Verify we're on login page
    await expect(page).toHaveURL('/auth/guest-login');
    await expect(page.locator('h1')).toContainText('Welcome to Our Wedding');

    // Step 6: Verify session cookie was cleared
    const cookiesAfterLogout = await context.cookies();
    const sessionCookieAfterLogout = cookiesAfterLogout.find(c => c.name === 'guest_session');
    expect(sessionCookieAfterLogout).toBeUndefined();

    // Step 7: Verify cannot access protected pages
    await page.goto('/guest/dashboard');
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/auth/guest-login');
  });

  test('should persist authentication across page refreshes', async ({ page }) => {
    // Step 1: Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Step 2: Navigate to different pages
    await page.goto('/guest/events');
    await expect(page).toHaveURL('/guest/events');

    // Step 3: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 4: Verify still authenticated
    await expect(page).toHaveURL('/guest/events');
    await expect(page.locator('h1')).toBeVisible();

    // Step 5: Navigate to another page
    await page.goto('/guest/activities');
    await expect(page).toHaveURL('/guest/activities');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should switch between authentication tabs', async ({ page }) => {
    await page.goto('/auth/guest-login');

    // Verify Email Login tab is active
    const emailTab = page.locator('button:has-text("Email Login")');
    const magicLinkTab = page.locator('button:has-text("Magic Link")');
    
    await expect(emailTab).toHaveClass(/bg-emerald-600/);
    await expect(magicLinkTab).not.toHaveClass(/bg-emerald-600/);

    // Fill in email on Email Login tab
    await page.fill('#email-matching-input', 'test@example.com');

    // Click Magic Link tab
    await magicLinkTab.click();

    // Verify Magic Link tab is now active
    await expect(magicLinkTab).toHaveClass(/bg-emerald-600/);
    await expect(emailTab).not.toHaveClass(/bg-emerald-600/);

    // Verify form content changed and email input is empty
    await expect(page.locator('#magic-link-input')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Send Magic Link")')).toBeVisible();
    const magicLinkInput = page.locator('#magic-link-input');
    await expect(magicLinkInput).toHaveValue('');

    // Fill in email on Magic Link tab
    await page.fill('#magic-link-input', 'another@example.com');

    // Switch back to Email Login
    await emailTab.click();

    // Verify Email Login tab is active again and email input is empty
    await expect(emailTab).toHaveClass(/bg-emerald-600/);
    await expect(page.locator('#email-matching-input')).toBeVisible();
    const emailInput = page.locator('#email-matching-input');
    await expect(emailInput).toHaveValue('');
  });

  // ============================================================================
  // Section 4: Error Handling (2 tests)
  // ============================================================================

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Test 1: Non-existent email
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', 'nonexistent@example.com');
    await page.click('button[type="submit"]:has-text("Log In")');
    
    await expect(page.locator('.bg-red-50')).toBeVisible();
    await expect(page.locator('.text-red-800')).toContainText(/not found|not configured/i);
    await expect(page).toHaveURL('/auth/guest-login');

    // Test 2: Invalid email format
    await page.fill('#email-matching-input', 'invalid-email');
    await page.click('button[type="submit"]:has-text("Log In")');
    
    const emailInput = page.locator('#email-matching-input');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);

    // Test 3: Expired magic link
    await page.click('button:has-text("Magic Link")');
    
    // Create an expired token
    const supabase = createTestClient();
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000);
    await supabase.from('magic_link_tokens').insert({
      guest_id: testGuestId,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: 'test',
      user_agent: 'test',
    });

    await page.goto(`/auth/guest-login/verify?token=${token}`);
    await expect(page.locator('h1')).toContainText('Link Expired');
    await expect(page.locator('p')).toContainText('This magic link has expired');
  });

  test('should log authentication events in audit log', async ({ page }) => {
    // Step 1: Login
    await page.goto('/auth/guest-login');
    await page.fill('#email-matching-input', testGuestEmail);
    await page.click('button[type="submit"]:has-text("Log In")');
    await page.waitForURL('/guest/dashboard', { timeout: 5000 });

    // Step 2: Verify login audit log entry
    const supabase = createTestClient();
    const { data: loginLogs, error: loginError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', testGuestId)
      .eq('action', 'guest_login')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(loginError).toBeNull();
    expect(loginLogs).toHaveLength(1);
    expect(loginLogs![0].details.auth_method).toBe('email_matching');
    expect(loginLogs![0].details.email).toBe(testGuestEmail);

    // Step 3: Logout
    const logoutButton = page.locator('button:has-text("Log Out"), button:has-text("Logout")').first();
    await logoutButton.click();
    await page.waitForURL('/auth/guest-login', { timeout: 5000 });

    // Step 4: Verify logout audit log entry
    const { data: logoutLogs, error: logoutError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', testGuestId)
      .eq('action', 'guest_logout')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(logoutError).toBeNull();
    expect(logoutLogs).toHaveLength(1);
  });
});
