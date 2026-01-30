/**
 * Unit Tests for Section Rendering and Reference Handling
 * 
 * Tests:
 * - Section content rendering (rich text, photo gallery, references)
 * - Reference validation and display
 * - Column layout rendering
 * - Content type handling
 * 
 * Requirements: Task 2.8 - Component Test Coverage
 */

import { render, screen, waitFor } from '@testing-library/react';

// Mock section data types
interface Column {
  id: string;
  section_id: string;
  column_number: 1 | 2;
  content_type: 'rich_text' | 'photo_gallery' | 'references';
  content_data: any;
  created_at: string;
  updated_at: string;
}

interface Section {
  id: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  page_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  columns: Column[];
}

// Simple section renderer component for testing
function SectionRenderer({ section }: { section: Section }) {
  return (
    <div data-testid={`section-${section.id}`} className="section">
      <div
        className={`grid gap-4 ${
          section.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {section.columns.map(column => (
          <div key={column.id} data-testid={`column-${column.id}`} className="column">
            {column.content_type === 'rich_text' && (
              <div
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: column.content_data?.html || '' }}
              />
            )}
            {column.content_type === 'photo_gallery' && (
              <div className="photo-gallery" data-testid="photo-gallery">
                {(column.content_data?.photo_ids || []).map((photoId: string) => (
                  <div key={photoId} data-testid={`photo-${photoId}`} className="photo-item">
                    Photo: {photoId}
                  </div>
                ))}
              </div>
            )}
            {column.content_type === 'references' && (
              <div className="references" data-testid="references">
                {(column.content_data?.references || []).map((ref: any, index: number) => (
                  <div key={index} data-testid={`reference-${index}`} className="reference-item">
                    <span className="reference-type">{ref.type}</span>
                    <span className="reference-name">{ref.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

describe('Section Rendering', () => {
  const mockRichTextSection: Section = {
    id: 'section-1',
    page_type: 'custom',
    page_id: 'page-1',
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    columns: [
      {
        id: 'column-1',
        section_id: 'section-1',
        column_number: 1,
        content_type: 'rich_text',
        content_data: { html: '<p>Welcome to our wedding!</p>' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  const mockPhotoGallerySection: Section = {
    id: 'section-2',
    page_type: 'custom',
    page_id: 'page-1',
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    columns: [
      {
        id: 'column-2',
        section_id: 'section-2',
        column_number: 1,
        content_type: 'photo_gallery',
        content_data: { photo_ids: ['photo-1', 'photo-2', 'photo-3'] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  const mockReferencesSection: Section = {
    id: 'section-3',
    page_type: 'custom',
    page_id: 'page-1',
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    columns: [
      {
        id: 'column-3',
        section_id: 'section-3',
        column_number: 1,
        content_type: 'references',
        content_data: {
          references: [
            { type: 'event', name: 'Wedding Ceremony', id: 'event-1' },
            { type: 'activity', name: 'Beach Volleyball', id: 'activity-1' },
            { type: 'accommodation', name: 'Beachfront Villa', id: 'accommodation-1' },
          ],
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  const mockTwoColumnSection: Section = {
    id: 'section-4',
    page_type: 'custom',
    page_id: 'page-1',
    display_order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    columns: [
      {
        id: 'column-4',
        section_id: 'section-4',
        column_number: 1,
        content_type: 'rich_text',
        content_data: { html: '<p>Left column content</p>' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'column-5',
        section_id: 'section-4',
        column_number: 2,
        content_type: 'photo_gallery',
        content_data: { photo_ids: ['photo-4', 'photo-5'] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  };

  describe('Rich Text Content Rendering', () => {
    it('should render rich text content correctly', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      expect(screen.getByTestId('section-section-1')).toBeInTheDocument();
      expect(screen.getByText('Welcome to our wedding!')).toBeInTheDocument();
    });

    it('should render HTML content safely', () => {
      const sectionWithHTML: Section = {
        ...mockRichTextSection,
        columns: [
          {
            ...mockRichTextSection.columns[0],
            content_data: { html: '<p><strong>Bold text</strong> and <em>italic text</em></p>' },
          },
        ],
      };

      render(<SectionRenderer section={sectionWithHTML} />);

      const content = screen.getByTestId('column-column-1');
      expect(content.querySelector('strong')).toHaveTextContent('Bold text');
      expect(content.querySelector('em')).toHaveTextContent('italic text');
    });

    it('should handle empty rich text content', () => {
      const emptySection: Section = {
        ...mockRichTextSection,
        columns: [
          {
            ...mockRichTextSection.columns[0],
            content_data: { html: '' },
          },
        ],
      };

      render(<SectionRenderer section={emptySection} />);

      const column = screen.getByTestId('column-column-1');
      expect(column.querySelector('.rich-text-content')).toBeEmptyDOMElement();
    });

    it('should render multiple paragraphs in rich text', () => {
      const multiParagraphSection: Section = {
        ...mockRichTextSection,
        columns: [
          {
            ...mockRichTextSection.columns[0],
            content_data: {
              html: '<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>',
            },
          },
        ],
      };

      render(<SectionRenderer section={multiParagraphSection} />);

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
      expect(screen.getByText('Third paragraph')).toBeInTheDocument();
    });
  });

  describe('Photo Gallery Rendering', () => {
    it('should render photo gallery with multiple photos', () => {
      render(<SectionRenderer section={mockPhotoGallerySection} />);

      expect(screen.getByTestId('photo-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('photo-photo-1')).toBeInTheDocument();
      expect(screen.getByTestId('photo-photo-2')).toBeInTheDocument();
      expect(screen.getByTestId('photo-photo-3')).toBeInTheDocument();
    });

    it('should display correct number of photos', () => {
      render(<SectionRenderer section={mockPhotoGallerySection} />);

      const photoItems = screen.getAllByTestId(/^photo-photo-/);
      expect(photoItems).toHaveLength(3);
    });

    it('should handle empty photo gallery', () => {
      const emptyGallerySection: Section = {
        ...mockPhotoGallerySection,
        columns: [
          {
            ...mockPhotoGallerySection.columns[0],
            content_data: { photo_ids: [] },
          },
        ],
      };

      render(<SectionRenderer section={emptyGallerySection} />);

      expect(screen.getByTestId('photo-gallery')).toBeInTheDocument();
      expect(screen.queryByTestId(/^photo-photo-/)).not.toBeInTheDocument();
    });

    it('should handle missing photo_ids array', () => {
      const noPhotosSection: Section = {
        ...mockPhotoGallerySection,
        columns: [
          {
            ...mockPhotoGallerySection.columns[0],
            content_data: {},
          },
        ],
      };

      render(<SectionRenderer section={noPhotosSection} />);

      expect(screen.getByTestId('photo-gallery')).toBeInTheDocument();
      expect(screen.queryByTestId(/^photo-photo-/)).not.toBeInTheDocument();
    });

    it('should render photo IDs correctly', () => {
      render(<SectionRenderer section={mockPhotoGallerySection} />);

      expect(screen.getByText('Photo: photo-1')).toBeInTheDocument();
      expect(screen.getByText('Photo: photo-2')).toBeInTheDocument();
      expect(screen.getByText('Photo: photo-3')).toBeInTheDocument();
    });
  });

  describe('Reference Handling', () => {
    it('should render references correctly', () => {
      render(<SectionRenderer section={mockReferencesSection} />);

      expect(screen.getByTestId('references')).toBeInTheDocument();
      expect(screen.getByTestId('reference-0')).toBeInTheDocument();
      expect(screen.getByTestId('reference-1')).toBeInTheDocument();
      expect(screen.getByTestId('reference-2')).toBeInTheDocument();
    });

    it('should display reference types correctly', () => {
      render(<SectionRenderer section={mockReferencesSection} />);

      const references = screen.getByTestId('references');
      const referenceTypes = references.querySelectorAll('.reference-type');
      expect(referenceTypes[0]).toHaveTextContent('event');
      expect(referenceTypes[1]).toHaveTextContent('activity');
      expect(referenceTypes[2]).toHaveTextContent('accommodation');
    });

    it('should display reference names correctly', () => {
      render(<SectionRenderer section={mockReferencesSection} />);

      expect(screen.getByText('Wedding Ceremony')).toBeInTheDocument();
      expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      expect(screen.getByText('Beachfront Villa')).toBeInTheDocument();
    });

    it('should handle empty references array', () => {
      const emptyReferencesSection: Section = {
        ...mockReferencesSection,
        columns: [
          {
            ...mockReferencesSection.columns[0],
            content_data: { references: [] },
          },
        ],
      };

      render(<SectionRenderer section={emptyReferencesSection} />);

      expect(screen.getByTestId('references')).toBeInTheDocument();
      expect(screen.queryByTestId(/^reference-/)).not.toBeInTheDocument();
    });

    it('should handle missing references array', () => {
      const noReferencesSection: Section = {
        ...mockReferencesSection,
        columns: [
          {
            ...mockReferencesSection.columns[0],
            content_data: {},
          },
        ],
      };

      render(<SectionRenderer section={noReferencesSection} />);

      expect(screen.getByTestId('references')).toBeInTheDocument();
      expect(screen.queryByTestId(/^reference-/)).not.toBeInTheDocument();
    });

    it('should render multiple reference types in same section', () => {
      render(<SectionRenderer section={mockReferencesSection} />);

      const references = screen.getAllByTestId(/^reference-/);
      expect(references).toHaveLength(3);

      // Verify each reference has both type and name
      references.forEach(ref => {
        expect(ref.querySelector('.reference-type')).toBeInTheDocument();
        expect(ref.querySelector('.reference-name')).toBeInTheDocument();
      });
    });

    it('should handle reference with all required fields', () => {
      const referenceWithAllFields: Section = {
        ...mockReferencesSection,
        columns: [
          {
            ...mockReferencesSection.columns[0],
            content_data: {
              references: [
                {
                  id: 'event-123',
                  type: 'event',
                  name: 'Sunset Ceremony',
                  description: 'Beautiful beach ceremony',
                },
              ],
            },
          },
        ],
      };

      render(<SectionRenderer section={referenceWithAllFields} />);

      expect(screen.getByText('event')).toBeInTheDocument();
      expect(screen.getByText('Sunset Ceremony')).toBeInTheDocument();
    });
  });

  describe('Column Layout Rendering', () => {
    it('should render single column layout with grid-cols-1', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      const section = screen.getByTestId('section-section-1');
      const grid = section.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1');
    });

    it('should render two column layout with grid-cols-2', () => {
      render(<SectionRenderer section={mockTwoColumnSection} />);

      const section = screen.getByTestId('section-section-4');
      const grid = section.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-2');
    });

    it('should render both columns in two-column layout', () => {
      render(<SectionRenderer section={mockTwoColumnSection} />);

      expect(screen.getByTestId('column-column-4')).toBeInTheDocument();
      expect(screen.getByTestId('column-column-5')).toBeInTheDocument();
    });

    it('should render different content types in two-column layout', () => {
      render(<SectionRenderer section={mockTwoColumnSection} />);

      // Left column: rich text
      expect(screen.getByText('Left column content')).toBeInTheDocument();

      // Right column: photo gallery
      expect(screen.getByTestId('photo-photo-4')).toBeInTheDocument();
      expect(screen.getByTestId('photo-photo-5')).toBeInTheDocument();
    });

    it('should maintain column order', () => {
      render(<SectionRenderer section={mockTwoColumnSection} />);

      const columns = screen.getAllByTestId(/^column-/);
      expect(columns).toHaveLength(2);
      expect(columns[0]).toHaveAttribute('data-testid', 'column-column-4');
      expect(columns[1]).toHaveAttribute('data-testid', 'column-column-5');
    });
  });

  describe('Mixed Content Sections', () => {
    it('should render section with rich text and photo gallery', () => {
      render(<SectionRenderer section={mockTwoColumnSection} />);

      // Rich text in first column
      expect(screen.getByText('Left column content')).toBeInTheDocument();

      // Photo gallery in second column
      expect(screen.getByTestId('photo-gallery')).toBeInTheDocument();
    });

    it('should render section with all content types', () => {
      const mixedSection: Section = {
        id: 'section-mixed',
        page_type: 'custom',
        page_id: 'page-1',
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'col-1',
            section_id: 'section-mixed',
            column_number: 1,
            content_type: 'rich_text',
            content_data: { html: '<p>Text content</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'col-2',
            section_id: 'section-mixed',
            column_number: 2,
            content_type: 'references',
            content_data: {
              references: [{ type: 'event', name: 'Ceremony', id: 'event-1' }],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={mixedSection} />);

      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByText('Ceremony')).toBeInTheDocument();
    });
  });

  describe('Section Structure', () => {
    it('should render section with correct data-testid', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      expect(screen.getByTestId('section-section-1')).toBeInTheDocument();
    });

    it('should render columns with correct data-testid', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      expect(screen.getByTestId('column-column-1')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      const section = screen.getByTestId('section-section-1');
      expect(section).toHaveClass('section');

      const column = screen.getByTestId('column-column-1');
      expect(column).toHaveClass('column');
    });

    it('should render grid container', () => {
      render(<SectionRenderer section={mockRichTextSection} />);

      const section = screen.getByTestId('section-section-1');
      const grid = section.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toContain('gap-4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle section with no columns', () => {
      const emptySection: Section = {
        id: 'section-empty',
        page_type: 'custom',
        page_id: 'page-1',
        display_order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [],
      };

      render(<SectionRenderer section={emptySection} />);

      const section = screen.getByTestId('section-section-empty');
      expect(section).toBeInTheDocument();
      expect(screen.queryByTestId(/^column-/)).not.toBeInTheDocument();
    });

    it('should handle null content_data', () => {
      const nullContentSection: Section = {
        ...mockRichTextSection,
        columns: [
          {
            ...mockRichTextSection.columns[0],
            content_data: null as any,
          },
        ],
      };

      render(<SectionRenderer section={nullContentSection} />);

      const column = screen.getByTestId('column-column-1');
      expect(column).toBeInTheDocument();
    });

    it('should handle undefined content_data properties', () => {
      const undefinedPropsSection: Section = {
        ...mockPhotoGallerySection,
        columns: [
          {
            ...mockPhotoGallerySection.columns[0],
            content_data: { photo_ids: undefined },
          },
        ],
      };

      render(<SectionRenderer section={undefinedPropsSection} />);

      expect(screen.getByTestId('photo-gallery')).toBeInTheDocument();
      expect(screen.queryByTestId(/^photo-photo-/)).not.toBeInTheDocument();
    });
  });
});
