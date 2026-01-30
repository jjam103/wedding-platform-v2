/**
 * Unit tests for Supabase Server Client utilities
 * 
 * Tests server-side Supabase client creation with async cookies handling.
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

describe('supabaseServer', () => {
  let mockCookieStore: any;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock cookie store
    mockCookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
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
  });

  describe('createAuthenticatedClient', () => {
    it('should create Supabase client with cookie handling', async () => {
      const { createServerClient } = require('@supabase/ssr');
      const { createAuthenticatedClient } = require('./supabaseServer');
      
      await createAuthenticatedClient();
      
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
      const { createAuthenticatedClient } = require('./supabaseServer');
      
      const client = await createAuthenticatedClient();
      
      expect(client).toBeDefined();
      expect(client).toBe(mockSupabaseClient);
    });

    it('should await cookies() before creating client', async () => {
      const { cookies } = require('next/headers');
      const { createAuthenticatedClient } = require('./supabaseServer');
      
      await createAuthenticatedClient();
      
      expect(cookies).toHaveBeenCalled();
    });

    it('should handle cookie getAll correctly', async () => {
      const mockCookies = [
        { name: 'session', value: 'abc123' },
        { name: 'refresh', value: 'xyz789' },
      ];
      mockCookieStore.getAll.mockReturnValue(mockCookies);
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const result = cookiesConfig.getAll();
      expect(result).toEqual(mockCookies);
    });

    it('should handle cookie setAll correctly', async () => {
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
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

    it('should handle cookie setting errors gracefully', async () => {
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie setting failed');
      });
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const cookiesToSet = [
        { name: 'session', value: 'new123', options: {} },
      ];
      
      // Should not throw error
      expect(() => {
        cookiesConfig.setAll(cookiesToSet);
      }).not.toThrow();
    });

    it('should log error when cookie setting fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie setting failed');
      });
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const cookiesToSet = [
        { name: 'session', value: 'new123', options: {} },
      ];
      
      cookiesConfig.setAll(cookiesToSet);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting cookies:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle empty cookie array', async () => {
      mockCookieStore.getAll.mockReturnValue([]);
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const result = cookiesConfig.getAll();
      expect(result).toEqual([]);
    });

    it('should handle setting empty cookie array', async () => {
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      cookiesConfig.setAll([]);
      
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookies with options', async () => {
      const { createAuthenticatedClient } = require('./supabaseServer');
      await createAuthenticatedClient();
      
      const { createServerClient } = require('@supabase/ssr');
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;
      
      const cookiesToSet = [
        {
          name: 'session',
          value: 'abc123',
          options: {
            httpOnly: true,
            secure: true,
            sameSite: 'lax' as const,
            maxAge: 3600,
          },
        },
      ];
      
      cookiesConfig.setAll(cookiesToSet);
      
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'session',
        'abc123',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 3600,
        }
      );
    });

    it('should work with authenticated session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token-123',
          },
        },
        error: null,
      });
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      const client = await createAuthenticatedClient();
      
      const { data } = await client.auth.getSession();
      
      expect(data.session).toBeDefined();
      expect(data.session.user.id).toBe('user-123');
    });

    it('should work without authenticated session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      const { createAuthenticatedClient } = require('./supabaseServer');
      const client = await createAuthenticatedClient();
      
      const { data } = await client.auth.getSession();
      
      expect(data.session).toBeNull();
    });
  });

  describe('environment variable handling', () => {
    it('should use NEXT_PUBLIC_SUPABASE_URL from environment', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co';
      
      const { createServerClient } = require('@supabase/ssr');
      const { createAuthenticatedClient } = require('./supabaseServer');
      
      await createAuthenticatedClient();
      
      expect(createServerClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should use NEXT_PUBLIC_SUPABASE_ANON_KEY from environment', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'custom-anon-key';
      
      const { createServerClient } = require('@supabase/ssr');
      const { createAuthenticatedClient } = require('./supabaseServer');
      
      await createAuthenticatedClient();
      
      expect(createServerClient).toHaveBeenCalledWith(
        expect.any(String),
        'custom-anon-key',
        expect.any(Object)
      );
    });
  });
});
