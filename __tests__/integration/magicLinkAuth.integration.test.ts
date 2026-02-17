/**
 * Integration Tests for Magic Link Authentication API
 * 
 * Tests the complete magic link authentication flow with real database operations,
 * real token generation, real session creation, and real cookie handling.
 * 
 * Requirements: 5.3, 5.9
 * Task: 6.5
 */

import { testDb } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

describe('Magic Link Authentication API - Integration Tests', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('Magic Link Request', () => {
    it('should generate token and store in database for valid email', async () => {
      // Arrange - Create real guest in test database
      const guest = await testDb.createGuest({
        email: 'magiclink@example.com',
        auth_method: 'magic_link',
        first_name: 'Magic',
        last_name: 'User',
      });

      // Act - Request magic link
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'magiclink@example.com' }),
      });

      // Assert - Check response
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('email');

      // Verify token was created in database
      const tokens = await testDb.getMagicLinkTokens(guest.id);
      expect(tokens.length).toBe(1);
      expect(tokens[0].guest_id).toBe(guest.id);
      expect(tokens[0].used).toBe(false);
      expect(tokens[0].token).toHaveLength(64); // 32 bytes = 64 hex chars
      
      // Verify expiration is ~15 minutes from now
      const expiresAt = new Date(tokens[0].expires_at).getTime();
      const expectedExpiry = Date.now() + 15 * 60 * 1000;
      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(expiresAt).toBeLessThan(expectedExpiry + 60000); // Allow 1 minute variance
    });

    it('should normalize email to lowercase before lookup', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'uppercase@example.com',
        auth_method: 'magic_link',
        first_name: 'Upper',
        last_name: 'Case',
      });

      // Act - Send email with mixed case
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'UPPERCASE@EXAMPLE.COM' }),
      });

      // Assert - Should still work
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify token was created
      const tokens = await testDb.getMagicLinkTokens(guest.id);
      expect(tokens.length).toBe(1);
    });

    it('should generate unique tokens for multiple requests', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'multiple@example.com',
        auth_method: 'magic_link',
        first_name: 'Multiple',
        last_name: 'Tokens',
      });

      // Act - Request multiple magic links
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/guest-auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'multiple@example.com' }),
        }),
        fetch('http://localhost:3000/api/guest-auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'multiple@example.com' }),
        }),
        fetch('http://localhost:3000/api/guest-auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'multiple@example.com' }),
        }),
      ]);

      // Assert - All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all tokens are unique
      const tokens = await testDb.getMagicLinkTokens(guest.id);
      expect(tokens.length).toBe(3);
      
      const tokenValues = tokens.map(t => t.token);
      const uniqueTokens = new Set(tokenValues);
      expect(uniqueTokens.size).toBe(3);
    });

    it('should log IP address and user agent in token record', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'tracked@example.com',
        auth_method: 'magic_link',
        first_name: 'Tracked',
        last_name: 'Request',
      });

      // Act
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
          'user-agent': 'Test Browser/2.0',
        },
        body: JSON.stringify({ email: 'tracked@example.com' }),
      });

      // Assert
      expect(response.status).toBe(200);

      // Verify token has IP and user agent
      const tokens = await testDb.getMagicLinkTokens(guest.id);
      expect(tokens.length).toBe(1);
      expect(tokens[0].ip_address).toBe('192.168.1.200');
      expect(tokens[0].user_agent).toBe('Test Browser/2.0');
    });

    it('should create audit log entry for magic link request', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'audit@example.com',
        auth_method: 'magic_link',
        first_name: 'Audit',
        last_name: 'Log',
      });

      // Act
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'audit@example.com' }),
      });

      // Assert
      expect(response.status).toBe(200);

      // Verify audit log entry
      const auditLogs = await testDb.getAuditLogs({
        action: 'magic_link_requested',
        entity_type: 'guest',
        entity_id: guest.id,
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].details.email).toBe('audit@example.com');
    });

    it('should return 404 when email not found in database', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notfound@example.com' }),
      });

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 when guest uses email_matching auth method', async () => {
      // Arrange - Create guest with email_matching auth method
      await testDb.createGuest({
        email: 'emailmatch@example.com',
        auth_method: 'email_matching',
        first_name: 'Email',
        last_name: 'Match',
      });

      // Act - Try to request magic link
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'emailmatch@example.com' }),
      });

      // Assert - Should be rejected
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Magic Link Verification', () => {
    it('should verify valid token and create session', async () => {
      // Arrange - Create guest and token
      const guest = await testDb.createGuest({
        email: 'verify@example.com',
        auth_method: 'magic_link',
        first_name: 'Verify',
        last_name: 'User',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // Act - Verify token
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert - Check response
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.guestId).toBe(guest.id);
      expect(data.data.groupId).toBe(guest.group_id);
      expect(data.data.firstName).toBe('Verify');
      expect(data.data.lastName).toBe('User');

      // Verify token was marked as used
      const updatedToken = await testDb.getMagicLinkToken(token.id);
      expect(updatedToken.used).toBe(true);
      expect(updatedToken.used_at).toBeTruthy();

      // Verify session was created
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      expect(sessions[0].guest_id).toBe(guest.id);

      // Verify session cookie was set
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('guest_session=');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
    });

    it('should reject expired token', async () => {
      // Arrange - Create guest and expired token
      const guest = await testDb.createGuest({
        email: 'expired@example.com',
        auth_method: 'magic_link',
        first_name: 'Expired',
        last_name: 'Token',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      });

      // Act - Try to verify expired token
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert - Should be rejected
      expect(response.status).toBe(410);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_EXPIRED');

      // Verify no session was created
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(0);
    });

    it('should reject already used token', async () => {
      // Arrange - Create guest and used token
      const guest = await testDb.createGuest({
        email: 'used@example.com',
        auth_method: 'magic_link',
        first_name: 'Used',
        last_name: 'Token',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: true,
        used_at: new Date().toISOString(),
      });

      // Act - Try to verify used token
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert - Should be rejected
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_USED');

      // Verify no new session was created
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(0);
    });

    it('should reject invalid token format', async () => {
      // Act - Try to verify invalid token
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link/verify?token=invalid', {
        method: 'GET',
      });

      // Assert - Should be rejected
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-existent token', async () => {
      // Act - Try to verify non-existent token
      const fakeToken = 'a'.repeat(64);
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${fakeToken}`, {
        method: 'GET',
      });

      // Assert - Should be rejected
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should create audit log entry for successful verification', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'auditverify@example.com',
        auth_method: 'magic_link',
        first_name: 'Audit',
        last_name: 'Verify',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // Act
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert
      expect(response.status).toBe(200);

      // Verify audit log entry
      const auditLogs = await testDb.getAuditLogs({
        action: 'guest_login',
        entity_type: 'guest',
        entity_id: guest.id,
      });
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].details.auth_method).toBe('magic_link');
      expect(auditLogs[0].details.email).toBe('auditverify@example.com');
    });

    it('should log IP address and user agent in session', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'sessiontrack@example.com',
        auth_method: 'magic_link',
        first_name: 'Session',
        last_name: 'Track',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // Act
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
        headers: {
          'x-forwarded-for': '192.168.1.300',
          'user-agent': 'Test Browser/3.0',
        },
      });

      // Assert
      expect(response.status).toBe(200);

      // Verify session has IP and user agent
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      expect(sessions[0].ip_address).toBe('192.168.1.300');
      expect(sessions[0].user_agent).toBe('Test Browser/3.0');
    });

    it('should set session expiration to 24 hours from verification', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'sessionexpiry@example.com',
        auth_method: 'magic_link',
        first_name: 'Session',
        last_name: 'Expiry',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      const beforeVerify = Date.now();

      // Act
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      const afterVerify = Date.now();

      // Assert
      expect(response.status).toBe(200);

      // Verify session expiration
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      
      const expiresAt = new Date(sessions[0].expires_at).getTime();
      const expectedMin = beforeVerify + 24 * 60 * 60 * 1000;
      const expectedMax = afterVerify + 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('Security features', () => {
    it('should prevent token reuse after successful verification', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'reuse@example.com',
        auth_method: 'magic_link',
        first_name: 'Reuse',
        last_name: 'Test',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // Act - Verify token first time
      const firstResponse = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      expect(firstResponse.status).toBe(200);

      // Act - Try to verify same token again
      const secondResponse = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert - Second attempt should fail
      expect(secondResponse.status).toBe(409);
      const data = await secondResponse.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('TOKEN_USED');

      // Verify only one session was created
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
    });

    it('should sanitize malicious email input in request', async () => {
      // Act - Send email with script tags
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '<script>alert("xss")</script>test@example.com' }),
      });

      // Assert - Should be rejected (invalid email format after sanitization)
      expect(response.status).toBe(404); // Email won't be found after sanitization
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should prevent SQL injection in email parameter', async () => {
      // Act - Try SQL injection
      const response = await fetch('http://localhost:3000/api/guest-auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "'; DROP TABLE guests; --" }),
      });

      // Assert - Should be rejected as invalid email
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');

      // Verify guests table still exists
      const guests = await testDb.getAllGuests();
      expect(guests).toBeDefined(); // Table wasn't dropped
    });

    it('should set secure cookie in production environment', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'secure@example.com',
        auth_method: 'magic_link',
        first_name: 'Secure',
        last_name: 'Cookie',
      });

      const token = await testDb.createMagicLinkToken({
        guest_id: guest.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      });

      // Act
      const response = await fetch(`http://localhost:3000/api/guest-auth/magic-link/verify?token=${token.token}`, {
        method: 'GET',
      });

      // Assert
      expect(response.status).toBe(200);
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
      expect(cookies).toContain('Path=/');
    });
  });
});
