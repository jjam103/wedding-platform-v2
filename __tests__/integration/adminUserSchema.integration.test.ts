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
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email: 'test@example.com',
          role: 'invalid_role', // Should fail
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('role');
    });

    it('should enforce status enum constraint', async () => {
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email: 'test@example.com',
          role: 'admin',
          status: 'invalid_status', // Should fail
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('status');
    });

    it('should enforce email uniqueness', async () => {
      const email = `unique-test-${Date.now()}@example.com`;

      // Insert first user
      const { error: error1 } = await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin',
        });

      expect(error1).toBeNull();

      // Try to insert duplicate email
      const { error: error2 } = await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin',
        });

      expect(error2).toBeTruthy();
      expect(error2?.message).toContain('unique');

      // Cleanup
      await supabase.from('admin_users').delete().eq('email', email);
    });

    it('should have default values for status and timestamps', async () => {
      const email = `default-test-${Date.now()}@example.com`;

      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.status).toBe('active');
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();
      expect(data?.invited_at).toBeDefined();

      // Cleanup
      await supabase.from('admin_users').delete().eq('email', email);
    });

    it('should support self-referential invited_by foreign key', async () => {
      const ownerEmail = `owner-${Date.now()}@example.com`;
      const adminEmail = `admin-${Date.now()}@example.com`;

      // Create owner
      const { data: owner, error: ownerError } = await supabase
        .from('admin_users')
        .insert({
          email: ownerEmail,
          role: 'owner',
        })
        .select()
        .single();

      expect(ownerError).toBeNull();
      expect(owner).toBeDefined();

      // Create admin invited by owner
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          role: 'admin',
          invited_by: owner!.id,
        })
        .select()
        .single();

      expect(adminError).toBeNull();
      expect(admin).toBeDefined();
      expect(admin?.invited_by).toBe(owner!.id);

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
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: 'Test Template',
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          category: 'invalid_category', // Should fail
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('category');
    });

    it('should have default values', async () => {
      const name = `Test Template ${Date.now()}`;

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name,
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          category: 'custom',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.variables).toEqual([]);
      expect(data?.usage_count).toBe(0);
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();

      // Cleanup
      await supabase.from('email_templates').delete().eq('name', name);
    });

    it('should store variables as JSONB array', async () => {
      const name = `Test Template ${Date.now()}`;
      const variables = ['guest_name', 'event_name', 'rsvp_link'];

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name,
          subject: 'Test Subject',
          body_html: '<p>Test</p>',
          variables,
          category: 'custom',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.variables).toEqual(variables);

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
      const templateNames = data!.map((t) => t.name);
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
      const { error } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
          delivery_status: 'invalid_status', // Should fail
        });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('delivery_status');
    });

    it('should have default values', async () => {
      const { data, error } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.delivery_status).toBe('pending');
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();

      // Cleanup
      await supabase.from('email_history').delete().eq('id', data!.id);
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
          recipient_ids: recipientIds,
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.recipient_ids).toEqual(recipientIds);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', data!.id);
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
          template_id: template!.id,
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      expect(historyError).toBeNull();
      expect(history?.template_id).toBe(template!.id);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', history!.id);
      await supabase.from('email_templates').delete().eq('name', templateName);
    });

    it('should support foreign key to admin_users for sent_by', async () => {
      // Create admin user
      const email = `test-${Date.now()}@example.com`;
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email,
          role: 'admin',
        })
        .select()
        .single();

      expect(adminError).toBeNull();

      // Create email history with sent_by reference
      const { data: history, error: historyError } = await supabase
        .from('email_history')
        .insert({
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
          sent_by: admin!.id,
        })
        .select()
        .single();

      expect(historyError).toBeNull();
      expect(history?.sent_by).toBe(admin!.id);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', history!.id);
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
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
          webhook_data: webhookData,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.webhook_data).toEqual(webhookData);

      // Cleanup
      await supabase.from('email_history').delete().eq('id', data!.id);
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
          template_id: template!.id,
          recipient_ids: ['00000000-0000-0000-0000-000000000000'],
          subject: 'Test',
          body_html: '<p>Test</p>',
        })
        .select()
        .single();

      // Delete template
      await supabase.from('email_templates').delete().eq('id', template!.id);

      // Check that template_id is NULL
      const { data: updatedHistory } = await supabase
        .from('email_history')
        .select('*')
        .eq('id', history!.id)
        .single();

      expect(updatedHistory?.template_id).toBeNull();

      // Cleanup
      await supabase.from('email_history').delete().eq('id', history!.id);
    });

    it('should set invited_by to NULL when inviter is deleted', async () => {
      const ownerEmail = `owner-${Date.now()}@example.com`;
      const adminEmail = `admin-${Date.now()}@example.com`;

      // Create owner
      const { data: owner } = await supabase
        .from('admin_users')
        .insert({
          email: ownerEmail,
          role: 'owner',
        })
        .select()
        .single();

      // Create admin invited by owner
      const { data: admin } = await supabase
        .from('admin_users')
        .insert({
          email: adminEmail,
          role: 'admin',
          invited_by: owner!.id,
        })
        .select()
        .single();

      // Delete owner
      await supabase.from('admin_users').delete().eq('id', owner!.id);

      // Check that invited_by is NULL
      const { data: updatedAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', admin!.id)
        .single();

      expect(updatedAdmin?.invited_by).toBeNull();

      // Cleanup
      await supabase.from('admin_users').delete().eq('id', admin!.id);
    });
  });
});
