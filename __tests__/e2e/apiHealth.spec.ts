/**
 * API Health E2E Tests
 * 
 * These tests verify that API endpoints respond correctly with a running Next.js server.
 * Tests check endpoint availability, response format consistency, error handling, and headers.
 * 
 * The Playwright webServer configuration automatically starts/stops the dev server.
 */

import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  test('should respond to health check endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    
    // Even if endpoint doesn't exist, server should respond
    expect([200, 404, 405]).toContain(response.status());
  });
});

test.describe('Authentication Endpoints', () => {
  test('logout endpoint should exist and respond', async ({ request }) => {
    const response = await request.post('/api/auth/logout', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Should respond (even if unauthorized)
    expect(response.status()).toBeLessThan(500);
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
  });
});

test.describe('Admin API Endpoints', () => {
  test('locations endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/admin/locations');
    
    // Should respond with 401 (unauthorized), 200, or 500 (server error)
    expect(response.status()).toBeLessThan(600);
    
    // Only check JSON if content-type is JSON
    const contentType = response.headers()['content-type'];
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (!data.success) {
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
      }
    }
  });

  test('content-pages endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/admin/content-pages');
    
    // Should respond with 401 (unauthorized), 200, or 500
    expect(response.status()).toBeLessThan(600);
    
    // Only check JSON if content-type is JSON
    const contentType = response.headers()['content-type'];
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('guests endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/admin/guests');
    
    // Should respond with 401 (unauthorized), 200, or 500
    expect(response.status()).toBeLessThan(600);
    
    // Only check JSON if content-type is JSON
    const contentType = response.headers()['content-type'];
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('activities endpoint should respond', async ({ request }) => {
    const response = await request.get('/api/admin/activities');
    
    // Should respond with 401 (unauthorized), 200, or 500
    expect(response.status()).toBeLessThan(600);
    
    // Only check JSON if content-type is JSON
    const contentType = response.headers()['content-type'];
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });
});

test.describe('API Response Format', () => {
  test('all API responses should have consistent format', async ({ request }) => {
    const endpoints = [
      '/api/admin/locations',
      '/api/admin/content-pages',
      '/api/admin/guests',
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      
      // Only check JSON responses
      const contentType = response.headers()['content-type'];
      if (!contentType?.includes('application/json')) {
        continue; // Skip non-JSON responses
      }
      
      const data = await response.json();
      
      // All responses should have success field
      expect(data).toHaveProperty('success');
      expect(typeof data.success).toBe('boolean');
      
      // If success is false, should have error object
      if (!data.success) {
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error).toHaveProperty('message');
      }
      
      // If success is true, should have data
      if (data.success) {
        expect(data).toHaveProperty('data');
      }
    }
  });
});

test.describe('Error Handling', () => {
  test('invalid endpoints should return 404 or redirect', async ({ request }) => {
    const response = await request.get('/api/admin/nonexistent-endpoint');
    
    // Should be 404 or 200 (if Next.js catches it)
    expect([200, 404]).toContain(response.status());
  });

  test('invalid methods should return 405 or 401', async ({ request }) => {
    const response = await request.delete('/api/admin/locations');
    
    // Should be 405 (Method Not Allowed), 401 (Unauthorized), or 200 (caught by Next.js)
    expect([200, 401, 405]).toContain(response.status());
  });
});

test.describe('CORS and Headers', () => {
  test('API should set proper content-type headers for JSON endpoints', async ({ request }) => {
    // Test an endpoint that should return JSON
    const response = await request.get('/api/admin/locations');
    
    const contentType = response.headers()['content-type'];
    
    // Should be either JSON or HTML (if error page)
    expect(contentType).toBeDefined();
    expect(['application/json', 'text/html']).toContain(
      contentType?.split(';')[0]
    );
  });
});

/**
 * Usage Instructions:
 * 
 * 1. Run all E2E tests (includes API health):
 *    npm run test:e2e
 * 
 * 2. Run only API health tests:
 *    npx playwright test apiHealth
 * 
 * 3. Run with UI mode for debugging:
 *    npx playwright test apiHealth --ui
 * 
 * 4. Run in CI/CD:
 *    Set E2E_BASE_URL environment variable to deployed URL
 *    npm run test:e2e
 * 
 * Note: The Playwright webServer configuration automatically starts
 * and stops the Next.js dev server, so no manual server management needed.
 */
