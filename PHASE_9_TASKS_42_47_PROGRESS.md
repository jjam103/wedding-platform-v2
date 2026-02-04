# Phase 9 Tasks 42-47 Progress Report

## Summary

This document tracks progress on Phase 9 tasks 42-47 for the guest portal and admin enhancements spec. These tasks focus on completing the guest-facing portal with activities pages, RSVP functionality, enhanced itinerary viewer, and API routes.

## Completed Work

### Task 42: Guest Activities Page ✅ (Partial - Code Complete, Tests Pending)

**42.1: Create Activities List Page** ✅
- Created `app/guest/activities/page.tsx`
- Features implemented:
  - Display list of activities guest is invited to
  - Show activity details (date, time, location, capacity, cost)
  - Display guest's RSVP status
  - Filter by activity type (ceremony, reception, meal, transport, activity, other)
  - Filter by date range (from/to dates)
  - Click activity to open ActivityPreviewModal
  - Loading and error states
  - Responsive design with tropical theme
- Requirements covered: 9.3, 9.4, 9.5, 9.7

**42.2: Create ActivityCard Component** ✅
- Created `components/guest/ActivityCard.tsx`
- Features implemented:
  - Display activity information (name, type, date, time, location)
  - Show remaining capacity with visual indicators
  - Display cost per person (net cost after host subsidy)
  - Display RSVP status indicator (attending, declined, maybe, pending)
  - Capacity warning badges:
    - Red "Full" badge when at 100% capacity
    - Yellow "Almost Full" badge when >= 90% capacity
    - Green "X spots left" badge when < 90% capacity
  - Click handler to open preview modal
  - Responsive card design with hover effects
- Requirements covered: 9.3, 9.4

**Bonus: Created EventCard Component** ✅
- Created `components/guest/EventCard.tsx` (referenced in Task 41 but was missing)
- Features implemented:
  - Display event information (name, type, date, time, location)
  - Show activity count
  - Display RSVP status indicator
  - Description preview (truncated to 2 lines)
  - Click handler to open preview modal
  - Responsive card design matching ActivityCard style
- Requirements covered: 9.1, 9.2

**42.3: Write Unit Tests** ⏳ PENDING
- Need to create test files:
  - `app/guest/activities/page.test.tsx`
  - `components/guest/ActivityCard.test.tsx`
- Test coverage needed:
  - Activity list display
  - Filtering (type, date range)
  - RSVP status display
  - Capacity display and warnings
  - Activity card interactions
  - Loading and error states

## Remaining Tasks

### Task 43: Guest RSVP Functionality ⏳ NOT STARTED

**43.1: Create RSVP Form Component**
- File: `components/guest/RSVPForm.tsx`
- Features needed:
  - Radio buttons for status (attending, declined, maybe)
  - Number input for guest count (if applicable)
  - Textarea for dietary restrictions (for meals)
  - Checkbox for plus-one (if permitted)
  - Form validation
  - Submit button with loading state
- Requirements: 10.1, 10.2, 10.3, 10.4, 10.8

**43.2: Add RSVP Validation**
- Implement in RSVPForm component:
  - Check deadline before allowing submission
  - Check capacity before allowing "attending"
  - Validate guest count > 0
  - Show capacity warning if < 10% remaining
  - Show error messages for validation failures
- Requirements: 10.5, 10.6, 10.7

**43.3: Add RSVP Submission Handling**
- Implement in RSVPForm component:
  - POST to `/api/guest/rsvps`
  - Show loading spinner during submission
  - Update local state optimistically
  - Show success toast
  - Refresh RSVP list
- Requirements: 10.9, 10.10

**43.4: Write Property Test for RSVP Deadline Enforcement**
- File: `__tests__/property/rsvpDeadlineEnforcement.property.test.ts`
- Property 8: RSVP Deadline Enforcement
- 100 iterations with fast-check
- Test that RSVPs cannot be submitted after deadline
- Validates Requirements 10.5

**43.5: Write Unit Tests**
- File: `components/guest/RSVPForm.test.tsx`
- Test coverage:
  - Form rendering
  - Status selection
  - Guest count validation
  - Dietary restrictions input
  - Plus-one support
  - Deadline validation
  - Capacity validation
  - Submission handling
  - Error handling

### Task 44: Guest RSVP API Routes ⏳ NOT STARTED

**44.1: Create RSVP CRUD API Routes**
- Files:
  - `app/api/guest/rsvps/route.ts` (GET, POST)
  - `app/api/guest/rsvps/[id]/route.ts` (PUT)
- Follow 4-step pattern:
  1. Auth check (getSession)
  2. Validation (Zod safeParse)
  3. Service call (rsvpService methods)
  4. Response (proper HTTP status)
- GET /rsvps: List guest's RSVPs
- POST /rsvps: Create RSVP (validate capacity, deadline, send confirmation)
- PUT /rsvps/[id]: Update RSVP (validate capacity, deadline)
- Requirements: 10.1, 10.2, 10.5, 10.6, 10.7, 10.9

**44.2: Create RSVP Summary API Route**
- File: `app/api/guest/rsvps/summary/route.ts` (GET)
- GET /summary: Return guest's RSVP summary
  - Include event and activity counts
  - Include pending, attending, declined counts
- Requirements: 7.5

**44.3: Write Integration Tests**
- File: `__tests__/integration/guestRsvpApi.integration.test.ts`
- Test coverage:
  - Create RSVP
  - Update RSVP
  - Get RSVPs
  - Get RSVP summary
  - Capacity validation
  - Deadline enforcement
  - RLS enforcement

### Task 45: Enhanced Itinerary Viewer ⏳ NOT STARTED

**45.1: Update Itinerary Page**
- File: `app/guest/itinerary/page.tsx`
- Features needed:
  - Display activities in chronological order grouped by date
  - Add date range filter
  - Add view toggle (day-by-day, calendar, list)
  - Add PDF export button (calls `/api/guest/itinerary/pdf`)
- Requirements: 26.1, 26.2, 26.4, 26.5, 26.6

**45.2: Enhance ItineraryViewer Component**
- File: `components/guest/ItineraryViewer.tsx` (create if doesn't exist)
- Features needed:
  - Day-by-day view: Activities grouped by date with timeline
  - Calendar view: Full calendar with activities
  - List view: Simple list of all activities
  - Capacity warnings: Red badge if < 10% remaining
  - Deadline alerts: Yellow badge if deadline approaching
  - Quick RSVP links: Click to open RSVP form
- Requirements: 26.2, 26.3, 26.7, 26.8

**45.3: Implement PDF Export**
- File: `app/api/guest/itinerary/pdf/route.ts`
- Use PDF generation library (jsPDF or similar):
  - Include all activity details
  - Format with proper spacing and page breaks
  - Return PDF as download
- Requirements: 26.5

**45.4: Write Property Test for Chronological Ordering**
- File: `__tests__/property/itineraryChronologicalOrdering.property.test.ts`
- Property 35: Itinerary Chronological Ordering
- 100 iterations with fast-check
- Test that activities are always sorted by date/time
- Validates Requirements 26.2

**45.5: Write Property Test for RSVP Filtering**
- File: `__tests__/property/itineraryRsvpFiltering.property.test.ts`
- Property 36: Itinerary RSVP Filtering
- 100 iterations with fast-check
- Test that only activities with attending RSVPs are shown
- Validates Requirements 26.1

**45.6: Write Unit Tests**
- Files:
  - `app/guest/itinerary/page.test.tsx`
  - `components/guest/ItineraryViewer.test.tsx`
- Test coverage:
  - Day-by-day view
  - Calendar view
  - List view
  - Date filtering
  - PDF export
  - Capacity warnings
  - Deadline alerts

### Task 46: Guest Content API Routes ⏳ NOT STARTED

**46.1: Content Pages API Routes**
- Files:
  - `app/api/guest/content-pages/route.ts` (GET)
  - `app/api/guest/content-pages/[slug]/route.ts` (GET)
- GET /content-pages: List published content pages
- GET /content-pages/[slug]: Get content page by slug
- Requirements: 8.1, 8.2

**46.2: Events API Routes**
- Files:
  - `app/api/guest/events/route.ts` (GET)
  - `app/api/guest/events/[slug]/route.ts` (GET)
- GET /events: List events guest is invited to (with RSVP status)
- GET /events/[slug]: Get event by slug (with RSVP status)
- Requirements: 9.1, 9.2

**46.3: Activities API Routes**
- Files:
  - `app/api/guest/activities/route.ts` (GET)
  - `app/api/guest/activities/[slug]/route.ts` (GET)
- GET /activities: List activities guest is invited to (with RSVP status, capacity)
- GET /activities/[slug]: Get activity by slug (with RSVP status, capacity)
- Requirements: 9.3, 9.4

**46.4: Itinerary API Routes**
- Files:
  - `app/api/guest/itinerary/route.ts` (GET)
  - `app/api/guest/itinerary/pdf/route.ts` (GET)
- GET /itinerary: Return personalized itinerary
- GET /itinerary/pdf: Generate PDF on demand
- Requirements: 26.1, 26.5, 26.6

**46.5: Write Integration Tests**
- File: `__tests__/integration/guestContentApi.integration.test.ts`
- Test coverage:
  - Content pages endpoints
  - Events endpoints
  - Activities endpoints
  - Itinerary endpoints
  - RLS enforcement

### Task 47: Checkpoint ⏳ NOT STARTED

**47.1: Run All Tests**
- Execute: `npm test`
- Verify all tests pass

**47.2: Create Completion Document**
- File: `PHASE_9_COMPLETE.md`
- Include:
  - Summary of all completed work (tasks 41-47)
  - Test results (all passing)
  - Requirements coverage matrix
  - Integration instructions
  - Next steps for Phase 10

## Implementation Notes

### Existing Services Available

All backend services are complete and ready to use:
- `activityService.ts` - Activity CRUD, capacity info, net cost calculation, slug support
- `rsvpService.ts` - RSVP CRUD, capacity validation, deadline enforcement
- `eventService.ts` - Event CRUD, scheduling conflicts, slug support
- `itineraryService.ts` - Personalized itinerary generation, caching
- `contentPagesService.ts` - Content page CRUD, slug support
- `sectionsService.ts` - Section management, reference validation

### API Route Pattern

All API routes should follow the 4-step pattern:

```typescript
export async function POST(request: Request) {
  // 1. Auth check
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  // 2. Parse and validate
  const body = await request.json();
  const validation = schema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: validation.error.issues } },
      { status: 400 }
    );
  }
  
  // 3. Call service
  const result = await service.method(validation.data);
  
  // 4. Return response with proper HTTP status
  return NextResponse.json(result, { status: result.success ? 201 : 500 });
}
```

### Testing Standards

Follow testing-standards.md:
- Unit tests for all components and services
- Property-based tests for business logic (100 iterations minimum)
- Integration tests for API routes with real database
- E2E tests for critical user workflows
- Maintain 90%+ coverage for service layer
- Maintain 85%+ coverage for API routes
- Maintain 70%+ coverage for components

### Key Design Decisions

1. **ActivityCard and EventCard**: Consistent card design with tropical theme, hover effects, and clear visual hierarchy
2. **Capacity Warnings**: Three-tier system (green/yellow/red) with < 10% threshold for warnings
3. **RSVP Status**: Four states (attending, declined, maybe, pending) with color-coded badges
4. **Filtering**: Type and date range filters with clear/reset functionality
5. **Modal Previews**: Reuse existing ActivityPreviewModal and EventPreviewModal components

## Next Steps

To complete Phase 9:

1. **Write Unit Tests for Task 42** (42.3)
   - Test activities page functionality
   - Test ActivityCard component
   - Verify filtering works correctly

2. **Implement Task 43** (RSVP Functionality)
   - Create RSVPForm component with validation
   - Add submission handling
   - Write property test for deadline enforcement
   - Write unit tests

3. **Implement Task 44** (RSVP API Routes)
   - Create guest RSVP endpoints
   - Follow 4-step API pattern
   - Write integration tests

4. **Implement Task 45** (Enhanced Itinerary)
   - Update itinerary page with multiple views
   - Implement PDF export
   - Write property tests
   - Write unit tests

5. **Implement Task 46** (Guest Content API Routes)
   - Create all guest-facing API endpoints
   - Ensure RLS enforcement
   - Write integration tests

6. **Complete Task 47** (Checkpoint)
   - Run full test suite
   - Create completion document
   - Verify all requirements met

## Estimated Effort

- Task 42 completion (tests): 2-3 hours
- Task 43 (RSVP functionality): 4-6 hours
- Task 44 (RSVP API routes): 3-4 hours
- Task 45 (Enhanced itinerary): 5-7 hours
- Task 46 (Guest content API routes): 4-5 hours
- Task 47 (Checkpoint): 1-2 hours

**Total: 19-27 hours**

## Files Created

1. `app/guest/activities/page.tsx` - Activities list page
2. `components/guest/ActivityCard.tsx` - Activity card component
3. `components/guest/EventCard.tsx` - Event card component (bonus)
4. `PHASE_9_TASKS_42_47_PROGRESS.md` - This progress document

## Files Pending

### Task 42
- `app/guest/activities/page.test.tsx`
- `components/guest/ActivityCard.test.tsx`

### Task 43
- `components/guest/RSVPForm.tsx`
- `__tests__/property/rsvpDeadlineEnforcement.property.test.ts`
- `components/guest/RSVPForm.test.tsx`

### Task 44
- `app/api/guest/rsvps/route.ts`
- `app/api/guest/rsvps/[id]/route.ts`
- `app/api/guest/rsvps/summary/route.ts`
- `__tests__/integration/guestRsvpApi.integration.test.ts`

### Task 45
- `app/guest/itinerary/page.tsx` (update existing)
- `components/guest/ItineraryViewer.tsx` (create or update)
- `app/api/guest/itinerary/pdf/route.ts`
- `__tests__/property/itineraryChronologicalOrdering.property.test.ts`
- `__tests__/property/itineraryRsvpFiltering.property.test.ts`
- `app/guest/itinerary/page.test.tsx`
- `components/guest/ItineraryViewer.test.tsx`

### Task 46
- `app/api/guest/content-pages/route.ts`
- `app/api/guest/content-pages/[slug]/route.ts`
- `app/api/guest/events/route.ts`
- `app/api/guest/events/[slug]/route.ts`
- `app/api/guest/activities/route.ts`
- `app/api/guest/activities/[slug]/route.ts`
- `app/api/guest/itinerary/route.ts`
- `__tests__/integration/guestContentApi.integration.test.ts`

### Task 47
- `PHASE_9_COMPLETE.md`

## Status Summary

- ✅ Task 42.1: Complete
- ✅ Task 42.2: Complete
- ⏳ Task 42.3: Pending (tests)
- ⏳ Task 43: Not started
- ⏳ Task 44: Not started
- ⏳ Task 45: Not started
- ⏳ Task 46: Not started
- ⏳ Task 47: Not started

**Overall Progress: ~15% complete (2 of 13 subtasks)**
