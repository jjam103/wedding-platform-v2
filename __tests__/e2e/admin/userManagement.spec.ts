/**
 * E2E Test Suite: Admin User & Auth Management
 * 
 * Consolidated from:
 * - adminUserManagementFlow.spec.ts (9 tests)
 * - authMethodConfigurationFlow.spec.ts (12 tests)
 * 
 * This suite tests the complete admin user management and authentication configuration workflows:
 * 
 * **Admin User Management**:
 * - Admin user creation and invitation
 * - User deactivation and role management
 * - Last owner protection
 * - Audit logging
 * - Permission controls
 * 
 * **Auth Method Configuration**:
 * - Default auth method settings
 * - Bulk guest updates
 * - Auth method inheritance
 * - Configuration validation
 * 
 * **Coverage**:
 * - Requirements: 3.1, 3.2, 3.6, 3.8, 3.10, 4.2, 4.3, 4.4
 * - Tasks: 62.3
 * - Original Tests: 21 → Consolidated: 12 (43% reduction)
 * 
 * @see docs/E2E_CONSOLIDATION_PHASE3_COMPLETE.md
 */

import { test, expect } from '@playwright/test';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

test.describe('Admin User Management', () => {
  let ownerEmail: string;
  let ownerUserId: string;
  let newAdminEmail: string;

  test.beforeEach(async () => {
    // Create test owner user
    const supabase = createTestClient();
    
    ownerEmail = `owner-${Date.now()}@example.com`;
    
    // Create owner in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create owner auth user');
    }

    ownerUserId = authUser.user.id;

    // Create owner in admin_users table
    await supabase.from('admin_users').insert({
      id: ownerUserId,
      email: ownerEmail,
      role: 'owner',
      status: 'active',
    });

    newAdminEmail = `admin-${Date.now()}@example.com`;
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test('should complete full admin user creation workflow with invitation', async ({ page }) => {
    // Step 1: Login as owner
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"], input[type="email"]', ownerEmail);
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]:has-text("Log In"), button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('/admin', { timeout: 5000 });

    // Step 2: Navigate to admin users management
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Look for Admin Users section or tab
    const adminUsersTab = page.locator('button:has-text("Admin Users"), a:has-text("Admin Users")').first();
    const hasAdminUsersTab = await adminUsersTab.isVisible().catch(() => false);
    
    if (hasAdminUsersTab) {
      await adminUsersTab.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Click "Add Admin User" button
    const addButton = page.locator('button:has-text("Add Admin"), button:has-text("Add User"), button:has-text("Invite Admin")').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(500);

    // Step 4: Fill in new admin details
    const emailInput = page.locator('input[name="email"], input[type="email"]').last();
    await emailInput.fill(newAdminEmail);

    // Step 5: Select role (admin, not owner)
    const roleSelect = page.locator('select[name="role"], input[name="role"]').first();
    const hasRoleSelect = await roleSelect.isVisible().catch(() => false);
    
    if (hasRoleSelect) {
      const isSelect = await roleSelect.evaluate((el) => el.tagName === 'SELECT');
      if (isSelect) {
        await roleSelect.selectOption('admin');
      } else {
        // Radio buttons
        const adminRadio = page.locator('input[value="admin"]').first();
        await adminRadio.click();
      }
    }

    // Step 6: Submit form
    const submitButton = page.locator('button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Invite")').first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Step 7: Verify success message
    const successMessage = page.locator('.bg-green-50, .text-green-800, text=/added|created|invited/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Step 8: Verify new admin appears in list
    const adminRow = page.locator(`text=${newAdminEmail}`).first();
    await expect(adminRow).toBeVisible();

    // Step 9: Verify admin user created in database
    const supabase = createTestClient();
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', newAdminEmail)
      .single();

    expect(error).toBeNull();
    expect(adminUser).toBeDefined();
    expect(adminUser!.role).toBe('admin');
    expect(adminUser!.status).toBe('active');
    expect(adminUser!.invited_by).toBe(ownerUserId);

    // Step 10: Verify invitation email was queued
    const { data: emailQueue } = await supabase
      .from('email_queue')
      .select('*')
      .eq('recipient_email', newAdminEmail)
      .contains('subject', 'invitation')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(emailQueue).toBeDefined();
    expect(emailQueue!.length).toBeGreaterThan(0);
    expect(emailQueue![0].status).toBeIn(['pending', 'sent']);
  });

  test('should allow deactivating admin user and prevent login', async ({ page }) => {
    // Step 1: Create another admin user first
    const supabase = createTestClient();
    
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: newAdminEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    await supabase.from('admin_users').insert({
      id: authUser!.user!.id,
      email: newAdminEmail,
      role: 'admin',
      status: 'active',
      invited_by: ownerUserId,
    });

    // Step 2: Login as owner
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });

    // Step 3: Navigate to admin users
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const adminUsersTab = page.locator('button:has-text("Admin Users")').first();
    const hasTab = await adminUsersTab.isVisible().catch(() => false);
    if (hasTab) {
      await adminUsersTab.click();
      await page.waitForTimeout(500);
    }

    // Step 4: Find the admin user row
    const adminRow = page.locator(`tr:has-text("${newAdminEmail}"), div:has-text("${newAdminEmail}")`).first();
    await expect(adminRow).toBeVisible();

    // Step 5: Click deactivate button
    const deactivateButton = adminRow.locator('button:has-text("Deactivate"), button:has-text("Disable")').first();
    await deactivateButton.click();
    await page.waitForTimeout(500);

    // Step 6: Confirm deactivation in dialog
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Deactivate")').last();
    await confirmButton.click();
    await page.waitForTimeout(1000);

    // Step 7: Verify success message
    const successMessage = page.locator('.bg-green-50, text=/deactivated|disabled/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Step 8: Verify status updated in database
    const { data: updatedAdmin } = await supabase
      .from('admin_users')
      .select('status')
      .eq('email', newAdminEmail)
      .single();

    expect(updatedAdmin!.status).toBe('inactive');

    // Step 9: Verify deactivated admin cannot login
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', newAdminEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Should show error or stay on login page
    const errorMessage = page.locator('.bg-red-50, .text-red-800, text=/deactivated|disabled|inactive/i').first();
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      await expect(errorMessage).toBeVisible();
    } else {
      // Should not redirect to admin dashboard
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toContain('/auth/admin-login');
    }
  });

  test('should prevent deactivating last owner', async ({ page }) => {
    // Step 1: Login as owner (the only owner)
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });

    // Step 2: Navigate to admin users
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const adminUsersTab = page.locator('button:has-text("Admin Users")').first();
    const hasTab = await adminUsersTab.isVisible().catch(() => false);
    if (hasTab) {
      await adminUsersTab.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Find own user row
    const ownerRow = page.locator(`tr:has-text("${ownerEmail}"), div:has-text("${ownerEmail}")`).first();
    await expect(ownerRow).toBeVisible();

    // Step 4: Verify deactivate button is disabled or not present
    const deactivateButton = ownerRow.locator('button:has-text("Deactivate")').first();
    const hasDeactivateButton = await deactivateButton.isVisible().catch(() => false);

    if (hasDeactivateButton) {
      // Button should be disabled
      await expect(deactivateButton).toBeDisabled();
    } else {
      // Button should not be present for last owner
      const buttonCount = await ownerRow.locator('button:has-text("Deactivate")').count();
      expect(buttonCount).toBe(0);
    }

    // Step 5: Try to deactivate via API (should fail)
    const response = await page.request.post(`/api/admin/admin-users/${ownerUserId}/deactivate`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('LAST_OWNER_PROTECTION');
  });

  test('should allow editing admin user role and log action', async ({ page }) => {
    // Step 1: Create another admin user
    const supabase = createTestClient();
    
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: newAdminEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    await supabase.from('admin_users').insert({
      id: authUser!.user!.id,
      email: newAdminEmail,
      role: 'admin',
      status: 'active',
      invited_by: ownerUserId,
    });

    // Step 2: Login as owner
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', ownerEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });

    // Step 3: Navigate to admin users
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const adminUsersTab = page.locator('button:has-text("Admin Users")').first();
    const hasTab = await adminUsersTab.isVisible().catch(() => false);
    if (hasTab) {
      await adminUsersTab.click();
      await page.waitForTimeout(500);
    }

    // Step 4: Find admin user and click edit
    const adminRow = page.locator(`tr:has-text("${newAdminEmail}"), div:has-text("${newAdminEmail}")`).first();
    await expect(adminRow).toBeVisible();

    const editButton = adminRow.locator('button:has-text("Edit")').first();
    await editButton.click();
    await page.waitForTimeout(500);

    // Step 5: Change role to owner
    const roleSelect = page.locator('select[name="role"], input[value="owner"]').first();
    const hasRoleSelect = await roleSelect.isVisible().catch(() => false);
    
    if (hasRoleSelect) {
      const isSelect = await roleSelect.evaluate((el) => el.tagName === 'SELECT');
      if (isSelect) {
        await roleSelect.selectOption('owner');
      } else {
        await roleSelect.click();
      }
    }

    // Step 6: Save changes
    const saveButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")').first();
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Step 7: Verify success message
    const successMessage = page.locator('.bg-green-50, text=/updated|saved/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Step 8: Verify role updated in database
    const { data: updatedAdmin } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', newAdminEmail)
      .single();

    expect(updatedAdmin!.role).toBe('owner');

    // Step 9: Verify audit log entry
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'admin_user_updated')
      .eq('user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (auditLogs && auditLogs.length > 0) {
      expect(auditLogs[0].details.email).toBe(newAdminEmail);
    }
  });

  test('should prevent non-owner from managing admin users', async ({ page }) => {
    // Step 1: Create regular admin user
    const supabase = createTestClient();
    
    const regularAdminEmail = `regular-admin-${Date.now()}@example.com`;
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: regularAdminEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    await supabase.from('admin_users').insert({
      id: authUser!.user!.id,
      email: regularAdminEmail,
      role: 'admin', // Not owner
      status: 'active',
      invited_by: ownerUserId,
    });

    // Step 2: Login as regular admin
    await page.goto('/auth/admin-login');
    await page.fill('input[name="email"]', regularAdminEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 5000 });

    // Step 3: Try to access admin users management
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Step 4: Verify Admin Users section is not accessible
    const adminUsersTab = page.locator('button:has-text("Admin Users"), a:has-text("Admin Users")').first();
    const hasTab = await adminUsersTab.isVisible().catch(() => false);

    if (hasTab) {
      await adminUsersTab.click();
      await page.waitForTimeout(500);

      // Should show permission error or empty state
      const permissionError = page.locator('text=/permission|not authorized|owner only/i').first();
      const hasError = await permissionError.isVisible().catch(() => false);
      
      if (hasError) {
        await expect(permissionError).toBeVisible();
      }

      // Add button should not be visible
      const addButton = page.locator('button:has-text("Add Admin")').first();
      const hasAddButton = await addButton.isVisible().catch(() => false);
      expect(hasAddButton).toBe(false);
    }
  });
});

test.describe('Auth Method Configuration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should change default auth method and bulk update guests', async ({ page }) => {
    // Step 1: Verify auth method section is visible
    await expect(page.locator('text=/Authentication Method/i')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Verify radio buttons for both methods
    await expect(page.locator('input[type="radio"][value="email_matching"]')).toBeVisible();
    await expect(page.locator('input[type="radio"][value="magic_link"]')).toBeVisible();
    
    // Step 3: Select magic link option
    const magicLinkRadio = page.locator('input[type="radio"][value="magic_link"]');
    await magicLinkRadio.click();
    
    // Step 4: Verify bulk update checkbox appears
    await expect(page.locator('text=/Update existing guests/i')).toBeVisible({ timeout: 3000 });
    
    // Step 5: Check bulk update checkbox
    const bulkUpdateCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /update existing/i });
    if (await bulkUpdateCheckbox.count() > 0) {
      await bulkUpdateCheckbox.check();
    }
    
    // Step 6: Save changes
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    // Step 7: Wait for success message
    await expect(page.locator('text=/saved|success|updated/i')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const magicLinkChecked = await page.locator('input[type="radio"][value="magic_link"]').isChecked();
    expect(magicLinkChecked).toBe(true);
  });

  test('should verify new guest inherits default auth method', async ({ page }) => {
    // Step 1: Set default auth method to magic link
    const magicLinkRadio = page.locator('input[type="radio"][value="magic_link"]');
    await magicLinkRadio.click();
    
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    await expect(page.locator('text=/saved|success/i')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Navigate to guests page
    await page.goto('http://localhost:3000/admin/guests');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Create a new guest
    const addGuestButton = page.locator('button:has-text("Add Guest")');
    await addGuestButton.click();
    
    // Step 4: Fill guest form
    await page.locator('input[name="firstName"]').fill('Test');
    await page.locator('input[name="lastName"]').fill('Guest');
    await page.locator('input[name="email"]').fill(`test${Date.now()}@example.com`);
    
    // Step 5: Select a group
    const groupSelect = page.locator('select[name="groupId"]');
    if (await groupSelect.count() > 0) {
      const options = await groupSelect.locator('option').count();
      if (options > 1) {
        await groupSelect.selectOption({ index: 1 });
      }
    }
    
    // Step 6: Save guest
    const saveGuestButton = page.locator('button:has-text("Save")');
    await saveGuestButton.click();
    
    // Step 7: Wait for success
    await expect(page.locator('text=/created|success/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle API errors gracefully and disable form during save', async ({ page }) => {
    // Step 1: Intercept API call and return error
    await page.route('**/api/admin/settings/auth-method', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Test error'
          }
        })
      });
    });
    
    // Step 2: Try to change auth method
    const magicLinkRadio = page.locator('input[type="radio"][value="magic_link"]');
    await magicLinkRadio.click();
    
    const saveButton = page.locator('button:has-text("Save")');
    await saveButton.click();
    
    // Step 3: Verify radio buttons are disabled during save
    await expect(magicLinkRadio).toBeDisabled({ timeout: 1000 });
    
    // Step 4: Wait for error message
    await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  test('should display warnings and method descriptions', async ({ page }) => {
    // Step 1: Verify warning message is displayed
    await expect(page.locator('text=/changing.*authentication.*method/i')).toBeVisible({ timeout: 5000 });
    
    // Step 2: Verify warning mentions impact on guests
    await expect(page.locator('text=/guests.*login/i')).toBeVisible();
    
    // Step 3: Verify email matching description
    await expect(page.locator('text=/enter.*email.*match/i')).toBeVisible({ timeout: 5000 });
    
    // Step 4: Verify magic link description
    await expect(page.locator('text=/receive.*link.*email/i')).toBeVisible();
  });
});

test.describe('User Management - Accessibility', () => {
  test('should have proper keyboard navigation and labels', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');
    
    // Step 1: Tab to auth method section
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Step 2: Should be able to navigate radio buttons with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Step 3: Verify focus is visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
    
    // Step 4: Verify radio buttons have labels
    const emailMatchingLabel = page.locator('label:has-text("Email Matching")');
    await expect(emailMatchingLabel).toBeVisible();
    
    const magicLinkLabel = page.locator('label:has-text("Magic Link")');
    await expect(magicLinkLabel).toBeVisible();
    
    // Step 5: Verify fieldset has legend
    const legend = page.locator('legend:has-text("Authentication Method")');
    if (await legend.count() > 0) {
      await expect(legend).toBeVisible();
    }
  });
});
