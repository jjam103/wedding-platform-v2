# Backend Integration Requirements - Based on Previous Version

**Date:** January 27, 2026  
**Purpose:** Document missing backend functionality based on previous version screenshots

## Overview

The current system has:
- ✅ Complete backend services (17 services)
- ✅ Modern admin UI components
- ❌ **Missing: Integration between UI and backend services**

This document defines requirements to restore functionality from the previous version.

## Screenshot Analysis

### Screenshot 1: Events Management
**Current State:** Basic event page exists  
**Missing Functionality:**
1. Event listing with full metadata display
2. Collapsible "Add New Event" form
3. Event slug generation and display
4. Event status indicator (active/inactive)
5. "Manage Sections" functionality (CMS integration)
6. View event details page
7. Edit event inline or modal
8. Delete event with confirmation

### Screenshot 6: Content Pages Management
**Current State:** No content pages management exists  
**Missing Functionality:**
1. Content pages listing with metadata
2. Page slug display (e.g., /test)
3. Draft/Published status indicator
4. "Add New Content Page" collapsible form
5. Actions: View, Manage Sections, Edit, Delete
6. "Back to Guest View" navigation

### Screenshot 7: Home Page Content Editor
**Current State:** No home page editor exists  
**Missing Functionality:**
1. Home page content management interface
2. Wedding title input field
3. Wedding subtitle input field
4. Welcome message textarea
5. Hero image URL input
6. Legacy page sections management
7. Save/publish functionality

### Additional Missing: Locations Management
**Current State:** No locations management exists  
**Missing Functionality:**
1. Locations listing page
2. Hierarchical location relationships (country > region > city > venue)
3. Add/Edit/Delete locations
4. Location selection in events, activities, accommodations
5. Location details (address, coordinates, description)

### Screenshot 2: Activities Management
**Current State:** Basic activity page exists  
**Missing Functionality:**
1. Activity type filtering dropdown
2. Activity listing with date/time display
3. Attendee count display (from RSVPs)
4. Activity type badges (ceremony, reception, meal, transport, activity)
5. Collapsible "Add New Activity" form
6. "Manage Sections" functionality (CMS integration)
7. View activity details page
8. Edit activity inline or modal
9. Delete activity with confirmation

### Screenshot 3: Guest Management
**Current State:** Basic guest page exists  
**Missing Functionality:**
1. **Advanced Filtering System:**
   - RSVP Status filter (single select dropdown)
   - Activity filter (multi-select dropdown)
   - Transportation filter (multi-select dropdown)
   - Age Group filter (single select dropdown)
   - Airport filter (multi-select dropdown)
   - Group By functionality (no grouping, by group, by RSVP status, etc.)

2. **Guest Card Display:**
   - Email address display
   - Group membership badges (e.g., "Andy Jacob's", "wedding party", "adult")
   - Expandable RSVP Management section
   - Activities dropdown (expandable list)
   - Events dropdown (expandable list)

3. **Bulk Operations:**
   - CSV Export button (green)
   - CSV Import button (blue)
   - Checkbox selection for bulk actions

4. **Guest Actions:**
   - Edit button (opens modal or inline edit)
   - Delete button (with confirmation)

### Screenshot 4: Accommodations Management
**Current State:** No accommodation page exists  
**Missing Functionality:**
1. Accommodation listing page
2. Accommodation cards with:
   - Name and location
   - Check-in and check-out dates
   - Description text
3. "Add Accommodation" button
4. Actions per accommodation:
   - View details
   - Manage Sections (CMS integration)
   - Room Types management
   - Edit
   - Delete
5. "Back to Guest View" navigation button

### Screenshot 5: Budget Dashboard
**Current State:** Basic budget page exists  
**Missing Functionality:**
1. **Real-time Budget Overview Cards:**
   - Total Estimated Cost (blue card)
   - Host Contribution (green card)
   - Guest Payments (orange card)
   - Balance Due (red card)
   - Each card shows calculation details below amount

2. **Vendor Payment Tracking:**
   - List of vendors with payment details
   - Payment status display (UNPAID, PARTIAL, PAID)
   - Total, Paid, and Balance amounts per vendor
   - "Update Payment" button per vendor

3. **Individual Guest Subsidies:**
   - Section showing per-guest subsidy calculations
   - (Not fully visible in screenshot)

## Detailed Requirements by Feature

### 1. Content Management System (CMS)

#### 1.1 Content Pages Management
- **Requirement:** Manage custom content pages
- **Route:** `/admin/content-pages`
- **Data Source:** `sectionsService.listPages()`
- **Display Fields:**
  - Page title
  - Page slug (URL path)
  - Status (Draft/Published badge)
- **Actions:**
  - View (navigate to guest-facing page)
  - Manage Sections (open section editor)
  - Edit (edit page metadata)
  - Delete (confirm and delete)

#### 1.2 Add New Content Page
- **Requirement:** Create custom content pages
- **API:** `POST /api/admin/content-pages`
- **Form Fields:**
  - Page title (required)
  - Page slug (auto-generated from title, editable)
  - Status (draft/published toggle)
- **Validation:** Unique slug, valid URL format
- **Success:** Add to list, show toast, collapse form

#### 1.3 Home Page Content Editor
- **Requirement:** Edit home page content
- **Route:** `/admin/home-page`
- **Data Source:** `settingsService.getHomePageContent()`
- **Form Fields:**
  - Wedding Title (text input)
  - Wedding Subtitle (text input)
  - Welcome Message (textarea)
  - Hero Image URL (text input with image preview)
  - Legacy Page Sections (section editor)
- **API:** `PUT /api/admin/settings/home-page`
- **Success:** Update content, show toast

#### 1.4 Section Editor (Manage Sections)
- **Requirement:** Rich content editor for sections
- **Component:** Modal or dedicated page
- **Features:**
  - Add/remove sections
  - Drag-and-drop section reordering
  - Two-column layout per section
  - Rich text editor per column (with formatting toolbar)
  - Photo gallery integration per column
  - Reference linking (link to other pages, events, activities)
  - Section visibility controls
  - Save draft / Publish

**Section Structure:**
```typescript
interface Section {
  id: string;
  order: number;
  columns: [
    {
      type: 'rich_text' | 'photo_gallery' | 'references';
      content: string | Photo[] | Reference[];
    },
    {
      type: 'rich_text' | 'photo_gallery' | 'references';
      content: string | Photo[] | Reference[];
    }
  ];
}
```

**Rich Text Editor:**
- Bold, italic, underline
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links
- Text alignment
- Color picker
- Image insertion

**Photo Gallery:**
- Upload multiple photos
- Drag-and-drop reordering
- Captions per photo
- Alt text for accessibility
- Delete photos

**References:**
- Link to events
- Link to activities
- Link to accommodations
- Link to other content pages
- Display as cards or list

#### 1.5 Section Integration Points
- **Events:** Each event can have sections
- **Activities:** Each activity can have sections
- **Accommodations:** Each accommodation can have sections
- **Content Pages:** Each page has sections
- **Home Page:** Home page has sections

**Implementation:**
- "Manage Sections" button on each entity
- Opens section editor modal/page
- Saves sections to entity's `content_sections` field
- Renders sections on guest-facing pages

### 2. Locations Management

#### 2.1 Locations Page
- **Requirement:** Manage hierarchical locations
- **Route:** `/admin/locations`
- **Data Source:** `locationService.list()`
- **Display:**
  - Hierarchical tree view or flat list with indentation
  - Location name
  - Location type (country, region, city, venue)
  - Parent location (if applicable)
- **Actions:**
  - Add location
  - Edit location
  - Delete location
  - View children

#### 2.2 Location Hierarchy
- **Structure:**
  - Country (e.g., Costa Rica)
    - Region (e.g., Guanacaste)
      - City (e.g., Tamarindo)
        - Venue (e.g., Hotel Fermata)

**Data Model:**
```typescript
interface Location {
  id: string;
  name: string;
  type: 'country' | 'region' | 'city' | 'venue';
  parentId: string | null;
  address?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
}
```

#### 2.3 Add/Edit Location Form
- **Form Fields:**
  - Location name (required)
  - Location type (dropdown)
  - Parent location (dropdown, filtered by type)
  - Address (text input)
  - Coordinates (lat/lng inputs or map picker)
  - Description (textarea)
- **Validation:**
  - Unique name within parent
  - Valid hierarchy (city must have region parent, etc.)
- **API:**
  - `POST /api/admin/locations` (create)
  - `PUT /api/admin/locations/[id]` (update)

#### 2.4 Location Selection in Forms
- **Integration Points:**
  - Event creation/edit: Select location
  - Activity creation/edit: Select location
  - Accommodation creation/edit: Select location
  - Vendor creation/edit: Select location (optional)

**Location Dropdown:**
- Hierarchical dropdown showing full path
- Example: "Costa Rica > Guanacaste > Tamarindo > Hotel Fermata"
- Search/filter functionality
- "Add New Location" quick action

### 3. Events Management Integration

#### 1.1 Event Listing
- **Requirement:** Display all events with metadata
- **Data Source:** `eventService.list()`
- **Display Fields:**
  - Event name (title)
  - Event slug (URL-friendly identifier)
  - Event date (formatted)
  - Event status (active/inactive badge)
- **Actions:**
  - View (navigate to event details page)
  - Manage Sections (open CMS editor)
  - Edit (open edit modal)
  - Delete (confirm and delete)

#### 1.2 Add New Event Form
- **Requirement:** Collapsible form to create events
- **API Endpoint:** `POST /api/admin/events`
- **Form Fields:**
  - Event name (required)
  - Event date (required)
  - Event time (optional)
  - Event location (dropdown from locations)
  - Event description (rich text)
  - Event status (active/inactive toggle)
  - Visibility settings (guest types)
- **Validation:** Use `createEventSchema` from schemas
- **Success:** Add to list, show toast, collapse form

#### 1.3 Event Details Page
- **Requirement:** Full event details view
- **Route:** `/admin/events/[id]`
- **Data Source:** `eventService.get(id)`
- **Display:**
  - All event metadata
  - Associated activities list
  - RSVP statistics
  - Content sections (if any)
- **Actions:**
  - Edit event
  - Manage sections
  - Add activity
  - Delete event

### 2. Activities Management Integration

#### 2.1 Activity Listing with Filtering
- **Requirement:** Display activities with type filter
- **Data Source:** `activityService.list({ type: selectedType })`
- **Filter Options:**
  - All Types
  - Ceremony
  - Reception
  - Meal
  - Transport
  - Activity
  - Custom types
- **Display Fields:**
  - Activity name
  - Date and time
  - Attendee count (from RSVPs)
  - Activity type badge
- **Actions:**
  - View
  - Manage Sections
  - Edit
  - Delete

#### 2.2 Add New Activity Form
- **Requirement:** Collapsible form to create activities
- **API Endpoint:** `POST /api/admin/activities`
- **Form Fields:**
  - Activity name (required)
  - Activity type (dropdown)
  - Date and time (required)
  - Location (dropdown)
  - Capacity (number)
  - Cost per person (number)
  - Host subsidy (number)
  - Description (rich text)
  - Adults only (checkbox)
  - Plus ones allowed (checkbox)
  - Parent event (optional dropdown)
- **Validation:** Use `createActivitySchema`
- **Success:** Add to list, show toast, collapse form

#### 2.3 Activity Details Page
- **Requirement:** Full activity details view
- **Route:** `/admin/activities/[id]`
- **Data Source:** `activityService.get(id)`
- **Display:**
  - All activity metadata
  - Capacity utilization (current/max)
  - RSVP list
  - Cost breakdown
  - Content sections
- **Actions:**
  - Edit activity
  - Manage sections
  - View RSVPs
  - Delete activity

### 3. Guest Management Integration

#### 3.1 Advanced Filtering System
- **Requirement:** Multi-dimensional guest filtering
- **Implementation:**
  - State management for all filter values
  - API call with filter parameters: `guestService.list({ filters })`
  - URL state persistence for filters
  - "Hide Filters" toggle to collapse filter panel

**Filter Specifications:**

**RSVP Status Filter (Single Select):**
- Options: All RSVP Status, Attending, Declined, Maybe, Pending
- API Parameter: `rsvpStatus`

**Activity Filter (Multi-Select):**
- Options: All Activity, [list of activities from activityService]
- API Parameter: `activityIds[]`
- Display: Dropdown with checkboxes

**Transportation Filter (Multi-Select):**
- Options: All Transportation, SJO, LIR, Other, None
- API Parameter: `airports[]`

**Age Group Filter (Single Select):**
- Options: All Age Group, Adult, Child, Senior
- API Parameter: `ageType`

**Airport Filter (Multi-Select):**
- Options: All Airport, SJO, LIR, Other
- API Parameter: `airports[]`

**Group By:**
- Options: No Grouping, By Group, By RSVP Status, By Age Type, By Airport
- Implementation: Client-side grouping after fetch

#### 3.2 Guest Card Display
- **Requirement:** Rich guest information cards
- **Data Source:** `guestService.list({ filters })`
- **Display Components:**

**Guest Header:**
- Checkbox for selection
- Guest name (first + last)
- Email address (with icon)
- Group membership badges (group name, guest type, age type)

**RSVP Management Section (Expandable):**
- "Activities" dropdown
  - List of all activities
  - RSVP status per activity (attending/declined/maybe/pending)
  - Dietary restrictions display
  - Quick RSVP toggle buttons
- "Events" dropdown
  - List of all events
  - RSVP status per event
  - Quick RSVP toggle buttons

**Actions:**
- Edit button (opens FormModal with guest data)
- Delete button (opens ConfirmDialog)

#### 3.3 CSV Import/Export
- **Requirement:** Bulk guest data operations
- **Export:**
  - Button: "Export CSV" (green)
  - API: `GET /api/admin/guests/export`
  - Service: `guestService.exportToCSV()`
  - Format: All guest fields + RSVP data
  - Filename: `guests-{date}.csv`

- **Import:**
  - Button: "Import CSV" (blue)
  - Opens file picker
  - API: `POST /api/admin/guests/import`
  - Service: `guestService.importFromCSV(file)`
  - Validation: Schema validation per row
  - Error handling: Show errors per row
  - Success: Show count of imported guests

#### 3.4 Guest Edit Modal
- **Requirement:** Edit guest information
- **Component:** FormModal with DynamicForm
- **API:** `PUT /api/admin/guests/[id]`
- **Form Fields:**
  - First name
  - Last name
  - Email
  - Phone
  - Age type (dropdown)
  - Guest type (dropdown)
  - Group (dropdown)
  - Dietary restrictions (textarea)
- **Validation:** Use `updateGuestSchema`
- **Success:** Update list, show toast, close modal

### 4. Accommodations Management

#### 4.1 Accommodations Page
- **Requirement:** New page for accommodation management
- **Route:** `/admin/accommodations`
- **Data Source:** `accommodationService.list()`
- **Layout:**
  - Page header with "Add Accommodation" button
  - List of accommodation cards
  - "Back to Guest View" button (if navigated from guest context)

#### 4.2 Accommodation Card Display
- **Display Fields:**
  - Accommodation name (title)
  - Location (subtitle)
  - Check-in date (formatted)
  - Check-out date (formatted)
  - Description text (truncated)
- **Actions:**
  - View (navigate to details page)
  - Manage Sections (CMS editor)
  - Room Types (manage room types)
  - Edit (open edit modal)
  - Delete (confirm and delete)

#### 4.3 Add Accommodation Form
- **Requirement:** Modal or page to create accommodation
- **API:** `POST /api/admin/accommodations`
- **Form Fields:**
  - Name (required)
  - Location (dropdown from locations)
  - Check-in date (required)
  - Check-out date (required)
  - Description (rich text)
  - Cost per night (number)
  - Host subsidy (number)
  - Total rooms (number)
- **Validation:** Use `createAccommodationSchema`
- **Success:** Add to list, show toast

#### 4.4 Room Types Management
- **Requirement:** Manage room types for accommodation
- **Route:** `/admin/accommodations/[id]/room-types`
- **Data Source:** `accommodationService.getRoomTypes(accommodationId)`
- **Features:**
  - List room types
  - Add room type
  - Edit room type
  - Delete room type
  - Assign guests to rooms

#### 4.5 Accommodation Details Page
- **Route:** `/admin/accommodations/[id]`
- **Data Source:** `accommodationService.get(id)`
- **Display:**
  - All accommodation metadata
  - Room types list
  - Guest assignments
  - Occupancy statistics
  - Cost breakdown
  - Content sections
- **Actions:**
  - Edit accommodation
  - Manage sections
  - Manage room types
  - Delete accommodation

### 5. Budget Dashboard Integration

#### 5.1 Real-time Budget Overview
- **Requirement:** Live budget calculations
- **Data Source:** `budgetService.calculateTotals()`
- **Cards:**

**Total Estimated Cost (Blue):**
- Amount: Sum of all costs (activities + vendors + rooms)
- Subtitle: "All activities + vendors + rooms"
- Calculation: Real-time from database

**Host Contribution (Green):**
- Amount: Sum of all host subsidies
- Subtitle: "Subsidies + covered items"
- Calculation: Sum of activity subsidies + vendor subsidies + room subsidies

**Guest Payments (Orange):**
- Amount: Expected payments from all guests
- Subtitle: "Expected from all guests"
- Calculation: Total cost - host contribution

**Balance Due (Red):**
- Amount: Unpaid vendor amounts
- Subtitle: "Unpaid vendor amounts"
- Calculation: Sum of vendor balances where status != 'paid'

#### 5.2 Vendor Payment Tracking
- **Requirement:** Track vendor payments
- **Data Source:** `vendorService.list()` with payment details
- **Display:**
  - Vendor name
  - Total amount
  - Paid amount
  - Balance amount
  - Payment status badge (UNPAID/PARTIAL/PAID)
  - "Update Payment" button

**Update Payment Modal:**
- Current payment amount input
- Payment date picker
- Payment method dropdown
- Notes textarea
- API: `PUT /api/admin/vendors/[id]/payment`
- Success: Update display, recalculate budget, show toast

#### 5.3 Individual Guest Subsidies
- **Requirement:** Show per-guest subsidy breakdown
- **Data Source:** `budgetService.getGuestSubsidies()`
- **Display:**
  - Guest name
  - Activities subsidized
  - Accommodation subsidized
  - Total subsidy amount
  - Guest payment amount
- **Calculation:** Per-guest cost - per-guest subsidy

## API Endpoints Required

### Content Management
- `GET /api/admin/content-pages` - List content pages
- `POST /api/admin/content-pages` - Create content page
- `GET /api/admin/content-pages/[id]` - Get page details
- `PUT /api/admin/content-pages/[id]` - Update page
- `DELETE /api/admin/content-pages/[id]` - Delete page
- `GET /api/admin/content-pages/[id]/sections` - Get page sections
- `PUT /api/admin/content-pages/[id]/sections` - Update page sections
- `GET /api/admin/settings/home-page` - Get home page content
- `PUT /api/admin/settings/home-page` - Update home page content

### Sections (Generic)
- `GET /api/admin/sections` - List sections for entity
- `POST /api/admin/sections` - Create section
- `PUT /api/admin/sections/[id]` - Update section
- `DELETE /api/admin/sections/[id]` - Delete section
- `PUT /api/admin/sections/reorder` - Reorder sections

### Locations
- `GET /api/admin/locations` - List locations (hierarchical)
- `POST /api/admin/locations` - Create location
- `GET /api/admin/locations/[id]` - Get location details
- `PUT /api/admin/locations/[id]` - Update location
- `DELETE /api/admin/locations/[id]` - Delete location
- `GET /api/admin/locations/tree` - Get location hierarchy tree

### Events
- `GET /api/admin/events` - List events with filters
- `POST /api/admin/events` - Create event
- `GET /api/admin/events/[id]` - Get event details
- `PUT /api/admin/events/[id]` - Update event
- `DELETE /api/admin/events/[id]` - Delete event

### Activities
- `GET /api/admin/activities` - List activities with filters
- `POST /api/admin/activities` - Create activity
- `GET /api/admin/activities/[id]` - Get activity details
- `PUT /api/admin/activities/[id]` - Update activity
- `DELETE /api/admin/activities/[id]` - Delete activity

### Guests
- `GET /api/admin/guests` - List guests with advanced filters
- `POST /api/admin/guests` - Create guest
- `GET /api/admin/guests/[id]` - Get guest details
- `PUT /api/admin/guests/[id]` - Update guest
- `DELETE /api/admin/guests/[id]` - Delete guest
- `GET /api/admin/guests/export` - Export guests to CSV
- `POST /api/admin/guests/import` - Import guests from CSV
- `PUT /api/admin/guests/[id]/rsvp` - Update guest RSVP

### Accommodations
- `GET /api/admin/accommodations` - List accommodations
- `POST /api/admin/accommodations` - Create accommodation
- `GET /api/admin/accommodations/[id]` - Get accommodation details
- `PUT /api/admin/accommodations/[id]` - Update accommodation
- `DELETE /api/admin/accommodations/[id]` - Delete accommodation
- `GET /api/admin/accommodations/[id]/room-types` - List room types
- `POST /api/admin/accommodations/[id]/room-types` - Create room type
- `PUT /api/admin/accommodations/[id]/room-types/[typeId]` - Update room type
- `DELETE /api/admin/accommodations/[id]/room-types/[typeId]` - Delete room type

### Budget
- `GET /api/admin/budget/overview` - Get budget overview
- `GET /api/admin/budget/vendors` - Get vendor payment tracking
- `PUT /api/admin/vendors/[id]/payment` - Update vendor payment
- `GET /api/admin/budget/guest-subsidies` - Get per-guest subsidies

### Vendors
- `GET /api/admin/vendors` - List vendors
- `POST /api/admin/vendors` - Create vendor
- `GET /api/admin/vendors/[id]` - Get vendor details
- `PUT /api/admin/vendors/[id]` - Update vendor
- `DELETE /api/admin/vendors/[id]` - Delete vendor

## Implementation Priority

### Phase 1: Core Infrastructure (HIGH)
1. **Locations Management** - Required for all other features
2. **Content Pages Management** - Foundation for CMS
3. **Section Editor Component** - Reusable across all entities
4. **Home Page Editor** - Guest-facing landing page

### Phase 2: Core CRUD Operations (HIGH)
1. Events listing and CRUD with location selection
2. Activities listing and CRUD with location selection
3. Guests listing and CRUD
4. Basic filtering for guests

### Phase 3: CMS Integration (HIGH)
1. "Manage Sections" integration for events
2. "Manage Sections" integration for activities
3. "Manage Sections" integration for accommodations
4. "Manage Sections" integration for content pages
5. Guest-facing section rendering

### Phase 4: Advanced Features (MEDIUM)
1. Guest advanced filtering system
2. CSV import/export
3. RSVP management from guest cards
4. Budget dashboard integration

### Phase 5: Accommodations & Logistics (MEDIUM)
1. Accommodations page and CRUD
2. Room types management
3. Guest room assignments
4. Vendor payment tracking

## Technical Requirements

### State Management
- Use React hooks (useState, useEffect, useCallback)
- URL state persistence for filters
- Optimistic UI updates where appropriate

### Error Handling
- Toast notifications for success/error
- Form validation with Zod schemas
- API error handling with Result<T> pattern

### Loading States
- Skeleton loaders for lists
- Loading spinners for actions
- Disable buttons during operations

### Real-time Updates
- Supabase subscriptions for live data
- Auto-refresh on data changes
- Optimistic updates with rollback on error

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- ARIA labels

### Performance
- Pagination for large lists
- Debounced search/filter
- Lazy loading for images
- Memoization for expensive calculations

## Success Criteria

1. ✅ All CRUD operations working for events, activities, guests, accommodations
2. ✅ Advanced filtering system functional
3. ✅ CSV import/export working
4. ✅ Budget dashboard showing real-time calculations
5. ✅ Vendor payment tracking functional
6. ✅ All API endpoints implemented and tested
7. ✅ UI matches or exceeds previous version functionality
8. ✅ All tests passing (unit, integration, E2E)
9. ✅ Accessibility compliance maintained
10. ✅ Performance benchmarks met

## Next Steps

1. Create "Admin Backend Integration" spec with detailed tasks
2. Implement API routes for all endpoints
3. Wire up admin pages to backend services
4. Add advanced filtering system
5. Implement CSV import/export
6. Build budget dashboard integration
7. Create accommodations management pages
8. Test end-to-end workflows
9. Performance optimization
10. Documentation

---

**Estimated Timeline:** 3-4 weeks for complete implementation
**Priority:** HIGH - Required for production readiness
