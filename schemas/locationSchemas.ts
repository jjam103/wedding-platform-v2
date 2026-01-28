import { z } from 'zod';

/**
 * Schema for creating a new location.
 */
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  parentLocationId: z.string().uuid('Invalid parent location ID').nullable().optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').nullable().optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .nullable()
    .optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
});

/**
 * Schema for updating an existing location.
 */
export const updateLocationSchema = createLocationSchema.partial();

/**
 * Schema for filtering locations.
 */
export const locationFilterSchema = z.object({
  parentLocationId: z.string().uuid().nullable().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema for searching locations.
 */
export const locationSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(50),
});

/**
 * TypeScript types derived from schemas.
 */
export type CreateLocationDTO = z.infer<typeof createLocationSchema>;
export type UpdateLocationDTO = z.infer<typeof updateLocationSchema>;
export type LocationFilterDTO = z.infer<typeof locationFilterSchema>;
export type LocationSearchDTO = z.infer<typeof locationSearchSchema>;

/**
 * Location entity type.
 */
export interface Location {
  id: string;
  name: string;
  parentLocationId: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  description: string | null;
  createdAt: string;
}

/**
 * Paginated locations response.
 */
export interface PaginatedLocations {
  locations: Location[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Location with children (for hierarchical display).
 */
export interface LocationWithChildren extends Location {
  children: LocationWithChildren[];
}
