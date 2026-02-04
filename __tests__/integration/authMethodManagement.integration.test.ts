/**
 * Integration Tests: Auth Method Management API
 * 
 * Tests the API routes for managing guest authentication methods:
 * - PUT /api/admin/guests/[id]/auth-method
 * - POST /api/admin/guests/bulk-auth-method
 * 
 * Requirements: 22.2, 22.3, 22.7
 */

import { testDb } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

describe('Auth Method Management API Integration Tests', () => {
  beforeEach(async () => {
    await cleanup.all();
  });

  afterEach(async () => {
    await cleanup.all();
  });

  describe('PUT /api/admin/guests/[id]/auth-method', () => {
    it('should update guest auth method successfully', async () => {
      // Create test guest
      const guest = await testDb.createGuest({
        email: 'test@example.com',
        auth_method: 'email_matching',
        group_id: await testDb.createGroup({ name: 'Test Family' }),
        first_name: 'Test',
        last_name: 'User',
      });

      // Update auth method
      const response = await fetch(
        `http://localhost:3000/api/admin/guests/${guest.id}/auth-method`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: await testDb.getAuthCookie(),
          },
          body: JSON.stringify({
            auth_method: 'magic_link',
          }),
        }
      );

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(guest.id);
      expect(result.data.auth_method).toBe('magic_link');
    });

    it('should return 400 for invalid auth method', async () => {
      const guest = await testDb.createGuest({
        email: 'test@example.com',
        auth_method: 'email_matching',
        group_id: await testDb.createGroup({ name: 'Test Family' }),
        first_name: 'Test',
        last_name: 'User',
      });

      const response = await fetch(
        `http://localhost:3000/api/admin/guests/${guest.id}/auth-method`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: await testDb.getAuthCookie(),
          },
          body: JSON.stringify({
            auth_method: 'invalid_method',
          }),
        }
      );

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid guest ID format', async () => {
      const response = await fetch(
        'http://localhost:3000/api/admin/guests/invalid-id/auth-method',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: await testDb.getAuthCookie(),
          },
          body: JSON.stringify({
            auth_method: 'magic_link',
          }),
        }
      );

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Invalid guest ID format');
    });

    it('should return 404 for non-existent guest', async () => {
      const response = await fetch(
        'http://localhost:3000/api/admin/guests/00000000-0000-0000-0000-000000000000/auth-method',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: await testDb.getAuthCookie(),
          },
          body: JSON.stringify({
            auth_method: 'magic_link',
          }),
        }
      );

      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('GUEST_NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      const guest = await testDb.createGuest({
        email: 'test@example.com',
        auth_method: 'email_matching',
        group_id: await testDb.createGroup({ name: 'Test Family' }),
        first_name: 'Test',
        last_name: 'User',
      });

      const response = await fetch(
        `http://localhost:3000/api/admin/guests/${guest.id}/auth-method`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth_method: 'magic_link',
          }),
        }
      );

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/admin/guests/bulk-auth-method', () => {
    it('should update multiple guests auth method successfully', async () => {
      // Create test guests
      const groupId = await testDb.createGroup({ name: 'Test Family' });
      const guest1 = await testDb.createGuest({
        email: 'test1@example.com',
        auth_method: 'email_matching',
        group_id: groupId,
        first_name: 'Test',
        last_name: 'User1',
      });
      const guest2 = await testDb.createGuest({
        email: 'test2@example.com',
        auth_method: 'email_matching',
        group_id: groupId,
        first_name: 'Test',
        last_name: 'User2',
      });
      const guest3 = await testDb.createGuest({
        email: 'test3@example.com',
        auth_method: 'email_matching',
        group_id: groupId,
        first_name: 'Test',
        last_name: 'User3',
      });

      // Bulk update auth method
      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: [guest1.id, guest2.id, guest3.id],
          auth_method: 'magic_link',
          send_notification: false,
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.updated_count).toBe(3);
      expect(result.data.guests).toHaveLength(3);
      expect(result.data.guests.every((g: any) => g.auth_method === 'magic_link')).toBe(true);
    });

    it('should return 400 for empty guest_ids array', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: [],
          auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid guest ID in array', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: ['invalid-id', '00000000-0000-0000-0000-000000000000'],
          auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for too many guest IDs (>100)', async () => {
      const tooManyIds = Array.from({ length: 101 }, () => '00000000-0000-0000-0000-000000000000');

      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: tooManyIds,
          auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid auth method', async () => {
      const groupId = await testDb.createGroup({ name: 'Test Family' });
      const guest = await testDb.createGuest({
        email: 'test@example.com',
        auth_method: 'email_matching',
        group_id: groupId,
        first_name: 'Test',
        last_name: 'User',
      });

      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: [guest.id],
          auth_method: 'invalid_method',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_ids: ['00000000-0000-0000-0000-000000000000'],
          auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle partial updates gracefully (some guests not found)', async () => {
      // Create one real guest
      const groupId = await testDb.createGroup({ name: 'Test Family' });
      const guest = await testDb.createGuest({
        email: 'test@example.com',
        auth_method: 'email_matching',
        group_id: groupId,
        first_name: 'Test',
        last_name: 'User',
      });

      // Try to update real guest + non-existent guest
      const response = await fetch('http://localhost:3000/api/admin/guests/bulk-auth-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          guest_ids: [guest.id, '00000000-0000-0000-0000-000000000000'],
          auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      // Only the existing guest should be updated
      expect(result.data.updated_count).toBe(1);
      expect(result.data.guests[0].id).toBe(guest.id);
      expect(result.data.guests[0].auth_method).toBe('magic_link');
    });
  });

  describe('Settings API - default_auth_method', () => {
    it('should update default auth method in settings', async () => {
      const response = await fetch('http://localhost:3000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          default_auth_method: 'magic_link',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data.default_auth_method).toBe('magic_link');
    });

    it('should return 400 for invalid default auth method', async () => {
      const response = await fetch('http://localhost:3000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await testDb.getAuthCookie(),
        },
        body: JSON.stringify({
          default_auth_method: 'invalid_method',
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
