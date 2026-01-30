import {
  createSection,
  getSection,
  updateSection,
  deleteSection,
  listSections,
  reorderSections,
  validateReferences,
  detectCircularReferences,
} from './sectionsService';
import type { CreateSectionDTO, UpdateSectionDTO, Reference } from '../schemas/cmsSchemas';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock sanitization utilities
jest.mock('../utils/sanitization', () => ({
  sanitizeInput: jest.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  sanitizeRichText: jest.fn((html: string) => html.replace(/<script[^>]*>.*?<\/script>/gi, '')),
}));

const { supabase } = require('../lib/supabase');
const { sanitizeInput, sanitizeRichText } = require('../utils/sanitization');

describe('sectionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSection', () => {
    const validSectionData: CreateSectionDTO = {
      page_type: 'activity',
      page_id: 'activity-1',
      display_order: 0,
      columns: [
        {
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Test content</p>' },
        },
      ],
    };

    it('should return success with section data when valid input provided', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
        created_at: '2025-01-29T12:00:00Z',
        updated_at: '2025-01-29T12:00:00Z',
      };

      const mockColumns = [
        {
          id: 'col-1',
          section_id: 'section-1',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Test content</p>' },
          created_at: '2025-01-29T12:00:00Z',
          updated_at: '2025-01-29T12:00:00Z',
        },
      ];

      // Mock section insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock columns insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: mockColumns,
            error: null,
          }),
        }),
      });

      const result = await createSection(validSectionData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('section-1');
        expect(result.data.columns).toHaveLength(1);
        expect(result.data.columns[0].content_data).toEqual({ html: '<p>Test content</p>' });
      }
    });

    it('should return VALIDATION_ERROR when invalid input provided', async () => {
      const invalidData = {
        page_type: 'invalid_type',
        page_id: '',
        display_order: -1,
        columns: [],
      } as any;

      const result = await createSection(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details).toBeDefined();
      }
    });

    it('should return DATABASE_ERROR when section insert fails', async () => {
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      });

      const result = await createSection(validSectionData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Insert failed');
      }
    });

    it('should return DATABASE_ERROR when columns insert fails and rollback section', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
      };

      // Mock section insert success
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock columns insert failure
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Columns insert failed' },
          }),
        }),
      });

      // Mock rollback delete
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await createSection(validSectionData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Columns insert failed');
      }
    });

    it('should sanitize rich text content to prevent XSS attacks', async () => {
      const maliciousData: CreateSectionDTO = {
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
        columns: [
          {
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Safe content</p><script>alert("xss")</script>' },
          },
        ],
      };

      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
      };

      const mockColumns = [
        {
          id: 'col-1',
          section_id: 'section-1',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Safe content</p>' },
        },
      ];

      // Mock section insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock columns insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: mockColumns,
            error: null,
          }),
        }),
      });

      const result = await createSection(maliciousData);

      expect(result.success).toBe(true);
      expect(sanitizeRichText).toHaveBeenCalledWith('<p>Safe content</p><script>alert("xss")</script>');
      if (result.success) {
        expect(result.data.columns[0].content_data).toEqual({ html: '<p>Safe content</p>' });
      }
    });
  });

  describe('getSection', () => {
    it('should return success with section data when section exists', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
        created_at: '2025-01-29T12:00:00Z',
        updated_at: '2025-01-29T12:00:00Z',
      };

      const mockColumns = [
        {
          id: 'col-1',
          section_id: 'section-1',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Test content</p>' },
        },
      ];

      // Mock section select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock columns select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockColumns,
              error: null,
            }),
          }),
        }),
      });

      const result = await getSection('section-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('section-1');
        expect(result.data.columns).toHaveLength(1);
        expect(result.data.columns[0].content_data).toEqual({ html: '<p>Test content</p>' });
      }
    });

    it('should return NOT_FOUND when section does not exist', async () => {
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Section not found' },
            }),
          }),
        }),
      });

      const result = await getSection('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when section query fails', async () => {
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const result = await getSection('section-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should return DATABASE_ERROR when columns query fails', async () => {
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
      };

      // Mock section select success
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock columns select failure
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Columns query failed' },
            }),
          }),
        }),
      });

      const result = await getSection('section-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Columns query failed');
      }
    });
  });

  describe('updateSection', () => {
    const updateData: UpdateSectionDTO = {
      display_order: 1,
      columns: [
        {
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Updated content</p>' },
        },
      ],
    };

    it('should return success with updated section when valid input provided', async () => {
      // Mock section update
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock columns delete
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock columns insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Mock getSection call (for return value)
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
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

      // Mock getSection - section select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock getSection - columns select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSection.columns,
              error: null,
            }),
          }),
        }),
      });

      const result = await updateSection('section-1', updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_order).toBe(1);
        expect(result.data.columns[0].content_data).toEqual({ html: '<p>Updated content</p>' });
      }
    });

    it('should return VALIDATION_ERROR when invalid input provided', async () => {
      const invalidData = {
        display_order: -1,
        columns: [],
      } as any;

      const result = await updateSection('section-1', invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when section update fails', async () => {
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' },
          }),
        }),
      });

      const result = await updateSection('section-1', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Update failed');
      }
    });

    it('should return DATABASE_ERROR when columns delete fails', async () => {
      // Mock section update success
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock columns delete failure
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      const result = await updateSection('section-1', updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Delete failed');
      }
    });

    it('should sanitize rich text content when updating columns', async () => {
      const maliciousUpdateData: UpdateSectionDTO = {
        columns: [
          {
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Safe content</p><script>alert("xss")</script>' },
          },
        ],
      };

      // Mock section update (no section-level changes)
      // Mock columns delete
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock columns insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Mock getSection call
      const mockSection = {
        id: 'section-1',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 0,
        columns: [
          {
            id: 'col-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Safe content</p>' },
          },
        ],
      };

      // Mock getSection - section select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockSection,
              error: null,
            }),
          }),
        }),
      });

      // Mock getSection - columns select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSection.columns,
              error: null,
            }),
          }),
        }),
      });

      const result = await updateSection('section-1', maliciousUpdateData);

      expect(result.success).toBe(true);
      expect(sanitizeRichText).toHaveBeenCalledWith('<p>Safe content</p><script>alert("xss")</script>');
    });
  });

  describe('deleteSection', () => {
    it('should return success when section is deleted', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      const result = await deleteSection('section-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      });

      const result = await deleteSection('section-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Delete failed');
      }
    });
  });

  describe('listSections', () => {
    it('should return success with sections and columns when sections exist', async () => {
      const mockSections = [
        {
          id: 'section-1',
          page_type: 'activity',
          page_id: 'activity-1',
          display_order: 0,
        },
        {
          id: 'section-2',
          page_type: 'activity',
          page_id: 'activity-1',
          display_order: 1,
        },
      ];

      const mockColumns = [
        {
          id: 'col-1',
          section_id: 'section-1',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Section 1 content</p>' },
        },
        {
          id: 'col-2',
          section_id: 'section-2',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Section 2 content</p>' },
        },
      ];

      // Mock sections select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockSections,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock columns select
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockColumns,
              error: null,
            }),
          }),
        }),
      });

      const result = await listSections('activity', 'activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].columns).toHaveLength(1);
        expect(result.data[1].columns).toHaveLength(1);
        expect(result.data[0].display_order).toBe(0);
        expect(result.data[1].display_order).toBe(1);
      }
    });

    it('should return success with empty array when no sections exist', async () => {
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await listSections('activity', 'activity-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return DATABASE_ERROR when sections query fails', async () => {
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Sections query failed' },
              }),
            }),
          }),
        }),
      });

      const result = await listSections('activity', 'activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Sections query failed');
      }
    });

    it('should return DATABASE_ERROR when columns query fails', async () => {
      const mockSections = [
        {
          id: 'section-1',
          page_type: 'activity',
          page_id: 'activity-1',
          display_order: 0,
        },
      ];

      // Mock sections select success
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockSections,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock columns select failure
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Columns query failed' },
            }),
          }),
        }),
      });

      const result = await listSections('activity', 'activity-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Columns query failed');
      }
    });
  });

  describe('reorderSections', () => {
    it('should return success when sections are reordered', async () => {
      const sectionIds = ['section-2', 'section-1', 'section-3'];

      // Mock each update call
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      const result = await reorderSections('page-1', sectionIds);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should return DATABASE_ERROR when any update fails', async () => {
      const sectionIds = ['section-1', 'section-2'];

      // Mock first update success, second update failure
      supabase.from
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: 'Update failed' },
              }),
            }),
          }),
        });

      const result = await reorderSections('page-1', sectionIds);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Failed to reorder sections');
      }
    });

    it('should update display_order correctly for each section', async () => {
      const sectionIds = ['section-3', 'section-1', 'section-2'];
      const updateMocks: any[] = [];

      // Create mock for each section update
      sectionIds.forEach((_, index) => {
        const updateMock = jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        });
        updateMocks.push(updateMock);

        supabase.from.mockReturnValueOnce({
          update: updateMock,
        });
      });

      await reorderSections('page-1', sectionIds);

      // Verify each section was updated with correct display_order
      expect(updateMocks[0]).toHaveBeenCalledWith({ display_order: 0 });
      expect(updateMocks[1]).toHaveBeenCalledWith({ display_order: 1 });
      expect(updateMocks[2]).toHaveBeenCalledWith({ display_order: 2 });
    });
  });

  describe('validateReferences', () => {
    it('should return success with valid result when all references exist', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-1' },
        { type: 'event', id: 'event-1' },
      ];

      // Mock activity exists
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'activity-1' },
              error: null,
            }),
          }),
        }),
      });

      // Mock event exists
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'event-1' },
              error: null,
            }),
          }),
        }),
      });

      const result = await validateReferences(references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.brokenReferences).toHaveLength(0);
        expect(result.data.circularReferences).toHaveLength(0);
      }
    });

    it('should return success with broken references when some references do not exist', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-1' },
        { type: 'event', id: 'non-existent' },
      ];

      // Mock activity exists
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'activity-1' },
              error: null,
            }),
          }),
        }),
      });

      // Mock event does not exist
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await validateReferences(references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.brokenReferences).toHaveLength(1);
        expect(result.data.brokenReferences[0]).toEqual({ type: 'event', id: 'non-existent' });
      }
    });

    it('should validate all reference types (activity, event, accommodation, location)', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-1' },
        { type: 'event', id: 'event-1' },
        { type: 'accommodation', id: 'accommodation-1' },
        { type: 'location', id: 'location-1' },
      ];

      // Mock all references exist
      references.forEach(() => {
        supabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'exists' },
                error: null,
              }),
            }),
          }),
        });
      });

      const result = await validateReferences(references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.brokenReferences).toHaveLength(0);
      }
    });
  });

  describe('detectCircularReferences', () => {
    it('should return success with false when no circular references exist', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-2' },
      ];

      // Mock no sections found for referenced activity
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await detectCircularReferences('activity-1', references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });

    it('should return success with true when direct self-reference detected', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-1' },
      ];

      const result = await detectCircularReferences('activity-1', references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return success with true when circular reference chain detected', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-2' },
      ];

      // Mock sections for activity-2
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'section-1' }],
              error: null,
            }),
          }),
        }),
      });

      // Mock columns for activity-2 that reference back to activity-1
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  content_data: {
                    references: [{ type: 'activity', id: 'activity-1' }],
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      const result = await detectCircularReferences('activity-1', references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should handle complex reference chains without false positives', async () => {
      const references: Reference[] = [
        { type: 'activity', id: 'activity-2' },
      ];

      // Mock sections for activity-2
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: 'section-1' }],
              error: null,
            }),
          }),
        }),
      });

      // Mock columns for activity-2 that reference activity-3 (not circular)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  content_data: {
                    references: [{ type: 'activity', id: 'activity-3' }],
                  },
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      // Mock sections for activity-3 (no references)
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await detectCircularReferences('activity-1', references);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }
    });
  });
});