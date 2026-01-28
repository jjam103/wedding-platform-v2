/**
 * Integration Test: Content Pages API
 * 
 * Tests authenticated requests, validation errors, CRUD operations,
 * and error responses for content pages API endpoints.
 * 
 * Validates: Requirements 13.1-13.8
 * 
 * Test Coverage:
 * - POST /api/admin/content-pages - Create content page
 * - GET /api/admin/content-pages - List content pages
 * - GET /api/admin/content-pages/:id - Get single content page
 * - PUT /api/admin/content-pages/:id - Update content page
 * - DELETE /api/admin/content-pages/:id - Delete content page
 * - Authentication checks (401 responses)
 * - Validation errors (400 responses)
 * - Not found errors (404 responses)
 * - Server errors (500 responses)
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
  NextRequest: jest.fn(),
}));

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

// Mock Supabase auth helper
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabaseClient),
}));

// Mock the supabase client in the service
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import { GET as listContentPages, POST as createContentPage } from '@/app/api/admin/content-pages/route';
import { 
  GET as getContentPage, 
  PUT as updateContentPage, 
  DELETE as deleteContentPage 
} from '@/app/api/admin/content-pages/[id]/route';

describe('Integration Test: Content Pages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: authenticated session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123' },
          access_token: 'token',
        },
      },
      error: null,
    });
  });

  describe('POST /api/admin/content-pages - Create Content Page', () => {
    it('should create content page with valid data when authenticated', async () => {
      const mockContentPage = {
        id: 'page-123',
        title: 'Our Story',
        slug: 'our-story',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock database insert
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found - slug is unique
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Our Story',
          slug: 'our-story',
          status: 'draft',
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('page-123');
      expect(data.data.title).toBe('Our Story');
      expect(data.data.slug).toBe('our-story');
    });

    it('should auto-generate slug from title when slug not provided', async () => {
      const mockContentPage = {
        id: 'page-124',
        title: 'Travel Information',
        slug: 'travel-information',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Travel Information',
          status: 'draft',
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.slug).toBe('travel-information');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        json: async () => ({
          title: 'Our Story',
          status: 'draft',
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing required fields', async () => {
      const request = {
        json: async () => ({
          status: 'draft',
          // Missing title
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toBeDefined();
    });

    it('should return 400 for invalid slug format', async () => {
      const request = {
        json: async () => ({
          title: 'Our Story',
          slug: 'Our Story!', // Invalid: uppercase and special chars
          status: 'draft',
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid status value', async () => {
      const request = {
        json: async () => ({
          title: 'Our Story',
          status: 'pending', // Invalid: not 'draft' or 'published'
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Our Story',
          status: 'draft',
        }),
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await createContentPage(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/content-pages - List Content Pages', () => {
    it('should list all content pages when authenticated', async () => {
      const mockPages = [
        {
          id: 'page-1',
          title: 'Our Story',
          slug: 'our-story',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'page-2',
          title: 'Travel Info',
          slug: 'travel-info',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPages,
            error: null,
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await listContentPages(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].id).toBe('page-1');
    });

    it('should filter by status when provided', async () => {
      const mockPages = [
        {
          id: 'page-1',
          title: 'Our Story',
          slug: 'our-story',
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockPages,
              error: null,
            }),
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages?status=published',
      } as any;

      const response = await listContentPages(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('published');
    });

    it('should return 400 for invalid status filter', async () => {
      const request = {
        url: 'http://localhost:3000/api/admin/content-pages?status=invalid',
      } as any;

      const response = await listContentPages(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await listContentPages(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages',
      } as any;

      const response = await listContentPages(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/content-pages/:id - Get Content Page', () => {
    it('should get content page by ID when authenticated', async () => {
      const mockPage = {
        id: 'page-123',
        title: 'Our Story',
        slug: 'our-story',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPage,
              error: null,
            }),
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await getContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('page-123');
      expect(data.data.title).toBe('Our Story');
    });

    it('should return 404 when content page not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/nonexistent',
      } as any;

      const response = await getContentPage(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await getContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await getContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/admin/content-pages/:id - Update Content Page', () => {
    it('should update content page with valid data when authenticated', async () => {
      const mockUpdatedPage = {
        id: 'page-123',
        title: 'Our Updated Story',
        slug: 'our-story',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedPage,
                error: null,
              }),
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Our Updated Story',
          status: 'published',
        }),
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Our Updated Story');
      expect(data.data.status).toBe('published');
    });

    it('should update only provided fields (partial update)', async () => {
      const mockUpdatedPage = {
        id: 'page-123',
        title: 'Our Story',
        slug: 'our-story',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedPage,
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          status: 'published', // Only updating status
        }),
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('published');
    });

    it('should return 404 when content page not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Updated Title',
        }),
        url: 'http://localhost:3000/api/admin/content-pages/nonexistent',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        json: async () => ({
          title: 'Updated Title',
        }),
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid data', async () => {
      const request = {
        json: async () => ({
          slug: 'Invalid Slug!', // Invalid format
        }),
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      });

      const request = {
        json: async () => ({
          title: 'Updated Title',
        }),
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await updateContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('DELETE /api/admin/content-pages/:id - Delete Content Page', () => {
    it('should delete content page when authenticated', async () => {
      // Mock for both sections and content_pages tables
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'sections') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        // content_pages table
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await deleteContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('Content page deleted successfully');
    });

    it('should delete associated sections when deleting page', async () => {
      // Mock for both sections and content_pages tables
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'sections') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        // content_pages table
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        };
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      await deleteContentPage(request, { params: { id: 'page-123' } });

      // Verify sections were deleted (called twice: once for sections, once for page)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sections');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('content_pages');
    });

    it('should return 401 when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await deleteContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for database errors', async () => {
      // Mock sections delete to succeed, but content_pages delete to fail
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'sections') {
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        // content_pages table - return error
        return {
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        };
      });

      const request = {
        url: 'http://localhost:3000/api/admin/content-pages/page-123',
      } as any;

      const response = await deleteContentPage(request, { params: { id: 'page-123' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });
});
