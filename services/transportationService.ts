import { sanitizeInput, sanitizeRichText } from "../utils/sanitization";
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';
import {
  flightInfoSchema,
  createTransportationManifestSchema,
  updateTransportationManifestSchema,
  type FlightInfoDTO,
  type CreateTransportationManifestDTO,
  type UpdateTransportationManifestDTO,
  type VehicleRequirementDTO,
  type DriverSheetDTO,
} from '@/schemas/transportationSchemas';

// Supabase client - can be overridden for testing
let _supabase: any = null;

/**
 * Gets the Supabase client instance.
 * Lazy loads the client to avoid initialization issues in tests.
 */
function getSupabase() {
  if (!_supabase) {
    const { supabase } = require('@/lib/supabase');
    _supabase = supabase;
  }
  return _supabase;
}

/**
 * Sets the Supabase client instance (for testing).
 * @internal
 */
export function _setSupabaseForTesting(client: any) {
  _supabase = client;
}

/**
 * Resets the Supabase client instance (for testing).
 * @internal
 */
export function _resetSupabaseForTesting() {
  _supabase = null;
}

/**
 * Transportation manifest entity
 */
export interface TransportationManifest {
  id: string;
  manifest_type: 'arrival' | 'departure';
  date: string;
  time_window_start: string;
  time_window_end: string;
  vehicle_type?: string;
  driver_name?: string;
  driver_phone?: string;
  guest_ids: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Flight information entity
 */
export interface FlightInfo {
  guest_id: string;
  airport_code: 'SJO' | 'LIR' | 'Other';
  flight_number?: string;
  airline?: string;
  arrival_time?: string;
  departure_time?: string;
}

/**
 * Vehicle requirement entity
 */
export interface VehicleRequirement {
  vehicle_type: string;
  capacity: number;
  quantity_needed: number;
  estimated_cost: number;
}

/**
 * Driver sheet entity
 */
export interface DriverSheet {
  manifest_id: string;
  date: string;
  time_window: string;
  vehicle_type?: string;
  driver_name?: string;
  driver_phone?: string;
  guests: Array<{
    name: string;
    flight_number?: string;
    phone?: string;
    special_requests?: string;
  }>;
  total_guests: number;
  pickup_location: string;
  dropoff_locations: string[];
}

/**
 * Updates flight information for a guest.
 * 
 * @param guestId - The guest's ID
 * @param flightInfo - Flight information to update
 * @returns Result containing void or error details
 * 
 * @example
 * const result = await transportationService.updateFlightInfo('guest-123', {
 *   guest_id: 'guest-123',
 *   airport_code: 'SJO',
 *   flight_number: 'AA123',
 *   arrival_time: '2025-06-01T14:30:00Z',
 * });
 */
export async function updateFlightInfo(
  guestId: string,
  flightInfo: FlightInfoDTO
): Promise<Result<void>> {
  try {
    // 1. Validate
    const validation = flightInfoSchema.safeParse(flightInfo);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid flight information',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized = {
      ...validation.data,
      flight_number: validation.data.flight_number
        ? sanitizeInput(validation.data.flight_number)
        : undefined,
      airline: validation.data.airline
        ? sanitizeInput(validation.data.airline)
        : undefined,
    };

    // 3. Update guest record
    const supabase = getSupabase();
    
    // Extract date and time components from datetime strings
    const arrivalDate = sanitized.arrival_time
      ? new Date(sanitized.arrival_time).toISOString().split('T')[0]
      : undefined;
    const arrivalTime = sanitized.arrival_time
      ? new Date(sanitized.arrival_time).toISOString().split('T')[1].substring(0, 8)
      : undefined;
    const departureDate = sanitized.departure_time
      ? new Date(sanitized.departure_time).toISOString().split('T')[0]
      : undefined;
    const departureTime = sanitized.departure_time
      ? new Date(sanitized.departure_time).toISOString().split('T')[1].substring(0, 8)
      : undefined;
    
    const { error } = await supabase
      .from('guests')
      .update({
        airport_code: sanitized.airport_code,
        flight_number: sanitized.flight_number,
        arrival_date: arrivalDate,
        arrival_time: arrivalTime,
        departure_date: departureDate,
        departure_time: departureTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Gets flights by airport code.
 * 
 * @param airportCode - Airport code to filter by
 * @returns Result containing flight information array or error details
 */
export async function getFlightsByAirport(
  airportCode: 'SJO' | 'LIR' | 'Other'
): Promise<Result<FlightInfo[]>> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('guests')
      .select('id, airport_code, flight_number, arrival_date, departure_date')
      .eq('airport_code', airportCode)
      .not('flight_number', 'is', null);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    const flights: FlightInfo[] = data.map((guest: any) => ({
      guest_id: guest.id,
      airport_code: guest.airport_code as 'SJO' | 'LIR' | 'Other',
      flight_number: guest.flight_number || undefined,
      arrival_time: guest.arrival_date || undefined,
      departure_time: guest.departure_date || undefined,
    }));

    return { success: true, data: flights };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generates arrival manifests for a specific date, grouping guests by time windows.
 * 
 * @param date - Date to generate manifests for
 * @param timeWindowHours - Hours for time window grouping (default: 2)
 * @returns Result containing transportation manifests or error details
 */
export async function generateArrivalManifest(
  date: Date,
  timeWindowHours: number = 2
): Promise<Result<TransportationManifest[]>> {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Get all guests arriving on this date
    const supabase = getSupabase();
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, arrival_date, arrival_time, airport_code, flight_number')
      .eq('arrival_date', dateStr)
      .not('airport_code', 'is', null);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    if (!guests || guests.length === 0) {
      return { success: true, data: [] };
    }

    // Group guests by time windows based on their arrival times
    const timeWindows = new Map<string, string[]>();
    
    guests.forEach((guest: { id: string; arrival_time?: string }) => {
      // Parse arrival time or default to noon if not specified
      let hour = 12; // Default to noon
      if (guest.arrival_time) {
        const timeParts = guest.arrival_time.split(':');
        hour = parseInt(timeParts[0], 10);
      }
      
      // Calculate which time window this guest belongs to
      const windowStart = Math.floor(hour / timeWindowHours) * timeWindowHours;
      const windowEnd = windowStart + timeWindowHours;
      
      const windowKey = `${String(windowStart).padStart(2, '0')}:00:00-${String(windowEnd).padStart(2, '0')}:00:00`;
      
      if (!timeWindows.has(windowKey)) {
        timeWindows.set(windowKey, []);
      }
      timeWindows.get(windowKey)!.push(guest.id);
    });

    // Create manifests for each time window
    const manifests: TransportationManifest[] = [];
    
    for (const [windowKey, guestIds] of timeWindows.entries()) {
      const [startTime, endTime] = windowKey.split('-');
      
      const manifestData: CreateTransportationManifestDTO = {
        manifest_type: 'arrival',
        date: dateStr,
        time_window_start: startTime,
        time_window_end: endTime,
        guest_ids: guestIds,
      };

      const createResult = await createManifest(manifestData);
      if (createResult.success) {
        manifests.push(createResult.data);
      }
    }

    return { success: true, data: manifests };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generates departure manifests for a specific date, grouping guests by time windows.
 * 
 * @param date - Date to generate manifests for
 * @param timeWindowHours - Hours for time window grouping (default: 2)
 * @returns Result containing transportation manifests or error details
 */
export async function generateDepartureManifest(
  date: Date,
  timeWindowHours: number = 2
): Promise<Result<TransportationManifest[]>> {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Get all guests departing on this date
    const supabase = getSupabase();
    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, departure_date, departure_time, airport_code, flight_number')
      .eq('departure_date', dateStr)
      .not('airport_code', 'is', null);

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    if (!guests || guests.length === 0) {
      return { success: true, data: [] };
    }

    // Group guests by time windows based on their departure times
    const timeWindows = new Map<string, string[]>();
    
    guests.forEach((guest: { id: string; departure_time?: string }) => {
      // Parse departure time or default to 2 PM if not specified
      let hour = 14; // Default to 2 PM
      if (guest.departure_time) {
        const timeParts = guest.departure_time.split(':');
        hour = parseInt(timeParts[0], 10);
      }
      
      // Calculate which time window this guest belongs to
      const windowStart = Math.floor(hour / timeWindowHours) * timeWindowHours;
      const windowEnd = windowStart + timeWindowHours;
      
      const windowKey = `${String(windowStart).padStart(2, '0')}:00:00-${String(windowEnd).padStart(2, '0')}:00:00`;
      
      if (!timeWindows.has(windowKey)) {
        timeWindows.set(windowKey, []);
      }
      timeWindows.get(windowKey)!.push(guest.id);
    });

    // Create manifests for each time window
    const manifests: TransportationManifest[] = [];
    
    for (const [windowKey, guestIds] of timeWindows.entries()) {
      const [startTime, endTime] = windowKey.split('-');
      
      const manifestData: CreateTransportationManifestDTO = {
        manifest_type: 'departure',
        date: dateStr,
        time_window_start: startTime,
        time_window_end: endTime,
        guest_ids: guestIds,
      };

      const createResult = await createManifest(manifestData);
      if (createResult.success) {
        manifests.push(createResult.data);
      }
    }

    return { success: true, data: manifests };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Creates a transportation manifest.
 * 
 * @param data - Manifest data
 * @returns Result containing created manifest or error details
 */
export async function createManifest(
  data: CreateTransportationManifestDTO
): Promise<Result<TransportationManifest>> {
  try {
    // 1. Validate
    const validation = createTransportationManifestSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid manifest data',
          details: validation.error.issues,
        },
      };
    }

    // 2. Sanitize
    const sanitized = {
      ...validation.data,
      vehicle_type: validation.data.vehicle_type
        ? sanitizeInput(validation.data.vehicle_type)
        : undefined,
      driver_name: validation.data.driver_name
        ? sanitizeInput(validation.data.driver_name)
        : undefined,
      driver_phone: validation.data.driver_phone
        ? sanitizeInput(validation.data.driver_phone)
        : undefined,
      notes: validation.data.notes
        ? sanitizeInput(validation.data.notes)
        : undefined,
    };

    // 3. Insert into database
    const supabase = getSupabase();
    const { data: manifest, error } = await supabase
      .from('transportation_manifests')
      .insert(sanitized)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error.message,
          details: error,
        },
      };
    }

    return { success: true, data: manifest };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Assigns guests to a shuttle manifest.
 * 
 * @param manifestId - Manifest ID
 * @param guestIds - Array of guest IDs to assign
 * @returns Result containing void or error details
 */
export async function assignGuestsToShuttle(
  manifestId: string,
  guestIds: string[]
): Promise<Result<void>> {
  try {
    // Get current manifest
    const supabase = getSupabase();
    const { data: manifest, error: fetchError } = await supabase
      .from('transportation_manifests')
      .select('guest_ids')
      .eq('id', manifestId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: fetchError.message,
          details: fetchError,
        },
      };
    }

    // Merge guest IDs (avoid duplicates)
    const currentGuestIds = manifest.guest_ids || [];
    const updatedGuestIds = Array.from(new Set([...currentGuestIds, ...guestIds]));

    // Update manifest
    const { error: updateError } = await supabase
      .from('transportation_manifests')
      .update({
        guest_ids: updatedGuestIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', manifestId);

    if (updateError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: updateError.message,
          details: updateError,
        },
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Calculates vehicle requirements based on guest count.
 * 
 * @param guestCount - Total number of guests
 * @returns Result containing vehicle requirements or error details
 */
export async function calculateVehicleRequirements(
  guestCount: number
): Promise<Result<VehicleRequirement[]>> {
  try {
    if (guestCount < 0) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Guest count must be non-negative',
        },
      };
    }

    // Vehicle capacity definitions
    const vehicles = [
      { type: 'sedan', capacity: 4, cost: 50 },
      { type: 'van', capacity: 8, cost: 80 },
      { type: 'minibus', capacity: 15, cost: 120 },
      { type: 'bus', capacity: 50, cost: 300 },
    ];

    // Calculate optimal vehicle mix (greedy algorithm - largest first)
    const requirements: VehicleRequirement[] = [];
    let remainingGuests = guestCount;

    for (let i = vehicles.length - 1; i >= 0; i--) {
      const vehicle = vehicles[i];
      if (remainingGuests >= vehicle.capacity) {
        const quantity = Math.floor(remainingGuests / vehicle.capacity);
        requirements.push({
          vehicle_type: vehicle.type,
          capacity: vehicle.capacity,
          quantity_needed: quantity,
          estimated_cost: quantity * vehicle.cost,
        });
        remainingGuests -= quantity * vehicle.capacity;
      }
    }

    // Handle remaining guests with smallest vehicle
    if (remainingGuests > 0) {
      const smallestVehicle = vehicles[0];
      requirements.push({
        vehicle_type: smallestVehicle.type,
        capacity: smallestVehicle.capacity,
        quantity_needed: 1,
        estimated_cost: smallestVehicle.cost,
      });
    }

    return { success: true, data: requirements };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generates a driver sheet for a manifest.
 * 
 * @param manifestId - Manifest ID
 * @returns Result containing driver sheet or error details
 */
export async function generateDriverSheet(
  manifestId: string
): Promise<Result<DriverSheet>> {
  try {
    // Get manifest
    const supabase = getSupabase();
    const { data: manifest, error: manifestError } = await supabase
      .from('transportation_manifests')
      .select('*')
      .eq('id', manifestId)
      .single();

    if (manifestError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: manifestError.message,
          details: manifestError,
        },
      };
    }

    // Get guest details
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('id, first_name, last_name, flight_number, phone, notes')
      .in('id', manifest.guest_ids);

    if (guestsError) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: guestsError.message,
          details: guestsError,
        },
      };
    }

    // Build driver sheet
    const driverSheet: DriverSheet = {
      manifest_id: manifest.id,
      date: manifest.date,
      time_window: `${manifest.time_window_start} - ${manifest.time_window_end}`,
      vehicle_type: manifest.vehicle_type,
      driver_name: manifest.driver_name,
      driver_phone: manifest.driver_phone,
      guests: guests.map((guest: any) => ({
        name: `${guest.first_name} ${guest.last_name}`,
        flight_number: guest.flight_number || undefined,
        phone: guest.phone || undefined,
        special_requests: guest.notes || undefined,
      })),
      total_guests: guests.length,
      pickup_location: manifest.manifest_type === 'arrival' ? 'Airport' : 'Hotel',
      dropoff_locations: manifest.manifest_type === 'arrival' ? ['Hotel'] : ['Airport'],
    };

    return { success: true, data: driverSheet };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Calculates total shuttle costs for manifests.
 * 
 * @param manifests - Array of transportation manifests
 * @returns Result containing total cost or error details
 */
export async function calculateShuttleCosts(
  manifests: TransportationManifest[]
): Promise<Result<number>> {
  try {
    let totalCost = 0;

    for (const manifest of manifests) {
      const guestCount = manifest.guest_ids.length;
      const vehicleResult = await calculateVehicleRequirements(guestCount);
      
      if (vehicleResult.success) {
        const manifestCost = vehicleResult.data.reduce(
          (sum, req) => sum + req.estimated_cost,
          0
        );
        totalCost += manifestCost;
      }
    }

    return { success: true, data: totalCost };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
