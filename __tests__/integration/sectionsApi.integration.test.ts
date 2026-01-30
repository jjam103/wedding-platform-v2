/**
 * Integration Test: Sections API
 * 
 * Tests section CRUD operations, reordering, reference validation,
 * and circular reference detection via API route handlers.
 * 
 * Validates: Requirements 15.1-15.7
 * 
 * Test Coverage:
 * - POST /api/admin/sections - Create section
 * - GET /api/admin/sections/by-page/:pageType/:pageId - List sections
 * - PUT /api/admin/sections/:id - Update section
 * - DELETE /api/admin/sections/:id - Delete section
 * - POST /api/admin/sections/reorder - Reorder sections
 * - POST /api/admin/sections/validate-refs - Validate references
 * - POST /api/admin/sections/check-circular - Check circular references
 * - Authentication checks (401 responses)
 * - Validation errors (400 responses)
 * - Not found errors (404 responses)
 * - Server errors (500 responses)
 */

// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock the sections service BEFORE importing route handlers
jest.mock('@/services/sectionsService', () => ({
  createSection: jest.fn(),
  listSections: jest.fn(),
  updateSection: jest.fn(),
  deleteSection: jest.fn(),
  reorderSections: jest.fn(),
  validateReferences: jest.fn(),
  detectCircularReferences: jest.fn(),
}));

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
    getAll: jest.fn(() => []),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock Supabase SSR client
const mockGetUser = jest.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

import { POST as createSectionRoute } from '@/app/api/admin/sections/route';
import { GET as listSectionsRoute } from '@/app/api/admin/sections/by-page/[pageType]/[pageId]/route';
import { PUT as updateSectionRoute, DELETE as deleteSectionRoute } from '@/app/api/admin/sections/[id]/route';
import { POST as reorderSectionsRoute } from '@/app/api/admin/sections/reorder/route';
import { POST as validateReferencesRoute } from '@/app/api/admin/sections/validate-refs/route';
import { POST as checkCircularRoute } from '@/app/api/admin/sections/check-circular/route';
import * as sectionsService from '@/services/sectionsService';

describe('Integration Test: Sections API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default: authenticated user
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
      },
      error: null,
    } as any);
  });

  describe('POST /api/admin/sections - Create Section', () => {
    it('should create section with valid data when authenticated', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'page-1',
        display_order: 0,
        columns: [
          {
            id: 'col-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Content</p>' },
          },
        ],
      };

      (sectionsService.createSection as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSection,
      });

      const request = {
        json: async () => ({
          page_type: 'activity',
          page_id: 'page-1',
          display_order: 0,
          columns: [
            {
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Content</p>' },
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections',
      } as any;

      const response = await createSectionRoute(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('section-1');
      expect(data.data.page_type).toBe('activity');
      expect(sectionsService.createSection).toHaveBeenCalled();
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          page_type: 'activity',
          page_id: 'page-1',
          display_order: 0,
          columns: [],
        }),
        url: 'http://localhost:3000/api/admin/sections',
      } as any;

      const response = await createSectionRoute(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid page_type', async () => {
      const request = {
        json: async () => ({
          page_type: 'invalid_type',
          page_id: 'page-1',
          display_order: 0,
          columns: [],
        }),
        url: 'http://localhost:3000/api/admin/sections',
      } as any;

      const response = await createSectionRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      (sectionsService.createSection as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = {
        json: async () => ({
          page_type: 'activity',
          page_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          display_order: 0,
          columns: [
            {
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ], // Must have at least 1 column
        }),
        url: 'http://localhost:3000/api/admin/sections',
      } as any;

      const response = await createSectionRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /api/admin/sections/by-page/:pageType/:pageId - List Sections', () => {
    it('should list sections for a page when authenticated', async () => {
      const mockSections = [
        {
          id: 'section-1',
          page_type: 'activity',
          page_id: 'page-1',
          display_order: 0,
          columns: [],
        },
        {
          id: 'section-2',
          page_type: 'activity',
          page_id: 'page-1',
          display_order: 1,
          columns: [],
        },
      ];

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSections,
      });

      const request = {
        url: 'http://localhost:3000/api/admin/sections/by-page/activity/page-1',
      } as any;

      const response = await listSectionsRoute(
        request,
        { params: Promise.resolve({ pageType: 'activity', pageId: 'page-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].display_order).toBe(0);
      expect(data.data[1].display_order).toBe(1);
      expect(sectionsService.listSections).toHaveBeenCalledWith('activity', 'page-1');
    });

    it('should return empty array when no sections exist', async () => {
      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const request = {
        url: 'http://localhost:3000/api/admin/sections/by-page/activity/page-1',
      } as any;

      const response = await listSectionsRoute(
        request,
        { params: Promise.resolve({ pageType: 'activity', pageId: 'page-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/sections/by-page/activity/page-1',
      } as any;

      const response = await listSectionsRoute(
        request,
        { params: Promise.resolve({ pageType: 'activity', pageId: 'page-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for database errors', async () => {
      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/admin/sections/by-page/activity/page-1',
      } as any;

      const response = await listSectionsRoute(
        request,
        { params: Promise.resolve({ pageType: 'activity', pageId: 'page-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/admin/sections/:id - Update Section', () => {
    it('should update section with valid data when authenticated', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'page-1',
        display_order: 1,
        columns: [
          {
            id: 'col-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Updated content</p>' },
          },
        ],
      };

      (sectionsService.updateSection as jest.Mock).mockResolvedValue({
        success: true,
        data: mockSection,
      });

      const request = {
        json: async () => ({
          display_order: 1,
          columns: [
            {
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Updated content</p>' },
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await updateSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.display_order).toBe(1);
      expect(sectionsService.updateSection).toHaveBeenCalledWith('section-1', expect.any(Object));
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          display_order: 1,
        }),
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await updateSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid data', async () => {
      const request = {
        json: async () => ({
          display_order: 'invalid',
        }),
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await updateSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 when section not found', async () => {
      (sectionsService.updateSection as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Section not found',
        },
      });

      const request = {
        json: async () => ({
          display_order: 1,
        }),
        url: 'http://localhost:3000/api/admin/sections/nonexistent',
      } as any;

      const response = await updateSectionRoute(
        request,
        { params: Promise.resolve({ id: 'nonexistent' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should return 500 for database errors', async () => {
      (sectionsService.updateSection as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = {
        json: async () => ({
          display_order: 1,
        }),
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await updateSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('DELETE /api/admin/sections/:id - Delete Section', () => {
    it('should delete section when authenticated', async () => {
      (sectionsService.deleteSection as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Section deleted successfully' },
      });

      const request = {
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await deleteSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(sectionsService.deleteSection).toHaveBeenCalledWith('section-1');
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await deleteSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for database errors', async () => {
      (sectionsService.deleteSection as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = {
        url: 'http://localhost:3000/api/admin/sections/section-1',
      } as any;

      const response = await deleteSectionRoute(
        request,
        { params: Promise.resolve({ id: 'section-1' }) }
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/admin/sections/reorder - Reorder Sections', () => {
    it('should reorder sections with valid data when authenticated', async () => {
      (sectionsService.reorderSections as jest.Mock).mockResolvedValue({
        success: true,
        data: { message: 'Sections reordered successfully' },
      });

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          sectionIds: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003'], // Valid UUIDs
        }),
        url: 'http://localhost:3000/api/admin/sections/reorder',
      } as any;

      const response = await reorderSectionsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(sectionsService.reorderSections).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174003']
      );
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          pageId: 'page-1',
          sectionIds: ['section-1'],
        }),
        url: 'http://localhost:3000/api/admin/sections/reorder',
      } as any;

      const response = await reorderSectionsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for empty section list', async () => {
      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          sectionIds: [],
        }),
        url: 'http://localhost:3000/api/admin/sections/reorder',
      } as any;

      const response = await reorderSectionsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for database errors', async () => {
      (sectionsService.reorderSections as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error',
        },
      });

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          sectionIds: ['123e4567-e89b-12d3-a456-426614174001'], // Valid UUID
        }),
        url: 'http://localhost:3000/api/admin/sections/reorder',
      } as any;

      const response = await reorderSectionsRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /api/admin/sections/validate-refs - Validate References', () => {
    it('should validate references successfully with no broken refs', async () => {
      (sectionsService.validateReferences as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          valid: true,
          brokenReferences: [],
        },
      });

      const request = {
        json: async () => ({
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
              type: 'activity',
              name: 'Beach Day',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID
              type: 'event',
              name: 'Ceremony',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/validate-refs',
      } as any;

      const response = await validateReferencesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(true);
      expect(data.data.brokenReferences).toHaveLength(0);
    });

    it('should detect broken references', async () => {
      (sectionsService.validateReferences as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          valid: false,
          brokenReferences: [
            {
              id: '123e4567-e89b-12d3-a456-426614174999', // Valid UUID
              type: 'activity',
            },
          ],
        },
      });

      const request = {
        json: async () => ({
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
              type: 'activity',
            },
            {
              id: '123e4567-e89b-12d3-a456-426614174999', // Valid UUID
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/validate-refs',
      } as any;

      const response = await validateReferencesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.valid).toBe(false);
      expect(data.data.brokenReferences).toHaveLength(1);
      expect(data.data.brokenReferences[0].id).toBe('123e4567-e89b-12d3-a456-426614174999');
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/validate-refs',
      } as any;

      const response = await validateReferencesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid reference type', async () => {
      const request = {
        json: async () => ({
          references: [
            {
              id: 'invalid-1',
              type: 'invalid_type',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/validate-refs',
      } as any;

      const response = await validateReferencesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for service errors', async () => {
      (sectionsService.validateReferences as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = {
        json: async () => ({
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/validate-refs',
      } as any;

      const response = await validateReferencesRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('POST /api/admin/sections/check-circular - Check Circular References', () => {
    it('should detect direct self-reference', async () => {
      (sectionsService.detectCircularReferences as jest.Mock).mockResolvedValue({
        success: true,
        data: true,
      });

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000', // Same as pageId for self-reference
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/check-circular',
      } as any;

      const response = await checkCircularRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.hasCircularReferences).toBe(true);
    });

    it('should return false when no circular references exist', async () => {
      (sectionsService.detectCircularReferences as jest.Mock).mockResolvedValue({
        success: true,
        data: false,
      });

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001', // Different from pageId
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/check-circular',
      } as any;

      const response = await checkCircularRoute(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.hasCircularReferences).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      } as any);

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/check-circular',
      } as any;

      const response = await checkCircularRoute(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing required fields', async () => {
      const request = {
        json: async () => ({
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID
              type: 'activity',
            },
          ],
          // Missing pageId
        }),
        url: 'http://localhost:3000/api/admin/sections/check-circular',
      } as any;

      const response = await checkCircularRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for service errors', async () => {
      (sectionsService.detectCircularReferences as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Database connection failed',
        },
      });

      const request = {
        json: async () => ({
          pageId: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
          references: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID
              type: 'activity',
            },
          ],
        }),
        url: 'http://localhost:3000/api/admin/sections/check-circular',
      } as any;

      const response = await checkCircularRoute(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNKNOWN_ERROR');
    });
  });
});
