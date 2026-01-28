import { z } from 'zod';

// Content type schemas
export const richTextContentSchema = z.object({
  html: z.string(),
});

export const photoGalleryContentSchema = z.object({
  photo_ids: z.array(z.string().uuid()),
  display_mode: z.enum(['gallery', 'carousel', 'loop']),
});

export const referenceSchema = z.object({
  type: z.enum(['activity', 'event', 'accommodation', 'location']),
  id: z.string().uuid(),
  label: z.string().optional(),
});

export const referencesContentSchema = z.object({
  references: z.array(referenceSchema),
});

// Column schema
export const columnDataSchema = z.object({
  column_number: z.union([z.literal(1), z.literal(2)]),
  content_type: z.enum(['rich_text', 'photo_gallery', 'references']),
  content_data: z.union([
    richTextContentSchema,
    photoGalleryContentSchema,
    referencesContentSchema,
  ]),
});

// Section schemas
export const createSectionSchema = z.object({
  page_type: z.enum(['activity', 'event', 'accommodation', 'room_type', 'custom']),
  page_id: z.string().min(1),
  display_order: z.number().int().min(0),
  columns: z.array(columnDataSchema).min(1).max(2),
});

export const updateSectionSchema = createSectionSchema.partial().extend({
  columns: z.array(columnDataSchema).min(1).max(2).optional(),
});

// Content pages schemas
export const createContentPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateContentPageSchema = createContentPageSchema.partial();

// Gallery settings schemas
export const createGallerySettingsSchema = z.object({
  page_type: z.enum(['activity', 'event', 'accommodation', 'room_type', 'custom', 'memory']),
  page_id: z.string().min(1),
  display_mode: z.enum(['gallery', 'carousel', 'loop']).default('gallery'),
  photos_per_row: z.number().int().min(1).max(6).optional(),
  show_captions: z.boolean().default(true),
  autoplay_interval: z.number().int().min(1000).optional(),
  transition_effect: z.string().optional(),
});

export const updateGallerySettingsSchema = createGallerySettingsSchema.partial().extend({
  page_type: z.enum(['activity', 'event', 'accommodation', 'room_type', 'custom', 'memory']).optional(),
  page_id: z.string().min(1).optional(),
});

// Type exports
export type RichTextContent = z.infer<typeof richTextContentSchema>;
export type PhotoGalleryContent = z.infer<typeof photoGalleryContentSchema>;
export type Reference = z.infer<typeof referenceSchema>;
export type ReferencesContent = z.infer<typeof referencesContentSchema>;
export type ColumnData = z.infer<typeof columnDataSchema>;
export type CreateSectionDTO = z.infer<typeof createSectionSchema>;
export type UpdateSectionDTO = z.infer<typeof updateSectionSchema>;
export type CreateContentPageDTO = z.infer<typeof createContentPageSchema>;
export type UpdateContentPageDTO = z.infer<typeof updateContentPageSchema>;
export type CreateGallerySettingsDTO = z.infer<typeof createGallerySettingsSchema>;
export type UpdateGallerySettingsDTO = z.infer<typeof updateGallerySettingsSchema>;

// Database entity types
export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom';
  page_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  section_id: string;
  column_number: 1 | 2;
  content_type: 'rich_text' | 'photo_gallery' | 'references';
  content_data: RichTextContent | PhotoGalleryContent | ReferencesContent;
  created_at: string;
  updated_at: string;
}

export interface GallerySettings {
  id: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom' | 'memory';
  page_id: string;
  display_mode: 'gallery' | 'carousel' | 'loop';
  photos_per_row?: number;
  show_captions: boolean;
  autoplay_interval?: number;
  transition_effect?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom';
  page_id: string;
  created_by: string | null;
  sections_snapshot: any;
  created_at: string;
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  brokenReferences: Reference[];
  circularReferences: Reference[];
}
