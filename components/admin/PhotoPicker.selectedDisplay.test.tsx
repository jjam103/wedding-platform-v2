/**
 * PhotoPicker Selected Photos Display Tests
 * 
 * Tests the selected photos display functionality in PhotoPicker,
 * including thumbnail display, captions, remove buttons, and clear all.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoPicker } from './PhotoPicker';

// Mock fetch
global.fetch = jest.fn();

describe('PhotoPicker - Selected Photos Display', () => {
  const mockPhotos = [
    {
      id: 'photo-1',
      photo_url: 'https://example.com/photo1.jpg',
      caption: 'Beautiful sunset',
      alt_text: 'Sunset over ocean',
      moderation_status: 'approved' as const,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'photo-2',
      photo_url: 'https://example.com/photo2.jpg',
      caption: 'Mountain view',
      alt_text: 'Snow-capped mountains',
      moderation_status: 'approved' as const,
      created_at: '2024-01-02T00:00:00Z',
    },
    {
      id: 'photo-3',
      photo_url: 'https://example.com/photo3.jpg',
      caption: 'Beach scene',
      moderation_status: 'approved' as const,
      created_at: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Selected Photos Section Display', () => {
    it('should display selected photos section when photos are selected', async () => {
      // Mock API responses for selected photos
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      // Wait for photos to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/photos/photo-1');
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/photos/photo-2');
      });

      // Should show selected photos section
      await waitFor(() => {
        const heading = screen.getByText(/Selected Photos \(2\)/i);
        expect(heading).toBeInTheDocument();
      });
    });

    it('should not display selected photos section when no photos selected', () => {
      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={[]}
          onSelectionChange={onSelectionChange}
        />
      );

      // Should not show selected photos section
      const heading = screen.queryByText(/Selected Photos/i);
      expect(heading).not.toBeInTheDocument();
    });

    it('should display correct photo count', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[2] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2', 'photo-3']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const heading = screen.getByText(/Selected Photos \(3\)/i);
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('Photo Thumbnails Display', () => {
    it('should display thumbnails for selected photos', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should use photo_url field for thumbnails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const image = screen.getByAltText(/Beautiful sunset/i);
        expect(image).toHaveAttribute('src', 'https://example.com/photo1.jpg');
      });
    });

    it('should display photo captions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const caption = screen.getByText('Beautiful sunset');
        expect(caption).toBeInTheDocument();
      });
    });

    it('should handle photos without captions', async () => {
      const photoWithoutCaption = {
        ...mockPhotos[0],
        caption: undefined,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: photoWithoutCaption }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const image = screen.getByAltText(/Sunset over ocean/i);
        expect(image).toBeInTheDocument();
      });

      // Caption should not be displayed
      const caption = screen.queryByText('Beautiful sunset');
      expect(caption).not.toBeInTheDocument();
    });
  });

  describe('Remove Individual Photo', () => {
    it('should display remove button on hover', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove photo');
        expect(removeButton).toBeInTheDocument();
      });
    });

    it('should call onSelectionChange when remove button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const removeButtons = screen.getAllByLabelText('Remove photo');
        expect(removeButtons.length).toBe(2);
      });

      // Click first remove button
      const removeButtons = screen.getAllByLabelText('Remove photo');
      fireEvent.click(removeButtons[0]);

      // Should call onSelectionChange with photo-1 removed
      expect(onSelectionChange).toHaveBeenCalledWith(['photo-2']);
    });

    it('should remove correct photo when multiple photos selected', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[2] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2', 'photo-3']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const removeButtons = screen.getAllByLabelText('Remove photo');
        expect(removeButtons.length).toBe(3);
      });

      // Click second remove button (photo-2)
      const removeButtons = screen.getAllByLabelText('Remove photo');
      fireEvent.click(removeButtons[1]);

      // Should call onSelectionChange with photo-2 removed
      expect(onSelectionChange).toHaveBeenCalledWith(['photo-1', 'photo-3']);
    });

    it('should disable remove button when disabled prop is true', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove photo');
        expect(removeButton).toBeDisabled();
      });
    });
  });

  describe('Clear All Functionality', () => {
    it('should display "Clear All" button when photos selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const clearButton = screen.getByText('Clear All');
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('should call onSelectionChange with empty array when Clear All clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const clearButton = screen.getByText('Clear All');
        expect(clearButton).toBeInTheDocument();
      });

      // Click Clear All button
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      // Should call onSelectionChange with empty array
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('should disable Clear All button when disabled prop is true', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
          disabled={true}
        />
      );

      await waitFor(() => {
        const clearButton = screen.getByText('Clear All');
        expect(clearButton).toBeDisabled();
      });
    });

    it('should clear all photos regardless of count', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[2] }),
        });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2', 'photo-3']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const heading = screen.getByText(/Selected Photos \(3\)/i);
        expect(heading).toBeInTheDocument();
      });

      // Click Clear All
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      // Should clear all 3 photos
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Grid Layout', () => {
    it('should display photos in grid layout', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[0] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[1] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockPhotos[2] }),
        });

      const onSelectionChange = jest.fn();

      const { container } = render(
        <PhotoPicker
          selectedPhotoIds={['photo-1', 'photo-2', 'photo-3']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const grid = container.querySelector('.grid-cols-4');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should maintain aspect ratio for thumbnails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      const { container } = render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const aspectSquare = container.querySelector('.aspect-square');
        expect(aspectSquare).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle failed photo fetch gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should log error but not crash
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch selected photos:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle 404 responses for photos', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Should not crash, just not display the photo
      const heading = screen.queryByText(/Selected Photos/i);
      // Heading might not appear if no photos loaded successfully
      expect(heading).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const removeButton = screen.getByLabelText('Remove photo');
        expect(removeButton).toBeInTheDocument();
      });

      const clearButton = screen.getByLabelText('Clear all selected photos');
      expect(clearButton).toBeInTheDocument();
    });

    it('should have alt text for images', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockPhotos[0] }),
      });

      const onSelectionChange = jest.fn();

      render(
        <PhotoPicker
          selectedPhotoIds={['photo-1']}
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        const image = screen.getByAltText(/Sunset over ocean/i);
        expect(image).toBeInTheDocument();
      });
    });
  });
});
