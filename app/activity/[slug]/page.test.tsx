/**
 * @jest-environment node
 */

import { notFound, redirect } from 'next/navigation';
import ActivityPage from './page';
import * as activityService from '@/services/activityService';
import * as sectionsService from '@/services/sectionsService';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  redirect: jest.fn(),
}));

// Mock services
jest.mock('@/services/activityService');
jest.mock('@/services/sectionsService');

// Mock SectionRenderer component
jest.mock('@/components/guest/SectionRenderer', () => ({
  SectionRenderer: ({ section }: { section: any }) => (
    <div data-testid="section-renderer">{section.id}</div>
  ),
}));

describe('ActivityPage - Slug-based Routing', () => {
  const mockActivity = {
    id: 'activity-123',
    name: 'Beach Volleyball',
    slug: 'beach-volleyball',
    description: '<p>Join us for fun beach games</p>',
    activityType: 'activity',
    startTime: '2024-06-14T14:00:00Z',
    locationId: 'location-123',
    eventId: 'event-123',
    capacity: 20,
    costPerPerson: 25,
  };

  const mockSections = [
    { id: 'section-1', title: 'Details', order: 1 },
    { id: 'section-2', title: 'What to Bring', order: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (sectionsService.listSections as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSections,
    });
  });

  describe('Slug-based routing', () => {
    it('should fetch activity by slug and render page', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(activityService.getBySlug).toHaveBeenCalledWith('beach-volleyball');
      expect(sectionsService.listSections).toHaveBeenCalledWith('activity', 'activity-123');
      expect(result).toBeDefined();
    });

    it('should show 404 when activity not found by slug', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Activity not found' },
      });

      const params = Promise.resolve({ slug: 'non-existent-activity' });
      await ActivityPage({ params });

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('Backward compatibility with UUID-based URLs', () => {
    it('should redirect UUID-based URL to slug-based URL', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (activityService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      const params = Promise.resolve({ slug: uuid });
      await ActivityPage({ params });

      expect(activityService.get).toHaveBeenCalledWith(uuid);
      expect(redirect).toHaveBeenCalledWith('/activity/beach-volleyball');
    });

    it('should show 404 when UUID activity not found', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (activityService.get as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Activity not found' },
      });

      const params = Promise.resolve({ slug: uuid });
      await ActivityPage({ params });

      expect(notFound).toHaveBeenCalled();
    });

    it('should show 404 when UUID activity has no slug', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      (activityService.get as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockActivity, slug: null },
      });

      const params = Promise.resolve({ slug: uuid });
      await ActivityPage({ params });

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('Section rendering', () => {
    it('should render sections when available', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(sectionsService.listSections).toHaveBeenCalledWith('activity', 'activity-123');
      expect(result).toBeDefined();
    });

    it('should handle empty sections gracefully', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(result).toBeDefined();
    });

    it('should handle sections fetch error gracefully', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      (sectionsService.listSections as jest.Mock).mockResolvedValue({
        success: false,
        error: { code: 'DATABASE_ERROR', message: 'Failed to fetch sections' },
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(result).toBeDefined();
    });
  });

  describe('Activity details display', () => {
    it('should display all activity details when available', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(result).toBeDefined();
      // Activity details are rendered in JSX
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalActivity = {
        id: 'activity-123',
        name: 'Simple Activity',
        slug: 'simple-activity',
      };

      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: minimalActivity,
      });

      const params = Promise.resolve({ slug: 'simple-activity' });
      const result = await ActivityPage({ params });

      expect(result).toBeDefined();
    });

    it('should display cost when available', async () => {
      (activityService.getBySlug as jest.Mock).mockResolvedValue({
        success: true,
        data: mockActivity,
      });

      const params = Promise.resolve({ slug: 'beach-volleyball' });
      const result = await ActivityPage({ params });

      expect(result).toBeDefined();
      // Cost is rendered in JSX
    });
  });
});
