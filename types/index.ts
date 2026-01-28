/**
 * Result type for consistent error handling across the application.
 * All service methods return Result<T> instead of throwing errors.
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorDetails };

/**
 * Error details structure for failed operations.
 */
export interface ErrorDetails {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Standard error codes used throughout the application.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  GUEST_NOT_FOUND: 'GUEST_NOT_FOUND',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  CRON_JOB_ERROR: 'CRON_JOB_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * RSVP entity representing a guest's response to an event or activity.
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export interface RSVP {
  id: string;
  guest_id: string;
  event_id?: string;
  activity_id?: string;
  status: 'pending' | 'attending' | 'declined' | 'maybe';
  guest_count?: number;
  dietary_notes?: string;
  special_requirements?: string;
  notes?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Guest entity representing a wedding attendee.
 * Requirements: 2.1, 3.1, 3.11, 3.12, 3.14, 3.15, 3.16, 3.18
 */
export interface Guest {
  id: string;
  group_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  age_type: 'adult' | 'child' | 'senior';
  guest_type: 'wedding_party' | 'wedding_guest' | 'prewedding_only' | 'postwedding_only' | string;
  dietary_restrictions?: string;
  plus_one_name?: string;
  plus_one_attending?: boolean;
  arrival_date?: string;
  departure_date?: string;
  airport_code?: 'SJO' | 'LIR' | 'Other';
  flight_number?: string;
  invitation_sent: boolean;
  invitation_sent_date?: string;
  rsvp_deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Event entity representing a wedding event.
 * Requirements: 4.1, 4.2, 4.4, 4.6, 4.7, 4.11
 */
export interface Event {
  id: string;
  name: string;
  description?: string;
  event_type: 'ceremony' | 'reception' | 'pre_wedding' | 'post_wedding';
  location_id?: string;
  start_date: string;
  end_date?: string;
  rsvp_required: boolean;
  rsvp_deadline?: string;
  visibility: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

/**
 * Activity entity representing a wedding activity.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.11, 5.12, 5.13
 */
export interface Activity {
  id: string;
  event_id?: string;
  name: string;
  description?: string;
  activity_type: 'ceremony' | 'reception' | 'meal' | 'transport' | 'activity' | string;
  location_id?: string;
  start_time: string;
  end_time?: string;
  capacity?: number;
  cost_per_person?: number;
  host_subsidy?: number;
  adults_only: boolean;
  plus_one_allowed: boolean;
  visibility: string[];
  status: 'draft' | 'published';
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Vendor entity representing a wedding service provider.
 * Requirements: 7.1, 7.3, 7.6, 8.1, 8.3
 */
export interface Vendor {
  id: string;
  name: string;
  category: 'photography' | 'flowers' | 'catering' | 'music' | 'transportation' | 'decoration' | 'other';
  contact_name?: string;
  email?: string;
  phone?: string;
  pricing_model: 'flat_rate' | 'per_guest' | 'tiered';
  base_cost: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Photo entity representing an uploaded photo.
 * Requirements: 11.1, 11.2, 11.3, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12
 */
export interface Photo {
  id: string;
  uploader_id: string;
  photo_url: string;
  storage_type: 'b2' | 'supabase';
  page_type: 'event' | 'activity' | 'accommodation' | 'memory';
  page_id?: string;
  caption?: string;
  alt_text?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  display_order?: number;
  created_at: string;
  moderated_at?: string;
}

/**
 * User entity representing a system user.
 * Requirements: 1.1, 1.3, 1.6, 1.7
 */
export interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'host' | 'guest';
  created_at: string;
  last_login?: string;
}
