import { render, screen } from '@testing-library/react';
import { SectionRenderer } from './SectionRenderer';

// Mock PhotoGallery component
jest.mock('./PhotoGallery', () => ({
  PhotoGallery: ({ photoIds, displayMode }: any) => (
    <div data-testid="photo-gallery" data-photo-ids={photoIds.join(',')} data-display-mode={displayMode}>
      Photo Gallery Mock
    </div>
  ),
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('SectionRenderer', () => {
  describe('Section Title', () => {
    it('should render section title when provided', () => {
      const section = {
        id: 'section-1',
        title: 'Welcome Section',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByText('Welcome Section')).toBeInTheDocument();
      expect(screen.getByText('Welcome Section')).toHaveClass('text-2xl', 'font-bold');
    });

    it('should not render title element when title is not provided', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });
  });

  describe('Rich Text Content', () => {
    it('should render rich text content with HTML', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: {
              html: '<p>This is <strong>bold</strong> text</p>',
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const content = screen.getByTestId('column-column-1');
      expect(content.innerHTML).toContain('<p>This is <strong>bold</strong> text</p>');
    });

    it('should handle empty rich text content', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const column = screen.getByTestId('column-column-1');
      expect(column).toBeInTheDocument();
    });

    it('should apply prose styling to rich text', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: {
              html: '<p>Test content</p>',
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const proseDiv = screen.getByTestId('column-column-1').querySelector('.prose');
      expect(proseDiv).toHaveClass('prose', 'prose-lg', 'max-w-none');
    });
  });

  describe('Photo Gallery Content', () => {
    it('should render photo gallery with photo IDs', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'photo_gallery' as const,
            content_data: {
              photo_ids: ['photo-1', 'photo-2', 'photo-3'],
              display_mode: 'gallery',
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const gallery = screen.getByTestId('photo-gallery');
      expect(gallery).toHaveAttribute('data-photo-ids', 'photo-1,photo-2,photo-3');
      expect(gallery).toHaveAttribute('data-display-mode', 'gallery');
    });

    it('should pass display mode to photo gallery', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'photo_gallery' as const,
            content_data: {
              photo_ids: ['photo-1'],
              display_mode: 'carousel',
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const gallery = screen.getByTestId('photo-gallery');
      expect(gallery).toHaveAttribute('data-display-mode', 'carousel');
    });

    it('should handle empty photo IDs', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'photo_gallery' as const,
            content_data: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const gallery = screen.getByTestId('photo-gallery');
      expect(gallery).toHaveAttribute('data-photo-ids', '');
    });
  });

  describe('References Content', () => {
    it('should render references with type, name, and description', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'references' as const,
            content_data: {
              references: [
                {
                  type: 'activity',
                  id: 'activity-1',
                  name: 'Beach Volleyball',
                  description: 'Fun beach activity',
                },
              ],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByText('activity')).toBeInTheDocument();
      expect(screen.getByText('Beach Volleyball')).toBeInTheDocument();
      expect(screen.getByText('Fun beach activity')).toBeInTheDocument();
    });

    it('should render view link for references with ID', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'references' as const,
            content_data: {
              references: [
                {
                  type: 'event',
                  id: 'event-1',
                  name: 'Wedding Ceremony',
                },
              ],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const link = screen.getByText('View →');
      expect(link).toHaveAttribute('href', '/event/event-1');
    });

    it('should not render view link for references without ID', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'references' as const,
            content_data: {
              references: [
                {
                  type: 'activity',
                  name: 'Beach Volleyball',
                },
              ],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.queryByText('View →')).not.toBeInTheDocument();
    });

    it('should render multiple references', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'references' as const,
            content_data: {
              references: [
                { type: 'activity', id: 'activity-1', name: 'Activity 1' },
                { type: 'event', id: 'event-1', name: 'Event 1' },
                { type: 'accommodation', id: 'acc-1', name: 'Hotel 1' },
              ],
            },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByText('Activity 1')).toBeInTheDocument();
      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Hotel 1')).toBeInTheDocument();
    });

    it('should handle empty references array', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'references' as const,
            content_data: {},
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const referencesContainer = screen.getByTestId('references');
      expect(referencesContainer).toBeInTheDocument();
      expect(referencesContainer.children).toHaveLength(0);
    });
  });

  describe('Column Layout', () => {
    it('should render single column layout for one column', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Content</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const grid = screen.getByTestId('section-section-1').querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).not.toHaveClass('md:grid-cols-2');
    });

    it('should render two column layout for two columns', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Column 1</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'column-2',
            section_id: 'section-1',
            column_number: 2 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Column 2</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      const grid = screen.getByTestId('section-section-1').querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('should render all columns in order', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-1',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>First</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'column-2',
            section_id: 'section-1',
            column_number: 2 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Second</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByTestId('column-column-1')).toBeInTheDocument();
      expect(screen.getByTestId('column-column-2')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to section', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [],
      };

      render(<SectionRenderer section={section} className="custom-class" />);

      const sectionElement = screen.getByTestId('section-section-1');
      expect(sectionElement).toHaveClass('custom-class');
    });
  });

  describe('Data Attributes', () => {
    it('should add data-testid for section', () => {
      const section = {
        id: 'section-123',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByTestId('section-section-123')).toBeInTheDocument();
    });

    it('should add data-testid for each column', () => {
      const section = {
        id: 'section-1',
        page_type: 'custom' as const,
        page_id: 'page-1',
        display_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        columns: [
          {
            id: 'column-abc',
            section_id: 'section-1',
            column_number: 1 as const,
            content_type: 'rich_text' as const,
            content_data: { html: '<p>Test</p>' },
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      render(<SectionRenderer section={section} />);

      expect(screen.getByTestId('column-column-abc')).toBeInTheDocument();
    });
  });
});
