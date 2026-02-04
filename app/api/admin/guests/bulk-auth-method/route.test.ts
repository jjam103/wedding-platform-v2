/**
 * Unit Tests: POST /api/admin/guests/bulk-auth-method
 * 
 * Tests the API route for bulk updating guest auth methods
 * 
 * Requirements: 22.7
 */

import { POST } from './route';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

// Mock Supabase
jest.mock('@/lib/supabaseServer');

describe('POST /api/admin/guests/bulk-auth-method', () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createAuthenticatedClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should update multiple guests successfully', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'guest-1', auth_method: 'magic_link', email: 'test1@example.com', first_name: 'Test', last_name: 'User1' },
            { id: 'guest-2', auth_method: 'magic_link', email: 'test2@example.com', first_name: 'Test', last_name: 'User2' },
          ],
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['guest-1', 'guest-2'],
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.updated_count).toBe(2);
    expect(result.data.guests).toHaveLength(2);
  });

  it('should return 400 for empty guest_ids array', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: [],
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for too many guest IDs', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const tooManyIds = Array.from({ length: 101 }, () => '00000000-0000-0000-0000-000000000000');

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: tooManyIds,
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid guest ID format', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['invalid-id', 'another-invalid'],
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid auth method', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['00000000-0000-0000-0000-000000000000'],
        auth_method: 'invalid_method',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['guest-1'],
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 500 for database errors', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['guest-1', 'guest-2'],
        auth_method: 'magic_link',
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('DATABASE_ERROR');
  });

  it('should handle send_notification flag', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      in: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            { id: 'guest-1', auth_method: 'magic_link', email: 'test1@example.com', first_name: 'Test', last_name: 'User1' },
          ],
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const request = new Request('http://localhost:3000/api/admin/guests/bulk-auth-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guest_ids: ['guest-1'],
        auth_method: 'magic_link',
        send_notification: true,
      }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would send notifications to 1 guests')
    );

    consoleSpy.mockRestore();
  });
});
