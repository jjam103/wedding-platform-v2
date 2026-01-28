# Requirements Document

## Introduction

This specification defines the requirements for integrating the existing backend services with the admin UI and implementing a comprehensive Content Management System (CMS) for the destination wedding platform. The system currently has 17 functional backend services but lacks frontend integration and CMS functionality. This feature will restore capabilities from the previous version while leveraging the modern UI components and backend architecture.

**Key Changes from Current Implementation:**
1. **UI Pattern Modernization**: Replace FormModal popup components with collapsible inline forms or tabbed interfaces for "Add New" functionality
2. **Navigation Enhancement**: Reorganize sidebar navigation with logical grouping of related sections
3. **Backend Integration**: Wire up existing services (photo management, transportation, vendor bookings) to admin UI
4. **CMS Implementation**: Build comprehensive content management with section editor and rich text capabilities

## Glossary

- **Admin_System**: The administrative interface for managing wedding content and data
- **CMS**: Content Management System for creating and managing page content
- **Section_Editor**: Rich text editor component for managing page sections
- **Backend_Service**: Server-side service layer handling business logic and data operations
- **UI_Component**: Frontend React component for user interaction
- **Location_Hierarchy**: Tree structure of locations (Country → Region → City → Venue)
- **RSVP_Management**: System for tracking guest responses to events and activities
- **Capacity_Tracking**: Real-time monitoring of activity attendance limits
- **CSV_Import_Export**: Bulk guest data operations via CSV files
- **Payment_Tracking**: Vendor payment status and balance monitoring
- **Budget_Dashboard**: Real-time financial overview and calculations
- **Content_Page**: Custom page with rich text content and sections
- **Home_Page_Editor**: Special editor for wedding homepage configuration
- **User_Role**: Admin access level (admin or owner)

## Requirements

**Implementation Approach:**
- This specification focuses on **frontend-backend integration** and **CMS functionality**
- Many backend services are **already fully implemented** (see "Already Implemented Features" section)
- The primary work is **wiring up existing services to the admin UI** and **building new UI components**
- **UI Pattern Change**: Replace FormModal popups with collapsible forms or tabbed interfaces for better UX
- **Navigation Enhancement**: Reorganize sidebar with grouped sections for better discoverability

### Requirement 1: Content Management System (CMS)

**User Story:** As an admin, I want to create and manage custom content pages with rich text and photos, so that I can provide detailed information to wedding guests.

#### Acceptance Criteria

1. WHEN an admin creates a content page, THE Admin_System SHALL validate the page data and create a new page with a unique slug
2. WHEN an admin edits a content page, THE Admin_System SHALL update the page data and preserve the slug unless explicitly changed
3. WHEN an admin deletes a content page, THE Admin_System SHALL remove the page and all associated sections
4. WHEN an admin views the content pages list, THE Admin_System SHALL display all pages with their slug and publication status
5. THE Admin_System SHALL support Draft and Published status for all content pages
6. WHEN an admin clicks "Manage Sections" on a content page, THE Admin_System SHALL open the Section Editor for that page

### Requirement 2: Section Editor Component

**User Story:** As an admin, I want to edit page sections with rich text and photos, so that I can create visually appealing content layouts.

#### Acceptance Criteria

1. WHEN the Section Editor loads, THE Admin_System SHALL display all existing sections for the page in display order
2. WHEN an admin adds a new section, THE Admin_System SHALL create a section with two empty columns
3. WHEN an admin edits a column, THE Admin_System SHALL support rich text formatting (bold, italic, underline, links, lists)
4. WHEN an admin adds photos to a column, THE Admin_System SHALL integrate with the photo gallery system
5. WHEN an admin reorders sections, THE Admin_System SHALL update display_order values via drag-and-drop
6. WHEN an admin saves sections, THE Admin_System SHALL validate all content and persist changes to the database
7. WHEN an admin adds a reference link, THE Admin_System SHALL provide a searchable dropdown to look up entities by name
8. WHEN an admin searches for a reference, THE Admin_System SHALL support searching for: Events, Activities, Accommodations, Room Types, Content Pages
9. WHEN an admin selects a reference, THE Admin_System SHALL validate that the referenced entity exists
10. IF a reference link points to a deleted entity, THEN THE Admin_System SHALL mark it as broken and display a warning
11. WHEN an admin creates a circular reference, THE Admin_System SHALL prevent the save operation and display an error with the reference chain
12. WHEN an admin views a reference in the editor, THE Admin_System SHALL display it as a card with entity type, name, and quick preview
13. WHEN an admin clicks a reference card, THE Admin_System SHALL provide options to: View entity, Edit entity, Remove reference
14. THE Admin_System SHALL support section management for Events, Activities, Accommodations, Room Types, and Content Pages

### Requirement 3: Home Page Editor

**User Story:** As an admin, I want to customize the wedding homepage, so that guests see personalized welcome content.

#### Acceptance Criteria

1. WHEN an admin opens the Home Page Editor, THE Admin_System SHALL load current homepage configuration
2. WHEN an admin updates the wedding title, THE Admin_System SHALL sanitize and save the new title
3. WHEN an admin updates the wedding subtitle, THE Admin_System SHALL sanitize and save the new subtitle
4. WHEN an admin updates the welcome message, THE Admin_System SHALL sanitize the rich text and save it
5. WHEN an admin updates the hero image URL, THE Admin_System SHALL validate the URL format and save it
6. WHEN an admin clicks "Manage Sections", THE Admin_System SHALL open the Section Editor for the homepage
7. THE Admin_System SHALL persist all homepage changes immediately upon save

### Requirement 4: Hierarchical Location Management

**User Story:** As an admin, I want to manage locations in a hierarchical structure, so that I can organize venues by country, region, and city.

#### Acceptance Criteria

1. WHEN an admin creates a location, THE Admin_System SHALL validate the location data and create it with optional parent relationship
2. WHEN an admin sets a parent location, THE Admin_System SHALL verify the parent exists
3. IF setting a parent would create a circular reference, THEN THE Admin_System SHALL prevent the operation and display an error
4. WHEN an admin deletes a location, THE Admin_System SHALL set child locations' parent_location_id to NULL
5. WHEN an admin views the locations list, THE Admin_System SHALL display the hierarchical tree structure
6. WHEN an admin searches locations, THE Admin_System SHALL search by name, address, and description
7. THE Admin_System SHALL support location selection in Event, Activity, and Accommodation forms

### Requirement 5: User and Admin Management

**User Story:** As an owner, I want to manage admin users, so that I can control who has access to the admin system.

#### Acceptance Criteria

1. WHEN an owner adds an admin user by email, THE Admin_System SHALL send an invitation email
2. WHEN an admin user accepts the invitation, THE Admin_System SHALL create their account with the specified role
3. WHEN an owner views the admin users list, THE Admin_System SHALL display all users with their role and status
4. WHEN an owner deactivates an admin user, THE Admin_System SHALL revoke their access without deleting their account
5. WHEN an owner deletes an admin user, THE Admin_System SHALL permanently remove their account
6. THE Admin_System SHALL support two roles: admin and owner
7. WHEN a user with admin role attempts owner-only actions, THE Admin_System SHALL deny access

### Requirement 6: Events Management Integration

**User Story:** As an admin, I want to manage wedding events through the UI, so that I can coordinate the wedding schedule.

#### Acceptance Criteria

1. WHEN an admin views the events list, THE Admin_System SHALL display all events with slug, date, and status
2. WHEN an admin creates an event, THE Admin_System SHALL validate the data, check for scheduling conflicts, and create the event
3. IF an event conflicts with another event at the same location and time, THEN THE Admin_System SHALL prevent creation and display conflict details
4. WHEN an admin updates an event, THE Admin_System SHALL validate changes and check for new scheduling conflicts
5. WHEN an admin deletes an event, THE Admin_System SHALL remove the event and set associated activities' event_id to NULL
6. WHEN an admin selects a location for an event, THE Admin_System SHALL display the location hierarchy tree
7. WHEN an admin clicks "Manage Sections" on an event, THE Admin_System SHALL open the Section Editor for that event
8. THE Admin_System SHALL support event types: ceremony, reception, meal, transport, activity, custom

### Requirement 7: Activities Management Integration

**User Story:** As an admin, I want to manage wedding activities through the UI, so that I can organize guest experiences.

#### Acceptance Criteria

1. WHEN an admin views the activities list, THE Admin_System SHALL display all activities with type, date, time, and attendee count
2. WHEN an admin filters activities by type, THE Admin_System SHALL display only activities matching the selected type
3. WHEN an admin creates an activity, THE Admin_System SHALL validate the data and create the activity
4. WHEN an admin updates an activity, THE Admin_System SHALL validate changes and update the activity
5. WHEN an admin deletes an activity, THE Admin_System SHALL remove the activity and associated RSVPs
6. WHEN an admin views capacity information, THE Admin_System SHALL display current attendees, available spots, and utilization percentage
7. IF activity utilization reaches 90%, THEN THE Admin_System SHALL display a near-capacity warning
8. IF activity utilization reaches 100%, THEN THE Admin_System SHALL display an at-capacity alert
9. WHEN an admin clicks "Manage Sections" on an activity, THE Admin_System SHALL open the Section Editor for that activity
10. THE Admin_System SHALL support activity types: ceremony, reception, meal, transport, activity, custom

### Requirement 8: Guest Management Integration

**User Story:** As an admin, I want to manage wedding guests through the UI with advanced filtering, so that I can efficiently coordinate guest information.

#### Acceptance Criteria

1. WHEN an admin views the guests list, THE Admin_System SHALL display all guests with name, email, and group information
2. WHEN an admin filters by RSVP status, THE Admin_System SHALL display only guests matching the selected status
3. WHEN an admin filters by activity, THE Admin_System SHALL display only guests who RSVPed to selected activities
4. WHEN an admin filters by transportation, THE Admin_System SHALL display only guests with selected transportation arrangements
5. WHEN an admin filters by age group, THE Admin_System SHALL display only guests matching the selected age type
6. WHEN an admin filters by airport, THE Admin_System SHALL display only guests arriving at selected airports
7. WHEN an admin groups guests, THE Admin_System SHALL organize the display by the selected grouping field
8. WHEN an admin expands RSVP management for a guest, THE Admin_System SHALL display activity and event RSVP dropdowns
9. WHEN an admin updates a guest's RSVP, THE Admin_System SHALL validate the change and update the database
10. WHEN an admin creates a guest, THE Admin_System SHALL validate the data, sanitize inputs, and create the guest
11. WHEN an admin updates a guest, THE Admin_System SHALL validate changes, sanitize inputs, and update the guest
12. WHEN an admin deletes a guest, THE Admin_System SHALL remove the guest and associated RSVPs

### Requirement 9: CSV Import and Export

**User Story:** As an admin, I want to import and export guest data via CSV, so that I can perform bulk operations efficiently.

#### Acceptance Criteria

1. WHEN an admin clicks "Export CSV", THE Admin_System SHALL generate a CSV file with all guest data
2. THE Admin_System SHALL format CSV fields with proper escaping for commas, quotes, and newlines
3. WHEN an admin uploads a CSV file, THE Admin_System SHALL validate the file format and headers
4. IF CSV headers do not match the expected format, THEN THE Admin_System SHALL display a validation error with details
5. WHEN importing CSV data, THE Admin_System SHALL validate each row against the guest schema
6. IF any CSV rows fail validation, THEN THE Admin_System SHALL display all validation errors without creating any guests
7. WHEN all CSV rows are valid, THE Admin_System SHALL create all guests in a single bulk operation
8. WHEN CSV import completes, THE Admin_System SHALL display the count of successfully imported guests
9. FOR ALL valid guest data, exporting then importing SHALL produce equivalent guest records (round-trip property)

### Requirement 10: Accommodations Management Integration

**User Story:** As an admin, I want to manage accommodations through the UI, so that I can coordinate guest lodging.

#### Acceptance Criteria

1. WHEN an admin views the accommodations list, THE Admin_System SHALL display all accommodations with name, location, and check-in/out dates
2. WHEN an admin creates an accommodation, THE Admin_System SHALL validate the data and create the accommodation
3. WHEN an admin updates an accommodation, THE Admin_System SHALL validate changes and update the accommodation
4. WHEN an admin deletes an accommodation, THE Admin_System SHALL remove the accommodation and associated room types
5. WHEN an admin clicks "Room Types", THE Admin_System SHALL display the room types management interface for that accommodation
6. WHEN an admin clicks "Manage Sections" on an accommodation, THE Admin_System SHALL open the Section Editor for that accommodation
7. WHEN an admin selects a location for an accommodation, THE Admin_System SHALL display the location hierarchy tree

### Requirement 11: Budget Dashboard Integration

**User Story:** As an admin, I want to view real-time budget information, so that I can track wedding expenses and guest contributions.

#### Acceptance Criteria

1. WHEN an admin opens the Budget Dashboard, THE Admin_System SHALL calculate and display total cost
2. WHEN an admin opens the Budget Dashboard, THE Admin_System SHALL calculate and display host contribution
3. WHEN an admin opens the Budget Dashboard, THE Admin_System SHALL calculate and display guest payments
4. WHEN an admin opens the Budget Dashboard, THE Admin_System SHALL calculate and display balance due
5. WHEN an admin views vendor payment tracking, THE Admin_System SHALL display all vendors with payment status
6. WHEN an admin updates a vendor payment, THE Admin_System SHALL validate the payment data and update the status
7. WHEN an admin views individual guest subsidies, THE Admin_System SHALL calculate per-guest subsidy amounts
8. THE Admin_System SHALL recalculate all budget totals in real-time when underlying data changes

### Requirement 12: Vendor Management Integration

**User Story:** As an admin, I want to manage wedding vendors through the UI, so that I can track vendor contracts and payments.

#### Acceptance Criteria

1. WHEN an admin views the vendors list, THE Admin_System SHALL display all vendors with category, cost, and payment status
2. WHEN an admin creates a vendor, THE Admin_System SHALL validate the data and create the vendor
3. WHEN an admin updates a vendor, THE Admin_System SHALL validate changes and update the vendor
4. WHEN an admin deletes a vendor, THE Admin_System SHALL remove the vendor
5. WHEN an admin updates vendor payment status, THE Admin_System SHALL validate the status and update the database
6. THE Admin_System SHALL support vendor categories: photography, catering, music, transportation, accommodation, activity, other
7. THE Admin_System SHALL support payment statuses: unpaid, partial, paid

### Requirement 13: API Endpoints for CRUD Operations

**User Story:** As a developer, I want RESTful API endpoints for all entities, so that the frontend can perform CRUD operations.

#### Acceptance Criteria

1. WHEN a POST request is made to create an entity, THE Admin_System SHALL validate authentication, validate data, call the service, and return 201 on success
2. WHEN a GET request is made to retrieve an entity, THE Admin_System SHALL validate authentication, call the service, and return 200 with data
3. WHEN a PUT request is made to update an entity, THE Admin_System SHALL validate authentication, validate data, call the service, and return 200 on success
4. WHEN a DELETE request is made to remove an entity, THE Admin_System SHALL validate authentication, call the service, and return 200 on success
5. IF authentication fails, THEN THE Admin_System SHALL return 401 UNAUTHORIZED
6. IF validation fails, THEN THE Admin_System SHALL return 400 VALIDATION_ERROR with details
7. IF an entity is not found, THEN THE Admin_System SHALL return 404 NOT_FOUND
8. IF a database error occurs, THEN THE Admin_System SHALL return 500 DATABASE_ERROR
9. THE Admin_System SHALL provide API endpoints for: events, activities, guests, accommodations, vendors, locations, content pages, sections, users

### Requirement 14: Advanced Filtering API

**User Story:** As a developer, I want API endpoints that support advanced filtering, so that the frontend can implement complex queries.

#### Acceptance Criteria

1. WHEN a GET request includes filter parameters, THE Admin_System SHALL validate the filters against the schema
2. WHEN filtering guests by multiple activities, THE Admin_System SHALL return guests who RSVPed to any of the selected activities
3. WHEN filtering guests by multiple airports, THE Admin_System SHALL return guests arriving at any of the selected airports
4. WHEN filtering guests by RSVP status, THE Admin_System SHALL return only guests with the specified status
5. WHEN filtering activities by type, THE Admin_System SHALL return only activities matching the specified type
6. WHEN filtering events by date range, THE Admin_System SHALL return only events within the specified range
7. WHEN filtering locations by parent, THE Admin_System SHALL return only child locations of the specified parent
8. THE Admin_System SHALL support pagination for all list endpoints with page and pageSize parameters

### Requirement 15: Section Management API

**User Story:** As a developer, I want API endpoints for section management, so that the Section Editor can save and retrieve content.

#### Acceptance Criteria

1. WHEN a POST request creates a section, THE Admin_System SHALL validate the section data, sanitize rich text content, and create the section with columns
2. WHEN a GET request retrieves sections for a page, THE Admin_System SHALL return all sections ordered by display_order with their columns
3. WHEN a PUT request updates a section, THE Admin_System SHALL validate changes, sanitize content, and update the section and columns
4. WHEN a DELETE request removes a section, THE Admin_System SHALL delete the section and all associated columns
5. WHEN a POST request reorders sections, THE Admin_System SHALL update display_order values for all specified sections
6. WHEN a POST request validates references, THE Admin_System SHALL check that all referenced entities exist and return broken references
7. WHEN a POST request checks for circular references, THE Admin_System SHALL detect cycles in the reference graph and return true if found
8. THE Admin_System SHALL support section management for page types: activity, event, accommodation, room_type, custom, home

### Requirement 16: Reference Lookup and Search API

**User Story:** As a developer, I want API endpoints for searching and looking up entities for reference linking, so that the Section Editor can provide entity search functionality.

#### Acceptance Criteria

1. WHEN a GET request searches for entities, THE Admin_System SHALL support searching across multiple entity types: events, activities, accommodations, room_types, content_pages
2. WHEN a search query is provided, THE Admin_System SHALL search by entity name and return matching results
3. WHEN a search is filtered by entity type, THE Admin_System SHALL return only entities of that type
4. WHEN search results are returned, THE Admin_System SHALL include: entity id, name, type, slug (if applicable), status
5. WHEN a GET request retrieves entity details for preview, THE Admin_System SHALL return summary information for display in reference cards
6. THE Admin_System SHALL limit search results to 20 items per entity type
7. THE Admin_System SHALL order search results by relevance (exact matches first, then partial matches)
8. THE Admin_System SHALL provide endpoints:
   - `GET /api/admin/references/search?q={query}&type={entity_type}` - Search entities
   - `GET /api/admin/references/{entity_type}/{id}` - Get entity preview details

### Requirement 17: Version History and Rollback

**User Story:** As an admin, I want to view version history for pages, so that I can revert to previous content if needed.

#### Acceptance Criteria

1. WHEN an admin saves page content, THE Admin_System SHALL create a version snapshot with timestamp and user
2. WHEN an admin views version history, THE Admin_System SHALL display all versions ordered by creation date
3. WHEN an admin selects a version, THE Admin_System SHALL display the content from that version
4. WHEN an admin reverts to a version, THE Admin_System SHALL restore all sections and columns from that version
5. THE Admin_System SHALL preserve version history even after page deletion

### Requirement 18: Error Handling and User Feedback

**User Story:** As an admin, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a validation error occurs, THE Admin_System SHALL display the specific field and validation rule that failed
2. WHEN a database error occurs, THE Admin_System SHALL display a user-friendly message without exposing technical details
3. WHEN a scheduling conflict occurs, THE Admin_System SHALL display the conflicting events with their dates and times
4. WHEN a circular reference is detected, THE Admin_System SHALL display the reference chain that creates the cycle
5. WHEN a bulk operation partially fails, THE Admin_System SHALL display which items succeeded and which failed with reasons
6. WHEN an operation succeeds, THE Admin_System SHALL display a success toast notification
7. THE Admin_System SHALL log all errors to the server for debugging purposes

### Requirement 19: Data Integrity and Validation

**User Story:** As a system administrator, I want all data to be validated and sanitized, so that the system maintains data integrity and security.

#### Acceptance Criteria

1. WHEN user input is received, THE Admin_System SHALL validate it against the Zod schema using safeParse
2. WHEN plain text input is received, THE Admin_System SHALL sanitize it to remove all HTML tags
3. WHEN rich text input is received, THE Admin_System SHALL sanitize it to allow only safe HTML tags (p, br, strong, em, u, a, ul, ol, li)
4. WHEN a reference is created, THE Admin_System SHALL validate that the referenced entity exists
5. WHEN a parent relationship is created, THE Admin_System SHALL validate that it does not create a circular reference
6. WHEN a date range is specified, THE Admin_System SHALL validate that end date is after start date
7. WHEN capacity is specified, THE Admin_System SHALL validate that it is a positive integer
8. THE Admin_System SHALL never execute raw SQL with user input (always use query builder)

### Requirement 20: Performance and Optimization

**User Story:** As a user, I want the admin interface to load quickly, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN an admin loads a list page, THE Admin_System SHALL return results within 500ms for datasets under 1000 items
2. WHEN an admin performs a search, THE Admin_System SHALL return results within 1000ms
3. WHEN an admin saves content, THE Admin_System SHALL persist changes within 2000ms
4. THE Admin_System SHALL use pagination with default page size of 50 items
5. THE Admin_System SHALL use database indexes on frequently queried fields (id, slug, parent_location_id, event_id, activity_id)
6. THE Admin_System SHALL lazy load the Section Editor component to reduce initial bundle size
7. THE Admin_System SHALL use React.memo for list item components to prevent unnecessary re-renders

### Requirement 21: Accessibility and Usability

**User Story:** As an admin with accessibility needs, I want the interface to be keyboard navigable and screen reader friendly, so that I can use the system effectively.

#### Acceptance Criteria

1. WHEN an admin navigates with keyboard, THE Admin_System SHALL provide visible focus indicators
2. WHEN an admin uses a screen reader, THE Admin_System SHALL provide descriptive labels for all form fields
3. WHEN an admin uses a screen reader, THE Admin_System SHALL announce success and error messages
4. THE Admin_System SHALL support keyboard shortcuts for common actions (Ctrl+S to save, Esc to close modals)
5. THE Admin_System SHALL maintain WCAG 2.1 AA compliance for color contrast
6. THE Admin_System SHALL provide loading states for all async operations
7. THE Admin_System SHALL provide confirmation dialogs for destructive actions (delete, revert)

### Requirement 22: Room Types Management

**User Story:** As an admin, I want to manage room types within accommodations, so that I can organize guest lodging assignments.

#### Acceptance Criteria

1. WHEN an admin clicks "Room Types" on an accommodation, THE Admin_System SHALL display the room types management interface
2. WHEN an admin creates a room type, THE Admin_System SHALL validate the data and create it linked to the accommodation
3. WHEN an admin updates a room type, THE Admin_System SHALL validate changes and update the room type
4. WHEN an admin deletes a room type, THE Admin_System SHALL remove the room type and unassign any guests
5. WHEN an admin views room types, THE Admin_System SHALL display capacity, occupancy, and pricing information
6. WHEN an admin assigns a guest to a room, THE Admin_System SHALL validate capacity and create the assignment
7. WHEN an admin clicks "Manage Sections" on a room type, THE Admin_System SHALL open the Section Editor for that room type
8. THE Admin_System SHALL track check-in and check-out dates per room type

### Requirement 23: Vendor Booking System

**User Story:** As an admin, I want to link vendors to activities and events, so that I can track which vendors are providing services for each occasion.

#### Acceptance Criteria

1. WHEN an admin creates a vendor booking, THE Admin_System SHALL validate the vendor, activity/event, and date
2. WHEN an admin views vendor bookings, THE Admin_System SHALL display all bookings with vendor name, activity/event, and date
3. WHEN an admin links transportation to a booking, THE Admin_System SHALL associate the transportation manifest
4. WHEN an admin updates a vendor booking, THE Admin_System SHALL validate changes and update the booking
5. WHEN an admin deletes a vendor booking, THE Admin_System SHALL remove the booking without deleting the vendor
6. WHEN an admin views a vendor's bookings, THE Admin_System SHALL display all activities/events using that vendor
7. WHEN an admin views an activity's vendors, THE Admin_System SHALL display all vendors booked for that activity

### Requirement 24: Guest Edit Modal - Extended Fields

**User Story:** As an admin, I want to edit comprehensive guest information including travel details, so that I can maintain complete guest records.

#### Acceptance Criteria

1. WHEN an admin opens the guest edit modal, THE Admin_System SHALL load all guest data including travel information
2. WHEN an admin updates arrival airport, THE Admin_System SHALL validate the airport code and save it
3. WHEN an admin updates arrival date, THE Admin_System SHALL validate the date format and save it
4. WHEN an admin updates arrival flight number, THE Admin_System SHALL sanitize and save the flight number
5. WHEN an admin updates departure airport, THE Admin_System SHALL validate the airport code and save it
6. WHEN an admin updates departure date, THE Admin_System SHALL validate the date format and save it
7. WHEN an admin updates departure flight number, THE Admin_System SHALL sanitize and save the flight number
8. WHEN an admin updates plus-one information, THE Admin_System SHALL validate and save the plus-one name
9. WHEN an admin updates relationship field, THE Admin_System SHALL sanitize and save the relationship description
10. THE Admin_System SHALL display all fields in a logical grouping (Personal Info, Travel Info, Plus-One Info, Relationship)

### Requirement 25: Section Editor - Advanced Features

**User Story:** As an admin, I want advanced section editing capabilities including drag-and-drop, tables, and guest preview, so that I can create rich content efficiently.

#### Acceptance Criteria

1. WHEN an admin drags a section, THE Admin_System SHALL provide visual feedback and update display_order on drop
2. WHEN an admin adds multiple images to a column, THE Admin_System SHALL support batch upload and display all images
3. WHEN an admin adds a 2-column table, THE Admin_System SHALL insert a table with configurable rows and columns
4. WHEN an admin uses slash commands, THE Admin_System SHALL display a command menu with available options
5. WHEN an admin clicks "Guest Preview", THE Admin_System SHALL render the content as guests would see it
6. WHEN an admin edits table content, THE Admin_System SHALL support inline editing of cells
7. WHEN an admin formats table cells, THE Admin_System SHALL support text alignment and styling
8. THE Admin_System SHALL support slash commands: /heading, /list, /table, /image, /link, /divider

### Requirement 26: Transportation Manifest Integration

**User Story:** As an admin, I want to view transportation manifests by date, so that I can coordinate guest arrivals and departures.

#### Acceptance Criteria

1. WHEN an admin views arrival manifests, THE Admin_System SHALL group guests by arrival date
2. WHEN an admin views departure manifests, THE Admin_System SHALL group guests by departure date
3. WHEN an admin filters by airport, THE Admin_System SHALL display only guests using that airport
4. WHEN an admin views a manifest, THE Admin_System SHALL display guest name, flight number, arrival/departure time, and shuttle assignment
5. WHEN an admin assigns a shuttle, THE Admin_System SHALL validate capacity and create the assignment
6. WHEN an admin prints a manifest, THE Admin_System SHALL generate a printer-friendly format
7. THE Admin_System SHALL calculate required shuttle vehicles based on guest count and vehicle capacity

### Requirement 27: Reusable Modal System

**User Story:** As a developer, I want a consistent modal system for all edit operations, so that the UI is predictable and maintainable.

#### Acceptance Criteria

1. WHEN a modal opens, THE Admin_System SHALL display a backdrop and center the modal
2. WHEN a user clicks outside the modal, THE Admin_System SHALL close the modal if no unsaved changes exist
3. WHEN a user presses Escape, THE Admin_System SHALL close the modal if no unsaved changes exist
4. IF unsaved changes exist, THEN THE Admin_System SHALL display a confirmation dialog before closing
5. WHEN a modal form is submitted, THE Admin_System SHALL validate, save, close the modal, and show a success toast
6. WHEN a modal form has errors, THE Admin_System SHALL display field-level error messages
7. THE Admin_System SHALL support modal sizes: small (400px), medium (600px), large (800px), full (90vw)
8. THE Admin_System SHALL use FormModal component for all CRUD operations

### Requirement 28: Collapsible Forms Pattern (Replaces FormModal Popups)

**User Story:** As an admin, I want collapsible "Add New" forms on list pages instead of popup modals, so that I can create entities without leaving the page context.

**Current Implementation:** The system currently uses FormModal popup components for "Add New" functionality on guests, events, activities, and vendors pages. This requirement replaces that pattern with inline collapsible forms or tabbed interfaces.

#### Acceptance Criteria

1. WHEN an admin clicks "Add New [Entity]", THE Admin_System SHALL expand an inline form below the button OR open a tabbed interface
2. WHEN an admin submits the form, THE Admin_System SHALL validate, create the entity, add it to the list, collapse the form, and clear fields
3. WHEN an admin clicks "Cancel", THE Admin_System SHALL collapse the form OR close the tab and clear fields
4. IF the form has unsaved changes, THEN THE Admin_System SHALL display a confirmation dialog before canceling
5. THE Admin_System SHALL replace FormModal popups with collapsible forms OR tabs for: Events, Activities, Guests, Content Pages, Locations, Vendors
6. THE Admin_System SHALL scroll to the new entity after creation
7. THE Admin_System SHALL maintain form state when switching between tabs (if using tabbed interface)
8. THE Admin_System SHALL provide visual feedback when the form is expanded/collapsed

### Requirement 29: Admin Dashboard Navigation Reorganization

**User Story:** As an admin, I want a friendly dashboard layout with grouped navigation sections, so that I can easily find related functionality.

**Current Implementation:** The sidebar navigation (`components/admin/Sidebar.tsx`) displays a flat list of all admin sections. This requirement adds logical grouping and subpage organization.

#### Acceptance Criteria

1. WHEN an admin views the dashboard, THE Admin_System SHALL display navigation grouped by functional areas
2. THE Admin_System SHALL group navigation items into categories:
   - **Guest Management**: Guests, Groups, RSVPs
   - **Event Planning**: Events, Activities, Locations
   - **Logistics**: Accommodations, Transportation, Vendors
   - **Content**: Content Pages, Home Page, Photos
   - **Communication**: Emails, Notifications
   - **Financial**: Budget, Vendor Payments
   - **System**: Settings, Audit Logs, User Management
3. WHEN an admin clicks a group header, THE Admin_System SHALL expand/collapse the group to show/hide subpages
4. WHEN an admin navigates to a subpage, THE Admin_System SHALL highlight both the group and the active subpage
5. THE Admin_System SHALL persist group expansion state in localStorage
6. THE Admin_System SHALL display group icons for visual identification
7. THE Admin_System SHALL support keyboard navigation through groups and subpages
8. THE Admin_System SHALL maintain mobile responsiveness with grouped navigation
9. WHEN a group contains pending items (e.g., pending photos), THE Admin_System SHALL display a badge on the group header
10. THE Admin_System SHALL provide a "Quick Access" section for frequently used pages

### Requirement 30: Status Indicators and Badges

**User Story:** As an admin, I want visual status indicators, so that I can quickly identify entity states.

#### Acceptance Criteria

1. WHEN an entity has a status, THE Admin_System SHALL display a colored badge
2. WHEN an event is active, THE Admin_System SHALL display a green "Active" badge
3. WHEN an event is inactive, THE Admin_System SHALL display a gray "Inactive" badge
4. WHEN a page is published, THE Admin_System SHALL display a green "Published" badge
5. WHEN a page is draft, THE Admin_System SHALL display a yellow "Draft" badge
6. WHEN a vendor payment is unpaid, THE Admin_System SHALL display a red "UNPAID" badge
7. WHEN a vendor payment is partial, THE Admin_System SHALL display an orange "PARTIAL" badge
8. WHEN a vendor payment is paid, THE Admin_System SHALL display a green "PAID" badge
9. WHEN an activity is near capacity (90%+), THE Admin_System SHALL display an orange warning badge
10. WHEN an activity is at capacity (100%), THE Admin_System SHALL display a red alert badge

### Requirement 31: Slug Generation and Management

**User Story:** As an admin, I want automatic slug generation from titles, so that I can create SEO-friendly URLs easily.

#### Acceptance Criteria

1. WHEN an admin types a title, THE Admin_System SHALL auto-generate a slug in real-time
2. WHEN an admin edits the slug, THE Admin_System SHALL allow manual override
3. WHEN a slug conflicts with an existing slug, THE Admin_System SHALL append a number (e.g., -2, -3)
4. WHEN an admin saves an entity, THE Admin_System SHALL validate the slug is unique and URL-safe
5. THE Admin_System SHALL convert slugs to lowercase, replace spaces with hyphens, and remove special characters
6. THE Admin_System SHALL display the full URL path preview (e.g., /events/ceremony-on-beach)
7. THE Admin_System SHALL support slug generation for: Events, Activities, Content Pages, Accommodations

### Requirement 32: Back to Guest View Navigation

**User Story:** As an admin, I want to navigate to the guest-facing view of entities, so that I can preview how content appears to guests.

#### Acceptance Criteria

1. WHEN an admin clicks "Back to Guest View" on a content page, THE Admin_System SHALL navigate to the guest-facing page
2. WHEN an admin clicks "View" on an event, THE Admin_System SHALL navigate to the guest-facing event page
3. WHEN an admin clicks "View" on an activity, THE Admin_System SHALL navigate to the guest-facing activity page
4. WHEN an admin clicks "View" on an accommodation, THE Admin_System SHALL navigate to the guest-facing accommodation page
5. THE Admin_System SHALL open guest views in the same tab by default
6. THE Admin_System SHALL provide a "Back to Admin" link on guest-facing pages when accessed from admin

## Non-Functional Requirements

### Performance Requirements

1. List pages SHALL load within 500ms for datasets under 1000 items
2. Search and filter operations SHALL return results within 1000ms
3. Save operations SHALL complete within 2000ms
4. The Section Editor SHALL support up to 50 sections per page without performance degradation
5. CSV export SHALL handle up to 10,000 guests within 5 seconds
6. CSV import SHALL process up to 1,000 guests within 10 seconds

### Security Requirements

1. ALL API endpoints SHALL require authentication
2. ALL user input SHALL be validated with Zod schemas
3. ALL plain text input SHALL be sanitized to remove HTML
4. ALL rich text input SHALL be sanitized to allow only safe HTML tags
5. ALL database queries SHALL use parameterized queries (Supabase query builder)
6. ALL file uploads SHALL be validated for type and size
7. ALL admin actions SHALL be logged to audit_logs table

### Scalability Requirements

1. The system SHALL support up to 10,000 guests
2. The system SHALL support up to 1,000 activities
3. The system SHALL support up to 100 events
4. The system SHALL support up to 50 accommodations
5. The system SHALL support up to 500 vendors
6. The system SHALL support up to 1,000 content sections across all pages

### Compatibility Requirements

1. The system SHALL work on Chrome, Firefox, Safari, and Edge (latest 2 versions)
2. The system SHALL be responsive for desktop (1920x1080), tablet (768x1024), and mobile (375x667)
3. The system SHALL support keyboard navigation
4. The system SHALL support screen readers (NVDA, JAWS, VoiceOver)

### Maintainability Requirements

1. ALL components SHALL follow the established naming conventions
2. ALL services SHALL return Result<T> type
3. ALL API routes SHALL follow RESTful conventions
4. ALL code SHALL pass TypeScript strict mode checks
5. ALL code SHALL pass ESLint checks
6. ALL critical paths SHALL have test coverage above 90%

## Success Metrics

1. **Feature Completeness:** 100% of requirements implemented
2. **Test Coverage:** 90%+ for services, 85%+ for API routes, 70%+ for components
3. **Performance:** All performance requirements met
4. **Accessibility:** WCAG 2.1 AA compliance maintained
5. **User Satisfaction:** Admin users can complete all workflows without errors
6. **Bug Rate:** Less than 5 critical bugs per 1000 lines of code
7. **Code Quality:** All TypeScript and ESLint checks passing

### Requirement 33: Photo Gallery Display Modes

**User Story:** As an admin, I want to configure how photos are displayed on pages, so that I can choose between gallery grid, carousel, or auto-play loop modes.

#### Acceptance Criteria

1. WHEN an admin configures gallery settings, THE Admin_System SHALL support three display modes: gallery, carousel, loop
2. WHEN gallery mode is selected, THE Admin_System SHALL display photos in a responsive grid with configurable photos per row
3. WHEN carousel mode is selected, THE Admin_System SHALL display photos in a swipeable carousel with navigation arrows
4. WHEN loop mode is selected, THE Admin_System SHALL auto-play photos in sequence with configurable interval
5. WHEN an admin updates photos per row, THE Admin_System SHALL validate the value is between 1 and 6
6. WHEN an admin toggles show captions, THE Admin_System SHALL show or hide photo captions accordingly
7. WHEN an admin sets autoplay interval, THE Admin_System SHALL validate the value is between 1000ms and 10000ms
8. WHEN an admin selects transition effect, THE Admin_System SHALL support: fade, slide, zoom
9. THE Admin_System SHALL persist gallery settings per page (activity, event, accommodation, room_type, custom, memory)
10. THE Admin_System SHALL provide a preview of the selected display mode in the admin interface

**Note:** Photo moderation workflow (approve/reject/delete) is already implemented in `app/admin/photos/page.tsx` and `services/photoService.ts`. Gallery settings service is already implemented in `services/gallerySettingsService.ts`.

### Requirement 34: Transportation Management UI

**User Story:** As an admin, I want to view and manage transportation manifests, so that I can coordinate guest arrivals and departures.

#### Acceptance Criteria

1. WHEN an admin views the transportation page, THE Admin_System SHALL display tabs for Arrivals and Departures
2. WHEN an admin selects a date, THE Admin_System SHALL generate manifests grouped by time windows
3. WHEN an admin views an arrival manifest, THE Admin_System SHALL display guest name, flight number, arrival time, and airport
4. WHEN an admin views a departure manifest, THE Admin_System SHALL display guest name, flight number, departure time, and airport
5. WHEN an admin filters by airport, THE Admin_System SHALL display only guests using that airport (SJO, LIR, Other)
6. WHEN an admin assigns a shuttle, THE Admin_System SHALL validate capacity and create the assignment
7. WHEN an admin views vehicle requirements, THE Admin_System SHALL calculate required vehicles based on guest count
8. WHEN an admin generates a driver sheet, THE Admin_System SHALL include all guest details, pickup/dropoff locations, and special requests
9. WHEN an admin prints a manifest, THE Admin_System SHALL generate a printer-friendly format
10. THE Admin_System SHALL display total shuttle costs based on vehicle requirements

**Note:** Transportation service is already implemented in `services/transportationService.ts` with manifest generation, vehicle calculations, and driver sheets.

### Requirement 35: Vendor-to-Activity Booking Integration

**User Story:** As an admin, I want to link vendors to specific activities and events, so that I can track which vendors are providing services for each occasion.

#### Acceptance Criteria

1. WHEN an admin creates an activity, THE Admin_System SHALL provide a vendor selection interface
2. WHEN an admin selects vendors for an activity, THE Admin_System SHALL create vendor bookings
3. WHEN an admin views an activity, THE Admin_System SHALL display all booked vendors with their categories
4. WHEN an admin views a vendor, THE Admin_System SHALL display all activities/events using that vendor
5. WHEN an admin removes a vendor from an activity, THE Admin_System SHALL delete the booking without deleting the vendor
6. WHEN an admin updates a vendor's cost, THE Admin_System SHALL propagate the change to budget calculations
7. WHEN an admin creates a vendor booking, THE Admin_System SHALL validate the vendor and activity/event exist
8. WHEN an admin views vendor bookings, THE Admin_System SHALL display booking date, vendor name, and activity/event name
9. THE Admin_System SHALL support linking vendors to both activities and events
10. THE Admin_System SHALL support adding notes to vendor bookings

**Note:** Vendor booking service is already implemented in `services/vendorBookingService.ts` with full CRUD operations and cost propagation.

### Requirement 36: Audit Logs Management Interface

**User Story:** As an admin, I want to view and search audit logs, so that I can track all system changes and user actions for accountability.

#### Acceptance Criteria

1. WHEN an admin views the audit logs page, THE Admin_System SHALL display all audit log entries in reverse chronological order
2. WHEN an admin filters by user, THE Admin_System SHALL display only logs for the selected user
3. WHEN an admin filters by action type, THE Admin_System SHALL display only logs matching the selected action (create, update, delete, login, etc.)
4. WHEN an admin filters by entity type, THE Admin_System SHALL display only logs for the selected entity (guest, event, activity, vendor, etc.)
5. WHEN an admin filters by date range, THE Admin_System SHALL display only logs within the specified date range
6. WHEN an admin searches by description, THE Admin_System SHALL search log descriptions and return matching results
7. WHEN an admin views a log entry, THE Admin_System SHALL display: timestamp, user, action type, entity type, entity ID, description, and metadata
8. WHEN an admin clicks on an entity reference in a log, THE Admin_System SHALL navigate to that entity's detail page
9. WHEN an admin exports audit logs, THE Admin_System SHALL generate a CSV file with all filtered logs
10. THE Admin_System SHALL support pagination with 50 logs per page
11. THE Admin_System SHALL display logs in a read-only interface (no editing or deletion)
12. THE Admin_System SHALL highlight critical actions (delete, permission changes) in warning colors

**Note:** Audit log service is already implemented in `services/auditLogService.ts` with automatic logging of all admin actions.

### Requirement 37: RSVP Analytics Dashboard

**User Story:** As an admin, I want to view RSVP analytics and trends, so that I can understand guest response patterns and plan accordingly.

#### Acceptance Criteria

1. WHEN an admin views the RSVP analytics dashboard, THE Admin_System SHALL display overall response rate percentage
2. WHEN an admin views response breakdown, THE Admin_System SHALL display counts for: attending, declined, maybe, pending
3. WHEN an admin views response rate by event, THE Admin_System SHALL display response rate for each event with visual progress bars
4. WHEN an admin views response rate by activity, THE Admin_System SHALL display response rate for each activity with capacity utilization
5. WHEN an admin views response trends, THE Admin_System SHALL display a timeline chart showing RSVPs over time
6. WHEN an admin views capacity utilization, THE Admin_System SHALL display activities at 90%+ capacity with warning indicators
7. WHEN an admin views attendance forecasting, THE Admin_System SHALL calculate expected attendance based on current response rates
8. WHEN an admin filters by guest type, THE Admin_System SHALL recalculate all metrics for the selected guest type
9. WHEN an admin filters by date range, THE Admin_System SHALL show response trends within the specified range
10. WHEN an admin views pending reminders, THE Admin_System SHALL display count of guests who haven't responded and are past deadline
11. THE Admin_System SHALL display visual charts: pie chart for response breakdown, line chart for trends, bar chart for per-event rates
12. THE Admin_System SHALL provide "Send Reminder" quick action for guests with pending RSVPs

**Note:** RSVP analytics service is already implemented in `services/rsvpAnalyticsService.ts` with response rate calculations and forecasting.

## Already Implemented Features

The following features are already fully implemented in the backend and do not require new requirements:

### Photo Management (Complete)
- **Photo Upload Service** (`services/photoService.ts`): Upload to B2 with Supabase fallback, batch uploads, metadata management
- **Photo Moderation UI** (`app/admin/photos/page.tsx`): Approve/reject/delete workflow with real-time updates
- **Gallery Settings Service** (`services/gallerySettingsService.ts`): Display mode configuration (gallery/carousel/loop), photos per row, captions, autoplay
- **Storage Integration**: Dual storage with B2 primary and Supabase fallback

### Transportation Management (Complete)
- **Transportation Service** (`services/transportationService.ts`): Flight info updates, manifest generation, vehicle calculations, driver sheets
- **Manifest Generation**: Automatic grouping by time windows for arrivals and departures
- **Vehicle Requirements**: Automatic calculation based on guest count with cost estimates
- **Driver Sheets**: Printable sheets with guest details and special requests

### Vendor Management (Complete)
- **Vendor Service** (`services/vendorService.ts`): Full CRUD, payment tracking, pricing models (flat rate, per guest)
- **Vendor Booking Service** (`services/vendorBookingService.ts`): Link vendors to activities/events, cost propagation
- **Payment Tracking**: Record payments, calculate balances, update payment status (unpaid/partial/paid)

## Out of Scope

The following features are explicitly out of scope for this specification:

1. Guest portal features (already implemented)
2. Email template design (use existing templates)
3. Real-time collaboration (multiple admins editing simultaneously)
4. Mobile app development
5. Third-party integrations beyond existing (Resend, B2, Gemini)
6. Payment processing integration (credit card processing)
7. Guest check-in/check-out system
8. Inventory management for activities
9. Automated scheduling optimization
10. Photo editing tools (cropping, filters, etc.)
