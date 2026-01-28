import * as authService from './authService';
import { createClient } from '@supabase/supabase-js';
import { ERROR_CODES } from '@/types';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('authService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        signInWithOtp: jest.fn(),
        getSession: jest.fn(),
        refreshSession: jest.fn(),
        signOut: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('loginWithPassword', () => {
    it('should return success with session when valid credentials provided', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 1234567890,
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'host' },
        error: null,
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe('user-123');
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.user.role).toBe('host');
        expect(result.data.accessToken).toBe('mock-access-token');
        expect(result.data.refreshToken).toBe('mock-refresh-token');
      }
    });

    it('should return INVALID_CREDENTIALS when credentials are wrong', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
        expect(result.error.message).toBe('Invalid email or password');
      }
    });

    it('should default to guest role when user record does not exist', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 1234567890,
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.role).toBe('guest');
      }
    });

    it('should return UNAUTHORIZED when session creation fails', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });
  });

  describe('sendMagicLink', () => {
    it('should return success when magic link is sent', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.sendMagicLink({
        email: 'test@example.com',
        redirectTo: 'https://example.com/dashboard',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toContain('Magic link sent successfully');
      }

      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'https://example.com/dashboard',
        },
      });
    });

    it('should return EXTERNAL_SERVICE_ERROR when magic link fails', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Email service unavailable' },
      });

      const result = await authService.sendMagicLink({
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR);
        expect(result.error.message).toBe('Failed to send magic link');
      }
    });
  });

  describe('getSession', () => {
    it('should return success with session when valid session exists', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 1234567890,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'super_admin' },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.id).toBe('user-123');
        expect(result.data.user.role).toBe('super_admin');
      }
    });

    it('should return SESSION_EXPIRED when session is invalid', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const result = await authService.getSession();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.SESSION_EXPIRED);
      }
    });

    it('should return UNAUTHORIZED when no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
        expect(result.error.message).toBe('No active session');
      }
    });
  });

  describe('refreshSession', () => {
    it('should return success with new session when refresh succeeds', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: 9999999999,
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'host' },
        error: null,
      });

      const result = await authService.refreshSession('old-refresh-token');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessToken).toBe('new-access-token');
        expect(result.data.refreshToken).toBe('new-refresh-token');
      }
    });

    it('should return SESSION_EXPIRED when refresh fails', async () => {
      mockSupabase.auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid refresh token' },
      });

      const result = await authService.refreshSession('invalid-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.SESSION_EXPIRED);
      }
    });
  });

  describe('logout', () => {
    it('should return success when logout succeeds', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Logged out successfully');
      }
    });

    it('should return UNKNOWN_ERROR when logout fails', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      const result = await authService.logout();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      }
    });
  });

  describe('isSessionExpired', () => {
    it('should return true when session is expired', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(authService.isSessionExpired(pastTimestamp)).toBe(true);
    });

    it('should return false when session is not expired', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(authService.isSessionExpired(futureTimestamp)).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data when session is valid', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: 9999999999,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      };

      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'host',
        created_at: '2025-01-01T00:00:00Z',
        last_login: '2025-01-25T00:00:00Z',
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // First call for getSession role lookup
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { role: 'host' },
          error: null,
        })
        // Second call for getCurrentUser full user data
        .mockResolvedValueOnce({
          data: mockUserData,
          error: null,
        });

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('user-123');
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.role).toBe('host');
      }
    });

    it('should return error when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });
  });
});
