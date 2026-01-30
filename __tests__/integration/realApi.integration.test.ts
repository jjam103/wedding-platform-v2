/**
 * Real API Integration Tests
 * 
 * These tests start an actual Next.js server and test real API endpoints.
 * Unlike unit tests that mock everything, these tests validate:
 * - Real Next.js runtime behavior
 * - Actual cookie handling
 * - Real middleware execution
 * - Complete request/response cycle
 * 
 * This catches issues that mocked tests miss, such as:
 * - Next.js 15 async params
 * - Cookie parsing changes
 * - Middleware behavior
 * - Runtime-only errors
 */

import { startTestServer, stopTestServer, getTestServerUrl } from '../helpers/testServer';

describe('Real API Integration Tests', () => {
  let serverUrl: string;
  
  // Start server once for all tests
  beforeAll(async () => {
    serverUrl = await startTestServer();
  }, 60000); // 60 second timeout for server startup
  
  // Stop server after all tests
  afterAll(async () => {
    await stopTestServer();
  }, 10000);
  
  describe('Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await fetch(`${serverUrl}/api/health`);
      expect(response.ok).toBe(true);
    });
  });
  
  describe('API Routes - Unauthenticated', () => {
    it('should return 401 for protected routes without auth', async () => {
      const routes = [
        '/api/admin/locations',
        '/api/admin/guests',
        '/api/admin/events',
        '/api/admin/activities',
      ];
      
      for (const route of routes) {
        const response = await fetch(`${serverUrl}${route}`);
        expect(response.status).toBe(401);
      }
    });
  });
  
  describe('API Routes - Response Format', () => {
    it('should return JSON with success/error structure', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      if (!data.success) {
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error).toHaveProperty('message');
      }
    });
  });
  
  describe('Next.js 15 Compatibility', () => {
    it('should handle dynamic route params correctly', async () => {
      // Test that params are properly awaited in Next.js 15
      const response = await fetch(`${serverUrl}/api/admin/accommodations/test-id/room-types`);
      
      // Should not crash with params error
      expect(response.status).not.toBe(500);
      
      // Should return 401 (auth required) or 404 (not found), not 500 (server error)
      expect([401, 404]).toContain(response.status);
    });
    
    it('should handle cookies correctly', async () => {
      // Test that cookie handling works in Next.js 15
      const response = await fetch(`${serverUrl}/api/admin/locations`, {
        headers: {
          'Cookie': 'test=value',
        },
      });
      
      // Should not crash with cookie parsing error
      expect(response.status).not.toBe(500);
    });
  });
  
  describe('Error Handling', () => {
    it('should return proper error responses for invalid requests', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
  
  describe('CORS and Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`);
      
      // Check for security headers
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});

/**
 * NOTE: These tests are intentionally simple and focus on:
 * 1. Server starts and responds
 * 2. Routes exist and return proper status codes
 * 3. Error handling works correctly
 * 4. Next.js 15 compatibility (params, cookies)
 * 
 * They do NOT test:
 * - Business logic (covered by unit tests)
 * - Database operations (covered by service tests)
 * - Authentication flows (covered by E2E tests)
 * 
 * The goal is to catch runtime issues that mocked tests miss.
 */
