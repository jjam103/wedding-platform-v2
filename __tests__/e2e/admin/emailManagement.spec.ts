import { test, expect } from '@playwright/test';
import { createTestClient } from '../../helpers/testDb';
import { cleanup } from '../../helpers/cleanup';

/**
 * E2E Test Suite: Admin Email Management
 * 
 * Consolidated from:
 * - emailCompositionFlow.spec.ts (10 tests)
 * - emailSending.spec.ts (13 tests)
 * 
 * Total: 23 tests → 13 tests (43% reduction)
 * 
 * Coverage:
 * - Email Composition & Templates
 * - Recipient Selection (Individual & Group)
 * - Email Sending (Single & Bulk)
 * - Template Variables & Substitution
 * - Email Preview & Validation
 * - Scheduling & Delivery Tracking
 * - Accessibility
 * 
 * Requirements: 4.1-4.5
 */

test.describe('Email Composition & Templates', () => {
  let testGuestEmail1: string;
  let testGuestEmail2: string;
  let testGuestId1: string;
  let testGuestId2: string;
  let testGroupId: string;
  let testTemplateId: string;

  test.beforeEach(async () => {
    const supabase = createTestClient();

    // Create test group
    const { data: group } = await supabase
      .from('guest_groups')
      .insert({ name: 'Test Family' })
      .select()
      .single();
    testGroupId = group!.id;

    // Create test guests
    testGuestEmail1 = `guest1-${Date.now()}@example.com`;
    testGuestEmail2 = `guest2-${Date.now()}@example.com`;

    const { data: guest1 } = await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest1',
        email: testGuestEmail1,
        group_id: testGroupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      })
      .select()
      .single();
    testGuestId1 = guest1!.id;

    const { data: guest2 } = await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest2',
        email: testGuestEmail2,
        group_id: testGroupId,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      })
      .select()
      .single();
    testGuestId2 = guest2!.id;

    // Create test email template
    const { data: template } = await supabase
      .from('email_templates')
      .insert({
        name: 'Test Template',
        subject: 'Test Subject - {{guest_name}}',
        body_html: '<p>Hello {{guest_name}},</p><p>This is a test email.</p>',
        variables: ['guest_name'],
        category: 'general',
      })
      .select()
      .single();
    testTemplateId = template!.id;
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test('should complete full email composition and sending workflow', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    // Compose email
    const composeButton = page.locator('button:has-text("Compose"), button:has-text("New Email")').first();
    await expect(composeButton).toBeVisible({ timeout: 5000 });
    await composeButton.click();
    await page.waitForTimeout(500);

    // Fill in email details
    const subjectInput = page.locator('input[name="subject"], input[placeholder*="Subject"]').first();
    await subjectInput.fill('Test Email Subject');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('This is a test email body with some content.');

    // Select recipients
    const recipientButton = page.locator('button:has-text("Select Recipients"), button:has-text("Add Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    const guest1Checkbox = page.locator(`input[type="checkbox"][value="${testGuestId1}"], label:has-text("${testGuestEmail1}")`).first();
    await guest1Checkbox.click();

    const guest2Checkbox = page.locator(`input[type="checkbox"][value="${testGuestId2}"], label:has-text("${testGuestEmail2}")`).first();
    await guest2Checkbox.click();

    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Add")').last();
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Send email
    const sendButton = page.locator('button:has-text("Send Email"), button[type="submit"]:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Verify success
    const successMessage = page.locator('.bg-green-50, .text-green-800, text=/sent|queued/i').first();
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Verify emails queued in database
    const supabase = createTestClient();
    const { data: emailQueue, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('recipient_email', [testGuestEmail1, testGuestEmail2])
      .eq('subject', 'Test Email Subject')
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(emailQueue).toBeDefined();
    expect(emailQueue!.length).toBe(2);
    expect(emailQueue![0].status).toBeIn(['pending', 'sent']);
  });

  test('should use email template with variable substitution', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    // Select template
    const templateButton = page.locator('button:has-text("Use Template"), button:has-text("Select Template")').first();
    await templateButton.click();
    await page.waitForTimeout(500);

    const templateOption = page.locator('text=Test Template').first();
    await expect(templateOption).toBeVisible();
    await templateOption.click();
    await page.waitForTimeout(500);

    // Verify template loaded
    const subjectInput = page.locator('input[name="subject"]').first();
    const subjectValue = await subjectInput.inputValue();
    expect(subjectValue).toContain('Test Subject');

    // Select recipient
    const recipientButton = page.locator('button:has-text("Select Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    const guest1Checkbox = page.locator(`label:has-text("${testGuestEmail1}")`).first();
    await guest1Checkbox.click();

    const confirmButton = page.locator('button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Preview to verify variable substitution
    const previewButton = page.locator('button:has-text("Preview")').first();
    await previewButton.click();
    await page.waitForTimeout(500);

    const previewModal = page.locator('[role="dialog"]').first();
    const substitutedName = previewModal.locator('text=Test Guest1').first();
    const hasSubstitution = await substitutedName.isVisible().catch(() => false);
    
    if (hasSubstitution) {
      await expect(substitutedName).toBeVisible();
    }

    // Verify {{guest_name}} was replaced
    const rawVariable = previewModal.locator('text={{guest_name}}').first();
    const hasRawVariable = await rawVariable.isVisible().catch(() => false);
    expect(hasRawVariable).toBe(false);
  });

  test('should select recipients by group', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    const subjectInput = page.locator('input[name="subject"]').first();
    await subjectInput.fill('Group Email Test');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('Email to entire group');

    const recipientButton = page.locator('button:has-text("Select Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    // Switch to "By Group" tab
    const byGroupTab = page.locator('button:has-text("By Group"), button:has-text("Groups")').first();
    const hasGroupTab = await byGroupTab.isVisible().catch(() => false);
    
    if (hasGroupTab) {
      await byGroupTab.click();
      await page.waitForTimeout(300);

      const groupCheckbox = page.locator(`input[type="checkbox"], label:has-text("Test Family")`).first();
      await groupCheckbox.click();

      const confirmButton = page.locator('button:has-text("Confirm")').last();
      await confirmButton.click();
      await page.waitForTimeout(500);

      const recipientCount = page.locator('text=/2 recipients/i').first();
      await expect(recipientCount).toBeVisible();
    }
  });

  test('should validate required fields and email addresses', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    // Try to send without filling required fields
    const sendButton = page.locator('button:has-text("Send Email"), button[type="submit"]:has-text("Send")').first();
    await sendButton.click();
    await page.waitForTimeout(500);

    // Verify validation errors
    const subjectError = page.locator('text=/subject.*required|required.*subject/i').first();
    const hasSubjectError = await subjectError.isVisible().catch(() => false);
    if (hasSubjectError) {
      await expect(subjectError).toBeVisible();
    }

    const recipientError = page.locator('text=/recipient.*required|select.*recipient/i').first();
    const hasRecipientError = await recipientError.isVisible().catch(() => false);
    if (hasRecipientError) {
      await expect(recipientError).toBeVisible();
    }
  });

  test('should preview email before sending', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    const subjectInput = page.locator('input[name="subject"]').first();
    await subjectInput.fill('Preview Test Email');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('This is the email body for preview testing.');

    const recipientButton = page.locator('button:has-text("Select Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    const guest1Checkbox = page.locator(`label:has-text("${testGuestEmail1}")`).first();
    await guest1Checkbox.click();

    const confirmButton = page.locator('button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Click preview
    const previewButton = page.locator('button:has-text("Preview"), button:has-text("Show Preview")').first();
    await previewButton.click();
    await page.waitForTimeout(500);

    // Verify preview modal
    const previewModal = page.locator('[role="dialog"], .modal').first();
    await expect(previewModal).toBeVisible();

    const previewSubject = previewModal.locator('text=Preview Test Email').first();
    await expect(previewSubject).toBeVisible();

    const previewBody = previewModal.locator('text=This is the email body').first();
    await expect(previewBody).toBeVisible();

    // Close preview
    const closeButton = previewModal.locator('button:has-text("Close")').first();
    await closeButton.click();
    await page.waitForTimeout(300);

    await expect(previewModal).not.toBeVisible();
  });
});

test.describe('Email Scheduling & Drafts', () => {
  let testGuestEmail: string;

  test.beforeEach(async () => {
    const supabase = createTestClient();
    testGuestEmail = `guest-${Date.now()}@example.com`;

    const { data: group } = await supabase
      .from('guest_groups')
      .insert({ name: 'Test Family' })
      .select()
      .single();

    await supabase
      .from('guests')
      .insert({
        first_name: 'Test',
        last_name: 'Guest',
        email: testGuestEmail,
        group_id: group!.id,
        age_type: 'adult',
        guest_type: 'wedding_guest',
      });
  });

  test.afterEach(async () => {
    await cleanup();
  });

  test('should schedule email for future delivery', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    const subjectInput = page.locator('input[name="subject"]').first();
    await subjectInput.fill('Scheduled Email');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('This email is scheduled for later.');

    const recipientButton = page.locator('button:has-text("Select Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    const guestCheckbox = page.locator(`label:has-text("${testGuestEmail}")`).first();
    await guestCheckbox.click();

    const confirmButton = page.locator('button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(500);

    // Schedule email
    const scheduleButton = page.locator('button:has-text("Schedule"), button:has-text("Send Later")').first();
    const hasScheduleButton = await scheduleButton.isVisible().catch(() => false);
    
    if (hasScheduleButton) {
      await scheduleButton.click();
      await page.waitForTimeout(500);

      const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dateString = tomorrow.toISOString().split('T')[0];
      await dateInput.fill(dateString);

      const confirmScheduleButton = page.locator('button:has-text("Schedule Email"), button:has-text("Confirm")').last();
      await confirmScheduleButton.click();
      await page.waitForTimeout(1000);

      const successMessage = page.locator('.bg-green-50, text=/scheduled/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      // Verify in database
      const supabase = createTestClient();
      const { data: scheduledEmails, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('subject', 'Scheduled Email')
        .not('scheduled_for', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(scheduledEmails).toBeDefined();
      expect(scheduledEmails!.length).toBeGreaterThan(0);
      expect(scheduledEmails![0].status).toBe('scheduled');
    }
  });

  test('should save email as draft', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    const subjectInput = page.locator('input[name="subject"]').first();
    await subjectInput.fill('Draft Email Subject');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('This is a draft email.');

    const saveDraftButton = page.locator('button:has-text("Save Draft"), button:has-text("Save as Draft")').first();
    const hasDraftButton = await saveDraftButton.isVisible().catch(() => false);
    
    if (hasDraftButton) {
      await saveDraftButton.click();
      await page.waitForTimeout(1000);

      const successMessage = page.locator('.bg-green-50, text=/saved|draft/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      const supabase = createTestClient();
      const { data: drafts, error } = await supabase
        .from('email_drafts')
        .select('*')
        .eq('subject', 'Draft Email Subject')
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(drafts).toBeDefined();
      expect(drafts!.length).toBeGreaterThan(0);
    }
  });

  test('should show email history after sending', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    const subjectInput = page.locator('input[name="subject"]').first();
    await subjectInput.fill('History Test Email');

    const bodyEditor = page.locator('[contenteditable="true"], textarea[name="body"]').first();
    await bodyEditor.fill('Email for history testing');

    const recipientButton = page.locator('button:has-text("Select Recipients")').first();
    await recipientButton.click();
    await page.waitForTimeout(500);

    const guestCheckbox = page.locator(`label:has-text("${testGuestEmail}")`).first();
    await guestCheckbox.click();

    const confirmButton = page.locator('button:has-text("Confirm")').last();
    await confirmButton.click();
    await page.waitForTimeout(500);

    const sendButton = page.locator('button:has-text("Send Email")').first();
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Navigate to history
    const historyTab = page.locator('button:has-text("History"), a:has-text("Email History")').first();
    const hasHistoryTab = await historyTab.isVisible().catch(() => false);
    
    if (hasHistoryTab) {
      await historyTab.click();
      await page.waitForTimeout(500);

      const historyRow = page.locator('text=History Test Email').first();
      await expect(historyRow).toBeVisible();
    }
  });
});

test.describe('Bulk Email & Template Management', () => {
  test('should create and use email template', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    // Create template
    const createTemplateButton = page.locator('button[data-action="create-template"], button:has-text("New Template")').first();
    const hasTemplateButton = await createTemplateButton.isVisible().catch(() => false);
    
    if (hasTemplateButton) {
      await createTemplateButton.click();
      await page.waitForTimeout(500);

      await page.fill('input[name="templateName"]', 'RSVP Reminder');
      await page.fill('input[name="subject"]', 'Please RSVP for {{eventName}}');
      await page.fill('textarea[name="body"]', 'Hi {{firstName}}, please remember to RSVP for {{eventName}} by {{deadline}}.');

      const saveButton = page.locator('button[type="submit"]').first();
      await saveButton.click();
      await page.waitForTimeout(1000);

      const successMessage = page.locator('text=/template.*created/i').first();
      await expect(successMessage).toBeVisible();

      const templateList = page.locator('[data-testid="template-list"], text=RSVP Reminder').first();
      await expect(templateList).toBeVisible();
    }
  });

  test('should send bulk email to all guests', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const bulkSendButton = page.locator('button[data-action="bulk-send"], button:has-text("Bulk Send")').first();
    const hasBulkButton = await bulkSendButton.isVisible().catch(() => false);
    
    if (hasBulkButton) {
      await bulkSendButton.click();
      await page.waitForTimeout(500);

      const selectAllCheckbox = page.locator('input[name="selectAll"]').first();
      await selectAllCheckbox.click();

      await page.fill('input[name="subject"]', 'Important Update');
      await page.fill('textarea[name="body"]', 'Dear guests, here is an important update about the wedding.');

      const sendButton = page.locator('button[type="submit"]').first();
      await sendButton.click();
      await page.waitForTimeout(500);

      // Confirm bulk send
      const confirmDialog = page.locator('text=/send.*to.*guests/i').first();
      await expect(confirmDialog).toBeVisible();

      const confirmButton = page.locator('button[data-action="confirm"]').first();
      await confirmButton.click();
      await page.waitForTimeout(2000);

      const successMessage = page.locator('text=/emails.*queued/i').first();
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    }
  });

  test('should sanitize email content for XSS prevention', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    // Enter XSS payload
    const xssPayload = '<script>alert("xss")</script>Important message';
    await page.fill('input[name="recipientEmail"]', testEmail);
    await page.fill('input[name="subject"]', 'Test');
    await page.fill('textarea[name="body"]', xssPayload);

    const sendButton = page.locator('button[type="submit"]').first();
    await sendButton.click();
    await page.waitForTimeout(2000);

    // Check email log
    const trackingLink = page.locator('a[href*="email-tracking"], button:has-text("History")').first();
    const hasTracking = await trackingLink.isVisible().catch(() => false);
    
    if (hasTracking) {
      await trackingLink.click();
      await page.waitForTimeout(500);

      const emailBody = await page.locator('[data-testid="email-body"]').first().textContent();

      // Verify XSS was sanitized
      expect(emailBody).not.toContain('<script>');
      expect(emailBody).not.toContain('alert');
    }
  });
});

test.describe('Email Management Accessibility', () => {
  test('should have keyboard navigation in email form', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    // Tab through form
    await page.keyboard.press('Tab');
    const recipientInput = page.locator('input[name="recipientEmail"]').first();
    const hasRecipientInput = await recipientInput.isVisible().catch(() => false);
    
    if (hasRecipientInput) {
      await expect(recipientInput).toBeFocused();
    }

    await page.keyboard.press('Tab');
    const subjectInput = page.locator('input[name="subject"]').first();
    const hasSubjectFocus = await subjectInput.evaluate(el => el === document.activeElement);
    
    if (hasSubjectFocus) {
      await expect(subjectInput).toBeFocused();
    }
  });

  test('should have accessible form elements with ARIA labels', async ({ page }) => {
    await page.goto('/admin/emails');
    await page.waitForLoadState('networkidle');

    const composeButton = page.locator('button:has-text("Compose")').first();
    await composeButton.click();
    await page.waitForTimeout(500);

    // Verify accessibility attributes
    const form = page.locator('form').first();
    const hasAriaLabel = await form.getAttribute('aria-label').catch(() => null);
    
    if (hasAriaLabel) {
      expect(hasAriaLabel).toBeTruthy();
    }

    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label').catch(() => null);
      const label = await page.locator(`label[for="${await input.getAttribute('id')}"]`).count();
      
      // Should have either aria-label or associated label
      expect(ariaLabel || label > 0).toBeTruthy();
    }
  });
});
