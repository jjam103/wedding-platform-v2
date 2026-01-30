/**
 * Integration tests for authentication API routes
 * 
 * Tests authentication endpoints including:
 * - User creation flow
 * - Logout functionality
 * - Session management
 * - Error handling
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill Request for tests
if (typeof Request === 'undefined') {
  global.Request = class Request {
    method: string;
    url: string;
    headers: Map<string, string>;
    body: string | null;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string);
        });
      }
      this.body = init?.body || null;
    }

    async json() {
      return JSON.parse(this.body || '{}');
    }
  } as any;
}

// Mock Next.js server module to avoid Request/Response issues
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { POST as createUserPOST } from '@/app/api/auth/create-user/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';

// Mock Supabase modules to avoid worker crashes
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Authentication API Routes', () => {
  let mockSupabaseAdmin: any;
  let mockSupabaseClient: any;
  let mockCookies: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock admin client for create-user route
    mockSupabaseAdmin = {
      auth: {
        admin: {
          getUserById: jest.fn(),
        },
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };

    // Mock regular client for logout route
    mockSupabaseClient = {
      auth: {
        signOut: jest.fn(),
      },
    };

    // Mock cookies
    mockCookies = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
    };

    // Setup module mocks
    const { createClient } = require('@supabase/supabase-js');
    createClient.mockReturnValue(mockSupabaseAdmin);

    const { createServerClient } = require('@supabase/ssr');
    createServerClient.mockReturnValue(mockSupabaseClient);

    const { cookies } = require('next/headers');
    cookies.mockResolvedValue(mockCookies);

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('POST /api/auth/create-user', () => {
    it('should create user successfully when valid data provided', async () => {
      // Mock successful user lookup
      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com' },
        error: null,
      });

      // Mock successful user insertion
      mockSupabaseAdmin.insert.mockResolvedValue({
        error: null,
      });

      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabaseAdmin.auth.admin.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          // Missing email and role
        }),
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should return 500 when Supabase environment variables are missing', async () => {
      // Remove environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SECRET_KEY;

      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Server configuration error');
    });

    it('should return 404 when user not found in auth system', async () => {
      // Mock user not found
      mockSupabaseAdmin.auth.admin.getUserById
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'User not found' },
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'User not found' },
        });

      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'nonexistent-user',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found in authentication system');
    });

    it('should return 500 when database insertion fails', async () => {
      // Mock successful user lookup
      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com' },
        error: null,
      });

      // Mock database insertion failure
      mockSupabaseAdmin.insert.mockResolvedValue({
        error: { message: 'Database connection failed' },
      });

      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create user record');
      expect(data.details).toBe('Database connection failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock JSON parsing error
      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully when user is authenticated', async () => {
      // Mock successful logout
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Logged out successfully');
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should return 500 when logout fails', async () => {
      // Mock logout failure
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Session not found' },
      });

      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('LOGOUT_FAILED');
      expect(data.error.message).toBe('Failed to logout');
      expect(data.error.details).toBe('Session not found');
    });

    it('should handle unexpected errors during logout', async () => {
      // Mock unexpected error
      mockSupabaseClient.auth.signOut.mockRejectedValue(new Error('Network error'));

      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('An unexpected error occurred during logout');
    });

    it('should handle cookie operations correctly', async () => {
      // Mock successful logout
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      // Mock cookies with existing session data
      mockCookies.getAll.mockReturnValue([
        { name: 'sb-access-token', value: 'token123' },
        { name: 'sb-refresh-token', value: 'refresh123' },
      ]);

      const request = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await logoutPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify Supabase client was created with cookie configuration
      const { createServerClient } = require('@supabase/ssr');
      expect(createServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });
  });

  describe('Session Management Integration', () => {
    it('should handle session lifecycle correctly', async () => {
      // Test user creation followed by logout
      
      // 1. Create user
      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue({
        data: { id: 'user-123', email: 'test@example.com' },
        error: null,
      });
      mockSupabaseAdmin.insert.mockResolvedValue({ error: null });

      const createRequest = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const createResponse = await createUserPOST(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(200);
      expect(createData.success).toBe(true);

      // 2. Logout user
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      const logoutRequest = new Request('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const logoutResponse = await logoutPOST(logoutRequest);
      const logoutData = await logoutResponse.json();

      expect(logoutResponse.status).toBe(200);
      expect(logoutData.success).toBe(true);
      expect(logoutData.data.message).toBe('Logged out successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in create-user request', async () => {
      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"userId": "test", "email": "test@example.com", "role":}', // Invalid JSON
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle missing Content-Type header', async () => {
      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'admin',
        }),
      });

      const response = await createUserPOST(request);
      
      // Should return 500 due to missing environment variables in test
      expect(response.status).toBe(500);
    });

    it('should handle empty request body', async () => {
      const request = new Request('http://localhost:3000/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '',
      });

      const response = await createUserPOST(request);
      const data = await response.json();

      // Empty body results in missing required fields, so returns 400
      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });
});