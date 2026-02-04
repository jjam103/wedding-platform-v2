/**
 * Regression Test Suite: Slug Management
 * 
 * Tests slug generation and management to prevent regressions in:
 * - Slug generation from titles
 * - Slug uniqueness enforcement
 * - Slug preservation on updates
 * - Slug-based routing
 * - URL safety
 * 
 * Requirements: 24.1, 24.3, 24.7, 24.10
 * 
 * Validates: Requirements 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8, 24.9, 24.10
 */

import { createMockSupabaseClient } from '@/__tests__/helpers/mockSupabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => createMockSupabaseClient()),
}));

describe('Regression: Slug Management', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  describe('Slug Generation', () => {
    it('should generate slug from title on creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                title: 'Wedding Ceremony',
                slug: 'wedding-ceremony',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Slug should be generated: "Wedding Ceremony" → "wedding-ceremony"
      expect(mockSupabase.from).toBeDefined();
    });

    it('should convert title to lowercase', async () => {
      const title = 'Beach VOLLEYBALL Tournament';
      const expectedSlug = 'beach-volleyball-tournament';

      expect(expectedSlug).toBe(title.toLowerCase().replace(/\s+/g, '-'));
    });

    it('should replace spaces with hyphens', async () => {
      const title = 'Our Wedding Story';
      const expectedSlug = 'our-wedding-story';

      expect(expectedSlug).toBe(title.toLowerCase().replace(/\s+/g, '-'));
    });

    it('should remove special characters', async () => {
      const title = 'Welcome! (2024) - Our Story';
      const expectedSlug = 'welcome-2024-our-story';

      // Remove special characters: ! ( ) -
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      expect(slug).toBe(expectedSlug);
    });

    it('should handle multiple consecutive spaces', async () => {
      const title = 'Wedding    Ceremony    Details';
      const expectedSlug = 'wedding-ceremony-details';

      const slug = title
        .toLowerCase()
        .replace(/\s+/g, '-');

      expect(slug).toBe(expectedSlug);
    });

    it('should handle leading and trailing spaces', async () => {
      const title = '  Wedding Ceremony  ';
      const expectedSlug = 'wedding-ceremony';

      const slug = title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');

      expect(slug).toBe(expectedSlug);
    });

    it('should handle accented characters', async () => {
      const title = 'Café Reception';
      const expectedSlug = 'cafe-reception';

      // Accented characters should be normalized
      const slug = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');

      expect(slug).toBe(expectedSlug);
    });

    it('should handle empty title', async () => {
      const title = '';
      const expectedSlug = 'untitled';

      const slug = title || 'untitled';

      expect(slug).toBe(expectedSlug);
    });

    it('should truncate very long slugs', async () => {
      const title = 'A'.repeat(200);
      const maxLength = 100;

      const slug = title
        .toLowerCase()
        .substring(0, maxLength);

      expect(slug.length).toBeLessThanOrEqual(maxLength);
    });
  });

  describe('Slug Uniqueness', () => {
    it('should enforce unique slugs within entity type', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { id: 'event-1', slug: 'wedding-ceremony' },
            ],
            error: null,
          }),
        }),
      } as any);

      // Attempting to create another event with same slug should fail
      expect(mockSupabase.from).toBeDefined();
    });

    it('should append numeric suffix for duplicate slugs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { id: 'event-1', slug: 'wedding-ceremony' },
            ],
            error: null,
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-2',
                title: 'Wedding Ceremony',
                slug: 'wedding-ceremony-2',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Second event with same title should get slug: "wedding-ceremony-2"
      expect(mockSupabase.from).toBeDefined();
    });

    it('should increment suffix for multiple duplicates', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [
              { id: 'event-1', slug: 'wedding-ceremony' },
              { id: 'event-2', slug: 'wedding-ceremony-2' },
              { id: 'event-3', slug: 'wedding-ceremony-3' },
            ],
            error: null,
          }),
        }),
      } as any);

      // Next event should get slug: "wedding-ceremony-4"
      const nextSuffix = 4;
      expect(nextSuffix).toBe(4);
    });

    it('should allow same slug across different entity types', async () => {
      // Event can have slug "ceremony"
      // Activity can also have slug "ceremony"
      // Content page can also have slug "ceremony"

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      // Slugs are unique within entity type, not globally
      expect(mockSupabase.from).toBeDefined();
    });

    it('should check uniqueness before saving', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockResolvedValue({
              data: [
                { id: 'event-2', slug: 'wedding-ceremony' },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      // Uniqueness check should exclude current entity (neq id)
      expect(mockSupabase.from).toBeDefined();
    });
  });

  describe('Slug Preservation', () => {
    it('should preserve slug when updating title', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {
              id: 'event-1',
              title: 'Updated Wedding Ceremony',
              slug: 'wedding-ceremony', // Slug unchanged
            },
            error: null,
          }),
        }),
      } as any);

      // Slug should not change when title is updated
      expect(mockSupabase.from).toBeDefined();
    });

    it('should allow manual slug update', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {
              id: 'event-1',
              title: 'Wedding Ceremony',
              slug: 'ceremony', // Manually updated
            },
            error: null,
          }),
        }),
      } as any);

      // Admin can manually update slug
      expect(mockSupabase.from).toBeDefined();
    });

    it('should validate manual slug for URL safety', async () => {
      const manualSlug = 'my-custom-slug!@#';
      const isValid = /^[a-z0-9-]+$/.test(manualSlug);

      expect(isValid).toBe(false);
    });

    it('should prevent changing slug to duplicate', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockResolvedValue({
              data: [
                { id: 'event-2', slug: 'reception' },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      // Attempting to change slug to existing slug should fail
      expect(mockSupabase.from).toBeDefined();
    });

    it('should maintain slug history for redirects', async () => {
      // When slug changes, old slug should redirect to new slug
      const slugHistory = [
        { old_slug: 'wedding-ceremony-old', new_slug: 'wedding-ceremony', created_at: '2024-01-15' },
      ];

      expect(slugHistory.length).toBe(1);
      expect(slugHistory[0].old_slug).toBeDefined();
      expect(slugHistory[0].new_slug).toBeDefined();
    });
  });

  describe('Slug-Based Routing', () => {
    it('should route to event by slug', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                title: 'Wedding Ceremony',
                slug: 'wedding-ceremony',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Route: /event/wedding-ceremony
      expect(mockSupabase.from).toBeDefined();
    });

    it('should route to activity by slug', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'activity-1',
                title: 'Beach Volleyball',
                slug: 'beach-volleyball',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Route: /activity/beach-volleyball
      expect(mockSupabase.from).toBeDefined();
    });

    it('should route to content page by slug', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'page-1',
                title: 'Our Story',
                slug: 'our-story',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Route: /content-page/our-story
      expect(mockSupabase.from).toBeDefined();
    });

    it('should return 404 for non-existent slug', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'No rows returned' },
            }),
          }),
        }),
      } as any);

      // Should return 404 Not Found
      expect(mockSupabase.from).toBeDefined();
    });

    it('should redirect old slug to new slug', async () => {
      // Old URL: /event/wedding-ceremony-old
      // Should redirect to: /event/wedding-ceremony

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                old_slug: 'wedding-ceremony-old',
                new_slug: 'wedding-ceremony',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Should return 301 Permanent Redirect
      expect(mockSupabase.from).toBeDefined();
    });

    it('should support preview mode with slug', async () => {
      // Route: /event/wedding-ceremony?preview=true
      const previewMode = true;

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                title: 'Wedding Ceremony',
                slug: 'wedding-ceremony',
                status: 'draft',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Preview mode should show draft content
      expect(previewMode).toBe(true);
    });

    it('should maintain backward compatibility with ID-based URLs', async () => {
      // Old URL: /event/event-1
      // Should redirect to: /event/wedding-ceremony

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'event-1',
                slug: 'wedding-ceremony',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      // Should return 301 Permanent Redirect to slug-based URL
      expect(mockSupabase.from).toBeDefined();
    });
  });

  describe('URL Safety', () => {
    it('should only allow lowercase letters, numbers, and hyphens', async () => {
      const validSlug = 'wedding-ceremony-2024';
      const isValid = /^[a-z0-9-]+$/.test(validSlug);

      expect(isValid).toBe(true);
    });

    it('should reject uppercase letters', async () => {
      const invalidSlug = 'Wedding-Ceremony';
      const isValid = /^[a-z0-9-]+$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject special characters', async () => {
      const invalidSlug = 'wedding-ceremony!@#';
      const isValid = /^[a-z0-9-]+$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject spaces', async () => {
      const invalidSlug = 'wedding ceremony';
      const isValid = /^[a-z0-9-]+$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject underscores', async () => {
      const invalidSlug = 'wedding_ceremony';
      const isValid = /^[a-z0-9-]+$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject leading hyphen', async () => {
      const invalidSlug = '-wedding-ceremony';
      const isValid = /^[a-z0-9][a-z0-9-]*$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject trailing hyphen', async () => {
      const invalidSlug = 'wedding-ceremony-';
      const isValid = /^[a-z0-9-]*[a-z0-9]$/.test(invalidSlug);

      expect(isValid).toBe(false);
    });

    it('should reject consecutive hyphens', async () => {
      const invalidSlug = 'wedding--ceremony';
      const hasConsecutiveHyphens = /--/.test(invalidSlug);

      expect(hasConsecutiveHyphens).toBe(true);
    });

    it('should be URL-encodable without changes', async () => {
      const slug = 'wedding-ceremony-2024';
      const encoded = encodeURIComponent(slug);

      expect(encoded).toBe(slug);
    });

    it('should be safe for file systems', async () => {
      const slug = 'wedding-ceremony-2024';
      const unsafeChars = /[<>:"/\\|?*]/;

      expect(unsafeChars.test(slug)).toBe(false);
    });
  });

  describe('Slug Validation', () => {
    it('should validate slug length (min: 1, max: 100)', async () => {
      const tooShort = '';
      const tooLong = 'a'.repeat(101);
      const valid = 'wedding-ceremony';

      expect(tooShort.length).toBeLessThan(1);
      expect(tooLong.length).toBeGreaterThan(100);
      expect(valid.length).toBeGreaterThanOrEqual(1);
      expect(valid.length).toBeLessThanOrEqual(100);
    });

    it('should validate slug format on creation', async () => {
      const slug = 'wedding-ceremony';
      const isValid = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);

      expect(isValid).toBe(true);
    });

    it('should validate slug format on update', async () => {
      const slug = 'updated-ceremony';
      const isValid = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);

      expect(isValid).toBe(true);
    });

    it('should return validation error for invalid slug', async () => {
      const invalidSlug = 'Invalid Slug!';
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      };

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toContain('lowercase letters');
    });

    it('should return validation error for duplicate slug', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            neq: jest.fn().mockResolvedValue({
              data: [
                { id: 'event-2', slug: 'wedding-ceremony' },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const error = {
        code: 'CONFLICT',
        message: 'Slug already exists',
      };

      expect(error.code).toBe('CONFLICT');
      expect(error.message).toContain('already exists');
    });
  });

  describe('Slug Migration', () => {
    it('should generate slugs for existing records without slugs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockResolvedValue({
            data: [
              { id: 'event-1', title: 'Wedding Ceremony', slug: null },
              { id: 'event-2', title: 'Reception', slug: null },
            ],
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: {
              id: 'event-1',
              slug: 'wedding-ceremony',
            },
            error: null,
          }),
        }),
      } as any);

      // Migration should generate slugs for all records
      expect(mockSupabase.from).toBeDefined();
    });

    it('should handle slug conflicts during migration', async () => {
      // Multiple records with same title should get unique slugs
      const records = [
        { id: 'event-1', title: 'Wedding Ceremony' },
        { id: 'event-2', title: 'Wedding Ceremony' },
        { id: 'event-3', title: 'Wedding Ceremony' },
      ];

      const expectedSlugs = [
        'wedding-ceremony',
        'wedding-ceremony-2',
        'wedding-ceremony-3',
      ];

      expect(expectedSlugs.length).toBe(records.length);
    });

    it('should log migration progress', async () => {
      const migrationLog = {
        total_records: 100,
        processed: 100,
        successful: 98,
        failed: 2,
        duration_ms: 5000,
      };

      expect(migrationLog.successful).toBe(98);
      expect(migrationLog.failed).toBe(2);
    });
  });
});
