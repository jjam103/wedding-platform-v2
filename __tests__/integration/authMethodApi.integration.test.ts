/**
 * Integration tests for auth method configuration API endpoints
 * 
 * Tests:
 * - GET /api/admin/settings/auth-method
 * - PUT /api/admin/settings/auth-method
 */

import { GET, PUT } from '@/app/api/admin/settings/auth-method/route';
import * as settingsService from '@/services/settingsService';

// Mock settingsService
jest.mock('@/services/settingsService', () => ({
  getDefaultAuthMethod: jest.fn(),
  updateDefaultAuthMethod: jest.fn(),
}));

// Mock supabaseServer
jest.mock('@/lib/supabaseServer', () => ({
  createAuthenticatedClient: jest.fn(),
}));

describe('Auth Method API Integration Tests', () => {
  const mockGetDefaultAuthMethod = settingsService.getDefaultAuthMethod as jest.MockedFunction<
    typeof settingsService.getDefaultAuthMethod
  >;
  const mockUpdateDefaultAuthMethod = settingsService.updateDefaultAuthMethod as jest.MockedFunction<
    typeof settingsService.updateDefaultAuthMethod
  >;

  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createAuthenticatedClient } = require('@/lib/supabaseServer');
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
      },
    };
    createAuthenticatedClient.mockResolvedValue(mockSupabase);
  });

  describe('GET /api/admin/settings/auth-method', () => {
    it('should return current auth method when authenticated', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      // Mock service response
      mockGetDefaultAuthMethod.mockResolvedValue({
        success: true,
        data: 'email_matching',
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.defaultAuthMethod).toBe('email_matching');
    });

    it('should return 401 when not authenticated', async () => {
      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 when setting not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockGetDefaultAuthMethod.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Setting not found',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });

    it('should return 500 when service fails', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockGetDefaultAuthMethod.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/admin/settings/auth-method', () => {
    it('should update auth method without updating guests', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockUpdateDefaultAuthMethod.mockResolvedValue({
        success: true,
        data: { updatedGuestsCount: 0 },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'magic_link',
          updateExistingGuests: false,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.defaultAuthMethod).toBe('magic_link');
      expect(data.data.updatedGuestsCount).toBe(0);
      expect(mockUpdateDefaultAuthMethod).toHaveBeenCalledWith('magic_link', false);
    });

    it('should update auth method and bulk update guests', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockUpdateDefaultAuthMethod.mockResolvedValue({
        success: true,
        data: { updatedGuestsCount: 5 },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'email_matching',
          updateExistingGuests: true,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.defaultAuthMethod).toBe('email_matching');
      expect(data.data.updatedGuestsCount).toBe(5);
      expect(mockUpdateDefaultAuthMethod).toHaveBeenCalledWith('email_matching', true);
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'magic_link',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid auth method', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'invalid_method',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing required fields', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 when service fails', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockUpdateDefaultAuthMethod.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'magic_link',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should default updateExistingGuests to false when not provided', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } },
        error: null,
      });

      mockUpdateDefaultAuthMethod.mockResolvedValue({
        success: true,
        data: { updatedGuestsCount: 0 },
      });

      const request = new Request('http://localhost:3000/api/admin/settings/auth-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultAuthMethod: 'magic_link',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUpdateDefaultAuthMethod).toHaveBeenCalledWith('magic_link', false);
    });
  });
});
