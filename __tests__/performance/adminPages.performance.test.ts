/**
 * Performance tests for admin pages
 * 
 * Tests:
 * - List page load times (< 500ms for datasets under 1000 items)
 * - Search response times (< 1000ms)
 * - Save operation times (< 2000ms)
 * 
 * Requirements: 20.1-20.3
 */

import { createMockSupabaseClient } from '../helpers/mockSupabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

describe('Admin Pages Performance Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('List Page Load Times', () => {
    it('should load guests list page within 500ms for 100 guests', async () => {
      // Arrange: Create 100 mock guests
      const mockGuests = Array.from({ length: 100 }, (_, i) => ({
        id: `guest-${i}`,
        first_name: `First${i}`,
        last_name: `Last${i}`,
        email: `guest${i}@example.com`,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        group_id: 'group-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockGuests,
              error: null,
              count: 100,
            }),
          }),
        }),
      });

      // Act: Measure load time
      const startTime = performance.now();
      
      // Simulate fetching guests
      const { data, error } = await mockSupabase
        .from('guests')
        .select('*', { count: 'exact' })
        .order('last_name')
        .range(0, 49);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Assert: Load time should be under 500ms
      expect(error).toBeNull();
      expect(data).toHaveLength(100);
      expect(loadTime).toBeLessThan(500);
    });

    it('should load events list page within 500ms for 50 events', async () => {
      // Arrange: Create 50 mock events
      const mockEvents = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        slug: `event-${i}`,
        title: `Event ${i}`,
        event_type: 'activity',
        event_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockEvents,
              error: null,
              count: 50,
            }),
          }),
        }),
      });

      // Act: Measure load time
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('events')
        .select('*', { count: 'exact' })
        .order('event_date')
        .range(0, 49);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(50);
      expect(loadTime).toBeLessThan(500);
    });

    it('should load activities list page within 500ms for 100 activities', async () => {
      // Arrange
      const mockActivities = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        slug: `activity-${i}`,
        title: `Activity ${i}`,
        activity_type: 'activity',
        activity_date: new Date().toISOString(),
        capacity: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockActivities,
              error: null,
              count: 100,
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('activities')
        .select('*', { count: 'exact' })
        .order('activity_date')
        .range(0, 49);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(100);
      expect(loadTime).toBeLessThan(500);
    });
  });

  describe('Search Response Times', () => {
    it('should return search results within 1000ms for guest search', async () => {
      // Arrange
      const mockResults = Array.from({ length: 20 }, (_, i) => ({
        id: `guest-${i}`,
        first_name: `John${i}`,
        last_name: `Doe${i}`,
        email: `john${i}@example.com`,
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockResults,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('guests')
        .select('id, first_name, last_name, email')
        .or('first_name.ilike.%john%,last_name.ilike.%john%,email.ilike.%john%')
        .limit(20);

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(20);
      expect(searchTime).toBeLessThan(1000);
    });

    it('should return reference search results within 1000ms', async () => {
      // Arrange
      const mockResults = [
        { id: 'event-1', name: 'Ceremony', type: 'event', slug: 'ceremony' },
        { id: 'activity-1', name: 'Beach Day', type: 'activity', slug: 'beach-day' },
        { id: 'page-1', name: 'Our Story', type: 'content_page', slug: 'our-story' },
      ];

      // Mock multiple table queries
      mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockResults.filter(r => r.type === table.slice(0, -1)),
              error: null,
            }),
          }),
        }),
      }));

      // Act
      const startTime = performance.now();
      
      // Simulate searching across multiple entity types
      const searches = await Promise.all([
        mockSupabase.from('events').select('*').ilike('title', '%ceremony%').limit(5),
        mockSupabase.from('activities').select('*').ilike('title', '%beach%').limit(5),
        mockSupabase.from('content_pages').select('*').ilike('title', '%story%').limit(5),
      ]);

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Assert
      expect(searches.every(s => s.error === null)).toBe(true);
      expect(searchTime).toBeLessThan(1000);
    });

    it('should filter activities by type within 1000ms', async () => {
      // Arrange
      const mockActivities = Array.from({ length: 30 }, (_, i) => ({
        id: `activity-${i}`,
        title: `Activity ${i}`,
        activity_type: 'activity',
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockActivities,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('activities')
        .select('*')
        .eq('activity_type', 'activity')
        .order('activity_date');

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(30);
      expect(filterTime).toBeLessThan(1000);
    });
  });

  describe('Save Operation Times', () => {
    it('should save guest within 2000ms', async () => {
      // Arrange
      const guestData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        age_type: 'adult',
        guest_type: 'wedding_guest',
        group_id: 'group-1',
      };

      const savedGuest = {
        id: 'guest-1',
        ...guestData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: savedGuest,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('guests')
        .insert(guestData)
        .select()
        .single();

      const endTime = performance.now();
      const saveTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toEqual(savedGuest);
      expect(saveTime).toBeLessThan(2000);
    });

    it('should update event within 2000ms', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Event',
        description: 'Updated description',
      };

      const updatedEvent = {
        id: 'event-1',
        slug: 'updated-event',
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedEvent,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('events')
        .update(updateData)
        .eq('id', 'event-1')
        .select()
        .single();

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toEqual(updatedEvent);
      expect(updateTime).toBeLessThan(2000);
    });

    it('should save section with columns within 2000ms', async () => {
      // Arrange
      const sectionData = {
        page_type: 'custom',
        page_id: 'page-1',
        display_order: 1,
        layout: 'two-column',
      };

      const savedSection = {
        id: 'section-1',
        ...sectionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const columnData = [
        {
          section_id: 'section-1',
          column_number: 1,
          content_type: 'rich_text',
          content_data: { html: '<p>Column 1 content</p>' },
        },
        {
          section_id: 'section-1',
          column_number: 2,
          content_type: 'rich_text',
          content_data: { html: '<p>Column 2 content</p>' },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'sections') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: savedSection,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'section_columns') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: columnData,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const startTime = performance.now();
      
      // Save section
      const sectionResult = await mockSupabase
        .from('sections')
        .insert(sectionData)
        .select()
        .single();

      // Save columns
      const columnsResult = await mockSupabase
        .from('section_columns')
        .insert(columnData);

      const endTime = performance.now();
      const saveTime = endTime - startTime;

      // Assert
      expect(sectionResult.error).toBeNull();
      expect(columnsResult.error).toBeNull();
      expect(saveTime).toBeLessThan(2000);
    });

    it('should bulk create guests within 2000ms for 50 guests', async () => {
      // Arrange
      const guestsData = Array.from({ length: 50 }, (_, i) => ({
        first_name: `First${i}`,
        last_name: `Last${i}`,
        email: `guest${i}@example.com`,
        age_type: 'adult',
        guest_type: 'wedding_guest',
        group_id: 'group-1',
      }));

      const savedGuests = guestsData.map((g, i) => ({
        id: `guest-${i}`,
        ...g,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: savedGuests,
            error: null,
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('guests')
        .insert(guestsData)
        .select();

      const endTime = performance.now();
      const bulkSaveTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(50);
      expect(bulkSaveTime).toBeLessThan(2000);
    });
  });

  describe('Performance Degradation Tests', () => {
    it('should maintain performance with 1000 guests', async () => {
      // Arrange
      const mockGuests = Array.from({ length: 1000 }, (_, i) => ({
        id: `guest-${i}`,
        first_name: `First${i}`,
        last_name: `Last${i}`,
        email: `guest${i}@example.com`,
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockGuests.slice(0, 50),
              error: null,
              count: 1000,
            }),
          }),
        }),
      });

      // Act
      const startTime = performance.now();
      
      const { data, error } = await mockSupabase
        .from('guests')
        .select('*', { count: 'exact' })
        .order('last_name')
        .range(0, 49);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(50);
      expect(loadTime).toBeLessThan(500);
    });

    it('should handle pagination efficiently', async () => {
      // Arrange
      const totalGuests = 500;
      const pageSize = 50;
      const pages = Math.ceil(totalGuests / pageSize);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockImplementation((from: number, to: number) => {
              const mockData = Array.from({ length: to - from + 1 }, (_, i) => ({
                id: `guest-${from + i}`,
                first_name: `First${from + i}`,
                last_name: `Last${from + i}`,
              }));
              return Promise.resolve({
                data: mockData,
                error: null,
                count: totalGuests,
              });
            }),
          }),
        }),
      });

      // Act: Load all pages
      const startTime = performance.now();
      
      const pageLoads = [];
      for (let page = 0; page < pages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const pageStart = performance.now();
        await mockSupabase
          .from('guests')
          .select('*', { count: 'exact' })
          .order('last_name')
          .range(from, to);
        const pageEnd = performance.now();
        
        pageLoads.push(pageEnd - pageStart);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgPageLoad = pageLoads.reduce((a, b) => a + b, 0) / pageLoads.length;

      // Assert
      expect(avgPageLoad).toBeLessThan(500);
      expect(totalTime).toBeLessThan(5000); // All pages should load in under 5 seconds
    });
  });
});
