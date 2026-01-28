import { z } from 'zod';

/**
 * Base schema for event data without refinements.
 */
const baseEventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required').max(100, 'Event name must be 100 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  eventType: z.enum(['ceremony', 'reception', 'pre_wedding', 'post_wedding'], {
    errorMap: () => ({ message: 'Event type must be ceremony, reception, pre_wedding, or post_wedding' }),
  }),
  locationId: z.string().uuid('Invalid location ID format').nullable().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').nullable().optional(),
  rsvpRequired: z.boolean().optional(),
  rsvpDeadline: z.string().nullable().optional(),
  visibility: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

/**
 * Schema for creating a new event.
 * All required fields must be provided.
 */
export const createEventSchema = baseEventSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Schema for updating an existing event.
 * All fields are optional for partial updates.
 */
export const updateEventSchema = baseEventSchema.partial().refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Schema for event list filters.
 */
export const eventFilterSchema = z.object({
  eventType: z.enum(['ceremony', 'reception', 'pre_wedding', 'post_wedding']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  locationId: z.string().uuid().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for event search.
 */
export const eventSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for scheduling conflict check.
 */
export const conflictCheckSchema = z.object({
  locationId: z.string().uuid('Invalid location ID format'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format').nullable().optional(),
  excludeEventId: z.string().uuid().optional(), // For update operations
});

/**
 * Type definitions derived from schemas.
 */
export type CreateEventDTO = z.infer<typeof createEventSchema>;
export type UpdateEventDTO = z.infer<typeof updateEventSchema>;
export type EventFilterDTO = z.infer<typeof eventFilterSchema>;
export type EventSearchDTO = z.infer<typeof eventSearchSchema>;
export type ConflictCheckDTO = z.infer<typeof conflictCheckSchema>;

/**
 * Event entity type matching database structure.
 */
export interface Event {
  id: string;
  name: string;
  description: string | null;
  eventType: 'ceremony' | 'reception' | 'pre_wedding' | 'post_wedding';
  locationId: string | null;
  startDate: string;
  endDate: string | null;
  rsvpRequired: boolean;
  rsvpDeadline: string | null;
  visibility: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated event list response.
 */
export interface PaginatedEvents {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Scheduling conflict information.
 */
export interface SchedulingConflict {
  hasConflict: boolean;
  conflictingEvents: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string | null;
  }>;
}
