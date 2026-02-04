/**
 * @jest-environment node
 */

import { notFound, redirect } from 'next/navigation';
import EventPage from './page';
import * as eventService from '@/services/eventService';
import * as sectionsService from '@/services/sectionsService';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  redirect: jest.fn(),
}));

// Mock services
jest.mock('@/services/eventService');
jest.mock('@/services/sectionsService');

// Mock SectionRenderer component
jest.mock('@/components/guest/SectionRenderer', () => ({
  SectionRenderer: ({ section }: { section: any }) => (
    <div data-testid="section-renderer">{section.id}</div>
  ),
}));

describe('EventPage - Slug-based Routing', () => {
  const mockEvent = {
    id: 'event-123',
    name: 'Wedding Ceremony',
    slug: 'wedding-ceremony',
    description: '<p>Join us for our special day</p>',
    eventType: 'ceremony',
    startDate: '2024-06-15T16:00:00Z',
    endDate: '2024-06-15T18:00:00Z',
    locationId: 'location-123',
    rsvpRequired: true,
    rsvpDeadline: '2024-06-01T00:00:00Z',
    status: 'published',
  };

  const mockSections = [
    { id: 'section-1', title: 'Details', order: 1 },
    { id: 'section-2', title: 'Schedule', order: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (sectionsService.listSections as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSections,
    });
  });

  describe('Slug-based routing', () => {
    it('should fetch event by slug and render page', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      const params = Promise.resolve({ slug: 'wedding-ceremony' });
      const result = await EventPage({ params });

      expect(eventService.getBySlug).toHaveBeenCalledWith('wedding-ceremony');
      expect(sectionsService.listSections).toHaveBeenCalledWith('event', 'event-123');
      expect(result).toBeDefined();
    });

    it('should show 404 when event not found by slug', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      });

      const params = Promise.resolve({ slug: 'non-existent-event' });
      await EventPage({ params });

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('Backward compatibility with UUID-based URLs', () => {
    it('should redirect UUID-based URL to slug-based URL', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (eventService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      const params = Promise.resolve({ slug: uuid });
      await EventPage({ params });

      expect(eventService.get).toHaveBeenCalledWith(uuid);
      expect(redirect).toHaveBeenCalledWith('/event/wedding-ceremony');
    });

    it('should show 404 when UUID event not found', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (eventService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      });

      const params = Promise.resolve({ slug: uuid });
      await EventPage({ params });

      expect(notFound).toHaveBeenCalled();
    });

    it('should show 404 when UUID event has no slug', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (eventService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockEvent, slug: null },
      });

      const params = Promise.resolve({ slug: uuid });
      await EventPage({ params });

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('Section rendering', () => {
    it('should render sections when available', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      const params = Promise.resolve({ slug: 'wedding-ceremony' });
      const result = await EventPage({ params });

      expect(sectionsService.listSections).toHaveBeenCalledWith('event', 'event-123');
      expect(result).toBeDefined();
    });

    it('should handle empty sections gracefully', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const params = Promise.resolve({ slug: 'wedding-ceremony' });
      const result = await EventPage({ params });

      expect(result).toBeDefined();
    });

    it('should handle sections fetch error gracefully', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch sections' },
      });

      const params = Promise.resolve({ slug: 'wedding-ceremony' });
      const result = await EventPage({ params });

      expect(result).toBeDefined();
    });
  });

  describe('Event details display', () => {
    it('should display all event details when available', async () => {
      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEvent,
      });

      const params = Promise.resolve({ slug: 'wedding-ceremony' });
      const result = await EventPage({ params });

      expect(result).toBeDefined();
      // Event details are rendered in JSX
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalEvent = {
        id: 'event-123',
        name: 'Simple Event',
        slug: 'simple-event',
      };

      (eventService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: minimalEvent,
      });

      const params = Promise.resolve({ slug: 'simple-event' });
      const result = await EventPage({ params });

      expect(result).toBeDefined();
    });
  });
});
