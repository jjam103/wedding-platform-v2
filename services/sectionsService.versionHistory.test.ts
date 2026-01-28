import {
  getVersionHistory,
  createVersionSnapshot,
  revertToVersion,
  listSections,
  createSection,
} from './sectionsService';
import type { ContentVersion } from '../schemas/cmsSchemas';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../lib/supabase');

describe('sectionsService - Version History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVersionHistory', () => {
    it('should return success with version history when versions exist', async () => {
      const mockVersions: ContentVersion[] = [
        {
          id: 'version-1',
          page_type: 'custom',
          page_id: 'page-1',
          created_by: 'user-1',
          sections_snapshot: [],
          created_at: '2025-01-27T12:00:00Z',
        },
        {
          id: 'version-2',
          page_type: 'custom',
          page_id: 'page-1',
          created_by: 'user-1',
          sections_snapshot: [],
          created_at: '2025-01-27T11:00:00Z',
        },
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockVersions,
              error: null,
            }),
          }),
        }),
      });

      const result = await getVersionHistory('page-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('version-1');
        expect(result.data[1].id).toBe('version-2');
      }
    });

    it('should return success with empty array when no versions exist', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await getVersionHistory('page-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });

      const result = await getVersionHistory('page-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Database connection failed');
      }
    });

    it('should order versions by created_at descending', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      });

      await getVersionHistory('page-1');

      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('createVersionSnapshot', () => {
    it('should return success with created version when snapshot is created', async () => {
      const mockSections = [
        {
          id: 'section-1',
          page_type: 'custom',
          page_id: 'page-1',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              section_id: 'section-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      // Mock listSections - sections call
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockSections[0]],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock listSections - columns call
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSections[0].columns,
              error: null,
            }),
          }),
        }),
      });

      // Mock insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'version-1',
                page_type: 'custom',
                page_id: 'page-1',
                created_by: 'user-1',
                sections_snapshot: mockSections,
                created_at: '2025-01-27T12:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await createVersionSnapshot('custom', 'page-1', 'user-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('version-1');
        expect(result.data.page_type).toBe('custom');
        expect(result.data.page_id).toBe('page-1');
        expect(result.data.created_by).toBe('user-1');
        expect(result.data.sections_snapshot).toEqual(mockSections);
      }
    });

    it('should handle null userId when creating snapshot', async () => {
      // Mock listSections - sections call
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

      // Mock listSections - columns call (no columns since no sections)
      // This won't be called since sections is empty

      // Mock insert
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'version-1',
                page_type: 'custom',
                page_id: 'page-1',
                created_by: null,
                sections_snapshot: [],
                created_at: '2025-01-27T12:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      });

      const result = await createVersionSnapshot('custom', 'page-1', null);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created_by).toBeNull();
      }
    });

    it('should return DATABASE_ERROR when listSections fails', async () => {
      // Mock listSections failure
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Failed to fetch sections' },
              }),
            }),
          }),
        }),
      });

      const result = await createVersionSnapshot('custom', 'page-1', 'user-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Failed to fetch sections');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      // Mock listSections - sections call
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

      // Mock insert failure
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

      const result = await createVersionSnapshot('custom', 'page-1', 'user-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Insert failed');
      }
    });

    it('should capture complete section snapshot with columns', async () => {
      const mockSections = [
        {
          id: 'section-1',
          page_type: 'custom',
          page_id: 'page-1',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              section_id: 'section-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Column 1</p>' },
            },
            {
              id: 'col-2',
              section_id: 'section-1',
              column_number: 2,
              content_type: 'photos',
              content_data: { photos: ['photo1.jpg'] },
            },
          ],
        },
      ];

      // Mock listSections - sections call
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockSections[0]],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock listSections - columns call
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSections[0].columns,
              error: null,
            }),
          }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'version-1',
              page_type: 'custom',
              page_id: 'page-1',
              created_by: 'user-1',
              sections_snapshot: mockSections,
              created_at: '2025-01-27T12:00:00Z',
            },
            error: null,
          }),
        }),
      });

      // Mock insert
      supabase.from.mockReturnValueOnce({
        insert: insertMock,
      });

      const result = await createVersionSnapshot('custom', 'page-1', 'user-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sections_snapshot).toHaveLength(1);
        expect(result.data.sections_snapshot[0].columns).toHaveLength(2);
      }

      // Verify insert was called with sections_snapshot
      expect(insertMock).toHaveBeenCalledWith({
        page_type: 'custom',
        page_id: 'page-1',
        created_by: 'user-1',
        sections_snapshot: mockSections,
      });
    });
  });

  describe('revertToVersion', () => {
    it('should return NOT_FOUND when version does not exist', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Version not found' },
              }),
            }),
          }),
        }),
      });

      const result = await revertToVersion('page-1', 'invalid-version');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should verify version belongs to correct page', async () => {
      const eqPageIdMock = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      });

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: eqPageIdMock,
          }),
        }),
      });

      await revertToVersion('page-1', 'version-1');

      // Verify eq was called with page_id
      expect(eqPageIdMock).toHaveBeenCalled();
    });

    it('should return success with restored sections when revert succeeds', async () => {
      const mockVersion = {
        id: 'version-1',
        page_type: 'custom',
        page_id: 'page-1',
        created_by: 'user-1',
        sections_snapshot: [
          {
            id: 'old-section-1',
            page_type: 'custom',
            page_id: 'page-1',
            display_order: 0,
            columns: [
              {
                id: 'old-col-1',
                section_id: 'old-section-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Old content</p>' },
              },
            ],
          },
        ],
        created_at: '2025-01-27T12:00:00Z',
      };

      // Mock get version
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockVersion,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock delete current sections
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      // Mock createSection - insert section
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-section-1',
                page_type: 'custom',
                page_id: 'page-1',
                display_order: 0,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock createSection - insert columns
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'new-col-1',
                section_id: 'new-section-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Old content</p>' },
              },
            ],
            error: null,
          }),
        }),
      });

      const result = await revertToVersion('page-1', 'version-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].columns).toHaveLength(1);
        expect(result.data[0].columns[0].content_data).toEqual({ html: '<p>Old content</p>' });
      }
    });

    it('should delete current sections before restoring', async () => {
      const mockVersion = {
        id: 'version-1',
        page_type: 'custom',
        page_id: 'page-1',
        created_by: 'user-1',
        sections_snapshot: [],
        created_at: '2025-01-27T12:00:00Z',
      };

      // Mock get version
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockVersion,
                error: null,
              }),
            }),
          }),
        }),
      });

      const eqPageTypeMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const deleteMock = jest.fn().mockReturnValue({
        eq: eqPageTypeMock,
      });

      // Mock delete current sections
      supabase.from.mockReturnValueOnce({
        delete: deleteMock,
      });

      await revertToVersion('page-1', 'version-1');

      expect(deleteMock).toHaveBeenCalled();
      expect(eqPageTypeMock).toHaveBeenCalledWith('page_type', 'custom');
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      const mockVersion = {
        id: 'version-1',
        page_type: 'custom',
        page_id: 'page-1',
        created_by: 'user-1',
        sections_snapshot: [],
        created_at: '2025-01-27T12:00:00Z',
      };

      // Mock get version
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockVersion,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock delete failure
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          }),
        }),
      });

      const result = await revertToVersion('page-1', 'version-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
        expect(result.error.message).toBe('Delete failed');
      }
    });

    it('should restore multiple sections with correct order', async () => {
      const mockVersion = {
        id: 'version-1',
        page_type: 'custom',
        page_id: 'page-1',
        created_by: 'user-1',
        sections_snapshot: [
          {
            id: 'old-section-1',
            page_type: 'custom',
            page_id: 'page-1',
            display_order: 0,
            columns: [
              {
                id: 'old-col-1',
                section_id: 'old-section-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Section 1</p>' },
              },
            ],
          },
          {
            id: 'old-section-2',
            page_type: 'custom',
            page_id: 'page-1',
            display_order: 1,
            columns: [
              {
                id: 'old-col-2',
                section_id: 'old-section-2',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Section 2</p>' },
              },
            ],
          },
        ],
        created_at: '2025-01-27T12:00:00Z',
      };

      // Mock get version
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockVersion,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock delete current sections
      supabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      // Mock createSection for first section - insert section
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-section-1',
                page_type: 'custom',
                page_id: 'page-1',
                display_order: 0,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock createSection for first section - insert columns
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'new-col-1',
                section_id: 'new-section-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Section 1</p>' },
              },
            ],
            error: null,
          }),
        }),
      });

      // Mock createSection for second section - insert section
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'new-section-2',
                page_type: 'custom',
                page_id: 'page-1',
                display_order: 1,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock createSection for second section - insert columns
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'new-col-2',
                section_id: 'new-section-2',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Section 2</p>' },
              },
            ],
            error: null,
          }),
        }),
      });

      const result = await revertToVersion('page-1', 'version-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].display_order).toBe(0);
        expect(result.data[1].display_order).toBe(1);
      }
    });

    it('should return DATABASE_ERROR when version fetch fails', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const result = await revertToVersion('page-1', 'version-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
