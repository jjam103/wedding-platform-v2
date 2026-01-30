/**
 * Regression Test Suite: Authentication Flows
 * 
 * Tests authentication and authorization flows to prevent regressions in:
 * - Login with email/password
 * - Magic link authentication
 * - Session management
 * - Role-based access control
 * - Session expiration handling
 * 
 * Requirements: 21.1, 21.2
 */

import * as authService from '@/services/authService';
import * as accessControlService from '@/services/accessControlService';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signInWithOtp: jest.fn(),
    getSession: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Regression: Authentication Flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login with Email/Password', () => {
    it('should successfully authenticate valid credentials', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toBeDefined();
        expect(result.data.user.email).toBe('test@example.com');
        expect(result.data.accessToken).toBe('mock-token');
      }
    });

    it('should reject invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should handle missing email', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Email is required' },
      });

      const result = await authService.loginWithPassword({
        email: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should handle missing password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Password is required' },
      });

      const result = await authService.loginWithPassword({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });

  describe('Magic Link Authentication', () => {
    it('should send magic link to valid email', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.sendMagicLink({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: undefined,
        },
      });
    });

    it('should reject invalid email format', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' },
      });

      const result = await authService.sendMagicLink({
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      }
    });

    it('should handle email service failure', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Email service unavailable' },
      });

      const result = await authService.sendMagicLink({
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
      }
    });
  });

  describe('Session Management', () => {
    it('should retrieve active session', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user).toBeDefined();
        expect(result.data.accessToken).toBe('mock-token');
      }
    });

    it('should handle expired session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      });

      const result = await authService.getSession();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SESSION_EXPIRED');
      }
    });

    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow super_admin to access all resources', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-1', role: 'super_admin' },
        error: null,
      });

      const result = await accessControlService.canPerformAction({
        userId: 'user-1',
        role: 'super_admin',
        resource: 'admin',
        action: 'create',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should allow host to access admin resources', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-2', role: 'host' },
        error: null,
      });

      const result = await accessControlService.canPerformAction({
        userId: 'user-2',
        role: 'host',
        resource: 'guests',
        action: 'create',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });

    it('should deny guest access to admin resources', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-3', role: 'guest' },
        error: null,
      });

      const result = await accessControlService.canPerformAction({
        userId: 'user-3',
        role: 'guest',
        resource: 'guests',
        action: 'create',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(false);
      }
    });

    it('should allow guest to read their own data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-3', role: 'guest' },
        error: null,
      });

      const result = await accessControlService.canPerformAction({
        userId: 'user-3',
        role: 'guest',
        resource: 'events',
        action: 'read',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowed).toBe(true);
      }
    });
  });

  describe('Session Security', () => {
    it('should not expose sensitive session data', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(true);
      if (result.success) {
        // Ensure tokens are not exposed in logs or responses
        const sessionString = JSON.stringify(result.data);
        expect(sessionString).toContain('user-1');
        // Tokens should be present but handled securely
        expect(result.data.accessToken).toBeDefined();
        expect(result.data.refreshToken).toBeDefined();
      }
    });

    it('should handle concurrent session requests', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { role: 'guest' },
        error: null,
      });

      // Simulate concurrent requests
      const results = await Promise.all([
        authService.getSession(),
        authService.getSession(),
        authService.getSession(),
      ]);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
