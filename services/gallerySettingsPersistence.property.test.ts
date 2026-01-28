import * as fc from 'fast-check';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
const mockFrom = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import { upsertSettings, getSettings } from './gallerySettingsService';

// Feature: destination-wedding-platform, Property 35: Gallery Settings Persistence

describe('Feature: destination-wedding-platform, Property 35: Gallery Settings Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should persist gallery settings and retrieve updated values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'memory'),
          pageId: fc.uuid(),
          displayMode: fc.constantFrom('gallery', 'carousel', 'loop'),
          photosPerRow: fc.option(fc.integer({ min: 1, max: 6 })),
          showCaptions: fc.boolean(),
          autoplayInterval: fc.option(fc.integer({ min: 1000, max: 10000 })),
          transitionEffect: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          settingsId: fc.uuid(),
        }),
        async (testData) => {
          const now = new Date().toISOString();

          // Mock upsert operation
          mockFrom.mockReturnValueOnce({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.settingsId,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    display_mode: testData.displayMode,
                    photos_per_row: testData.photosPerRow || null,
                    show_captions: testData.showCaptions,
                    autoplay_interval: testData.autoplayInterval || null,
                    transition_effect: testData.transitionEffect || null,
                    created_at: now,
                    updated_at: now,
                  },
                  error: null,
                }),
              }),
            }),
          });

          // Upsert settings
          const upsertResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.displayMode,
            photos_per_row: testData.photosPerRow || undefined,
            show_captions: testData.showCaptions,
            autoplay_interval: testData.autoplayInterval || undefined,
            transition_effect: testData.transitionEffect || undefined,
          });

          // Property: Upsert should succeed
          expect(upsertResult.success).toBe(true);

          if (!upsertResult.success) {
            return true;
          }

          // Mock get operation
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testData.settingsId,
                  page_type: testData.pageType,
                  page_id: testData.pageId,
                  display_mode: testData.displayMode,
                  photos_per_row: testData.photosPerRow || null,
                  show_captions: testData.showCaptions,
                  autoplay_interval: testData.autoplayInterval || null,
                  transition_effect: testData.transitionEffect || null,
                  created_at: now,
                  updated_at: now,
                },
                error: null,
              }),
            }),
          });

          // Retrieve settings
          const getResult = await getSettings(testData.pageType, testData.pageId);

          // Property: Get should succeed
          expect(getResult.success).toBe(true);

          if (!getResult.success) {
            return true;
          }

          // Property: Retrieved settings should match upserted settings
          expect(getResult.data.page_type).toBe(testData.pageType);
          expect(getResult.data.page_id).toBe(testData.pageId);
          expect(getResult.data.display_mode).toBe(testData.displayMode);
          expect(getResult.data.show_captions).toBe(testData.showCaptions);

          // Property: Optional fields should match if provided
          if (testData.photosPerRow !== null) {
            expect(getResult.data.photos_per_row).toBe(testData.photosPerRow);
          }
          if (testData.autoplayInterval !== null) {
            expect(getResult.data.autoplay_interval).toBe(testData.autoplayInterval);
          }
          if (testData.transitionEffect !== null) {
            expect(getResult.data.transition_effect).toBe(testData.transitionEffect);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update existing settings when upserting with same page', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'memory'),
          pageId: fc.uuid(),
          initialMode: fc.constantFrom('gallery', 'carousel', 'loop'),
          updatedMode: fc.constantFrom('gallery', 'carousel', 'loop'),
          settingsId: fc.uuid(),
        }),
        async (testData) => {
          const now = new Date().toISOString();

          // Mock first upsert (initial settings)
          mockFrom.mockReturnValueOnce({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.settingsId,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    display_mode: testData.initialMode,
                    show_captions: true,
                    created_at: now,
                    updated_at: now,
                  },
                  error: null,
                }),
              }),
            }),
          });

          const firstResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.initialMode,
            show_captions: true,
          });

          expect(firstResult.success).toBe(true);

          if (!firstResult.success) {
            return true;
          }

          // Mock second upsert (updated settings)
          mockFrom.mockReturnValueOnce({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.settingsId,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    display_mode: testData.updatedMode,
                    show_captions: false,
                    created_at: now,
                    updated_at: new Date(Date.now() + 1000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          });

          const secondResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.updatedMode,
            show_captions: false,
          });

          // Property: Second upsert should succeed
          expect(secondResult.success).toBe(true);

          if (!secondResult.success) {
            return true;
          }

          // Property: Settings should reflect the updated values
          expect(secondResult.data.display_mode).toBe(testData.updatedMode);
          expect(secondResult.data.show_captions).toBe(false);

          // Property: Should have same ID (updated, not created new)
          expect(secondResult.data.id).toBe(testData.settingsId);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return default settings when none exist for a page', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'memory'),
          pageId: fc.uuid(),
        }),
        async (testData) => {
          // Mock get operation returning no data (settings don't exist)
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          });

          const result = await getSettings(testData.pageType, testData.pageId);

          // Property: Get should succeed even when settings don't exist
          expect(result.success).toBe(true);

          if (!result.success) {
            return true;
          }

          // Property: Should return default settings
          expect(result.data.page_type).toBe(testData.pageType);
          expect(result.data.page_id).toBe(testData.pageId);
          expect(result.data.display_mode).toBe('gallery'); // Default
          expect(result.data.show_captions).toBe(true); // Default

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
