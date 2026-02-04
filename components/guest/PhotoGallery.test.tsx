import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PhotoGallery } from './PhotoGallery';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, className, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPhotos = [
  {
    id: 'photo-1',
    photo_url: 'https://example.com/photo1.jpg',
    caption: 'Beautiful sunset',
    alt_text: 'Sunset over the ocean',
  },
  {
    id: 'photo-2',
    photo_url: 'https://example.com/photo2.jpg',
    caption: 'Mountain view',
    alt_text: 'Mountains at dawn',
  },
  {
    id: 'photo-3',
    photo_url: 'https://example.com/photo3.jpg',
    caption: 'Beach scene',
    alt_text: 'Sandy beach',
  },
];

describe('PhotoGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching photos', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<PhotoGallery photoIds={['photo-1']} />);

      // Check for loading skeleton by class instead of role
      const loadingSkeleton = document.querySelector('.animate-pulse');
      expect(loadingSkeleton).toBeInTheDocument();
      expect(loadingSkeleton).toHaveClass('animate-pulse');
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<PhotoGallery photoIds={['photo-1']} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load photos')).toBeInTheDocument();
      });
    });

    it('should handle individual photo fetch failures gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ success: false }),
        });

      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      // Should only show the successfully fetched photo
      expect(screen.queryByAltText('Mountains at dawn')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render nothing when photoIds is empty', async () => {
      render(<PhotoGallery photoIds={[]} />);

      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    it('should render nothing when no photoIds provided', async () => {
      render(<PhotoGallery photoIds={[]} />);

      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });
  });

  describe('Gallery Mode', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const photoId = url.split('/').pop();
        const photo = mockPhotos.find((p) => p.id === photoId);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: photo }),
        });
      });
    });

    it('should display photos in grid layout', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} displayMode="gallery" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
        expect(screen.getByAltText('Mountains at dawn')).toBeInTheDocument();
        expect(screen.getByAltText('Sandy beach')).toBeInTheDocument();
      });
    });

    it('should display captions for photos', async () => {
      render(<PhotoGallery photoIds={['photo-1']} displayMode="gallery" />);

      await waitFor(() => {
        expect(screen.getByText('Beautiful sunset')).toBeInTheDocument();
      });
    });

    it('should use alt text when provided', async () => {
      render(<PhotoGallery photoIds={['photo-1']} displayMode="gallery" />);

      await waitFor(() => {
        const img = screen.getByAltText('Sunset over the ocean');
        expect(img).toBeInTheDocument();
      });
    });
  });

  describe('Carousel Mode', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const photoId = url.split('/').pop();
        const photo = mockPhotos.find((p) => p.id === photoId);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: photo }),
        });
      });
    });

    it('should display first photo initially', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      expect(screen.queryByAltText('Mountains at dawn')).not.toBeInTheDocument();
    });

    it('should show navigation buttons when multiple photos', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Previous photo')).toBeInTheDocument();
        expect(screen.getByLabelText('Next photo')).toBeInTheDocument();
      });
    });

    it('should navigate to next photo when next button clicked', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText('Next photo');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByAltText('Mountains at dawn')).toBeInTheDocument();
      });
    });

    it('should navigate to previous photo when previous button clicked', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText('Previous photo');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByAltText('Mountains at dawn')).toBeInTheDocument();
      });
    });

    it('should show dot indicators for navigation', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} displayMode="carousel" />);

      await waitFor(() => {
        const dots = screen.getAllByLabelText(/Go to photo \d+/);
        expect(dots).toHaveLength(3);
      });
    });

    it('should navigate to specific photo when dot clicked', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      const thirdDot = screen.getByLabelText('Go to photo 3');
      fireEvent.click(thirdDot);

      await waitFor(() => {
        expect(screen.getByAltText('Sandy beach')).toBeInTheDocument();
      });
    });
  });

  describe('Loop Mode', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const photoId = url.split('/').pop();
        const photo = mockPhotos.find((p) => p.id === photoId);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: photo }),
        });
      });
    });

    it('should display first photo initially', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="loop" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });
    });

    it('should auto-advance to next photo after 3 seconds', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="loop" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByAltText('Mountains at dawn')).toBeInTheDocument();
      });
    });

    it('should loop back to first photo after last photo', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="loop" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      // Advance through all photos
      jest.advanceTimersByTime(3000); // Photo 2
      jest.advanceTimersByTime(3000); // Back to photo 1

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });
    });

    it('should show progress indicators', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} displayMode="loop" />);

      await waitFor(() => {
        // Find progress indicators by class instead of role
        const indicators = document.querySelectorAll('.h-1');
        expect(indicators.length).toBe(3);
      });
    });

    it('should not auto-advance with single photo', async () => {
      render(<PhotoGallery photoIds={['photo-1']} displayMode="loop" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(5000);

      // Should still show the same photo
      expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
    });
  });

  describe('Photo Fetching', () => {
    it('should fetch photos from correct API endpoint', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      render(<PhotoGallery photoIds={['photo-1']} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/photos/photo-1');
      });
    });

    it('should fetch multiple photos in parallel', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    it('should filter out failed photo fetches', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[2] }),
        });

      render(<PhotoGallery photoIds={['photo-1', 'photo-2', 'photo-3']} displayMode="gallery" />);

      await waitFor(() => {
        expect(screen.getByAltText('Sunset over the ocean')).toBeInTheDocument();
        expect(screen.getByAltText('Sandy beach')).toBeInTheDocument();
      });

      expect(screen.queryByAltText('Mountains at dawn')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const photoId = url.split('/').pop();
        const photo = mockPhotos.find((p) => p.id === photoId);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: photo }),
        });
      });
    });

    it('should have accessible navigation buttons in carousel mode', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous photo');
        const nextButton = screen.getByLabelText('Next photo');
        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
      });
    });

    it('should have accessible dot navigation in carousel mode', async () => {
      render(<PhotoGallery photoIds={['photo-1', 'photo-2']} displayMode="carousel" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Go to photo 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Go to photo 2')).toBeInTheDocument();
      });
    });

    it('should use alt text for images', async () => {
      render(<PhotoGallery photoIds={['photo-1']} />);

      await waitFor(() => {
        const img = screen.getByAltText('Sunset over the ocean');
        expect(img).toHaveAttribute('alt', 'Sunset over the ocean');
      });
    });

    it('should fallback to caption for alt text when alt_text not provided', async () => {
      const photoWithoutAlt = {
        id: 'photo-4',
        photo_url: 'https://example.com/photo4.jpg',
        caption: 'Test caption',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: photoWithoutAlt }),
      });

      render(<PhotoGallery photoIds={['photo-4']} />);

      await waitFor(() => {
        const img = screen.getByAltText('Test caption');
        expect(img).toBeInTheDocument();
      });
    });
  });
});
