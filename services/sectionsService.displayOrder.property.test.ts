import * as fc from 'fast-check';
import * as sectionsService from './sectionsService';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../lib/supabase');

describe('Feature: admin-backend-integration-cms, Property 4: Section Display Order', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sections sorted by display_order in ascending order for any set of sections', async () => {
    // Custom arbitrary for generating sections with random display orders
    const sectionArbitrary = fc.record({
      id: fc.uuid(),
      page_type: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'home'),
      page_id: fc.uuid(),
      display_order: fc.integer({ min: 0, max: 100 }),
      created_at: fc.date().map(d => d.toISOString()),
      updated_at: fc.date().map(d => d.toISOString()),
    });

    const columnArbitrary = fc.record({
      id: fc.uuid(),
      section_id: fc.uuid(),
      column_number: fc.constantFrom(1, 2),
      content_type: fc.constantFrom('rich_text', 'photos', 'references'),
      content_data: fc.record({
        html: fc.string(),
      }),
      created_at: fc.date().map(d => d.toISOString()),
      updated_at: fc.date().map(d => d.toISOString()),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(sectionArbitrary, { minLength: 1, maxLength: 20 }),
        fc.array(columnArbitrary, { minLength: 0, maxLength: 40 }),
        async (sections, columns) => {
          // Ensure all sections have the same page_type and page_id for the test
          const pageType = sections[0].page_type;
          const pageId = sections[0].page_id;
          const normalizedSections = sections.map(s => ({
            ...s,
            page_type: pageType,
            page_id: pageId,
          }));

          // Assign columns to sections
          const columnsWithSectionIds = columns.map((col, idx) => ({
            ...col,
            section_id: normalizedSections[idx % normalizedSections.length].id,
          }));

          // Mock the database response - sections should be returned sorted by display_order
          const sortedSections = [...normalizedSections].sort(
            (a, b) => a.display_order - b.display_order
          );

          // Mock Supabase query chain for sections
          const mockSectionsSelect = jest.fn().mockReturnThis();
          const mockSectionsEq1 = jest.fn().mockReturnThis();
          const mockSectionsEq2 = jest.fn().mockReturnThis();
          const mockSectionsOrder = jest.fn().mockResolvedValue({
            data: sortedSections,
            error: null,
          });

          // Mock Supabase query chain for columns
          const mockColumnsSelect = jest.fn().mockReturnThis();
          const mockColumnsIn = jest.fn().mockReturnThis();
          const mockColumnsOrder = jest.fn().mockResolvedValue({
            data: columnsWithSectionIds,
            error: null,
          });

          supabase.from.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                select: mockSectionsSelect,
                eq: mockSectionsEq1,
              };
            } else if (table === 'columns') {
              return {
                select: mockColumnsSelect,
                in: mockColumnsIn,
              };
            }
            return {};
          });

          // Chain the mocks properly
          mockSectionsSelect.mockReturnValue({
            eq: mockSectionsEq1,
          });
          mockSectionsEq1.mockReturnValue({
            eq: mockSectionsEq2,
          });
          mockSectionsEq2.mockReturnValue({
            order: mockSectionsOrder,
          });

          mockColumnsSelect.mockReturnValue({
            in: mockColumnsIn,
          });
          mockColumnsIn.mockReturnValue({
            order: mockColumnsOrder,
          });

          // Call the service
          const result = await sectionsService.listSections(pageType, pageId);

          // Verify the result
          expect(result.success).toBe(true);
          if (!result.success) return false;

          // Property: Sections MUST be sorted by display_order in ascending order
          const returnedSections = result.data;
          
          // Check that sections are in ascending order by display_order
          for (let i = 0; i < returnedSections.length - 1; i++) {
            if (returnedSections[i].display_order > returnedSections[i + 1].display_order) {
              return false; // Property violated
            }
          }

          // Verify that the order matches the expected sorted order
          const expectedOrder = returnedSections
            .map(s => s.display_order)
            .sort((a, b) => a - b);
          const actualOrder = returnedSections.map(s => s.display_order);

          return JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain display_order sorting even with duplicate display_order values', async () => {
    // Test edge case: sections with duplicate display_order values
    const sectionWithDuplicateOrderArbitrary = fc.record({
      id: fc.uuid(),
      page_type: fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'home'),
      page_id: fc.uuid(),
      display_order: fc.integer({ min: 0, max: 5 }), // Small range to force duplicates
      created_at: fc.date().map(d => d.toISOString()),
      updated_at: fc.date().map(d => d.toISOString()),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(sectionWithDuplicateOrderArbitrary, { minLength: 2, maxLength: 10 }),
        async (sections) => {
          const pageType = sections[0].page_type;
          const pageId = sections[0].page_id;
          const normalizedSections = sections.map(s => ({
            ...s,
            page_type: pageType,
            page_id: pageId,
          }));

          // Sort sections by display_order (stable sort)
          const sortedSections = [...normalizedSections].sort(
            (a, b) => a.display_order - b.display_order
          );

          // Mock Supabase
          const mockSectionsSelect = jest.fn().mockReturnThis();
          const mockSectionsEq1 = jest.fn().mockReturnThis();
          const mockSectionsEq2 = jest.fn().mockReturnThis();
          const mockSectionsOrder = jest.fn().mockResolvedValue({
            data: sortedSections,
            error: null,
          });

          const mockColumnsSelect = jest.fn().mockReturnThis();
          const mockColumnsIn = jest.fn().mockReturnThis();
          const mockColumnsOrder = jest.fn().mockResolvedValue({
            data: [],
            error: null,
          });

          supabase.from.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                select: mockSectionsSelect,
                eq: mockSectionsEq1,
              };
            } else if (table === 'columns') {
              return {
                select: mockColumnsSelect,
                in: mockColumnsIn,
              };
            }
            return {};
          });

          mockSectionsSelect.mockReturnValue({
            eq: mockSectionsEq1,
          });
          mockSectionsEq1.mockReturnValue({
            eq: mockSectionsEq2,
          });
          mockSectionsEq2.mockReturnValue({
            order: mockSectionsOrder,
          });

          mockColumnsSelect.mockReturnValue({
            in: mockColumnsIn,
          });
          mockColumnsIn.mockReturnValue({
            order: mockColumnsOrder,
          });

          // Call the service
          const result = await sectionsService.listSections(pageType, pageId);

          expect(result.success).toBe(true);
          if (!result.success) return false;

          // Property: Even with duplicates, sections must be in non-decreasing order
          const returnedSections = result.data;
          for (let i = 0; i < returnedSections.length - 1; i++) {
            if (returnedSections[i].display_order > returnedSections[i + 1].display_order) {
              return false; // Property violated
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array in sorted order when no sections exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('activity', 'event', 'accommodation', 'room_type', 'custom', 'home'),
        fc.uuid(),
        async (pageType, pageId) => {
          // Mock empty result
          const mockSectionsSelect = jest.fn().mockReturnThis();
          const mockSectionsEq1 = jest.fn().mockReturnThis();
          const mockSectionsEq2 = jest.fn().mockReturnThis();
          const mockSectionsOrder = jest.fn().mockResolvedValue({
            data: [],
            error: null,
          });

          supabase.from.mockImplementation((table: string) => {
            if (table === 'sections') {
              return {
                select: mockSectionsSelect,
                eq: mockSectionsEq1,
              };
            }
            return {};
          });

          mockSectionsSelect.mockReturnValue({
            eq: mockSectionsEq1,
          });
          mockSectionsEq1.mockReturnValue({
            eq: mockSectionsEq2,
          });
          mockSectionsEq2.mockReturnValue({
            order: mockSectionsOrder,
          });

          const result = await sectionsService.listSections(pageType, pageId);

          expect(result.success).toBe(true);
          if (!result.success) return false;

          // Property: Empty array is trivially sorted
          return result.data.length === 0;
        }
      ),
      { numRuns: 50 }
    );
  });
});
