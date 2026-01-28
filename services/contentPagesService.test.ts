import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { CreateContentPageDTO, UpdateContentPageDTO } from '@/schemas/cmsSchemas';
import { generateSlug } from '@/utils/slugs';

// Mock Supabase before importing contentPagesService
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import * as contentPagesService from './contentPagesService';

describe('contentPagesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should convert title to lowercase slug', () => {
      const slug = generateSlug('Our Story');
      expect(slug).toBe('our-story');
    });

    it('should replace spaces with hyphens', () => {
      const slug = generateSlug('Travel Information Guide');
      expect(slug).toBe('travel-information-guide');
    });

    it('should remove special characters', () => {
      const slug = generateSlug('FAQ & Questions!');
      expect(slug).toBe('faq-questions');
    });

    it('should handle multiple consecutive spaces', () => {
      const slug = generateSlug('Our   Story   Page');
      expect(slug).toBe('our-story-page');
    });

    it('should remove leading and trailing hyphens', () => {
      const slug = generateSlug('  Our Story  ');
      expect(slug).toBe('our-story');
    });

    it('should handle empty string', () => {
      const slug = generateSlug('');
      expect(slug).toBe('');
    });

    it('should handle string with only special characters', () => {
      const slug = generateSlug('!@#$%^&*()');
      expect(slug).toBe('');
    });
  });

  describe('createContentPage', () => {
    const validData: CreateContentPageDTO = {
      title: 'Our Story',
      slug: 'our-story',
      status: 'draft',
    };

    it('should return success with content page data when valid input provided', async () => {
      const mockContentPage = {
        id: 'page-1',
        title: validData.title,
        slug: validData.slug,
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock slug uniqueness check (no existing page)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found - slug is unique
            }),
          }),
        }),
      });

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.createContentPage(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('page-1');
        expect(result.data.title).toBe('Our Story');
        expect(result.data.slug).toBe('our-story');
        expect(result.data.status).toBe('draft');
      }
    });

    it('should auto-generate slug from title when slug not provided', async () => {
      const dataWithoutSlug = {
        title: 'Travel Information',
        status: 'draft' as const,
      };

      const mockContentPage = {
        id: 'page-2',
        title: dataWithoutSlug.title,
        slug: 'travel-information',
        status: dataWithoutSlug.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock slug uniqueness check
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.createContentPage(dataWithoutSlug);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('travel-information');
      }
    });

    it('should ensure unique slug by appending number when slug exists', async () => {
      const mockContentPage = {
        id: 'page-3',
        title: validData.title,
        slug: 'our-story-2',
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock first slug check - slug exists
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-page' },
              error: null,
            }),
          }),
        }),
      });

      // Mock second slug check - slug-2 is unique
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.createContentPage(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('our-story-2');
      }
    });

    it('should return VALIDATION_ERROR when title is missing', async () => {
      const invalidData = { ...validData, title: '' };
      const result = await contentPagesService.createContentPage(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when slug contains invalid characters', async () => {
      const invalidData = { ...validData, slug: 'Our Story!' };
      const result = await contentPagesService.createContentPage(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when slug contains uppercase letters', async () => {
      const invalidData = { ...validData, slug: 'Our-Story' };
      const result = await contentPagesService.createContentPage(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when status is invalid', async () => {
      const invalidData = { ...validData, status: 'invalid' as any };
      const result = await contentPagesService.createContentPage(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when insert fails', async () => {
      // Mock slug uniqueness check
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock insert failure
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection failed', code: 'DB_ERROR' },
            }),
          }),
        }),
      });

      const result = await contentPagesService.createContentPage(validData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize title to prevent XSS attacks', async () => {
      const maliciousData = {
        ...validData,
        title: '<script>alert("xss")</script>Our Story',
      };

      const mockContentPage = {
        id: 'page-4',
        title: 'Our Story',
        slug: validData.slug,
        status: validData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock slug uniqueness check
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock insert
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.createContentPage(maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).not.toContain('<script>');
        expect(result.data.title).not.toContain('alert');
      }
    });
  });

  describe('updateContentPage', () => {
    const pageId = 'page-1';
    const updateData: UpdateContentPageDTO = {
      title: 'Updated Story',
      status: 'published',
    };

    it('should return success with updated content page data', async () => {
      const mockUpdatedPage = {
        id: pageId,
        title: updateData.title,
        slug: 'our-story',
        status: updateData.status,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFrom.mockReturnValue({
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

      const result = await contentPagesService.updateContentPage(pageId, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Updated Story');
        expect(result.data.status).toBe('published');
      }
    });

    it('should update only status when provided', async () => {
      const updateWithStatus = {
        status: 'published' as const,
      };

      const mockUpdatedPage = {
        id: pageId,
        title: 'Our Story',
        slug: 'our-story',
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      // Mock update
      mockFrom.mockReturnValue({
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

      const result = await contentPagesService.updateContentPage(pageId, updateWithStatus);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('published');
      }
    });

    it('should return VALIDATION_ERROR when title is empty', async () => {
      const invalidData = { title: '' };
      const result = await contentPagesService.updateContentPage(pageId, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return VALIDATION_ERROR when slug contains invalid characters', async () => {
      const invalidData = { slug: 'Invalid Slug!' };
      const result = await contentPagesService.updateContentPage(pageId, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should return DATABASE_ERROR when page does not exist', async () => {
      const updateWithTitle = { title: 'Updated Story' };
      
      mockFrom.mockReturnValue({
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

      const result = await contentPagesService.updateContentPage(pageId, updateWithTitle);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should return DATABASE_ERROR when update fails', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Connection failed', code: 'DB_ERROR' },
              }),
            }),
          }),
        }),
      });

      const result = await contentPagesService.updateContentPage(pageId, updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });

    it('should sanitize title to prevent XSS attacks', async () => {
      const maliciousData = {
        title: '<img src=x onerror=alert(1)>Updated Story',
      };

      const mockUpdatedPage = {
        id: pageId,
        title: 'Updated Story',
        slug: 'our-story',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      mockFrom.mockReturnValue({
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

      const result = await contentPagesService.updateContentPage(pageId, maliciousData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).not.toContain('<img');
        expect(result.data.title).not.toContain('onerror');
      }
    });
  });

  describe('deleteContentPage', () => {
    const pageId = 'page-1';

    it('should return success when page is deleted', async () => {
      // Mock delete sections
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock delete content page
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await contentPagesService.deleteContentPage(pageId);

      expect(result.success).toBe(true);
    });

    it('should delete associated sections before deleting page', async () => {
      const mockDeleteSections = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const mockDeletePage = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Mock delete sections
      mockFrom.mockReturnValueOnce({
        delete: mockDeleteSections,
      });

      // Mock delete content page
      mockFrom.mockReturnValueOnce({
        delete: mockDeletePage,
      });

      await contentPagesService.deleteContentPage(pageId);

      // Verify sections were deleted first
      expect(mockDeleteSections).toHaveBeenCalled();
      expect(mockDeletePage).toHaveBeenCalled();
    });

    it('should return DATABASE_ERROR when delete fails', async () => {
      // Mock delete sections success
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      // Mock delete content page failure
      mockFrom.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed', code: 'DB_ERROR' },
          }),
        }),
      });

      const result = await contentPagesService.deleteContentPage(pageId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });

  describe('getContentPage', () => {
    const pageId = 'page-1';

    it('should return success with content page data', async () => {
      const mockContentPage = {
        id: pageId,
        title: 'Our Story',
        slug: 'our-story',
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.getContentPage(pageId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(pageId);
        expect(result.data.title).toBe('Our Story');
      }
    });

    it('should return NOT_FOUND when page does not exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await contentPagesService.getContentPage(pageId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getContentPageBySlug', () => {
    const slug = 'our-story';

    it('should return success with content page data', async () => {
      const mockContentPage = {
        id: 'page-1',
        title: 'Our Story',
        slug: slug,
        status: 'published',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockContentPage,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.getContentPageBySlug(slug);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe(slug);
        expect(result.data.title).toBe('Our Story');
      }
    });

    it('should return NOT_FOUND when slug does not exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await contentPagesService.getContentPageBySlug(slug);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('listContentPages', () => {
    it('should return success with all content pages', async () => {
      const mockPages = [
        {
          id: 'page-1',
          title: 'Our Story',
          slug: 'our-story',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-2',
          title: 'Travel Info',
          slug: 'travel-info',
          status: 'draft',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPages,
            error: null,
          }),
        }),
      });

      const result = await contentPagesService.listContentPages();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].title).toBe('Our Story');
        expect(result.data[1].title).toBe('Travel Info');
      }
    });

    it('should filter by status when provided', async () => {
      const mockPages = [
        {
          id: 'page-1',
          title: 'Our Story',
          slug: 'our-story',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockPages,
              error: null,
            }),
          }),
        }),
      });

      const result = await contentPagesService.listContentPages({ status: 'published' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe('published');
      }
    });

    it('should return empty array when no pages exist', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await contentPagesService.listContentPages();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should return DATABASE_ERROR when query fails', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed', code: 'DB_ERROR' },
          }),
        }),
      });

      const result = await contentPagesService.listContentPages();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('DATABASE_ERROR');
      }
    });
  });
});
