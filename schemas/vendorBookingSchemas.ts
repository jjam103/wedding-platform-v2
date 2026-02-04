import { z } from 'zod';

/**
 * Base schema for vendor booking data without refinements.
 */
const baseVendorBookingSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID format'),
  activityId: z.string().uuid('Invalid activity ID format').nullable().optional(),
  eventId: z.string().uuid('Invalid event ID format').nullable().optional(),
  bookingDate: z.string(),
  baseCost: z.number().min(0, 'Base cost must be non-negative'),
  guestCount: z.number().int().min(0, 'Guest count must be non-negative').nullable().optional(),
  pricingModel: z.enum(['flat_rate', 'per_guest'], {
    errorMap: () => ({ message: 'Pricing model must be flat_rate or per_guest' }),
  }).default('flat_rate'),
  hostSubsidy: z.number().min(0, 'Host subsidy must be non-negative').default(0),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').nullable().optional(),
});

/**
 * Schema for creating a new vendor booking.
 * All required fields must be provided.
 */
export const createVendorBookingSchema = baseVendorBookingSchema
  .refine(
    (data) => {
      // If per-guest pricing, guest count is required
      if (data.pricingModel === 'per_guest' && !data.guestCount) {
        return false;
      }
      return true;
    },
    {
      message: 'Guest count is required for per-guest pricing',
      path: ['guestCount'],
    }
  )
  .refine(
    (data) => {
      // Calculate total cost
      const totalCost = data.pricingModel === 'per_guest' 
        ? data.baseCost * (data.guestCount || 0)
        : data.baseCost;
      
      // Host subsidy cannot exceed total cost
      return data.hostSubsidy <= totalCost;
    },
    {
      message: 'Host subsidy cannot exceed total cost',
      path: ['hostSubsidy'],
    }
  );

/**
 * Schema for updating an existing vendor booking.
 * All fields are optional for partial updates.
 */
export const updateVendorBookingSchema = baseVendorBookingSchema.partial().refine(
  (data) => {
    // If per-guest pricing, guest count is required
    if (data.pricingModel === 'per_guest' && data.guestCount === undefined) {
      return false;
    }
    return true;
  },
  {
    message: 'Guest count is required for per-guest pricing',
    path: ['guestCount'],
  }
).refine(
  (data) => {
    // Host subsidy cannot exceed total cost (if both provided)
    if (data.hostSubsidy !== undefined && data.baseCost !== undefined) {
      const totalCost = data.pricingModel === 'per_guest' 
        ? data.baseCost * (data.guestCount || 0)
        : data.baseCost;
      return data.hostSubsidy <= totalCost;
    }
    return true;
  },
  {
    message: 'Host subsidy cannot exceed total cost',
    path: ['hostSubsidy'],
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
  baseCost: number;
  guestCount: number | null;
  pricingModel: 'flat_rate' | 'per_guest';
  totalCost: number;
  hostSubsidy: number;
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
  baseCost: number;
  guestCount: number | null;
  pricingModel: 'flat_rate' | 'per_guest';
  totalCost: number;
  hostSubsidy: number;
  notes: string | null;
  createdAt: string;
}
