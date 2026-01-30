/**
 * Unit tests for API Authentication utilities
 * 
 * Tests authentication and authorization helpers for API routes.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

describe('apiAuth', () => {
  let mockCookieStore: any;
  let mockSupabaseClient: any;
  let createApiClient: any;
  let getAuthenticatedUser: any;
  let getAuthorizedAdmin: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup mock cookie store
    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    // Mock cookies() to return our mock store
    const { cookies } = require('next/headers');
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Mock createServerClient to return our mock client
    const { createServerClient } = require('@supabase/ssr');
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    // Import functions after mocks are set up
    const apiAuth = require('./apiAuth');
    createApiClient = apiAuth.createApiClient;
    getAuthenticatedUser = apiAuth.getAuthenticatedUser;
    getAuthorizedAdmin = apiAuth.getAuthorizedAdmin;
  });

  describe('createApiClient', () => {
    it('should create Supabase client with cookie handling', async () => {
      const { createServerClient } = require('@supabase/ssr');
      
      await createApiClient();
      
      expect(createServerClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });

    it('should return Supabase client instance', async () => {
      const client = await createApiClient();
      
      expect(client).toBeDefined();
      expect(client).toBe(mockSupabaseClient);
    });

    it('should handle cookie getAll correctly', async () => {
      const mockCookies = [
        { name: 'session', value: 'abc123' },
        { name: 'refresh', value: 'xyz789' },
      ];
      mockCookieStore.getAll.mockReturnValue(mockCookies);
      
      await createApiClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const result = cookiesConfig.getAll();
      expect(result).toEqual(mockCookies);
    });

    it('should handle cookie setAll correctly', async () => {
      await createApiClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const cookiesToSet = [
        { name: 'session', value: 'new123', options: {} },
        { name: 'refresh', value: 'new789', options: {} },
      ];
      
      cookiesConfig.setAll(cookiesToSet);
      
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenCalledWith('session', 'new123', {});
      expect(mockCookieStore.set).toHaveBeenCalledWith('refresh', 'new789', {});
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return user and supabase client when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const result = await getAuthenticatedUser();
      
      expect(result).toBeDefined();
      expect(result?.user).toEqual(mockUser);
      expect(result?.supabase).toBeDefined();
    });

    it('should return null when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      const result = await getAuthenticatedUser();
      
      expect(result).toBeNull();
    });

    it('should return null when auth error occurs', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });
      
      const result = await getAuthenticatedUser();
      
      expect(result).toBeNull();
    });

    it('should throw error when getUser throws error', async () => {
      // Mock getUser to reject with an error
      mockSupabaseClient.auth.getUser = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });
      
      await expect(getAuthenticatedUser()).rejects.toThrow('Network error');
    });
  });

  describe('getAuthorizedAdmin', () => {
    it('should return user, supabase, and role for super_admin', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeDefined();
      expect(result?.user).toEqual(mockUser);
      expect(result?.role).toBe('super_admin');
      expect(result?.supabase).toBeDefined();
    });

    it('should return user, supabase, and role for host', async () => {
      const mockUser = { id: 'user-123', email: 'host@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'host' },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeDefined();
      expect(result?.role).toBe('host');
    });

    it('should return null when user is not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeNull();
    });

    it('should return null when user role is guest', async () => {
      const mockUser = { id: 'user-123', email: 'guest@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeNull();
    });

    it('should return null when database query fails', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeNull();
    });

    it('should return null when user data is not found', async () => {
      const mockUser = { id: 'user-123', email: 'admin@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from = mockFrom;
      mockFrom.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      
      const result = await getAuthorizedAdmin();
      
      expect(result).toBeNull();
    });
  });
});
