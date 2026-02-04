# Implementation Plan: Admin UX Enhancements

## Overview

This implementation plan addresses critical UX gaps in the admin dashboard, focusing on guest authentication reliability, API error fixes, inline editing capabilities, and comprehensive RSVP management.

## Tasks

- [x] 1. Database Schema and Migration Setup
  - Create migration for default_auth_method in system_settings
  - Add database indexes for RSVP queries
  - Create migration script to fix existing guest auth_method values
  - Test migrations on development database
  - _Requirements: 1.1, 4.1_

- [x] 1.1 Write property test for auth method validation
  - **Property 1: Auth Method Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Fix Home Page API Error Handling
  - [x] 2.1 Update settingsService with upsertHomePageConfig method
    - Implement upsert pattern for each setting
    - Handle create and update in single operation
    - Add proper error handling and logging
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Update /api/admin/home-page PUT endpoint
    - Replace separate update/create logic with upsert
    - Add comprehensive error handling
    - Improve error logging with context
    - Add request validation with Zod schema
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.3 Write unit tests for home page API
    - Test successful upsert (create and update paths)
    - Test validation errors
    - Test authentication errors
    - Test database errors
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.4 Write property test for home page upsert
    - **Property 2: Home Page Settings Upsert**
    - **Validates: Requirements 2.1, 2.2**


- [x] 3. Implement InlineSectionEditor Component
  - [x] 3.1 Create InlineSectionEditor component
    - Build component with section list display
    - Add inline editing UI for sections
    - Implement add/edit/delete section actions
    - Add drag-and-drop reordering
    - Integrate PhotoPicker for section images
    - Integrate ReferenceBlockPicker for references
    - Add auto-save functionality with debouncing
    - Implement compact mode for embedding
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 3.2 Integrate InlineSectionEditor into home page
    - Add editor below "Manage Sections" button
    - Wire up save callbacks
    - Add loading and error states
    - Test inline editing workflow
    - _Requirements: 3.1, 3.4_
  
  - [x] 3.3 Write component tests for InlineSectionEditor
    - Test rendering with sections
    - Test add/edit/delete operations
    - Test drag-and-drop reordering
    - Test auto-save functionality
    - Test error handling
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 3.4 Write property test for section editor state sync
    - **Property 3: Inline Section Editor State Sync**
    - **Validates: Requirements 3.2, 3.3**

- [x] 4. Checkpoint - Verify home page and inline editor
  - Ensure home page API returns 200 (not 500)
  - Ensure inline section editor saves successfully
  - Test auto-save functionality
  - Ask user if questions arise


- [x] 5. Implement Auth Method Configuration
  - [x] 5.1 Add auth method methods to settingsService
    - Implement getDefaultAuthMethod
    - Implement updateDefaultAuthMethod with bulk guest update
    - Add transaction handling for bulk updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 Create AuthMethodSettings component
    - Build radio button selection UI
    - Add method descriptions
    - Add bulk update existing guests checkbox
    - Add confirmation dialog for changes
    - Implement save functionality
    - _Requirements: 4.2_
  
  - [x] 5.3 Create auth method configuration API endpoints
    - Implement GET /api/admin/settings/auth-method
    - Implement PUT /api/admin/settings/auth-method
    - Add validation for auth method values
    - Add support for bulk guest updates
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 5.4 Integrate AuthMethodSettings into settings page
    - Add auth method section to settings page
    - Wire up API calls
    - Add success/error feedback
    - _Requirements: 4.2_
  
  - [x] 5.5 Write unit tests for auth method configuration
    - Test getDefaultAuthMethod
    - Test updateDefaultAuthMethod
    - Test bulk guest updates
    - Test API endpoints
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.6 Write property tests for auth method
    - **Property 4: Default Auth Method Inheritance**
    - **Property 5: Bulk Auth Method Update**
    - **Validates: Requirements 4.3, 4.4**

- [x] 6. Update Guest Service for Auth Method Inheritance
  - [x] 6.1 Modify guestService.create to inherit default auth method
    - Fetch default_auth_method from settings
    - Set auth_method on new guests
    - Add fallback to 'email_matching' if setting missing
    - _Requirements: 4.3_
  
  - [x] 6.2 Write unit tests for auth method inheritance
    - Test new guest gets default auth method
    - Test fallback to email_matching
    - _Requirements: 4.3_


- [x] 7. Implement RSVP Management Service
  - [x] 7.1 Create rsvpManagementService
    - Implement listRSVPs with filtering and pagination
    - Implement complex joins for RSVP view model
    - Implement getRSVPStatistics
    - Implement bulkUpdateRSVPs with transaction handling
    - Implement exportRSVPsToCSV
    - Add proper error handling
    - _Requirements: 6.2, 6.4, 6.5_
  
  - [x] 7.2 Write unit tests for rsvpManagementService
    - Test listRSVPs with various filters
    - Test pagination
    - Test statistics calculation
    - Test bulk updates
    - Test CSV export
    - _Requirements: 6.2, 6.4, 6.5_
  
  - [x] 7.3 Write property tests for RSVP management
    - **Property 7: RSVP Filter Composition**
    - **Property 8: RSVP Statistics Accuracy**
    - **Property 9: Bulk RSVP Update Atomicity**
    - **Validates: Requirements 6.2, 6.4, 6.5**

- [ ] 8. Create RSVP Management API Endpoints
  - [x] 8.1 Implement GET /api/admin/rsvps
    - Add query parameter validation
    - Call rsvpManagementService.listRSVPs
    - Return paginated results with statistics
    - Add proper error handling
    - _Requirements: 6.2, 6.5_
  
  - [x] 8.2 Implement PATCH /api/admin/rsvps/bulk
    - Validate request body
    - Call rsvpManagementService.bulkUpdateRSVPs
    - Handle partial failures
    - Return updated count
    - _Requirements: 6.4_
  
  - [x] 8.3 Implement GET /api/admin/rsvps/export
    - Validate query parameters
    - Call rsvpManagementService.exportRSVPsToCSV
    - Return CSV file download
    - Add rate limiting
    - _Requirements: 6.4_
  
  - [x] 8.4 Write integration tests for RSVP APIs
    - Test GET with various filters
    - Test bulk update
    - Test CSV export
    - Test error scenarios
    - _Requirements: 6.2, 6.4, 6.5_


- [ ] 9. Implement RSVPManager Component
  - [x] 9.1 Create RSVPManager component
    - Build tabular view with DataTable
    - Implement multi-level filtering UI
    - Add search functionality
    - Implement bulk selection
    - Add bulk status update actions
    - Add export button
    - Display statistics dashboard
    - Add inline RSVP editing
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [x] 9.2 Create /admin/rsvps page
    - Add page with RSVPManager component
    - Wire up API calls
    - Add loading and error states
    - Add success/error feedback
    - _Requirements: 6.1, 6.6_
  
  - [x] 9.3 Write component tests for RSVPManager
    - Test rendering with RSVPs
    - Test filtering
    - Test search
    - Test bulk selection
    - Test bulk update
    - Test export
    - Test statistics display
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 10. Update Navigation
  - [x] 10.1 Add "Preview Guest Portal" link to sidebar
    - Update GroupedNavigation component
    - Add link in "Quick Actions" group
    - Set target="_blank" for new tab
    - Add appropriate icon
    - _Requirements: 5.1, 5.2_
  
  - [x] 10.2 Add "RSVPs" link to sidebar
    - Update GroupedNavigation component
    - Add link in "Guest Management" group
    - Add badge for pending RSVP count (optional)
    - Add appropriate icon
    - _Requirements: 6.6_
  
  - [x] 10.3 Write tests for navigation updates
    - Test "Preview Guest Portal" link renders
    - Test link opens in new tab
    - Test "RSVPs" link renders
    - Test navigation to RSVP page
    - _Requirements: 5.1, 6.6_
  
  - [x] 10.4 Write property test for guest portal preview isolation
    - **Property 6: Guest Portal Preview Isolation**
    - **Validates: Requirements 5.2, 5.3**


- [x] 11. Checkpoint - Verify RSVP management and navigation
  - Ensure RSVP page loads successfully
  - Test filtering and search
  - Test bulk updates
  - Test CSV export
  - Verify navigation links work
  - Ask user if questions arise

- [x] 12. Run Database Migrations
  - [x] 12.1 Apply default_auth_method migration
    - Run 051_add_default_auth_method.sql
    - Verify system_settings table updated
    - Verify constraint added
    - _Requirements: 4.1_
  
  - [x] 12.2 Run guest auth_method fix script
    - Execute fix-guest-auth-methods.mjs
    - Verify all guests have valid auth_method
    - Log number of updated records
    - _Requirements: 1.1, 1.3_
  
  - [x] 12.3 Apply RSVP query indexes
    - Create indexes on rsvps table
    - Verify query performance improvement
    - _Requirements: 6.2_

- [x] 13. Integration Testing
  - [x] 13.1 Write E2E test for home page editing workflow
    - Test admin edits home page settings
    - Test inline section editor
    - Test auto-save
    - _Requirements: 2.1, 3.1, 3.2_
  
  - [x] 13.2 Write E2E test for auth method configuration
    - Test admin changes default auth method
    - Test bulk update of existing guests
    - Test new guest inherits auth method
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 13.3 Write E2E test for RSVP management workflow
    - Test admin filters RSVPs
    - Test bulk status update
    - Test CSV export
    - _Requirements: 6.2, 6.4_
  
  - [x] 13.4 Write E2E test for guest portal preview
    - Test admin clicks preview link
    - Verify opens in new tab
    - Verify shows guest view
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 14. Final Checkpoint - Complete verification
  - Run all tests (unit, integration, property, E2E)
  - Verify all manual testing issues resolved
  - Test guest authentication with both methods
  - Verify no 500 errors in admin dashboard
  - Test all new features end-to-end
  - Ask user if questions arise

- [ ] 15. Pre-Manual Testing Validation (CRITICAL)
  - [-] 15.1 Run TypeScript type checking
    - Execute `npm run type-check`
    - Fix all TypeScript errors
    - Verify no type issues in new code
    - _Ensures: Type safety across all changes_
  
  - [ ] 15.2 Run production build
    - Execute `npm run build`
    - Fix all build errors
    - Verify build completes successfully
    - Check for any warnings that need attention
    - _Ensures: Code compiles for production_
  
  - [ ] 15.3 Run complete test suite
    - Execute `npm test` (all unit and integration tests)
    - Fix any failing tests
    - Verify all tests pass
    - Check test coverage meets thresholds
    - _Ensures: All automated tests pass_
  
  - [ ] 15.4 Run E2E test suite
    - Execute `npm run test:e2e`
    - Fix any failing E2E tests
    - Verify critical user workflows work
    - Test new features in E2E scenarios
    - _Ensures: End-to-end workflows function correctly_
  
  - [ ] 15.5 Verify system health
    - Confirm no 500 errors in admin dashboard
    - Test guest authentication (both methods)
    - Verify home page API works
    - Test RSVP management page loads
    - Check all navigation links work
    - _Ensures: System is stable for manual testing_
  
  - [ ] 15.6 Document test results
    - Create test results summary
    - Note any known issues or limitations
    - Document test coverage metrics
    - List areas requiring manual testing focus
    - _Ensures: Clear handoff to manual testing phase_

- [ ] 16. Ready for Manual Testing
  - All automated tests passing
  - Build successful
  - No TypeScript errors
  - System stable and functional
  - Test results documented
  - **PROCEED TO COMPREHENSIVE MANUAL TESTING**

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Integration tests validate complete user workflows
- Database migrations must be run before deploying code changes
