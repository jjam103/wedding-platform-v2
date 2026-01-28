# Implementation Plan: Admin UI Modernization

## Overview

This implementation plan builds a complete, modern admin interface for the destination wedding platform. The plan follows an incremental approach: first establishing the foundation (layout, design system, core components), then building entity-specific pages, and finally adding advanced features (real-time updates, bulk operations, keyboard shortcuts).

All backend services already exist and are fully functional. This implementation focuses entirely on the frontend UI layer.

## Tasks

- [x] 1. Set up design system and core UI components
  - Create Tailwind CSS configuration with Costa Rica color palette
  - Create typography, spacing, and shadow utility classes
  - Create base button component with variants (primary, secondary, danger, ghost)
  - Create base card component with header/body/footer sections
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create admin layout structure
  - [x] 2.1 Create AdminLayout server component
    - Implement responsive container with sidebar and content areas
    - Add mobile breakpoint handling
    - _Requirements: 1.5, 2.1_

  - [x] 2.2 Create Sidebar client component
    - Implement navigation items with icons and labels
    - Add active section highlighting based on current route
    - Add collapse/expand functionality for mobile
    - Implement badge support for pending counts
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Create TopBar client component
    - Add user menu with logout functionality
    - Add notification bell (placeholder for now)
    - _Requirements: 2.1_

- [x] 3. Create reusable DataTable component
  - [x] 3.1 Implement DataTable core functionality
    - Create table structure with header, body, and pagination
    - Add column configuration support
    - Add responsive mobile layout (stacked columns)
    - Add loading skeleton state
    - _Requirements: 3.1, 3.2, 10.1, 10.2, 10.3, 11.1_

  - [x] 3.2 Add sorting functionality
    - Implement column header click handlers
    - Add sort direction indicators (up/down arrows)
    - Update data display based on sort state
    - _Requirements: 3.3_

  - [x] 3.3 Add filtering functionality
    - Create filter controls for each filterable column
    - Implement filter state management
    - Add active filter chips with remove buttons
    - Add "Clear Filters" button
    - _Requirements: 3.4, 16.3, 16.4_

  - [x] 3.4 Add search functionality
    - Create search input with debounce (300ms)
    - Implement search across specified columns
    - _Requirements: 3.5_

  - [x] 3.5 Add pagination controls
    - Create page size selector (25/50/100)
    - Create previous/next page buttons
    - Display current page and total pages
    - _Requirements: 3.6_

  - [x] 3.6 Add row selection functionality
    - Add checkbox column for row selection
    - Implement select all/deselect all
    - Track selected row IDs
    - _Requirements: 14.1_

  - [x] 3.7 Add URL state persistence
    - Store filter state in URL query parameters
    - Store sort state in URL query parameters
    - Restore state from URL on page load
    - _Requirements: 16.1, 16.2, 16.5_

  - [x] 3.8 Write property tests for DataTable
    - **Property 1: Table sorting consistency**
    - **Validates: Requirements 3.3**
    - **Property 2: Search filtering accuracy**
    - **Validates: Requirements 3.5**
    - **Property 27: Filter state URL persistence**
    - **Validates: Requirements 16.1**
    - **Property 28: Filter state restoration**
    - **Validates: Requirements 16.2**
    - **Property 29: Active filter chip display**
    - **Validates: Requirements 16.3**
    - **Property 30: Sort state URL persistence**
    - **Validates: Requirements 16.5**

- [x] 4. Create FormModal component
  - [x] 4.1 Implement modal structure
    - Create modal overlay with backdrop
    - Create modal content container with header/body/footer
    - Add close on Escape key
    - Add close on backdrop click
    - Prevent body scroll when open
    - _Requirements: 3.7, 17.3_

  - [x] 4.2 Implement dynamic form rendering
    - Create form field components (text, email, number, select, textarea, date, datetime, checkbox)
    - Implement field validation with Zod schemas
    - Display field-level error messages
    - Add required field indicators
    - _Requirements: 4.6, 4.7, 12.3_

  - [x] 4.3 Add form submission handling
    - Disable submit button during submission
    - Show loading spinner on submit button
    - Handle success/error responses
    - _Requirements: 11.3_

  - [x] 4.4 Write property tests for FormModal
    - **Property 7: Form validation prevents invalid submission**
    - **Validates: Requirements 4.7, 12.3**
    - **Property 8: Modal closes on Escape key**
    - **Validates: Requirements 17.3**
    - **Property 9: Form inputs have associated labels**
    - **Validates: Requirements 18.5**
    - **Property 32: Form submission button state**
    - **Validates: Requirements 11.3**

- [x] 5. Create Toast notification system
  - [x] 5.1 Implement Toast component
    - Create toast with icon, message, and close button
    - Add color coding by type (success, error, warning, info)
    - Add auto-dismiss after duration
    - Add slide-in animation
    - _Requirements: 3.10, 3.11_

  - [x] 5.2 Create ToastContainer and context
    - Implement toast state management with React context
    - Create addToast and removeToast functions
    - Stack multiple toasts vertically
    - _Requirements: 3.10, 3.11_

  - [x] 5.3 Write property tests for Toast system
    - **Property 5: Success toast on successful operations**
    - **Validates: Requirements 3.10, 4.9, 8.7**
    - **Property 6: Error toast on failed operations**
    - **Validates: Requirements 3.11, 12.1**

- [x] 6. Create ConfirmDialog component
  - [x] 6.1 Implement confirmation dialog
    - Create modal dialog with title and message
    - Add cancel and confirm buttons
    - Style confirm button based on variant (danger/warning)
    - Disable buttons during confirmation
    - _Requirements: 3.9, 13.1, 13.2, 13.3, 13.4_

  - [x] 6.2 Write property tests for ConfirmDialog
    - **Property 4: Delete confirmation requirement**
    - **Validates: Requirements 3.9, 13.1**
    - **Property 35: Confirmation dialog content**
    - **Validates: Requirements 13.2**
    - **Property 36: Confirmed delete execution**
    - **Validates: Requirements 13.5**

- [x] 7. Checkpoint - Core components complete
  - Ensure all core components render correctly
  - Ensure all property tests pass
  - Ask the user if questions arise

- [x] 8. Create Guest Management page
  - [x] 8.1 Create /admin/guests page
    - Fetch initial guest data with groups
    - Render DataTable with guest columns
    - Configure filters (group, guest_type, age_type, rsvp_status)
    - Add "Add Guest" button
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 8.2 Implement guest create/edit modal
    - Configure form fields for guest data
    - Use guestService.create() and guestService.update()
    - Show success/error toasts
    - Refresh table data after successful operation
    - _Requirements: 3.7, 3.8, 3.10, 3.11_

  - [x] 8.3 Implement guest delete functionality
    - Show confirmation dialog on delete click
    - Use guestService.delete()
    - Show success/error toasts
    - Refresh table data after successful deletion
    - _Requirements: 3.9, 3.10, 3.11_

  - [x] 8.4 Write property tests for guest management
    - **Property 3: Row click opens edit modal**
    - **Validates: Requirements 3.8, 4.8**

- [x] 9. Create Event Management page
  - [x] 9.1 Create /admin/events page
    - Fetch initial event data with locations
    - Render DataTable with event columns
    - Configure filters (status, visibility)
    - Add "Create Event" button
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 9.2 Implement event create/edit modal
    - Configure form fields including rich text editor for description
    - Use eventService.create() and eventService.update()
    - Show success/error toasts
    - Refresh table data after successful operation
    - _Requirements: 4.5, 4.6, 4.8, 4.9_

  - [x] 9.3 Implement event delete functionality
    - Show confirmation dialog on delete click
    - Use eventService.delete()
    - Show success/error toasts
    - Refresh table data after successful deletion
    - _Requirements: 4.9_

- [x] 10. Create Activity Management page
  - [x] 10.1 Create /admin/activities page
    - Fetch initial activity data with events and locations
    - Render DataTable with activity columns
    - Configure filters (event, status)
    - Add capacity utilization column with percentage
    - Highlight rows at 90%+ capacity in warning color
    - Add "Add Activity" button
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Implement activity create/edit modal
    - Configure form fields for activity data
    - Show capacity utilization percentage when editing
    - Use activityService.create() and activityService.update()
    - Show success/error toasts
    - Refresh table data after successful operation
    - _Requirements: 5.5, 5.6, 5.7_

  - [x] 10.3 Implement activity delete functionality
    - Show confirmation dialog on delete click
    - Use activityService.delete()
    - Show success/error toasts
    - Refresh table data after successful deletion
    - _Requirements: 5.8_

  - [x] 10.4 Write property tests for activity management
    - **Property 10: Capacity warning highlighting**
    - **Validates: Requirements 5.3**
    - **Property 11: Capacity utilization display**
    - **Validates: Requirements 5.7**

- [x] 11. Create Vendor Management page
  - [x] 11.1 Create /admin/vendors page
    - Fetch initial vendor data
    - Render DataTable with vendor columns
    - Add calculated balance column (base_cost - amount_paid)
    - Highlight unpaid vendors in warning color
    - Configure filters (category, payment_status)
    - Add "Add Vendor" button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 11.2 Implement vendor create/edit modal
    - Configure form fields for vendor data
    - Add validation: amount_paid <= base_cost
    - Use vendorService.create() and vendorService.update()
    - Show success/error toasts
    - Refresh table data after successful operation
    - _Requirements: 6.6, 6.7, 6.8_

  - [x] 11.3 Implement vendor delete functionality
    - Show confirmation dialog on delete click
    - Use vendorService.delete()
    - Show success/error toasts
    - Refresh table data after successful deletion
    - _Requirements: 6.6_

  - [x] 11.4 Write property tests for vendor management
    - **Property 12: Vendor balance calculation**
    - **Validates: Requirements 6.3**
    - **Property 13: Unpaid vendor highlighting**
    - **Validates: Requirements 6.4**
    - **Property 14: Vendor payment validation**
    - **Validates: Requirements 6.8**

- [x] 12. Checkpoint - Entity management pages complete
  - Ensure all entity pages render correctly
  - Ensure CRUD operations work for all entities
  - Ensure all property tests pass
  - Ask the user if questions arise

- [x] 13. Create Photo Moderation page
  - [x] 13.1 Create /admin/photos page
    - Fetch initial photo data
    - Render photo grid with thumbnails
    - Show uploader name, upload date, and caption for each photo
    - Configure filter (moderation_status: pending, approved, rejected)
    - Default to showing pending photos
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.2 Implement photo preview modal
    - Show full-size photo on click
    - Display photo metadata
    - Add approve, reject, and delete buttons
    - Use photoService methods for moderation actions
    - Show success/error toasts
    - Refresh grid after successful operation
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [x] 13.3 Add pending photo count to sidebar
    - Fetch pending photo count
    - Display count as badge on Photos sidebar item
    - Update count when photos are moderated
    - _Requirements: 7.8_

  - [x] 13.4 Write property tests for photo moderation
    - **Property 15: Photo grid completeness**
    - **Validates: Requirements 7.2**
    - **Property 18: Pending photo count accuracy**
    - **Validates: Requirements 7.8**
    - **Note:** Properties 16 (Photo click opens preview) and 17 (Photo moderation updates status) are not suitable for property-based testing due to complex UI interactions. These behaviors are verified through integration/E2E tests instead.

- [x] 14. Create Email Management page
  - [x] 14.1 Create /admin/emails page
    - Fetch sent email history
    - Render DataTable with email columns (subject, recipients, sent date, delivery status)
    - Add "Compose Email" button
    - _Requirements: 8.1, 8.2_

  - [x] 14.2 Implement email composition form
    - Create form with recipient selection (guests/groups)
    - Add rich text editor for email body
    - Add template selection dropdown
    - Implement variable substitution for templates
    - Add preview section
    - Use emailService.send()
    - Show success/error toasts
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 14.3 Write property tests for email management
    - **Property 5: Success toast on successful operations** (already covered)
    - **Validates: Requirements 8.7**

- [x] 15. Create Budget Dashboard page
  - [x] 15.1 Create /admin/budget page
    - Fetch vendor, activity, and accommodation data
    - Calculate total vendor costs
    - Calculate total activity costs (with subsidies)
    - Calculate total accommodation costs
    - Display summary cards with totals
    - _Requirements: 9.1, 9.2_

  - [x] 15.2 Add budget visualizations
    - Create pie chart for category breakdown
    - Create bar chart for vendor spending
    - Highlight items exceeding budget
    - _Requirements: 9.3, 9.5_

  - [x] 15.3 Add budget calculations
    - Calculate guest contributions vs host subsidies
    - Display breakdown by category
    - _Requirements: 9.4_

  - [x] 15.4 Write property tests for budget calculations
    - **Property 19: Budget calculation accuracy**
    - **Validates: Requirements 9.4**
    - **Property 20: Budget item highlighting**
    - **Validates: Requirements 9.5**

- [x] 16. Create Settings page
  - [x] 16.1 Create /admin/settings page
    - Create settings form with fields: wedding date, venue name, couple names, timezone
    - Add email notification preferences section
    - Add photo gallery settings section
    - Use appropriate service methods to save settings
    - Show success/error toasts
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [x] 16.2 Write property tests for settings
    - **Property 38: Settings validation and persistence**
    - **Validates: Requirements 20.5**

- [x] 17. Checkpoint - All pages complete
  - Ensure all admin pages render correctly
  - Ensure all CRUD operations work
  - Ensure all property tests pass
  - Ask the user if questions arise

- [x] 18. Add bulk operations to DataTable
  - [x] 18.1 Implement bulk action toolbar
    - Show toolbar when rows are selected
    - Display count of selected items
    - Add bulk action buttons (Delete, Export)
    - Add "Send Email" button for guest table
    - _Requirements: 14.2, 14.3, 14.4_

  - [x] 18.2 Implement bulk delete
    - Show confirmation dialog with count of items to delete
    - Call delete service for each selected item
    - Show progress indicator during operation
    - Show success/error toasts
    - Refresh table after completion
    - _Requirements: 14.5_

  - [x] 18.3 Implement CSV export
    - Add "Export" button to table toolbar
    - Generate CSV from current filtered data
    - Include all visible columns
    - Name file with entity type and timestamp
    - Trigger browser download
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 18.4 Write property tests for bulk operations
    - **Property 21: Bulk action toolbar visibility**
    - **Validates: Requirements 14.2**
    - **Property 22: Selected count accuracy**
    - **Validates: Requirements 14.3**
    - **Property 23: Bulk operation progress indication**
    - **Validates: Requirements 14.5**
    - **Property 24: CSV export data accuracy**
    - **Validates: Requirements 15.2**
    - **Property 25: CSV column completeness**
    - **Validates: Requirements 15.3**
    - **Property 26: CSV filename format**
    - **Validates: Requirements 15.4**

- [x] 19. Add keyboard shortcuts
  - [x] 19.1 Implement global keyboard shortcuts
    - Add "/" key to focus search input
    - Add "n" key to open new entity form
    - Add "?" key to show keyboard shortcuts help dialog
    - _Requirements: 17.1, 17.2, 17.4_

  - [x] 19.2 Create keyboard shortcuts help dialog
    - List all available shortcuts
    - Group by category (navigation, actions, etc.)
    - _Requirements: 17.4_

  - [x] 19.3 Write property tests for keyboard navigation
    - **Property 37: Tab navigation completeness**
    - **Validates: Requirements 17.5**

- [x] 20. Add real-time updates with Supabase
  - [x] 20.1 Implement real-time subscriptions for guests
    - Subscribe to guest table changes
    - Update UI when guests are added/updated/deleted
    - Show notification when data is updated by another user
    - _Requirements: 19.1, 19.5_

  - [x] 20.2 Implement real-time subscriptions for photos
    - Subscribe to photo table changes
    - Update photo grid when photos are uploaded
    - Update pending count badge in sidebar
    - _Requirements: 19.4_

  - [x] 20.3 Implement real-time subscriptions for RSVPs
    - Subscribe to RSVP table changes
    - Update dashboard metrics immediately
    - _Requirements: 19.3_

- [x] 21. Add loading states and error handling
  - [x] 21.1 Add skeleton loaders to all pages
    - Create skeleton components for tables, cards, and grids
    - Show skeletons during initial data load
    - _Requirements: 11.1, 11.5_

  - [x] 21.2 Implement error boundaries
    - Create error boundary component
    - Wrap each page in error boundary
    - Show user-friendly error messages
    - Add retry button for network errors
    - Log errors to console
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 21.3 Write property tests for loading states
    - **Property 31: Loading skeleton display**
    - **Validates: Requirements 11.1**
    - **Property 33: Action button loading state**
    - **Validates: Requirements 11.4**
    - **Property 34: No blank screens during loading**
    - **Validates: Requirements 11.5**

- [x] 22. Implement accessibility features
  - [x] 22.1 Add ARIA labels and roles
    - Add aria-label to all interactive elements
    - Add role attributes where appropriate
    - Add aria-live regions for dynamic content
    - _Requirements: 18.2_

  - [x] 22.2 Ensure keyboard navigation
    - Test Tab navigation through all pages
    - Ensure focus indicators are visible
    - Ensure all actions are keyboard accessible
    - _Requirements: 18.4_

  - [x] 22.3 Verify color contrast
    - Test all text against backgrounds
    - Ensure 4.5:1 contrast ratio for normal text
    - Ensure 3:1 contrast ratio for large text
    - _Requirements: 18.3_

  - [x] 22.4 Run accessibility tests
    - Run axe-core on all admin pages
    - Fix any violations found
    - _Requirements: 18.1_

- [x] 23. Add responsive mobile optimizations
  - [x] 23.1 Optimize DataTable for mobile
    - Implement column stacking on mobile
    - Add horizontal scroll for additional columns
    - Ensure touch-friendly tap targets (44x44px minimum)
    - Test sort and filter on mobile
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 23.2 Optimize forms for mobile
    - Ensure form inputs are appropriately sized
    - Test form submission on mobile
    - _Requirements: 1.5_

  - [x] 23.3 Test sidebar on mobile
    - Ensure sidebar collapses to icon-only
    - Test expand/collapse functionality
    - _Requirements: 2.4_

- [x] 24. Final polish and refinements
  - [x] 24.1 Add smooth transitions and animations
    - Add hover states to all interactive elements
    - Add transition animations to modals
    - Add fade-in animations to toasts
    - _Requirements: 1.3_

  - [x] 24.2 Review and refine styling
    - Ensure consistent spacing throughout
    - Ensure consistent typography
    - Ensure consistent use of color palette
    - _Requirements: 1.1, 1.2_

  - [x] 24.3 Performance optimization
    - Add React.memo to expensive components
    - Optimize re-renders with useCallback and useMemo
    - Test performance with large data sets

- [x] 25. Final checkpoint - System complete
  - Run full test suite (unit, property, integration, E2E, accessibility)
  - Test all CRUD operations across all entities
  - Test all keyboard shortcuts
  - Test all bulk operations
  - Test real-time updates
  - Test responsive design on mobile, tablet, and desktop
  - Ensure all property tests pass
  - Ask the user if questions arise

## Notes

- All backend services already exist and are fully functional
- This implementation focuses entirely on the frontend UI layer
- All tasks are required for a comprehensive, production-ready admin interface
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation follows an incremental approach: foundation → entity pages → advanced features
