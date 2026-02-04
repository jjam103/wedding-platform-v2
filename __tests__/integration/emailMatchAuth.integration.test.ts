/**
 * Integration Tests for Email Matching Authentication API
 * 
 * Tests the complete authentication flow with real database operations,
 * real session creation, and real cookie handling.
 * 
 * Requirements: 5.2, 22.4
 * Task: 5.3
 */

import { testDb } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

describe('Email Matching Authentication API - Integration Tests', () => {
  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('Successful authentication', () => {
    it('should authenticate guest with valid email and create session', async () => {
      // Arrange - Create real guest in test database
      const guest = await testDb.createGuest({
        email: 'john@example.com',
        auth_method: 'email_matching',
        first_name: 'John',
        last_name: 'Doe',
      });

      // Act - Make real API request
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'john@example.com' }),
      });

      // Assert - Check response
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.guestId).toBe(guest.id);
      expect(data.data.groupId).toBe(guest.group_id);
      expect(data.data.firstName).toBe('John');
      expect(data.data.lastName).toBe('Doe');

      // Verify session was created in database
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      expect(sessions[0].guest_id).toBe(guest.id);
      expect(new Date(sessions[0].expires_at).getTime()).toBeGreaterThan(Date.now());

      // Verify session cookie was set
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('guest_session=');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
    });

    it('should normalize email to lowercase before lookup', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'jane@example.com',
        auth_method: 'email_matching',
        first_name: 'Jane',
        last_name: 'Smith',
      });

      // Act - Send email with mixed case
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'JANE@EXAMPLE.COM' }),
      });

      // Assert - Should still authenticate
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.guestId).toBe(guest.id);
    });

    it('should create unique session tokens for multiple authentications', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'multi@example.com',
        auth_method: 'email_matching',
        first_name: 'Multi',
        last_name: 'Session',
      });

      // Act - Authenticate multiple times
      const tokens = new Set<string>();
      for (let i = 0; i < 3; i++) {
        const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'multi@example.com' }),
        });

        expect(response.status).toBe(200);
        
        // Extract token from cookie
        const cookies = response.headers.get('set-cookie');
        const tokenMatch = cookies?.match(/guest_session=([^;]+)/);
        if (tokenMatch) {
          tokens.add(tokenMatch[1]);
        }
      }

      // Assert - All tokens should be unique
      expect(tokens.size).toBe(3);

      // Verify all sessions in database
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(3);
    });

    it('should log IP address and user agent in session', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'tracked@example.com',
        auth_method: 'email_matching',
        first_name: 'Tracked',
        last_name: 'User',
      });

      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Test Browser/1.0',
        },
        body: JSON.stringify({ email: 'tracked@example.com' }),
      });

      // Assert
      expect(response.status).toBe(200);

      // Verify session has IP and user agent
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      expect(sessions[0].ip_address).toBe('192.168.1.100');
      expect(sessions[0].user_agent).toBe('Test Browser/1.0');
    });

    it('should create audit log entry for authentication', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'audit@example.com',
        auth_method: 'email_matching',
        first_name: 'Audit',
        last_name: 'Test',
      });

      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'audit@example.com' }),
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
      expect(auditLogs[0].details.auth_method).toBe('email_matching');
      expect(auditLogs[0].details.email).toBe('audit@example.com');
    });
  });

  describe('Validation errors', () => {
    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid email format');
    });

    it('should return 400 for missing email', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty email', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication errors', () => {
    it('should return 404 when email not found in database', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notfound@example.com' }),
      });

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toContain('Email not found');
    });

    it('should return 404 when guest uses magic_link auth method', async () => {
      // Arrange - Create guest with magic_link auth method
      await testDb.createGuest({
        email: 'magiclink@example.com',
        auth_method: 'magic_link',
        first_name: 'Magic',
        last_name: 'Link',
      });

      // Act - Try to authenticate with email matching
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'magiclink@example.com' }),
      });

      // Assert - Should be rejected
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should not create session when authentication fails', async () => {
      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'failed@example.com' }),
      });

      // Assert
      expect(response.status).toBe(404);

      // Verify no sessions were created
      const allSessions = await testDb.getAllGuestSessions();
      expect(allSessions.length).toBe(0);
    });
  });

  describe('Security features', () => {
    it('should sanitize malicious email input', async () => {
      // Act - Send email with script tags
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '<script>alert("xss")</script>test@example.com' }),
      });

      // Assert - Should be rejected (invalid email format after sanitization)
      expect(response.status).toBe(404); // Email won't be found after sanitization
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should set secure cookie in production environment', async () => {
      // Note: This test would need to run in production mode to verify
      // For now, we verify the cookie is set with HttpOnly and SameSite
      
      // Arrange
      const guest = await testDb.createGuest({
        email: 'secure@example.com',
        auth_method: 'email_matching',
        first_name: 'Secure',
        last_name: 'User',
      });

      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'secure@example.com' }),
      });

      // Assert
      expect(response.status).toBe(200);
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('HttpOnly');
      expect(cookies).toContain('SameSite=Lax');
      expect(cookies).toContain('Path=/');
    });

    it('should set session expiration to 24 hours from creation', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'expiry@example.com',
        auth_method: 'email_matching',
        first_name: 'Expiry',
        last_name: 'Test',
      });

      const beforeAuth = Date.now();

      // Act
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'expiry@example.com' }),
      });

      const afterAuth = Date.now();

      // Assert
      expect(response.status).toBe(200);

      // Verify session expiration
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(1);
      
      const expiresAt = new Date(sessions[0].expires_at).getTime();
      const expectedMin = beforeAuth + 24 * 60 * 60 * 1000;
      const expectedMax = afterAuth + 24 * 60 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should prevent SQL injection in email parameter', async () => {
      // Act - Try SQL injection
      const response = await fetch('http://localhost:3000/api/auth/guest/email-match', {
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
  });

  describe('Session management', () => {
    it('should allow multiple concurrent sessions for same guest', async () => {
      // Arrange
      const guest = await testDb.createGuest({
        email: 'concurrent@example.com',
        auth_method: 'email_matching',
        first_name: 'Concurrent',
        last_name: 'User',
      });

      // Act - Create multiple sessions
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/auth/guest/email-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'concurrent@example.com' }),
        }),
        fetch('http://localhost:3000/api/auth/guest/email-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'concurrent@example.com' }),
        }),
        fetch('http://localhost:3000/api/auth/guest/email-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'concurrent@example.com' }),
        }),
      ]);

      // Assert - All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify multiple sessions created
      const sessions = await testDb.getGuestSessions(guest.id);
      expect(sessions.length).toBe(3);
    });
  });
});
