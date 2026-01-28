-- Performance Optimization Indexes
-- Created: 2025-01-27
-- Purpose: Add indexes on frequently queried fields for optimal performance
-- Requirements: 20.1, 20.4

-- ============================================================================
-- GUESTS TABLE INDEXES
-- ============================================================================

-- Index on group_id for filtering guests by group
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id);

-- Index on email for guest lookup and search
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);

-- Index on last_name for sorting and search
CREATE INDEX IF NOT EXISTS idx_guests_last_name ON guests(last_name);

-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_guests_group_age_type ON guests(group_id, age_type);

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Unique index on slug for URL lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Index on event_date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- Index on location_id for location-based filtering
CREATE INDEX IF NOT EXISTS idx_events_location_id ON events(location_id);

-- Index on is_active for filtering active events
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_date_active ON events(event_date, is_active);

-- ============================================================================
-- ACTIVITIES TABLE INDEXES
-- ============================================================================

-- Unique index on slug for URL lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Index on activity_date for date-based queries and sorting
CREATE INDEX IF NOT EXISTS idx_activities_activity_date ON activities(activity_date);

-- Index on event_id for filtering activities by event
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(event_id);

-- Index on activity_type for filtering by type
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_activities_date_type ON activities(activity_date, activity_type);

-- ============================================================================
-- CONTENT PAGES TABLE INDEXES
-- ============================================================================

-- Unique index on slug for URL lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);

-- Index on status for filtering by publication status
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);

-- Index on updated_at for sorting by last modified
CREATE INDEX IF NOT EXISTS idx_content_pages_updated_at ON content_pages(updated_at DESC);

-- ============================================================================
-- SECTIONS TABLE INDEXES
-- ============================================================================

-- Composite index on page_type and page_id for section lookups
CREATE INDEX IF NOT EXISTS idx_sections_page_type_page_id ON sections(page_type, page_id);

-- Index on display_order for sorting sections
CREATE INDEX IF NOT EXISTS idx_sections_display_order ON sections(display_order);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_sections_page_order ON sections(page_type, page_id, display_order);

-- ============================================================================
-- SECTION COLUMNS TABLE INDEXES
-- ============================================================================

-- Index on section_id for column lookups
CREATE INDEX IF NOT EXISTS idx_section_columns_section_id ON section_columns(section_id);

-- Index on column_number for ordering columns
CREATE INDEX IF NOT EXISTS idx_section_columns_column_number ON section_columns(column_number);

-- ============================================================================
-- LOCATIONS TABLE INDEXES
-- ============================================================================

-- Index on parent_location_id for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_locations_parent_location_id ON locations(parent_location_id);

-- Index on name for search and sorting
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- ============================================================================
-- PHOTOS TABLE INDEXES
-- ============================================================================

-- Index on moderation_status for filtering pending/approved photos
CREATE INDEX IF NOT EXISTS idx_photos_moderation_status ON photos(moderation_status);

-- Composite index on page_type and page_id for photo lookups
CREATE INDEX IF NOT EXISTS idx_photos_page_type_page_id ON photos(page_type, page_id);

-- Index on uploader_id for user photo queries
CREATE INDEX IF NOT EXISTS idx_photos_uploader_id ON photos(uploader_id);

-- Index on created_at for sorting by upload date
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- ============================================================================
-- AUDIT LOGS TABLE INDEXES
-- ============================================================================

-- Index on user_id for filtering logs by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Index on entity_type for filtering by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- Index on timestamp for sorting (descending for recent first)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Index on action for filtering by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- ============================================================================
-- RSVPS TABLE INDEXES
-- ============================================================================

-- Index on guest_id for guest RSVP lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);

-- Index on activity_id for activity RSVP counts
CREATE INDEX IF NOT EXISTS idx_rsvps_activity_id ON rsvps(activity_id);

-- Index on event_id for event RSVP counts
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);

-- Index on response_status for filtering by status
CREATE INDEX IF NOT EXISTS idx_rsvps_response_status ON rsvps(response_status);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_rsvps_activity_status ON rsvps(activity_id, response_status);

-- ============================================================================
-- ACCOMMODATIONS TABLE INDEXES
-- ============================================================================

-- Index on location_id for location-based filtering
CREATE INDEX IF NOT EXISTS idx_accommodations_location_id ON accommodations(location_id);

-- Index on check_in_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_accommodations_check_in_date ON accommodations(check_in_date);

-- ============================================================================
-- ROOM TYPES TABLE INDEXES
-- ============================================================================

-- Index on accommodation_id for room type lookups
CREATE INDEX IF NOT EXISTS idx_room_types_accommodation_id ON room_types(accommodation_id);

-- ============================================================================
-- VENDORS TABLE INDEXES
-- ============================================================================

-- Index on category for filtering by vendor category
CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);

-- Index on payment_status for filtering by payment status
CREATE INDEX IF NOT EXISTS idx_vendors_payment_status ON vendors(payment_status);

-- ============================================================================
-- VENDOR BOOKINGS TABLE INDEXES
-- ============================================================================

-- Index on vendor_id for vendor booking lookups
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_vendor_id ON vendor_bookings(vendor_id);

-- Index on activity_id for activity vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_activity_id ON vendor_bookings(activity_id);

-- Index on event_id for event vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event_id ON vendor_bookings(event_id);

-- ============================================================================
-- GROUPS TABLE INDEXES
-- ============================================================================

-- Index on name for group search
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- These indexes are designed to optimize the following query patterns:
--
-- 1. List queries with pagination (50 items per page)
-- 2. Search queries across multiple fields
-- 3. Filter queries by status, type, date, etc.
-- 4. Sort queries by date, name, etc.
-- 5. Hierarchical queries (locations, sections)
-- 6. Relationship queries (foreign key lookups)
--
-- Expected performance improvements:
-- - List page loads: < 500ms for datasets under 1000 items
-- - Search operations: < 1000ms
-- - Save operations: < 2000ms
--
-- Maintenance:
-- - Indexes are automatically maintained by PostgreSQL
-- - Monitor index usage with pg_stat_user_indexes
-- - Remove unused indexes to reduce write overhead
-- - Consider partial indexes for frequently filtered subsets
