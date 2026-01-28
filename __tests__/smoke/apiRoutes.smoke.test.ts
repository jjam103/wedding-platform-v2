/**
 * API Smoke Tests
 * 
 * Quick tests that verify all API endpoints respond without 500 errors.
 * These tests don't validate functionality, just that routes exist and respond.
 * 
 * Run with: npm run test:smoke
 */

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

/**
 * All API routes in the application
 * Format: [method, path, expectedStatusCodes]
 */
const API_ROUTES: Array<[string, string, number[]]> = [
  // Auth routes
  ['POST', '/api/auth/logout', [200, 401]],
  
  // Admin routes - Locations
  ['GET', '/api/admin/locations', [200, 401]],
  ['POST', '/api/admin/locations', [201, 400, 401]],
  
  // Admin routes - Content Pages
  ['GET', '/api/admin/content-pages', [200, 401]],
  ['POST', '/api/admin/content-pages', [201, 400, 401]],
  
  // Admin routes - Guests
  ['GET', '/api/admin/guests', [200, 401]],
  ['POST', '/api/admin/guests', [201, 400, 401]],
  
  // Admin routes - Activities
  ['GET', '/api/admin/activities', [200, 401]],
  ['POST', '/api/admin/activities', [201, 400, 401]],
  
  // Admin routes - Events
  ['GET', '/api/admin/events', [200, 401]],
  ['POST', '/api/admin/events', [201, 400, 401]],
  
  // Admin routes - Accommodations
  ['GET', '/api/admin/accommodations', [200, 401]],
  ['POST', '/api/admin/accommodations', [201, 400, 401]],
  
  // Admin routes - Room Types
  ['GET', '/api/admin/room-types', [200, 401]],
  
  // Admin routes - RSVPs
  ['GET', '/api/admin/rsvps', [200, 401]],
  
  // Admin routes - Photos
  ['GET', '/api/admin/photos', [200, 401]],
  
  // Admin routes - Home Page
  ['GET', '/api/admin/home-page', [200, 401]],
  ['PUT', '/api/admin/home-page', [200, 400, 401]],
  
  // Admin routes - RSVP Analytics
  ['GET', '/api/admin/rsvp-analytics', [200, 401]],
  
  // Admin routes - Audit Logs
  ['GET', '/api/admin/audit-logs', [200, 401]],
  
  // Admin routes - Transportation
  ['GET', '/api/admin/transportation/arrivals', [200, 401]],
  ['GET', '/api/admin/transportation/departures', [200, 401]],
  ['GET', '/api/admin/transportation/vehicle-requirements', [200, 401]],
  
  // Admin routes - Budget
  ['GET', '/api/admin/budget/breakdown', [200, 401]],
  ['GET', '/api/admin/budget/subsidies', [200, 401]],
  ['GET', '/api/admin/budget/payment-status', [200, 401]],
  
  // Admin routes - References
  ['GET', '/api/admin/references/search', [200, 400, 401]],
];

describe('API Smoke Tests', () => {
  // Skip if no server is running
  let serverAvailable = false;

  beforeAll(async () => {
    try {
      const response = await fetch(API_BASE_URL);
      serverAvailable = response.ok || response.status === 404;
    } catch {
      serverAvailable = false;
    }

    if (!serverAvailable) {
      console.warn('⚠️  Server not available at', API_BASE_URL);
      console.warn('   Run "npm run dev" in another terminal to enable smoke tests');
    }
  });

  describe.each(API_ROUTES)('%s %s', (method, path, expectedStatuses) => {
    test(`should respond with valid status code`, async () => {
      if (!serverAvailable) {
        console.log('⏭️  Skipping - server not available');
        return;
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Add empty body for POST/PUT/PATCH
        ...(method !== 'GET' && method !== 'DELETE' ? { body: JSON.stringify({}) } : {}),
      });

      // Should not return 500 (server error)
      expect(response.status).toBeLessThan(500);
      
      // Should return one of the expected status codes
      expect(expectedStatuses).toContain(response.status);
      
      // Should return JSON
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('application/json');
      
      // Should have valid JSON body
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
    });
  });

  describe('Response Format Consistency', () => {
    test('all endpoints should return consistent error format', async () => {
      if (!serverAvailable) {
        return;
      }

      // Test a few endpoints
      const testEndpoints = [
        '/api/admin/locations',
        '/api/admin/content-pages',
        '/api/admin/guests',
      ];

      for (const endpoint of testEndpoints) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();

        // Should have success field
        expect(data).toHaveProperty('success');
        expect(typeof data.success).toBe('boolean');

        // If error, should have proper error structure
        if (!data.success) {
          expect(data).toHaveProperty('error');
          expect(data.error).toHaveProperty('code');
          expect(data.error).toHaveProperty('message');
          expect(typeof data.error.code).toBe('string');
          expect(typeof data.error.message).toBe('string');
        }
      }
    });
  });

  describe('Performance', () => {
    test('endpoints should respond within reasonable time', async () => {
      if (!serverAvailable) {
        return;
      }

      const startTime = Date.now();
      await fetch(`${API_BASE_URL}/api/admin/locations`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Should respond within 5 seconds (generous for cold start)
      expect(responseTime).toBeLessThan(5000);
    });
  });
});

/**
 * Usage:
 * 
 * 1. Add to package.json:
 *    "test:smoke": "jest --testPathPattern=smoke"
 * 
 * 2. Run with dev server:
 *    npm run dev (terminal 1)
 *    npm run test:smoke (terminal 2)
 * 
 * 3. Run in CI/CD:
 *    - Start server
 *    - Run smoke tests
 *    - Stop server
 */
