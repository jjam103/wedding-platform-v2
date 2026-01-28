# Requirements Document: Admin UI Modernization

## Introduction

This spec defines the requirements for building a complete, modern admin interface for the destination wedding platform. The current admin dashboard shows metrics but lacks CRUD interfaces for managing guests, events, activities, vendors, and other entities. This project will create a polished, professional admin experience with modern UI/UX patterns.

## Glossary

- **Admin_Dashboard**: The main landing page showing metrics, alerts, and quick actions
- **CRUD_Interface**: Create, Read, Update, Delete interface for managing entities
- **Data_Table**: Sortable, filterable, paginated table for displaying entity lists
- **Form_Modal**: Overlay dialog for creating/editing entities
- **Toast_Notification**: Temporary success/error message shown after actions
- **Sidebar_Navigation**: Persistent left-side navigation menu
- **Entity**: A data type (Guest, Event, Activity, Vendor, etc.)

## Requirements

### Requirement 1: Modern Design System

**User Story:** As a wedding host, I want a beautiful, professional admin interface, so that managing my wedding feels premium and enjoyable.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL use a modern design system with consistent spacing, typography, and colors
2. THE Admin_Dashboard SHALL use the existing Costa Rica color palette (jungle, sunset, ocean, volcano, sage, cloud)
3. THE Admin_Dashboard SHALL have smooth transitions and hover states on interactive elements
4. THE Admin_Dashboard SHALL use modern UI patterns (cards, shadows, rounded corners, gradients)
5. THE Admin_Dashboard SHALL be fully responsive for desktop, tablet, and mobile viewports

### Requirement 2: Persistent Navigation

**User Story:** As a wedding host, I want easy navigation between admin sections, so that I can quickly access different management areas.

#### Acceptance Criteria

1. THE Sidebar_Navigation SHALL be visible on all admin pages
2. THE Sidebar_Navigation SHALL highlight the current active section
3. THE Sidebar_Navigation SHALL show icons and labels for each section
4. THE Sidebar_Navigation SHALL collapse to icon-only on mobile devices
5. THE Sidebar_Navigation SHALL include sections for: Dashboard, Guests, Events, Activities, Vendors, Photos, Emails, Budget, Settings

### Requirement 3: Guest Management Interface

**User Story:** As a wedding host, I want to manage my guest list, so that I can track who's invited and their details.

#### Acceptance Criteria

1. WHEN viewing /admin/guests, THE System SHALL display a Data_Table with all guests
2. THE Data_Table SHALL show columns: Name, Email, Group, Guest Type, Age Type, RSVP Status
3. THE Data_Table SHALL support sorting by any column
4. THE Data_Table SHALL support filtering by group, guest type, and RSVP status
5. THE Data_Table SHALL support search by name or email
6. THE Data_Table SHALL support pagination with 25/50/100 items per page
7. WHEN clicking "Add Guest", THE System SHALL open a Form_Modal with guest creation form
8. WHEN clicking a guest row, THE System SHALL open a Form_Modal with guest edit form
9. WHEN clicking delete icon, THE System SHALL show confirmation dialog before deleting
10. WHEN a guest action succeeds, THE System SHALL show a Toast_Notification with success message
11. WHEN a guest action fails, THE System SHALL show a Toast_Notification with error message

### Requirement 4: Event Management Interface

**User Story:** As a wedding host, I want to manage wedding events, so that I can organize the schedule and details.

#### Acceptance Criteria

1. WHEN viewing /admin/events, THE System SHALL display a Data_Table with all events
2. THE Data_Table SHALL show columns: Name, Date, Time, Location, Status, Visibility
3. THE Data_Table SHALL support sorting by date and name
4. THE Data_Table SHALL support filtering by status and visibility
5. WHEN clicking "Create Event", THE System SHALL open a Form_Modal with event creation form
6. THE Form_Modal SHALL include fields: name, description, start_date, end_date, location, status, visibility, rsvp_deadline
7. THE Form_Modal SHALL validate required fields before submission
8. WHEN clicking an event row, THE System SHALL open a Form_Modal with event edit form
9. WHEN saving an event, THE System SHALL call the event service and show Toast_Notification

### Requirement 5: Activity Management Interface

**User Story:** As a wedding host, I want to manage activities, so that I can plan detailed itineraries for guests.

#### Acceptance Criteria

1. WHEN viewing /admin/activities, THE System SHALL display a Data_Table with all activities
2. THE Data_Table SHALL show columns: Name, Event, Date/Time, Capacity, Current RSVPs, Status
3. THE Data_Table SHALL highlight activities at 90%+ capacity in warning color
4. THE Data_Table SHALL support filtering by event and status
5. WHEN clicking "Add Activity", THE System SHALL open a Form_Modal with activity creation form
6. THE Form_Modal SHALL include fields: name, description, event_id, start_time, end_time, location_id, capacity, cost_per_person, host_subsidy, activity_type, visibility, adults_only, plus_ones_allowed
7. THE Form_Modal SHALL show capacity utilization percentage when editing existing activity
8. WHEN capacity is exceeded, THE System SHALL prevent new RSVPs and show warning

### Requirement 6: Vendor Management Interface

**User Story:** As a wedding host, I want to manage vendors and track payments, so that I can stay on budget.

#### Acceptance Criteria

1. WHEN viewing /admin/vendors, THE System SHALL display a Data_Table with all vendors
2. THE Data_Table SHALL show columns: Name, Category, Base Cost, Amount Paid, Balance, Payment Status
3. THE Data_Table SHALL calculate and display balance (base_cost - amount_paid)
4. THE Data_Table SHALL highlight unpaid vendors in warning color
5. THE Data_Table SHALL support filtering by category and payment status
6. WHEN clicking "Add Vendor", THE System SHALL open a Form_Modal with vendor creation form
7. THE Form_Modal SHALL include fields: name, category, contact_email, contact_phone, base_cost, amount_paid, payment_status, notes
8. THE Form_Modal SHALL validate that amount_paid does not exceed base_cost

### Requirement 7: Photo Moderation Interface

**User Story:** As a wedding host, I want to moderate guest-uploaded photos, so that I can control what appears in the gallery.

#### Acceptance Criteria

1. WHEN viewing /admin/photos, THE System SHALL display a grid of pending photos
2. THE Photo_Grid SHALL show thumbnail, uploader name, upload date, and caption
3. THE Photo_Grid SHALL support filtering by moderation status (pending, approved, rejected)
4. WHEN clicking a photo, THE System SHALL open a full-size preview modal
5. THE Preview_Modal SHALL show approve, reject, and delete buttons
6. WHEN approving a photo, THE System SHALL update moderation_status to 'approved'
7. WHEN rejecting a photo, THE System SHALL update moderation_status to 'rejected'
8. THE System SHALL show count of pending photos in sidebar badge

### Requirement 8: Email Management Interface

**User Story:** As a wedding host, I want to send emails to guests, so that I can communicate important information.

#### Acceptance Criteria

1. WHEN viewing /admin/emails, THE System SHALL display a list of sent emails
2. THE Email_List SHALL show columns: Subject, Recipients, Sent Date, Delivery Status
3. WHEN clicking "Compose Email", THE System SHALL open an email composition form
4. THE Email_Form SHALL include fields: recipients (select guests/groups), subject, body (rich text editor)
5. THE Email_Form SHALL support email templates with variable substitution
6. THE Email_Form SHALL show preview before sending
7. WHEN sending email, THE System SHALL call email service and show Toast_Notification

### Requirement 9: Budget Dashboard

**User Story:** As a wedding host, I want to see budget breakdown, so that I can track spending.

#### Acceptance Criteria

1. WHEN viewing /admin/budget, THE System SHALL display total budget summary
2. THE Budget_Dashboard SHALL show total vendor costs, total activity costs, total accommodation costs
3. THE Budget_Dashboard SHALL show breakdown by category with visual charts
4. THE Budget_Dashboard SHALL calculate guest contributions vs host subsidies
5. THE Budget_Dashboard SHALL highlight budget items exceeding planned amounts

### Requirement 10: Responsive Data Tables

**User Story:** As a wedding host, I want data tables to work on mobile, so that I can manage my wedding on any device.

#### Acceptance Criteria

1. WHEN viewing Data_Table on mobile, THE System SHALL stack columns vertically
2. THE Data_Table SHALL show most important columns first on mobile
3. THE Data_Table SHALL provide horizontal scroll for additional columns
4. THE Data_Table SHALL maintain sort and filter functionality on mobile
5. THE Data_Table SHALL use touch-friendly tap targets (minimum 44x44px)

### Requirement 11: Loading States

**User Story:** As a wedding host, I want to see loading indicators, so that I know the system is working.

#### Acceptance Criteria

1. WHEN data is loading, THE System SHALL show skeleton loaders in place of content
2. THE Skeleton_Loader SHALL match the shape of the content being loaded
3. WHEN a form is submitting, THE System SHALL disable the submit button and show spinner
4. WHEN an action is processing, THE System SHALL show loading state on the action button
5. THE System SHALL never show blank screens during loading

### Requirement 12: Error Handling

**User Story:** As a wedding host, I want clear error messages, so that I know what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an API call fails, THE System SHALL show Toast_Notification with error message
2. THE Error_Message SHALL be user-friendly (not technical error codes)
3. WHEN form validation fails, THE System SHALL highlight invalid fields with error text
4. WHEN a network error occurs, THE System SHALL show retry button
5. THE System SHALL log errors to console for debugging

### Requirement 13: Confirmation Dialogs

**User Story:** As a wedding host, I want confirmation before destructive actions, so that I don't accidentally delete data.

#### Acceptance Criteria

1. WHEN clicking delete on any entity, THE System SHALL show confirmation dialog
2. THE Confirmation_Dialog SHALL clearly state what will be deleted
3. THE Confirmation_Dialog SHALL have "Cancel" and "Delete" buttons
4. THE Delete_Button SHALL be styled in warning color (red/volcano)
5. WHEN confirming delete, THE System SHALL call delete service and show Toast_Notification

### Requirement 14: Bulk Actions

**User Story:** As a wedding host, I want to perform bulk actions, so that I can manage multiple items efficiently.

#### Acceptance Criteria

1. THE Data_Table SHALL support row selection with checkboxes
2. WHEN rows are selected, THE System SHALL show bulk action toolbar
3. THE Bulk_Action_Toolbar SHALL show count of selected items
4. THE Bulk_Action_Toolbar SHALL provide actions: Delete, Export, Send Email (for guests)
5. WHEN performing bulk action, THE System SHALL show progress indicator

### Requirement 15: Export Functionality

**User Story:** As a wedding host, I want to export data to CSV, so that I can use it in other tools.

#### Acceptance Criteria

1. THE Data_Table SHALL have "Export" button in toolbar
2. WHEN clicking Export, THE System SHALL generate CSV file with current filtered data
3. THE CSV_File SHALL include all visible columns
4. THE CSV_File SHALL be named with entity type and timestamp
5. THE System SHALL trigger browser download of CSV file

### Requirement 16: Search and Filter Persistence

**User Story:** As a wedding host, I want my filters to persist, so that I don't have to re-apply them when navigating.

#### Acceptance Criteria

1. WHEN applying filters, THE System SHALL store filter state in URL query parameters
2. WHEN navigating back to a page, THE System SHALL restore previous filter state
3. THE System SHALL show active filters as removable chips/tags
4. WHEN clicking "Clear Filters", THE System SHALL reset all filters to default
5. THE System SHALL persist sort order in URL query parameters

### Requirement 17: Keyboard Navigation

**User Story:** As a wedding host, I want keyboard shortcuts, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN pressing "/" key, THE System SHALL focus the search input
2. WHEN pressing "n" key, THE System SHALL open new entity form modal
3. WHEN pressing "Escape" key, THE System SHALL close open modals
4. WHEN pressing "?" key, THE System SHALL show keyboard shortcuts help dialog
5. THE System SHALL support Tab navigation through all interactive elements

### Requirement 18: Accessibility Compliance

**User Story:** As a wedding host with accessibility needs, I want the admin interface to be accessible, so that I can use it effectively.

#### Acceptance Criteria

1. THE Admin_Interface SHALL meet WCAG 2.1 AA standards
2. THE Admin_Interface SHALL support screen readers with proper ARIA labels
3. THE Admin_Interface SHALL have sufficient color contrast (4.5:1 for text)
4. THE Admin_Interface SHALL support keyboard-only navigation
5. THE Form_Inputs SHALL have associated labels and error messages

### Requirement 19: Real-time Updates

**User Story:** As a wedding host, I want to see real-time updates, so that I have current information.

#### Acceptance Criteria

1. WHEN another user makes changes, THE System SHALL update the UI automatically
2. THE System SHALL use Supabase real-time subscriptions for live data
3. WHEN new RSVP is submitted, THE Dashboard SHALL update metrics immediately
4. WHEN photo is uploaded, THE Photo_Grid SHALL show new photo without refresh
5. THE System SHALL show notification when data is updated by another user

### Requirement 20: Settings Page

**User Story:** As a wedding host, I want to configure system settings, so that I can customize the experience.

#### Acceptance Criteria

1. WHEN viewing /admin/settings, THE System SHALL display settings form
2. THE Settings_Form SHALL include: wedding date, venue name, couple names, timezone
3. THE Settings_Form SHALL include email notification preferences
4. THE Settings_Form SHALL include photo gallery settings
5. WHEN saving settings, THE System SHALL validate and persist changes
