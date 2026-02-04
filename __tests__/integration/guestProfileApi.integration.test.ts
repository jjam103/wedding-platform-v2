/**
 * Integration Tests: Guest Profile API
 * 
 * Tests all guest profile API routes with proper service mocking
 * to avoid worker crashes.
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.12
 */

import { GET as getProfile, PUT as updateProfile } from '@/app/api/guest/profile/route';
import { GET as getFamilyMembers } from '@/app/api/guest/family/route';

// Mock services at module level to avoid worker crashes
jest.mock('@/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Guest Profile API Integration Tests', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getSession: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
    
    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    createRouteHandlerClient.mockReturnValue(mockSupabase);
  });
  
  describe('GET /api/guest/profile', () => {
    it('should return guest profile when authenticated', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      // Mock guest profile data
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '555-0100',
          dietary_restrictions: 'Vegetarian',
          group_id: 'group-1',
          groups: {
            id: 'group-1',
            name: 'Smith Family',
            group_type: 'family'
          }
        },
        error: null
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'GET',
      });
      
      const response = await getProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('guest-1');
      expect(data.data.first_name).toBe('John');
      expect(data.data.groups.name).toBe('Smith Family');
    });
    
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'GET',
      });
      
      const response = await getProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should return 404 when guest profile not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'unknown@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'GET',
      });
      
      const response = await getProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
  
  describe('PUT /api/guest/profile', () => {
    it('should update profile when authenticated with valid data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      // Mock getting current guest
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            group_id: 'group-1'
          },
          error: null
        })
        // Mock updated guest
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john@example.com',
            phone: '555-0200',
            dietary_restrictions: 'Vegan',
            group_id: 'group-1'
          },
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_name: 'Smith',
          phone: '555-0200',
          dietary_restrictions: 'Vegan'
        })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.last_name).toBe('Smith');
      expect(data.data.phone).toBe('555-0200');
      expect(data.data.dietary_restrictions).toBe('Vegan');
    });
    
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: 'Jane' })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should return 400 when validation fails', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          first_name: 'John',
          email: 'john@example.com'
        },
        error: null
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          first_name: 'A'.repeat(100) // Too long
        })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toBeDefined();
    });
    
    it('should send admin notification for critical updates', async () => {
      const mockSendEmail = require('@/services/emailService').sendEmail;
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'newemail@example.com',
            dietary_restrictions: 'Gluten-free'
          },
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newemail@example.com',
          dietary_restrictions: 'Gluten-free'
        })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Guest Profile Update',
          html: expect.stringContaining('Guest Profile Updated')
        })
      );
    });
    
    it('should sanitize input to prevent XSS', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            email: 'john@example.com'
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            id: 'guest-1',
            first_name: 'John',
            last_name: 'Doe',
            dietary_restrictions: 'No shellfish'
          },
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietary_restrictions: '<script>alert("xss")</script>No shellfish'
        })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify update was called with sanitized data
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dietary_restrictions: expect.not.stringContaining('<script>')
        })
      );
    });
    
    it('should return 404 when guest profile not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'unknown@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: 'Jane' })
      });
      
      const response = await updateProfile(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
  
  describe('GET /api/guest/family', () => {
    it('should return all family members for adult guest', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      // Mock current guest (adult)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          group_id: 'group-1',
          age_type: 'adult',
          email: 'john@example.com'
        },
        error: null
      });
      
      // Mock family members - need to chain order() twice
      mockSupabase.order
        .mockReturnValueOnce(mockSupabase) // First order() returns this
        .mockResolvedValueOnce({ // Second order() returns data
          data: [
            {
              id: 'guest-1',
              first_name: 'John',
              last_name: 'Doe',
              age_type: 'adult',
              group_id: 'group-1'
            },
            {
              id: 'guest-2',
              first_name: 'Jane',
              last_name: 'Doe',
              age_type: 'adult',
              group_id: 'group-1'
            },
            {
              id: 'guest-3',
              first_name: 'Jimmy',
              last_name: 'Doe',
              age_type: 'child',
              group_id: 'group-1'
            }
          ],
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(3);
      expect(data.data[0].first_name).toBe('John');
      expect(data.data[2].age_type).toBe('child');
    });
    
    it('should return only self for child guest', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-3', email: 'jimmy@example.com' }
          }
        },
        error: null
      });
      
      // Mock current guest (child)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-3',
          first_name: 'Jimmy',
          last_name: 'Doe',
          group_id: 'group-1',
          age_type: 'child',
          email: 'jimmy@example.com'
        },
        error: null
      });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('guest-3');
      expect(data.data[0].first_name).toBe('Jimmy');
    });
    
    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'No session' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should return 404 when guest profile not found', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'unknown@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
    
    it('should enforce RLS by querying based on group_id', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          group_id: 'group-1',
          age_type: 'adult',
          email: 'john@example.com'
        },
        error: null
      });
      
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      await getFamilyMembers(request);
      
      // Verify that query filters by group_id
      expect(mockSupabase.eq).toHaveBeenCalledWith('group_id', 'group-1');
    });
  });
  
  describe('RLS Enforcement', () => {
    it('should prevent access to other groups data', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      // Guest belongs to group-1
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          group_id: 'group-1',
          age_type: 'adult',
          email: 'john@example.com'
        },
        error: null
      });
      
      // Should only return members from group-1 - chain order() twice
      mockSupabase.order
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            { id: 'guest-1', group_id: 'group-1', first_name: 'John' }
          ],
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.every((member: any) => member.group_id === 'group-1')).toBe(true);
    });
  });
  
  describe('Group Owner Permissions', () => {
    it('should allow adult to view all family members', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-1', email: 'john@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-1',
          group_id: 'group-1',
          age_type: 'adult',
          email: 'john@example.com'
        },
        error: null
      });
      
      // Chain order() twice for the query
      mockSupabase.order
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({
          data: [
            { id: 'guest-1', age_type: 'adult' },
            { id: 'guest-2', age_type: 'adult' },
            { id: 'guest-3', age_type: 'child' }
          ],
          error: null
        });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
    });
    
    it('should restrict child to viewing only themselves', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-3', email: 'child@example.com' }
          }
        },
        error: null
      });
      
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'guest-3',
          group_id: 'group-1',
          age_type: 'child',
          email: 'child@example.com'
        },
        error: null
      });
      
      const request = new Request('http://localhost:3000/api/guest/family', {
        method: 'GET',
      });
      
      const response = await getFamilyMembers(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('guest-3');
    });
  });
});
