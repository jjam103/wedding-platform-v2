/**
 * Integration Test: Sections API
 * 
 * Tests section CRUD operations, reordering, reference validation,
 * and circular reference detection for the sections service layer.
 * 
 * Validates: Requirements 15.1-15.7
 * 
 * Test Coverage:
 * - Section CRUD operations (create, read, update, delete)
 * - Section reordering
 * - Reference validation
 * - Circular reference detection
 * - Error handling and validation
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
}));

// Create a proper mock chain for Supabase
const createMockChain = () => {
  const chain: any = {
    from: jest.fn(() => chain),
    insert: jest.fn(() => chain),
    select: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn(),
  };
  return chain;
};

const mockSupabaseClient = createMockChain();

// Mock Supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import {
  createSection,
  listSections,
  updateSection,
  deleteSection,
  reorderSections,
  validateReferences,
  detectCircularReferences,
} from '@/services/sectionsService';

describe('Integration Test: Sections API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock chain
    Object.assign(mockSupabaseClient, createMockChain());
  });

  describe('Section CRUD Operations', () => {
    describe('createSection', () => {
      it('should return validation error for invalid data', async () => {
        const result = await createSection({
          page_type: 'invalid_type' as any,
          page_id: 'page-1',
          display_order: 0,
          columns: [],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
        }
      });
    });

    describe('listSections', () => {
      it('should list sections for a page', async () => {
        const mockSections = [
          {
            id: 'section-1',
            page_type: 'activity',
            page_id: 'page-1',
            display_order: 0,
          },
          {
            id: 'section-2',
            page_type: 'activity',
            page_id: 'page-1',
            display_order: 1,
          },
        ];

        const mockColumns = [
          {
            id: 'col-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Content 1</p>' },
          },
          {
            id: 'col-2',
            section_id: 'section-2',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Content 2</p>' },
          },
        ];

        // Mock sections query
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockSections,
          error: null,
        });

        // Mock columns query
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockColumns,
          error: null,
        });

        const result = await listSections('activity', 'page-1');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
          expect(result.data[0].display_order).toBe(0);
          expect(result.data[1].display_order).toBe(1);
        }
      });

      it('should return empty array when no sections exist', async () => {
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: [],
          error: null,
        });

        const result = await listSections('activity', 'page-1');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(0);
        }
      });

      it('should return database error on query failure', async () => {
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

        const result = await listSections('activity', 'page-1');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('DATABASE_ERROR');
        }
      });
    });

    describe('updateSection', () => {
      it('should update section with valid data', async () => {
        const mockSection = {
          id: 'section-1',
          page_type: 'activity',
          page_id: 'page-1',
          display_order: 1,
        };

        const mockColumns = [
          {
            id: 'col-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Updated content</p>' },
          },
        ];

        // Mock update section
        mockSupabaseClient.eq.mockResolvedValueOnce({
          error: null,
        });

        // Mock delete columns
        mockSupabaseClient.eq.mockResolvedValueOnce({
          error: null,
        });

        // Mock insert columns
        mockSupabaseClient.insert.mockResolvedValueOnce({
          error: null,
        });

        // Mock getSection call - section query
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: mockSection,
          error: null,
        });

        // Mock getSection call - columns query
        mockSupabaseClient.order.mockResolvedValueOnce({
          data: mockColumns,
          error: null,
        });

        const result = await updateSection('section-1', {
          display_order: 1,
          columns: [
            {
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Updated content</p>' },
            },
          ],
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.display_order).toBe(1);
        }
      });

      it('should return validation error for invalid data', async () => {
        const result = await updateSection('section-1', {
          display_order: 'invalid' as any,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('VALIDATION_ERROR');
        }
      });

      it('should return database error on update failure', async () => {
        mockSupabaseClient.eq.mockResolvedValueOnce({
          error: { message: 'Database error' },
        });

        const result = await updateSection('section-1', {
          display_order: 1,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('DATABASE_ERROR');
        }
      });
    });

    describe('deleteSection', () => {
      it('should delete section successfully', async () => {
        mockSupabaseClient.eq.mockResolvedValueOnce({
          error: null,
        });

        const result = await deleteSection('section-1');

        expect(result.success).toBe(true);
        expect(mockSupabaseClient.delete).toHaveBeenCalled();
      });

      it('should return database error on delete failure', async () => {
        mockSupabaseClient.eq.mockResolvedValueOnce({
          error: { message: 'Database error' },
        });

        const result = await deleteSection('section-1');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('DATABASE_ERROR');
        }
      });
    });
  });

  describe('Section Reordering', () => {
    describe('reorderSections', () => {
      it('should handle empty section list', async () => {
        // Empty array should succeed with no operations
        const result = await reorderSections('page-1', []);
        
        // Should succeed but perform no operations
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Reference Validation', () => {
    describe('validateReferences', () => {
      it('should validate references successfully with no broken refs', async () => {
        // Mock activity exists - from().select().eq().single()
        mockSupabaseClient.single
          .mockResolvedValueOnce({
            data: { id: 'activity-1' },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: 'event-1' },
            error: null,
          });

        const result = await validateReferences([
          {
            id: 'activity-1',
            type: 'activity',
            name: 'Beach Day',
          },
          {
            id: 'event-1',
            type: 'event',
            name: 'Ceremony',
          },
        ]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.valid).toBe(true);
          expect(result.data.brokenReferences).toHaveLength(0);
        }
      });

      it('should detect broken references', async () => {
        // Mock activity exists
        mockSupabaseClient.single
          .mockResolvedValueOnce({
            data: { id: 'activity-1' },
            error: null,
          })
          .mockResolvedValueOnce({
            data: null,
            error: null,
          });

        const result = await validateReferences([
          {
            id: 'activity-1',
            type: 'activity',
          },
          {
            id: 'activity-999',
            type: 'activity',
          },
        ]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.valid).toBe(false);
          expect(result.data.brokenReferences).toHaveLength(1);
          expect(result.data.brokenReferences[0].id).toBe('activity-999');
        }
      });

      it('should handle validation errors gracefully', async () => {
        // Mock database error
        mockSupabaseClient.single.mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const result = await validateReferences([
          {
            id: 'activity-1',
            type: 'activity',
          },
        ]);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('UNKNOWN_ERROR');
        }
      });
    });
  });

  describe('Circular Reference Detection', () => {
    describe('detectCircularReferences', () => {
      it('should detect direct self-reference', async () => {
        const result = await detectCircularReferences('page-1', [
          {
            id: 'page-1',
            type: 'activity',
          },
        ]);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(true);
        }
      });

      it('should handle detection errors gracefully', async () => {
        // Mock database error
        mockSupabaseClient.eq.mockRejectedValueOnce(
          new Error('Database connection failed')
        );

        const result = await detectCircularReferences('page-1', [
          {
            id: 'page-2',
            type: 'activity',
          },
        ]);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('UNKNOWN_ERROR');
        }
      });
    });
  });
});
