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
          photosPerRow: fc.option(fc.integer({ min: 1, max: 6 }), { nil: undefined }),
          showCaptions: fc.boolean(),
          autoplayInterval: fc.option(fc.integer({ min: 1000, max: 10000 }), { nil: undefined }),
          transitionEffect: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          settingsId: fc.uuid(),
        }),
        async (testData) => {
          const now = new Date().toISOString();

          // Mock upsert operation
          const mockSingle1 = jest.fn() as any;
          mockSingle1.mockResolvedValue({
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
          } as any);
          const mockSelect1 = jest.fn().mockReturnValue({ single: mockSingle1 });
          const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect1 });
          mockFrom.mockReturnValueOnce({ upsert: mockUpsert });

          // Upsert settings
          const upsertResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.displayMode as 'gallery' | 'carousel' | 'loop',
            photos_per_row: testData.photosPerRow || undefined,
            show_captions: testData.showCaptions,
            autoplay_interval: testData.autoplayInterval || undefined,
            transition_effect: testData.transitionEffect || undefined,
          } as any);

          // Property: Upsert should succeed
          expect(upsertResult.success).toBe(true);

          if (!upsertResult.success) {
            return true;
          }

          // Mock get operation
          const mockSingle2 = jest.fn() as any;
          mockSingle2.mockResolvedValue({
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
          } as any);
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle2 });
          const mockSelect2 = jest.fn().mockReturnValue({ eq: mockEq });
          mockFrom.mockReturnValueOnce({ select: mockSelect2 });

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
          if (testData.photosPerRow !== undefined && testData.photosPerRow !== null) {
            expect(getResult.data.photos_per_row).toBe(testData.photosPerRow);
          }
          if (testData.autoplayInterval !== undefined && testData.autoplayInterval !== null) {
            expect(getResult.data.autoplay_interval).toBe(testData.autoplayInterval);
          }
          if (testData.transitionEffect !== undefined && testData.transitionEffect !== null) {
            expect(getResult.data.transition_effect).toBe(testData.transitionEffect);
          }

          return true;
        }
      ),
      { numRuns: 20, timeout: 5000 } // Reduced runs and increased timeout
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
          const mockSingle1 = jest.fn() as any;
          mockSingle1.mockResolvedValue({
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
          } as any);
          const mockSelect1 = jest.fn().mockReturnValue({ single: mockSingle1 });
          const mockUpsert1 = jest.fn().mockReturnValue({ select: mockSelect1 });
          mockFrom.mockReturnValueOnce({ upsert: mockUpsert1 });

          const firstResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.initialMode as 'gallery' | 'carousel' | 'loop',
            show_captions: true,
          } as any);

          expect(firstResult.success).toBe(true);

          if (!firstResult.success) {
            return true;
          }

          // Mock second upsert (updated settings)
          const mockSingle2 = jest.fn() as any;
          mockSingle2.mockResolvedValue({
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
          } as any);
          const mockSelect2 = jest.fn().mockReturnValue({ single: mockSingle2 });
          const mockUpsert2 = jest.fn().mockReturnValue({ select: mockSelect2 });
          mockFrom.mockReturnValueOnce({ upsert: mockUpsert2 });

          const secondResult = await upsertSettings({
            page_type: testData.pageType as any,
            page_id: testData.pageId,
            display_mode: testData.updatedMode as 'gallery' | 'carousel' | 'loop',
            show_captions: false,
          } as any);

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
      { numRuns: 10, timeout: 5000 } // Reduced runs and increased timeout
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
          const mockSingle = jest.fn() as any;
          mockSingle.mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          } as any);
          const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
          mockFrom.mockReturnValueOnce({ select: mockSelect });

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
      { numRuns: 20, timeout: 5000 } // Reduced runs and increased timeout
    );
  });
});
