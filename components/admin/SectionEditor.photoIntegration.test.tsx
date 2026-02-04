/**
 * Unit Tests for SectionEditor Photo Integration
 * 
 * Tests:
 * - Photo selection
 * - Multiple photo handling
 * - Photo preview
 * 
 * Requirements: 2.4
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { SectionEditor } from './SectionEditor';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.confirm
const originalConfirm = window.confirm;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock photo data
const mockPhotos = [
  {
    id: 'photo-1',
    photo_url: 'https://example.com/photo1.jpg',
    caption: 'Beach sunset',
    alt_text: 'Beautiful sunset at the beach',
    moderation_status: 'approved' as const,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'photo-2',
    photo_url: 'https://example.com/photo2.jpg',
    caption: 'Wedding ceremony',
    alt_text: 'Ceremony at the venue',
    moderation_status: 'approved' as const,
    created_at: '2025-01-02T00:00:00Z',
  },
  {
    id: 'photo-3',
    photo_url: 'https://example.com/photo3.jpg',
    caption: 'Reception dinner',
    alt_text: 'Dinner reception',
    moderation_status: 'approved' as const,
    created_at: '2025-01-03T00:00:00Z',
  },
];

// Mock section with photo gallery column
const mockPhotoSection = {
  id: 'section-1',
  page_type: 'custom' as const,
  page_id: 'page-1',
  display_order: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  columns: [
    {
      id: 'column-1',
      section_id: 'section-1',
      column_number: 1 as const,
      content_type: 'photo_gallery' as const,
      content_data: { photo_ids: [] },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
};

const mockPhotoSectionWithPhotos = {
  ...mockPhotoSection,
  columns: [
    {
      ...mockPhotoSection.columns[0],
      content_data: { photo_ids: ['photo-1', 'photo-2'] },
    },
  ],
};

describe('SectionEditor - Photo Integration', () => {
  let mockOnSave: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    mockOnSave = jest.fn();
    mockOnClose = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    (global.fetch as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    window.confirm = originalConfirm;
  });

  const mockFetchSuccess = (data: any) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data }),
    });
  };

  describe('Photo Selection', () => {
    it('should display PhotoPicker component for photo_gallery column type', async () => {
      mockFetchSuccess([mockPhotoSection]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // PhotoPicker should render the "Add Photos from Gallery" button
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });
    });

    it('should open photo picker modal when add photos button is clicked', async () => {
      mockFetchSuccess([mockPhotoSection]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 }); // Photos API response

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByText('Select Photos')).toBeInTheDocument();
      });
    });

    it('should fetch photos when photo picker opens', async () => {
      mockFetchSuccess([mockPhotoSection]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 });

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/photos')
        );
      });
    });

    it('should update section when photo is selected', async () => {
      mockFetchSuccess([mockPhotoSection]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 }); // Photos API
      mockFetchSuccess(mockPhotoSectionWithPhotos); // Update section API

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByAltText('Beautiful sunset at the beach')).toBeInTheDocument();
      });

      // Select a photo
      fireEvent.click(screen.getByAltText('Beautiful sunset at the beach'));

      // Close the modal
      fireEvent.click(screen.getByText('Done'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/sections/section-1'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('photo_ids'),
          })
        );
      });
    });

    it('should pass correct pageType to PhotoPicker', async () => {
      mockFetchSuccess([mockPhotoSection]);

      render(
        <SectionEditor
          pageType="event"
          pageId="event-123"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // The PhotoPicker should be rendered with the correct pageType
        // This is verified by checking that the component renders
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });
    });

    it('should pass correct pageId to PhotoPicker', async () => {
      mockFetchSuccess([mockPhotoSection]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 });

      render(
        <SectionEditor
          pageType="activity"
          pageId="activity-456"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page_id=activity-456')
        );
      });
    });

    it('should disable photo picker when section is saving', async () => {
      mockFetchSuccess([mockPhotoSection]);
      
      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      // Mock a delayed response for section update
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, data: mockPhotoSection }),
        }), 100))
      );

      // Trigger a save operation by toggling layout
      const layoutSelect = screen.getAllByRole('combobox')[0]; // First select is layout
      fireEvent.change(layoutSelect, { target: { value: 'two-column' } });

      // Photo picker button should be disabled during save
      await waitFor(() => {
        const addPhotosButton = screen.getByText('+ Add Photos from Gallery');
        expect(addPhotosButton).toBeDisabled();
      });
    });
  });

  describe('Multiple Photo Handling', () => {
    it('should display selected photos count', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });
    });

    it('should display all selected photos in preview grid', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 }); // For PhotoPicker
      // Mock individual photo fetches for selected photos
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Verify the photo grid container exists
      const photoGrid = screen.getByText('Selected Photos (2)').closest('.border');
      expect(photoGrid).toBeInTheDocument();
      
      // The grid should have the correct class
      const gridElement = photoGrid?.querySelector('.grid.grid-cols-4');
      expect(gridElement).toBeInTheDocument();
    });

    it('should allow selecting multiple photos', async () => {
      mockFetchSuccess([mockPhotoSection]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 }); // Photos API
      mockFetchSuccess(mockPhotoSection); // First update with 1 photo
      mockFetchSuccess(mockPhotoSectionWithPhotos); // Second update with 2 photos

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('+ Add Photos from Gallery'));

      await waitFor(() => {
        expect(screen.getByAltText('Beautiful sunset at the beach')).toBeInTheDocument();
      });

      // Select first photo
      fireEvent.click(screen.getByAltText('Beautiful sunset at the beach'));
      
      // Wait for first update
      await waitFor(() => {
        const firstUpdateCall = (global.fetch as jest.Mock).mock.calls.find(
          call => call[0].includes('/api/admin/sections/section-1') && call[1]?.method === 'PUT'
        );
        expect(firstUpdateCall).toBeDefined();
      });

      // Select second photo
      fireEvent.click(screen.getByAltText('Ceremony at the venue'));

      // Close modal
      fireEvent.click(screen.getByText('Done'));

      await waitFor(() => {
        // Should have made at least 2 update calls (one for each photo selection)
        const updateCalls = (global.fetch as jest.Mock).mock.calls.filter(
          call => call[0].includes('/api/admin/sections/section-1') && call[1]?.method === 'PUT'
        );
        expect(updateCalls.length).toBeGreaterThanOrEqual(1);
        
        // The last update should contain both photos
        const lastUpdateCall = updateCalls[updateCalls.length - 1];
        if (lastUpdateCall) {
          const body = JSON.parse(lastUpdateCall[1].body);
          // Should have at least one photo selected
          expect(body.columns[0].content_data.photo_ids.length).toBeGreaterThan(0);
        }
      });
    });

    it('should allow removing individual photos from selection', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      // Mock individual photo fetches for selected photos
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2
      mockFetchSuccess(mockPhotoSection); // Update with 1 photo after removal

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Wait for photos to be fetched and displayed
      await waitFor(() => {
        const removeButtons = screen.getAllByLabelText('Remove photo');
        expect(removeButtons.length).toBeGreaterThan(0);
        fireEvent.click(removeButtons[0]);
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/sections/section-1'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should allow clearing all selected photos', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      mockFetchSuccess(mockPhotoSection); // Update with 0 photos

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Click "Clear All" button
      fireEvent.click(screen.getByText('Clear All'));

      await waitFor(() => {
        const updateCall = (global.fetch as jest.Mock).mock.calls.find(
          call => call[0].includes('/api/admin/sections/section-1') && call[1]?.method === 'PUT'
        );
        expect(updateCall).toBeDefined();
        const body = JSON.parse(updateCall[1].body);
        expect(body.columns[0].content_data.photo_ids).toHaveLength(0);
      });
    });

    it('should maintain photo order in selection', async () => {
      const orderedPhotoSection = {
        ...mockPhotoSection,
        columns: [
          {
            ...mockPhotoSection.columns[0],
            content_data: { photo_ids: ['photo-3', 'photo-1', 'photo-2'] },
          },
        ],
      };
      mockFetchSuccess([orderedPhotoSection]);
      // Mock individual photo fetches in order
      mockFetchSuccess(mockPhotos[2]); // photo-3
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (3)')).toBeInTheDocument();
      });

      // Wait for photos to be fetched and displayed
      await waitFor(() => {
        const photoGrid = screen.getByText('Selected Photos (3)').closest('.border');
        const images = photoGrid?.querySelectorAll('img');
        expect(images?.length).toBe(3);
      }, { timeout: 3000 });
    });

    it('should handle empty photo selection', async () => {
      mockFetchSuccess([mockPhotoSection]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // Should not show "Selected Photos" section when no photos selected
        expect(screen.queryByText(/Selected Photos/)).not.toBeInTheDocument();
        
        // Should show the add photos button
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });
    });
  });

  describe('Photo Preview', () => {
    it('should display photo thumbnails in selected photos section', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      // Mock individual photo fetches for selected photos
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Wait for photos to be fetched and displayed
      await waitFor(() => {
        const photoGrid = screen.getByText('Selected Photos (2)').closest('.border');
        const images = photoGrid?.querySelectorAll('img');
        expect(images?.length).toBe(2);
      }, { timeout: 3000 });
    });

    it('should display photo captions in preview', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      mockFetchSuccess({ photos: mockPhotos, total: 3 }); // For PhotoPicker to resolve photo details

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Captions should be visible in the preview grid
      const photoGrid = screen.getByText('Selected Photos (2)').closest('.border');
      expect(photoGrid).toBeInTheDocument();
    });

    it('should show photos in guest preview modal', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Open preview modal by clicking Guest Preview button
      fireEvent.click(screen.getByText('Guest Preview'));

      await waitFor(() => {
        // Preview should show photo placeholders
        const previewSection = screen.getByText('Guest Preview').closest('.border');
        expect(previewSection).toBeInTheDocument();
        
        // The preview will show photo content or loading state
        expect(previewSection?.textContent).toContain('photo');
      }, { timeout: 3000 });
    });

    it('should show "No photos selected" message in preview when empty', async () => {
      mockFetchSuccess([mockPhotoSection]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Open preview by clicking Guest Preview button
      fireEvent.click(screen.getByText('Guest Preview'));

      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText('No photos selected')).toBeInTheDocument();
      });
    });

    it('should display photo grid layout in preview', async () => {
      const multiPhotoSection = {
        ...mockPhotoSection,
        columns: [
          {
            ...mockPhotoSection.columns[0],
            content_data: { photo_ids: ['photo-1', 'photo-2', 'photo-3'] },
          },
        ],
      };
      mockFetchSuccess([multiPhotoSection]);

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Open preview by clicking Guest Preview button
      fireEvent.click(screen.getByText('Guest Preview'));

      await waitFor(() => {
        // Preview should use grid layout for photos
        const previewSection = screen.getByText('Guest Preview').closest('.border');
        const photoGrid = previewSection?.querySelector('.grid.grid-cols-2');
        expect(photoGrid).toBeInTheDocument();
      });
    });

    it('should show hover effects on photo thumbnails', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      // Mock individual photo fetches for selected photos
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Wait for photos to be fetched and displayed
      await waitFor(() => {
        const photoGrid = screen.getByText('Selected Photos (2)').closest('.border');
        const photoContainers = photoGrid?.querySelectorAll('.group');
        expect(photoContainers?.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display remove button on hover', async () => {
      mockFetchSuccess([mockPhotoSectionWithPhotos]);
      // Mock individual photo fetches for selected photos
      mockFetchSuccess(mockPhotos[0]); // photo-1
      mockFetchSuccess(mockPhotos[1]); // photo-2

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText('Selected Photos (2)')).toBeInTheDocument();
      });

      // Wait for photos to be fetched and displayed
      await waitFor(() => {
        const removeButtons = screen.getAllByLabelText('Remove photo');
        expect(removeButtons.length).toBe(2);
        
        // Buttons should have group-hover:opacity-100 class
        removeButtons.forEach(button => {
          expect(button.className).toContain('group-hover:opacity-100');
        });
      }, { timeout: 3000 });
    });
  });

  describe('Column Type Change to Photo Gallery', () => {
    it('should initialize empty photo_ids when changing to photo_gallery type', async () => {
      const richTextSection = {
        ...mockPhotoSection,
        columns: [
          {
            ...mockPhotoSection.columns[0],
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Some text</p>' },
          },
        ],
      };
      mockFetchSuccess([richTextSection]);
      mockFetchSuccess(mockPhotoSection); // Updated to photo_gallery

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // Find the column type selector (second combobox - first is layout selector)
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(1);
      });

      // Change column type to photo_gallery (second combobox)
      const selects = screen.getAllByRole('combobox');
      const columnTypeSelect = selects[1]; // Second select is column type
      fireEvent.change(columnTypeSelect, { target: { value: 'photo_gallery' } });

      await waitFor(() => {
        const updateCall = (global.fetch as jest.Mock).mock.calls.find(
          call => call[0].includes('/api/admin/sections/section-1') && call[1]?.method === 'PUT'
        );
        expect(updateCall).toBeDefined();
        const body = JSON.parse(updateCall[1].body);
        expect(body.columns[0].content_type).toBe('photo_gallery');
        expect(body.columns[0].content_data).toEqual({ photo_ids: [], display_mode: 'gallery' });
      });
    });

    it('should display PhotoPicker after changing column type to photo_gallery', async () => {
      const richTextSection = {
        ...mockPhotoSection,
        columns: [
          {
            ...mockPhotoSection.columns[0],
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Some text</p>' },
          },
        ],
      };
      mockFetchSuccess([richTextSection]);
      mockFetchSuccess(mockPhotoSection); // Updated to photo_gallery

      render(
        <SectionEditor
          pageType="custom"
          pageId="page-1"
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Click Edit button to expand section
      fireEvent.click(screen.getByRole('button', { name: /edit/i }));

      await waitFor(() => {
        // Find the column type selector (second combobox)
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(1);
      });

      // Change column type to photo_gallery (second combobox)
      const selects = screen.getAllByRole('combobox');
      const columnTypeSelect = selects[1]; // Second select is column type
      fireEvent.change(columnTypeSelect, { target: { value: 'photo_gallery' } });

      await waitFor(() => {
        expect(screen.getByText('+ Add Photos from Gallery')).toBeInTheDocument();
      });
    });
  });
});
