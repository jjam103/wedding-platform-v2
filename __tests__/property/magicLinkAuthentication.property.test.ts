/**
 * Property-Based Tests for Magic Link Authentication
 * 
 * Tests business rules and invariants for magic link authentication
 * using property-based testing with fast-check.
 * 
 * Requirements: 5.3, 5.9
 * Task: 6.3, 6.4
 */

import * as fc from 'fast-check';
import { testDb } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

describe('Feature: destination-wedding-platform, Magic Link Authentication Properties', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('Property 15: Magic Link Token Expiry', () => {
    it('should reject any token that has expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3600 }), // Seconds expired (1 second to 1 hour)
          async (secondsExpired) => {
            // Arrange - Create guest and expired token
            const guest = await testDb.createGuest({
              email: `expired${Date.now()}@example.com`,
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const expiresAt = new Date(Date.now() - secondsExpired * 1000);
            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: expiresAt.toISOString(),
            });

            // Act - Try to verify expired token
            const response = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            // Assert - Should always be rejected
            expect(response.status).toBe(410);
            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('TOKEN_EXPIRED');

            // Verify no session was created
            const sessions = await testDb.getGuestSessions(guest.id);
            expect(sessions.length).toBe(0);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should accept any token that has not expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 900 }), // Seconds until expiry (1 second to 15 minutes)
          async (secondsUntilExpiry) => {
            // Arrange - Create guest and valid token
            const guest = await testDb.createGuest({
              email: `valid${Date.now()}@example.com`,
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const expiresAt = new Date(Date.now() + secondsUntilExpiry * 1000);
            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: expiresAt.toISOString(),
            });

            // Act - Verify valid token
            const response = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            // Assert - Should always succeed
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.data.guestId).toBe(guest.id);

            // Verify session was created
            const sessions = await testDb.getGuestSessions(guest.id);
            expect(sessions.length).toBe(1);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should set token expiration to exactly 15 minutes from creation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Arrange - Create guest
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const beforeRequest = Date.now();

            // Act - Request magic link
            const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const afterRequest = Date.now();

            // Assert
            if (response.status === 200) {
              const tokens = await testDb.getMagicLinkTokens(guest.id);
              expect(tokens.length).toBeGreaterThan(0);

              const token = tokens[tokens.length - 1]; // Get latest token
              const expiresAt = new Date(token.expires_at).getTime();
              const expectedMin = beforeRequest + 15 * 60 * 1000;
              const expectedMax = afterRequest + 15 * 60 * 1000;

              expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
              expect(expiresAt).toBeLessThanOrEqual(expectedMax);
            }

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 16: Magic Link Single Use', () => {
    it('should reject any token that has already been used', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of reuse attempts
          async (attempts) => {
            // Arrange - Create guest and token
            const guest = await testDb.createGuest({
              email: `singleuse${Date.now()}@example.com`,
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            });

            // Act - Verify token first time (should succeed)
            const firstResponse = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            expect(firstResponse.status).toBe(200);

            // Act - Try to reuse token multiple times
            const reuseResponses = await Promise.all(
              Array.from({ length: attempts }, () =>
                fetch(
                  `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
                  { method: 'GET' }
                )
              )
            );

            // Assert - All reuse attempts should fail
            for (const response of reuseResponses) {
              expect(response.status).toBe(409);
              const data = await response.json();
              expect(data.success).toBe(false);
              expect(data.error.code).toBe('TOKEN_USED');
            }

            // Verify only one session was created
            const sessions = await testDb.getGuestSessions(guest.id);
            expect(sessions.length).toBe(1);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should mark token as used immediately after successful verification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Arrange - Create guest and token
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            });

            // Verify token is not used initially
            const initialToken = await testDb.getMagicLinkToken(token.id);
            expect(initialToken.used).toBe(false);
            expect(initialToken.used_at).toBeNull();

            // Act - Verify token
            const response = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            // Assert - Token should be marked as used
            if (response.status === 200) {
              const updatedToken = await testDb.getMagicLinkToken(token.id);
              expect(updatedToken.used).toBe(true);
              expect(updatedToken.used_at).toBeTruthy();

              // Verify used_at timestamp is recent
              const usedAt = new Date(updatedToken.used_at!).getTime();
              const now = Date.now();
              expect(usedAt).toBeLessThanOrEqual(now);
              expect(usedAt).toBeGreaterThan(now - 5000); // Within last 5 seconds
            }

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 17: Token Generation Uniqueness', () => {
    it('should generate unique tokens for all requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }), // Number of tokens to generate
          async (tokenCount) => {
            // Arrange - Create guest
            const guest = await testDb.createGuest({
              email: `unique${Date.now()}@example.com`,
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            // Act - Request multiple magic links
            const responses = await Promise.all(
              Array.from({ length: tokenCount }, () =>
                fetch('http://localhost:3000/api/guest-auth/magic-link', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: guest.email }),
                })
              )
            );

            // Assert - All requests should succeed
            responses.forEach(response => {
              expect(response.status).toBe(200);
            });

            // Verify all tokens are unique
            const tokens = await testDb.getMagicLinkTokens(guest.id);
            expect(tokens.length).toBe(tokenCount);

            const tokenValues = tokens.map(t => t.token);
            const uniqueTokens = new Set(tokenValues);
            expect(uniqueTokens.size).toBe(tokenCount);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 18: Session Creation on Verification', () => {
    it('should create exactly one session for each successful token verification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Arrange - Create guest and token
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            });

            const sessionsBefore = await testDb.getGuestSessions(guest.id);
            const countBefore = sessionsBefore.length;

            // Act - Verify token
            const response = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            // Assert - Exactly one new session should be created
            if (response.status === 200) {
              const sessionsAfter = await testDb.getGuestSessions(guest.id);
              expect(sessionsAfter.length).toBe(countBefore + 1);

              // Verify session has correct guest_id
              const newSession = sessionsAfter[sessionsAfter.length - 1];
              expect(newSession.guest_id).toBe(guest.id);
            }

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not create session for failed verification attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Arrange - Create guest and expired token
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            const token = await testDb.createMagicLinkToken({
              guest_id: guest.id,
              expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
            });

            const sessionsBefore = await testDb.getGuestSessions(guest.id);
            const countBefore = sessionsBefore.length;

            // Act - Try to verify expired token
            const response = await fetch(
              `http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`,
              { method: 'GET' }
            );

            // Assert - No new session should be created
            expect(response.status).not.toBe(200);
            const sessionsAfter = await testDb.getGuestSessions(guest.id);
            expect(sessionsAfter.length).toBe(countBefore);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 19: Email Case Normalization', () => {
    it('should normalize email to lowercase for all requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          async (localPart) => {
            const email = `${localPart}@example.com`;
            const mixedCaseEmail = email
              .split('')
              .map((char, i) => (i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()))
              .join('');

            // Arrange - Create guest with lowercase email
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            // Act - Request magic link with mixed case email
            const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: mixedCaseEmail }),
            });

            // Assert - Should still work (email normalized)
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);

            // Verify token was created
            const tokens = await testDb.getMagicLinkTokens(guest.id);
            expect(tokens.length).toBeGreaterThan(0);

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 20: Token Security', () => {
    it('should generate tokens with exactly 64 hexadecimal characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (email) => {
            // Arrange - Create guest
            const guest = await testDb.createGuest({
              email: email.toLowerCase(),
              auth_method: 'magic_link',
              first_name: 'Test',
              last_name: 'User',
            });

            // Act - Request magic link
            const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.toLowerCase() }),
            });

            // Assert
            if (response.status === 200) {
              const tokens = await testDb.getMagicLinkTokens(guest.id);
              expect(tokens.length).toBeGreaterThan(0);

              const token = tokens[tokens.length - 1];
              
              // Verify token length (32 bytes = 64 hex characters)
              expect(token.token).toHaveLength(64);
              
              // Verify token contains only hexadecimal characters
              expect(token.token).toMatch(/^[0-9a-f]{64}$/);
            }

            // Cleanup
            await testDb.deleteGuest(guest.id);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
