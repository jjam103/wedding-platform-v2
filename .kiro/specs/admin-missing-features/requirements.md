# Requirements Document

## Introduction

This specification addresses critical missing functionality in the admin dashboard of the destination wedding management platform. The system currently has backend services for all features but lacks complete UI implementations for guest groups, home page management, activity types, content page creation, accommodations, and transportation. Additionally, all forms need improved layouts and visible save buttons.

## Glossary

- **Admin_Dashboard**: The administrative interface for managing wedding data
- **Guest_Group**: A collection of related guests (e.g., family units)
- **Activity_Type**: A category for wedding activities (ceremony, reception, meal, transport, activity, custom)
- **Content_Page**: A dynamic page with rich text content and sections
- **Home_Page**: The main landing page for wedding guests
- **Accommodation**: A lodging facility with multiple room types
- **Room_Type**: A specific room category within an accommodation
- **Transportation**: Flight tracking and shuttle coordination system
- **Form_Layout**: The visual arrangement of input fields in forms
- **Save_Button**: A UI control that persists form changes to the database
- **FormModal**: The modal component used for CRUD operations
- **DynamicForm**: The form field rendering component
- **Sidebar**: The navigation component with grouped sections

## Requirements

### Requirement 1: Compact Form Layout

**User Story:** As an admin user, I want forms to display multiple fields per row, so that I can see more information at once and complete forms more efficiently.

#### Acceptance Criteria

1. WHEN viewing any form in the admin dashboard, THE Form_Layout SHALL display 2-3 input fields per row on desktop screens
2. WHEN the screen width is below tablet breakpoint, THE Form_Layout SHALL revert to single-column layout
3. WHEN fields have different widths, THE Form_Layout SHALL maintain visual balance across rows
4. WHEN a field has validation errors, THE Form_Layout SHALL display error messages without breaking the grid layout
5. WHERE a field requires full width (rich text editors, textareas), THE Form_Layout SHALL span the entire row

### Requirement 2: Visible Save Buttons

**User Story:** As an admin user, I want all forms to have clearly visible save buttons, so that I can persist my changes to the database.

#### Acceptance Criteria

1. WHEN viewing any form in FormModal, THE Save_Button SHALL be visible in the modal footer
2. WHEN form data is modified, THE Save_Button SHALL be enabled
3. WHEN form data is invalid, THE Save_Button SHALL be disabled with visual indication
4. WHEN the Save_Button is clicked with valid data, THE System SHALL persist changes and close the modal
5. WHEN save operation fails, THE System SHALL display error feedback and keep the modal open
6. WHEN save operation succeeds, THE System SHALL display success feedback and refresh the data table

### Requirement 3: Guest Group Management

**User Story:** As an admin user, I want to manage guest groups, so that I can organize guests by family units and shared accommodations.

#### Acceptance Criteria

1. WHEN navigating to /admin/guest-groups, THE System SHALL display a list of all guest groups
2. WHEN clicking "Add Group", THE System SHALL open a form modal for creating a new guest group
3. WHEN creating a guest group, THE System SHALL require a group name and allow optional notes
4. WHEN editing a guest group, THE System SHALL display current group details and allow modifications
5. WHEN deleting a guest group with no assigned guests, THE System SHALL remove the group
6. IF a guest group has assigned guests, THEN THE System SHALL prevent deletion and display a warning
7. WHEN viewing a guest group, THE System SHALL display the count of assigned guests
8. WHEN searching guest groups, THE System SHALL filter by group name

### Requirement 4: Home Page Management

**User Story:** As an admin user, I want to edit the home page content, so that I can customize the main landing page for wedding guests.

#### Acceptance Criteria

1. WHEN navigating to /admin/home-page, THE System SHALL display the current home page content
2. WHEN editing home page sections, THE System SHALL use the SectionEditor component
3. WHEN adding sections to the home page, THE System SHALL support all section types (text, photos, references)
4. WHEN saving home page changes, THE System SHALL persist sections to the database
5. WHEN previewing the home page, THE System SHALL display the guest-facing view
6. WHEN reordering home page sections, THE System SHALL update section order immediately
7. THE System SHALL validate all references in home page sections before saving

### Requirement 5: Activity Type Management

**User Story:** As an admin user, I want to manage activity types, so that I can create custom categories beyond the default types.

#### Acceptance Criteria

1. WHEN navigating to /admin/activity-types, THE System SHALL display all activity types (default and custom)
2. WHEN viewing default activity types, THE System SHALL prevent editing or deletion
3. WHEN clicking "Add Activity Type", THE System SHALL open a form modal for creating a custom type
4. WHEN creating an activity type, THE System SHALL require a unique name and allow optional description
5. WHEN editing a custom activity type, THE System SHALL allow name and description changes
6. WHEN deleting a custom activity type with no associated activities, THE System SHALL remove the type
7. IF an activity type has associated activities, THEN THE System SHALL prevent deletion and display a warning
8. WHEN searching activity types, THE System SHALL filter by type name

### Requirement 6: Content Page Creation

**User Story:** As an admin user, I want to create new content pages, so that I can add custom pages to the wedding website.

#### Acceptance Criteria

1. WHEN navigating to /admin/content-pages, THE System SHALL display an "Add Page" button
2. WHEN clicking "Add Page", THE System SHALL open a form modal for page creation
3. WHEN creating a content page, THE System SHALL require a title and generate a unique slug
4. WHEN a slug conflict occurs, THE System SHALL append a numeric suffix to ensure uniqueness
5. WHEN saving a new content page, THE System SHALL create the page with empty sections
6. WHEN editing a newly created page, THE System SHALL allow adding sections via SectionEditor
7. THE System SHALL validate that page slugs contain only lowercase letters, numbers, and hyphens

### Requirement 7: Accommodations Dashboard

**User Story:** As an admin user, I want to access accommodations and room types from the admin dashboard, so that I can manage lodging options efficiently.

#### Acceptance Criteria

1. WHEN viewing the admin Sidebar, THE System SHALL display an "Accommodations" link in the navigation
2. WHEN clicking the Accommodations link, THE System SHALL navigate to /admin/accommodations
3. WHEN viewing the accommodations page, THE System SHALL display all accommodations with room type counts
4. WHEN clicking an accommodation, THE System SHALL navigate to /admin/accommodations/[id]/room-types
5. WHEN viewing room types, THE System SHALL display capacity, pricing, and guest assignments
6. WHEN adding a room type, THE System SHALL require name, capacity, and per-night cost
7. WHEN editing a room type, THE System SHALL allow modifications to all fields except assigned guests

### Requirement 8: Transportation Dashboard

**User Story:** As an admin user, I want to access transportation management from the admin dashboard, so that I can coordinate flights and shuttles.

#### Acceptance Criteria

1. WHEN viewing the admin Sidebar, THE System SHALL display a "Transportation" link in the navigation
2. WHEN clicking the Transportation link, THE System SHALL navigate to /admin/transportation
3. WHEN viewing the transportation page, THE System SHALL display flight manifests and shuttle assignments
4. WHEN filtering by arrival date, THE System SHALL show guests arriving on that date
5. WHEN filtering by departure date, THE System SHALL show guests departing on that date
6. WHEN viewing shuttle assignments, THE System SHALL display vehicle requirements and driver sheets
7. WHEN exporting manifests, THE System SHALL generate printable PDF documents

### Requirement 9: Form Grid System

**User Story:** As a developer, I want a reusable grid system for forms, so that all forms maintain consistent compact layouts.

#### Acceptance Criteria

1. THE DynamicForm component SHALL support a grid layout configuration
2. WHEN a field specifies gridColumn property, THE System SHALL position the field in that column
3. WHEN a field specifies gridSpan property, THE System SHALL span the field across multiple columns
4. WHEN rendering on mobile devices, THE System SHALL collapse to single-column layout
5. THE System SHALL maintain consistent spacing between fields in grid layout
6. WHEN a field has validation errors, THE System SHALL display errors below the field without breaking grid alignment

### Requirement 10: Navigation Grouping

**User Story:** As an admin user, I want related features grouped in the navigation, so that I can find functionality more easily.

#### Acceptance Criteria

1. THE Sidebar SHALL group navigation items into logical categories
2. WHEN viewing the Sidebar, THE System SHALL display groups: "Core", "Content", "Logistics", "Analytics"
3. THE "Core" group SHALL contain: Dashboard, Guests, Events, Activities
4. THE "Content" group SHALL contain: Home Page, Content Pages, Photos, Emails
5. THE "Logistics" group SHALL contain: Accommodations, Transportation, Vendors, Budget
6. THE "Analytics" group SHALL contain: RSVP Analytics, Audit Logs
7. WHEN clicking a group header, THE System SHALL expand or collapse the group items
