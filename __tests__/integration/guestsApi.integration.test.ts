/**
 * Guests API Integration Tests
 * 
 * Tests the /api/admin/guests endpoint with various scenarios including
 * missing query parameters to catch validation issues.
 */

describe('GET /api/admin/guests', () => {
  describe('query parameter handling', () => {
    it('should handle request with no query parameters', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests', {
        headers: {
          'Cookie': 'test-auth-cookie=mock', // Mock auth
        },
      });

      // Should return 200 or 401 (if auth fails), not 500
      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });

    it('should handle request with null ageType parameter', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests?ageType=', {
        headers: {
          'Cookie': 'test-auth-cookie=mock',
        },
      });

      // Should not return 500 validation error
      expect(response.status).not.toBe(500);
    });

    it('should handle request with valid ageType parameter', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests?ageType=adult', {
        headers: {
          'Cookie': 'test-auth-cookie=mock',
        },
      });

      expect([200, 401]).toContain(response.status);
    });

    it('should handle pagination parameters', async () => {
      const response = await fetch('http://localhost:3000/api/admin/guests?page=1&pageSize=10', {
        headers: {
          'Cookie': 'test-auth-cookie=mock',
        },
      });

      expect([200, 401]).toContain(response.status);
    });
  });
});
