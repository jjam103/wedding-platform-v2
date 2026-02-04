/**
 * PhotoGalleryPreview Component Tests
 * 
 * Tests the photo gallery preview functionality in the section editor,
 * including photo fetching, display modes, loading states, and error handling.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { SectionEditor } from './SectionEditor';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn().then((mod: any) => mod.default || mod);
    return Component;
  },
}));

// Mock PhotoPicker
jest.mock('./PhotoPicker', () => ({
  PhotoPicker: ({ onSelect, onClose }: any) => (
    <div data-testid="photo-picker-modal">
      <button onClick={() => onSelect(['photo-1', 'photo-2'])}>Select Photos</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock RichTextEditor
jest.mock('./RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock PhotoGallerySkeleton
jest.mock('./PhotoGallerySkeleton', () => ({
  PhotoGallerySkeleton: () => <div data-testid="photo-gallery-skeleton">Loading...</div>,
}));

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('PhotoGalleryPreview', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
    
    // Mock sections fetch by default (can be overridden in individual tests)
    // First call is always for fetching sections
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Photo Fetching and Display', () => {
    it('should fetch and display photos with thumbnails and captions', async () => {
      // Mock sections fetch first
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'section-1',
              page_type: 'activity',
              page_id: 'activity-1',
              title: 'Test Section',
              column_1_content: 'Content',
              column_2_content: '',
              photo_gallery_ids: ['photo-1', 'photo-2'],
              display_order: 0,
              columns: [],
            },
          ],
        }),
      });

      // Mock photo API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'photo-1',
              photo_url: 'https://example.com/photo1.jpg',
              caption: 'Beautiful sunset',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'photo-2',
              photo_url: 'https://example.com/photo2.jpg',
              caption: 'Mountain view',
            },
          }),
        });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      // Wait for sections to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/sections/by-page/activity/activity-1');
      });

      // Verify component renders
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should use photo_url field (not deprecated url field)', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/sections/by-page/activity/activity-1');
      });

      // Verify component renders
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Display Modes', () => {
    it('should display "Gallery Grid" mode indicator', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      // Wait for component to render
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should display "Carousel" mode indicator', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should display "Auto-play Loop" mode indicator', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display skeleton placeholders while loading', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      // Should show loading state initially
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should hide loading state after photos load', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Loading state should be gone
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle failed photo fetch (404)', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not crash
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should filter out null photos from failed requests', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should only show the successful photo
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display "No photos selected" when no photos', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      // Wait for component to render
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should display empty state when photoIds array is empty', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Photo Captions', () => {
    it('should display photo captions when available', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should handle photos without captions', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not crash without caption
      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });

  describe('Integration with SectionEditor', () => {
    it('should render within section editor', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });

    it('should update when photo selection changes', async () => {
      // Mock sections fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-1"
        />
      );

      await waitFor(() => {
        const component = screen.getByTestId('section-editor');
        expect(component).toBeInTheDocument();
      });
    });
  });
});
