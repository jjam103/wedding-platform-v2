import { z } from 'zod';

/**
 * Schema for creating a new guest.
 * All required fields must be provided.
 */
export const createGuestSchema = z.object({
  groupId: z.string().uuid('Invalid group ID format'),
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
  email: z.string().email('Invalid email format').nullable().optional(),
  phone: z.string().max(20, 'Phone number must be 20 characters or less').nullable().optional(),
  ageType: z.enum(['adult', 'child', 'senior'], {
    errorMap: () => ({ message: 'Age type must be adult, child, or senior' }),
  }),
  guestType: z.string().trim().min(1, 'Guest type is required'),
  dietaryRestrictions: z.string().max(500, 'Dietary restrictions must be 500 characters or less').nullable().optional(),
  plusOneName: z.string().max(100, 'Plus one name must be 100 characters or less').nullable().optional(),
  plusOneAttending: z.boolean().optional(),
  arrivalDate: z.string().nullable().optional(),
  departureDate: z.string().nullable().optional(),
  airportCode: z.enum(['SJO', 'LIR', 'Other']).nullable().optional(),
  flightNumber: z.string().max(20, 'Flight number must be 20 characters or less').nullable().optional(),
  invitationSent: z.boolean().optional(),
  invitationSentDate: z.string().nullable().optional(),
  rsvpDeadline: z.string().nullable().optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').nullable().optional(),
});

/**
 * Schema for updating an existing guest.
 * All fields are optional for partial updates.
 */
export const updateGuestSchema = createGuestSchema.partial();

/**
 * Schema for guest list filters.
 */
export const guestFilterSchema = z.object({
  groupId: z.string().uuid().optional(),
  ageType: z.enum(['adult', 'child', 'senior']).optional(),
  guestType: z.string().optional(),
  invitationSent: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Schema for guest search.
 */
export const guestSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

/**
 * Type definitions derived from schemas.
 */
export type CreateGuestDTO = z.infer<typeof createGuestSchema>;
export type UpdateGuestDTO = z.infer<typeof updateGuestSchema>;
export type GuestFilterDTO = z.infer<typeof guestFilterSchema>;
export type GuestSearchDTO = z.infer<typeof guestSearchSchema>;

/**
 * Guest entity type matching database structure.
 */
export interface Guest {
  id: string;
  groupId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  ageType: 'adult' | 'child' | 'senior';
  guestType: string;
  dietaryRestrictions: string | null;
  plusOneName: string | null;
  plusOneAttending: boolean;
  arrivalDate: string | null;
  departureDate: string | null;
  airportCode: 'SJO' | 'LIR' | 'Other' | null;
  flightNumber: string | null;
  invitationSent: boolean;
  invitationSentDate: string | null;
  rsvpDeadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated guest list response.
 */
export interface PaginatedGuests {
  guests: Guest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
