H# Implementation Plan: Admin Backend Integration & CMS

## Overview

This implementation plan covers the integration of 17 existing backend services with the admin UI and the implementation of a comprehensive Content Management System (CMS). The plan follows a phased approach over 12 weeks, focusing on frontend-backend integration, UI modernization, and comprehensive testing.

**Key Focus Areas:**
- Replace FormModal popups with collapsible inline forms
- Implement grouped navigation sidebar
- Build comprehensive CMS with section editor
- Wire up existing backend services to admin UI
- Implement property-based testing for all correctness properties

**Already Implemented (No New Work):**
- Photo management service and UI
- Transportation service (manifests, vehicle calculations)
- Vendor booking service
- Audit log service
- RSVP analytics service
- Gallery settings service

## Tasks

- [x] 1. Foundation: Core Infrastructure & Navigation
  - Set up grouped navigation, collapsible forms, API routes, and custom hooks
  - _Requirements: 28.1-28.8, 29.1-29.10_

- [x] 1.1 Create GroupedNavigation component
  - Implement navigation groups: Guest Management, Event Planning, Logistics, Content, Communication, Financial, System
  - Add expand/collapse functionality with localStorage persistence
  - Implement badge support for pending items
  - Add keyboard navigation support
  - _Requirements: 29.2, 29.3, 29.4, 29.5, 29.9_

- [x] 1.2 Write unit tests for GroupedNavigation
  - Test group expansion/collapse
  - Test localStorage persistence
  - Test keyboard navigation
  - Test badge display
  - _Requirements: 29.2-29.5_

- [x] 1.3 Create CollapsibleForm component
  - Implement smooth expand/collapse animation
  - Add form validation with Zod
  - Implement unsaved changes warning
  - Add auto-scroll to form on expand
  - _Requirements: 28.1-28.4, 28.7_

- [x] 1.4 Write unit tests for CollapsibleForm
  - Test expand/collapse animation
  - Test form validation
  - Test unsaved changes warning
  - Test auto-scroll behavior
  - _Requirements: 28.1-28.4_

- [x] 1.5 Set up API route structure
  - Create API route templates with authentication
  - Implement standard error handling
  - Add pagination support
  - Add filtering support
  - _Requirements: 13.1-13.9_

- [x] 1.6 Write integration tests for API routes
  - Test authentication flow
  - Test error responses (401, 400, 404, 500)
  - Test pagination
  - Test filtering
  - _Requirements: 13.5-13.8_

- [x] 1.7 Create custom hooks for data fetching
  - Implement useContentPages hook
  - Implement useSections hook
  - Implement useLocations hook
  - Implement useRoomTypes hook
  - _Requirements: 1.1-1.6, 2.1-2.14_

- [x] 1.8 Write unit tests for custom hooks
  - Test loading states
  - Test error handling
  - Test data refetching
  - Test optimistic updates
  - _Requirements: 1.1-1.6_

- [x] 1.9 Update Sidebar component with grouped navigation
  - Replace flat navigation with GroupedNavigation component
  - Migrate existing navigation items to groups
  - Test navigation on all admin pages
  - _Requirements: 29.1-29.10_

- [-] 2. CMS Core: Content Pages & Section Editor
  - Implement content management system with section editor and reference lookup
  - _Requirements: 1.1-1.6, 2.1-2.14, 3.1-3.7_


- [x] 2.1 Create content pages management page
  - Implement list view with DataTable
  - Add collapsible "Add Page" form
  - Implement inline edit functionality
  - Add "Manage Sections" button
  - Add slug auto-generation and conflict detection
  - _Requirements: 1.1-1.6, 31.1-31.7_

- [x] 2.2 Write unit tests for content pages management
  - Test page creation
  - Test page editing
  - Test page deletion
  - Test slug generation
  - _Requirements: 1.1-1.3_

- [x] 2.3 Write property test for unique slug generation
  - **Property 1: Unique Slug Generation**
  - **Validates: Requirements 1.1**

- [x] 2.4 Write property test for slug preservation
  - **Property 2: Slug Preservation on Update**
  - **Validates: Requirements 1.2**

- [x] 2.5 Write property test for cascade deletion
  - **Property 3: Cascade Deletion of Sections**
  - **Validates: Requirements 1.3**

- [x] 2.6 Create SectionEditor component
  - Implement section list with drag-and-drop reordering
  - Add layout toggle (one-column/two-column)
  - Implement column content editors (rich text, photos, references)
  - Add "Preview as Guest" functionality
  - _Requirements: 2.1-2.14, 25.1-25.8_

- [x] 2.7 Write unit tests for SectionEditor
  - Test section creation
  - Test section reordering
  - Test layout toggle
  - Test column editing
  - _Requirements: 2.1-2.6_

- [x] 2.8 Write property test for section display order
  - **Property 4: Section Display Order**
  - **Validates: Requirements 2.1**

- [x] 2.9 Implement RichTextEditor integration
  - Integrate BlockNote or similar rich text editor
  - Add formatting toolbar (bold, italic, underline, links, lists)
  - Implement slash commands (/heading, /list, /table, /image, /link, /divider)
  - Add table support with inline editing
  - _Requirements: 2.3, 25.1-25.8_

- [x] 2.10 Write unit tests for RichTextEditor
  - Test formatting operations
  - Test slash commands
  - Test table editing
  - _Requirements: 2.3, 25.1-25.8_

- [x] 2.11 Create ReferenceLookup component
  - Implement searchable dropdown with debounced search
  - Add multi-entity type search (events, activities, accommodations, room types, pages)
  - Implement keyboard navigation
  - Add entity type badges and preview on hover
  - _Requirements: 2.7-2.13_

- [x] 2.12 Write unit tests for ReferenceLookup
  - Test search functionality
  - Test entity type filtering
  - Test keyboard navigation
  - Test selection handling
  - _Requirements: 2.7-2.9_

- [x] 2.13 Write property test for reference validation
  - **Property 5: Reference Entity Validation**
  - **Validates: Requirements 2.9**

- [x] 2.14 Write property test for broken reference detection
  - **Property 6: Broken Reference Detection**
  - **Validates: Requirements 2.10**

- [x] 2.15 Write property test for circular reference prevention
  - **Property 7: Circular Reference Prevention**
  - **Validates: Requirements 2.11, 4.3, 19.5**


- [x] 2.16 Implement photo integration for sections
  - Add photo picker component
  - Integrate with existing photo gallery system
  - Support multiple photos per column
  - Add photo preview and management
  - _Requirements: 2.4, 25.2_

- [x] 2.17 Write unit tests for photo integration
  - Test photo selection
  - Test multiple photo handling
  - Test photo preview
  - _Requirements: 2.4_

- [x] 2.18 Implement version history
  - Create version snapshots on save
  - Display version history list
  - Implement version preview
  - Add revert functionality
  - _Requirements: 17.1-17.5_

- [x] 2.19 Write unit tests for version history
  - Test version creation
  - Test version listing
  - Test version revert
  - _Requirements: 17.1-17.4_

- [x] 2.20 Create API routes for content pages
  - POST /api/admin/content-pages - Create page
  - GET /api/admin/content-pages - List pages
  - GET /api/admin/content-pages/:id - Get page
  - PUT /api/admin/content-pages/:id - Update page
  - DELETE /api/admin/content-pages/:id - Delete page
  - _Requirements: 13.1-13.9_

- [x] 2.21 Write integration tests for content pages API
  - Test authenticated requests
  - Test validation errors
  - Test CRUD operations
  - Test error responses
  - _Requirements: 13.1-13.8_

- [x] 2.22 Create API routes for sections
  - GET /api/admin/sections/:pageType/:pageId - List sections
  - POST /api/admin/sections - Create section
  - PUT /api/admin/sections/:id - Update section
  - DELETE /api/admin/sections/:id - Delete section
  - POST /api/admin/sections/reorder - Reorder sections
  - POST /api/admin/sections/validate-refs - Validate references
  - POST /api/admin/sections/check-circular - Check circular refs
  - _Requirements: 15.1-15.8_

- [x] 2.23 Write integration tests for sections API
  - Test section CRUD operations
  - Test section reordering
  - Test reference validation
  - Test circular reference detection
  - _Requirements: 15.1-15.7_

- [x] 2.24 Write property test for rich text sanitization
  - **Property 14: Rich Text Sanitization**
  - **Validates: Requirements 15.1, 19.3**

- [x] 2.25 Write property test for reference validation API
  - **Property 15: Reference Validation API**
  - **Validates: Requirements 15.6**

- [x] 2.26 Write property test for circular reference detection API
  - **Property 16: Circular Reference Detection API**
  - **Validates: Requirements 15.7**

- [x] 3. Home Page Editor
  - Implement homepage customization with section editor integration
  - _Requirements: 3.1-3.7_

- [x] 3.1 Create Home Page Editor page
  - Implement form for title, subtitle, welcome message, hero image
  - Add rich text editor for welcome message
  - Add "Manage Sections" button (opens SectionEditor with pageType='home')
  - Add "Preview" button to view guest-facing homepage
  - Implement auto-save draft every 30 seconds
  - _Requirements: 3.1-3.7_

- [x] 3.2 Write unit tests for Home Page Editor
  - Test form submission
  - Test rich text editing
  - Test section editor integration
  - Test preview functionality
  - _Requirements: 3.1-3.7_


- [x] 3.3 Create API routes for home page
  - GET /api/admin/home-page - Get config
  - PUT /api/admin/home-page - Update config
  - GET /api/admin/home-page/sections - Get sections
  - _Requirements: 3.1-3.7_

- [x] 3.4 Write integration tests for home page API
  - Test config retrieval
  - Test config update
  - Test section retrieval
  - _Requirements: 3.1-3.7_

- [x] 4. Reference Search API
  - Implement entity search and lookup for reference linking
  - _Requirements: 16.1-16.8_

- [x] 4.1 Create reference search API routes
  - GET /api/admin/references/search - Search entities
  - GET /api/admin/references/:type/:id - Get entity preview
  - _Requirements: 16.1-16.8_

- [x] 4.2 Write integration tests for reference search API
  - Test multi-entity search
  - Test entity type filtering
  - Test result ordering
  - Test entity preview
  - _Requirements: 16.1-16.7_

- [x] 4.3 Write property test for search result ordering
  - **Property 17: Search Result Relevance Ordering**
  - **Validates: Requirements 16.7**

- [x] 5. Location Hierarchy Management
  - Implement hierarchical location management with circular reference prevention
  - _Requirements: 4.1-4.7_

- [x] 5.1 Create location management page
  - Implement tree view with expand/collapse
  - Add collapsible "Add Location" form with parent selector
  - Implement drag-and-drop to change parent
  - Add circular reference prevention
  - Add search across all levels
  - _Requirements: 4.1-4.7_

- [x] 5.2 Write unit tests for location management
  - Test tree view rendering
  - Test location creation
  - Test parent assignment
  - Test circular reference prevention
  - _Requirements: 4.1-4.4_

- [x] 5.3 Create LocationSelector component
  - Implement hierarchical dropdown
  - Add search functionality
  - Display location hierarchy path
  - _Requirements: 4.7_

- [x] 5.4 Write unit tests for LocationSelector
  - Test hierarchy display
  - Test search functionality
  - Test selection handling
  - _Requirements: 4.7_

- [x] 5.5 Create API routes for locations
  - GET /api/admin/locations - Get location tree
  - POST /api/admin/locations - Create location
  - PUT /api/admin/locations/:id - Update location
  - DELETE /api/admin/locations/:id - Delete location
  - POST /api/admin/locations/:id/validate-parent - Check circular refs
  - _Requirements: 4.1-4.7_

- [x] 5.6 Write integration tests for locations API
  - Test location CRUD operations
  - Test tree structure retrieval
  - Test circular reference validation
  - Test cascade deletion
  - _Requirements: 4.1-4.5_

- [x] 6. Events Management Integration
  - Wire up events management with section editor and location selector
  - _Requirements: 6.1-6.8_


- [x] 6.1 Update events page with collapsible form
  - Replace FormModal with CollapsibleForm
  - Add LocationSelector for event location
  - Add "Manage Sections" button
  - Implement scheduling conflict detection
  - _Requirements: 6.1-6.8, 28.1-28.8_

- [x] 6.2 Write unit tests for events page
  - Test event creation with collapsible form
  - Test location selection
  - Test section editor integration
  - Test conflict detection
  - _Requirements: 6.1-6.4_

- [x] 6.3 Write property test for scheduling conflict detection
  - **Property 8: Event Scheduling Conflict Detection**
  - **Validates: Requirements 6.3**

- [x] 7. Activities Management Integration
  - Wire up activities management with capacity tracking and section editor
  - _Requirements: 7.1-7.10_

- [x] 7.1 Update activities page with collapsible form
  - Replace FormModal with CollapsibleForm
  - Add capacity tracking display
  - Add "Manage Sections" button
  - Implement capacity warnings (90%+ and 100%)
  - _Requirements: 7.1-7.10, 28.1-28.8_

- [x] 7.2 Write unit tests for activities page
  - Test activity creation with collapsible form
  - Test capacity tracking
  - Test section editor integration
  - Test capacity warnings
  - _Requirements: 7.1-7.9_

- [x] 7.3 Write property test for capacity warning threshold
  - **Property 9: Activity Capacity Warning Threshold**
  - **Validates: Requirements 7.7**

- [x] 7.4 Write property test for capacity alert threshold
  - **Property 10: Activity Capacity Alert Threshold**
  - **Validates: Requirements 7.8**

- [x] 8. Guest Management Integration
  - Enhance guest management with advanced filtering and RSVP management
  - _Requirements: 8.1-8.12_

- [x] 8.1 Update guests page with advanced filtering
  - Add filters: RSVP status, activity, transportation, age group, airport
  - Add grouping functionality
  - Add expandable RSVP management per guest
  - Keep existing CSV import/export functionality
  - _Requirements: 8.1-8.12_

- [x] 8.2 Write unit tests for guest filtering
  - Test RSVP status filter
  - Test activity filter
  - Test transportation filter
  - Test grouping functionality
  - _Requirements: 8.2-8.7_

- [x] 8.2 Enhance guest edit modal with extended fields
  - Add arrival/departure airport fields
  - Add arrival/departure date fields
  - Add arrival/departure flight number fields
  - Add plus-one information fields
  - Add relationship field
  - Group fields logically (Personal Info, Travel Info, Plus-One Info, Relationship)
  - _Requirements: 24.1-24.10_

- [x] 8.3 Write unit tests for guest edit modal
  - Test extended field validation
  - Test field grouping
  - Test form submission
  - _Requirements: 24.1-24.10_

- [x] 9. CSV Import/Export
  - Implement CSV import/export with round-trip validation
  - _Requirements: 9.1-9.9_


- [x] 9.1 Implement CSV export functionality
  - Generate CSV with proper field escaping
  - Handle commas, quotes, and newlines
  - Add export button to guests page
  - _Requirements: 9.1-9.2_

- [x] 9.2 Write unit tests for CSV export
  - Test field escaping
  - Test special character handling
  - Test export generation
  - _Requirements: 9.1-9.2_

- [x] 9.3 Write property test for CSV field escaping
  - **Property 11: CSV Field Escaping**
  - **Validates: Requirements 9.2**

- [x] 9.4 Implement CSV import functionality
  - Validate file format and headers
  - Validate each row against guest schema
  - Display validation errors without creating guests
  - Create all guests in bulk operation on success
  - _Requirements: 9.3-9.8_

- [x] 9.5 Write unit tests for CSV import
  - Test header validation
  - Test row validation
  - Test bulk creation
  - Test error handling
  - _Requirements: 9.3-9.7_

- [x] 9.6 Write property test for CSV round-trip
  - **Property 12: Guest CSV Round-Trip**
  - **Validates: Requirements 9.9**

- [x] 10. Accommodations & Room Types Management
  - Implement accommodation management with room types and section editor
  - _Requirements: 10.1-10.7, 22.1-22.8_

- [x] 10.1 Update accommodations page with collapsible form
  - Replace FormModal with CollapsibleForm
  - Add LocationSelector for accommodation location
  - Add "Room Types" button
  - Add "Manage Sections" button
  - _Requirements: 10.1-10.7, 28.1-28.8_

- [x] 10.2 Write unit tests for accommodations page
  - Test accommodation creation
  - Test location selection
  - Test room types navigation
  - Test section editor integration
  - _Requirements: 10.1-10.6_

- [x] 10.3 Create room types management page
  - Implement list view with capacity tracking
  - Add collapsible "Add Room Type" form
  - Display occupancy percentage
  - Add guest assignment interface
  - Add "Manage Sections" button
  - _Requirements: 22.1-22.8_

- [x] 10.4 Write unit tests for room types management
  - Test room type creation
  - Test capacity tracking
  - Test guest assignment
  - Test section editor integration
  - _Requirements: 22.1-22.7_

- [x] 10.5 Create API routes for room types
  - GET /api/admin/accommodations/:id/room-types - List room types
  - POST /api/admin/room-types - Create room type
  - PUT /api/admin/room-types/:id - Update room type
  - DELETE /api/admin/room-types/:id - Delete room type
  - GET /api/admin/room-types/:id/sections - Get sections
  - _Requirements: 22.1-22.8_

- [x] 10.6 Write integration tests for room types API
  - Test room type CRUD operations
  - Test capacity validation
  - Test guest assignment
  - _Requirements: 22.1-22.7_


- [x] 11. Budget Dashboard Integration
  - Wire up budget dashboard with existing budget service
  - _Requirements: 11.1-11.8_

- [x] 11.1 Update budget dashboard page
  - Display total cost, host contribution, guest payments, balance due
  - Add vendor payment tracking table
  - Display individual guest subsidies
  - Implement real-time recalculation
  - _Requirements: 11.1-11.8_

- [x] 11.2 Write unit tests for budget dashboard
  - Test budget calculations
  - Test vendor payment display
  - Test guest subsidy calculations
  - Test real-time updates
  - _Requirements: 11.1-11.8_

- [x] 12. Vendor Management Integration
  - Wire up vendor management with existing vendor service
  - _Requirements: 12.1-12.7, 35.1-35.10_

- [x] 12.1 Update vendors page with collapsible form
  - Replace FormModal with CollapsibleForm
  - Add payment status tracking
  - Display vendor categories
  - _Requirements: 12.1-12.7, 28.1-28.8_

- [x] 12.2 Write unit tests for vendors page
  - Test vendor creation
  - Test payment status updates
  - Test category filtering
  - _Requirements: 12.1-12.6_

- [x] 12.3 Implement vendor-to-activity booking
  - Add vendor selection interface on activity forms
  - Display booked vendors on activity pages
  - Display activity bookings on vendor pages
  - _Requirements: 35.1-35.10_

- [x] 12.4 Write unit tests for vendor bookings
  - Test vendor selection
  - Test booking creation
  - Test booking display
  - Test cost propagation
  - _Requirements: 35.1-35.7_

- [x] 13. Transportation Management UI
  - Create transportation management interface (service already implemented)
  - _Requirements: 26.1-26.7, 34.1-34.10_

- [x] 13.1 Create transportation management page
  - Implement tabs for Arrivals and Departures
  - Add date and airport filters
  - Display manifests grouped by time windows
  - Show vehicle requirements and costs
  - Add shuttle assignment interface
  - Add "Generate Driver Sheets" button
  - Add "Print Manifest" button
  - _Requirements: 26.1-26.7, 34.1-34.10_

- [x] 13.2 Write unit tests for transportation page
  - Test manifest display
  - Test filtering
  - Test shuttle assignment
  - Test vehicle calculations
  - _Requirements: 26.1-26.7, 34.1-34.10_

- [x] 14. Audit Logs Management Interface
  - Create audit logs interface (service already implemented)
  - _Requirements: 36.1-36.12_

- [x] 14.1 Create audit logs page
  - Display logs in reverse chronological order
  - Add filters: user, action type, entity type, date range
  - Add search by description
  - Display log details with entity links
  - Add CSV export button
  - Implement pagination (50 logs per page)
  - Highlight critical actions
  - _Requirements: 36.1-36.12_

- [x] 14.2 Write unit tests for audit logs page
  - Test log display
  - Test filtering
  - Test search
  - Test pagination
  - Test CSV export
  - _Requirements: 36.1-36.10_


- [x] 15. RSVP Analytics Dashboard
  - Create RSVP analytics dashboard (service already implemented)
  - _Requirements: 37.1-37.12_

- [x] 15.1 Create RSVP analytics dashboard page
  - Display overall response rate
  - Show response breakdown (attending, declined, maybe, pending)
  - Display response rate by event with progress bars
  - Display response rate by activity with capacity utilization
  - Add response trends timeline chart
  - Show capacity utilization with warnings (90%+)
  - Display pending reminders count
  - Add "Send Reminder" quick action
  - Add filters: guest type, date range
  - _Requirements: 37.1-37.12_

- [x] 15.2 Write unit tests for RSVP analytics dashboard
  - Test metrics display
  - Test chart rendering
  - Test filtering
  - Test reminder functionality
  - _Requirements: 37.1-37.12_

- [x] 16. API Validation & Error Handling
  - Implement comprehensive validation and error handling
  - _Requirements: 13.1-13.9, 18.1-18.7, 19.1-19.8_

- [x] 16.1 Implement validation error responses
  - Return HTTP 400 with VALIDATION_ERROR code
  - Include field-level error details
  - _Requirements: 13.6, 18.1_

- [x] 16.2 Write property test for validation error response
  - **Property 13: Validation Error Response**
  - **Validates: Requirements 13.6**

- [x] 16.3 Implement input sanitization
  - Sanitize plain text input (remove all HTML)
  - Sanitize rich text input (allow only safe HTML tags)
  - _Requirements: 19.2-19.3_

- [x] 16.4 Write property test for plain text sanitization
  - **Property 18: Plain Text Sanitization**
  - **Validates: Requirements 19.2**

- [x] 16.5 Implement error feedback UI
  - Display field-level validation errors
  - Show user-friendly error messages
  - Display scheduling conflict details
  - Show circular reference chains
  - Display bulk operation results
  - _Requirements: 18.1-18.6_

- [x] 16.6 Write unit tests for error feedback
  - Test validation error display
  - Test conflict error display
  - Test circular reference error display
  - _Requirements: 18.1-18.4_

- [x] 17. Slug Generation & Management
  - Implement automatic slug generation and conflict resolution
  - _Requirements: 31.1-31.7_

- [x] 17.1 Implement slug auto-generation
  - Generate slug from title in real-time
  - Convert to lowercase, replace spaces with hyphens
  - Remove special characters
  - Allow manual override
  - _Requirements: 31.1-31.5_

- [x] 17.2 Write property test for slug auto-generation
  - **Property 19: Slug Auto-Generation**
  - **Validates: Requirements 31.1, 31.5**

- [x] 17.3 Implement slug conflict resolution
  - Detect slug conflicts
  - Append number to make unique (-2, -3, etc.)
  - Display full URL path preview
  - _Requirements: 31.3-31.6_

- [x] 17.4 Write property test for slug conflict resolution
  - **Property 20: Slug Conflict Resolution**
  - **Validates: Requirements 31.3**


- [x] 18. Status Indicators & Badges
  - Implement visual status indicators across all pages
  - _Requirements: 30.1-30.10_

- [x] 18.1 Create StatusBadge component
  - Implement colored badges for different statuses
  - Support event status (active/inactive)
  - Support page status (published/draft)
  - Support payment status (unpaid/partial/paid)
  - Support capacity status (normal/warning/alert)
  - _Requirements: 30.1-30.10_

- [x] 18.2 Write unit tests for StatusBadge
  - Test badge rendering
  - Test color mapping
  - Test status display
  - _Requirements: 30.1-30.10_

- [x] 18.3 Add status badges to all list pages
  - Add to events page
  - Add to activities page
  - Add to content pages
  - Add to vendors page
  - _Requirements: 30.1-30.10_

- [x] 19. Guest View Navigation
  - Add navigation links to guest-facing pages
  - _Requirements: 32.1-32.6_

- [x] 19.1 Add "View as Guest" links
  - Add to content pages
  - Add to events
  - Add to activities
  - Add to accommodations
  - _Requirements: 32.1-32.5_

- [x] 19.2 Write unit tests for guest view navigation
  - Test link generation
  - Test navigation
  - _Requirements: 32.1-32.5_

- [x] 20. Accessibility Implementation
  - Ensure WCAG 2.1 AA compliance across all components
  - _Requirements: 21.1-21.7_

- [x] 20.1 Implement keyboard navigation
  - Add visible focus indicators
  - Implement keyboard shortcuts (Ctrl+S, Esc)
  - Ensure logical tab order
  - _Requirements: 21.1_

- [x] 20.2 Write accessibility tests for keyboard navigation
  - Test tab order
  - Test keyboard shortcuts
  - Test focus indicators
  - _Requirements: 21.1_

- [x] 20.3 Implement screen reader support
  - Add ARIA labels to all form fields
  - Add ARIA roles to interactive elements
  - Implement live regions for dynamic content
  - _Requirements: 21.2-21.3_

- [x] 20.4 Write accessibility tests for screen readers
  - Test ARIA labels
  - Test ARIA roles
  - Test live regions
  - _Requirements: 21.2-21.3_

- [x] 20.5 Implement loading states
  - Add loading indicators for async operations
  - Announce loading states to screen readers
  - Disable interactive elements during loading
  - _Requirements: 21.6_

- [x] 20.6 Write unit tests for loading states
  - Test loading indicators
  - Test screen reader announcements
  - Test element disabling
  - _Requirements: 21.6_

- [x] 20.7 Implement confirmation dialogs
  - Add confirmation for destructive actions
  - Ensure keyboard accessibility
  - Add ARIA labels
  - _Requirements: 21.7_

- [x] 20.8 Write unit tests for confirmation dialogs
  - Test dialog display
  - Test keyboard interaction
  - Test confirmation handling
  - _Requirements: 21.7_


- [x] 21. Performance Optimization
  - Implement performance optimizations across the application
  - _Requirements: 20.1-20.7_

- [x] 21.1 Implement lazy loading for heavy components
  - Lazy load SectionEditor
  - Lazy load RichTextEditor
  - Lazy load PhotoGallery
  - Add loading skeletons
  - _Requirements: 20.6_

- [x] 21.2 Write performance tests
  - Test list page load times
  - Test search response times
  - Test save operation times
  - _Requirements: 20.1-20.3_

- [x] 21.3 Implement component memoization
  - Memoize expensive computations
  - Memoize callbacks passed to children
  - Use React.memo for list items
  - _Requirements: 20.7_

- [x] 21.4 Implement debounced search
  - Add 300ms debounce to search inputs
  - Show loading indicator during search
  - _Requirements: 20.2_

- [x] 21.5 Optimize database queries
  - Add indexes on frequently queried fields
  - Select only needed fields
  - Implement pagination (50 items per page)
  - _Requirements: 20.1, 20.4_

- [x] 22. Integration & Polish
  - Complete integration and polish all pages
  - _Requirements: 28.1-28.8, 29.1-29.10_

- [x] 22.1 Replace FormModal with CollapsibleForm on all pages
  - Migrate guests page
  - Migrate events page
  - Migrate activities page
  - Migrate vendors page
  - _Requirements: 28.1-28.8_

- [x] 22.2 Write integration tests for FormModal migration
  - Test form functionality on all pages
  - Test unsaved changes warning
  - Test form submission
  - _Requirements: 28.1-28.4_

- [x] 22.3 Add section editor to all applicable entities
  - Add to events
  - Add to activities
  - Add to accommodations
  - Add to room types
  - Add to content pages
  - Add to home page
  - _Requirements: 2.14_

- [x] 22.4 Polish UI/UX across all pages
  - Ensure consistent styling
  - Add loading states
  - Add error states
  - Add empty states
  - Improve responsive design
  - _Requirements: 21.1-21.7_

- [x] 23. E2E Testing
  - Implement end-to-end tests for critical user flows
  - _Requirements: All_

- [x] 23.1 Write E2E test: Create content page flow
  - Create content page
  - Add sections
  - Publish page
  - View as guest
  - _Requirements: 1.1-1.6, 2.1-2.14_

- [x] 23.2 Write E2E test: Event with reference flow
  - Create event
  - Add event to section
  - Verify reference
  - View on page
  - _Requirements: 6.1-6.8, 2.7-2.13_

- [x] 23.3 Write E2E test: CSV import/export flow
  - Import guests from CSV
  - Verify data
  - Export to CSV
  - Compare data
  - _Requirements: 9.1-9.9_


- [x] 23.4 Write E2E test: Location hierarchy flow
  - Create location hierarchy
  - Attempt circular reference
  - Verify prevention
  - Verify tree display
  - _Requirements: 4.1-4.7_

- [x] 23.5 Write E2E test: Room type capacity flow
  - Create room type
  - Assign guests
  - Track capacity
  - Verify warnings
  - _Requirements: 22.1-22.8_

- [x] 24. Accessibility Audit
  - Conduct comprehensive accessibility audit
  - _Requirements: 21.1-21.7_

- [x] 24.1 Run automated accessibility tests
  - Use axe-core for automated testing
  - Test all interactive components
  - Generate accessibility report
  - _Requirements: 21.1-21.7_

- [x] 24.2 Perform manual accessibility testing
  - Test keyboard-only navigation
  - Test screen reader compatibility (NVDA, JAWS, VoiceOver)
  - Verify color contrast (WCAG 2.1 AA)
  - Test zoom up to 200%
  - _Requirements: 21.1-21.7_

- [x] 25. Documentation
  - Create user documentation for all features
  - _Requirements: All_

- [x] 25.1 Write user guide for CMS
  - Document content page creation
  - Document section editor usage
  - Document reference linking
  - Document version history
  - _Requirements: 1.1-1.6, 2.1-2.14, 17.1-17.5_

- [x] 25.2 Write user guide for location management
  - Document location hierarchy
  - Document circular reference prevention
  - Document location selection
  - _Requirements: 4.1-4.7_

- [x] 25.3 Write user guide for room types
  - Document room type creation
  - Document capacity tracking
  - Document guest assignment
  - _Requirements: 22.1-22.8_

- [x] 25.4 Write user guide for transportation
  - Document manifest viewing
  - Document shuttle assignment
  - Document driver sheet generation
  - _Requirements: 26.1-26.7, 34.1-34.10_

- [x] 25.5 Write user guide for analytics
  - Document RSVP analytics
  - Document budget dashboard
  - Document audit logs
  - _Requirements: 11.1-11.8, 36.1-36.12, 37.1-37.12_

- [x] 26. Final Checkpoint
  - Ensure all tests pass and system is production-ready
  - _Requirements: All_

- [x] 26.1 Run full test suite
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Run all E2E tests
  - Verify 90%+ service coverage, 85%+ API coverage, 70%+ component coverage
  - _Requirements: All_

- [x] 26.2 Verify all requirements implemented
  - Review requirements document
  - Verify all 37 requirements implemented
  - Verify all 20 correctness properties tested
  - _Requirements: All_

- [x] 26.3 Conduct final accessibility audit
  - Verify WCAG 2.1 AA compliance
  - Test keyboard navigation
  - Test screen reader compatibility
  - _Requirements: 21.1-21.7_

- [x] 26.4 Performance verification
  - Verify list pages load < 500ms
  - Verify search < 1000ms
  - Verify save operations < 2000ms
  - _Requirements: 20.1-20.7_

- [x] 26.5 Security verification
  - Verify all inputs validated
  - Verify all inputs sanitized
  - Verify authentication on all API routes
  - Verify no SQL injection vulnerabilities
  - _Requirements: 19.1-19.8_


## Notes

- All tasks are required for complete implementation
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties (minimum 100 iterations)
- Unit tests validate specific examples and edge cases
- Integration tests validate API endpoints and data flow
- E2E tests validate critical user workflows
- Accessibility tests ensure WCAG 2.1 AA compliance

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
Tasks 1.1-1.9: Core infrastructure, navigation, and forms

### Phase 2: CMS Core (Weeks 3-4)
Tasks 2.1-2.26: Content management system with section editor

### Phase 3: Home Page & References (Week 5)
Tasks 3.1-4.3: Home page editor and reference search

### Phase 4: Location Hierarchy (Week 5)
Tasks 5.1-5.6: Hierarchical location management

### Phase 5: Events & Activities (Week 6)
Tasks 6.1-7.4: Events and activities integration

### Phase 6: Guests & CSV (Week 7)
Tasks 8.1-9.6: Guest management and CSV operations

### Phase 7: Accommodations & Room Types (Week 8)
Tasks 10.1-10.6: Accommodation and room type management

### Phase 8: Budget & Vendors (Week 9)
Tasks 11.1-12.4: Budget dashboard and vendor management

### Phase 9: Transportation & Audit (Week 10)
Tasks 13.1-14.2: Transportation and audit logs

### Phase 10: Analytics & Validation (Week 11)
Tasks 15.1-17.4: RSVP analytics and validation

### Phase 11: Polish & Accessibility (Week 11)
Tasks 18.1-21.5: Status indicators, navigation, accessibility, performance

### Phase 12: Integration & Testing (Week 12)
Tasks 22.1-26.5: Final integration, E2E testing, accessibility audit, documentation

## Success Criteria

- All 37 functional requirements implemented
- All 20 correctness properties tested with property-based tests
- Test coverage: 90%+ services, 85%+ API routes, 70%+ components
- Performance: List pages < 500ms, search < 1000ms, save < 2000ms
- Accessibility: WCAG 2.1 AA compliance maintained
- All FormModal instances replaced with CollapsibleForm
- Grouped navigation implemented and functional
- Section editor integrated with all applicable entities
- All backend services wired to admin UI

