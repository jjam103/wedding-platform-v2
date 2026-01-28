import { sanitizeInput } from '@/utils/sanitization';
import { 
  success, 
  validationError, 
  databaseError, 
  notFoundError, 
  unknownError 
} from '@/utils/errors';
import type { Result } from '@/types';
import {
  createGuestSchema,
  updateGuestSchema,
  guestFilterSchema,
  guestSearchSchema,
  type CreateGuestDTO,
  type UpdateGuestDTO,
  type GuestFilterDTO,
  type GuestSearchDTO,
  type Guest,
  type PaginatedGuests,
} from '@/schemas/guestSchemas';

// Lazy load supabase to avoid initialization issues in tests
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const { supabase } = require('@/lib/supabase');
    _supabase = supabase;
  }
  return _supabase;
}

/**
 * Creates a new guest in the system.
 * 
 * @param data - Guest data including name, email, and group assignment
 * @returns Result containing the created guest or error details
 * 
 * @example
 * const result = await guestService.create({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   groupId: '123e4567-e89b-12d3-a456-426614174000',
 *   ageType: 'adult',
 *   guestType: 'wedding_guest',
 * });
 */
export async function create(data: CreateGuestDTO): Promise<Result<Guest>> {
  try {
    // 1. Validate
    const validation = createGuestSchema.safeParse(data);
    if (!validation.success) {
      return validationError('Validation failed', validation.error.issues);
    }

    // 2. Sanitize user input
    const sanitized = {
      group_id: validation.data.groupId,
      first_name: sanitizeInput(validation.data.firstName),
      last_name: sanitizeInput(validation.data.lastName),
      email: validation.data.email ? sanitizeInput(validation.data.email) : null,
      phone: validation.data.phone ? sanitizeInput(validation.data.phone) : null,
      age_type: validation.data.ageType,
      guest_type: sanitizeInput(validation.data.guestType),
      dietary_restrictions: validation.data.dietaryRestrictions 
        ? sanitizeInput(validation.data.dietaryRestrictions) 
        : null,
      plus_one_name: validation.data.plusOneName 
        ? sanitizeInput(validation.data.plusOneName) 
        : null,
      plus_one_attending: validation.data.plusOneAttending ?? false,
      arrival_date: validation.data.arrivalDate ?? null,
      departure_date: validation.data.departureDate ?? null,
      airport_code: validation.data.airportCode ?? null,
      flight_number: validation.data.flightNumber 
        ? sanitizeInput(validation.data.flightNumber) 
        : null,
      invitation_sent: validation.data.invitationSent ?? false,
      invitation_sent_date: validation.data.invitationSentDate ?? null,
      rsvp_deadline: validation.data.rsvpDeadline ?? null,
      notes: validation.data.notes ? sanitizeInput(validation.data.notes) : null,
    };

    // 3. Database operation
    const { data: result, error } = await getSupabase()
      .from('guests')
      .insert(sanitized)
      .select()
      .single();

    if (error) {
      return databaseError(error.message, error);
    }

    return success(mapDatabaseToGuest(result));
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Retrieves a guest by ID.
 * 
 * @param id - Guest UUID
 * @returns Result containing the guest or error details
 */
export async function get(id: string): Promise<Result<Guest>> {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return validationError('Invalid guest ID format');
    }

    const { data, error } = await getSupabase()
      .from('guests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Guest');
      }
      return databaseError(error.message, error);
    }

    return success(mapDatabaseToGuest(data));
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Updates an existing guest.
 * 
 * @param id - Guest UUID
 * @param data - Partial guest data to update
 * @returns Result containing the updated guest or error details
 */
export async function update(
  id: string,
  data: UpdateGuestDTO
): Promise<Result<Guest>> {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return validationError('Invalid guest ID format');
    }

    // 1. Validate
    const validation = updateGuestSchema.safeParse(data);
    if (!validation.success) {
      return validationError('Validation failed', validation.error.issues);
    }

    // 2. Sanitize user input
    const sanitized: Record<string, unknown> = {};
    
    if (validation.data.groupId !== undefined) {
      sanitized.group_id = validation.data.groupId;
    }
    if (validation.data.firstName !== undefined) {
      sanitized.first_name = sanitizeInput(validation.data.firstName);
    }
    if (validation.data.lastName !== undefined) {
      sanitized.last_name = sanitizeInput(validation.data.lastName);
    }
    if (validation.data.email !== undefined) {
      sanitized.email = validation.data.email ? sanitizeInput(validation.data.email) : null;
    }
    if (validation.data.phone !== undefined) {
      sanitized.phone = validation.data.phone ? sanitizeInput(validation.data.phone) : null;
    }
    if (validation.data.ageType !== undefined) {
      sanitized.age_type = validation.data.ageType;
    }
    if (validation.data.guestType !== undefined) {
      sanitized.guest_type = sanitizeInput(validation.data.guestType);
    }
    if (validation.data.dietaryRestrictions !== undefined) {
      sanitized.dietary_restrictions = validation.data.dietaryRestrictions 
        ? sanitizeInput(validation.data.dietaryRestrictions) 
        : null;
    }
    if (validation.data.plusOneName !== undefined) {
      sanitized.plus_one_name = validation.data.plusOneName 
        ? sanitizeInput(validation.data.plusOneName) 
        : null;
    }
    if (validation.data.plusOneAttending !== undefined) {
      sanitized.plus_one_attending = validation.data.plusOneAttending;
    }
    if (validation.data.arrivalDate !== undefined) {
      sanitized.arrival_date = validation.data.arrivalDate;
    }
    if (validation.data.departureDate !== undefined) {
      sanitized.departure_date = validation.data.departureDate;
    }
    if (validation.data.airportCode !== undefined) {
      sanitized.airport_code = validation.data.airportCode;
    }
    if (validation.data.flightNumber !== undefined) {
      sanitized.flight_number = validation.data.flightNumber 
        ? sanitizeInput(validation.data.flightNumber) 
        : null;
    }
    if (validation.data.invitationSent !== undefined) {
      sanitized.invitation_sent = validation.data.invitationSent;
    }
    if (validation.data.invitationSentDate !== undefined) {
      sanitized.invitation_sent_date = validation.data.invitationSentDate;
    }
    if (validation.data.rsvpDeadline !== undefined) {
      sanitized.rsvp_deadline = validation.data.rsvpDeadline;
    }
    if (validation.data.notes !== undefined) {
      sanitized.notes = validation.data.notes ? sanitizeInput(validation.data.notes) : null;
    }

    // 3. Database operation
    const { data: result, error } = await getSupabase()
      .from('guests')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return notFoundError('Guest');
      }
      return databaseError(error.message, error);
    }

    return success(mapDatabaseToGuest(result));
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Deletes a guest by ID.
 * 
 * @param id - Guest UUID
 * @returns Result indicating success or error details
 */
export async function deleteGuest(id: string): Promise<Result<void>> {
  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return validationError('Invalid guest ID format');
    }

    const { error } = await getSupabase()
      .from('guests')
      .delete()
      .eq('id', id);

    if (error) {
      return databaseError(error.message, error);
    }

    return success(undefined);
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Lists guests with optional filtering and pagination.
 * 
 * @param filters - Optional filters for group, age type, guest type, etc.
 * @returns Result containing paginated guest list or error details
 */
export async function list(
  filters: GuestFilterDTO = {}
): Promise<Result<PaginatedGuests>> {
  try {
    // 1. Validate
    const validation = guestFilterSchema.safeParse(filters);
    if (!validation.success) {
      return validationError('Invalid filters', validation.error.issues);
    }

    const { groupId, ageType, guestType, invitationSent, page = 1, pageSize = 50 } = validation.data;

    // Build query
    let query = getSupabase().from('guests').select('*', { count: 'exact' });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }
    if (ageType) {
      query = query.eq('age_type', ageType);
    }
    if (guestType) {
      query = query.eq('guest_type', guestType);
    }
    if (invitationSent !== undefined) {
      query = query.eq('invitation_sent', invitationSent);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Order by last name, first name
    query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return databaseError(error.message, error);
    }

    const guests = data.map(mapDatabaseToGuest);
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return success({
      guests,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Searches guests by name or email.
 * 
 * @param searchParams - Search query and pagination options
 * @returns Result containing paginated search results or error details
 */
export async function search(
  searchParams: GuestSearchDTO
): Promise<Result<PaginatedGuests>> {
  try {
    // 1. Validate
    const validation = guestSearchSchema.safeParse(searchParams);
    if (!validation.success) {
      return validationError('Invalid search parameters', validation.error.issues);
    }

    const { query, page = 1, pageSize = 50 } = validation.data;

    // Sanitize search query
    const sanitizedQuery = sanitizeInput(query);

    // Build search query - search in first_name, last_name, and email
    const { data, error, count } = await getSupabase()
      .from('guests')
      .select('*', { count: 'exact' })
      .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      return databaseError(error.message, error);
    }

    const guests = data.map(mapDatabaseToGuest);
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return success({
      guests,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Maps database column names to camelCase Guest object.
 * 
 * @param dbGuest - Guest data from database with snake_case columns
 * @returns Guest object with camelCase properties
 */
function mapDatabaseToGuest(dbGuest: any): Guest {
  return {
    id: dbGuest.id,
    groupId: dbGuest.group_id,
    firstName: dbGuest.first_name,
    lastName: dbGuest.last_name,
    email: dbGuest.email,
    phone: dbGuest.phone,
    ageType: dbGuest.age_type,
    guestType: dbGuest.guest_type,
    dietaryRestrictions: dbGuest.dietary_restrictions,
    plusOneName: dbGuest.plus_one_name,
    plusOneAttending: dbGuest.plus_one_attending,
    arrivalDate: dbGuest.arrival_date,
    departureDate: dbGuest.departure_date,
    airportCode: dbGuest.airport_code,
    flightNumber: dbGuest.flight_number,
    invitationSent: dbGuest.invitation_sent,
    invitationSentDate: dbGuest.invitation_sent_date,
    rsvpDeadline: dbGuest.rsvp_deadline,
    notes: dbGuest.notes,
    createdAt: dbGuest.created_at,
    updatedAt: dbGuest.updated_at,
  };
}

/**
 * Alias for deleteGuest to match common naming conventions.
 * Deletes a guest by ID.
 * 
 * @param id - Guest UUID
 * @returns Result indicating success or error details
 */
export const remove = deleteGuest;

/**
 * Bulk creates multiple guests at once.
 * Validates and sanitizes each guest individually before creating.
 * 
 * @param guestsData - Array of guest data to create
 * @returns Result containing array of created guests or error details
 * 
 * @example
 * const result = await guestService.bulkCreate([
 *   { firstName: 'John', lastName: 'Doe', email: 'john@example.com', groupId: 'uuid', ageType: 'adult', guestType: 'wedding_guest' },
 *   { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', groupId: 'uuid', ageType: 'adult', guestType: 'wedding_guest' }
 * ]);
 */
export async function bulkCreate(guestsData: CreateGuestDTO[]): Promise<Result<Guest[]>> {
  try {
    // Validate input
    if (!Array.isArray(guestsData) || guestsData.length === 0) {
      return validationError('Guests data array is required and must not be empty');
    }

    // Validate and sanitize all guests first
    const sanitizedGuests: any[] = [];
    const validationErrors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < guestsData.length; i++) {
      const guestData = guestsData[i];
      
      // 1. Validate
      const validation = createGuestSchema.safeParse(guestData);
      if (!validation.success) {
        validationErrors.push({
          index: i,
          error: `Validation failed: ${validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        });
        continue;
      }

      // 2. Sanitize user input
      const sanitized = {
        group_id: validation.data.groupId,
        first_name: sanitizeInput(validation.data.firstName),
        last_name: sanitizeInput(validation.data.lastName),
        email: validation.data.email ? sanitizeInput(validation.data.email) : null,
        phone: validation.data.phone ? sanitizeInput(validation.data.phone) : null,
        age_type: validation.data.ageType,
        guest_type: sanitizeInput(validation.data.guestType),
        dietary_restrictions: validation.data.dietaryRestrictions 
          ? sanitizeInput(validation.data.dietaryRestrictions) 
          : null,
        plus_one_name: validation.data.plusOneName 
          ? sanitizeInput(validation.data.plusOneName) 
          : null,
        plus_one_attending: validation.data.plusOneAttending ?? false,
        arrival_date: validation.data.arrivalDate ?? null,
        departure_date: validation.data.departureDate ?? null,
        airport_code: validation.data.airportCode ?? null,
        flight_number: validation.data.flightNumber 
          ? sanitizeInput(validation.data.flightNumber) 
          : null,
        invitation_sent: validation.data.invitationSent ?? false,
        invitation_sent_date: validation.data.invitationSentDate ?? null,
        rsvp_deadline: validation.data.rsvpDeadline ?? null,
        notes: validation.data.notes ? sanitizeInput(validation.data.notes) : null,
      };

      sanitizedGuests.push(sanitized);
    }

    // If there were validation errors, return them
    if (validationErrors.length > 0) {
      return validationError(
        `Bulk create failed with ${validationErrors.length} validation error(s)`,
        validationErrors
      );
    }

    // 3. Database operation - bulk insert
    const { data: result, error } = await getSupabase()
      .from('guests')
      .insert(sanitizedGuests)
      .select();

    if (error) {
      return databaseError(error.message, error);
    }

    return success(result.map(mapDatabaseToGuest));
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Bulk updates multiple guests with the same data.
 * Applies the same validation and sanitization as single updates.
 * 
 * @param ids - Array of guest UUIDs to update
 * @param data - Partial guest data to apply to all guests
 * @returns Result containing array of updated guests or error details
 * 
 * @example
 * const result = await guestService.bulkUpdate(
 *   ['uuid1', 'uuid2', 'uuid3'],
 *   { invitationSent: true, invitationSentDate: '2025-01-25' }
 * );
 */
export async function bulkUpdate(
  ids: string[],
  data: UpdateGuestDTO
): Promise<Result<Guest[]>> {
  try {
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return validationError('Guest IDs array is required and must not be empty');
    }

    // Validate all UUIDs
    for (const id of ids) {
      if (!isValidUUID(id)) {
        return validationError(`Invalid guest ID format: ${id}`);
      }
    }

    // 1. Validate data using same schema as single update
    const validation = updateGuestSchema.safeParse(data);
    if (!validation.success) {
      return validationError('Validation failed', validation.error.issues);
    }

    // 2. Sanitize user input using same logic as single update
    const sanitized: Record<string, unknown> = {};
    
    if (validation.data.groupId !== undefined) {
      sanitized.group_id = validation.data.groupId;
    }
    if (validation.data.firstName !== undefined) {
      sanitized.first_name = sanitizeInput(validation.data.firstName);
    }
    if (validation.data.lastName !== undefined) {
      sanitized.last_name = sanitizeInput(validation.data.lastName);
    }
    if (validation.data.email !== undefined) {
      sanitized.email = validation.data.email ? sanitizeInput(validation.data.email) : null;
    }
    if (validation.data.phone !== undefined) {
      sanitized.phone = validation.data.phone ? sanitizeInput(validation.data.phone) : null;
    }
    if (validation.data.ageType !== undefined) {
      sanitized.age_type = validation.data.ageType;
    }
    if (validation.data.guestType !== undefined) {
      sanitized.guest_type = sanitizeInput(validation.data.guestType);
    }
    if (validation.data.dietaryRestrictions !== undefined) {
      sanitized.dietary_restrictions = validation.data.dietaryRestrictions 
        ? sanitizeInput(validation.data.dietaryRestrictions) 
        : null;
    }
    if (validation.data.plusOneName !== undefined) {
      sanitized.plus_one_name = validation.data.plusOneName 
        ? sanitizeInput(validation.data.plusOneName) 
        : null;
    }
    if (validation.data.plusOneAttending !== undefined) {
      sanitized.plus_one_attending = validation.data.plusOneAttending;
    }
    if (validation.data.arrivalDate !== undefined) {
      sanitized.arrival_date = validation.data.arrivalDate;
    }
    if (validation.data.departureDate !== undefined) {
      sanitized.departure_date = validation.data.departureDate;
    }
    if (validation.data.airportCode !== undefined) {
      sanitized.airport_code = validation.data.airportCode;
    }
    if (validation.data.flightNumber !== undefined) {
      sanitized.flight_number = validation.data.flightNumber 
        ? sanitizeInput(validation.data.flightNumber) 
        : null;
    }
    if (validation.data.invitationSent !== undefined) {
      sanitized.invitation_sent = validation.data.invitationSent;
    }
    if (validation.data.invitationSentDate !== undefined) {
      sanitized.invitation_sent_date = validation.data.invitationSentDate;
    }
    if (validation.data.rsvpDeadline !== undefined) {
      sanitized.rsvp_deadline = validation.data.rsvpDeadline;
    }
    if (validation.data.notes !== undefined) {
      sanitized.notes = validation.data.notes ? sanitizeInput(validation.data.notes) : null;
    }

    // 3. Database operation - bulk update
    const { data: result, error } = await getSupabase()
      .from('guests')
      .update(sanitized)
      .in('id', ids)
      .select();

    if (error) {
      return databaseError(error.message, error);
    }

    // Check if all guests were updated
    if (!result || result.length !== ids.length) {
      return validationError(
        `Expected to update ${ids.length} guests, but only ${result?.length || 0} were updated. Some guest IDs may not exist.`
      );
    }

    return success(result.map(mapDatabaseToGuest));
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Bulk deletes multiple guests by their IDs.
 * 
 * @param ids - Array of guest UUIDs to delete
 * @returns Result indicating success or error details
 * 
 * @example
 * const result = await guestService.bulkDelete(['uuid1', 'uuid2', 'uuid3']);
 */
export async function bulkDelete(ids: string[]): Promise<Result<void>> {
  try {
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return validationError('Guest IDs array is required and must not be empty');
    }

    // Validate all UUIDs
    for (const id of ids) {
      if (!isValidUUID(id)) {
        return validationError(`Invalid guest ID format: ${id}`);
      }
    }

    // Database operation - bulk delete
    const { error, count } = await getSupabase()
      .from('guests')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (error) {
      return databaseError(error.message, error);
    }

    // Note: Supabase doesn't return an error if some IDs don't exist,
    // it just deletes the ones that do exist. This is acceptable behavior
    // for bulk delete operations.

    return success(undefined);
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Validates UUID format.
 * 
 * @param uuid - String to validate
 * @returns True if valid UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * CSV column headers in the order they appear in the CSV file.
 */
const CSV_HEADERS = [
  'groupId',
  'firstName',
  'lastName',
  'email',
  'phone',
  'ageType',
  'guestType',
  'dietaryRestrictions',
  'plusOneName',
  'plusOneAttending',
  'arrivalDate',
  'departureDate',
  'airportCode',
  'flightNumber',
  'invitationSent',
  'invitationSentDate',
  'rsvpDeadline',
  'notes',
] as const;

/**
 * Escapes a CSV field value by wrapping in quotes if needed.
 * 
 * @param value - Field value to escape
 * @returns Escaped CSV field value
 */
function escapeCSVField(value: string | null | boolean): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Parses a CSV field value, handling quoted fields.
 * 
 * @param value - CSV field value to parse
 * @returns Unescaped field value
 */
function parseCSVField(value: string): string {
  if (!value) {
    return '';
  }
  
  // If wrapped in quotes, remove them and unescape internal quotes
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/""/g, '"');
  }
  
  return value;
}

/**
 * Parses a CSV line into fields, handling quoted fields with commas.
 * 
 * @param line - CSV line to parse
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Exports guests to CSV format (Pretty_Printer).
 * 
 * @param guests - Array of guests to export
 * @returns Result containing CSV string or error details
 * 
 * @example
 * const result = await guestService.exportToCSV(guests);
 * if (result.success) {
 *   // Download or save result.data as CSV file
 * }
 */
export async function exportToCSV(guests: Guest[]): Promise<Result<string>> {
  try {
    if (!Array.isArray(guests)) {
      return validationError('Guests must be an array');
    }

    // Build CSV header
    const headerLine = CSV_HEADERS.join(',');
    
    // Build CSV rows
    const rows = guests.map(guest => {
      const row = CSV_HEADERS.map(header => {
        const value = guest[header as keyof Guest];
        return escapeCSVField(value);
      });
      return row.join(',');
    });
    
    // Combine header and rows
    const csv = [headerLine, ...rows].join('\n');
    
    return success(csv);
  } catch (error) {
    return unknownError(error);
  }
}

/**
 * Imports guests from CSV format.
 * Validates each row against the guest schema before importing.
 * 
 * @param csvContent - CSV string content to import
 * @returns Result containing array of created guests or error details
 * 
 * @example
 * const result = await guestService.importFromCSV(csvFileContent);
 * if (result.success) {
 *   console.log(`Imported ${result.data.length} guests`);
 * }
 */
export async function importFromCSV(csvContent: string): Promise<Result<Guest[]>> {
  try {
    if (typeof csvContent !== 'string' || !csvContent.trim()) {
      return validationError('CSV content is required');
    }

    // Split into lines
    const lines = csvContent.trim().split('\n');
    
    if (lines.length < 1) {
      return validationError('CSV must contain at least a header row');
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    
    // Validate headers match expected format
    const expectedHeaders = [...CSV_HEADERS];
    if (headers.length !== expectedHeaders.length) {
      return validationError(
        `CSV header mismatch. Expected ${expectedHeaders.length} columns, got ${headers.length}. Expected: ${expectedHeaders.join(', ')}`
      );
    }
    
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        return validationError(
          `CSV header mismatch at column ${i + 1}. Expected "${expectedHeaders[i]}", got "${headers[i]}"`
        );
      }
    }
    
    // If only header row (no data), return validation error
    if (lines.length < 2) {
      return validationError('CSV must contain at least one data row');
    }

    // Parse data rows
    const guestsToCreate: CreateGuestDTO[] = [];
    const errors: Array<{ line: number; error: string }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const fields = parseCSVLine(line);
      
      if (fields.length !== headers.length) {
        errors.push({
          line: i + 1,
          error: `Expected ${headers.length} fields, got ${fields.length}`,
        });
        continue;
      }
      
      // Build guest object from CSV fields
      const guestData: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = parseCSVField(fields[j]);
        
        // Convert empty strings to null for nullable fields
        if (value === '') {
          if (['email', 'phone', 'dietaryRestrictions', 'plusOneName', 'arrivalDate', 
               'departureDate', 'airportCode', 'flightNumber', 'invitationSentDate', 
               'rsvpDeadline', 'notes'].includes(header)) {
            guestData[header] = null;
          }
        } else if (header === 'plusOneAttending' || header === 'invitationSent') {
          // Convert boolean fields
          guestData[header] = value.toLowerCase() === 'true';
        } else {
          guestData[header] = value;
        }
      }
      
      // Validate guest data
      const validation = createGuestSchema.safeParse(guestData);
      
      if (!validation.success) {
        errors.push({
          line: i + 1,
          error: `Validation failed: ${validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
        });
        continue;
      }
      
      guestsToCreate.push(validation.data);
    }
    
    // If there were validation errors, return them
    if (errors.length > 0) {
      return validationError(
        `CSV import failed with ${errors.length} error(s)`,
        errors
      );
    }
    
    // Create all guests (or return empty array if none to create)
    const createdGuests: Guest[] = [];
    
    if (guestsToCreate.length === 0) {
      return success(createdGuests);
    }
    
    const createErrors: Array<{ guest: string; error: string }> = [];
    
    for (const guestData of guestsToCreate) {
      const result = await create(guestData);
      
      if (result.success) {
        createdGuests.push(result.data);
      } else {
        createErrors.push({
          guest: `${guestData.firstName} ${guestData.lastName}`,
          error: result.error.message,
        });
      }
    }
    
    // If some guests failed to create, return partial success with details
    if (createErrors.length > 0) {
      return {
        success: false,
        error: {
          code: 'PARTIAL_IMPORT_FAILURE',
          message: `Imported ${createdGuests.length} of ${guestsToCreate.length} guests. ${createErrors.length} failed.`,
          details: { createdGuests, errors: createErrors },
        },
      };
    }
    
    return success(createdGuests);
  } catch (error) {
    return unknownError(error);
  }
}

// Export alias for delete to match test expectations
export { deleteGuest as delete };
