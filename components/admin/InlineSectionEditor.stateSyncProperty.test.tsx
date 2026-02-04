import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { InlineSectionEditor } from './InlineSectionEditor';

/**
 * Property-Based Test for InlineSectionEditor State Synchronization
 * 
 * **Feature: admin-ux-enhancements, Property 3: Inline Section Editor State Sync**
 * 
 * **Validates: Requirements 3.2, 3.3**
 * 
 * Property: For any section edit operation in the InlineSectionEditor, 
 * the changes should be immediately reflected in the section list without 
 * requiring a page refresh.
 * 
 * This property ensures that:
 * 1. Title changes are immediately visible in the section header
 * 2. Layout changes are immediately reflected in the column count display
 * 3. Content changes mark the section as having unsaved changes
 * 4. The UI state remains consistent with the data state
 */

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

describe('Feature: admin-ux-enhancements, Property 3: Inline Section Editor State Sync', () => {
  const mockFetch = jest.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Arbitrary for generating section titles
  const sectionTitleArbitrary = fc.string({ minLength: 1, maxLength: 100 });

  // Arbitrary for generating section IDs
  const sectionIdArbitrary = fc.uuid();

  // Arbitrary for generating column content
  const richTextContentArbitrary = fc.string({ minLength: 0, maxLength: 500 });

  it('should immediately reflect title changes in section header without page refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectionIdArbitrary,
        sectionTitleArbitrary,
        sectionTitleArbitrary,
        async (sectionId, initialTitle, newTitle) => {
          // Skip if titles are the same
          if (initialTitle === newTitle) {
            return true;
          }

          const mockSection = {
            id: sectionId,
            title: initialTitle,
            display_order: 0,
            columns: [
              {
                id: 'col-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Test content</p>' },
              },
            ],
          };

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: [mockSection] }),
          });

          const { unmount } = render(<InlineSectionEditor pageType="home" pageId="home" />);
          
          // Wait for initial render
          await waitFor(() => {
            expect(screen.getByText(initialTitle)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Open edit mode
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);

          await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Change the title
          const titleInput = screen.getByPlaceholderText('Enter a title...');
          fireEvent.change(titleInput, { target: { value: newTitle } });

          // Verify the new title is immediately visible in the section header
          await waitFor(() => {
            expect(screen.getByText(newTitle)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify the old title is no longer visible
          expect(screen.queryByText(initialTitle)).not.toBeInTheDocument();

          // Verify unsaved changes indicator appears
          expect(screen.getByText('1 unsaved')).toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });

  it('should immediately reflect layout changes in column count display without page refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectionIdArbitrary,
        sectionTitleArbitrary,
        async (sectionId, title) => {
          const mockSection = {
            id: sectionId,
            title,
            display_order: 0,
            columns: [
              {
                id: 'col-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Test content</p>' },
              },
            ],
          };

          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true, data: [mockSection] }),
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                data: {
                  ...mockSection,
                  columns: [
                    mockSection.columns[0],
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

          const { unmount } = render(<InlineSectionEditor pageType="home" pageId="home" />);
          
          // Wait for initial render
          await waitFor(() => {
            expect(screen.getByText('1 Col')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Open edit mode
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);

          await waitFor(() => {
            expect(screen.getByText('Layout:')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Change layout to two columns
          const layoutSelect = screen.getByDisplayValue('One Column');
          fireEvent.change(layoutSelect, { target: { value: 'two-column' } });

          // Verify the column count is immediately updated in the header
          await waitFor(() => {
            expect(screen.getByText('2 Cols')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify the old column count is no longer visible
          expect(screen.queryByText('1 Col')).not.toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });

  it('should immediately mark section as unsaved when content changes without page refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectionIdArbitrary,
        sectionTitleArbitrary,
        richTextContentArbitrary,
        async (sectionId, title, newContent) => {
          const mockSection = {
            id: sectionId,
            title,
            display_order: 0,
            columns: [
              {
                id: 'col-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Original content</p>' },
              },
            ],
          };

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: [mockSection] }),
          });

          const { unmount } = render(<InlineSectionEditor pageType="home" pageId="home" />);
          
          // Wait for initial render
          await waitFor(() => {
            expect(screen.getByText(title)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify no unsaved changes initially
          expect(screen.queryByText('1 unsaved')).not.toBeInTheDocument();

          // Open edit mode
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);

          await waitFor(() => {
            expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Change the content
          const editor = screen.getByTestId('rich-text-editor');
          fireEvent.change(editor, { target: { value: newContent } });

          // Verify unsaved changes indicator appears immediately
          await waitFor(() => {
            expect(screen.getByText('1 unsaved')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify the unsaved indicator is visible in the section header
          expect(screen.getByText('Unsaved')).toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });

  it('should maintain consistent state across multiple edit operations without page refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectionIdArbitrary,
        fc.array(sectionTitleArbitrary, { minLength: 2, maxLength: 5 }),
        async (sectionId, titleSequence) => {
          const mockSection = {
            id: sectionId,
            title: titleSequence[0],
            display_order: 0,
            columns: [
              {
                id: 'col-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Test content</p>' },
              },
            ],
          };

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: [mockSection] }),
          });

          const { unmount } = render(<InlineSectionEditor pageType="home" pageId="home" />);
          
          // Wait for initial render
          await waitFor(() => {
            expect(screen.getByText(titleSequence[0])).toBeInTheDocument();
          }, { timeout: 3000 });

          // Open edit mode
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);

          await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Apply each title change in sequence
          const titleInput = screen.getByPlaceholderText('Enter a title...');
          
          for (let i = 1; i < titleSequence.length; i++) {
            const newTitle = titleSequence[i];
            
            // Change the title
            fireEvent.change(titleInput, { target: { value: newTitle } });

            // Verify the new title is immediately visible
            await waitFor(() => {
              expect(screen.getByText(newTitle)).toBeInTheDocument();
            }, { timeout: 3000 });

            // Verify the previous title is no longer visible (unless it's the same)
            if (titleSequence[i - 1] !== newTitle) {
              expect(screen.queryByText(titleSequence[i - 1])).not.toBeInTheDocument();
            }

            // Verify unsaved changes indicator is present
            expect(screen.getByText('1 unsaved')).toBeInTheDocument();
          }

          unmount();
          return true;
        }
      ),
      { numRuns: 15, timeout: 15000 }
    );
  });

  it('should clear unsaved changes indicator after successful save without page refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        sectionIdArbitrary,
        sectionTitleArbitrary,
        sectionTitleArbitrary,
        async (sectionId, initialTitle, newTitle) => {
          // Skip if titles are the same
          if (initialTitle === newTitle) {
            return true;
          }

          const mockSection = {
            id: sectionId,
            title: initialTitle,
            display_order: 0,
            columns: [
              {
                id: 'col-1',
                column_number: 1,
                content_type: 'rich_text',
                content_data: { html: '<p>Test content</p>' },
              },
            ],
          };

          mockFetch
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({ success: true, data: [mockSection] }),
            })
            .mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                success: true,
                data: { ...mockSection, title: newTitle },
              }),
            });

          const { unmount } = render(<InlineSectionEditor pageType="home" pageId="home" />);
          
          // Wait for initial render
          await waitFor(() => {
            expect(screen.getByText(initialTitle)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Open edit mode
          const editButton = screen.getByText('Edit');
          fireEvent.click(editButton);

          await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter a title...')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Change the title
          const titleInput = screen.getByPlaceholderText('Enter a title...');
          fireEvent.change(titleInput, { target: { value: newTitle } });

          // Verify unsaved changes indicator appears
          await waitFor(() => {
            expect(screen.getByText('1 unsaved')).toBeInTheDocument();
          }, { timeout: 3000 });

          // Save the section
          const saveButton = screen.getByText('Save');
          fireEvent.click(saveButton);

          // Verify unsaved changes indicator is cleared after save
          await waitFor(() => {
            expect(screen.queryByText('1 unsaved')).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // Verify the new title is still visible
          expect(screen.getByText(newTitle)).toBeInTheDocument();

          unmount();
          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  });
});
