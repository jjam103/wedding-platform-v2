# Implementation Plan: Guest Portal and Admin Enhancements

## Overview

This implementation plan breaks down the 12-week phased approach for comprehensive enhancements to both the admin dashboard and guest-facing portal. The work leverages 100% complete backend services and many existing components, focusing on integration, wiring, and new UI features.

**Key Implementation Notes:**
- Backend services are complete (17 services) - focus on integration
- Many existing components can be reused - focus on wiring
- Parallel implementation possible: admin-side (Req 1-4, 21-23) and guest-side (Req 5-20)
- Zero-debt development standard: property-based testing required for all business logic
- Lexkit editor package (@lexkit/editor v0.0.38) is already installed

**Testing Requirements:**
- Unit tests for all new components and services
- Property-based tests for all 40 correctness properties
- Integration tests for all new API routes
- E2E tests for critical user workflows
- Regression tests for all bug fixes
- Accessibility tests for all new UI

## Tasks

### Phase 1: Admin Navigation Redesign (Week 1)

- [x] 1. Implement horizontal top navigation system
  - [x] 1.1 Create TopNavigation component with tab structure
    - Create `components/admin/TopNavigation.tsx` with 5 main tabs (Content, Guests, RSVPs, Logistics, Admin)
    - Implement sub-navigation dropdown for each tab
    - Add active state highlighting with emerald-600 background
    - _Requirements: 1.1, 1.2, 1.9_
  
  - [x] 1.2 Add mobile responsive hamburger menu
    - Implement hamburger menu for viewport < 768px
    - Create full-screen overlay with large touch targets (44px minimum)
    - Add swipe gestures to open/close menu
    - _Requirements: 1.8_
  
  - [x] 1.3 Implement navigation state persistence
    - Store active tab in sessionStorage
    - Store active sub-item in sessionStorage
    - Restore navigation state on page refresh
    - Update browser URL to reflect navigation state
    - _Requirements: 1.10, 20.1, 20.2, 20.3_
  
  - [x] 1.4 Write property test for navigation state persistence
    - **Property 2: Navigation State Persistence**
    - **Validates: Requirements 1.10, 20.1, 20.2, 20.3**
  
  - [x] 1.5 Write unit tests for TopNavigation component
    - Test tab switching
    - Test sub-item navigation
    - Test mobile menu toggle
    - Test active state highlighting
  
  - [x] 1.6 Write E2E test for navigation flows
    - Test complete navigation workflow
    - Test state persistence across page refreshes
    - Test mobile navigation
    - Test browser back/forward navigation

- [x] 2. Update admin layout to use new navigation
  - [x] 2.1 Update app/admin/layout.tsx
    - Replace existing sidebar with TopNavigation
    - Add sticky positioning (top: 0, z-index: 50)
    - Implement glassmorphism effect with backdrop-filter
    - _Requirements: 1.1_
  
  - [x] 2.2 Update all admin pages to work with new navigation
    - Verify all existing admin pages render correctly
    - Update breadcrumb navigation
    - Test navigation state on all pages
    - _Requirements: 1.10_

- [x] 3. Checkpoint - Verify navigation system working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 2: Guest Authentication (Week 2)

- [x] 4. Implement database schema changes for authentication
  - [x] 4.1 Create migration for auth_method field
    - Add `auth_method` column to guests table (enum: 'email_matching' | 'magic_link')
    - Add `default_auth_method` to settings table
    - Create indexes for auth_method queries
    - _Requirements: 22.1, 22.2_
  
  - [x] 4.2 Create magic_link_tokens table
    - Create table with token, guest_id, expires_at, used fields
    - Add indexes for token lookups
    - Add cleanup trigger for expired tokens
    - _Requirements: 5.3, 5.9_

- [x] 5. Implement email matching authentication
  - [x] 5.1 Create email matching API route
    - Create `app/api/auth/guest/email-match/route.ts`
    - Implement email lookup and validation
    - Create guest session on successful match
    - Set HTTP-only session cookie
    - _Requirements: 5.2, 22.4_
  
  - [x] 5.2 Write property test for email matching authentication
    - **Property 14: Email Matching Authentication**
    - **Validates: Requirements 5.2, 22.4**
  
  - [x] 5.3 Write unit tests for email matching logic
    - Test successful authentication
    - Test email not found error
    - Test invalid email format
    - Test session creation

- [x] 6. Implement magic link authentication
  - [x] 6.1 Create magic link request API route
    - Create `app/api/auth/guest/magic-link/route.ts`
    - Generate secure token (32 bytes)
    - Store token with 15-minute expiry
    - Send email with magic link
    - _Requirements: 5.3, 5.9_
  
  - [x] 6.2 Create magic link verification API route
    - Create `app/api/auth/guest/magic-link/verify/route.ts`
    - Verify token validity and expiry
    - Mark token as used
    - Create guest session
    - Redirect to dashboard
    - _Requirements: 5.3, 5.9_
  
  - [x] 6.3 Write property test for magic link token expiry
    - **Property 15: Magic Link Token Expiry**
    - **Validates: Requirements 5.9**
  
  - [x] 6.4 Write property test for magic link single use
    - **Property 16: Magic Link Single Use**
    - **Validates: Requirements 5.3**
  
  - [x] 6.5 Write unit tests for magic link logic
    - Test token generation
    - Test email sending
    - Test token verification
    - Test token expiry
    - Test token reuse prevention

- [x] 7. Create guest login page
  - [x] 7.1 Create guest login page component
    - Create `app/auth/guest-login/page.tsx`
    - Implement tab switching between email matching and magic link
    - Add email input form
    - Add error message display
    - _Requirements: 5.1, 5.7, 5.10_
  
  - [x] 7.2 Create magic link verification page
    - Create `app/auth/magic-link/verify/page.tsx`
    - Handle token verification
    - Display loading state
    - Handle errors (expired, invalid, used)
    - _Requirements: 5.9, 5.10_
  
  - [x] 7.3 Write E2E test for email matching flow
    - Test complete email matching authentication
    - Test redirect to dashboard
    - Test error handling
  
  - [x] 7.4 Write E2E test for magic link flow
    - Test magic link request
    - Test magic link verification
    - Test token expiry
    - Test token reuse prevention

- [x] 8. Add authentication method configuration
  - [x] 8.1 Add auth method settings to admin settings page
    - Update `app/admin/settings/page.tsx`
    - Add toggle for default authentication method
    - Add bulk update for guest auth methods
    - _Requirements: 22.1, 22.2, 22.3, 22.7_
  
  - [x] 8.2 Create API routes for auth method management
    - Create `app/api/admin/settings/auth-method/route.ts`
    - Create `app/api/admin/guests/[id]/auth-method/route.ts`
    - Create `app/api/admin/guests/bulk-auth-method/route.ts`
    - _Requirements: 22.2, 22.3, 22.7_
  
  - [x] 8.3 Write unit tests for auth method configuration
    - Test default method update
    - Test per-guest override
    - Test bulk update
    - Test notification emails

- [x] 9. Checkpoint - Verify authentication system working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 3: Inline RSVP Management (Week 3)

- [x] 10. Create inline RSVP editor component
  - [x] 10.1 Create InlineRSVPEditor component
    - Create `components/admin/InlineRSVPEditor.tsx`
    - Implement expandable sections (Activities, Events, Accommodations)
    - Add status toggle controls (attending, maybe, declined, pending)
    - Add inline guest count and dietary restrictions inputs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_
  
  - [x] 10.2 Implement optimistic UI updates
    - Update UI immediately on status change
    - Show loading spinner during save
    - Rollback on error
    - Display success/error toast
    - _Requirements: 2.5, 2.10, 18.4_
  
  - [x] 10.3 Add capacity validation
    - Check capacity before allowing "attending" status
    - Display warning if capacity < 10% remaining
    - Prevent "attending" if capacity = 0
    - Show capacity remaining count
    - _Requirements: 2.9_
  
  - [x] 10.4 Write property test for RSVP status toggle cycle
    - **Property 4: RSVP Status Toggle Cycle**
    - **Validates: Requirements 2.4**
  
  - [x] 10.5 Write property test for capacity constraint enforcement
    - **Property 5: Capacity Constraint Enforcement**
    - **Validates: Requirements 2.9, 10.7**
  
  - [x] 10.6 Write property test for guest count validation
    - **Property 7: Guest Count Validation**
    - **Validates: Requirements 10.3**
  
  - [x] 10.7 Write unit tests for InlineRSVPEditor
    - Test section expansion
    - Test status toggle
    - Test guest count input
    - Test dietary restrictions input
    - Test capacity validation

- [x] 11. Create inline RSVP API routes
  - [x] 11.1 Create get guest RSVPs API route
    - Create `app/api/admin/guests/[id]/rsvps/route.ts` (GET)
    - Return all RSVPs for guest (activities, events, accommodations)
    - Include capacity information
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 11.2 Create update RSVP API route
    - Create `app/api/admin/guests/[id]/rsvps/[rsvpId]/route.ts` (PUT)
    - Validate capacity constraints
    - Update RSVP status
    - Return updated RSVP with capacity info
    - _Requirements: 2.4, 2.5, 2.9_
  
  - [x] 11.3 Write integration tests for inline RSVP API
    - Test get RSVPs endpoint
    - Test update RSVP endpoint
    - Test capacity validation
    - Test error handling

- [x] 12. Integrate inline RSVP editor into guest list
  - [x] 12.1 Update guest list page
    - Update `app/admin/guests/page.tsx`
    - Add "Manage RSVPs" button to each guest row
    - Integrate InlineRSVPEditor component
    - Add lazy loading for RSVP data
    - _Requirements: 2.1_
  
  - [x] 12.2 Optimize performance for large guest lists
    - Implement pagination (50 guests per page)
    - Add infinite scroll or "load more"
    - Cache RSVP data for 5 minutes
    - Debounce inline text input (500ms)
    - _Requirements: 18.1, 18.2, 18.6, 18.7, 18.8_
  
  - [x] 12.3 Write performance tests for inline RSVP
    - Test rendering time for 500 guests
    - Test RSVP section expansion time
    - Test save operation time
    - Verify meets performance targets

- [x] 13. Checkpoint - Verify inline RSVP system working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 4: Guest Portal Foundation (Week 4)

- [x] 14. Create guest navigation system
  - [x] 14.1 Create GuestNavigation component
    - Create `components/guest/GuestNavigation.tsx`
    - Implement horizontal navigation with 6 tabs (Home, Events, Activities, Itinerary, Photos, Info)
    - Add Info dropdown with sub-items
    - Add sticky positioning and active state highlighting
    - _Requirements: 27.1, 27.2, 27.3_
  
  - [x] 14.2 Add mobile responsive navigation
    - Implement hamburger menu for mobile
    - Create full-screen overlay menu
    - Add swipe gestures
    - _Requirements: 27.4_
  
  - [x] 14.3 Add navigation features
    - Implement breadcrumb navigation
    - Add notification badge for pending RSVPs
    - Add search function (Ctrl+K)
    - Add quick action floating button
    - _Requirements: 27.1_
  
  - [x] 14.4 Write property test for mobile navigation responsiveness
    - **Property 3: Mobile Navigation Responsiveness**
    - **Validates: Requirements 1.8, 27.4**
  
  - [x] 14.5 Write unit tests for GuestNavigation
    - Test tab switching
    - Test dropdown menu
    - Test mobile menu
    - Test breadcrumb navigation

- [x] 15. Create guest layout and dashboard
  - [x] 15.1 Create guest layout
    - Create `app/guest/layout.tsx`
    - Integrate GuestNavigation component
    - Add authentication check
    - Add logout functionality
    - _Requirements: 7.1, 27.1_
  
  - [x] 15.2 Create guest dashboard page
    - Create `app/guest/dashboard/page.tsx`
    - Display personalized welcome message
    - Show wedding date, location, venue
    - Display RSVP status summary
    - Show upcoming activities
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 15.3 Add quick links and announcements
    - Add quick links to key sections
    - Display urgent announcements
    - Add tropical theme styling
    - _Requirements: 7.4, 7.7, 7.9_
  
  - [x] 15.4 Write property test for personalized content display
    - **Property 18: Personalized Content Display**
    - **Validates: Requirements 6.1**
  
  - [x] 15.5 Write unit tests for guest dashboard
    - Test welcome message
    - Test RSVP summary
    - Test upcoming activities
    - Test quick links

- [-] 16. Implement family management for guests
  - [x] 16.1 Create family management page
    - Update `app/guest/family/page.tsx` (existing route)
    - Display all family members with profile info
    - Add expandable sections for each member
    - Show RSVP status for each member
    - _Requirements: 6.3, 6.9_
  
  - [x] 16.2 Add group owner edit permissions
    - Allow group owners to update contact info for all members
    - Allow group owners to update dietary restrictions
    - Allow group owners to manage RSVP status
    - Allow group owners to update guest counts
    - _Requirements: 6.4, 6.5, 6.6, 6.7_
  
  - [x] 16.3 Add profile update functionality
    - Implement inline editing for profile fields
    - Add save confirmation
    - Send email notifications to admins on critical updates
    - _Requirements: 6.8, 6.12_
  
  - [x] 16.4 Write property test for group owner edit permissions
    - **Property 19: Group Owner Edit Permissions**
    - **Validates: Requirements 6.4, 6.5, 6.6, 6.7**
  
  - [x] 16.5 Write property test for RLS enforcement
    - **Property 20: Row Level Security Enforcement**
    - **Validates: Requirements 6.10, 20.1**
  
  - [x] 16.6 Write unit tests for family management
    - Test family member display
    - Test profile editing
    - Test RSVP management
    - Test RLS enforcement

- [-] 17. Create guest profile API routes
  - [x] 17.1 Create get profile API route
    - Create `app/api/guest/profile/route.ts` (GET)
    - Return guest profile with group membership
    - Enforce RLS policies
    - _Requirements: 6.2_
  
  - [x] 17.2 Create update profile API route
    - Create `app/api/guest/profile/route.ts` (PUT)
    - Validate updates
    - Check group owner permissions
    - Send admin notifications for critical updates
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 6.12_
  
  - [x] 17.3 Create family members API routes
    - Create `app/api/guest/family/route.ts` (GET)
    - Create `app/api/guest/family/[id]/route.ts` (PUT)
    - Enforce group owner permissions
    - _Requirements: 6.3, 6.4_
  
  - [x] 17.4 Write integration tests for guest profile API
    - Test get profile endpoint
    - Test update profile endpoint
    - Test family members endpoints
    - Test RLS enforcement
    - Test group owner permissions

- [x] 18. Checkpoint - Verify guest portal foundation working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 5: Reference Blocks and Section Manager (Week 5)

- [ ] 19. Create reference block picker component
  - [x] 19.1 Create ReferenceBlockPicker component
    - Create `components/admin/ReferenceBlockPicker.tsx`
    - Implement searchable dropdown with type filter
    - Add real-time search (debounced 300ms)
    - Display results grouped by type
    - Add preview card for each result
    - _Requirements: 21.6_
  
  - [x] 19.2 Create reference search API route
    - Create `app/api/admin/references/search/route.ts`
    - Search across events, activities, content pages, accommodations
    - Return results grouped by type
    - Include key metadata for each result
    - _Requirements: 21.6_
  
  - [x] 19.3 Write unit tests for ReferenceBlockPicker
    - Test search functionality
    - Test type filtering
    - Test result display
    - Test selection handling

- [ ] 20. Implement reference validation logic
  - [x] 20.1 Create reference validation service methods
    - Add `validateReference` to sectionsService
    - Check that referenced entity exists
    - Detect circular references
    - Warn if referenced entity is unpublished
    - _Requirements: 21.8, 21.9_
  
  - [x] 20.2 Implement circular reference detection algorithm
    - Create graph traversal algorithm
    - Detect cycles in reference graph
    - Return error with cycle path
    - _Requirements: 21.9_
  
  - [x] 20.3 Write property test for reference existence validation
    - **Property 27: Reference Existence Validation**
    - **Validates: Requirements 21.8**
  
  - [x] 20.4 Write property test for circular reference detection
    - **Property 28: Circular Reference Detection**
    - **Validates: Requirements 21.9**
  
  - [x] 20.5 Write unit tests for reference validation
    - Test existence validation
    - Test circular reference detection
    - Test unpublished entity warnings

- [x] 21. Create reference preview components
  - [x] 21.1 Create ReferencePreview component (admin)
    - Create `components/admin/ReferencePreview.tsx`
    - Display entity type badge
    - Show entity name and key metadata
    - Add "View Full Details" link
    - Add "Remove" and "Edit" buttons
    - _Requirements: 21.7_
  
  - [x] 21.2 Create EventPreviewModal component (guest)
    - Create `components/guest/EventPreviewModal.tsx`
    - Display event details (name, date, time, location, description)
    - Show list of activities
    - Display guest's RSVP status
    - Add "View Full Details" and "RSVP Now" buttons
    - _Requirements: 25.1, 25.2, 25.3, 25.4_
  
  - [x] 21.3 Create ActivityPreviewModal component (guest)
    - Create `components/guest/ActivityPreviewModal.tsx`
    - Display activity details (name, date, time, location, capacity, cost)
    - Show remaining capacity
    - Display guest's RSVP status
    - Add "View Full Details" and "RSVP Now" buttons
    - _Requirements: 25.5, 25.6, 25.7, 25.8, 25.9, 25.10_
  
  - [x] 21.4 Write property test for reference preview data completeness
    - **Property 29: Reference Preview Data Completeness**
    - **Validates: Requirements 25.2, 25.3, 25.6, 25.7**
  
  - [x] 21.5 Write unit tests for preview modals
    - Test EventPreviewModal rendering
    - Test ActivityPreviewModal rendering
    - Test modal interactions
    - Test RSVP quick action

- [ ] 22. Enhance SectionEditor with reference blocks
  - [x] 22.1 Update SectionEditor component
    - Update `components/admin/SectionEditor.tsx`
    - Add "references" content type option
    - Integrate ReferenceBlockPicker
    - Display ReferencePreview for added references
    - Add reference validation on save
    - _Requirements: 21.5, 21.6, 21.7, 21.8, 21.9_
  
  - [x] 22.2 Update SectionRenderer for guest view
    - Update `components/guest/SectionRenderer.tsx`
    - Render reference blocks as clickable cards
    - Integrate EventPreviewModal and ActivityPreviewModal
    - Add modal trigger on reference click
    - _Requirements: 25.1, 25.5_
  
  - [x] 22.3 Write E2E test for reference block creation flow
    - Test complete reference block workflow
    - Test circular reference prevention
    - Test reference preview
    - Test guest view of references

- [ ] 23. Create reference management API routes
  - [x] 23.1 Create reference validation API route
    - Create `app/api/admin/references/validate/route.ts`
    - Validate reference exists
    - Check for circular references
    - Return validation result
    - _Requirements: 21.8, 21.9_
  
  - [x] 23.2 Create reference preview API route
    - Create `app/api/admin/references/preview/[type]/[id]/route.ts`
    - Return preview data for reference
    - Include all required fields for modal display
    - _Requirements: 25.2, 25.3, 25.6, 25.7_
  
  - [x] 23.3 Write integration tests for reference API
    - Test validation endpoint
    - Test preview endpoint
    - Test circular reference detection
    - Test error handling

- [x] 24. Checkpoint - Verify reference block system working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 6: Lexkit Editor Integration (Week 6)

- [x] 25. Replace RichTextEditor with Lexkit implementation
  - [x] 25.1 Create new Lexkit-based RichTextEditor
    - Replace implementation in `components/admin/RichTextEditor.tsx`
    - Configure Lexkit editor with all required extensions
    - Maintain same props interface (value, onChange, placeholder, disabled, pageType, pageId)
    - Implement toolbar with all formatting buttons
    - _Requirements: 23.1, 23.2, 23.5_
  
  - [x] 25.2 Implement slash commands
    - Configure SlashCommands extension
    - Add commands for headings, lists, table, link, image, divider
    - Implement keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
    - _Requirements: 23.3_
  
  - [x] 25.3 Integrate PhotoPicker for image insertion
    - Implement image insertion via PhotoPicker modal
    - Handle image selection callback
    - Insert image into editor at cursor position
    - _Requirements: 23.4_
  
  - [x] 25.4 Add keyboard shortcuts
    - Implement Ctrl+B for bold
    - Implement Ctrl+I for italic
    - Implement Ctrl+U for underline
    - Implement Ctrl+K for links
    - _Requirements: 23.7_
  
  - [x] 25.5 Add content sanitization
    - Integrate sanitizeRichText utility
    - Sanitize content on onChange
    - Maintain security standards
    - _Requirements: 23.6_
  
  - [x] 25.6 Write unit tests for Lexkit RichTextEditor
    - Test toolbar buttons
    - Test slash commands
    - Test keyboard shortcuts
    - Test image picker integration
    - Test content sanitization

- [x] 26. Verify backward compatibility
  - [x] 26.1 Test with SectionEditor
    - Verify RichTextEditor works in SectionEditor
    - Test all formatting features
    - Test image insertion
    - Test content saving
    - _Requirements: 23.5_
  
  - [x] 26.2 Test with ContentPageForm
    - Verify RichTextEditor works in ContentPageForm
    - Test all features
    - Verify no breaking changes
    - _Requirements: 23.10_
  
  - [x] 26.3 Test with EmailComposer
    - Verify RichTextEditor works in EmailComposer
    - Test all features
    - Verify no breaking changes
    - _Requirements: 23.10_
  
  - [x] 26.4 Write integration tests for all usages
    - Test SectionEditor integration
    - Test ContentPageForm integration
    - Test EmailComposer integration

- [x] 27. Verify performance improvements
  - [x] 27.1 Run performance benchmarks
    - Measure typing latency (target: < 16ms)
    - Test with large documents (10,000 words)
    - Verify smooth scrolling
    - Verify no lag on content changes
    - _Requirements: 23.8_
  
  - [x] 27.2 Remove debounce timer
    - Verify no 300ms debounce needed
    - Test immediate onChange updates
    - Verify performance remains good
    - _Requirements: 23.8_
  
  - [x] 27.3 Write performance tests
    - Test typing latency
    - Test large document handling
    - Test scrolling performance
    - Verify meets performance targets

- [x] 28. Checkpoint - Verify Lexkit editor working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 7: Slug Management and Dynamic Routes (Week 7)

- [x] 29. Implement database schema for slugs
  - [x] 29.1 Create migration for slug columns
    - Add slug column to events table (TEXT UNIQUE)
    - Add slug column to activities table (TEXT UNIQUE)
    - Create indexes for slug lookups
    - _Requirements: 24.4, 24.5_
  
  - [x] 29.2 Create slug generation trigger
    - Create database trigger to auto-generate slugs from titles
    - Use generateSlug utility logic
    - Ensure uniqueness with numeric suffixes
    - _Requirements: 24.1, 24.3_
  
  - [x] 29.3 Migrate existing records
    - Create migration script to generate slugs for existing events
    - Create migration script to generate slugs for existing activities
    - Verify all records have valid slugs
    - _Requirements: 24.1_

- [x] 30. Update services with slug support
  - [x] 30.1 Update eventService with slug methods
    - Add getBySlug method
    - Update create method to generate slug
    - Update update method to preserve slug
    - Add slug validation
    - _Requirements: 24.1, 24.7, 24.8_
  
  - [x] 30.2 Update activityService with slug methods
    - Add getBySlug method
    - Update create method to generate slug
    - Update update method to preserve slug
    - Add slug validation
    - _Requirements: 24.1, 24.7, 24.8_
  
  - [x] 30.3 Update contentPagesService with slug validation
    - Enhance existing slug validation
    - Add uniqueness check across content pages
    - Add makeUniqueSlug support
    - _Requirements: 24.3, 24.4_
  
  - [x] 30.4 Write property test for slug URL safety
    - **Property 23: Slug URL Safety**
    - **Validates: Requirements 24.2, 24.9**
  
  - [x] 30.5 Write property test for slug uniqueness
    - **Property 24: Slug Uniqueness**
    - **Validates: Requirements 24.3, 24.4, 24.5**
  
  - [x] 30.6 Write property test for slug preservation on update
    - **Property 25: Slug Preservation on Update**
    - **Validates: Requirements 24.7**
  
  - [x] 30.7 Write property test for slug generation from title
    - **Property 26: Slug Generation from Title**
    - **Validates: Requirements 24.1**
  
  - [x] 30.8 Write unit tests for slug methods
    - Test getBySlug
    - Test slug generation
    - Test slug preservation
    - Test slug validation
    - Test uniqueness enforcement

- [x] 31. Update routes to use slugs
  - [x] 31.1 Update event detail page
    - Update `app/event/[slug]/page.tsx` to use slug parameter
    - Add slug-based data fetching
    - Maintain backward compatibility with ID-based URLs (redirect)
    - _Requirements: 24.10_
  
  - [x] 31.2 Update activity detail page
    - Update `app/activity/[slug]/page.tsx` to use slug parameter
    - Add slug-based data fetching
    - Maintain backward compatibility with ID-based URLs (redirect)
    - _Requirements: 24.10_
  
  - [x] 31.3 Verify content page routes
    - Verify `app/[type]/[slug]/page.tsx` works correctly
    - Test preview mode with ?preview=true
    - Test published vs draft content
    - _Requirements: 24.10_
  
  - [x] 31.4 Write E2E tests for slug-based routing
    - Test event slug routing
    - Test activity slug routing
    - Test content page slug routing
    - Test preview mode
    - Test backward compatibility redirects

- [x] 32. Checkpoint - Verify slug system working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 8: Admin User Management and Email System (Week 8)

- [x] 33. Implement database schema for admin users
  - [x] 33.1 Create admin_users table
    - Create table with email, role, status, invited_by, invited_at, last_login_at fields
    - Add indexes for email and status
    - Add foreign key for invited_by
    - _Requirements: 3.1, 3.3_
  
  - [x] 33.2 Create email_templates table
    - Create table with name, subject, body_html, variables, category, usage_count fields
    - Add index for category
    - _Requirements: 17.1, 17.2_
  
  - [x] 33.3 Create email_history table
    - Create table with template_id, recipient_ids, subject, body_html, sent_at, scheduled_for, delivery_status, sent_by fields
    - Add indexes for sent_at and delivery_status
    - _Requirements: 4.6, 4.7_

- [-] 34. Create admin user management component
  - [x] 34.1 Create AdminUserManager component
    - Create `components/admin/AdminUserManager.tsx`
    - Display list of admin users in DataTable
    - Add "Add Admin User" button
    - Add edit, deactivate, delete actions
    - Show last login timestamp
    - _Requirements: 3.1, 3.5, 3.6, 3.7_
  
  - [x] 34.2 Add admin user form
    - Create form for adding/editing admin users
    - Add email input with validation
    - Add role selection (admin, owner)
    - Add status toggle (active, inactive)
    - _Requirements: 3.1, 3.3_
  
  - [x] 34.3 Write property test for invitation email sending
    - **Property 9: Invitation Email Sending**
    - **Validates: Requirements 3.2**
  
  - [x] 34.4 Write property test for owner-only action restriction
    - **Property 10: Owner-Only Action Restriction**
    - **Validates: Requirements 3.4**
  
  - [x] 34.5 Write property test for deactivated account login prevention
    - **Property 11: Deactivated Account Login Prevention**
    - **Validates: Requirements 3.8**
  
  - [x] 34.6 Write property test for last owner protection
    - **Property 12: Last Owner Protection**
    - **Validates: Requirements 3.10**
  
  - [x] 34.7 Write property test for admin action audit logging
    - **Property 13: Admin Action Audit Logging**
    - **Validates: Requirements 3.9**
  
  - [x] 34.8 Write unit tests for AdminUserManager
    - Test user list display
    - Test add user form
    - Test edit user
    - Test deactivate user
    - Test delete user
    - Test last owner protection

- [-] 35. Create admin user management API routes
  - [-] 35.1 Create admin users CRUD API routes
    - Create `app/api/admin/admin-users/route.ts` (GET, POST)
    - Create `app/api/admin/admin-users/[id]/route.ts` (PUT, DELETE)
    - Enforce owner-only permissions
    - Send invitation emails on creation
    - Log all actions in audit log
    - _Requirements: 3.1, 3.2, 3.4, 3.9_
  
  - [x] 35.2 Create deactivate and invite API routes
    - Create `app/api/admin/admin-users/[id]/deactivate/route.ts` (POST)
    - Create `app/api/admin/admin-users/[id]/invite/route.ts` (POST)
    - Enforce owner-only permissions
    - Prevent last owner deactivation
    - _Requirements: 3.6, 3.10_
  
  - [x] 35.3 Write integration tests for admin user API
    - Test create admin user
    - Test update admin user
    - Test deactivate admin user
    - Test delete admin user
    - Test last owner protection
    - Test owner-only permissions

- [x] 36. Create email template management
  - [x] 36.1 Create email template editor component
    - Create `components/admin/EmailTemplateEditor.tsx`
    - Add rich text editor for email body
    - Add subject line input
    - Add variable picker ({{guest_name}}, {{event_name}}, etc.)
    - Add template preview with sample data
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [x] 36.2 Create email template list page
    - Create `app/admin/emails/templates/page.tsx`
    - Display list of templates with usage statistics
    - Add create, edit, delete actions
    - Show default templates
    - _Requirements: 17.5, 17.6, 17.7, 17.10_
  
  - [x] 36.3 Write unit tests for email template editor
    - Test template creation
    - Test variable insertion
    - Test template preview
    - Test template validation

- [x] 37. Create email composition and sending
  - [x] 37.1 Create EmailComposer component
    - Update `components/admin/EmailComposer.tsx`
    - Add recipient selection (individual, groups, all)
    - Add template selection
    - Add rich text editor for email body
    - Add preview with variable substitution
    - Add schedule option
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 37.2 Create email history viewer
    - Create `components/admin/EmailHistory.tsx`
    - Display list of sent emails
    - Show delivery status
    - Add filter by recipient, date, status
    - _Requirements: 4.6, 4.7_
  
  - [x] 37.3 Write unit tests for EmailComposer
    - Test recipient selection
    - Test template selection
    - Test email preview
    - Test scheduling

- [x] 38. Create email API routes
  - [x] 38.1 Create email template API routes
    - Create `app/api/admin/emails/templates/route.ts` (GET, POST)
    - Create `app/api/admin/emails/templates/[id]/route.ts` (PUT, DELETE)
    - Validate template syntax
    - Prevent deletion of templates in use
    - _Requirements: 17.1, 17.4, 17.7, 17.8, 17.9_
  
  - [x] 38.2 Create email sending API routes
    - Create `app/api/admin/emails/send/route.ts` (POST)
    - Create `app/api/admin/emails/schedule/route.ts` (POST)
    - Create `app/api/admin/emails/preview/route.ts` (POST)
    - Implement variable substitution
    - Send emails via emailService
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 38.3 Create email history API route
    - Create `app/api/admin/emails/history/route.ts` (GET)
    - Return email history with delivery status
    - Support filtering and pagination
    - _Requirements: 4.6, 4.7_
  
  - [x] 38.4 Write integration tests for email API
    - Test template CRUD operations
    - Test email sending
    - Test email scheduling
    - Test email preview
    - Test email history

- [x] 39. Implement automated email triggers
  - [x] 39.1 Add RSVP confirmation email trigger
    - Update rsvpService to send confirmation email on RSVP submission
    - Use email template with variable substitution
    - _Requirements: 4.9_
  
  - [x] 39.2 Add activity reminder email trigger
    - Create scheduled job to send reminders 48 hours before activities
    - Use email template with activity details
    - _Requirements: 26.10_
  
  - [x] 39.3 Add deadline notification email trigger
    - Create scheduled job to send deadline reminders
    - Use email template with deadline information
    - _Requirements: 4.8_
  
  - [x] 39.4 Add admin toggle for automated triggers
    - Add settings to enable/disable automated triggers per event/activity
    - Store settings in database
    - _Requirements: 4.10_
  
  - [x] 39.5 Write integration tests for automated triggers
    - Test RSVP confirmation email
    - Test activity reminder email
    - Test deadline notification email
    - Test trigger enable/disable

- [x] 40. Checkpoint - Verify admin user management and email system working
  - All tests pass. Phase 8 complete. See PHASE_8_COMPLETE.md for details.


### Phase 9: Guest Content Pages and Activities (Week 9)

- [-] 41. Create guest events page
  - [x] 41.1 Create events list page
    - Create `app/guest/events/page.tsx`
    - Display list of events guest is invited to
    - Show event date, time, location
    - Display guest's RSVP status
    - Add filter by date range
    - _Requirements: 9.1, 9.2, 9.5, 9.6_
  
  - [x] 41.2 Create EventCard component
    - Create `components/guest/EventCard.tsx`
    - Display event information
    - Show activity count
    - Display RSVP status indicator
    - Add click handler to open preview modal
    - _Requirements: 9.1, 9.2_
  
  - [x] 41.3 Write unit tests for events page
    - Test event list display
    - Test date filtering
    - Test RSVP status display
    - Test event card interactions

- [-] 42. Create guest activities page
  - [x] 42.1 Create activities list page
    - Create `app/guest/activities/page.tsx`
    - Display list of activities guest is invited to
    - Show activity details (date, time, location, capacity, cost)
    - Display guest's RSVP status
    - Add filter by type and date
    - _Requirements: 9.3, 9.4, 9.5, 9.7_
  
  - [x] 42.2 Create ActivityCard component
    - Create `components/guest/ActivityCard.tsx`
    - Display activity information
    - Show remaining capacity
    - Display RSVP status indicator
    - Add click handler to open preview modal
    - _Requirements: 9.3, 9.4_
  
  - [x] 42.3 Write unit tests for activities page
    - Test activity list display
    - Test filtering
    - Test RSVP status display
    - Test activity card interactions

- [-] 43. Implement guest RSVP functionality
  - [x] 43.1 Create RSVP form component
    - Create `components/guest/RSVPForm.tsx`
    - Add status selection (attending, declined, maybe)
    - Add guest count input (if applicable)
    - Add dietary restrictions input (for meals)
    - Add plus-one support (if permitted)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.8_
  
  - [x] 43.2 Add RSVP validation
    - Enforce RSVP deadlines
    - Check capacity constraints
    - Validate guest count
    - Display remaining capacity
    - _Requirements: 10.5, 10.6, 10.7_
  
  - [x] 43.3 Add RSVP submission handling
    - Submit RSVP via API
    - Send confirmation email
    - Display success message
    - Update UI optimistically
    - _Requirements: 10.9, 10.10_
  
  - [x] 43.4 Write property test for RSVP deadline enforcement
    - **Property 8: RSVP Deadline Enforcement**
    - **Validates: Requirements 10.5**
  
  - [x] 43.5 Write unit tests for RSVP form
    - Test form rendering
    - Test validation
    - Test submission
    - Test error handling

- [ ] 44. Create guest RSVP API routes
  - [x] 44.1 Create RSVP CRUD API routes
    - Create `app/api/guest/rsvps/route.ts` (GET, POST)
    - Create `app/api/guest/rsvps/[id]/route.ts` (PUT)
    - Enforce RLS policies
    - Validate capacity and deadlines
    - Send confirmation emails
    - _Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9_
  
  - [x] 44.2 Create RSVP summary API route
    - Create `app/api/guest/rsvps/summary/route.ts` (GET)
    - Return guest's RSVP summary
    - Include event and activity counts
    - _Requirements: 7.5_
  
  - [x] 44.3 Write integration tests for guest RSVP API
    - Test create RSVP
    - Test update RSVP
    - Test get RSVPs
    - Test RSVP summary
    - Test capacity validation
    - Test deadline enforcement

- [ ] 45. Enhance guest itinerary viewer
  - [x] 45.1 Update itinerary page
    - Update `app/guest/itinerary/page.tsx`
    - Display activities in chronological order grouped by date
    - Add date range filter
    - Add calendar view toggle
    - Add PDF export button
    - _Requirements: 26.1, 26.2, 26.4, 26.5, 26.6_
  
  - [x] 45.2 Enhance ItineraryViewer component
    - Update `components/guest/ItineraryViewer.tsx`
    - Add day-by-day view
    - Add calendar view
    - Add list view
    - Highlight capacity warnings and deadline alerts
    - Add quick links to modify RSVPs
    - _Requirements: 26.2, 26.3, 26.7, 26.8_
  
  - [x] 45.3 Implement PDF export
    - Create PDF generation service
    - Include all activity details
    - Format for printing
    - _Requirements: 26.5_
  
  - [x] 45.4 Write property test for itinerary chronological ordering
    - **Property 35: Itinerary Chronological Ordering**
    - **Validates: Requirements 26.2**
  
  - [x] 45.5 Write property test for itinerary RSVP filtering
    - **Property 36: Itinerary RSVP Filtering**
    - **Validates: Requirements 26.1**
  
  - [x] 45.6 Write unit tests for itinerary viewer
    - Test day-by-day view
    - Test calendar view
    - Test filtering
    - Test PDF export

- [x] 46. Create guest content API routes
  - [x] 46.1 Create content pages API routes
    - Create `app/api/guest/content-pages/route.ts` (GET)
    - Create `app/api/guest/content-pages/[slug]/route.ts` (GET)
    - Return only published content pages
    - Enforce RLS policies
    - _Requirements: 8.1, 8.2_
  
  - [x] 46.2 Create events API routes
    - Create `app/api/guest/events/route.ts` (GET)
    - Create `app/api/guest/events/[slug]/route.ts` (GET)
    - Return only events guest is invited to
    - Include RSVP status
    - _Requirements: 9.1, 9.2_
  
  - [x] 46.3 Create activities API routes
    - Create `app/api/guest/activities/route.ts` (GET)
    - Create `app/api/guest/activities/[slug]/route.ts` (GET)
    - Return only activities guest is invited to
    - Include RSVP status and capacity info
    - _Requirements: 9.3, 9.4_
  
  - [x] 46.4 Create itinerary API routes
    - Create `app/api/guest/itinerary/route.ts` (GET)
    - Create `app/api/guest/itinerary/pdf/route.ts` (GET)
    - Create `app/api/guest/itinerary/calendar/route.ts` (GET)
    - Return personalized itinerary
    - Generate PDF on demand
    - _Requirements: 26.1, 26.5, 26.6_
  
  - [x]* 46.5 Write integration tests for guest content API
    - Test content pages endpoints
    - Test events endpoints
    - Test activities endpoints
    - Test itinerary endpoints
    - Test RLS enforcement

- [x] 47. Checkpoint - Verify guest content pages and activities working
  - All tests pass. Phase 9 complete. See PHASE_9_COMPLETE.md for details.


### Phase 10: Cascade Deletion and Soft Delete (Week 10)

- [ ] 48. Implement database schema for soft delete
  - [x] 48.1 Create migration for deleted_at columns
    - Add deleted_at column to content_pages table
    - Add deleted_at column to sections table
    - Add deleted_at column to columns table
    - Add deleted_at column to events table
    - Add deleted_at column to activities table
    - Add deleted_at column to photos table
    - _Requirements: 29.7_
  
  - [x] 48.2 Create indexes for soft delete queries
    - Create partial indexes on deleted_at IS NULL
    - Optimize queries for non-deleted records
    - _Requirements: 29.8_
  
  - [x] 48.3 Update RLS policies to filter soft-deleted records
    - Update all RLS policies to exclude deleted_at IS NOT NULL
    - Ensure guest-facing queries never return deleted records
    - _Requirements: 29.8_

- [ ] 49. Implement soft delete service methods
  - [x] 49.1 Update contentPagesService with soft delete
    - Add soft delete option to delete method
    - Implement cascade soft delete for sections and columns
    - Add restore method
    - _Requirements: 29.1, 29.2, 29.7, 29.9_
  
  - [x] 49.2 Update eventService with soft delete
    - Add soft delete option to delete method
    - Implement cascade soft delete for activities and RSVPs
    - Add restore method
    - _Requirements: 29.1, 29.7, 29.9_
  
  - [x] 49.3 Update activityService with soft delete
    - Add soft delete option to delete method
    - Implement cascade soft delete for RSVPs
    - Add restore method
    - _Requirements: 29.1, 29.7, 29.9_
  
  - [x] 49.4 Write property test for content page cascade deletion
    - **Property 30: Content Page Cascade Deletion**
    - **Validates: Requirements 29.1, 29.2**
  
  - [x] 49.5 Write property test for event cascade deletion
    - **Property 31: Event Cascade Deletion**
    - **Validates: Requirements 29.1**
  
  - [x] 49.6 Write property test for soft delete filtering
    - **Property 32: Soft Delete Filtering**
    - **Validates: Requirements 29.8**
  
  - [x] 49.7 Write property test for soft delete restoration
    - **Property 33: Soft Delete Restoration**
    - **Validates: Requirements 29.9**
  
  - [x]* 49.8 Write unit tests for soft delete methods
    - Test soft delete
    - Test cascade deletion
    - Test restore
    - Test filtering

- [ ] 50. Implement referential integrity checks
  - [x] 50.1 Add reference checking before deletion
    - Create checkReferences utility function
    - Check for references in sections
    - Check for references in other entities
    - Return list of dependent records
    - _Requirements: 29.4, 29.5_
  
  - [x] 50.2 Add deletion confirmation UI
    - Display warning with list of dependent records
    - Require explicit confirmation for cascade deletion
    - Provide option to reassign references
    - _Requirements: 29.4, 29.5_
  
  - [x] 50.3 Write property test for referential integrity check
    - **Property 34: Referential Integrity Check**
    - **Validates: Requirements 29.4**
  
  - [x] 50.4 Write unit tests for reference checking
    - Test reference detection
    - Test warning display
    - Test cascade confirmation

- [ ] 51. Create deleted items manager
  - [x] 51.1 Create DeletedItemsManager component
    - Create `components/admin/DeletedItemsManager.tsx`
    - Display list of soft-deleted items
    - Show deletion date and deleted by user
    - Add restore and permanent delete actions
    - Filter by entity type
    - _Requirements: 29.9_
  
  - [x] 51.2 Create deleted items page
    - Create `app/admin/deleted-items/page.tsx`
    - Integrate DeletedItemsManager component
    - Add search and filter functionality
    - _Requirements: 29.9_
  
  - [x] 51.3 Write unit tests for DeletedItemsManager
    - Test item list display
    - Test restore action
    - Test permanent delete action
    - Test filtering

- [ ] 52. Create deleted items API routes
  - [x] 52.1 Create deleted items API routes
    - Create `app/api/admin/deleted-items/route.ts` (GET)
    - Create `app/api/admin/deleted-items/[id]/restore/route.ts` (POST)
    - Create `app/api/admin/deleted-items/[id]/permanent/route.ts` (DELETE)
    - Return soft-deleted items
    - Implement restore functionality
    - Implement permanent deletion
    - _Requirements: 29.9_
  
  - [x]* 52.2 Write integration tests for deleted items API
    - Test get deleted items
    - Test restore item
    - Test permanent delete
    - Test cascade restoration

- [ ] 53. Implement scheduled cleanup job
  - [x] 53.1 Create cleanup service
    - Create cleanupOldDeletedItems function
    - Permanently delete items older than 30 days
    - Log cleanup actions
    - _Requirements: 29.10_
  
  - [x] 53.2 Schedule cleanup job
    - Configure cron job to run daily at 2 AM
    - Use existing cronService
    - Add error handling and logging
    - _Requirements: 29.10_
  
  - [x] 53.3 Write unit tests for cleanup job
    - Test cleanup logic
    - Test date filtering
    - Test permanent deletion

- [x] 54. Checkpoint - Verify cascade deletion and soft delete working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 11: Performance Optimization and Polish (Week 11)

- [x] 55. Optimize database queries
  - [x] 55.1 Add database indexes
    - Create indexes on frequently queried columns
    - Create composite indexes for multi-column queries
    - Create partial indexes for filtered queries
    - _Requirements: 19.1, 19.2_
  
  - [x] 55.2 Optimize N+1 queries
    - Identify N+1 query patterns
    - Use select with joins to fetch related data
    - Batch queries where possible
    - _Requirements: 19.2_
  
  - [x] 55.3 Add pagination to large result sets
    - Implement pagination for guest lists (50 per page)
    - Implement pagination for activity lists
    - Implement pagination for email history
    - _Requirements: 18.6, 18.7_
  
  - [x] 55.4 Write performance tests for database queries
    - Test query execution time
    - Test with large datasets (500+ records)
    - Verify meets performance targets (< 100ms)

- [x] 56. Implement caching strategy
  - [x] 56.1 Add Redis caching layer
    - Configure Redis connection
    - Cache frequently accessed data (events, activities, content pages)
    - Set TTL: 5 minutes for dynamic data, 1 hour for static data
    - _Requirements: 19.6_
  
  - [x] 56.2 Implement cache invalidation
    - Invalidate cache on mutations
    - Use cache tags for related data
    - Implement cache warming on deployment
    - _Requirements: 19.6_
  
  - [x] 56.3 Add client-side caching
    - Use React Query for API response caching
    - Cache RSVP data for 5 minutes
    - Cache content pages for 1 hour
    - _Requirements: 18.9_
  
  - [x] 56.4 Write tests for caching
    - Test cache hit/miss
    - Test cache invalidation
    - Test cache expiry

- [x] 57. Optimize frontend performance
  - [x] 57.1 Implement code splitting
    - Add dynamic imports for heavy components
    - Implement route-based code splitting
    - Lazy load below-the-fold content
    - _Requirements: 19.5_
  
  - [x] 57.2 Optimize images
    - Use Next.js Image component
    - Convert to WebP format
    - Implement lazy loading
    - Add responsive images with srcset
    - _Requirements: 19.8_
  
  - [x] 57.3 Optimize bundle size
    - Enable tree shaking
    - Minify and compress code
    - Enable Gzip/Brotli compression
    - Inline critical CSS
    - _Requirements: 19.5_
  
  - [x] 57.4 Run Lighthouse performance audit
    - Test performance score (target: > 90)
    - Test First Contentful Paint (target: < 1.5s)
    - Test Largest Contentful Paint (target: < 2.5s)
    - Test Cumulative Layout Shift (target: < 0.1)
    - _Requirements: 19.9_

- [-] 58. Add performance monitoring
  - [x] 58.1 Configure performance monitoring
    - Set up Vercel Analytics
    - Configure Sentry for error tracking
    - Add custom performance logging
    - _Requirements: 19.1, 19.2_
  
  - [x] 58.2 Set up performance budgets
    - Initial bundle size: < 200KB
    - Total page weight: < 1MB
    - API response time: < 500ms (p95)
    - Database query time: < 100ms (p95)
    - _Requirements: 19.1, 19.2_
  
  - [x] 58.3 Create performance dashboard
    - Display key metrics (page load time, API response time, error rate)
    - Set up alerts for performance degradation
    - Track performance over time
    - _Requirements: 19.1, 19.2_

- [x] 59. Implement responsive design improvements
  - [x] 59.1 Verify mobile responsiveness
    - Test all pages on mobile devices (320px - 768px)
    - Verify touch targets are 44px minimum
    - Test swipe gestures
    - _Requirements: 16.1, 16.2, 16.3_
  
  - [x] 59.2 Test browser zoom support
    - Test zoom up to 200%
    - Verify layout doesn't break
    - Verify text remains readable
    - _Requirements: 16.8_
  
  - [x] 59.3 Test cross-browser compatibility
    - Test in Chrome, Firefox, Safari, Edge (last 2 versions)
    - Fix any browser-specific issues
    - _Requirements: 16.10_
  
  - [x] 59.4 Write responsive design tests
    - Test mobile layout
    - Test tablet layout
    - Test desktop layout
    - Test touch targets

- [x] 60. Checkpoint - Verify performance optimizations working
  - Ensure all tests pass, ask the user if questions arise.


### Phase 12: Final Testing and Documentation (Week 12)

- [x] 61. Complete regression test suite
  - [x] 61.1 Write regression tests for authentication
    - Test email matching authentication
    - Test magic link authentication
    - Test session expiry
    - Test rate limiting
    - _Requirements: 5.1, 5.2, 5.3, 5.9, 20.8_
  
  - [x] 61.2 Write regression tests for RSVP system
    - Test RSVP submission
    - Test capacity validation
    - Test deadline enforcement
    - Test confirmation emails
    - _Requirements: 10.1, 10.5, 10.6, 10.7, 10.9_
  
  - [x] 61.3 Write regression tests for reference blocks
    - Test reference block creation
    - Test circular reference detection
    - Test reference validation
    - Test reference preview modals
    - _Requirements: 21.6, 21.8, 21.9, 25.1, 25.5_
  
  - [x] 61.4 Write regression tests for cascade deletion
    - Test soft delete
    - Test cascade deletion
    - Test restoration
    - Test permanent deletion
    - _Requirements: 29.1, 29.2, 29.7, 29.9, 29.10_
  
  - [x] 61.5 Write regression tests for slug management
    - Test slug generation
    - Test slug uniqueness
    - Test slug preservation
    - Test slug-based routing
    - _Requirements: 24.1, 24.3, 24.7, 24.10_

- [ ] 62. Complete E2E test suite
  - [ ] 62.1 Write E2E test for guest authentication flow
    - Test complete email matching flow
    - Test complete magic link flow
    - Test logout
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 62.2 Write E2E test for guest RSVP flow
    - Test complete RSVP submission workflow
    - Test RSVP editing
    - Test capacity constraints
    - Test confirmation email
    - _Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9_
  
  - [ ] 62.3 Write E2E test for admin user management flow
    - Test complete admin user creation workflow
    - Test invitation email
    - Test deactivation
    - Test last owner protection
    - _Requirements: 3.1, 3.2, 3.6, 3.8, 3.10_
  
  - [ ] 62.4 Write E2E test for reference block creation flow
    - Test complete reference block workflow
    - Test circular reference prevention
    - Test guest view of references
    - Test preview modals
    - _Requirements: 21.6, 21.7, 21.8, 21.9, 25.1, 25.5_
  
  - [ ] 62.5 Write E2E test for email composition flow
    - Test complete email composition workflow
    - Test template selection
    - Test recipient selection
    - Test email preview
    - Test email sending
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 63. Perform security audit
  - [ ] 63.1 Audit authentication security
    - Verify session security (HTTP-only cookies, secure flag, SameSite)
    - Verify token security (cryptographic strength, expiry, single-use)
    - Verify rate limiting (login attempts, API requests, magic links)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.6_
  
  - [ ] 63.2 Audit authorization security
    - Verify RLS policies enforce data isolation
    - Verify role-based access control
    - Verify owner-only actions restricted
    - _Requirements: 20.1, 20.2_
  
  - [ ] 63.3 Audit input validation
    - Verify all inputs validated with Zod schemas
    - Verify SQL injection prevention
    - Verify XSS prevention via sanitization
    - Verify CSRF protection
    - _Requirements: 20.2, 20.3, 20.5, 20.9_
  
  - [ ] 63.4 Audit file upload security
    - Verify file type validation
    - Verify file size limits
    - Verify secure file storage
    - _Requirements: 13.9_
  
  - [ ] 63.5 Create security audit report
    - Document all security measures
    - List any vulnerabilities found
    - Provide remediation recommendations
    - _Requirements: 20.1-20.10_

- [ ] 64. Perform accessibility audit
  - [ ] 64.1 Run automated accessibility tests
    - Run Axe-core on all pages
    - Verify color contrast ratios (WCAG 2.1 AA)
    - Verify ARIA labels
    - Verify keyboard navigation
    - _Requirements: 16.4, 16.5, 16.6, 16.7_
  
  - [ ] 64.2 Perform manual accessibility testing
    - Test with screen reader (NVDA or JAWS)
    - Test keyboard-only navigation
    - Test mobile touch targets (44px minimum)
    - Test zoom up to 200%
    - _Requirements: 16.3, 16.5, 16.8_
  
  - [ ] 64.3 Create accessibility audit report
    - Document WCAG 2.1 AA compliance
    - List any accessibility issues found
    - Provide remediation recommendations
    - _Requirements: 16.4_

- [ ] 65. Write user documentation
  - [ ] 65.1 Write admin user guide
    - Document navigation system
    - Document inline RSVP management
    - Document admin user management
    - Document email system
    - Document reference blocks
    - Document section manager
  
  - [ ] 65.2 Write guest user guide
    - Document authentication methods
    - Document RSVP system
    - Document itinerary viewer
    - Document family management
    - Document photo gallery
  
  - [ ] 65.3 Write developer documentation
    - Document architecture
    - Document API endpoints
    - Document database schema
    - Document testing strategy
    - Document deployment process

- [ ] 66. Create deployment checklist
  - [ ] 66.1 Pre-deployment verification
    - Verify all tests passing (unit, integration, E2E, property)
    - Verify code review completed
    - Verify database migrations tested
    - Verify performance benchmarks met
    - Verify security audit passed
    - Verify accessibility audit passed
  
  - [ ] 66.2 Staging deployment
    - Deploy to staging environment
    - Run smoke tests
    - Perform manual testing
    - Verify all features working
    - Check performance metrics
  
  - [ ] 66.3 Production deployment plan
    - Create database backup
    - Prepare migration scripts
    - Prepare rollback plan
    - Configure monitoring alerts
    - Schedule deployment window
  
  - [ ] 66.4 Post-deployment monitoring
    - Monitor error rates for 24 hours
    - Monitor performance metrics
    - Collect user feedback
    - Address any issues immediately

- [ ] 67. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

**Testing Standards:**
- All tasks marked with `*` are optional test tasks that can be skipped for faster MVP
- Property-based tests use Fast-Check with minimum 100 iterations
- Each property test must reference its design document property number
- Integration tests must use real database (test instance)
- E2E tests must use Playwright with accessibility checks
- Regression tests required for all bug fixes

**Implementation Dependencies:**
- Phase 2 (Guest Authentication) can proceed in parallel with Phase 1 (Admin Navigation)
- Phase 4 (Guest Portal Foundation) depends on Phase 2 (Guest Authentication)
- Phase 5 (Reference Blocks) can proceed in parallel with Phase 3 (Inline RSVP)
- Phase 6 (Lexkit Editor) can proceed in parallel with other phases
- Phase 7 (Slug Management) should complete before Phase 9 (Guest Content Pages)
- Phase 8 (Admin User Management) can proceed in parallel with guest-side work
- Phase 10 (Cascade Deletion) should complete before final testing

**Existing Components to Leverage:**
- `GuestDashboard.tsx` - Guest dashboard layout
- `RSVPManager.tsx` - RSVP interface
- `ItineraryViewer.tsx` - Itinerary display
- `AccommodationViewer.tsx` - Accommodation details
- `TransportationForm.tsx` - Flight detail input
- `PhotoGallery.tsx` - Photo display
- `PhotoUpload.tsx` - Photo upload interface
- `SectionRenderer.tsx` - Section rendering
- `ReferenceDisplay.tsx` - Cross-reference links
- `FamilyManager.tsx` - Group member management

**Existing Services Available:**
- `guestService.ts` - Guest profile management
- `rsvpService.ts` - RSVP operations
- `eventService.ts` - Event data
- `activityService.ts` - Activity data
- `accommodationService.ts` - Accommodation assignments
- `transportationService.ts` - Flight and shuttle data
- `photoService.ts` - Photo operations
- `emailService.ts` - Email sending
- `contentPagesService.ts` - Content page CRUD
- `sectionsService.ts` - Section management
- `itineraryService.ts` - Personalized itinerary generation

**Zero-Debt Development:**
- Maintain property-based testing for all business logic
- Write regression tests for all bug fixes
- Achieve 90%+ coverage for service layer
- Achieve 85%+ coverage for API routes
- Achieve 70%+ coverage for components
- All tests must pass before merging

