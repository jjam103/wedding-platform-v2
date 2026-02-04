# Manual Testing Round 4 - Design Document

## Architecture Overview

This design addresses 8 critical bugs discovered in manual testing. Each issue has a specific root cause and solution approach.

## Issue 1: Photo Display and B2 Storage

### Root Cause Analysis
- B2 client may not be initialized on application startup
- Environment variables may be missing or incorrect
- CDN domain configuration may be wrong
- Photo URLs may not be generated with correct CDN path

### Technical Solution

**1.1 B2 Client Initialization**
- Add B2 initialization to application startup
- Create initialization check in photo service
- Add health check endpoint for B2 status
- Log initialization errors clearly

**1.2 Environment Variable Validation**
```typescript
Required variables:
- B2_ENDPOINT
- B2_REGION  
- B2_ACCESS_KEY_ID
- B2_SECRET_ACCESS_KEY
- B2_BUCKET_NAME
- B2_CDN_DOMAIN or CLOUDFLARE_CDN_URL
```

**1.3 Photo URL Generation**
- Ensure `generateCDNUrl()` uses correct CDN domain
- Verify photo records store correct `storage_key`
- Check photo API returns full CDN URLs

**1.4 Health Check Implementation**
- Add `/api/admin/storage/health` endpoint
- Return B2 status, last check time, error details
- Display status in admin UI

### Files to Modify
- `services/b2Service.ts` - Add initialization validation
- `app/api/admin/storage/health/route.ts` - New health check endpoint
- `app/admin/photos/page.tsx` - Display storage health status
- `services/photoService.ts` - Ensure B2 initialization before upload



## Issue 2: Vendor Booking Management

### Root Cause Analysis
- Duplicate dropdowns appearing (likely rendering issue)
- Total cost is required input instead of calculated field
- Validation errors on save
- Missing discount schedule functionality

### Technical Solution

**2.1 Fix Duplicate Dropdowns**
- Review `app/admin/vendors/page.tsx` booking form fields
- Ensure activity/event dropdowns render once
- Check for duplicate field definitions in `bookingFormFields`

**2.2 Auto-Calculate Total Cost**
- Remove `totalCost` as required input field
- Calculate based on: `pricingModel`, `baseCost`, `guestCount`
- Formula: 
  - Flat rate: `totalCost = baseCost`
  - Per guest: `totalCost = baseCost * guestCount`
- Display as read-only calculated field

**2.3 Fix Validation Errors**
- Make `guestCount` conditionally required (only for per-guest pricing)
- Make `activityId` and `eventId` truly optional
- Ensure `hostSubsidy` defaults to 0
- Update `createVendorBookingSchema` and `updateVendorBookingSchema`

**2.4 Discount Schedule (Optional Enhancement)**
- Add `discountSchedule` JSON field to vendor_bookings table
- Structure: `{ adult: 100, child: 50, senior: 75 }`
- Calculate total based on guest types if schedule exists
- Add UI for discount schedule management

### Files to Modify
- `app/admin/vendors/page.tsx` - Fix duplicate dropdowns, auto-calculate cost
- `schemas/vendorBookingSchemas.ts` - Update validation rules
- `services/vendorBookingService.ts` - Add cost calculation logic
- `supabase/migrations/XXX_add_discount_schedule.sql` - Optional enhancement



## Issue 3: RSVP Management

### Root Cause Analysis
- RSVP API may be returning errors after Round 3 cookie fixes
- Error message: "Failed to fetch activity RSVPs"
- Location: `InlineRSVPEditor.tsx:87:15`

### Technical Solution

**3.1 Verify API Endpoint**
- Check `/api/admin/guests/[id]/rsvps` route works
- Verify authentication is correct (uses `@supabase/ssr` pattern)
- Test API response format matches component expectations

**3.2 Error Handling**
- Add detailed error logging in API route
- Return specific error codes for different failure types
- Display user-friendly error messages in component

**3.3 Data Format Validation**
- Ensure API returns expected structure:
  ```typescript
  {
    success: true,
    data: {
      activities: RSVPItem[],
      events: RSVPItem[],
      accommodations: RSVPItem[]
    }
  }
  ```
- Verify all required fields are present
- Handle null/undefined values gracefully

**3.4 Component Robustness**
- Add null checks for nested data
- Handle empty arrays gracefully
- Show loading state during fetch
- Display specific error messages

### Files to Modify
- `app/api/admin/guests/[id]/rsvps/route.ts` - Add error logging, verify response format
- `components/admin/InlineRSVPEditor.tsx` - Improve error handling
- Test manually with browser network tab to see actual error



## Issue 4: Transportation Feature

### Root Cause Analysis
- Transportation page exists but all 5 API routes are missing
- Feature was designed but never fully implemented
- RLS error was fixed but APIs don't exist

### Technical Solution

**4.1 Arrivals API**
```typescript
GET /api/admin/transportation/arrivals?date=YYYY-MM-DD&airport=SJO
Returns: List of guests arriving on specified date at specified airport
```

**4.2 Departures API**
```typescript
GET /api/admin/transportation/departures?date=YYYY-MM-DD&airport=LIR
Returns: List of guests departing on specified date at specified airport
```

**4.3 Vehicle Requirements API**
```typescript
GET /api/admin/transportation/vehicle-requirements?date=YYYY-MM-DD
Returns: Calculated shuttle/vehicle needs based on guest count
```

**4.4 Assign Shuttle API**
```typescript
POST /api/admin/transportation/assign-shuttle
Body: { guestIds: string[], shuttleId: string, date: string }
Returns: Success/failure of shuttle assignment
```

**4.5 Driver Sheets API**
```typescript
GET /api/admin/transportation/driver-sheets?shuttleId=string&date=YYYY-MM-DD
Returns: Printable driver sheet with guest details, pickup/dropoff locations
```

**Implementation Notes**:
- All APIs use service role key (already fixed for arrivals/departures)
- Query `guests` table for flight information
- Filter by `arrival_date`, `departure_date`, `arrival_airport`, `departure_airport`
- Calculate vehicle requirements based on guest count and vehicle capacity
- Store shuttle assignments in `guest_shuttles` table (may need migration)

### Files to Create
- `app/api/admin/transportation/vehicle-requirements/route.ts`
- `app/api/admin/transportation/assign-shuttle/route.ts`
- `app/api/admin/transportation/driver-sheets/route.ts`

### Files to Verify
- `app/api/admin/transportation/arrivals/route.ts` - Already fixed
- `app/api/admin/transportation/departures/route.ts` - Already fixed



## Issue 5: System Settings

### Root Cause Analysis
- Error: "Could not find the table 'public.system_settings' in the schema cache"
- Table doesn't exist in database
- Settings service may reference non-existent table

### Technical Solution

**5.1 Database Migration**
Create `system_settings` table:
```sql
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (get_user_role() = 'admin');
```

**5.2 Settings Service**
- Verify `services/settingsService.ts` uses correct table name
- Add CRUD operations for settings
- Implement caching for frequently accessed settings
- Add validation for setting keys and values

**5.3 Settings Page**
- Update `app/admin/settings/page.tsx` to use settings service
- Display settings by category
- Allow editing of setting values
- Show setting descriptions

### Files to Create
- `supabase/migrations/XXX_create_system_settings_table.sql`

### Files to Modify
- `services/settingsService.ts` - Verify table name, add CRUD operations
- `app/admin/settings/page.tsx` - Update to use settings service



## Issue 6: Location Management

### Root Cause Analysis
- User reports "No location exists"
- Location dropdowns are empty in events and accommodations
- Could be: (a) no data in database, or (b) data exists but not loading

### Technical Solution

**6.1 Verify Location Data**
- Check if `locations` table has data
- Query database directly to confirm
- If empty, create seed data migration

**6.2 Location API Verification**
- Test `/api/admin/locations` endpoint
- Verify it returns all locations
- Check RLS policies allow read access
- Ensure proper response format

**6.3 LocationSelector Component**
- Verify component receives locations prop
- Check if locations are filtered/hidden
- Ensure hierarchical display works
- Add loading state and error handling

**6.4 Seed Data (if needed)**
```sql
INSERT INTO public.locations (name, type, parent_location_id) VALUES
  ('Costa Rica', 'country', NULL),
  ('San José', 'city', (SELECT id FROM locations WHERE name = 'Costa Rica')),
  ('Guanacaste', 'region', (SELECT id FROM locations WHERE name = 'Costa Rica')),
  ('Wedding Venue', 'venue', (SELECT id FROM locations WHERE name = 'Guanacaste'));
```

**6.5 Event/Accommodation Pages**
- Verify `fetchLocations()` is called on mount
- Check if locations state is populated
- Ensure LocationSelector receives locations prop
- Add console logging to debug data flow

### Files to Modify
- `app/admin/events/page.tsx` - Debug location loading
- `app/admin/accommodations/page.tsx` - Debug location loading
- `components/admin/LocationSelector.tsx` - Add error handling
- `supabase/migrations/XXX_seed_locations.sql` - Create if needed



## Issue 7: Event Detail Page

### Root Cause Analysis
- User reports event detail page shows no content
- User mentions "there's a related activity" but it's not showing
- Page may not be loading related activities
- Sections may not be rendering

### Technical Solution

**7.1 Verify Event Data Loading**
- Check if `getBySlug()` returns complete event data
- Verify event has all required fields
- Test with both slug and UUID URLs
- Add error logging for failed queries

**7.2 Related Activities Display**
- Event detail page doesn't currently show related activities
- Need to query activities linked to this event
- Add activities section to page
- Display activity cards with RSVP buttons

**7.3 Sections Rendering**
- Verify `listSections()` returns sections for event
- Check if sections have content
- Ensure SectionRenderer displays correctly
- Handle empty sections gracefully

**7.4 Location Information**
- Currently shows "Location details" placeholder
- Need to fetch and display actual location
- Join with locations table or fetch separately
- Display location name and address

**Implementation**:
```typescript
// Add to event detail page
const activitiesResult = await listActivities({ eventId: event.id });
const activities = activitiesResult.success ? activitiesResult.data : [];

// Fetch location if locationId exists
let location = null;
if (event.locationId) {
  const locationResult = await getLocation(event.locationId);
  location = locationResult.success ? locationResult.data : null;
}
```

### Files to Modify
- `app/event/[slug]/page.tsx` - Add related activities, fix location display
- `services/activityService.ts` - Add `listByEvent()` method if missing
- `services/locationService.ts` - Verify `get()` method exists



## Issue 8: Accommodation Event Link

### Root Cause Analysis
- Accommodations table doesn't show related event
- No "View Event" button or event name display
- Database has `event_id` foreign key but UI doesn't use it

### Technical Solution

**8.1 Add Event Column to Table**
- Add `eventId` column to accommodations DataTable
- Display event name (fetch from events)
- Show "-" if no event linked

**8.2 Add View Event Button**
- Add "View Event" button in actions column
- Button navigates to `/event/[slug]`
- Only show button if event exists
- Use event slug for navigation

**8.3 Fetch Event Data**
- When loading accommodations, include event data
- Either join in query or fetch separately
- Store event names in state
- Map event IDs to names for display

**Implementation**:
```typescript
// In accommodations page
const columns: ColumnDef<Accommodation>[] = [
  // ... existing columns
  {
    key: 'eventId',
    label: 'Event',
    sortable: true,
    render: (value) => {
      if (!value) return '-';
      const event = events.find(e => e.id === value);
      return event?.name || '-';
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    render: (_, row) => {
      const accommodation = row as Accommodation;
      return (
        <div className="flex gap-2">
          {accommodation.eventId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const event = events.find(e => e.id === accommodation.eventId);
                if (event?.slug) {
                  router.push(`/event/${event.slug}`);
                }
              }}
            >
              View Event
            </Button>
          )}
        </div>
      );
    },
  },
];
```

### Files to Modify
- `app/admin/accommodations/page.tsx` - Add event column and view button
- Fetch events on page load
- Map event IDs to names



## Testing Strategy

### Manual Testing Checklist

**Issue 1: Photos & B2 Storage**
- [ ] Navigate to `/admin/photos`
- [ ] Verify photos display as images (not black boxes)
- [ ] Check storage health shows "healthy"
- [ ] Upload new photo and verify it displays
- [ ] Check browser console for B2 errors

**Issue 2: Vendor Bookings**
- [ ] Navigate to `/admin/vendors`
- [ ] Expand "Vendor Bookings" section
- [ ] Click "Add Booking"
- [ ] Verify activity dropdown shows no duplicates
- [ ] Verify event dropdown shows no duplicates
- [ ] Select flat rate pricing - verify total cost auto-calculates
- [ ] Select per-guest pricing - verify total cost = base * guests
- [ ] Save booking and verify no validation errors

**Issue 3: RSVP Management**
- [ ] Navigate to `/admin/guests`
- [ ] Click on a guest row
- [ ] Expand "RSVPs" section
- [ ] Verify activities, events, accommodations load
- [ ] Toggle RSVP status and verify it saves
- [ ] Update guest count and verify it saves
- [ ] Check browser console for API errors

**Issue 4: Transportation**
- [ ] Navigate to `/admin/transportation`
- [ ] Select a date
- [ ] Verify arrivals tab loads guest data
- [ ] Verify departures tab loads guest data
- [ ] Check vehicle requirements calculation
- [ ] Test shuttle assignment
- [ ] Generate driver sheet

**Issue 5: System Settings**
- [ ] Navigate to `/admin/settings`
- [ ] Verify page loads without "table not found" error
- [ ] View existing settings
- [ ] Edit a setting value
- [ ] Save and verify it persists

**Issue 6: Locations**
- [ ] Navigate to `/admin/locations`
- [ ] Verify locations exist in table
- [ ] Navigate to `/admin/events`
- [ ] Click "Add Event"
- [ ] Verify location dropdown populates
- [ ] Navigate to `/admin/accommodations`
- [ ] Click "Add Accommodation"
- [ ] Verify location dropdown populates

**Issue 7: Event Detail Page**
- [ ] Navigate to `/admin/events`
- [ ] Click "View" button on an event
- [ ] Verify event details display
- [ ] Verify related activities show
- [ ] Verify location displays correctly
- [ ] Verify sections render
- [ ] Test with both slug and UUID URLs

**Issue 8: Accommodation Event Link**
- [ ] Navigate to `/admin/accommodations`
- [ ] Verify "Event" column shows event names
- [ ] Verify "View Event" button appears for linked accommodations
- [ ] Click "View Event" and verify navigation works
- [ ] Verify accommodations without events show "-"

### Automated Testing

**Unit Tests**:
- B2 service initialization
- Vendor booking cost calculation
- RSVP API response format
- Transportation API responses
- Settings CRUD operations
- Location data loading
- Event detail data fetching
- Accommodation event mapping

**Integration Tests**:
- B2 upload and URL generation
- Vendor booking creation with validation
- RSVP update workflow
- Transportation API endpoints
- Settings persistence
- Location hierarchy queries
- Event with activities query
- Accommodation with event query

**E2E Tests**:
- Photo upload and display workflow
- Vendor booking creation workflow
- RSVP management workflow
- Transportation management workflow
- Settings management workflow
- Location assignment workflow
- Event detail viewing workflow
- Accommodation event navigation workflow

