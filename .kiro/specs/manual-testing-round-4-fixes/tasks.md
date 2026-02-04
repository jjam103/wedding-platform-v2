# Manual Testing Round 4 - Implementation Tasks

## Phase 1: Investigation & Data Verification (Tasks 1-3)

- [x] 1. Investigate B2 Storage and Photo Display Issues
  - [x] 1.1 Check B2 environment variables in `.env.local`
  - [x] 1.2 Test B2 client initialization manually
  - [x] 1.3 Query photos table to verify storage_key format
  - [x] 1.4 Test CDN URL generation with sample key
  - [x] 1.5 Check browser console for B2/photo errors

- [x] 2. Investigate Location Data Issue
  - [x] 2.1 Query locations table directly to check if data exists
  - [x] 2.2 Test `/api/admin/locations` endpoint manually
  - [x] 2.3 Check browser network tab for location API calls
  - [x] 2.4 Add console logging to LocationSelector component
  - [x] 2.5 Determine if issue is data or code

- [x] 3. Investigate RSVP Loading Error
  - [x] 3.1 Test `/api/admin/guests/[id]/rsvps` endpoint manually
  - [x] 3.2 Check browser network tab for actual error response
  - [x] 3.3 Verify API response format matches component expectations
  - [x] 3.4 Check for null/undefined data causing errors
  - [x] 3.5 Add detailed error logging to API route

## Phase 2: B2 Storage & Photos (Tasks 4-6)

- [x] 4. Fix B2 Client Initialization
  - [x] 4.1 Add B2 initialization validation in `b2Service.ts`
  - [x] 4.2 Create environment variable validation function
  - [x] 4.3 Add initialization check before upload operations
  - [x] 4.4 Improve error messages for missing configuration
  - [x] 4.5 Test B2 initialization on app startup

- [x] 5. Create B2 Storage Health Check API
  - [x] 5.1 Create `app/api/admin/storage/health/route.ts`
  - [x] 5.2 Implement GET endpoint that calls `checkB2Health()`
  - [x] 5.3 Return status, last check time, error details
  - [x] 5.4 Add authentication check
  - [x] 5.5 Test endpoint manually

- [x] 6. Display Storage Health in Photos Page
  - [x] 6.1 Add storage health state to photos page
  - [x] 6.2 Fetch health status on page load
  - [x] 6.3 Display health indicator in UI
  - [x] 6.4 Show error details if unhealthy
  - [x] 6.5 Add refresh button for health check

## Phase 3: Vendor Bookings (Tasks 7-9)

- [x] 7. Fix Vendor Booking Duplicate Dropdowns
  - [x] 7.1 Review `bookingFormFields` array in vendors page
  - [x] 7.2 Check for duplicate activity/event field definitions
  - [x] 7.3 Remove duplicate fields if found
  - [x] 7.4 Test booking form renders correctly
  - [x] 7.5 Verify dropdowns populate without duplicates

- [x] 8. Implement Auto-Calculate Total Cost
  - [x] 8.1 Remove `totalCost` from required input fields
  - [x] 8.2 Add cost calculation function in vendors page
  - [x] 8.3 Calculate based on pricing model and guest count
  - [x] 8.4 Display as read-only calculated field
  - [x] 8.5 Update on pricing model or guest count change

- [x] 9. Fix Vendor Booking Validation
  - [x] 9.1 Update `createVendorBookingSchema` in schemas
  - [x] 9.2 Make `guestCount` conditionally required
  - [x] 9.3 Make `activityId` and `eventId` truly optional
  - [x] 9.4 Set `hostSubsidy` default to 0
  - [x] 9.5 Test booking creation with various combinations

## Phase 4: RSVP Management (Task 10)

- [x] 10. Fix RSVP Loading Error
  - [x] 10.1 Add detailed error logging to RSVP API route
  - [x] 10.2 Verify authentication pattern is correct
  - [x] 10.3 Add null checks for nested data access
  - [x] 10.4 Improve error messages in InlineRSVPEditor
  - [x] 10.5 Test RSVP expansion with various guests

## Phase 5: Transportation Feature (Tasks 11-13)

- [x] 11. Create Vehicle Requirements API
  - [x] 11.1 Create `app/api/admin/transportation/vehicle-requirements/route.ts`
  - [x] 11.2 Implement GET endpoint with date parameter
  - [x] 11.3 Calculate shuttle needs based on guest count
  - [x] 11.4 Use service role key for database access
  - [x] 11.5 Test endpoint manually

- [x] 12. Create Assign Shuttle API
  - [x] 12.1 Create `app/api/admin/transportation/assign-shuttle/route.ts`
  - [x] 12.2 Implement POST endpoint with guest IDs and shuttle ID
  - [x] 12.3 Verify `guest_shuttles` table exists (create migration if needed)
  - [x] 12.4 Insert shuttle assignments
  - [x] 12.5 Test endpoint manually

- [x] 13. Create Driver Sheets API
  - [x] 13.1 Create `app/api/admin/transportation/driver-sheets/route.ts`
  - [x] 13.2 Implement GET endpoint with shuttle ID and date
  - [x] 13.3 Query guests assigned to shuttle
  - [x] 13.4 Format data for printable sheet
  - [x] 13.5 Test endpoint manually

## Phase 6: System Settings (Tasks 14-15)

- [x] 14. Create System Settings Table
  - [x] 14.1 Create migration `supabase/migrations/XXX_create_system_settings_table.sql`
  - [x] 14.2 Define table schema with key, value, description, category
  - [x] 14.3 Add RLS policies for admin access
  - [x] 14.4 Add indexes for performance
  - [x] 14.5 Apply migration to database

- [x] 15. Update Settings Service and Page
  - [x] 15.1 Verify `settingsService.ts` uses correct table name
  - [x] 15.2 Implement CRUD operations for settings
  - [x] 15.3 Add caching for frequently accessed settings
  - [x] 15.4 Update `app/admin/settings/page.tsx` to use service
  - [x] 15.5 Test settings management workflow

## Phase 7: Location Management (Tasks 16-17)

- [x] 16. Fix Location Data and API
  - [x] 16.1 Verify locations exist in database
  - [x] 16.2 Create seed data migration if needed
  - [x] 16.3 Test `/api/admin/locations` endpoint
  - [x] 16.4 Verify RLS policies allow read access
  - [x] 16.5 Ensure proper response format

- [x] 17. Fix Location Dropdowns in Events and Accommodations
  - [x] 17.1 Add console logging to debug location loading
  - [x] 17.2 Verify `fetchLocations()` is called on mount
  - [x] 17.3 Check if locations state is populated
  - [x] 17.4 Ensure LocationSelector receives locations prop
  - [x] 17.5 Test location selection in both pages

## Phase 8: Event Detail Page (Task 18)

- [x] 18. Fix Event Detail Page Content
  - [x] 18.1 Add related activities query to event detail page
  - [x] 18.2 Fetch location data if locationId exists
  - [x] 18.3 Display location name instead of placeholder
  - [x] 18.4 Add activities section with activity cards
  - [x] 18.5 Test with events that have activities and locations

## Phase 9: Accommodation Event Link (Task 19)

- [x] 19. Add Event Column and View Button to Accommodations
  - [x] 19.1 Fetch events on accommodations page load
  - [x] 19.2 Add `eventId` column to DataTable
  - [x] 19.3 Display event name or "-" if no event
  - [x] 19.4 Add "View Event" button in actions column
  - [x] 19.5 Test navigation to event detail page

## Phase 10: Testing & Verification (Tasks 20-21)

- [x] 20. Manual Testing of All Fixes
  - [x] 20.1 Test photos display and B2 storage health
  - [x] 20.2 Test vendor booking creation and editing
  - [x] 20.3 Test RSVP management workflow
  - [x] 20.4 Test transportation feature completely
  - [x] 20.5 Test system settings management
  - [x] 20.6 Test location dropdowns in events and accommodations
  - [x] 20.7 Test event detail page with activities
  - [x] 20.8 Test accommodation event link navigation

- [x] 21. Regression Testing
  - [x] 21.1 Verify previously fixed issues still work (photos validation, transportation RLS, vendors API, admin users page)
  - [x] 21.2 Test all admin pages load without errors
  - [x] 21.3 Check browser console for any errors
  - [x] 21.4 Verify no broken navigation links
  - [x] 21.5 Test guest portal still works

## Notes

- Tasks 1-3 are investigation tasks to understand root causes
- Some tasks may be skipped if investigation reveals different root cause
- Location issue (Task 16) may just need seed data, not code changes
- RSVP error (Task 10) may be resolved after other fixes
- Transportation feature (Tasks 11-13) requires most implementation work
- All fixes should be tested manually before marking complete
