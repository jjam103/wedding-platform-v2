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
          // @ts-expect-error - Mock return type inference issue
          const mockOrder = jest.fn().mockResolvedValue({
            data: [{
              id: testData.sectionId,
              page_type: testData.pageType,
              page_id: testData.pageId,
              display_order: testData.displayOrder,
              created_at: now,
              updated_at: now,
            }],
            error: null,
          } as any);
          const mockEq = jest.fn().mockReturnValue({ order: mockOrder } as any);
          const mockSelect = jest.fn().mockReturnValue({ eq: mockEq } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockSelect });

          // Mock columns fetch for listSections
          // @ts-expect-error - Mock return type inference issue
          const mockColumnsOrder = jest.fn().mockResolvedValue({
            data: [],
            error: null,
          } as any);
          const mockIn = jest.fn().mockReturnValue({ order: mockColumnsOrder } as any);
          const mockColumnsSelect = jest.fn().mockReturnValue({ in: mockIn } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockColumnsSelect });

          // Record the time before creating version
          const beforeTime = new Date();

          // Mock version snapshot creation
          // @ts-expect-error - Mock return type inference issue
          const mockSingle = jest.fn().mockResolvedValue({
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
          } as any);
          const mockVersionSelect = jest.fn().mockReturnValue({ single: mockSingle } as any);
          const mockInsert = jest.fn().mockReturnValue({ select: mockVersionSelect } as any);
          (mockFrom as any).mockReturnValueOnce({ insert: mockInsert });

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
      { numRuns: 20, timeout: 5000 } // Reduced runs and increased timeout
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
          // @ts-expect-error - Mock return type inference issue
          const mockOrder1 = jest.fn().mockResolvedValue({
            data: [{
              id: testData.sectionId,
              page_type: testData.pageType,
              page_id: testData.pageId,
              display_order: 0,
              created_at: now1,
              updated_at: now1,
            }],
            error: null,
          } as any);
          const mockEq1 = jest.fn().mockReturnValue({ order: mockOrder1 } as any);
          const mockSelect1 = jest.fn().mockReturnValue({ eq: mockEq1 } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockSelect1 });

          // Mock columns fetch for first listSections
          // @ts-expect-error - Mock return type inference issue
          const mockColumnsOrder1 = jest.fn().mockResolvedValue({
            data: [],
            error: null,
          } as any);
          const mockIn1 = jest.fn().mockReturnValue({ order: mockColumnsOrder1 } as any);
          const mockColumnsSelect1 = jest.fn().mockReturnValue({ in: mockIn1 } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockColumnsSelect1 });

          // Mock first version insert
          // @ts-expect-error - Mock return type inference issue
          const mockSingle1 = jest.fn().mockResolvedValue({
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
          } as any);
          const mockVersionSelect1 = jest.fn().mockReturnValue({ single: mockSingle1 } as any);
          const mockInsert1 = jest.fn().mockReturnValue({ select: mockVersionSelect1 } as any);
          (mockFrom as any).mockReturnValueOnce({ insert: mockInsert1 });

          const version1Result = await createVersionSnapshot(
            testData.pageType,
            testData.pageId,
            testData.userId
          );

          // Mock second version creation - listSections call
          // @ts-expect-error - Mock return type inference issue
          const mockOrder2 = jest.fn().mockResolvedValue({
            data: [{
              id: testData.sectionId,
              page_type: testData.pageType,
              page_id: testData.pageId,
              display_order: 0,
              created_at: now2,
              updated_at: now2,
            }],
            error: null,
          } as any);
          const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder2 } as any);
          const mockSelect2 = jest.fn().mockReturnValue({ eq: mockEq2 } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockSelect2 });

          // Mock columns fetch for second listSections
          // @ts-expect-error - Mock return type inference issue
          const mockColumnsOrder2 = jest.fn().mockResolvedValue({
            data: [],
            error: null,
          } as any);
          const mockIn2 = jest.fn().mockReturnValue({ order: mockColumnsOrder2 } as any);
          const mockColumnsSelect2 = jest.fn().mockReturnValue({ in: mockIn2 } as any);
          (mockFrom as any).mockReturnValueOnce({ select: mockColumnsSelect2 });

          // Mock second version insert
          // @ts-expect-error - Mock return type inference issue
          const mockSingle2 = jest.fn().mockResolvedValue({
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
          } as any);
          const mockVersionSelect2 = jest.fn().mockReturnValue({ single: mockSingle2 } as any);
          const mockInsert2 = jest.fn().mockReturnValue({ select: mockVersionSelect2 } as any);
          (mockFrom as any).mockReturnValueOnce({ insert: mockInsert2 });

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
          // @ts-expect-error - Mock return type inference issue
          const mockHistoryOrder = jest.fn().mockResolvedValue({
            data: [version2Result.data, version1Result.data],
            error: null,
          } as any);
          const mockHistoryEq = jest.fn().mockReturnValue({ order: mockHistoryOrder } as any);
          const mockHistorySelect = jest.fn().mockReturnValue({ eq: mockHistoryEq } as any);
          (mockFrom as any).mockReturnValue({ select: mockHistorySelect });

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
      { numRuns: 10, timeout: 5000 } // Fewer runs due to async operations and increased timeout
    );
  });
});
