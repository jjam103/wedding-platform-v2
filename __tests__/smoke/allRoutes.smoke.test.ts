/**
 * All Routes Smoke Tests
 * 
 * Quick validation that all API routes respond without crashing.
 * These tests don't validate business logic, just that:
 * - Routes exist
 * - They return proper HTTP status codes
 * - They don't crash with 500 errors
 * - They return JSON responses
 * 
 * Run these tests frequently to catch broken routes early.
 */

import { startTestServer, stopTestServer, getTestServerUrl } from '../helpers/testServer';

// All API routes in the application
const API_ROUTES = {
  // Admin routes
  admin: [
    '/api/admin/locations',
    '/api/admin/guests',
    '/api/admin/guest-groups',
    '/api/admin/events',
    '/api/admin/activities',
    '/api/admin/accommodations',
    '/api/admin/room-types',
    '/api/admin/vendors',
    '/api/admin/budget',
    '/api/admin/photos',
    '/api/admin/emails',
    '/api/admin/content-pages',
    '/api/admin/home-page',
    '/api/admin/rsvps',
    '/api/admin/rsvp-analytics',
    '/api/admin/transportation',
    '/api/admin/audit-logs',
    '/api/admin/settings',
  ],
  
  // Guest routes
  guest: [
    '/api/guest/rsvp',
    '/api/guest/profile',
  ],
  
  // Public routes
  public: [
    '/api/health',
  ],
};

describe('Smoke Tests - All API Routes', () => {
  let serverUrl: string;
  
  beforeAll(async () => {
    serverUrl = await startTestServer();
  }, 60000);
  
  afterAll(async () => {
    await stopTestServer();
  }, 10000);
  
  describe('Admin Routes', () => {
    API_ROUTES.admin.forEach(route => {
      it(`${route} should respond`, async () => {
        const response = await fetch(`${serverUrl}${route}`);
        
        // Should not crash (500 error)
        expect(response.status).not.toBe(500);
        
        // Should return JSON
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
        
        // Should have proper error structure if not authenticated
        if (response.status === 401) {
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error).toBeDefined();
          expect(data.error.code).toBe('UNAUTHORIZED');
        }
      });
    });
  });
  
  describe('Guest Routes', () => {
    API_ROUTES.guest.forEach(route => {
      it(`${route} should respond`, async () => {
        const response = await fetch(`${serverUrl}${route}`);
        
        // Should not crash
        expect(response.status).not.toBe(500);
        
        // Should return JSON
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
      });
    });
  });
  
  describe('Public Routes', () => {
    API_ROUTES.public.forEach(route => {
      it(`${route} should respond`, async () => {
        const response = await fetch(`${serverUrl}${route}`);
        
        // Should be accessible
        expect(response.ok).toBe(true);
        
        // Should return JSON
        const contentType = response.headers.get('content-type');
        expect(contentType).toContain('application/json');
      });
    });
  });
  
  describe('Dynamic Routes', () => {
    it('should handle dynamic route params', async () => {
      const dynamicRoutes = [
        '/api/admin/locations/test-id',
        '/api/admin/guests/test-id',
        '/api/admin/events/test-id',
        '/api/admin/accommodations/test-id/room-types',
      ];
      
      for (const route of dynamicRoutes) {
        const response = await fetch(`${serverUrl}${route}`);
        
        // Should not crash with params error
        expect(response.status).not.toBe(500);
        
        // Should return 401 (auth) or 404 (not found), not 500 (crash)
        expect([401, 404]).toContain(response.status);
      }
    });
  });
  
  describe('HTTP Methods', () => {
    it('should handle GET requests', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`);
      expect([200, 401]).toContain(response.status);
    });
    
    it('should handle POST requests', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect([200, 201, 400, 401]).toContain(response.status);
    });
    
    it('should handle PUT requests', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });
      expect([200, 400, 401, 404]).toContain(response.status);
    });
    
    it('should handle DELETE requests', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations/test-id`, {
        method: 'DELETE',
      });
      expect([200, 401, 404]).toContain(response.status);
    });
  });
  
  describe('Error Responses', () => {
    it('should return proper error structure', async () => {
      const response = await fetch(`${serverUrl}/api/admin/locations`);
      const data = await response.json();
      
      if (!data.success) {
        expect(data.error).toBeDefined();
        expect(data.error.code).toBeDefined();
        expect(data.error.message).toBeDefined();
        expect(typeof data.error.code).toBe('string');
        expect(typeof data.error.message).toBe('string');
      }
    });
  });
});

/**
 * Performance Benchmarks
 * 
 * Track response times to catch performance regressions
 */
describe('Smoke Tests - Performance', () => {
  let serverUrl: string;
  
  beforeAll(async () => {
    serverUrl = await startTestServer();
  }, 60000);
  
  afterAll(async () => {
    await stopTestServer();
  }, 10000);
  
  it('should respond within reasonable time', async () => {
    const start = Date.now();
    await fetch(`${serverUrl}/api/health`);
    const duration = Date.now() - start;
    
    // Should respond within 1 second
    expect(duration).toBeLessThan(1000);
  });
  
  it('should handle concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() =>
      fetch(`${serverUrl}/api/health`)
    );
    
    const responses = await Promise.all(requests);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.ok).toBe(true);
    });
  });
});

/**
 * NOTE: These are smoke tests, not comprehensive tests.
 * They verify routes exist and respond, but don't test:
 * - Business logic
 * - Data validation
 * - Authentication flows
 * - Database operations
 * 
 * For comprehensive testing, see:
 * - Unit tests (business logic)
 * - Integration tests (API + database)
 * - E2E tests (complete workflows)
 */
