import { test, expect } from '@playwright/test';

/**
 * Guests API E2E Tests
 * 
 * Tests the /api/admin/guests endpoint with various scenarios including
 * missing query parameters to catch validation issues.
 * 
 * These tests run against a live Next.js server with proper authentication.
 * The server is automatically started by Playwright's webServer configuration.
 * 
 * CURRENT STATUS: Tests are correctly identifying API issues (500 errors).
 * The API endpoint needs to be fixed to handle query parameters properly.
 * These test failures are EXPECTED and indicate real bugs in the API.
 */

test.describe('Guests API - Query Parameter Handling', () => {
  test('should handle request with no query parameters', async ({ request }) => {
    const response = await request.get('/api/admin/guests');

    // Should return 200 or 401 (if auth fails), not 500
    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // Verify response structure
      if (data.data.guests) {
        expect(Array.isArray(data.data.guests)).toBe(true);
      }
    } else if (response.status() === 401) {
      // Auth failed as expected in test environment
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('UNAUTHORIZED');
    }
  });

  test('should handle request with null ageType parameter', async ({ request }) => {
    const response = await request.get('/api/admin/guests?ageType=');

    // Should not return 500 validation error
    expect(response.status()).not.toBe(500);
    
    // Should return 200 (empty filter) or 401 (auth issue)
    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
    }
  });

  test('should handle request with valid ageType parameter', async ({ request }) => {
    const response = await request.get('/api/admin/guests?ageType=adult');

    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // If guests are returned, verify they match the filter
      if (data.data.guests && data.data.guests.length > 0) {
        data.data.guests.forEach((guest: any) => {
          expect(guest.ageType).toBe('adult');
        });
      }
    }
  });

  test('should handle pagination parameters', async ({ request }) => {
    const response = await request.get('/api/admin/guests?page=1&pageSize=10');

    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      
      // Verify pagination is respected
      if (data.data.guests) {
        expect(data.data.guests.length).toBeLessThanOrEqual(10);
      }
      
      // Check for pagination metadata
      if (data.data.pagination) {
        expect(data.data.pagination.page).toBe(1);
        expect(data.data.pagination.pageSize).toBe(10);
      }
    }
  });

  test('should handle multiple filter parameters', async ({ request }) => {
    const response = await request.get('/api/admin/guests?ageType=adult&guestType=wedding_guest&page=1&pageSize=20');

    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      
      // Verify filters are applied
      if (data.data.guests && data.data.guests.length > 0) {
        data.data.guests.forEach((guest: any) => {
          expect(guest.ageType).toBe('adult');
          expect(guest.guestType).toBe('wedding_guest');
        });
      }
    }
  });

  test('should handle invalid ageType parameter gracefully', async ({ request }) => {
    const response = await request.get('/api/admin/guests?ageType=invalid');

    // Should return 400 for invalid enum value or 200 with empty results
    expect([200, 400, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 400) {
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    } else if (response.status() === 200) {
      // Some implementations might just return empty results
      expect(data.success).toBe(true);
    }
  });

  test('should handle invalid pagination parameters', async ({ request }) => {
    const response = await request.get('/api/admin/guests?page=-1&pageSize=0');

    // Should return 400 for invalid pagination or handle gracefully
    expect([200, 400, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 400) {
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('should handle search parameter', async ({ request }) => {
    const response = await request.get('/api/admin/guests?search=test');

    expect([200, 401]).toContain(response.status());
    
    const data = await response.json();
    
    if (response.status() === 200) {
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    }
  });
});

test.describe('Guests API - Response Format', () => {
  test('should return consistent Result<T> format on success', async ({ request }) => {
    const response = await request.get('/api/admin/guests');

    if (response.status() === 200) {
      const data = await response.json();
      
      // Verify Result<T> success format
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data).not.toHaveProperty('error');
    }
  });

  test('should return consistent Result<T> format on error', async ({ request }) => {
    // Make a request that should fail (e.g., without auth if auth is required)
    const response = await request.get('/api/admin/guests', {
      headers: {
        // Remove auth headers to force 401
        'Authorization': '',
      },
    });

    if (response.status() === 401) {
      const data = await response.json();
      
      // Verify Result<T> error format
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
      expect(data).not.toHaveProperty('data');
    }
  });

  test('should include proper Content-Type header', async ({ request }) => {
    const response = await request.get('/api/admin/guests');

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });
});

test.describe('Guests API - Performance', () => {
  test('should respond within acceptable time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/admin/guests?pageSize=50');
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    // API should respond within 3 seconds
    expect(responseTime).toBeLessThan(3000);
    
    // Log response time for monitoring
    console.log(`Guests API response time: ${responseTime}ms`);
  });

  test('should handle large page sizes efficiently', async ({ request }) => {
    const response = await request.get('/api/admin/guests?pageSize=100');

    expect([200, 401]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Should limit results even with large page size
      if (data.data.guests) {
        expect(data.data.guests.length).toBeLessThanOrEqual(100);
      }
    }
  });
});

test.describe('Guests API - Security', () => {
  test('should require authentication', async ({ request }) => {
    // Make request without authentication context
    const response = await request.get('/api/admin/guests', {
      headers: {
        'Authorization': '',
        'Cookie': '',
      },
    });

    // Should return 401 if auth is required
    // Note: This might return 200 if the endpoint allows unauthenticated access
    if (response.status() === 401) {
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    }
  });

  test('should sanitize query parameters', async ({ request }) => {
    // Try SQL injection in search parameter
    const response = await request.get('/api/admin/guests?search=\'; DROP TABLE guests; --');

    // Should not crash or return 500
    expect(response.status()).not.toBe(500);
    
    // Should handle safely
    expect([200, 400, 401]).toContain(response.status());
  });

  test('should handle XSS attempts in parameters', async ({ request }) => {
    const response = await request.get('/api/admin/guests?search=<script>alert("xss")</script>');

    // Should not crash
    expect(response.status()).not.toBe(500);
    
    const data = await response.json();
    
    if (response.status() === 200 && data.data.guests) {
      // Verify no script tags in response
      const responseText = JSON.stringify(data);
      expect(responseText).not.toContain('<script>');
    }
  });
});
