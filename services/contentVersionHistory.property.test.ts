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
import {
  createSection,
  createVersionSnapshot,
  getVersionHistory,
} from './sectionsService';

// Feature: destination-wedding-platform, Property 20: Content Version History

describe('Feature: destination-wedding-platform, Property 20: Content Version History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create version entry with timestamp for any content update', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
          pageId: fc.uuid(),
          userId: fc.option(fc.uuid(), { nil: null }),
          displayOrder: fc.integer({ min: 0, max: 100 }),
          sectionId: fc.uuid(),
          versionId: fc.uuid(),
        }),
        async (testData) => {
          const now = new Date().toISOString();
          
          // Mock listSections call (used by createVersionSnapshot)
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [{
                  id: testData.sectionId,
                  page_type: testData.pageType,
                  page_id: testData.pageId,
                  display_order: testData.displayOrder,
                  created_at: now,
                  updated_at: now,
                }],
                error: null,
              }),
            }),
          });

          // Mock columns fetch for listSections
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          });

          // Record the time before creating version
          const beforeTime = new Date();

          // Mock version snapshot creation
          mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.versionId,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    created_by: testData.userId,
                    sections_snapshot: [{
                      id: testData.sectionId,
                      page_type: testData.pageType,
                      page_id: testData.pageId,
                      display_order: testData.displayOrder,
                      created_at: now,
                      updated_at: now,
                      columns: [],
                    }],
                    created_at: now,
                  },
                  error: null,
                }),
              }),
            }),
          });

          // Create version snapshot
          const versionResult = await createVersionSnapshot(
            testData.pageType,
            testData.pageId,
            testData.userId
          );

          // Record the time after creating version
          const afterTime = new Date();

          // Property: Version creation should succeed
          expect(versionResult.success).toBe(true);
          
          if (!versionResult.success) {
            return true;
          }

          // Property: Version should have a timestamp
          expect(versionResult.data.created_at).toBeDefined();
          
          const versionTime = new Date(versionResult.data.created_at);
          
          // Property: Timestamp should be between before and after times (with tolerance)
          expect(versionTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 2000); // 2s tolerance
          expect(versionTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 2000); // 2s tolerance

          // Property: Version should preserve the page type and ID
          expect(versionResult.data.page_type).toBe(testData.pageType);
          expect(versionResult.data.page_id).toBe(testData.pageId);

          // Property: Version should preserve the user ID
          expect(versionResult.data.created_by).toBe(testData.userId);

          // Property: Version should contain sections snapshot
          expect(versionResult.data.sections_snapshot).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve previous version when creating new version', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pageType: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom'),
          pageId: fc.uuid(),
          userId: fc.option(fc.uuid(), { nil: null }),
          version1Id: fc.uuid(),
          version2Id: fc.uuid(),
          sectionId: fc.uuid(),
        }),
        async (testData) => {
          const now1 = new Date().toISOString();
          const now2 = new Date(Date.now() + 1000).toISOString();

          // Mock first version creation - listSections call
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [{
                  id: testData.sectionId,
                  page_type: testData.pageType,
                  page_id: testData.pageId,
                  display_order: 0,
                  created_at: now1,
                  updated_at: now1,
                }],
                error: null,
              }),
            }),
          });

          // Mock columns fetch for first listSections
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          });

          // Mock first version insert
          mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.version1Id,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    created_by: testData.userId,
                    sections_snapshot: [{
                      id: testData.sectionId,
                      page_type: testData.pageType,
                      page_id: testData.pageId,
                      display_order: 0,
                      created_at: now1,
                      updated_at: now1,
                      columns: [],
                    }],
                    created_at: now1,
                  },
                  error: null,
                }),
              }),
            }),
          });

          const version1Result = await createVersionSnapshot(
            testData.pageType,
            testData.pageId,
            testData.userId
          );

          // Mock second version creation - listSections call
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              order: jest.fn().mockResolvedValue({
                data: [{
                  id: testData.sectionId,
                  page_type: testData.pageType,
                  page_id: testData.pageId,
                  display_order: 0,
                  created_at: now2,
                  updated_at: now2,
                }],
                error: null,
              }),
            }),
          });

          // Mock columns fetch for second listSections
          mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          });

          // Mock second version insert
          mockFrom.mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: testData.version2Id,
                    page_type: testData.pageType,
                    page_id: testData.pageId,
                    created_by: testData.userId,
                    sections_snapshot: [{
                      id: testData.sectionId,
                      page_type: testData.pageType,
                      page_id: testData.pageId,
                      display_order: 0,
                      created_at: now2,
                      updated_at: now2,
                      columns: [],
                    }],
                    created_at: now2,
                  },
                  error: null,
                }),
              }),
            }),
          });

          const version2Result = await createVersionSnapshot(
            testData.pageType,
            testData.pageId,
            testData.userId
          );

          // Property: Both versions should be created successfully
          expect(version1Result.success).toBe(true);
          expect(version2Result.success).toBe(true);

          if (!version1Result.success || !version2Result.success) {
            return true;
          }

          // Property: Versions should have different IDs
          expect(version1Result.data.id).not.toBe(version2Result.data.id);

          // Property: Second version should have later or equal timestamp
          const time1 = new Date(version1Result.data.created_at).getTime();
          const time2 = new Date(version2Result.data.created_at).getTime();
          expect(time2).toBeGreaterThanOrEqual(time1);

          // Mock version history retrieval
          mockFrom.mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [version2Result.data, version1Result.data],
                  error: null,
                }),
              }),
            }),
          });

          const historyResult = await getVersionHistory(testData.pageId);

          if (!historyResult.success) {
            return true;
          }

          // Property: Both versions should exist in history
          const foundVersion1 = historyResult.data.find(v => v.id === version1Result.data.id);
          const foundVersion2 = historyResult.data.find(v => v.id === version2Result.data.id);

          expect(foundVersion1).toBeDefined();
          expect(foundVersion2).toBeDefined();

          // Property: Versions should be ordered by created_at (newest first)
          if (historyResult.data.length >= 2) {
            for (let i = 0; i < historyResult.data.length - 1; i++) {
              const current = new Date(historyResult.data[i].created_at);
              const next = new Date(historyResult.data[i + 1].created_at);
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
          }

          return true;
        }
      ),
      { numRuns: 50 } // Fewer runs due to async operations
    );
  });
});
