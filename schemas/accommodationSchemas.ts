import { z } from 'zod';

/**
 * Schema for creating a new accommodation.
 */
export const createAccommodationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  locationId: z.string().uuid('Invalid location ID').nullable().optional(),
  description: z.string().max(5000, 'Description must be 5000 characters or less').nullable().optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').nullable().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

/**
 * Schema for updating an existing accommodation.
 */
export const updateAccommodationSchema = createAccommodationSchema.partial();

/**
 * Schema for filtering accommodations.
 */
export const accommodationFilterSchema = z.object({
  locationId: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema for searching accommodations.
 */
export const accommodationSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema for creating a new room type.
 */
export const createRoomTypeSchema = z.object({
  accommodationId: z.string().uuid('Invalid accommodation ID'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  capacity: z.number().int().positive('Capacity must be positive'),
  totalRooms: z.number().int().positive('Total rooms must be positive'),
  pricePerNight: z.number().nonnegative('Price per night must be non-negative'),
  hostSubsidyPerNight: z.number().nonnegative('Host subsidy must be non-negative').nullable().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
}).refine(
  (data) => {
    if (data.hostSubsidyPerNight !== null && data.hostSubsidyPerNight !== undefined) {
      return data.hostSubsidyPerNight <= data.pricePerNight;
    }
    return true;
  },
  {
    message: 'Host subsidy cannot exceed price per night',
    path: ['hostSubsidyPerNight'],
  }
);

/**
 * Schema for updating an existing room type.
 */
export const updateRoomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  capacity: z.number().int().positive('Capacity must be positive').optional(),
  totalRooms: z.number().int().positive('Total rooms must be positive').optional(),
  pricePerNight: z.number().nonnegative('Price per night must be non-negative').optional(),
  hostSubsidyPerNight: z.number().nonnegative('Host subsidy must be non-negative').nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
}).refine(
  (data) => {
    if (data.hostSubsidyPerNight !== null && data.hostSubsidyPerNight !== undefined && data.pricePerNight !== undefined) {
      return data.hostSubsidyPerNight <= data.pricePerNight;
    }
    return true;
  },
  {
    message: 'Host subsidy cannot exceed price per night',
    path: ['hostSubsidyPerNight'],
  }
);

/**
 * Schema for creating a new room assignment.
 */
export const createRoomAssignmentSchema = z.object({
  roomTypeId: z.string().uuid('Invalid room type ID'),
  guestId: z.string().uuid('Invalid guest ID'),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').nullable().optional(),
}).refine(
  (data) => {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    return checkIn < checkOut;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
);

/**
 * Schema for updating an existing room assignment.
 */
export const updateRoomAssignmentSchema = z.object({
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date').optional(),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date').optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').nullable().optional(),
}).refine(
  (data) => {
    if (data.checkIn && data.checkOut) {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      return checkIn < checkOut;
    }
    return true;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
);

/**
 * Schema for calculating room assignment costs.
 */
export const calculateCostSchema = z.object({
  roomTypeId: z.string().uuid('Invalid room type ID'),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
}).refine(
  (data) => {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    return checkIn < checkOut;
  },
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
);

/**
 * TypeScript types derived from schemas.
 */
export type CreateAccommodationDTO = z.infer<typeof createAccommodationSchema>;
export type UpdateAccommodationDTO = z.infer<typeof updateAccommodationSchema>;
export type AccommodationFilterDTO = z.infer<typeof accommodationFilterSchema>;
export type AccommodationSearchDTO = z.infer<typeof accommodationSearchSchema>;
export type CreateRoomTypeDTO = z.infer<typeof createRoomTypeSchema>;
export type UpdateRoomTypeDTO = z.infer<typeof updateRoomTypeSchema>;
export type CreateRoomAssignmentDTO = z.infer<typeof createRoomAssignmentSchema>;
export type UpdateRoomAssignmentDTO = z.infer<typeof updateRoomAssignmentSchema>;
export type CalculateCostDTO = z.infer<typeof calculateCostSchema>;

/**
 * Accommodation entity type.
 */
export interface Accommodation {
  id: string;
  name: string;
  locationId: string | null;
  description: string | null;
  address: string | null;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

/**
 * Room type entity type.
 */
export interface RoomType {
  id: string;
  accommodationId: string;
  name: string;
  description: string | null;
  capacity: number;
  totalRooms: number;
  pricePerNight: number;
  hostSubsidyPerNight: number | null;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

/**
 * Room assignment entity type.
 */
export interface RoomAssignment {
  id: string;
  roomTypeId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated accommodations response.
 */
export interface PaginatedAccommodations {
  accommodations: Accommodation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Room assignment cost calculation result.
 */
export interface RoomCost {
  totalCost: number;
  totalSubsidy: number;
  guestCost: number;
  numberOfNights: number;
  pricePerNight: number;
  subsidyPerNight: number;
}

/**
 * Accommodation with room types.
 */
export interface AccommodationWithRoomTypes extends Accommodation {
  roomTypes: RoomType[];
}

/**
 * Room type with availability information.
 */
export interface RoomTypeWithAvailability extends RoomType {
  availableRooms: number;
  assignedRooms: number;
}
