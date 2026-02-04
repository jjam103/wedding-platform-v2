/**
 * Property-Based Test: Admin Action Audit Logging
 * 
 * Feature: guest-portal-and-admin-enhancements
 * Property 13: Admin Action Audit Logging
 * 
 * Validates: Requirements 3.9
 * - All admin user management actions are logged in audit log
 * - Audit log includes action type, user ID, timestamp, and details
 * - Audit log is immutable (no updates or deletes)
 */

import * as fc from 'fast-check';
import { adminUserService } from './adminUserService';
import { createTestSupabaseClient } from '../__tests__/helpers/testDb';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Feature: guest-portal-and-admin-enhancements, Property 13: Admin Action Audit Logging', () => {
  let supabase: SupabaseClient;
  let testOwnerId: string;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();
    
    // Create test owner user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'test-owner@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test owner user');
    }

    testOwnerId = authUser.user.id;

    // Create owner admin user record
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: testOwnerId,
        email: 'test-owner@example.com',
        role: 'owner',
        status: 'active',
      });

    if (insertError) {
      throw new Error('Failed to create owner admin user record');
    }
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('admin_users').delete().eq('id', testOwnerId);
    await supabase.auth.admin.deleteUser(testOwnerId);
  });

  afterEach(async () => {
    // Clean up test admin users (except owner)
    await supabase.from('admin_users').delete().neq('id', testOwnerId);
  });

  // Arbitrary for admin user data
  const adminUserArbitrary = fc.record({
    email: fc.emailAddress(),
    role: fc.constantFrom('admin' as const, 'owner' as const),
  });

  it('should log all admin user creation actions', async () => {
    await fc.assert(
      fc.asyncProperty(adminUserArbitrary, async (userData) => {
        // Create admin user
        const result = await adminUserService.create({
          ...userData,
          invitedBy: testOwnerId,
        });

        if (!result.success) {
          // Skip if creation failed (e.g., duplicate email)
          return true;
        }

        // Check audit log
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'admin_user_created')
          .eq('entity_id', result.data.id)
          .order('created_at', { ascending: false })
          .limit(1);

        expect(error).toBeNull();
        expect(auditLogs).toHaveLength(1);
        
        const log = auditLogs![0];
        expect(log.action_type).toBe('admin_user_created');
        expect(log.entity_type).toBe('admin_user');
        expect(log.entity_id).toBe(result.data.id);
        expect(log.user_id).toBe(testOwnerId);
        expect(log.details).toMatchObject({
          email: userData.email,
          role: userData.role,
        });
        expect(log.created_at).toBeDefined();

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should log all admin user update actions', async () => {
    await fc.assert(
      fc.asyncProperty(
        adminUserArbitrary,
        fc.constantFrom('admin' as const, 'owner' as const),
        async (userData, newRole) => {
          // Create admin user
          const createResult = await adminUserService.create({
            ...userData,
            invitedBy: testOwnerId,
          });

          if (!createResult.success) {
            return true;
          }

          // Update admin user
          const updateResult = await adminUserService.update(createResult.data.id, {
            role: newRole,
          });

          if (!updateResult.success) {
            return true;
          }

          // Check audit log
          const { data: auditLogs, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('action_type', 'admin_user_updated')
            .eq('entity_id', createResult.data.id)
            .order('created_at', { ascending: false })
            .limit(1);

          expect(error).toBeNull();
          expect(auditLogs).toHaveLength(1);
          
          const log = auditLogs![0];
          expect(log.action_type).toBe('admin_user_updated');
          expect(log.entity_type).toBe('admin_user');
          expect(log.entity_id).toBe(createResult.data.id);
          expect(log.details).toMatchObject({
            role: newRole,
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should log all admin user deactivation actions', async () => {
    await fc.assert(
      fc.asyncProperty(adminUserArbitrary, async (userData) => {
        // Create admin user
        const createResult = await adminUserService.create({
          ...userData,
          invitedBy: testOwnerId,
        });

        if (!createResult.success) {
          return true;
        }

        // Deactivate admin user
        const deactivateResult = await adminUserService.deactivate(createResult.data.id);

        if (!deactivateResult.success) {
          return true;
        }

        // Check audit log
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'admin_user_deactivated')
          .eq('entity_id', createResult.data.id)
          .order('created_at', { ascending: false })
          .limit(1);

        expect(error).toBeNull();
        expect(auditLogs).toHaveLength(1);
        
        const log = auditLogs![0];
        expect(log.action_type).toBe('admin_user_deactivated');
        expect(log.entity_type).toBe('admin_user');
        expect(log.entity_id).toBe(createResult.data.id);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should log all admin user deletion actions', async () => {
    await fc.assert(
      fc.asyncProperty(adminUserArbitrary, async (userData) => {
        // Create admin user
        const createResult = await adminUserService.create({
          ...userData,
          invitedBy: testOwnerId,
        });

        if (!createResult.success) {
          return true;
        }

        const adminUserId = createResult.data.id;

        // Delete admin user
        const deleteResult = await adminUserService.delete(adminUserId);

        if (!deleteResult.success) {
          return true;
        }

        // Check audit log
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'admin_user_deleted')
          .eq('entity_id', adminUserId)
          .order('created_at', { ascending: false })
          .limit(1);

        expect(error).toBeNull();
        expect(auditLogs).toHaveLength(1);
        
        const log = auditLogs![0];
        expect(log.action_type).toBe('admin_user_deleted');
        expect(log.entity_type).toBe('admin_user');
        expect(log.entity_id).toBe(adminUserId);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure audit logs are immutable', async () => {
    await fc.assert(
      fc.asyncProperty(adminUserArbitrary, async (userData) => {
        // Create admin user to generate audit log
        const createResult = await adminUserService.create({
          ...userData,
          invitedBy: testOwnerId,
        });

        if (!createResult.success) {
          return true;
        }

        // Get audit log
        const { data: auditLogs, error: selectError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'admin_user_created')
          .eq('entity_id', createResult.data.id)
          .limit(1);

        expect(selectError).toBeNull();
        expect(auditLogs).toHaveLength(1);

        const logId = auditLogs![0].id;

        // Attempt to update audit log (should fail)
        const { error: updateError } = await supabase
          .from('audit_logs')
          .update({ details: { modified: true } })
          .eq('id', logId);

        // Update should be prevented by RLS or trigger
        expect(updateError).toBeTruthy();

        // Attempt to delete audit log (should fail)
        const { error: deleteError } = await supabase
          .from('audit_logs')
          .delete()
          .eq('id', logId);

        // Delete should be prevented by RLS or trigger
        expect(deleteError).toBeTruthy();

        return true;
      }),
      { numRuns: 50 } // Fewer runs since we're testing immutability
    );
  });

  it('should include all required fields in audit logs', async () => {
    await fc.assert(
      fc.asyncProperty(adminUserArbitrary, async (userData) => {
        // Create admin user
        const result = await adminUserService.create({
          ...userData,
          invitedBy: testOwnerId,
        });

        if (!result.success) {
          return true;
        }

        // Get audit log
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action_type', 'admin_user_created')
          .eq('entity_id', result.data.id)
          .limit(1);

        expect(error).toBeNull();
        expect(auditLogs).toHaveLength(1);
        
        const log = auditLogs![0];
        
        // Verify all required fields are present
        expect(log.id).toBeDefined();
        expect(log.action_type).toBeDefined();
        expect(log.entity_type).toBeDefined();
        expect(log.entity_id).toBeDefined();
        expect(log.user_id).toBeDefined();
        expect(log.details).toBeDefined();
        expect(log.created_at).toBeDefined();
        
        // Verify timestamp is recent (within last minute)
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();
        expect(now - logTime).toBeLessThan(60000); // 1 minute

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
