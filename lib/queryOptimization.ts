/**
 * Query Optimization Utilities
 * 
 * This module provides utilities for optimizing database queries,
 * preventing N+1 query patterns, and implementing efficient data fetching.
 * 
 * Requirements: 19.1, 19.2, 18.6, 18.7
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Pagination configuration
 */
export const PAGINATION_DEFAULTS = {
  GUESTS_PER_PAGE: 50,
  ACTIVITIES_PER_PAGE: 50,
  EVENTS_PER_PAGE: 50,
  PHOTOS_PER_PAGE: 50,
  EMAIL_HISTORY_PER_PAGE: 50,
  AUDIT_LOGS_PER_PAGE: 100,
} as const;

/**
 * Calculate pagination range for Supabase queries
 */
export function getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/**
 * Fetch guests with their RSVPs in a single query (prevents N+1)
 * 
 * Instead of:
 * 1. Fetch all guests
 * 2. For each guest, fetch their RSVPs (N queries)
 * 
 * Do:
 * 1. Fetch guests with RSVPs joined (1 query)
 */
export async function fetchGuestsWithRSVPs(
  supabase: ReturnType<typeof createClient>,
  options: {
    groupId?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { groupId, page = 1, pageSize = PAGINATION_DEFAULTS.GUESTS_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('guests')
    .select(`
      *,
      rsvps (
        id,
        activity_id,
        event_id,
        response_status,
        guest_count,
        dietary_restrictions
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('last_name', { ascending: true });

  if (groupId) {
    query = query.eq('group_id', groupId);
  }

  return query;
}

/**
 * Fetch events with their activities in a single query (prevents N+1)
 */
export async function fetchEventsWithActivities(
  supabase: ReturnType<typeof createClient>,
  options: {
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { includeInactive = false, page = 1, pageSize = PAGINATION_DEFAULTS.EVENTS_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('events')
    .select(`
      *,
      activities (
        id,
        title,
        activity_date,
        activity_time,
        activity_type,
        capacity,
        cost_per_person,
        location_id
      ),
      locations (
        id,
        name,
        type
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('event_date', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  return query;
}

/**
 * Fetch activities with their RSVPs and capacity info in a single query (prevents N+1)
 */
export async function fetchActivitiesWithRSVPs(
  supabase: ReturnType<typeof createClient>,
  options: {
    eventId?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { eventId, page = 1, pageSize = PAGINATION_DEFAULTS.ACTIVITIES_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('activities')
    .select(`
      *,
      rsvps (
        id,
        guest_id,
        response_status,
        guest_count
      ),
      locations (
        id,
        name,
        type
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('activity_date', { ascending: true });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  return query;
}

/**
 * Fetch content pages with their sections in a single query (prevents N+1)
 */
export async function fetchContentPagesWithSections(
  supabase: ReturnType<typeof createClient>,
  options: {
    status?: 'draft' | 'published';
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { status, page = 1, pageSize = 50 } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('content_pages')
    .select(`
      *,
      sections (
        id,
        title,
        display_order,
        section_columns (
          id,
          column_number,
          content_type,
          content_data
        )
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  return query;
}

/**
 * Fetch photos with uploader info in a single query (prevents N+1)
 */
export async function fetchPhotosWithUploaders(
  supabase: ReturnType<typeof createClient>,
  options: {
    moderationStatus?: 'pending' | 'approved' | 'rejected';
    pageType?: string;
    pageId?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { moderationStatus, pageType, pageId, page = 1, pageSize = PAGINATION_DEFAULTS.PHOTOS_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('photos')
    .select(`
      *,
      guests!uploader_id (
        id,
        first_name,
        last_name
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (moderationStatus) {
    query = query.eq('moderation_status', moderationStatus);
  }

  if (pageType && pageId) {
    query = query.eq('page_type', pageType).eq('page_id', pageId);
  }

  return query;
}

/**
 * Batch fetch entities by IDs (prevents N+1)
 * 
 * Instead of:
 * for (const id of ids) {
 *   await supabase.from('table').select('*').eq('id', id).single();
 * }
 * 
 * Do:
 * await batchFetchByIds(supabase, 'table', ids);
 */
export async function batchFetchByIds<T = any>(
  supabase: ReturnType<typeof createClient>,
  table: string,
  ids: string[],
  selectFields: string = '*'
): Promise<{ data: T[] | null; error: any }> {
  if (ids.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from(table)
    .select(selectFields)
    .in('id', ids);
}

/**
 * Fetch audit logs with user info in a single query (prevents N+1)
 */
export async function fetchAuditLogsWithUsers(
  supabase: ReturnType<typeof createClient>,
  options: {
    userId?: string;
    entityType?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { userId, entityType, action, page = 1, pageSize = PAGINATION_DEFAULTS.AUDIT_LOGS_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      users!user_id (
        id,
        email,
        role
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('timestamp', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (action) {
    query = query.eq('action', action);
  }

  return query;
}

/**
 * Fetch email history with template info in a single query (prevents N+1)
 */
export async function fetchEmailHistoryWithTemplates(
  supabase: ReturnType<typeof createClient>,
  options: {
    deliveryStatus?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { deliveryStatus, page = 1, pageSize = PAGINATION_DEFAULTS.EMAIL_HISTORY_PER_PAGE } = options;
  const { from, to } = getPaginationRange(page, pageSize);

  let query = supabase
    .from('email_history')
    .select(`
      *,
      email_templates (
        id,
        name,
        category
      ),
      users!sent_by (
        id,
        email
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('sent_at', { ascending: false });

  if (deliveryStatus) {
    query = query.eq('delivery_status', deliveryStatus);
  }

  return query;
}

/**
 * Query optimization best practices:
 * 
 * 1. Always use pagination for large result sets
 * 2. Use select with joins to fetch related data in one query
 * 3. Batch queries when fetching multiple entities by ID
 * 4. Use indexes on frequently queried columns
 * 5. Use composite indexes for multi-column filters
 * 6. Use partial indexes for frequently filtered subsets
 * 7. Avoid SELECT * when you only need specific fields
 * 8. Use .single() only when you expect exactly one result
 * 9. Use .maybeSingle() when you expect 0 or 1 results
 * 10. Use count: 'exact' only when you need the total count
 * 
 * Performance targets:
 * - Database queries: < 100ms (p95)
 * - API responses: < 500ms (p95)
 * - Page loads: < 2 seconds
 */
