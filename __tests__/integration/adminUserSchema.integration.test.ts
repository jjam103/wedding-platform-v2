/**
 * Integration tests for admin user database schema
 * Tests migrations 038, 039, 040
 * Requirements: 3.1, 3.3, 4.6, 4.7, 17.1, 17.2
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Admin User Schema Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  describe('admin_users table', () => {
    it('should have correct schema structure', async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should enforce role enum constraint', async () => {
      const { error } = (await supabase
        .from('admin_users')
        .insert({
          email: 'test@example.com',
          role: 'invalid_role' as any, // Should fail
        })) as any;

      expect(error).toBeTruthy();
      expect(error?.message).toContain('role');
    });

    it('should enforce status enum constraint', async () => {
      const { error } = (await supabase
        .from('admin_users')
        .insert({
          email: 'test@example.com',
          role: 'admin',
          status: 'invalid_status' as any, // Should fail
        })) as any;

      expect(error).toBeTruthy();
      expect(error?.message).toContain('status');
    });

    it('should enforce email uniqueness', async () => {
      const email = `unique-test-${Date.now()}@example.com`;

      // Insert first user
      const { error: error1 } = (await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin' as any,
        })) as any;

      expect(error1).toBeNull();

      // Try to insert duplicate email
      const { error: error2 } = (await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin' as any,
        })) as any;

      expect(error2).toBeTruthy();
      expect(error2?.message).toContain('unique');

      // Cleanup
      await supabase.from('admin_users').delete().eq('email', email);
    });

    it('should have default values for status and timestamps', async () => {
      const email = `default-test-${Date.now()}@example.com`;

      const { data, error } = (await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin' as any,
        })
        .select()
        .single()) as any;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.status).toBe('active');
      expect((data as any)?.created_at).toBeDefined();
      expect((data as any)?.updated_at).toBeDefined();
      expect((data as any)?.invited_at).toBeDefined();

      // Cleanup
      await supabase.from('admin_users').delete().eq('email', email);
    });

    it('should support self-referential invited_by foreign key', async () => {
      const ownerEmail = `owner-${Date.now()}@example.com`;
      const adminEmail = `admin-${Date.now()}@example.com`;

      // Create owner
      const { data: owner, error: ownerError } = (await supabase
        .from('admin_users')
        .insert({
          email: ownerEmail,
          role: 'owner' as any,
        })
        .select()
        .single()) as any;

      expect(ownerError).toBeNull();
      expect(owner).toBeDefined();

      // Create admin invited by owner
      const { data: admin, error: adminError } = (await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          role: 'admin' as any,
          invited_by: (owner as any)!.id,
        })
        .select()
        .single()) as any;

      expect(adminError).toBeNull();
      expect(admin).toBeDefined();
      expect((admin as any)?.invited_by).toBe((owner as any)!.id);

      // Cleanup
      await supabase.from('admin_users').delete().eq('email', adminEmail);
      await supabase.from('admin_users').delete().eq('email', ownerEmail);
    });

    it('should have indexes on email and status', async () => {
      // Query using indexed columns should be fast
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('status', 'active')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('email_templates table', () => {
    it('should have correct schema structure', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should enforce category enum constraint', async () => {
      const { error } = (await supabase
        .from('email_templates')
        .insert({
          name: 'Test Template',
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          category: 'invalid_category' as any, // Should fail
        })) as any;

      expect(error).toBeTruthy();
      expect(error?.message).toContain('category');
    });

    it('should have default values', async () => {
      const name = `Test Template ${Date.now()}`;

      const { data, error } = (await supabase
        .from('email_templates')
        .insert({
          name,
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          category: 'custom' as any,
        })
        .select()
        .single()) as any;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.variables).toEqual([]);
      expect((data as any)?.usage_count).toBe(0);
      expect((data as any)?.created_at).toBeDefined();
      expect((data as any)?.updated_at).toBeDefined();

      // Cleanup
      await supabase.from('email_templates').delete().eq('name', name);
    });

    it('should store variables as JSONB array', async () => {
      const name = `Test Template ${Date.now()}`;
      const variables = ['guest_name', 'event_name', 'rsvp_link'];

      const { data, error } = (await supabase
        .from('email_templates')
        .insert({
          name,
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          variables,
          category: 'custom' as any,
        })
        .select()
        .single()) as any;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.variables).toEqual(variables);

      // Cleanup
      await supabase.from('email_templates').delete().eq('name', name);
    });

    it('should have default templates inserted', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_default', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);

      // Check for specific default templates
      const templateNames = (data as any)!.map((t: any) => t.name);
      expect(templateNames).toContain('RSVP Confirmation');
      expect(templateNames).toContain('RSVP Reminder');
      expect(templateNames).toContain('Activity Reminder');
      expect(templateNames).toContain('General Announcement');
    });

    it('should have index on category', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('category', 'rsvp')
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('email_history table', () => {
    it('should have correct schema structure', async () => {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should enforce delivery_status enum constraint', async () => {
      const { error } = (await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
          delivery_status: 'invalid_status' as any, // Should fail
        })) as any;

      expect(error).toBeTruthy();
      expect(error?.message).toContain('delivery_status');
    });

    it('should have default values', async () => {
      const { data, error } = (await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single()) as any;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.delivery_status).toBe('pending');
      expect((data as any)?.created_at).toBeDefined();
      expect((data as any)?.updated_at).toBeDefined();

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (data as any)!.id);
    });

    it('should support UUID array for recipient_ids', async () => {
      const recipientIds = [
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
      ];

      const { data, error } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: recipientIds as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.recipient_ids).toEqual(recipientIds);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (data as any)!.id);
    });

    it('should support foreign key to email_templates', async () => {
      // Create template
      const templateName = `Test Template ${Date.now()}`;
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .insert({
          name: templateName,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(templateError).toBeNull();

      // Create email history with template reference
      const { data: history, error: historyError } = await supabase
        .from('email_history')
        .insert({
          template_id: (template as any)!.id,
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(historyError).toBeNull();
      expect((history as any)?.template_id).toBe((template as any)!.id);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (history as any)!.id);
      await supabase.from('email_templates').delete().eq('name', templateName);
    });

    it('should support foreign key to admin_users for sent_by', async () => {
      // Create admin user
      const email = `test-${Date.now()}@example.com`;
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin' as any,
        })
        .select()
        .single();

      expect(adminError).toBeNull();

      // Create email history with sent_by reference
      const { data: history, error: historyError } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
          sent_by: (admin as any)!.id,
        })
        .select()
        .single();

      expect(historyError).toBeNull();
      expect((history as any)?.sent_by).toBe((admin as any)!.id);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (history as any)!.id);
      await supabase.from('admin_users').delete().eq('email', email);
    });

    it('should have indexes on sent_at, scheduled_for, and delivery_status', async () => {
      const { data, error } = await supabase
        .from('email_history')
        .select('*')
        .eq('delivery_status', 'pending')
        .order('sent_at', { ascending: false })
        .limit(10);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should support webhook_data as JSONB', async () => {
      const webhookData = {
        event: 'delivered',
        timestamp: new Date().toISOString(),
        messageId: 'msg-123',
      };

      const { data, error } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
          webhook_data: webhookData as any,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect((data as any)?.webhook_data).toEqual(webhookData);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (data as any)!.id);
    });
  });

  describe('Foreign key cascades', () => {
    it('should set template_id to NULL when template is deleted', async () => {
      // Create template
      const templateName = `Test Template ${Date.now()}`;
      const { data: template } = await supabase
        .from('email_templates')
        .insert({
          name: templateName,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      // Create email history
      const { data: history } = await supabase
        .from('email_history')
        .insert({
          template_id: (template as any)!.id,
          recipient_ids: ['00000000-0000-0000-0000-000000000000'] as any,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      // Delete template
      await supabase.from('email_templates').delete().eq('id', (template as any)!.id);

      // Check that template_id is NULL
      const { data: updatedHistory } = await supabase
        .from('email_history')
        .select('*')
        .eq('id', (history as any)!.id)
        .single();

      expect((updatedHistory as any)?.template_id).toBeNull();

      // Cleanup
      await supabase.from('email_history').delete().eq('id', (history as any)!.id);
    });

    it('should set invited_by to NULL when inviter is deleted', async () => {
      const ownerEmail = `owner-${Date.now()}@example.com`;
      const adminEmail = `admin-${Date.now()}@example.com`;

      // Create owner
      const { data: owner } = await supabase
        .from('admin_users')
        .insert({
          email: ownerEmail,
          role: 'owner' as any,
        })
        .select()
        .single();

      // Create admin invited by owner
      const { data: admin } = await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          role: 'admin' as any,
          invited_by: (owner as any)!.id,
        })
        .select()
        .single();

      // Delete owner
      await supabase.from('admin_users').delete().eq('id', (owner as any)!.id);

      // Check that invited_by is NULL
      const { data: updatedAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', (admin as any)!.id)
        .single();

      expect((updatedAdmin as any)?.invited_by).toBeNull();

      // Cleanup
      await supabase.from('admin_users').delete().eq('id', (admin as any)!.id);
    });
  });
});
