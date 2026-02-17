import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Result } from '@/types';
import { ERROR_CODES } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Use service role key for admin operations to bypass RLS
// This service is only called from authenticated admin API routes
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * RSVP View Model for management interface
 * Denormalized view with guest, event, and activity details
 */
export interface RSVPViewModel {
  id: string;
  guestId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string | null;
  eventId: string | null;
  eventName: string | null;
  activityId: string | null;
  activityName: string | null;
  status: 'pending' | 'attending' | 'declined' | 'maybe';
  guestCount: number | null;
  dietaryNotes: string | null;
  specialRequirements: string | null;
  notes: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * RSVP Statistics
 */
export interface RSVPStatistics {
  totalRSVPs: number;
  byStatus: {
    attending: number;
    declined: number;
    maybe: number;
    pending: number;
  };
  totalGuestCount: number;
}

/**
 * RSVP Filters for querying
 */
export interface RSVPFilters {
  eventId?: string;
  activityId?: string;
  status?: 'pending' | 'attending' | 'declined' | 'maybe';
  guestId?: string;
  searchQuery?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated RSVP response
 */
export interface PaginatedRSVPResponse {
  data: RSVPViewModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statistics: RSVPStatistics;
}

/**
 * Schema for RSVP filters validation
 */
const rsvpFiltersSchema = z.object({
  eventId: z.string().uuid().optional(),
  activityId: z.string().uuid().optional(),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']).optional(),
  guestId: z.string().uuid().optional(),
  searchQuery: z.string().max(100).optional(),
});

/**
 * Schema for pagination validation
 */
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

/**
 * Schema for bulk update validation
 */
const bulkUpdateSchema = z.object({
  rsvpIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['pending', 'attending', 'declined', 'maybe']),
  notes: z.string().max(1000).optional(),
});

/**
 * Lists all RSVPs with filtering, pagination, and statistics.
 * 
 * @param filters - Filter criteria for RSVPs
 * @param pagination - Pagination parameters
 * @returns Result containing paginated RSVPs with statistics
 * 
 * **Validates: Requirements 6.2, 6.4, 6.5**
 * 
 * @example
 * const result = await rsvpManagementService.listRSVPs(
 *   { eventId: 'event-123', status: 'attending' },
 *   { page: 1, limit: 50 }
 * );
 */
export async function listRSVPs(
  filters: RSVPFilters = {},
  pagination: PaginationParams = { page: 1, limit: 50 }
): Promise<Result<PaginatedRSVPResponse>> {
  try {
    // 1. Validate filters
    const filterValidation = rsvpFiltersSchema.safeParse(filters);
    if (!filterValidation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid filter parameters',
          details: filterValidation.error.issues,
        },
      };
    }

    // 2. Validate pagination
    const paginationValidation = paginationSchema.safeParse(pagination);
    if (!paginationValidation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid pagination parameters',
          details: paginationValidation.error.issues,
        },
      };
    }

    const validFilters = filterValidation.data;
    const validPagination = paginationValidation.data;

    // 3. Build complex query with joins
    let query = supabase
      .from('rsvps')
      .select(`
        id,
        guest_id,
        event_id,
        activity_id,
        status,
        guest_count,
        dietary_notes,
        special_requirements,
        notes,
        responded_at,
        created_at,
        updated_at,
        guests!inner (
          first_name,
          last_name,
          email
        ),
        events (
          name
        ),
        activities (
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (validFilters.eventId) {
      query = query.eq('event_id', validFilters.eventId);
    }
    if (validFilters.activityId) {
      query = query.eq('activity_id', validFilters.activityId);
    }
    if (validFilters.status) {
      query = query.eq('status', validFilters.status);
    }
    if (validFilters.guestId) {
      query = query.eq('guest_id', validFilters.guestId);
    }

    // Apply search query (searches guest name and email)
    // Note: Supabase doesn't support .or() with joined table filters
    // We need to fetch all data and filter in memory for search
    // For production, consider using a database view or full-text search
    const hasSearchQuery = !!validFilters.searchQuery;
    
    // If we have a search query, we need to fetch ALL matching records first,
    // then filter in memory, then paginate
    if (!hasSearchQuery) {
      // No search - apply pagination at database level
      const from = (validPagination.page - 1) * validPagination.limit;
      const to = from + validPagination.limit - 1;
      query = query.range(from, to);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Execute query
    const { data, error, count } = await query;

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

    // 4. Apply search filter in memory if needed (after fetching with joins)
    let filteredData = data || [];
    if (hasSearchQuery && filteredData.length > 0) {
      const searchLower = validFilters.searchQuery!.toLowerCase();
      filteredData = filteredData.filter((rsvp: any) => {
        const firstName = rsvp.guests?.first_name?.toLowerCase() || '';
        const lastName = rsvp.guests?.last_name?.toLowerCase() || '';
        const email = rsvp.guests?.email?.toLowerCase() || '';
        return firstName.includes(searchLower) || 
               lastName.includes(searchLower) || 
               email.includes(searchLower);
      });
    }

    // Calculate total count (use database count if no search, filtered length if search)
    const totalCount = hasSearchQuery ? filteredData.length : (count || 0);

    // Apply pagination in memory if we did search filtering
    if (hasSearchQuery) {
      const from = (validPagination.page - 1) * validPagination.limit;
      const to = from + validPagination.limit;
      filteredData = filteredData.slice(from, to);
    }

    // 5. Transform to view model
    const viewModels: RSVPViewModel[] = filteredData.map((rsvp: any) => ({
      id: rsvp.id,
      guestId: rsvp.guest_id,
      guestFirstName: rsvp.guests?.first_name || '',
      guestLastName: rsvp.guests?.last_name || '',
      guestEmail: rsvp.guests?.email || null,
      eventId: rsvp.event_id,
      eventName: rsvp.events?.name || null,
      activityId: rsvp.activity_id,
      activityName: rsvp.activities?.name || null,
      status: rsvp.status,
      guestCount: rsvp.guest_count,
      dietaryNotes: rsvp.dietary_notes,
      specialRequirements: rsvp.special_requirements,
      notes: rsvp.notes,
      respondedAt: rsvp.responded_at,
      createdAt: rsvp.created_at,
      updatedAt: rsvp.updated_at,
    }));

    // 6. Calculate statistics (use same filters as main query)
    const statisticsResult = await getRSVPStatistics(validFilters);
    const statistics = statisticsResult.success 
      ? statisticsResult.data 
      : {
          totalRSVPs: 0,
          byStatus: { attending: 0, declined: 0, maybe: 0, pending: 0 },
          totalGuestCount: 0,
        };

    // 7. Build response
    const totalPages = Math.ceil(totalCount / validPagination.limit);

    return {
      success: true,
      data: {
        data: viewModels,
        pagination: {
          page: validPagination.page,
          limit: validPagination.limit,
          total: totalCount,
          totalPages,
        },
        statistics,
      },
    };
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
 * Gets RSVP statistics for the given filters.
 * 
 * @param filters - Filter criteria for RSVPs
 * @returns Result containing RSVP statistics
 * 
 * **Validates: Requirements 6.5**
 * 
 * @example
 * const result = await rsvpManagementService.getRSVPStatistics({
 *   eventId: 'event-123'
 * });
 */
export async function getRSVPStatistics(
  filters: RSVPFilters = {}
): Promise<Result<RSVPStatistics>> {
  try {
    // 1. Validate filters
    const filterValidation = rsvpFiltersSchema.safeParse(filters);
    if (!filterValidation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid filter parameters',
          details: filterValidation.error.issues,
        },
      };
    }

    const validFilters = filterValidation.data;

    // 2. Build query
    let query = supabase
      .from('rsvps')
      .select('status, guest_count');

    // Apply filters
    if (validFilters.eventId) {
      query = query.eq('event_id', validFilters.eventId);
    }
    if (validFilters.activityId) {
      query = query.eq('activity_id', validFilters.activityId);
    }
    if (validFilters.status) {
      query = query.eq('status', validFilters.status);
    }
    if (validFilters.guestId) {
      query = query.eq('guest_id', validFilters.guestId);
    }

    // Execute query
    const { data, error } = await query;

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

    // 3. Calculate statistics
    const statistics: RSVPStatistics = {
      totalRSVPs: data?.length || 0,
      byStatus: {
        attending: 0,
        declined: 0,
        maybe: 0,
        pending: 0,
      },
      totalGuestCount: 0,
    };

    if (data) {
      for (const rsvp of data) {
        // Count by status
        if (rsvp.status in statistics.byStatus) {
          statistics.byStatus[rsvp.status as keyof typeof statistics.byStatus]++;
        }

        // Sum guest counts (default to 1 if not specified)
        if (rsvp.status === 'attending') {
          statistics.totalGuestCount += rsvp.guest_count || 1;
        }
      }
    }

    return {
      success: true,
      data: statistics,
    };
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
 * Bulk updates RSVP statuses with transaction handling.
 * 
 * @param rsvpIds - Array of RSVP IDs to update
 * @param status - New status for all RSVPs
 * @param notes - Optional notes to add to all RSVPs
 * @returns Result containing count of updated RSVPs
 * 
 * **Validates: Requirements 6.4**
 * 
 * @example
 * const result = await rsvpManagementService.bulkUpdateRSVPs(
 *   ['rsvp-1', 'rsvp-2', 'rsvp-3'],
 *   'attending',
 *   'Bulk approved by admin'
 * );
 */
export async function bulkUpdateRSVPs(
  rsvpIds: string[],
  status: 'pending' | 'attending' | 'declined' | 'maybe',
  notes?: string
): Promise<Result<{ updatedCount: number }>> {
  try {
    // 1. Validate input
    const validation = bulkUpdateSchema.safeParse({ rsvpIds, status, notes });
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid bulk update parameters',
          details: validation.error.issues,
        },
      };
    }

    const { rsvpIds: validIds, status: validStatus, notes: validNotes } = validation.data;

    // 2. Prepare update data
    const updateData: any = {
      status: validStatus,
      updated_at: new Date().toISOString(),
    };

    // Set responded_at if status is not pending
    if (validStatus !== 'pending') {
      updateData.responded_at = new Date().toISOString();
    }

    // Add notes if provided
    if (validNotes) {
      updateData.notes = validNotes;
    }

    // 3. Execute bulk update with transaction handling
    // Note: Supabase doesn't support explicit transactions in the client library,
    // but the update operation is atomic at the database level
    const { data, error } = await supabase
      .from('rsvps')
      .update(updateData)
      .in('id', validIds)
      .select('id');

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

    // 4. Return count of updated records
    const updatedCount = data?.length || 0;

    // Log if not all RSVPs were updated (some might not exist)
    if (updatedCount < validIds.length) {
      console.warn(
        `Bulk update: ${updatedCount} of ${validIds.length} RSVPs updated. ` +
        `${validIds.length - updatedCount} RSVPs not found.`
      );
    }

    return {
      success: true,
      data: { updatedCount },
    };
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
 * Exports RSVPs to CSV format.
 * 
 * @param filters - Filter criteria for RSVPs to export
 * @returns Result containing CSV string
 * 
 * **Validates: Requirements 6.4**
 * 
 * @example
 * const result = await rsvpManagementService.exportRSVPsToCSV({
 *   eventId: 'event-123',
 *   status: 'attending'
 * });
 */
export async function exportRSVPsToCSV(
  filters: RSVPFilters = {}
): Promise<Result<string>> {
  try {
    // 1. Validate filters
    const filterValidation = rsvpFiltersSchema.safeParse(filters);
    if (!filterValidation.success) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid filter parameters',
          details: filterValidation.error.issues,
        },
      };
    }

    const validFilters = filterValidation.data;

    // 2. Fetch all matching RSVPs (limit to 10,000 for performance)
    const result = await listRSVPs(validFilters, { page: 1, limit: 10000 });

    if (!result.success) {
      return result;
    }

    const rsvps = result.data.data;

    // 3. Build CSV header
    const headers = [
      'RSVP ID',
      'Guest First Name',
      'Guest Last Name',
      'Guest Email',
      'Event Name',
      'Activity Name',
      'Status',
      'Guest Count',
      'Dietary Notes',
      'Special Requirements',
      'Notes',
      'Responded At',
      'Created At',
    ];

    // 4. Build CSV rows
    const rows = rsvps.map((rsvp) => [
      rsvp.id,
      rsvp.guestFirstName,
      rsvp.guestLastName,
      rsvp.guestEmail || '',
      rsvp.eventName || '',
      rsvp.activityName || '',
      rsvp.status,
      rsvp.guestCount?.toString() || '1',
      rsvp.dietaryNotes || '',
      rsvp.specialRequirements || '',
      rsvp.notes || '',
      rsvp.respondedAt || '',
      rsvp.createdAt,
    ]);

    // 5. Format as CSV
    const escapeCsvValue = (value: string): string => {
      // Escape double quotes and wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ];

    const csv = csvLines.join('\n');

    return {
      success: true,
      data: csv,
    };
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
