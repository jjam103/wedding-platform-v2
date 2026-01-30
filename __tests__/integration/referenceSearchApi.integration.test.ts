/**
 * Reference Search API Integration Tests
 * 
 * Tests the reference search and preview API endpoints by testing
 * the route handlers directly with mocked Supabase client.
 */

// Polyfill Request for Node.js environment
if (typeof Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: any;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string);
        });
      }
      this.body = init?.body;
    }

    async json() {
      return this.body ? JSON.parse(this.body) : null;
    }
  } as any;
}

// Mock next/server to avoid Request/Response issues
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

// Mock @supabase/ssr
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    getAll: () => [],
    setAll: () => {},
  })),
}));

import { GET as searchGET } from '@/app/api/admin/references/search/route';
import { GET as previewGET } from '@/app/api/admin/references/[type]/[id]/route';

describe('Reference Search API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/references/search', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=test&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });

      it('should return 401 when auth error occurs', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: { message: 'Auth error' },
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=test&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should return empty results when query is empty', async () => {
        const request = new Request('http://localhost:3000/api/admin/references/search?q=&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results).toEqual([]);
        expect(data.data.total).toBe(0);
      });

      it('should return 400 when no entity types provided', async () => {
        const request = new Request('http://localhost:3000/api/admin/references/search?q=test&type=');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Multi-Entity Search', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should search events when type includes event', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Ceremony',
            slug: 'ceremony',
            is_active: true,
            start_time: '2025-06-15T14:00:00Z',
          },
        ];

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=ceremony&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results).toHaveLength(1);
        expect(data.data.results[0]).toMatchObject({
          id: 'event-1',
          name: 'Ceremony',
          type: 'event',
          slug: 'ceremony',
          status: 'active',
        });
      });

      it('should search activities when type includes activity', async () => {
        const mockActivities = [
          {
            id: 'activity-1',
            name: 'Beach Day',
            slug: 'beach-day',
            capacity: 50,
            start_time: '2025-06-16T10:00:00Z',
          },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'activities') {
            return {
              select: jest.fn().mockReturnValue({
                or: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockActivities, error: null }),
                }),
              }),
            };
          }
          if (table === 'rsvps') {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return { select: jest.fn() };
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=beach&type=activity');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results).toHaveLength(1);
        expect(data.data.results[0]).toMatchObject({
          id: 'activity-1',
          name: 'Beach Day',
          type: 'activity',
          slug: 'beach-day',
        });
      });

      it('should search multiple entity types', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Wedding Ceremony',
            slug: 'ceremony',
            is_active: true,
            start_time: '2025-06-15T14:00:00Z',
          },
        ];

        const mockActivities = [
          {
            id: 'activity-1',
            name: 'Wedding Reception',
            slug: 'reception',
            capacity: 100,
            start_time: '2025-06-15T18:00:00Z',
          },
        ];

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'events') {
            return {
              select: jest.fn().mockReturnValue({
                or: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
                }),
              }),
            };
          }
          if (table === 'activities') {
            return {
              select: jest.fn().mockReturnValue({
                or: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: mockActivities, error: null }),
                }),
              }),
            };
          }
          if (table === 'rsvps') {
            return {
              select: jest.fn().mockReturnValue({
                in: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            };
          }
          return { select: jest.fn() };
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=wedding&type=event,activity');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results.length).toBeGreaterThanOrEqual(2);
        expect(data.data.results.some((r: any) => r.type === 'event')).toBe(true);
        expect(data.data.results.some((r: any) => r.type === 'activity')).toBe(true);
      });
    });

    describe('Entity Type Filtering', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should only search specified entity types', async () => {
        const mockAccommodations = [
          {
            id: 'accommodation-1',
            name: 'Beach Resort',
            slug: 'beach-resort',
            check_in_date: '2025-06-14',
            check_out_date: '2025-06-17',
          },
        ];

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockAccommodations, error: null }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=beach&type=accommodation');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results).toHaveLength(1);
        expect(data.data.results[0].type).toBe('accommodation');
      });
    });

    describe('Result Ordering', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should order exact matches before partial matches', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Beach',
            slug: 'beach',
            is_active: true,
            start_time: '2025-06-15T14:00:00Z',
          },
          {
            id: 'event-2',
            name: 'Beach Party',
            slug: 'beach-party',
            is_active: true,
            start_time: '2025-06-16T14:00:00Z',
          },
          {
            id: 'event-3',
            name: 'Sunset at Beach',
            slug: 'sunset-beach',
            is_active: true,
            start_time: '2025-06-17T14:00:00Z',
          },
        ];

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=beach&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results[0].name).toBe('Beach'); // Exact match first
      });

      it('should sort alphabetically within same relevance level', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Zebra Event',
            slug: 'zebra',
            is_active: true,
            start_time: '2025-06-15T14:00:00Z',
          },
          {
            id: 'event-2',
            name: 'Apple Event',
            slug: 'apple',
            is_active: true,
            start_time: '2025-06-16T14:00:00Z',
          },
        ];

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/search?q=event&type=event');
        const response = await searchGET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.results[0].name).toBe('Apple Event'); // Alphabetically first
        expect(data.data.results[1].name).toBe('Zebra Event');
      });
    });
  });

  describe('GET /api/admin/references/:type/:id', () => {
    describe('Authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        const request = new Request('http://localhost:3000/api/admin/references/event/event-1');
        const response = await previewGET(request, { params: Promise.resolve({ type: 'event', id: 'event-1' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should return 400 for invalid entity type', async () => {
        const request = new Request('http://localhost:3000/api/admin/references/invalid/id-1');
        const response = await previewGET(request, { params: Promise.resolve({ type: 'invalid', id: 'id-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Entity Preview', () => {
      beforeEach(() => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        });
      });

      it('should return event preview with details', async () => {
        const mockEvent = {
          id: 'event-1',
          name: 'Ceremony',
          slug: 'ceremony',
          is_active: true,
          start_time: '2025-06-15T14:00:00Z',
          end_time: '2025-06-15T15:00:00Z',
          description: 'Wedding ceremony',
          event_type: 'ceremony',
          locations: { name: 'Beach' },
        };

        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockEvent, error: null }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/event/event-1');
        const response = await previewGET(request, { params: Promise.resolve({ type: 'event', id: 'event-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toMatchObject({
          id: 'event-1',
          name: 'Ceremony',
          type: 'event',
          slug: 'ceremony',
          status: 'active',
        });
        expect(data.data.details).toMatchObject({
          eventType: 'ceremony',
          startTime: '2025-06-15T14:00:00Z',
          endTime: '2025-06-15T15:00:00Z',
          description: 'Wedding ceremony',
          location: 'Beach',
        });
      });

      it('should return activity preview with capacity info', async () => {
        const mockActivity = {
          id: 'activity-1',
          name: 'Beach Day',
          slug: 'beach-day',
          capacity: 50,
          start_time: '2025-06-16T10:00:00Z',
          end_time: '2025-06-16T16:00:00Z',
          description: 'Fun at the beach',
          activity_type: 'activity',
          cost_per_person: 25,
          locations: { name: 'Playa Tamarindo' },
        };

        mockSupabaseClient.from.mockImplementation((table: string) => {
          if (table === 'activities') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockActivity, error: null }),
                }),
              }),
            };
          }
          if (table === 'rsvps') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({ count: 30, error: null }),
                }),
              }),
            };
          }
          return { select: jest.fn() };
        });

        const request = new Request('http://localhost:3000/api/admin/references/activity/activity-1');
        const response = await previewGET(request, { params: Promise.resolve({ type: 'activity', id: 'activity-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.details).toMatchObject({
          capacity: 50,
          attendees: 30,
          costPerPerson: 25,
        });
      });

      it('should return 404 when entity not found', async () => {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        });

        const request = new Request('http://localhost:3000/api/admin/references/event/nonexistent');
        const response = await previewGET(request, { params: Promise.resolve({ type: 'event', id: 'nonexistent' }) });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
      });
    });
  });
});
