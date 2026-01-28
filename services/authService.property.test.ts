import * as fc from 'fast-check';
import * as authService from './authService';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

/**
 * Property-based tests for authentication service.
 * Feature: destination-wedding-platform, Property 1: Authentication Session Creation
 * 
 * Validates: Requirements 1.3
 */

describe('Feature: destination-wedding-platform, Property 1: Authentication Session Creation', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  it('should create valid session token for any valid user credentials', () => {
    // Arbitrary for generating valid email addresses
    const emailArbitrary = fc.emailAddress();
    
    // Arbitrary for generating passwords (min 6 chars for realistic validation)
    const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 });
    
    // Arbitrary for user roles
    const roleArbitrary = fc.constantFrom('super_admin', 'host', 'guest');
    
    // Arbitrary for user IDs (UUID format)
    const userIdArbitrary = fc.uuid();
    
    // Arbitrary for timestamps (future dates for valid sessions)
    const futureTimestampArbitrary = fc.integer({ 
      min: Math.floor(Date.now() / 1000) + 3600, // At least 1 hour in future
      max: Math.floor(Date.now() / 1000) + 86400 * 30, // Up to 30 days
    });

    fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        userIdArbitrary,
        roleArbitrary,
        futureTimestampArbitrary,
        async (email, password, userId, role, expiresAt) => {
          // Setup mock to return successful authentication
          const mockSession = {
            access_token: `token-${userId}`,
            refresh_token: `refresh-${userId}`,
            expires_at: expiresAt,
          };
          
          const mockUser = {
            id: userId,
            email: email,
          };

          mockSupabase.auth.signInWithPassword.mockResolvedValue({
            data: { session: mockSession, user: mockUser },
            error: null,
          });

          mockSupabase.single.mockResolvedValue({
            data: { role },
            error: null,
          });

          // Execute login
          const result = await authService.loginWithPassword({
            email,
            password,
          });

          // Property: For any valid credentials, login should succeed
          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Session should contain valid user information
            expect(result.data.user.id).toBe(userId);
            expect(result.data.user.email).toBe(email);
            expect(result.data.user.role).toBe(role);
            
            // Property: Session should contain valid tokens
            expect(result.data.accessToken).toBeTruthy();
            expect(result.data.accessToken).toContain('token-');
            expect(result.data.refreshToken).toBeTruthy();
            expect(result.data.refreshToken).toContain('refresh-');
            
            // Property: Session should have valid expiration
            expect(result.data.expiresAt).toBe(expiresAt);
            expect(result.data.expiresAt).toBeGreaterThan(Date.now() / 1000);
            
            // Property: Session should not be expired
            expect(authService.isSessionExpired(result.data.expiresAt)).toBe(false);
          }
        }
      ),
      { numRuns: 20, timeout: 5000 }
    );
  });

  it('should store session securely with proper token format', () => {
    const emailArbitrary = fc.emailAddress();
    const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 });
    const userIdArbitrary = fc.uuid();
    const roleArbitrary = fc.constantFrom('super_admin', 'host', 'guest');

    fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        userIdArbitrary,
        roleArbitrary,
        async (email, password, userId, role) => {
          const mockSession = {
            access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(userId).toString('base64')}`,
            refresh_token: `refresh_${userId}_${Date.now()}`,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          };

          mockSupabase.auth.signInWithPassword.mockResolvedValue({
            data: { 
              session: mockSession, 
              user: { id: userId, email } 
            },
            error: null,
          });

          mockSupabase.single.mockResolvedValue({
            data: { role },
            error: null,
          });

          const result = await authService.loginWithPassword({ email, password });

          expect(result.success).toBe(true);
          
          if (result.success) {
            // Property: Access token should be in JWT-like format
            expect(result.data.accessToken).toMatch(/^eyJ/);
            
            // Property: Refresh token should be unique and contain user identifier
            expect(result.data.refreshToken).toContain('refresh_');
            expect(result.data.refreshToken).toContain(userId);
            
            // Property: Tokens should be different
            expect(result.data.accessToken).not.toBe(result.data.refreshToken);
          }
        }
      ),
      { numRuns: 20, timeout: 5000 }
    );
  });

  it('should maintain session consistency across getSession calls', () => {
    const userIdArbitrary = fc.uuid();
    const emailArbitrary = fc.emailAddress();
    const roleArbitrary = fc.constantFrom('super_admin', 'host', 'guest');
    const expiresAtArbitrary = fc.integer({
      min: Math.floor(Date.now() / 1000) + 3600,
      max: Math.floor(Date.now() / 1000) + 86400,
    });

    fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        emailArbitrary,
        roleArbitrary,
        expiresAtArbitrary,
        async (userId, email, role, expiresAt) => {
          const mockSession = {
            access_token: `token-${userId}`,
            refresh_token: `refresh-${userId}`,
            expires_at: expiresAt,
            user: { id: userId, email },
          };

          mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: mockSession },
            error: null,
          });

          mockSupabase.single.mockResolvedValue({
            data: { role },
            error: null,
          });

          // Get session multiple times
          const result1 = await authService.getSession();
          const result2 = await authService.getSession();

          // Property: Both calls should succeed
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          if (result1.success && result2.success) {
            // Property: Session data should be consistent
            expect(result1.data.user.id).toBe(result2.data.user.id);
            expect(result1.data.user.email).toBe(result2.data.user.email);
            expect(result1.data.user.role).toBe(result2.data.user.role);
            expect(result1.data.accessToken).toBe(result2.data.accessToken);
            expect(result1.data.expiresAt).toBe(result2.data.expiresAt);
          }
        }
      ),
      { numRuns: 20, timeout: 5000 }
    );
  });

  it('should handle session expiration correctly for any timestamp', () => {
    // Generate timestamps both in past and future
    const timestampArbitrary = fc.integer({
      min: 0,
      max: Math.floor(Date.now() / 1000) + 86400 * 365, // Up to 1 year
    });

    fc.assert(
      fc.property(timestampArbitrary, (timestamp) => {
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = authService.isSessionExpired(timestamp);

        // Property: Timestamps in the past should be expired
        if (timestamp < currentTime) {
          expect(isExpired).toBe(true);
        }
        
        // Property: Timestamps in the future should not be expired
        if (timestamp >= currentTime) {
          expect(isExpired).toBe(false);
        }
      }),
      { numRuns: 20, timeout: 5000 }
    );
  });

  it('should create unique sessions for different users', () => {
    const userArbitrary = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      password: fc.string({ minLength: 6, maxLength: 50 }),
      role: fc.constantFrom('super_admin', 'host', 'guest'),
    });

    fc.assert(
      fc.asyncProperty(
        fc.array(userArbitrary, { minLength: 2, maxLength: 10 }),
        async (users) => {
          const sessions: any[] = [];

          for (const user of users) {
            const mockSession = {
              access_token: `token-${user.id}`,
              refresh_token: `refresh-${user.id}`,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
            };

            mockSupabase.auth.signInWithPassword.mockResolvedValue({
              data: { 
                session: mockSession, 
                user: { id: user.id, email: user.email } 
              },
              error: null,
            });

            mockSupabase.single.mockResolvedValue({
              data: { role: user.role },
              error: null,
            });

            const result = await authService.loginWithPassword({
              email: user.email,
              password: user.password,
            });

            if (result.success) {
              sessions.push(result.data);
            }
          }

          // Property: All sessions should be created successfully
          expect(sessions.length).toBe(users.length);

          // Property: Each session should have unique tokens
          const accessTokens = sessions.map(s => s.accessToken);
          const uniqueAccessTokens = new Set(accessTokens);
          expect(uniqueAccessTokens.size).toBe(sessions.length);

          // Property: Each session should correspond to correct user
          for (let i = 0; i < sessions.length; i++) {
            expect(sessions[i].user.id).toBe(users[i].id);
            expect(sessions[i].user.email).toBe(users[i].email);
            expect(sessions[i].user.role).toBe(users[i].role);
          }
        }
      ),
      { numRuns: 10, timeout: 5000 } // Fewer runs for array tests
    );
  });
});
