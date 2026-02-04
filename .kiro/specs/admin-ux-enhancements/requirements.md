# Admin UX Enhancements - Requirements

## Overview
Address remaining UX gaps and missing features in the admin dashboard to improve usability and complete the feature set.

## User Stories

### 1. Guest Email Authentication Fix
**As a** guest user  
**I want** to log in using email matching  
**So that** I can access the guest portal without authentication errors

**Acceptance Criteria:**
- Guest records have correct `auth_method` set to 'email_matching'
- Email matching authentication works for all guests
- Database migration script available to fix existing records

### 2. Home Page API Error Resolution
**As an** admin user  
**I want** the home page settings to save without errors  
**So that** I can configure the home page content

**Acceptance Criteria:**
- Home page API returns proper responses (not 500 errors)
- Settings can be created and updated successfully
- Error logging provides clear diagnostics

### 3. Home Page Inline Section Editor
**As an** admin user  
**I want** to edit sections directly on the home page  
**So that** I can quickly update content without navigating away

**Acceptance Criteria:**
- InlineSectionEditor component appears below "Manage Sections" button
- Sections can be edited inline
- Changes save immediately
- UI provides clear feedback

### 4. Auth Method Settings
**As an** admin user  
**I want** to configure the default guest authentication method  
**So that** I can choose between email matching and magic link for my event

**Acceptance Criteria:**
- System settings include `default_auth_method` option
- Settings page allows toggling between 'email_matching' and 'magic_link'
- New guests inherit the default auth method
- Existing guests can be bulk updated

### 5. Admin Guest Portal Preview
**As an** admin user  
**I want** to preview the guest portal from the admin sidebar  
**So that** I can see what guests see without logging out

**Acceptance Criteria:**
- Sidebar includes "Preview Guest Portal" link
- Link opens guest portal in new tab
- Preview shows actual guest view (not admin view)

### 6. Admin RSVP Management Section
**As an** admin user  
**I want** a dedicated RSVP management page  
**So that** I can view and manage all RSVPs in one place

**Acceptance Criteria:**
- New `/admin/rsvps` page exists
- Page shows all RSVPs across all events/activities
- Filtering by event, activity, status, guest
- Bulk actions (approve, decline, export)
- RSVP statistics and summaries
- Link in admin sidebar navigation

## Technical Requirements

### Database
- Migration to add `default_auth_method` to system_settings
- Script to update guest `auth_method` values

### API Routes
- Fix `/api/admin/home-page` error handling
- New `/api/admin/rsvps` endpoint for RSVP management
- Update `/api/admin/settings` to support auth method configuration

### Components
- `InlineSectionEditor` component for home page
- `RSVPManager` component for RSVP page
- Settings form updates for auth method toggle

### Navigation
- Add "Preview Guest Portal" to admin sidebar
- Add "RSVPs" to admin sidebar navigation

## Out of Scope
- Guest portal redesign
- Advanced RSVP workflows
- Email notifications for RSVP changes (already exists)

## Success Metrics
- All manual testing issues resolved
- No 500 errors in admin dashboard
- Admin users can complete all core workflows
- Guest authentication works reliably
