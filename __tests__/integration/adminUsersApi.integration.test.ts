/**
 * Integration Tests: Admin Users API
 * 
 * Tests all CRUD endpoints, permissions, and audit logging
 */

import { createTestSupabaseClient } from '../helpers/testDb';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Admin Users API Integration Tests', () => {
  let supabase: SupabaseClient;
  let ownerUserId: string;
  let ownerSession: string;
  let adminUserId: string;
  let adminSession: string;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();

    // Create owner user
    const { data: ownerAuth, error: ownerAuthError } = await supabase.auth.admin.createUser({
      email: 'test-owner@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    if (ownerAuthError || !ownerAuth.user) {
      throw new Error('Failed to create owner user');
    }

    ownerUserId = ownerAuth.user.id;

    // Create owner admin user record
    await supabase.from('admin_users').insert({
      id: ownerUserId,
      email: 'test-owner@example.com',
      role: 'owner',
      status: 'active',
    });

    // Get owner session
    const { data: ownerSessionData } = await supabase.auth.signInWithPassword({
      email: 'test-owner@example.com',
      password: 'test-password-123',
    });
    ownerSession = ownerSessionData.session!.access_token;

    // Create admin user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'test-admin@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    if (adminAuthError || !adminAuth.user) {
      throw new Error('Failed to create admin user');
    }

    adminUserId = adminAuth.user.id;

    // Create admin user record
    await supabase.from('admin_users').insert({
      id: adminUserId,
      email: 'test-admin@example.com',
      role: 'admin',
      status: 'active',
      invited_by: ownerUserId,
    });

    // Get admin session
    const { data: adminSessionData } = await supabase.auth.signInWithPassword({
      email: 'test-admin@example.com',
      password: 'test-password-123',
    });
    adminSession = adminSessionData.session!.access_token;
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('admin_users').delete().in('id', [ownerUserId, adminUserId]);
    await supabase.auth.admin.deleteUser(ownerUserId);
    await supabase.auth.admin.deleteUser(adminUserId);
  });

  afterEach(async () => {
    // Clean up test admin users (except owner and admin)
    await supabase
      .from('admin_users')
      .delete()
      .not('id', 'in', `(${ownerUserId},${adminUserId})`);
  });

  describe('GET /api/admin/admin-users', () => {
    it('should return list of admin users when authenticated as owner', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        headers: {
          Authorization: `Bearer ${ownerSession}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      
      // Verify owner is in list
      const owner = data.data.find((u: any) => u.id === ownerUserId);
      expect(owner).toBeDefined();
      expect(owner.email).toBe('test-owner@example.com');
      expect(owner.role).toBe('owner');
    });

    it('should return list of admin users when authenticated as admin', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        headers: {
          Authorization: `Bearer ${adminSession}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users');

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when authenticated as inactive admin', async () => {
      // Deactivate admin user
      await supabase
        .from('admin_users')
        .update({ status: 'inactive' })
        .eq('id', adminUserId);

      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        headers: {
          Authorization: `Bearer ${adminSession}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');

      // Reactivate for other tests
      await supabase
        .from('admin_users')
        .update({ status: 'active' })
        .eq('id', adminUserId);
    });
  });

  describe('POST /api/admin/admin-users', () => {
    it('should create admin user when authenticated as owner with valid data', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'newadmin@example.com',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.email).toBe('newadmin@example.com');
      expect(data.data.role).toBe('admin');
      expect(data.data.status).toBe('active');
      expect(data.data.invited_by).toBe(ownerUserId);

      // Verify audit log created
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'admin_user_created')
        .eq('entity_id', data.data.id);

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs![0].user_id).toBe(ownerUserId);
    });

    it('should return 400 when email is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'invalid-email',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when role is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          role: 'superadmin',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 when email already exists', async () => {
      // Create first admin
      await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          role: 'admin',
        }),
      });

      // Try to create duplicate
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'duplicate@example.com',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFLICT');
    });

    it('should return 403 when authenticated as admin (not owner)', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('PUT /api/admin/admin-users/[id]', () => {
    let testAdminId: string;

    beforeEach(async () => {
      // Create test admin user
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'testupdate@example.com',
          role: 'admin',
        }),
      });

      const data = await response.json();
      testAdminId = data.data.id;
    });

    it('should update admin user role when authenticated as owner', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          role: 'owner',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.role).toBe('owner');

      // Verify audit log created
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'admin_user_updated')
        .eq('entity_id', testAdminId);

      expect(auditLogs!.length).toBeGreaterThan(0);
    });

    it('should return 403 when authenticated as admin (not owner)', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSession}`,
        },
        body: JSON.stringify({
          role: 'owner',
        }),
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 when admin user not found', async () => {
      const response = await fetch(
        'http://localhost:3000/api/admin/admin-users/00000000-0000-0000-0000-000000000000',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ownerSession}`,
          },
          body: JSON.stringify({
            role: 'admin',
          }),
        }
      );

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/admin/admin-users/[id]/deactivate', () => {
    let testAdminId: string;

    beforeEach(async () => {
      // Create test admin user
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'testdeactivate@example.com',
          role: 'admin',
        }),
      });

      const data = await response.json();
      testAdminId = data.data.id;
    });

    it('should deactivate admin user when authenticated as owner', async () => {
      const response = await fetch(
        `http://localhost:3000/api/admin/admin-users/${testAdminId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ownerSession}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('inactive');

      // Verify audit log created
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'admin_user_deactivated')
        .eq('entity_id', testAdminId);

      expect(auditLogs!.length).toBeGreaterThan(0);
    });

    it('should return 403 when trying to deactivate last owner', async () => {
      const response = await fetch(
        `http://localhost:3000/api/admin/admin-users/${ownerUserId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ownerSession}`,
          },
        }
      );

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('last owner');
    });

    it('should return 403 when authenticated as admin (not owner)', async () => {
      const response = await fetch(
        `http://localhost:3000/api/admin/admin-users/${testAdminId}/deactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminSession}`,
          },
        }
      );

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/admin/admin-users/[id]', () => {
    let testAdminId: string;

    beforeEach(async () => {
      // Create test admin user
      const response = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'testdelete@example.com',
          role: 'admin',
        }),
      });

      const data = await response.json();
      testAdminId = data.data.id;
    });

    it('should delete admin user when authenticated as owner', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ownerSession}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify user deleted
      const { data: deletedUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', testAdminId)
        .single();

      expect(deletedUser).toBeNull();

      // Verify audit log created
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'admin_user_deleted')
        .eq('entity_id', testAdminId);

      expect(auditLogs!.length).toBeGreaterThan(0);
    });

    it('should return 403 when trying to delete last owner', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/admin-users/${ownerUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ownerSession}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toContain('last owner');
    });

    it('should return 403 when authenticated as admin (not owner)', async () => {
      const response = await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminSession}`,
        },
      });

      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Audit Logging', () => {
    it('should log all admin user management actions', async () => {
      // Create admin user
      const createResponse = await fetch('http://localhost:3000/api/admin/admin-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          email: 'auditlog@example.com',
          role: 'admin',
        }),
      });

      const createData = await createResponse.json();
      const testAdminId = createData.data.id;

      // Update admin user
      await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerSession}`,
        },
        body: JSON.stringify({
          role: 'owner',
        }),
      });

      // Deactivate admin user
      await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}/deactivate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ownerSession}`,
        },
      });

      // Delete admin user
      await fetch(`http://localhost:3000/api/admin/admin-users/${testAdminId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ownerSession}`,
        },
      });

      // Verify all audit logs created
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', testAdminId)
        .order('created_at', { ascending: true });

      expect(auditLogs!.length).toBeGreaterThanOrEqual(4);

      const actions = auditLogs!.map((log) => log.action);
      expect(actions).toContain('admin_user_created');
      expect(actions).toContain('admin_user_updated');
      expect(actions).toContain('admin_user_deactivated');
      expect(actions).toContain('admin_user_deleted');

      // Verify all logs have required fields
      auditLogs!.forEach((log) => {
        expect(log.user_id).toBe(ownerUserId);
        expect(log.entity_type).toBe('admin_user');
        expect(log.entity_id).toBe(testAdminId);
        expect(log.created_at).toBeDefined();
      });
    });
  });
});
