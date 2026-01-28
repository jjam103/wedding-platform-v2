import { z } from 'zod';

/**
 * Schema for flight information updates
 */
export const flightInfoSchema = z.object({
  guest_id: z.string().uuid(),
  airport_code: z.enum(['SJO', 'LIR', 'Other']),
  flight_number: z.string().min(1).max(20).optional(),
  airline: z.string().min(1).max(100).optional(),
  arrival_time: z.string().datetime().optional(),
  departure_time: z.string().datetime().optional(),
});

/**
 * Schema for creating a transportation manifest
 */
export const createTransportationManifestSchema = z.object({
  manifest_type: z.enum(['arrival', 'departure']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_window_start: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  time_window_end: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  vehicle_type: z.string().min(1).max(50).optional(),
  driver_name: z.string().min(1).max(100).optional(),
  driver_phone: z.string().min(1).max(20).optional(),
  guest_ids: z.array(z.string().uuid()),
  notes: z.string().max(1000).optional(),
});

/**
 * Schema for updating a transportation manifest
 */
export const updateTransportationManifestSchema = createTransportationManifestSchema.partial();

/**
 * Schema for vehicle requirements
 */
export const vehicleRequirementSchema = z.object({
  vehicle_type: z.string().min(1).max(50),
  capacity: z.number().int().positive(),
  quantity_needed: z.number().int().positive(),
  estimated_cost: z.number().nonnegative(),
});

/**
 * Schema for driver sheet generation
 */
export const driverSheetSchema = z.object({
  manifest_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_window: z.string(),
  vehicle_type: z.string().optional(),
  driver_name: z.string().optional(),
  driver_phone: z.string().optional(),
  guests: z.array(z.object({
    name: z.string(),
    flight_number: z.string().optional(),
    phone: z.string().optional(),
    special_requests: z.string().optional(),
  })),
  total_guests: z.number().int().nonnegative(),
  pickup_location: z.string(),
  dropoff_locations: z.array(z.string()),
});

export type FlightInfoDTO = z.infer<typeof flightInfoSchema>;
export type CreateTransportationManifestDTO = z.infer<typeof createTransportationManifestSchema>;
export type UpdateTransportationManifestDTO = z.infer<typeof updateTransportationManifestSchema>;
export type VehicleRequirementDTO = z.infer<typeof vehicleRequirementSchema>;
export type DriverSheetDTO = z.infer<typeof driverSheetSchema>;
