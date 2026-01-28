import { z } from 'zod';

// System settings schema
export const systemSettingsSchema = z.object({
  wedding_date: z.string().datetime().nullable(),
  venue_name: z.string().min(1).max(200).nullable(),
  couple_name_1: z.string().min(1).max(100).nullable(),
  couple_name_2: z.string().min(1).max(100).nullable(),
  timezone: z.string().min(1).max(50).default('America/Costa_Rica'),
  
  // Email notification preferences
  send_rsvp_confirmations: z.boolean().default(true),
  send_activity_reminders: z.boolean().default(true),
  send_deadline_reminders: z.boolean().default(true),
  reminder_days_before: z.number().int().min(1).max(30).default(7),
  
  // Photo gallery settings
  require_photo_moderation: z.boolean().default(true),
  max_photos_per_guest: z.number().int().min(1).max(100).default(20),
  allowed_photo_formats: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'heic']),
  
  // Home page configuration
  home_page_title: z.string().min(1).max(200).nullable(),
  home_page_subtitle: z.string().max(500).nullable(),
  home_page_welcome_message: z.string().nullable(), // Rich text HTML
  home_page_hero_image_url: z.string().url().nullable(),
});

export const updateSystemSettingsSchema = systemSettingsSchema.partial();

export type SystemSettings = z.infer<typeof systemSettingsSchema> & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type UpdateSystemSettingsDTO = z.infer<typeof updateSystemSettingsSchema>;
