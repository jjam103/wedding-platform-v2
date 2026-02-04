import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineSectionEditor } from './InlineSectionEditor';

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
  PhotoPicker: ({ selectedPhotoIds, onSelectionChange }: any) => (
    <div data-testid="photo-picker">
      <div>Selected: {selectedPhotoIds.length}</div>
      <button onClick={() => onSelectionChange([...selectedPhotoIds, 'new-photo'])}>
        Add Photo
      </button>
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

// Mock SimpleReferenceSelector
jest.mock('./SimpleReferenceSelector', () => ({
  SimpleReferenceSelector: ({ onSelect }: any) => (
    <button
      data-testid="reference-selector"
      onClick={() => onSelect({ type: 'activity', id: 'activity-1', title: 'Test Activity' })}
    >
      Add Reference
    </button>
  ),
}));

// Mock ReferencePreview
jest.mock('./ReferencePreview', () => ({
  ReferencePreview: ({ reference, onRemove }: any) => (
    <div data-testid="reference-preview">
      <span>{reference.title}</span>
      <button onClick={onRemove}>Remove</button>
    </div>
  ),
}));

// Mock PhotoGallerySkeleton
jest.mock('./PhotoGallerySkeleton', () => ({
  PhotoGallerySkeleton: () => <div>Loading photos...</div>,
}));

describe('InlineSectionEditor', () => {
  const mockFetch = jest.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      expect(screen.getByText('Loading sections...')).toBeInTheDocument();
    });

    it('should render empty state when no sections exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('No sections yet')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Create First Section')).toBeInTheDocument();
    });

    it('should render sections list when sections exist', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSections }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('1 Col')).toBeInTheDocument();
    });

    it('should render error message when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Failed to load' } }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should render compact mode when compact prop is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      const { container } = render(
        <InlineSectionEditor pageType="home" pageId="home" compact={true} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('No sections yet')).toBeInTheDocument();
      });

      const editor = container.querySelector('[data-testid="inline-section-editor"]');
      expect(editor).toHaveClass('text-sm');
    });
  });

  describe('Add Section', () => {
    it('should add a new section when Add Section button is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'new-section',
              title: null,
              display_order: 0,
              columns: [
                {
                  id: 'col-1',
                  column_number: 1,
                  content_type: 'rich_text',
                  content_data: { html: '' },
                },
              ],
            },
          }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('No sections yet')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Section');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should open edit mode for newly created section', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'new-section',
              title: null,
              display_order: 0,
              columns: [
                {
                  id: 'col-1',
                  column_number: 1,
                  content_type: 'rich_text',
                  content_data: { html: '' },
                },
              ],
            },
          }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('No sections yet')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Section');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Section', () => {
    it('should toggle edit mode when Edit button is clicked', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSections }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
    });

    it('should update section title when input changes', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSections }),
      });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Enter a title...');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(titleInput).toHaveValue('Updated Title');
      expect(screen.getByText('1 unsaved')).toBeInTheDocument();
    });

    it('should toggle layout when layout selector changes', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              ...mockSections[0],
              columns: [
                mockSections[0].columns[0],
                {
                  id: 'col-2',
                  column_number: 2,
                  content_type: 'rich_text',
                  content_data: { html: '' },
                },
              ],
            },
          }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Layout:')).toBeInTheDocument();
      });

      const layoutSelect = screen.getByDisplayValue('One Column');
      fireEvent.change(layoutSelect, { target: { value: 'two-column' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections/section-1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });

  describe('Delete Section', () => {
    it('should delete section when Delete button is clicked and confirmed', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      // Mock window.confirm
      global.confirm = jest.fn(() => true);

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections/section-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this section?');
    });

    it('should not delete section when Delete button is clicked and cancelled', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSections }),
      });

      // Mock window.confirm to return false
      global.confirm = jest.fn(() => false);

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Should not call DELETE API
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });
  });

  describe('Save Section', () => {
    it('should save section when Save button is clicked', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections[0] }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
      });

      // Make a change
      const titleInput = screen.getByPlaceholderText('Enter a title...');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections/section-1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should call onSave callback when section is saved', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections[0] }),
        });

      const onSave = jest.fn();
      render(<InlineSectionEditor pageType="home" pageId="home" onSave={onSave} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
      });

      // Make a change
      const titleInput = screen.getByPlaceholderText('Enter a title...');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });

    it('should clear unsaved changes indicator after save', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections[0] }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
      });

      // Make a change
      const titleInput = screen.getByPlaceholderText('Enter a title...');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(screen.getByText('1 unsaved')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('1 unsaved')).not.toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop Reordering', () => {
    it('should reorder sections when dragged and dropped', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Section 1',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Content 1</p>' },
            },
          ],
        },
        {
          id: 'section-2',
          title: 'Section 2',
          display_order: 1,
          columns: [
            {
              id: 'col-2',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Content 2</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { container } = render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Section 1')).toBeInTheDocument();
        expect(screen.getByText('Section 2')).toBeInTheDocument();
      });

      // Simulate drag and drop
      const sections = container.querySelectorAll('[draggable="true"]');
      const firstSection = sections[0];
      const secondSection = sections[1];

      fireEvent.dragStart(firstSection);
      fireEvent.dragOver(secondSection);
      fireEvent.drop(secondSection);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections/reorder',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });
  });

  describe('Column Type Changes', () => {
    it('should change column type when selector changes', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              ...mockSections[0],
              columns: [
                {
                  id: 'col-1',
                  column_number: 1,
                  content_type: 'photo_gallery',
                  content_data: { photo_ids: [], display_mode: 'gallery', autoplaySpeed: 3000, showCaptions: true },
                },
              ],
            },
          }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Rich Text')).toBeInTheDocument();
      });

      const typeSelect = screen.getByDisplayValue('Rich Text');
      fireEvent.change(typeSelect, { target: { value: 'photo_gallery' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/admin/sections/section-1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when save fails', async () => {
      const mockSections = [
        {
          id: 'section-1',
          title: 'Test Section',
          display_order: 0,
          columns: [
            {
              id: 'col-1',
              column_number: 1,
              content_type: 'rich_text',
              content_data: { html: '<p>Test content</p>' },
            },
          ],
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockSections }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: false, error: { message: 'Save failed' } }),
        });

      render(<InlineSectionEditor pageType="home" pageId="home" />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Section')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
      });

      // Make a change
      const titleInput = screen.getByPlaceholderText('Enter a title...');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });
  });
});
