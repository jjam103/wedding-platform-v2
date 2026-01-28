import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoPicker } from './PhotoPicker';

// Mock fetch
global.fetch = jest.fn();

const mockPhotos = [
  {
    id: 'photo-1',
    photo_url: 'https://example.com/photo1.jpg',
    caption: 'Photo 1',
    alt_text: 'Alt text 1',
    moderation_status: 'approved' as const,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'photo-2',
    photo_url: 'https://example.com/photo2.jpg',
    caption: 'Photo 2',
    alt_text: 'Alt text 2',
    moderation_status: 'approved' as const,
    created_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'photo-3',
    photo_url: 'https://example.com/photo3.jpg',
    caption: 'Photo 3',
    alt_text: 'Alt text 3',
    moderation_status: 'approved' as const,
    created_at: '2025-01-03T00:00:00Z',
  },
];

describe('PhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render add photos button', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
    });

    it('should show selected photos count when photos are selected', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
    });

    it('should not show selected photos section when no photos selected', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      expect(screen.queryByText(/Selected Photos/)).not.toBeInTheDocument();
    });
  });

  describe('photo picker modal', () => {
    it('should open modal when add photos button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Select Photos')).toBeInTheDocument();
      });
    });

    it('should fetch photos when modal opens', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
          pageType="event"
          pageId="event-123"
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/photos')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page_type=event')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page_id=event-123')
        );
      });
    });

    it('should display loading state while fetching photos', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  json: async () => ({
                    success: true,
                    data: { photos: mockPhotos, total: 3 },
                  }),
                }),
              100
            )
          )
      );

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Loading photos...')).toBeInTheDocument();
      });
    });

    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: { message: 'Failed to load photos' },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Failed to load photos')).toBeInTheDocument();
      });
    });

    it('should display message when no photos available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: [], total: 0 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('No approved photos available.')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Select Photos')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('Close photo picker'));

      await waitFor(() => {
        expect(screen.queryByText('Select Photos')).not.toBeInTheDocument();
      });
    });

    it('should close modal when done button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Select Photos')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Done'));

      await waitFor(() => {
        expect(screen.queryByText('Select Photos')).not.toBeInTheDocument();
      });
    });
  });

  describe('photo selection', () => {
    it('should call onSelectionChange when photo is selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByAltText('Alt text 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByAltText('Alt text 1'));

      expect(onSelectionChange).toHaveBeenCalledWith(['photo-1']);
    });

    it('should call onSelectionChange when photo is deselected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      const { container } = render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        const images = screen.getAllByAltText('Alt text 1');
        expect(images.length).toBeGreaterThan(0);
      });

      // Click the photo in the modal (second instance)
      const images = screen.getAllByAltText('Alt text 1');
      fireEvent.click(images[images.length - 1]);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should support multiple photo selection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      const { unmount } = render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByAltText('Alt text 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByAltText('Alt text 1'));
      expect(onSelectionChange).toHaveBeenCalledWith(['photo-1']);

      // Clean up first render
      unmount();

      // Simulate re-render with updated selection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      onSelectionChange.mockClear();
      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Add photos from gallery'));

      await waitFor(() => {
        expect(screen.getByAltText('Alt text 2')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByAltText('Alt text 2'));
      expect(onSelectionChange).toHaveBeenCalledWith(['photo-1', 'photo-2']);
    });

    it('should display selected count in modal footer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: { photos: mockPhotos, total: 3 },
        }),
      });

      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('2 photos selected')).toBeInTheDocument();
      });
    });
  });

  describe('clear all functionality', () => {
    it('should call onSelectionChange with empty array when clear all is clicked', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.click(screen.getByText('Clear All'));

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('disabled state', () => {
    it('should disable add photos button when disabled prop is true', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
          disabled={true}
        />
      );

      const button = screen.getByText('+ Add Photos from Gallery');
      expect(button).toBeDisabled();
    });

    it('should disable clear all button when disabled prop is true', () => {
      const onSelectionChange = jest.fn();
      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
          disabled={true}
        />
      );

      const button = screen.getByText('Clear All');
      expect(button).toBeDisabled();
    });
  });
});
