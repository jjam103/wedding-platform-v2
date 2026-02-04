import { z } from 'zod';

export const createPhotoSchema = z.object({
  uploader_id: z.string().uuid(),
  photo_url: z.string().url(),
  storage_type: z.enum(['b2', 'supabase']),
  page_type: z.enum(['event', 'activity', 'accommodation', 'memory']),
  page_id: z.string().uuid().optional(),
  caption: z.string().max(500).optional(),
  alt_text: z.string().max(200).optional(),
  display_order: z.number().int().min(0).optional(),
  moderation_status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const updatePhotoSchema = createPhotoSchema.partial().extend({
  moderation_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  moderation_reason: z.string().max(500).optional(),
  moderated_at: z.string().datetime().optional(),
});

export const moderatePhotoSchema = z.object({
  moderation_status: z.enum(['approved', 'rejected']),
  moderation_reason: z.string().max(500).optional(),
});

export const batchUploadSchema = z.object({
  photos: z.array(createPhotoSchema).min(1).max(50),
});

export const photoFilterSchema = z.object({
  page_type: z.enum(['event', 'activity', 'accommodation', 'memory']).optional(),
  page_id: z.string().uuid().optional(),
  moderation_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  uploader_id: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreatePhotoDTO = z.infer<typeof createPhotoSchema>;
export type UpdatePhotoDTO = z.infer<typeof updatePhotoSchema>;
export type ModeratePhotoDTO = z.infer<typeof moderatePhotoSchema>;
export type BatchUploadDTO = z.infer<typeof batchUploadSchema>;
export type PhotoFilterDTO = z.infer<typeof photoFilterSchema>;
