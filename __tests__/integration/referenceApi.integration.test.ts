/**
 * Integration Tests: Reference API Routes
 * 
 * Tests the reference validation and preview API endpoints:
 * - POST /api/admin/references/validate - Validates references and detects circular references
 * - GET /api/admin/references/[type]/[id] - Returns preview data for references
 * 
 * Requirements: 21.8, 21.9, 25.2, 25.3, 25.6, 25.7
 * 
 * CRITICAL: Mock services at module level to avoid worker crashes
 */

import { POST as validateReferences } from '@/app/api/admin/references/validate/route';
import { GET as getPreview } from '@/app/api/admin/references/[type]/[id]/route';

// Mock services at module level
jest.mock('@/services/sectionsService', () => ({
  validateReferences: jest.fn(),
  detectCircularReferences: jest.fn(),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  })),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Reference API Integration Tests', () => {
  let mockSession: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock session
    mockSession = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      access_token: 'test-token',
    };

    // Setup mock Supabase client
    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: mockSession },
          error: null,
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };
    createRouteHandlerClient.mockReturnValue(mockSupabase);
  });

  describe('POST /api/admin/references/validate', () => {
    it('should validate references successfully when all exist', async () => {
      const sectionsService = require('@/services/sectionsService');
      sectionsService.validateReferences.mockResolvedValue({
        success: true,
        data: {
          valid: true,
          brokenReferences: [],
          circularReferences: [],
        },
      });

      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [
            { type: 'event', id: '123e4567-e89b-12d3-a456-426614174000', name: 'Wedding Ceremony' },
            { type: 'activity', id: '223e4567-e89b-12d3-a456-426614174000', name: 'Beach Party' },
          ],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.brokenReferences).toEqual([]);
      expect(sectionsService.validateReferences).toHaveBeenCalledWith([
        { type: 'event', id: '123e4567-e89b-12d3-a456-426614174000', name: 'Wedding Ceremony' },
        { type: 'activity', id: '223e4567-e89b-12d3-a456-426614174000', name: 'Beach Party' },
      ]);
    });

    it('should detect broken references', async () => {
      const sectionsService = require('@/services/sectionsService');
      sectionsService.validateReferences.mockResolvedValue({
        success: true,
        data: {
          valid: false,
          brokenReferences: [
            { type: 'event', id: '123e4567-e89b-12d3-a456-426614174000', name: 'Deleted Event' },
          ],
          circularReferences: [],
        },
      });

      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [
            { type: 'event', id: '123e4567-e89b-12d3-a456-426614174000', name: 'Deleted Event' },
          ],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(false);
      expect(data.data.brokenReferences).toHaveLength(1);
      expect(data.data.brokenReferences[0].name).toBe('Deleted Event');
    });

    it('should detect circular references', async () => {
      const sectionsService = require('@/services/sectionsService');
      sectionsService.detectCircularReferences.mockResolvedValue({
        success: true,
        data: true, // Circular reference detected
      });
      sectionsService.validateReferences.mockResolvedValue({
        success: true,
        data: {
          valid: true,
          brokenReferences: [],
          circularReferences: [],
        },
      });

      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: '323e4567-e89b-12d3-a456-426614174000',
          pageType: 'custom',
          references: [
            { type: 'content_page', id: '423e4567-e89b-12d3-a456-426614174000', name: 'Page A' },
          ],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(false);
      expect(data.data.hasCircularReference).toBe(true);
      expect(sectionsService.detectCircularReferences).toHaveBeenCalledWith(
        '323e4567-e89b-12d3-a456-426614174000',
        [{ type: 'content_page', id: '423e4567-e89b-12d3-a456-426614174000', name: 'Page A' }]
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when validation fails', async () => {
      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [
            { type: 'invalid_type', id: 'not-a-uuid', name: 'Invalid' },
          ],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors gracefully', async () => {
      const sectionsService = require('@/services/sectionsService');
      sectionsService.validateReferences.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/references/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          references: [
            { type: 'event', id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Event' },
          ],
        }),
      });

      const response = await validateReferences(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/admin/references/[type]/[id]', () => {
    it('should return event preview data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Wedding Ceremony',
                slug: 'wedding-ceremony',
                is_active: true,
                start_time: '2024-06-15T14:00:00Z',
                end_time: '2024-06-15T15:00:00Z',
                description: 'The main wedding ceremony',
                event_type: 'ceremony',
                locations: { name: 'Beach Venue' },
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/references/event/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'event', id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(data.data.name).toBe('Wedding Ceremony');
      expect(data.data.type).toBe('event');
      expect(data.data.details.eventType).toBe('ceremony');
      expect(data.data.details.location).toBe('Beach Venue');
    });

    it('should return activity preview data with RSVP count', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'activities') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '223e4567-e89b-12d3-a456-426614174000',
                    name: 'Beach Party',
                    slug: 'beach-party',
                    capacity: 50,
                    start_time: '2024-06-16T18:00:00Z',
                    end_time: '2024-06-16T22:00:00Z',
                    description: 'Fun beach party',
                    activity_type: 'social',
                    cost_per_person: 25.00,
                    locations: { name: 'Beach Club' },
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'rsvps') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
            }),
          };
        }
        return mockSupabase;
      });

      const request = new Request('http://localhost:3000/api/admin/references/activity/223e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'activity', id: '223e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Beach Party');
      expect(data.data.type).toBe('activity');
      expect(data.data.details.capacity).toBe(50);
      expect(data.data.details.costPerPerson).toBe(25.00);
    });

    it('should return content page preview data', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'content_pages') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '323e4567-e89b-12d3-a456-426614174000',
                    title: 'Our Story',
                    slug: 'our-story',
                    status: 'published',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-15T00:00:00Z',
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'content_sections') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
            }),
          };
        }
        return mockSupabase;
      });

      const request = new Request('http://localhost:3000/api/admin/references/content_page/323e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'content_page', id: '323e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Our Story');
      expect(data.data.type).toBe('content_page');
      expect(data.data.slug).toBe('our-story');
      expect(data.data.status).toBe('published');
    });

    it('should return accommodation preview data', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'accommodations') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '423e4567-e89b-12d3-a456-426614174000',
                    name: 'Beach Resort',
                    slug: 'beach-resort',
                    check_in_date: '2024-06-14',
                    check_out_date: '2024-06-17',
                    description: 'Luxury beach resort',
                    address: '123 Beach Road',
                    locations: { name: 'Coastal Area' },
                  },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'room_types') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
            }),
          };
        }
        return mockSupabase;
      });

      const request = new Request('http://localhost:3000/api/admin/references/accommodation/423e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'accommodation', id: '423e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Beach Resort');
      expect(data.data.type).toBe('accommodation');
      expect(data.data.details.address).toBe('123 Beach Road');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/references/event/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'event', id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid entity type', async () => {
      const request = new Request('http://localhost:3000/api/admin/references/invalid_type/123e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'invalid_type', id: '123e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when entity not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const request = new Request('http://localhost:3000/api/admin/references/event/999e4567-e89b-12d3-a456-426614174000');
      const params = Promise.resolve({ type: 'event', id: '999e4567-e89b-12d3-a456-426614174000' });

      const response = await getPreview(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
});
