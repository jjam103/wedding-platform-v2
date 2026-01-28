/**
 * Database Query Optimization Utilities
 * 
 * Provides utilities for:
 * - Selecting only needed fields
 * - Implementing pagination (50 items per page default)
 * - Query performance monitoring
 * 
 * Requirements: 20.1, 20.4
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum page size to prevent performance issues
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Calculate pagination range for Supabase queries
 * 
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with from and to indices for Supabase range()
 */
export function calculatePaginationRange(
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): { from: number; to: number } {
  // Validate and constrain inputs
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const from = (validPage - 1) * validPageSize;
  const to = from + validPageSize - 1;

  return { from, to };
}

/**
 * Build paginated result object
 * 
 * @param data - Query result data
 * @param totalCount - Total count from query
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns Paginated result with metadata
 */
export function buildPaginatedResult<T>(
  data: T[],
  totalCount: number,
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE
): PaginatedResult<T> {
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const totalPages = Math.ceil(totalCount / validPageSize);

  return {
    data,
    pagination: {
      page: validPage,
      pageSize: validPageSize,
      totalCount,
      totalPages,
      hasNextPage: validPage < totalPages,
      hasPreviousPage: validPage > 1,
    },
  };
}

/**
 * Execute paginated query with automatic range calculation
 * 
 * @param query - Supabase query builder
 * @param params - Pagination parameters
 * @returns Paginated result
 */
export async function executePaginatedQuery<T>(
  query: any,
  params: PaginationParams = {}
): Promise<PaginatedResult<T>> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
  const { from, to } = calculatePaginationRange(page, pageSize);

  const { data, error, count } = await query
    .range(from, to);

  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }

  return buildPaginatedResult(data || [], count || 0, page, pageSize);
}

/**
 * Field selection utilities
 */

/**
 * Common field selections for different entities
 * Selecting only needed fields improves query performance
 */
export const FIELD_SELECTIONS = {
  // Guest list view - minimal fields
  guestList: 'id, first_name, last_name, email, age_type, guest_type, group_id',
  
  // Guest detail view - all fields
  guestDetail: '*',
  
  // Event list view
  eventList: 'id, slug, title, event_type, event_date, event_time, is_active, location_id',
  
  // Event detail view
  eventDetail: '*',
  
  // Activity list view
  activityList: 'id, slug, title, activity_type, activity_date, activity_time, capacity, cost_per_person',
  
  // Activity detail view
  activityDetail: '*',
  
  // Content page list view
  contentPageList: 'id, slug, title, status, created_at, updated_at',
  
  // Content page detail view
  contentPageDetail: '*',
  
  // Location list view
  locationList: 'id, name, address, parent_location_id',
  
  // Location detail view
  locationDetail: '*',
  
  // Vendor list view
  vendorList: 'id, name, category, cost, payment_status',
  
  // Vendor detail view
  vendorDetail: '*',
  
  // Photo list view
  photoList: 'id, photo_url, caption, moderation_status, page_type, page_id, created_at',
  
  // Photo detail view
  photoDetail: '*',
  
  // Audit log list view
  auditLogList: 'id, timestamp, user_id, action, entity_type, entity_id, description',
  
  // Audit log detail view
  auditLogDetail: '*',
} as const;

/**
 * Query performance monitoring
 */

interface QueryMetrics {
  queryName: string;
  startTime: number;
  endTime: number;
  duration: number;
  recordCount: number;
}

const queryMetrics: QueryMetrics[] = [];

/**
 * Start monitoring a query
 * 
 * @param queryName - Name of the query for identification
 * @returns Start time
 */
export function startQueryMonitoring(queryName: string): number {
  return performance.now();
}

/**
 * End monitoring a query and log metrics
 * 
 * @param queryName - Name of the query
 * @param startTime - Start time from startQueryMonitoring
 * @param recordCount - Number of records returned
 */
export function endQueryMonitoring(
  queryName: string,
  startTime: number,
  recordCount: number
): void {
  const endTime = performance.now();
  const duration = endTime - startTime;

  const metrics: QueryMetrics = {
    queryName,
    startTime,
    endTime,
    duration,
    recordCount,
  };

  queryMetrics.push(metrics);

  // Log slow queries (> 500ms)
  if (duration > 500) {
    console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
  }

  // Keep only last 100 metrics
  if (queryMetrics.length > 100) {
    queryMetrics.shift();
  }
}

/**
 * Get query performance metrics
 * 
 * @returns Array of query metrics
 */
export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetrics];
}

/**
 * Get average query duration by name
 * 
 * @param queryName - Name of the query
 * @returns Average duration in milliseconds
 */
export function getAverageQueryDuration(queryName: string): number {
  const relevantMetrics = queryMetrics.filter(m => m.queryName === queryName);
  
  if (relevantMetrics.length === 0) {
    return 0;
  }

  const totalDuration = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
  return totalDuration / relevantMetrics.length;
}

/**
 * Clear query metrics
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

/**
 * Index recommendations for frequently queried fields
 * 
 * These indexes should be created in the database for optimal performance:
 * 
 * Guests table:
 * - CREATE INDEX idx_guests_group_id ON guests(group_id);
 * - CREATE INDEX idx_guests_email ON guests(email);
 * - CREATE INDEX idx_guests_last_name ON guests(last_name);
 * 
 * Events table:
 * - CREATE INDEX idx_events_slug ON events(slug);
 * - CREATE INDEX idx_events_event_date ON events(event_date);
 * - CREATE INDEX idx_events_location_id ON events(location_id);
 * - CREATE INDEX idx_events_is_active ON events(is_active);
 * 
 * Activities table:
 * - CREATE INDEX idx_activities_slug ON activities(slug);
 * - CREATE INDEX idx_activities_activity_date ON activities(activity_date);
 * - CREATE INDEX idx_activities_event_id ON activities(event_id);
 * 
 * Content Pages table:
 * - CREATE INDEX idx_content_pages_slug ON content_pages(slug);
 * - CREATE INDEX idx_content_pages_status ON content_pages(status);
 * 
 * Sections table:
 * - CREATE INDEX idx_sections_page_type_page_id ON sections(page_type, page_id);
 * - CREATE INDEX idx_sections_display_order ON sections(display_order);
 * 
 * Locations table:
 * - CREATE INDEX idx_locations_parent_location_id ON locations(parent_location_id);
 * 
 * Photos table:
 * - CREATE INDEX idx_photos_moderation_status ON photos(moderation_status);
 * - CREATE INDEX idx_photos_page_type_page_id ON photos(page_type, page_id);
 * 
 * Audit Logs table:
 * - CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
 * - CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
 * - CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
 * 
 * RSVPs table:
 * - CREATE INDEX idx_rsvps_guest_id ON rsvps(guest_id);
 * - CREATE INDEX idx_rsvps_activity_id ON rsvps(activity_id);
 * - CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
 */
