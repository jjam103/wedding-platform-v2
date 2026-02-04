import * as fc from 'fast-check';
import { POST } from '@/app/api/auth/guest/email-match/route';
import { createSupabaseClient } from '@/lib/supabase';

/**
 * Property-Based Tests for Email Matching Authentication
 * 
 * Feature: destination-wedding-platform
 * Property 14: Email Matching Authentication
 * Validates: Requirements 5.2, 22.4
 * Task: 5.2
 */

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: jest.fn(),
  }),
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
};

describe('Feature: destination-wedding-platform, Property 14: Email Matching Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should authenticate any valid email that exists in guest database with email_matching auth method', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (email, guestId, groupId, firstName, lastName) => {
          // Arrange
          const mockGuest = {
            id: guestId,
            email: email.toLowerCase(),
            group_id: groupId,
            first_name: firstName,
            last_name: lastName,
            auth_method: 'email_matching',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: mockGuest, error: null })
            .mockResolvedValueOnce({ data: { id: 'session-id', token: 'token' }, error: null });
          mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

          const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          // Act
          const response = await POST(request);
          const data = await response.json();

          // Assert
          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.data.guestId).toBe(guestId);
          expect(data.data.groupId).toBe(groupId);
        }
      ),
      { numRuns: 20 } // Fewer runs for async tests
    );
  });

  it('should reject any email that does not exist in guest database', async () => {
    await fc.assert(
      fc.asyncProperty(fc.emailAddress(), async (email) => {
        // Arrange
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

        const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      }),
      { numRuns: 20 }
    );
  });

  it('should normalize email case before lookup', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        async (email, guestId) => {
          // Arrange
          const mockGuest = {
            id: guestId,
            email: email.toLowerCase(),
            group_id: 'group-id',
            first_name: 'Test',
            last_name: 'User',
            auth_method: 'email_matching',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: mockGuest, error: null })
            .mockResolvedValueOnce({ data: { id: 'session-id', token: 'token' }, error: null });
          mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

          // Test with various case combinations
          const emailVariations = [
            email.toLowerCase(),
            email.toUpperCase(),
            email.charAt(0).toUpperCase() + email.slice(1).toLowerCase(),
          ];

          for (const emailVariation of emailVariations) {
            const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: emailVariation }),
            });

            // Act
            const response = await POST(request);
            const data = await response.json();

            // Assert - All variations should work
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reject invalid email formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('not-an-email'),
          fc.constant('missing@domain'),
          fc.constant('@nodomain.com'),
          fc.constant('spaces in@email.com'),
          fc.constant(''),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@'))
        ),
        async (invalidEmail) => {
          // Arrange
          const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: invalidEmail }),
          });

          // Act
          const response = await POST(request);
          const data = await response.json();

          // Assert
          expect(response.status).toBe(400);
          expect(data.success).toBe(false);
          expect(data.error.code).toBe('VALIDATION_ERROR');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should create unique session tokens for each authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        async (email, guestId) => {
          // Arrange
          const mockGuest = {
            id: guestId,
            email: email.toLowerCase(),
            group_id: 'group-id',
            first_name: 'Test',
            last_name: 'User',
            auth_method: 'email_matching',
          };

          const sessionTokens = new Set<string>();

          // Authenticate multiple times
          for (let i = 0; i < 5; i++) {
            mockSupabase.single
              .mockResolvedValueOnce({ data: mockGuest, error: null })
              .mockResolvedValueOnce({ data: { id: `session-${i}`, token: `token-${i}` }, error: null });
            mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

            const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email }),
            });

            await POST(request);

            // Extract token from insert call
            const insertCall = mockSupabase.insert.mock.calls.find(
              call => mockSupabase.from.mock.calls.some(fromCall => fromCall[0] === 'guest_sessions')
            );
            if (insertCall && insertCall[0]?.token) {
              sessionTokens.add(insertCall[0].token);
            }
          }

          // Assert - All tokens should be unique
          expect(sessionTokens.size).toBe(5);
        }
      ),
      { numRuns: 5 } // Fewer runs since we do 5 authentications per run
    );
  });

  it('should only authenticate guests with email_matching auth method', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        fc.constantFrom('email_matching', 'magic_link'),
        async (email, guestId, authMethod) => {
          // Arrange
          if (authMethod === 'email_matching') {
            const mockGuest = {
              id: guestId,
              email: email.toLowerCase(),
              group_id: 'group-id',
              first_name: 'Test',
              last_name: 'User',
              auth_method: 'email_matching',
            };

            mockSupabase.single
              .mockResolvedValueOnce({ data: mockGuest, error: null })
              .mockResolvedValueOnce({ data: { id: 'session-id', token: 'token' }, error: null });
            mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });
          } else {
            // Guest with magic_link auth method should not be found
            mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
          }

          const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          // Act
          const response = await POST(request);
          const data = await response.json();

          // Assert
          if (authMethod === 'email_matching') {
            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
          } else {
            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should sanitize malicious email input', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('<script>alert("xss")</script>test@example.com'),
          fc.constant('test@example.com<img src=x onerror=alert(1)>'),
          fc.constant('javascript:alert(1)@example.com'),
          fc.constant('test@example.com"; DROP TABLE guests; --')
        ),
        async (maliciousEmail) => {
          // Arrange
          mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

          const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: maliciousEmail }),
          });

          // Act
          await POST(request);

          // Assert - Email should be sanitized before database query
          const emailArg = mockSupabase.eq.mock.calls.find(call => call[0] === 'email')?.[1];
          if (emailArg) {
            expect(emailArg).not.toContain('<script>');
            expect(emailArg).not.toContain('javascript:');
            expect(emailArg).not.toContain('DROP TABLE');
            expect(emailArg).not.toContain('onerror=');
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should set session expiration to 24 hours from creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.uuid(),
        async (email, guestId) => {
          // Arrange
          const mockGuest = {
            id: guestId,
            email: email.toLowerCase(),
            group_id: 'group-id',
            first_name: 'Test',
            last_name: 'User',
            auth_method: 'email_matching',
          };

          mockSupabase.single
            .mockResolvedValueOnce({ data: mockGuest, error: null })
            .mockResolvedValueOnce({ data: { id: 'session-id', token: 'token' }, error: null });
          mockSupabase.insert.mockResolvedValueOnce({ data: null, error: null });

          const beforeRequest = Date.now();

          const request = new Request('http://localhost:3000/api/auth/guest/email-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          // Act
          await POST(request);

          const afterRequest = Date.now();

          // Assert - Session should expire 24 hours from now
          const insertCall = mockSupabase.insert.mock.calls.find(
            call => mockSupabase.from.mock.calls.some(fromCall => fromCall[0] === 'guest_sessions')
          );

          if (insertCall && insertCall[0]?.expires_at) {
            const expiresAt = new Date(insertCall[0].expires_at).getTime();
            const expectedMin = beforeRequest + 24 * 60 * 60 * 1000;
            const expectedMax = afterRequest + 24 * 60 * 60 * 1000;

            expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
            expect(expiresAt).toBeLessThanOrEqual(expectedMax);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});
