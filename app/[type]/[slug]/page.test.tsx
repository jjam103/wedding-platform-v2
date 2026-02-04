/**
 * Content Page Route Tests
 * 
 * Tests the dynamic content page route that displays custom pages with sections.
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - preview mode support)
 */

import { render, screen } from '@testing-library/react';
import ContentPage from './page';
import { getContentPageBySlug } from '@/services/contentPagesService';
import { listSections } from '@/services/sectionsService';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock dependencies
jest.mock('@/services/contentPagesService');
jest.mock('@/services/sectionsService');
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock SectionRenderer component
jest.mock('@/components/guest/SectionRenderer', () => ({
  SectionRenderer: ({ section }: any) => (
    <div data-testid={`section-${section.id}`}>
      {section.title && <h2>{section.title}</h2>}
      <div>Section content</div>
    </div>
  ),
}));

const mockGetContentPageBySlug = getContentPageBySlug as jest.MockedFunction<typeof getContentPageBySlug>;
const mockListSections = listSections as jest.MockedFunction<typeof listSections>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockCreateServerComponentClient = createServerComponentClient as jest.MockedFunction<typeof createServerComponentClient>;

describe('ContentPage Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for Supabase client
    mockCreateServerComponentClient.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
      },
    } as any);
  });

  describe('Preview Mode', () => {
    it('should show draft content in preview mode when authenticated', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'draft-page' });
      const searchParams = Promise.resolve({ preview: 'true' });
      
      // Mock authenticated session
      mockCreateServerComponentClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'admin-123' } } },
            error: null,
          }),
        },
      } as any);
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'draft-page',
          title: 'Draft Page',
          status: 'draft',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params, searchParams });
      
      render(result as React.ReactElement);
      
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
      expect(screen.getByText(/You are viewing draft content/)).toBeInTheDocument();
      expect(mockNotFound).not.toHaveBeenCalled();
    });

    it('should show 404 for draft content in preview mode when not authenticated', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'draft-page' });
      const searchParams = Promise.resolve({ preview: 'true' });
      
      // Mock no session
      mockCreateServerComponentClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      } as any);
      
      mockNotFound.mockImplementation(() => {
        throw new Error('Not Found');
      });
      
      await expect(ContentPage({ params, searchParams })).rejects.toThrow('Not Found');
      
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should show published content in preview mode', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'published-page' });
      const searchParams = Promise.resolve({ preview: 'true' });
      
      // Mock authenticated session
      mockCreateServerComponentClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: { user: { id: 'admin-123' } } },
            error: null,
          }),
        },
      } as any);
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'published-page',
          title: 'Published Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params, searchParams });
      
      render(result as React.ReactElement);
      
      expect(screen.getByText('Preview Mode')).toBeInTheDocument();
      expect(screen.getByText(/You are viewing published content/)).toBeInTheDocument();
    });

    it('should not show preview banner in normal mode', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'published-page' });
      const searchParams = Promise.resolve({});
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'published-page',
          title: 'Published Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params, searchParams });
      
      render(result as React.ReactElement);
      
      expect(screen.queryByText('Preview Mode')).not.toBeInTheDocument();
    });
  });

  describe('Route Validation', () => {
    it('should call notFound when type is not "custom"', async () => {
      const params = Promise.resolve({ type: 'invalid', slug: 'test-page' });
      const searchParams = Promise.resolve({});
      
      // Mock notFound to throw to stop execution
      mockNotFound.mockImplementation(() => {
        throw new Error('Not Found');
      });
      
      await expect(ContentPage({ params, searchParams })).rejects.toThrow('Not Found');
      
      expect(mockNotFound).toHaveBeenCalled();
      expect(mockGetContentPageBySlug).not.toHaveBeenCalled();
    });

    it('should accept "custom" type', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      const searchParams = Promise.resolve({});
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      await ContentPage({ params, searchParams });
      
      expect(mockNotFound).not.toHaveBeenCalled();
      expect(mockGetContentPageBySlug).toHaveBeenCalledWith('test-page');
    });
  });

  describe('Content Page Fetching', () => {
    it('should fetch content page by slug', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'our-story' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'our-story',
          title: 'Our Story',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      await ContentPage({ params });
      
      expect(mockGetContentPageBySlug).toHaveBeenCalledWith('our-story');
    });

    it('should call notFound when content page not found', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'nonexistent' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Content page not found',
        },
      });
      
      // Mock notFound to throw to stop execution
      mockNotFound.mockImplementation(() => {
        throw new Error('Not Found');
      });
      
      await expect(ContentPage({ params })).rejects.toThrow('Not Found');
      
      expect(mockNotFound).toHaveBeenCalled();
    });

    it('should call notFound when content page is draft', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'draft-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'draft-page',
          title: 'Draft Page',
          status: 'draft',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      // Mock notFound to throw to stop execution
      mockNotFound.mockImplementation(() => {
        throw new Error('Not Found');
      });
      
      await expect(ContentPage({ params })).rejects.toThrow('Not Found');
      
      expect(mockNotFound).toHaveBeenCalled();
    });
  });

  describe('Sections Fetching', () => {
    it('should fetch sections for the content page', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-123',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      await ContentPage({ params });
      
      expect(mockListSections).toHaveBeenCalledWith('custom', 'page-123');
    });

    it('should handle sections fetch failure gracefully', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch sections',
        },
      });
      
      const result = await ContentPage({ params });
      
      // Should not crash, should render with empty sections
      expect(mockNotFound).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render content page title', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Our Amazing Story',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      expect(screen.getByText('Our Amazing Story')).toBeInTheDocument();
    });

    it('should render sections using SectionRenderer', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'section-1',
            page_type: 'custom',
            page_id: 'page-1',
            title: 'Introduction',
            display_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'section-2',
            page_type: 'custom',
            page_id: 'page-1',
            title: 'Details',
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      expect(screen.getByTestId('section-section-1')).toBeInTheDocument();
      expect(screen.getByTestId('section-section-2')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should render empty state when no sections', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      expect(screen.getByText('No content available for this page.')).toBeInTheDocument();
    });

    it('should render multiple sections in order', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'section-1',
            page_type: 'custom',
            page_id: 'page-1',
            title: 'First Section',
            display_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'section-2',
            page_type: 'custom',
            page_id: 'page-1',
            title: 'Second Section',
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'section-3',
            page_type: 'custom',
            page_id: 'page-1',
            title: 'Third Section',
            display_order: 2,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      const sections = screen.getAllByText(/Section/);
      expect(sections.length).toBeGreaterThanOrEqual(3);
      expect(screen.getByText('First Section')).toBeInTheDocument();
      expect(screen.getByText('Second Section')).toBeInTheDocument();
      expect(screen.getByText('Third Section')).toBeInTheDocument();
    });
  });

  describe('Async Params Handling', () => {
    it('should handle async params correctly', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      // Should not throw error
      await expect(ContentPage({ params })).resolves.toBeDefined();
    });

    it('should await params before using them', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      await ContentPage({ params });
      
      // Verify slug was extracted correctly
      expect(mockGetContentPageBySlug).toHaveBeenCalledWith('test-page');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in slug', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'our-story-2024' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'our-story-2024',
          title: 'Our Story 2024',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      await ContentPage({ params });
      
      expect(mockGetContentPageBySlug).toHaveBeenCalledWith('our-story-2024');
    });

    it('should handle empty sections array', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      expect(screen.getByText('No content available for this page.')).toBeInTheDocument();
    });

    it('should handle sections without titles', async () => {
      const params = Promise.resolve({ type: 'custom', slug: 'test-page' });
      
      mockGetContentPageBySlug.mockResolvedValue({
        success: true,
        data: {
          id: 'page-1',
          slug: 'test-page',
          title: 'Test Page',
          status: 'published',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      });
      
      mockListSections.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'section-1',
            page_type: 'custom',
            page_id: 'page-1',
            display_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      });
      
      const result = await ContentPage({ params });
      
      render(result as React.ReactElement);
      
      expect(screen.getByTestId('section-section-1')).toBeInTheDocument();
    });
  });
});
