# Manual Testing Round 4 - Remaining Bug Fixes

## Overview

This spec addresses the remaining 8 critical issues discovered during comprehensive manual testing of the wedding management platform. These issues block core functionality and need immediate resolution.

## Background

**Context**: Round 4 manual testing revealed 14 issues total. 4 have been fixed:
- ✅ Photos page validation error
- ✅ Transportation RLS error  
- ✅ Vendors events API error
- ✅ Admin users page missing

**Remaining**: 8 critical issues that block core features

## User Stories

### US-1: Photo Display and B2 Storage
**As an** admin user  
**I want** photos to display correctly with working B2 storage  
**So that** I can manage and view wedding photos

**Acceptance Criteria**:
1.1. Photos display as images, not black boxes  
1.2. B2 storage health check returns "healthy" status  
1.3. Photo URLs are generated correctly with CDN domain  
1.4. B2 client initializes without errors  
1.5. Uploaded photos are accessible via CDN

### US-2: Vendor Booking Management
**As an** admin user  
**I want** to create and edit vendor bookings without errors  
**So that** I can track vendor assignments to activities/events

**Acceptance Criteria**:
2.1. Vendor booking form saves without validation errors  
2.2. Activity and event dropdowns display correctly (no duplicates)  
2.3. Total cost is calculated automatically based on pricing model  
2.4. Guest count field is only required for per-guest pricing  
2.5. Host subsidy defaults to 0 if not provided  
2.6. Discount schedule by guest type is available (optional)

### US-3: RSVP Management
**As an** admin user  
**I want** to view and edit guest RSVPs inline  
**So that** I can manage attendance without errors

**Acceptance Criteria**:
3.1. RSVP expansion loads activity RSVPs without errors  
3.2. RSVP status toggle works for all statuses  
3.3. Guest count and dietary restrictions save correctly  
3.4. Capacity information displays accurately  
3.5. API returns proper error messages for failures

### US-4: Transportation Feature
**As an** admin user  
**I want** the transportation page to work completely  
**So that** I can manage guest arrivals, departures, and shuttles

**Acceptance Criteria**:
4.1. Arrivals API returns guest arrival data  
4.2. Departures API returns guest departure data  
4.3. Vehicle requirements API calculates shuttle needs  
4.4. Assign shuttle API assigns guests to shuttles  
4.5. Driver sheets API generates printable sheets  
4.6. All APIs use proper authentication and RLS

### US-5: System Settings
**As an** admin user  
**I want** system settings to work without database errors  
**So that** I can configure application settings

**Acceptance Criteria**:
5.1. System settings table exists in database  
5.2. Settings page loads without "table not found" errors  
5.3. Settings can be created, read, updated, deleted  
5.4. RLS policies allow admin access  
5.5. Settings are cached for performance

### US-6: Location Management
**As an** admin user  
**I want** location dropdowns to populate correctly  
**So that** I can assign locations to events and accommodations

**Acceptance Criteria**:
6.1. Locations exist in database (seed data if needed)  
6.2. Location API returns all locations  
6.3. LocationSelector component displays locations  
6.4. Event location dropdown populates  
6.5. Accommodation location dropdown populates  
6.6. Hierarchical location relationships work

### US-7: Event Detail Page
**As a** guest user  
**I want** to view complete event details  
**So that** I can see event information and related activities

**Acceptance Criteria**:
7.1. Event detail page displays event information  
7.2. Related activities are shown  
7.3. Event sections render correctly  
7.4. Location information displays  
7.5. RSVP information is visible  
7.6. Page works with both slug and UUID URLs

### US-8: Accommodation Event Link
**As an** admin user  
**I want** to see which event an accommodation is linked to  
**So that** I can understand accommodation-event relationships

**Acceptance Criteria**:
8.1. Accommodation table shows related event  
8.2. "View Event" button navigates to event detail  
8.3. Event name displays in accommodation row  
8.4. Link works for accommodations with events  
8.5. Shows "-" for accommodations without events

## Priority

**Critical** - All 8 issues block core functionality and must be fixed before production deployment

## Dependencies

- Existing B2 service and configuration
- Existing vendor booking service
- Existing RSVP API routes (fixed in Round 3)
- Existing transportation service
- Database migrations capability
- Location service and data
- Event service with slug support
- Accommodation service

## Success Metrics

- All 8 issues resolved and verified
- No regression in previously fixed issues
- Manual testing passes for all affected features
- No console errors in browser
- All API calls return success responses

## Out of Scope

- Feature requests (inline section editor, room types navigation, draft preview)
- Performance optimizations
- UI/UX improvements beyond bug fixes
- New feature development

## Notes

- Some issues may be interconnected (e.g., B2 initialization affects photos)
- Location issue may be data-related (no locations exist) or code-related (not loading)
- RSVP error may be resolved after other API fixes
- Transportation feature is completely unimplemented (all 5 API routes missing)
