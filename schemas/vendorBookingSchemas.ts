import { z } from 'zod';

/**
 * Base schema for vendor booking data without refinements.
 */
const baseVendorBookingSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID format'),
  activityId: z.string().uuid('Invalid activity ID format').nullable().optional(),
  eventId: z.string().uuid('Invalid event ID format').nullable().optional(),
  bookingDate: z.string(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').nullable().optional(),
});

/**
 * Schema for creating a new vendor booking.
 * All required fields must be provided.
 */
export const createVendorBookingSchema = baseVendorBookingSchema.refine(
  (data) => {
    // Must have either activityId or eventId, but not both
    return (data.activityId && !data.eventId) || (!data.activityId && data.eventId);
  },
  {
    message: 'Must specify either activityId or eventId, but not both',
    path: ['activityId'],
  }
);

/**
 * Schema for updating an existing vendor booking.
 * All fields are optional for partial updates.
 */
export const updateVendorBookingSchema = baseVendorBookingSchema.partial().refine(
  (data) => {
    // If both are provided, must have either activityId or eventId, but not both
    if (data.activityId !== undefined && data.eventId !== undefined) {
      return (data.activityId && !data.eventId) || (!data.activityId && data.eventId);
    }
    return true;
  },
  {
    message: 'Must specify either activityId or eventId, but not both',
    path: ['activityId'],
  }
);

/**
 * Schema for vendor booking list filters.
 */
export const vendorBookingFilterSchema = z.object({
  vendorId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Type definitions derived from schemas.
 */
export type CreateVendorBookingDTO = z.infer<typeof createVendorBookingSchema>;
export type UpdateVendorBookingDTO = z.infer<typeof updateVendorBookingSchema>;
export type VendorBookingFilterDTO = z.infer<typeof vendorBookingFilterSchema>;

/**
 * Vendor booking entity type matching database structure.
 */
export interface VendorBooking {
  id: string;
  vendorId: string;
  activityId: string | null;
  eventId: string | null;
  bookingDate: string;
  notes: string | null;
  createdAt: string;
}

/**
 * Paginated vendor booking list response.
 */
export interface PaginatedVendorBookings {
  bookings: VendorBooking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Vendor booking with related vendor and activity/event details.
 */
export interface VendorBookingWithDetails {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  activityId: string | null;
  activityName: string | null;
  eventId: string | null;
  eventName: string | null;
  bookingDate: string;
  notes: string | null;
  createdAt: string;
}
