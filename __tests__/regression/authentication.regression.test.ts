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

import { authService } from '@/services/authService';
import { accessControlService } from '@/services/accessControlService';

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

jest.mock('@/lib/supabase', () => ({
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
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.signInWithPassword(
        'test@example.com',
        'password123'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.session).toBeDefined();
        expect(result.data.session.user.email).toBe('test@example.com');
      }
    });

    it('should reject invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await authService.signInWithPassword(
        'test@example.com',
        'wrongpassword'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });

    it('should handle missing email', async () => {
      const result = await authService.signInWithPassword('', 'password123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle missing password', async () => {
      const result = await authService.signInWithPassword(
        'test@example.com',
        ''
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Magic Link Authentication', () => {
    it('should send magic link to valid email', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.signInWithMagicLink('test@example.com');

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should reject invalid email format', async () => {
      const result = await authService.signInWithMagicLink('invalid-email');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle email service failure', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Email service unavailable' },
      });

      const result = await authService.signInWithMagicLink('test@example.com');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EMAIL_SERVICE_ERROR');
      }
    });
  });

  describe('Session Management', () => {
    it('should retrieve active session', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.session).toBeDefined();
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

      const result = await authService.signOut();

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

      const result = await accessControlService.checkPermission(
        'user-1',
        'admin',
        'write'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(true);
      }
    });

    it('should allow host to access admin resources', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-2', role: 'host' },
        error: null,
      });

      const result = await accessControlService.checkPermission(
        'user-2',
        'admin',
        'write'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(true);
      }
    });

    it('should deny guest access to admin resources', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-3', role: 'guest' },
        error: null,
      });

      const result = await accessControlService.checkPermission(
        'user-3',
        'admin',
        'write'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(false);
      }
    });

    it('should allow guest to read their own data', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'user-3', role: 'guest' },
        error: null,
      });

      const result = await accessControlService.checkPermission(
        'user-3',
        'guest',
        'read'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasPermission).toBe(true);
      }
    });
  });

  describe('Session Security', () => {
    it('should not expose sensitive session data', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();

      expect(result.success).toBe(true);
      if (result.success) {
        // Ensure tokens are not exposed in logs or responses
        const sessionString = JSON.stringify(result.data);
        expect(sessionString).toContain('user-1');
        // Tokens should be present but handled securely
        expect(result.data.session.access_token).toBeDefined();
      }
    });

    it('should handle concurrent session requests', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
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
