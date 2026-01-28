import { z } from 'zod';

/**
 * Base schema for activity data without refinements.
 */
const baseActivitySchema = z.object({
  eventId: z.string().uuid('Invalid event ID format').nullable().optional(),
  name: z.string().trim().min(1, 'Activity name is required').max(100, 'Activity name must be 100 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  activityType: z.string().trim().min(1, 'Activity type is required'),
  locationId: z.string().uuid('Invalid location ID format').nullable().optional(),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format').nullable().optional(),
  capacity: z.number().int().positive('Capacity must be a positive integer').nullable().optional(),
  costPerPerson: z.number().nonnegative('Cost per person must be non-negative').nullable().optional(),
  hostSubsidy: z.number().nonnegative('Host subsidy must be non-negative').nullable().optional(),
  adultsOnly: z.boolean().optional(),
  plusOneAllowed: z.boolean().optional(),
  visibility: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
  displayOrder: z.number().int().nonnegative().optional(),
});

/**
 * Schema for creating a new activity.
 * All required fields must be provided.
 */
export const createActivitySchema = baseActivitySchema.refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return new Date(data.startTime) <= new Date(data.endTime);
    }
    return true;
  },
  {
    message: 'End time must be after or equal to start time',
    path: ['endTime'],
  }
);

/**
 * Schema for updating an existing activity.
 * All fields are optional for partial updates.
 */
export const updateActivitySchema = baseActivitySchema.partial().refine(
  (data) => {
    if (data.endTime && data.startTime) {
      return new Date(data.startTime) <= new Date(data.endTime);
    }
    return true;
  },
  {
    message: 'End time must be after or equal to start time',
    path: ['endTime'],
  }
);

/**
 * Schema for activity list filters.
 */
export const activityFilterSchema = z.object({
  eventId: z.string().uuid().optional(),
  activityType: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  locationId: z.string().uuid().optional(),
  adultsOnly: z.boolean().optional(),
  startTimeFrom: z.string().datetime().optional(),
  startTimeTo: z.string().datetime().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for activity search.
 */
export const activitySearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Type definitions derived from schemas.
 */
export type CreateActivityDTO = z.infer<typeof createActivitySchema>;
export type UpdateActivityDTO = z.infer<typeof updateActivitySchema>;
export type ActivityFilterDTO = z.infer<typeof activityFilterSchema>;
export type ActivitySearchDTO = z.infer<typeof activitySearchSchema>;

/**
 * Activity entity type matching database structure.
 */
export interface Activity {
  id: string;
  eventId: string | null;
  name: string;
  description: string | null;
  activityType: string;
  locationId: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  costPerPerson: number | null;
  hostSubsidy: number | null;
  adultsOnly: boolean;
  plusOneAllowed: boolean;
  visibility: string[];
  status: 'draft' | 'published';
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated activity list response.
 */
export interface PaginatedActivities {
  activities: Activity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Activity capacity information.
 */
export interface ActivityCapacity {
  activityId: string;
  activityName: string;
  capacity: number | null;
  currentAttendees: number;
  availableSpots: number | null;
  utilizationPercentage: number | null;
  isNearCapacity: boolean; // true if >= 90% capacity
  isAtCapacity: boolean; // true if >= 100% capacity
}
