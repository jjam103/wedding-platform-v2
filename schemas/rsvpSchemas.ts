import { z } from 'zod';

/**
 * Schema for creating a new RSVP
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
export const createRSVPSchema = z.object({
  guest_id: z.string().uuid('Guest ID must be a valid UUID'),
  event_id: z.string().uuid('Event ID must be a valid UUID').optional(),
  activity_id: z.string().uuid('Activity ID must be a valid UUID').optional(),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']).default('pending'),
  guest_count: z.number().int().positive('Guest count must be positive').optional(),
  dietary_notes: z.string().max(500, 'Dietary notes must be 500 characters or less').optional(),
  special_requirements: z.string().max(500, 'Special requirements must be 500 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
}).refine(
  (data) => (data.event_id && !data.activity_id) || (!data.event_id && data.activity_id),
  {
    message: 'RSVP must be for either an event or an activity, not both',
    path: ['event_id', 'activity_id'],
  }
);

/**
 * Schema for updating an existing RSVP
 */
export const updateRSVPSchema = z.object({
  status: z.enum(['pending', 'attending', 'declined', 'maybe']).optional(),
  guest_count: z.number().int().positive('Guest count must be positive').optional(),
  dietary_notes: z.string().max(500, 'Dietary notes must be 500 characters or less').optional(),
  special_requirements: z.string().max(500, 'Special requirements must be 500 characters or less').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

/**
 * Schema for listing RSVPs with filters
 */
export const listRSVPsSchema = z.object({
  guest_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional(),
  activity_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']).optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(50),
});

// Type exports
export type CreateRSVPDTO = z.infer<typeof createRSVPSchema>;
export type UpdateRSVPDTO = z.infer<typeof updateRSVPSchema>;
export type ListRSVPsDTO = z.infer<typeof listRSVPsSchema>;
