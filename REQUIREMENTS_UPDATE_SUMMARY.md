# Requirements Document Update Summary

**Date:** January 27, 2026  
**Spec:** Admin Backend Integration & CMS  
**Status:** Requirements document updated with reference lookup functionality

## Latest Changes (Reference Lookup)

### 1. Enhanced Requirement 2: Section Editor Component

**Added detailed reference lookup functionality:**
- Searchable dropdown to look up entities by name
- Support for searching: Events, Activities, Accommodations, Room Types, Content Pages
- Reference validation to ensure entities exist
- Broken reference detection with warnings
- Reference cards with entity preview (type, name, quick preview)
- Actions on reference cards: View entity, Edit entity, Remove reference
- Circular reference detection with error display

### 2. NEW Requirement 16: Reference Lookup and Search API

**Purpose:** Provide API endpoints for entity search and lookup in Section Editor

**Key Features:**
- Search across multiple entity types: events, activities, accommodations, room_types, content_pages
- Search by entity name with relevance ordering (exact matches first)
- Filter by entity type
- Return entity details: id, name, type, slug, status
- Entity preview details for reference cards
- Limit results to 20 items per entity type

**API Endpoints:**
- `GET /api/admin/references/search?q={query}&type={entity_type}` - Search entities
- `GET /api/admin/references/{entity_type}/{id}` - Get entity preview details

### 3. Renumbered All Subsequent Requirements

All requirements after the new Requirement 16 have been renumbered:
- Old Requirement 16 → New Requirement 17 (Version History)
- Old Requirement 17 → New Requirement 18 (Error Handling)
- Old Requirement 18 → New Requirement 19 (Data Integrity)
- Old Requirement 19 → New Requirement 20 (Performance)
- Old Requirement 20 → New Requirement 21 (Accessibility)
- Old Requirement 21 → New Requirement 22 (Room Types)
- Old Requirement 22 → New Requirement 23 (Vendor Booking)
- Old Requirement 23 → New Requirement 24 (Guest Edit Modal)
- Old Requirement 24 → New Requirement 25 (Section Editor Advanced)
- Old Requirement 25 → New Requirement 26 (Transportation)
- Old Requirement 26 → New Requirement 27 (Reusable Modal)
- Old Requirement 27 → New Requirement 28 (Collapsible Forms)
- Old Requirement 28 → New Requirement 29 (Navigation Reorganization)
- Old Requirement 29 → New Requirement 30 (Status Indicators)
- Old Requirement 30 → New Requirement 31 (Slug Generation)
- Old Requirement 31 → New Requirement 32 (Back to Guest View)
- Old Requirement 32 → New Requirement 33 (Photo Gallery)
- Old Requirement 33 → New Requirement 34 (Transportation UI)
- Old Requirement 34 → New Requirement 35 (Vendor-Activity Booking)

## Previous Changes Summary

### Requirement 28: Collapsible Forms Pattern (Replaces FormModal Popups)

**Previous:** Generic requirement for collapsible forms  
**Updated:** Explicitly states this **replaces the current FormModal popup pattern**

**Key Changes:**
- Added note about current implementation using FormModal popups
- Clarified that this applies to guests, events, activities, and vendors pages
- Added support for both collapsible forms AND tabbed interfaces as options
- Added criteria for maintaining form state when switching tabs
- Added visual feedback requirements

**Affected Files:**
- `app/admin/guests/page.tsx` (currently uses FormModal)
- `app/admin/events/page.tsx` (currently uses FormModal)
- `app/admin/activities/page.tsx` (currently uses FormModal)
- `app/admin/vendors/page.tsx` (currently uses FormModal)
- `components/ui/FormModal.tsx` (pattern to be replaced)

### Requirement 29: Admin Dashboard Navigation Reorganization

**Purpose:** Create a friendly admin dashboard layout with grouped navigation sections

**Key Features:**
- Logical grouping of navigation items by functional area:
  - Guest Management (Guests, Groups, RSVPs)
  - Event Planning (Events, Activities, Locations)
  - Logistics (Accommodations, Transportation, Vendors)
  - Content (Content Pages, Home Page, Photos)
  - Communication (Emails, Notifications)
  - Financial (Budget, Vendor Payments)
  - System (Settings, Audit Logs, User Management)
- Expandable/collapsible groups
- Persistent state in localStorage
- Badge support for pending items
- Quick Access section for frequently used pages
- Full keyboard navigation support

**Affected Files:**
- `components/admin/Sidebar.tsx` (current flat navigation to be enhanced)

### Enhanced Documentation

- Added "Implementation Approach" note clarifying focus on integration
- Updated introduction with key changes from current implementation

## Verification: No Duplicate Work

### Already Implemented (No New Work Needed)

✅ **Photo Management** - Complete
- Service: `services/photoService.ts`
- UI: `app/admin/photos/page.tsx`
- Gallery Settings: `services/gallerySettingsService.ts`

✅ **Transportation Management** - Complete
- Service: `services/transportationService.ts`
- Manifest generation, vehicle calculations, driver sheets all implemented

✅ **Vendor Management** - Complete
- Service: `services/vendorService.ts`
- Booking Service: `services/vendorBookingService.ts`
- Payment tracking fully implemented

### New Work Required

🔨 **CMS System** - New
- Content pages management (Requirements 1-3)
- Section editor component with reference lookup (Requirement 2)
- Home page editor (Requirement 3)

🔨 **Reference System** - New
- Reference lookup API (Requirement 16)
- Entity search across types
- Reference validation and broken link detection

🔨 **Locations Management** - New
- Hierarchical location system (Requirement 4)
- Location selection in forms

🔨 **User Management** - New
- Admin user management (Requirement 5)
- Role-based access control

🔨 **UI Integration** - New
- Wire up existing services to admin pages (Requirements 6-12)
- Advanced filtering system (Requirements 8, 14)
- CSV import/export UI (Requirement 9)
- Budget dashboard UI (Requirement 11)

🔨 **UI Pattern Changes** - New
- Replace FormModal with collapsible forms/tabs (Requirement 28)
- Reorganize sidebar navigation with grouping (Requirement 29)

🔨 **API Endpoints** - New
- RESTful endpoints for all entities (Requirement 13)
- Advanced filtering endpoints (Requirement 14)
- Section management endpoints (Requirement 15)
- Reference lookup endpoints (Requirement 16)

## Total Requirements

**37 functional requirements** covering:
- CMS functionality (Requirements 1-3)
- Core entity management (Requirements 4-12)
- API infrastructure (Requirements 13-16)
- Advanced features (Requirements 17-27)
- UI patterns (Requirements 28-29)
- Visual design (Requirements 30-32)
- Integration features (Requirements 33-35)
- Analytics and monitoring (Requirements 36-37)

## Section Editor Reference Functionality

**User Flow:**
1. Admin opens Section Editor for an entity (event, activity, accommodation, etc.)
2. Admin adds a new section with two columns
3. In a column, admin clicks "Add Reference"
4. System displays searchable dropdown with entity types
5. Admin selects entity type (e.g., "Activities")
6. Admin types search query (e.g., "beach")
7. System searches activities by name and displays results
8. Admin selects an activity from results
9. System validates the activity exists
10. System displays reference as a card with activity name and preview
11. Admin can click card to: View activity, Edit activity, or Remove reference
12. When saving, system checks for circular references and broken links

**API Integration:**
- Search: `GET /api/admin/references/search?q=beach&type=activity`
- Preview: `GET /api/admin/references/activity/123`
- Validation: `POST /api/admin/sections/validate-references`
- Circular check: `POST /api/admin/sections/check-circular-references`

## Next Steps

1. ✅ Requirements document complete and verified
2. ✅ Reference lookup functionality fully specified
3. ⏭️ Create `design.md` with:
   - Component architecture for collapsible forms/tabs
   - Grouped navigation structure and component design
   - Section editor component design with reference lookup UI
   - Reference search component design
   - API endpoint specifications
   - Integration patterns between UI and services
4. ⏭️ Create `tasks.md` with implementation plan

## User Concerns Addressed

✅ **Reference lookup in Section Editor** - Requirement 2 enhanced with detailed criteria, new Requirement 16 for API  
✅ **Search for activities, room types, etc.** - Searchable dropdown with entity type filtering  
✅ **No duplicate work** - Verified all requirements against existing implementations  
✅ **Friendly dashboard layout** - Requirement 29 for grouped navigation  
✅ **Collapsible forms instead of popups** - Requirement 28 explicitly replaces FormModal  
✅ **Clear about existing features** - "Already Implemented Features" section documents what's done  
✅ **Focused on integration** - Requirements emphasize wiring UI to existing services

---

**Ready for design phase!** 🎨

