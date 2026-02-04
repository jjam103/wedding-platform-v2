'use client';

import { PhotoGallery } from './PhotoGallery';
import { GuestReferencePreview } from './GuestReferencePreview';

interface Reference {
  type: 'event' | 'activity' | 'content_page' | 'accommodation' | 'location';
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

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
  title?: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'home';
  page_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  columns: Column[];
}

interface SectionRendererProps {
  section: Section;
  className?: string;
}

/**
 * SectionRenderer Component
 * 
 * Renders a section with its columns on guest-facing pages.
 * Supports:
 * - Rich text content
 * - Photo galleries with display modes (gallery/carousel/loop)
 * - References to other entities with expandable preview cards
 * - Single or two-column layouts
 */
export function SectionRenderer({ section, className = '' }: SectionRendererProps) {
  const isTwoColumn = section.columns.length === 2;

  return (
    <div className={`section ${className}`} data-testid={`section-${section.id}`}>
      {/* Optional Section Title */}
      {section.title && (
        <h2 className="text-2xl font-bold text-jungle-800 mb-4">{section.title}</h2>
      )}

      {/* Column Grid */}
      <div
        className={`grid gap-6 ${
          isTwoColumn ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {section.columns.map((column) => (
          <div key={column.id} data-testid={`column-${column.id}`} className="column">
            {/* Rich Text Content */}
            {column.content_type === 'rich_text' && (
              <div
                className="prose prose-lg max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: column.content_data?.html || '' }}
              />
            )}

            {/* Photo Gallery */}
            {column.content_type === 'photo_gallery' && (
              <PhotoGallery
                photoIds={column.content_data?.photo_ids || []}
                displayMode={column.content_data?.display_mode || 'gallery'}
                autoplaySpeed={column.content_data?.autoplay_speed || 3000}
                showCaptions={column.content_data?.show_captions !== false}
              />
            )}

            {/* References - Now with expandable preview cards */}
            {column.content_type === 'references' && (
              <div className="space-y-3" data-testid="references">
                {(column.content_data?.references || []).map((ref: Reference, index: number) => (
                  <GuestReferencePreview
                    key={index}
                    reference={ref}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
