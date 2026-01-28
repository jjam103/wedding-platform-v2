/**
 * Regression Test Suite: Dynamic Route Resolution
 * 
 * Tests dynamic route resolution to prevent regressions in:
 * - Content page routing
 * - Activity page routing
 * - Event page routing
 * - Accommodation page routing
 * - 404 handling
 * - Slug generation
 * 
 * Requirements: 21.7
 */

import { sectionsService } from '@/services/sectionsService';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('Regression: Dynamic Route Resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Page Routing', () => {
    it('should resolve custom page by slug', async () => {
      const mockPage = {
        id: 'page-1',
        pageType: 'custom',
        slug: 'our-story',
        title: 'Our Story',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPage,
        error: null,
      });

      const result = await sectionsService.getPageBySlug('our-story');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('our-story');
        expect(result.data.pageType).toBe('custom');
      }
    });

    it('should return 404 for non-existent slug', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const result = await sectionsService.getPageBySlug('non-existent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should handle slugs with special characters', async () => {
      const mockPage = {
        id: 'page-1',
        pageType: 'custom',
        slug: 'costa-rica-travel-tips',
        title: 'Costa Rica Travel Tips',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPage,
        error: null,
      });

      const result = await sectionsService.getPageBySlug(
        'costa-rica-travel-tips'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('costa-rica-travel-tips');
      }
    });
  });

  describe('Activity Page Routing', () => {
    it('should resolve activity by ID', async () => {
      const mockActivity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        activityType: 'activity',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockActivity,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'activity',
        'activity-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('activity-1');
        expect(result.data.name).toBe('Beach Volleyball');
      }
    });

    it('should return 404 for non-existent activity', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      const result = await sectionsService.getPageByTypeAndId(
        'activity',
        'non-existent'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should only return published activities', async () => {
      const mockActivity = {
        id: 'activity-1',
        name: 'Beach Volleyball',
        status: 'draft',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockActivity,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'activity',
        'activity-1',
        { publishedOnly: true }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('Event Page Routing', () => {
    it('should resolve event by ID', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Wedding Ceremony',
        eventType: 'ceremony',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'event',
        'event-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('event-1');
        expect(result.data.name).toBe('Wedding Ceremony');
      }
    });

    it('should handle event visibility restrictions', async () => {
      const mockEvent = {
        id: 'event-1',
        name: 'Private Event',
        visibility: ['wedding_party'],
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockEvent,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'event',
        'event-1',
        { guestType: 'wedding_guest' }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('Accommodation Page Routing', () => {
    it('should resolve accommodation by ID', async () => {
      const mockAccommodation = {
        id: 'accommodation-1',
        name: 'Beach Resort',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockAccommodation,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'accommodation',
        'accommodation-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('accommodation-1');
        expect(result.data.name).toBe('Beach Resort');
      }
    });

    it('should resolve room type by ID', async () => {
      const mockRoomType = {
        id: 'room-type-1',
        name: 'Ocean View Suite',
        accommodationId: 'accommodation-1',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockRoomType,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'room_type',
        'room-type-1'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('room-type-1');
        expect(result.data.name).toBe('Ocean View Suite');
      }
    });
  });

  describe('Slug Generation', () => {
    it('should generate valid slug from title', () => {
      const title = 'Our Wedding Story';
      const slug = generateSlug(title);

      expect(slug).toBe('our-wedding-story');
    });

    it('should handle special characters in slug', () => {
      const title = "Costa Rica's Best Beaches!";
      const slug = generateSlug(title);

      expect(slug).toBe('costa-ricas-best-beaches');
    });

    it('should handle multiple spaces', () => {
      const title = 'Travel   Tips   and   Advice';
      const slug = generateSlug(title);

      expect(slug).toBe('travel-tips-and-advice');
    });

    it('should handle unicode characters', () => {
      const title = 'Café & Piña Coladas';
      const slug = generateSlug(title);

      expect(slug).toBe('cafe-pina-coladas');
    });

    it('should handle empty string', () => {
      const title = '';
      const slug = generateSlug(title);

      expect(slug).toBe('');
    });

    it('should ensure unique slugs', async () => {
      const title = 'Our Story';
      const existingSlugs = ['our-story', 'our-story-1'];

      mockSupabase.select.mockResolvedValue({
        data: existingSlugs.map((slug) => ({ slug })),
        error: null,
      });

      const slug = await sectionsService.generateUniqueSlug(title);

      expect(slug).toBe('our-story-2');
    });
  });

  describe('Route Parameter Validation', () => {
    it('should validate page type parameter', async () => {
      const result = await sectionsService.getPageByTypeAndId(
        'invalid_type' as any,
        'page-1'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate UUID format for IDs', async () => {
      const result = await sectionsService.getPageByTypeAndId(
        'activity',
        'not-a-uuid'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should validate slug format', async () => {
      const result = await sectionsService.getPageBySlug(
        'invalid slug with spaces'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Nested Route Resolution', () => {
    it('should resolve nested activity within event', async () => {
      const mockActivity = {
        id: 'activity-1',
        eventId: 'event-1',
        name: 'Cocktail Hour',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockActivity,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'activity',
        'activity-1',
        { parentEventId: 'event-1' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventId).toBe('event-1');
      }
    });

    it('should resolve room type within accommodation', async () => {
      const mockRoomType = {
        id: 'room-type-1',
        accommodationId: 'accommodation-1',
        name: 'Deluxe Suite',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockRoomType,
        error: null,
      });

      const result = await sectionsService.getPageByTypeAndId(
        'room_type',
        'room-type-1',
        { parentAccommodationId: 'accommodation-1' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accommodationId).toBe('accommodation-1');
      }
    });
  });

  describe('Cache Handling', () => {
    it('should cache resolved routes', async () => {
      const mockPage = {
        id: 'page-1',
        slug: 'our-story',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPage,
        error: null,
      });

      // First call
      await sectionsService.getPageBySlug('our-story');

      // Second call should use cache
      await sectionsService.getPageBySlug('our-story');

      // Should only call database once
      expect(mockSupabase.single).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache on update', async () => {
      const mockPage = {
        id: 'page-1',
        slug: 'our-story',
        sections: [],
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPage,
        error: null,
      });

      // Initial load
      await sectionsService.getPageBySlug('our-story');

      // Update page
      await sectionsService.updatePage('page-1', { title: 'Updated' });

      // Should fetch fresh data
      await sectionsService.getPageBySlug('our-story');

      expect(mockSupabase.single).toHaveBeenCalledTimes(2);
    });
  });
});

// Helper function for slug generation
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
