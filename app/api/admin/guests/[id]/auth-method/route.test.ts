/**
 * Unit Tests: PUT /api/admin/guests/[id]/auth-method
 * 
 * Tests the API route for updating a single guest's auth method
 * 
 * Requirements: 22.3
 */

import { PUT } from './route';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

// Mock Supabase
jest.mock('@/lib/supabaseServer');

describe('PUT /api/admin/guests/[id]/auth-method', () => {
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

  it('should update guest auth method successfully', async () => {
    // Mock authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    // Mock successful update
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'guest-123',
              auth_method: 'magic_link',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
            },
            error: null,
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/guest-123/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'magic_link' }),
    });

    const response = await PUT(request, { params: { id: 'guest-123' } });
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.auth_method).toBe('magic_link');
  });

  it('should return 400 for invalid guest ID format', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/invalid-id/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'magic_link' }),
    });

    const response = await PUT(request, { params: { id: 'invalid-id' } });
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

    const request = new Request('http://localhost:3000/api/admin/guests/00000000-0000-0000-0000-000000000000/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'invalid_method' }),
    });

    const response = await PUT(request, { params: { id: '00000000-0000-0000-0000-000000000000' } });
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for non-existent guest', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
      error: null,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/00000000-0000-0000-0000-000000000000/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'magic_link' }),
    });

    const response = await PUT(request, { params: { id: '00000000-0000-0000-0000-000000000000' } });
    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('GUEST_NOT_FOUND');
  });

  it('should return 401 when not authenticated', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/guest-123/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'magic_link' }),
    });

    const response = await PUT(request, { params: { id: 'guest-123' } });
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
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'DATABASE_ERROR', message: 'Database connection failed' },
          }),
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost:3000/api/admin/guests/guest-123/auth-method', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_method: 'magic_link' }),
    });

    const response = await PUT(request, { params: { id: 'guest-123' } });
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('DATABASE_ERROR');
  });
});
