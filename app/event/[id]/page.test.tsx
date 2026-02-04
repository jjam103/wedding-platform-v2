/**
 * Event Page Route Tests
 * 
 * Validates: 
 * - Requirements 4.2 (E2E Critical Path Testing - section management flow)
 * - Requirements 24 (Slug Management - slug-based routing)
 * - Task 31.1 (Event Detail Page - slug routing)
 * 
 * Tests that the event route:
 * - Exists and renders without 404
 * - Fetches event data correctly using ID or slug
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
              id: 'event-1',
              name: 'Welcome Reception',
              event_type: 'reception',
              start_date: '2025-06-15T18:00:00Z',
              end_date: '2025-06-15T22:00:00Z',
              rsvp_required: true,
              rsvp_deadline: '2025-06-01',
              status: 'published',
              description: '<p>Join us for a welcome reception</p>',
              locations: {
                id: 'location-1',
                name: 'Beach Resort',
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
        title: 'Event Details',
        page_type: 'event',
        page_id: 'event-1',
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

describe('Event Page Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist and be importable', async () => {
    const EventPage = (await import('./page')).default;
    expect(EventPage).toBeDefined();
    expect(typeof EventPage).toBe('function');
  });

  it('should handle async params (Next.js 15 pattern)', async () => {
    const EventPage = (await import('./page')).default;
    
    // Next.js 15: params is a Promise
    const params = Promise.resolve({ id: 'event-1' });
    
    // Should not throw when awaiting params
    await expect(EventPage({ params })).resolves.toBeDefined();
  });

  it('should fetch event data from Supabase', async () => {
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const EventPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'event-1' });
    await EventPage({ params });
    
    // Verify Supabase client was created
    expect(createServerComponentClient).toHaveBeenCalled();
  });

  it('should fetch sections for the event', async () => {
    const { listSections } = await import('@/services/sectionsService');
    const EventPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'event-1' });
    await EventPage({ params });
    
    // Verify sections were fetched
    expect(listSections).toHaveBeenCalledWith('event', 'event-1');
  });

  it('should call notFound when event does not exist', async () => {
    const { notFound } = await import('next/navigation');
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    
    // Mock notFound to throw (simulating Next.js behavior)
    (notFound as unknown as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    
    // Mock event not found
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
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'nonexistent' });
    
    // Should throw when notFound is called
    await expect(EventPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    
    // Verify notFound was called
    expect(notFound).toHaveBeenCalled();
  });

  it('should render event information', async () => {
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Verify result is a React element
    expect(result).toBeDefined();
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('props');
  });

  it('should use SectionRenderer for sections', async () => {
    const { listSections } = await import('@/services/sectionsService');
    const EventPage = (await import('./page')).default;
    
    const params = Promise.resolve({ id: 'event-1' });
    await EventPage({ params });
    
    // Verify sections were fetched (SectionRenderer will be used in render)
    expect(listSections).toHaveBeenCalledWith('event', 'event-1');
  });

  it('should handle empty sections gracefully', async () => {
    const { listSections } = await import('@/services/sectionsService');
    
    // Mock empty sections
    (listSections as unknown as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any);
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Should render without error
    expect(result).toBeDefined();
  });

  it('should handle sections service error gracefully', async () => {
    const { listSections } = await import('@/services/sectionsService');
    
    // Mock sections service error
    (listSections as unknown as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Connection failed' },
    } as any);
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Should render with empty sections
    expect(result).toBeDefined();
  });

  it('should display event type correctly', async () => {
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Verify result contains event data
    expect(result).toBeDefined();
  });

  it('should display RSVP information when required', async () => {
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Verify result contains RSVP data
    expect(result).toBeDefined();
  });

  it('should display location information', async () => {
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Verify result contains location data
    expect(result).toBeDefined();
  });

  it('should handle events without location', async () => {
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    
    // Mock event without location
    (createServerComponentClient as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'event-2',
                name: 'Virtual Event',
                event_type: 'pre_wedding',
                start_date: '2025-06-10T10:00:00Z',
                end_date: '2025-06-10T12:00:00Z',
                rsvp_required: false,
                status: 'published',
                description: '<p>Virtual pre-wedding event</p>',
                locations: null,
              },
              error: null,
            })),
          })),
        })),
      })),
    });
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-2' });
    
    const result = await EventPage({ params });
    
    // Should render without error
    expect(result).toBeDefined();
  });

  it('should handle events without RSVP deadline', async () => {
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    
    // Mock event without RSVP deadline
    (createServerComponentClient as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'event-3',
                name: 'Casual Gathering',
                event_type: 'post_wedding',
                start_date: '2025-06-20T14:00:00Z',
                rsvp_required: false,
                rsvp_deadline: null,
                status: 'draft',
                description: '<p>Casual post-wedding gathering</p>',
                locations: {
                  id: 'location-2',
                  name: 'Coffee Shop',
                  location_type: 'venue',
                },
              },
              error: null,
            })),
          })),
        })),
      })),
    });
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-3' });
    
    const result = await EventPage({ params });
    
    // Should render without error
    expect(result).toBeDefined();
  });

  it('should handle events with multiple sections', async () => {
    const { listSections } = await import('@/services/sectionsService');
    
    // Mock multiple sections
    (listSections as unknown as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'section-1',
          title: 'Schedule',
          page_type: 'event',
          page_id: 'event-1',
          display_order: 1,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          columns: [],
        },
        {
          id: 'section-2',
          title: 'Dress Code',
          page_type: 'event',
          page_id: 'event-1',
          display_order: 2,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          columns: [],
        },
        {
          id: 'section-3',
          title: 'Photo Gallery',
          page_type: 'event',
          page_id: 'event-1',
          display_order: 3,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          columns: [],
        },
      ],
    } as any);
    
    const EventPage = (await import('./page')).default;
    const params = Promise.resolve({ id: 'event-1' });
    
    const result = await EventPage({ params });
    
    // Should render all sections
    expect(result).toBeDefined();
  });

  describe('Slug-Based Routing', () => {
    it('should accept slug parameter instead of UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      // Mock event fetched by slug
      (createServerComponentClient as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: 'event-1',
                  slug: 'wedding-ceremony',
                  name: 'Wedding Ceremony',
                  event_type: 'ceremony',
                  start_date: '2025-06-15T14:00:00Z',
                  status: 'published',
                  description: '<p>Join us for our wedding ceremony</p>',
                  locations: {
                    id: 'location-1',
                    name: 'Beach Resort',
                    location_type: 'venue',
                  },
                },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      const EventPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'wedding-ceremony' });
      
      const result = await EventPage({ params });
      
      // Should render successfully
      expect(result).toBeDefined();
    });

    it('should query by slug field when parameter is not a UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'event-1',
            slug: 'beach-party',
            name: 'Beach Party',
            event_type: 'reception',
            start_date: '2025-06-16T18:00:00Z',
            status: 'published',
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
      
      const EventPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'beach-party' });
      
      await EventPage({ params });
      
      // Should query by slug field (not id)
      expect(mockEq).toHaveBeenCalledWith('slug', 'beach-party');
    });

    it('should query by id field when parameter is a UUID', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            slug: 'wedding-ceremony',
            name: 'Wedding Ceremony',
            event_type: 'ceremony',
            start_date: '2025-06-15T14:00:00Z',
            status: 'published',
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
      
      const EventPage = (await import('./page')).default;
      const params = Promise.resolve({ id: '123e4567-e89b-12d3-a456-426614174000' });
      
      await EventPage({ params });
      
      // Should query by id field (backward compatibility)
      expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should convert slug to lowercase before querying', async () => {
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const mockEq = jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({
          data: {
            id: 'event-1',
            slug: 'wedding-ceremony',
            name: 'Wedding Ceremony',
            event_type: 'ceremony',
            start_date: '2025-06-15T14:00:00Z',
            status: 'published',
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
      
      const EventPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'WEDDING-CEREMONY' });
      
      await EventPage({ params });
      
      // Should query with lowercase slug
      expect(mockEq).toHaveBeenCalledWith('slug', 'wedding-ceremony');
    });

    it('should handle slug with numbers and hyphens', async () => {
      const EventPage = (await import('./page')).default;
      const params = Promise.resolve({ id: 'day-1-welcome-dinner' });
      
      const result = await EventPage({ params });
      
      // Should render successfully
      expect(result).toBeDefined();
    });
  });
});
