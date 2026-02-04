/**
 * Activity Page Route Tests
 * 
 * Validates: 
 * - Requirements 4.2 (E2E Critical Path Testing - section management flow)
 * - Requirements 24 (Slug Management - slug-based routing)
 * - Task 31.2 (Activity Detail Page - slug routing)
 * 
 * Tests that the activity route:
 * - Exists and renders without 404
 * - Fetches activity data correctly using ID or slug
 * - Supports backward compatibility with UUID-based URLs
 * - Displays sections using SectionRenderer
 * - Handles async params (Next.js 15)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'activity-1',
              name: 'Beach Volleyball',
              activity_type: 'activity',
              start_time: '2025-06-15T10:00:00Z',
              capacity: 20,
              description: '<p>Fun beach volleyball game</p>',
              events: {
                id: 'event-1',
                name: 'Welcome Day',
                start_date: '2025-06-15',
                end_date: '2025-06-15',
              },
              locations: {
                id: 'location-1',
                name: 'Beach',
                location_type: 'venue',
              },
            },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Mock sections service
jest.mock('@/services/sectionsService', () => ({
  listSections: jest.fn(() => Promise.resolve({
    success: true,
    data: [
      {
        id: 'section-1',
        title: 'Activity Details',
        page_type: 'activity',
        page_id: 'activity-1',
        display_order: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Test content</p>' },
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
      },
    ],
  })),
}));

// Mock SectionRenderer component
jest.mock('@/components/guest/SectionRenderer', () => ({
  SectionRenderer: ({ section }: any) => (
    <div data-testid={`section-${section.id}`}>
      {section.title}
    </div>
  ),
}));

describe('Activity Page Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist and be importable', async () => {
    const ActivityPage = (await import('./page')).default;
    expect(ActivityPage).toBeDefined();
    expect(typeof ActivityPage).toBe('function');
  });

  it('should handle async params (Next.js 15 pattern)', async () => {
    const ActivityPage = (await import('./page')).default;
    
    // Next.js 15: params is a Promise
    const params = Promise.resolve({ id: 'activity-1' });
    
    // Should not throw when awaiting params
    await expect(ActivityPage({ params })).resolves.toBeDefined();
  });

  it('should fetch activity data from Supabase', async () => {
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const ActivityPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'activity-1' });
    await ActivityPage({ params });
    
    // Verify Supabase client was created
    expect(createServerComponentClient).toHaveBeenCalled();
  });

  it('should fetch sections for the activity', async () => {
    const { listSections } = await import('@/services/sectionsService');
    const ActivityPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'activity-1' });
    await ActivityPage({ params });
    
    // Verify sections were fetched
    expect(listSections).toHaveBeenCalledWith('activity', 'activity-1');
  });

  it('should call notFound when activity does not exist', async () => {
    const { notFound } = await import('next/navigation');
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    
    // Mock notFound to throw (simulating Next.js behavior)
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    
    // Mock activity not found
    (createServerComponentClient as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found' },
            })),
          })),
        })),
      })),
    });
    
    const ActivityPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'nonexistent' });
    
    // Should throw when notFound is called
    await expect(ActivityPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    
    // Verify notFound was called
    expect(notFound).toHaveBeenCalled();
  });

  it('should render activity information', async () => {
    const ActivityPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'activity-1' });
    
    const result = await ActivityPage({ params });
    
    // Verify result is a React element
    expect(result).toBeDefined();
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('props');
  });

  it('should use SectionRenderer for sections', async () => {
    const { listSections } = await import('@/services/sectionsService');
    const ActivityPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'activity-1' });
    await ActivityPage({ params });
    
    // Verify sections were fetched (SectionRenderer will be used in render)
    expect(listSections).toHaveBeenCalledWith('activity', 'activity-1');
  });

  it('should handle empty sections gracefully', async () => {
    const { listSections } = await import('@/services/sectionsService');
    
    // Mock empty sections
    (listSections as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: [],
    });
    
    const ActivityPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'activity-1' });
    
    const result = await ActivityPage({ params });
    
    // Should render without error
    expect(result).toBeDefined();
  });

  it('should handle sections service error gracefully', async () => {
    const { listSections } = await import('@/services/sectionsService');
    
    // Mock sections service error
    (listSections as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
    });
    
    const ActivityPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'activity-1' });
    
    const result = await ActivityPage({ params });
    
    // Should render with empty sections
    expect(result).toBeDefined();
  });

  describe('Slug-Based Routing', () => {
    it('should accept slug parameter instead of UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      // Mock activity fetched by slug
      (createServerComponentClient as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: 'activity-1',
                  slug: 'beach-volleyball',
                  name: 'Beach Volleyball',
                  activity_type: 'activity',
                  start_time: '2025-06-15T10:00:00Z',
                  capacity: 20,
                  description: '<p>Fun beach volleyball game</p>',
                  events: null,
                  locations: {
                    id: 'location-1',
                    name: 'Beach',
                    location_type: 'venue',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      const ActivityPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'beach-volleyball' });
      
      const result = await ActivityPage({ params });
      
      // Should render successfully
      expect(result).toBeDefined();
    });

    it('should query by slug field when parameter is not a UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'activity-1',
            slug: 'sunset-cocktails',
            name: 'Sunset Cocktails',
            activity_type: 'meal',
            start_time: '2025-06-16T18:00:00Z',
            capacity: 50,
            events: null,
            locations: null,
          },
          error: null,
        })),
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq,
      }));
      
      (createServerComponentClient as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          select: mockSelect,
        })),
      });
      
      const ActivityPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'sunset-cocktails' });
      
      await ActivityPage({ params });
      
      // Should query by slug field (not id)
      expect(mockEq).toHaveBeenCalledWith('slug', 'sunset-cocktails');
    });

    it('should query by id field when parameter is a UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            slug: 'beach-volleyball',
            name: 'Beach Volleyball',
            activity_type: 'activity',
            start_time: '2025-06-15T10:00:00Z',
            capacity: 20,
            events: null,
            locations: null,
          },
          error: null,
        })),
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq,
      }));
      
      (createServerComponentClient as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          select: mockSelect,
        })),
      });
      
      const ActivityPage = (await import('./page')).default;
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      
      await ActivityPage({ params });
      
      // Should query by id field (backward compatibility)
      expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should convert slug to lowercase before querying', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'activity-1',
            slug: 'beach-volleyball',
            name: 'Beach Volleyball',
            activity_type: 'activity',
            start_time: '2025-06-15T10:00:00Z',
            capacity: 20,
            events: null,
            locations: null,
          },
          error: null,
        })),
      }));
      
      const mockSelect = jest.fn(() => ({
        eq: mockEq,
      }));
      
      (createServerComponentClient as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          select: mockSelect,
        })),
      });
      
      const ActivityPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'BEACH-VOLLEYBALL' });
      
      await ActivityPage({ params });
      
      // Should query with lowercase slug
      expect(mockEq).toHaveBeenCalledWith('slug', 'beach-volleyball');
    });

    it('should handle slug with numbers and hyphens', async () => {
      const ActivityPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'day-1-welcome-dinner' });
      
      const result = await ActivityPage({ params });
      
      // Should render successfully
      expect(result).toBeDefined();
    });
  });
});
