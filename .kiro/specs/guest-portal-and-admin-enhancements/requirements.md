# Requirements Document

## Introduction

This specification defines comprehensive enhancements to both the admin dashboard and guest-facing portal for the Costa Rica Wedding Management System. The admin enhancements focus on improved navigation, inline RSVP management, user management, email communication tools, and a flexible home page section manager. The guest portal provides a complete self-service experience for wedding guests to view information, manage RSVPs, upload photos, and access all wedding-related details through two authentication methods: email matching and magic link passwordless login.

**Implementation Strategy**: This spec is designed for parallel implementation - admin-side work (Requirements 1-4, 21-22) and guest-side work (Requirements 5-20) can proceed simultaneously as they use existing backend services and have minimal interdependencies.

## Glossary

- **Admin_User**: A user with administrative privileges who can manage wedding data, guests, and content
- **Guest_User**: A wedding guest who accesses the portal to view information and manage their attendance
- **RSVP**: Response indicating attendance status (attending, declined, maybe, pending)
- **Activity**: A specific wedding event or activity that guests can RSVP to
- **Event**: A collection of activities organized by date and time
- **Content_Page**: A custom page created by admins with rich text and photos
- **Section**: A content block within a page (two-column layout with text and media)
- **Reference_Block**: A section component that links to other entities (events, activities, content pages, accommodations)
- **Group**: A family or party group that shares access and management
- **Inline_Editing**: Editing data directly in a list view without opening a separate form
- **Top_Navigation**: Horizontal navigation bar at the top of the admin interface
- **Guest_Portal**: The guest-facing website where guests access wedding information
- **Email_Matching**: Authentication method where guests log in with an email that matches their guest record
- **Magic_Link**: Passwordless authentication method where guests receive a one-time login link via email
- **Section_Manager**: The flexible content editor that allows arranging text, photos, and reference blocks on pages

## Requirements

### Requirement 1: Admin Navigation Redesign

**User Story:** As an admin user, I want a modern horizontal navigation system, so that I can quickly access different sections of the admin dashboard.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a horizontal top navigation bar with main tabs: Content, Guests, RSVPs, Logistics, Admin
2. WHEN an admin clicks a main tab, THE System SHALL display sub-navigation items specific to that tab
3. WHEN viewing the Content tab, THE System SHALL show sub-items: Home Page, Activities, Events, Content Pages, Locations, Photos
4. WHEN viewing the Guests tab, THE System SHALL show sub-items: Guest List, Guest Groups, Import/Export
5. WHEN viewing the RSVPs tab, THE System SHALL show sub-items: RSVP Analytics, Activity RSVPs, Event RSVPs, Deadlines
6. WHEN viewing the Logistics tab, THE System SHALL show sub-items: Accommodations, Transportation, Budget, Vendors
7. WHEN viewing the Admin tab, THE System SHALL show sub-items: Admin Users, Settings, Email Templates, Audit Logs
8. WHEN the viewport width is less than 768px, THE System SHALL display a mobile-responsive navigation menu
9. THE System SHALL highlight the currently active tab and sub-item
10. THE System SHALL persist navigation state when navigating between pages within the same tab

### Requirement 2: Inline RSVP Management

**User Story:** As an admin user, I want to manage guest RSVPs directly from the guest list, so that I can quickly update attendance without opening multiple forms.

#### Acceptance Criteria

1. WHEN viewing the guest list, THE System SHALL display expandable sections for each guest showing Activities, Events, and Accommodations
2. WHEN an admin clicks the Activities section for a guest, THE System SHALL display all activities with inline RSVP status controls
3. WHEN an admin clicks the Events section for a guest, THE System SHALL display all events with inline RSVP status controls
4. WHEN an admin clicks an RSVP status control, THE System SHALL toggle between attending (checkmark), maybe (?), and declined (x)
5. WHEN an admin changes an RSVP status, THE System SHALL save the change immediately or display a save button
6. THE System SHALL display guest count fields inline for activities that require headcount
7. THE System SHALL display dietary restrictions fields inline for activities that include meals
8. WHEN viewing the Accommodations section, THE System SHALL display current room assignments with inline editing capability
9. THE System SHALL validate capacity constraints when updating RSVPs inline
10. THE System SHALL display visual feedback (loading spinner, success indicator) when saving inline changes

### Requirement 3: Admin User Management

**User Story:** As an admin user, I want to manage other admin users, so that I can control who has access to the admin dashboard.

#### Acceptance Criteria

1. THE System SHALL provide an interface to add new admin users by email address
2. WHEN adding an admin user, THE System SHALL send an invitation email with account setup instructions
3. THE System SHALL support two admin roles: admin and owner
4. WHEN assigning roles, THE System SHALL restrict certain actions to owner role only (delete wedding, manage billing)
5. THE System SHALL display a list of all admin users with their email, role, and status
6. THE System SHALL allow owners to deactivate admin accounts without deleting them
7. THE System SHALL allow owners to delete admin accounts permanently
8. WHEN an admin account is deactivated, THE System SHALL prevent that user from logging in
9. THE System SHALL log all admin user management actions in the audit log
10. THE System SHALL prevent the last owner account from being deleted or deactivated

### Requirement 4: Email Management and Guest Communication

**User Story:** As an admin user, I want to compose and send emails to guests, so that I can communicate important information and updates.

#### Acceptance Criteria

1. THE System SHALL provide an email composition interface with rich text editing
2. THE System SHALL allow admins to select recipients: individual guests, guest groups, or all guests
3. THE System SHALL support email templates with variable substitution (guest name, event details, RSVP links)
4. WHEN composing an email, THE System SHALL display a preview of the email with variables populated
5. THE System SHALL allow admins to send emails immediately or schedule them for future delivery
6. THE System SHALL display email history showing all sent emails with delivery status
7. THE System SHALL track email delivery status using webhook integration with the email service
8. THE System SHALL support automated email triggers for RSVP confirmations, activity reminders, and deadline notifications
9. WHEN a guest submits an RSVP, THE System SHALL automatically send a confirmation email
10. THE System SHALL allow admins to enable/disable automated email triggers per event or activity

### Requirement 5: Guest Authentication and Discovery

**User Story:** As a guest user, I want to discover and access the wedding portal, so that I can view personalized wedding information and manage my attendance.

#### Acceptance Criteria

1. THE System SHALL support two authentication methods for guests: Email Matching and Magic Link
2. WHEN using Email Matching, THE System SHALL authenticate guests by matching their login email to their guest record email
3. WHEN using Magic Link, THE System SHALL send a one-time passwordless login link to the guest's email
4. THE System SHALL allow admins to configure which authentication method is enabled globally
5. THE System SHALL allow admins to override authentication method per individual guest
6. WHEN a guest receives a wedding invitation, THE System SHALL include portal access instructions with the appropriate authentication method
7. WHEN a guest first visits the portal, THE System SHALL display a welcome screen explaining how to log in
8. WHEN using Email Matching, THE System SHALL validate that the entered email exists in the guest database
9. WHEN using Magic Link, THE System SHALL generate a secure token valid for 15 minutes
10. THE System SHALL display clear error messages when authentication fails (email not found, link expired, etc.)

**Guest Discovery Journey**:
- Guests receive a physical or email invitation containing portal URL and login instructions
- For Email Matching: "Visit [URL] and log in with your email: [guest@example.com]"
- For Magic Link: "Visit [URL] and request a login link - we'll email it to you"
- First-time visitors see a welcome page explaining the portal features and how to access them
- After successful login, guests land on their personalized dashboard

### Requirement 6: Guest Profile and Family Management

**User Story:** As a guest group owner (e.g., an adult in a family), I want to view and update profile information and RSVP status for myself and all members of my group, so that I can manage my family's attendance and the wedding coordinators have current details for everyone.

#### Acceptance Criteria

1. WHEN a guest logs in, THE System SHALL display personalized content based on their group membership and RSVP status
2. THE System SHALL allow guests to view their own profile information (name, email, group, dietary restrictions)
3. THE System SHALL display all family members (group members) with their profile information and RSVP status
4. THE System SHALL allow group owners to update contact information (email, phone number) for all members in their group
5. THE System SHALL allow group owners to update dietary restrictions for all members in their group
6. THE System SHALL allow group owners to manage RSVP status (attending, declined, maybe) for all members in their group
7. THE System SHALL allow group owners to update guest counts and plus-ones for all members in their group if permitted by the admin
8. WHEN a guest updates any profile or RSVP information, THE System SHALL save changes immediately and display confirmation
9. THE System SHALL display a family member list with expandable sections showing detailed information and RSVP status for each member
10. THE System SHALL enforce Row Level Security to ensure guests can only view and edit data for their own group members
11. THE System SHALL provide a logout function that clears the session
12. THE System SHALL send email notifications to admins when guests update critical information (dietary restrictions, plus-ones, RSVP changes)

**Group Owner Permissions**: 
- Group owners (typically adults) have full management capabilities for all members in their group
- This allows parents to manage RSVPs and information for their children
- This allows one family member to coordinate attendance for the entire family
- All group members can view information, but group owners can edit on behalf of others

**Integration Note**: Uses existing components and services:
- `FamilyManager.tsx` for group member management
- `GuestService` for profile updates
- `RSVPService` for RSVP management
- Existing RLS policies ensure guests can only access their group's data
- Group owner permissions are enforced through RLS policies based on group membership

### Requirement 7: Guest Portal Home Page

**User Story:** As a guest user, I want to see a welcoming home page with key information, so that I can quickly understand the wedding details and navigate to important sections.

#### Acceptance Criteria

1. WHEN a guest logs in, THE System SHALL display a home page with a personalized welcome message
2. THE Home_Page SHALL display the wedding date, location, and venue information
3. THE Home_Page SHALL display important dates (RSVP deadline, accommodation booking deadline)
4. THE Home_Page SHALL display quick links to key sections (RSVP, Activities, Accommodations, Photos)
5. THE Home_Page SHALL display the guest's current RSVP status summary (events attending, activities confirmed)
6. THE Home_Page SHALL display upcoming activities the guest is attending in chronological order
7. THE Home_Page SHALL use the tropical Costa Rica theme with consistent styling
8. THE Home_Page SHALL be mobile-responsive for viewing on phones and tablets
9. THE Home_Page SHALL display any urgent announcements or updates from the admin
10. THE Home_Page SHALL load within 2 seconds on standard broadband connections

**Integration Note**: The guest home page uses existing components:
- `GuestDashboard.tsx` for layout and personalization
- `SectionRenderer.tsx` for rendering admin-configured content sections
- Existing services (EventService, ActivityService, RSVPService) for data retrieval

### Requirement 8: Guest Content Pages

**User Story:** As a guest user, I want to view custom content pages created by admins, so that I can learn about the wedding story, venue details, and other important information.

#### Acceptance Criteria

1. THE System SHALL display all published content pages in the guest portal navigation
2. WHEN a guest clicks a content page link, THE System SHALL render the page with rich text content and photos
3. THE System SHALL render sections in a two-column layout as configured by the admin
4. THE System SHALL display photo galleries embedded in content pages with multiple display modes (grid, carousel, slideshow)
5. THE System SHALL support cross-references between content pages using Reference_Block components
6. WHEN a guest clicks a reference link, THE System SHALL navigate to the referenced page or section
7. THE System SHALL display a breadcrumb navigation showing the current page location
8. THE System SHALL provide a search function to find content across all pages
9. THE System SHALL be mobile-responsive with single-column layout on small screens
10. THE System SHALL cache content pages for fast loading on subsequent visits

**Integration Note**: Uses existing components and routes:
- `app/[type]/[slug]/page.tsx` for dynamic content page routing
- `SectionRenderer.tsx` for rendering page sections
- `PhotoGallery.tsx` for embedded photo galleries
- `ReferenceDisplay.tsx` for cross-reference links
- `ContentPagesService` for data retrieval

### Requirement 9: Guest Events and Activities View

**User Story:** As a guest user, I want to view all events and activities I'm invited to, so that I can plan my attendance and understand the wedding schedule.

#### Acceptance Criteria

1. THE System SHALL display a list of all events the guest is invited to
2. WHEN viewing an event, THE System SHALL display the event date, time, location, and description
3. THE System SHALL display all activities within each event
4. WHEN viewing an activity, THE System SHALL display capacity, cost, requirements, and description
5. THE System SHALL indicate which activities the guest has RSVP'd to with visual status indicators
6. THE System SHALL allow filtering events by date range
7. THE System SHALL allow filtering activities by type (ceremony, reception, meal, transport, activity)
8. THE System SHALL display a calendar view of all events and activities
9. THE System SHALL display the guest's personalized itinerary showing only their confirmed activities
10. THE System SHALL allow guests to export their itinerary as a PDF

**Integration Note**: Uses existing components and routes:
- `app/event/[id]/page.tsx` for event detail pages
- `app/activity/[id]/page.tsx` for activity detail pages
- `ItineraryViewer.tsx` for personalized itinerary display
- `EventService` and `ActivityService` for data retrieval
- `RSVPService` for RSVP status

### Requirement 10: Guest RSVP System

**User Story:** As a guest user, I want to RSVP to events and activities, so that I can confirm my attendance and provide necessary information.

#### Acceptance Criteria

1. THE System SHALL allow guests to RSVP to events with status: attending, declined, or maybe
2. THE System SHALL allow guests to RSVP to individual activities within events
3. WHEN RSVPing to an activity, THE System SHALL require the guest to specify guest count if applicable
4. WHEN RSVPing to a meal activity, THE System SHALL prompt for dietary restrictions
5. THE System SHALL enforce RSVP deadlines and prevent changes after the deadline
6. THE System SHALL display remaining capacity for activities with capacity limits
7. THE System SHALL prevent RSVPs when an activity is at full capacity
8. THE System SHALL allow guests to add plus-ones if permitted by the activity settings
9. WHEN a guest submits an RSVP, THE System SHALL send a confirmation email
10. THE System SHALL allow guests to edit their RSVPs before the deadline

**Integration Note**: Uses existing components:
- `RSVPManager.tsx` for RSVP interface
- `RSVPService` for RSVP operations
- `EmailService` for confirmation emails
- Existing RLS policies ensure guests can only modify their own RSVPs

### Requirement 11: Guest Transportation Information

**User Story:** As a guest user, I want to view and provide transportation details, so that I can coordinate travel with the wedding party.

#### Acceptance Criteria

1. THE System SHALL display transportation information including airport details and shuttle schedules
2. THE System SHALL allow guests to provide their arrival flight details (airline, flight number, arrival time)
3. THE System SHALL allow guests to provide their departure flight details
4. THE System SHALL display shuttle assignments if the guest is assigned to a shuttle
5. THE System SHALL display pickup and dropoff locations for assigned shuttles
6. THE System SHALL allow guests to request transportation assistance
7. THE System SHALL display a map showing airport locations and venue locations
8. THE System SHALL send confirmation emails when transportation details are updated
9. THE System SHALL display transportation costs if guests are responsible for payment
10. THE System SHALL allow guests to update transportation details up to 48 hours before arrival

**Integration Note**: Uses existing components:
- `TransportationForm.tsx` for flight detail input
- `TransportationService` for data management
- Existing routes in `app/guest/transportation/`

### Requirement 12: Guest Accommodation Information

**User Story:** As a guest user, I want to view my accommodation assignment, so that I know where I'm staying.

#### Acceptance Criteria

1. THE System SHALL display the guest's assigned accommodation with room type and details
2. THE System SHALL display accommodation amenities and features
3. THE System SHALL display check-in and check-out dates and times
4. THE System SHALL display accommodation address and contact information
5. THE System SHALL display accommodation costs and payment information
6. THE System SHALL allow guests to request accommodation changes
7. THE System SHALL display a map showing accommodation location relative to venue
8. THE System SHALL display roommate information if sharing a room
9. THE System SHALL provide booking confirmation details
10. THE System SHALL display accommodation policies (cancellation, deposits, etc.)

**Integration Note**: Uses existing components:
- `AccommodationViewer.tsx` for accommodation display
- `AccommodationService` for data retrieval
- Existing routes in `app/guest/accommodation/`

### Requirement 13: Guest Photo Gallery

**User Story:** As a guest user, I want to view and upload wedding photos, so that I can share memories with other guests.

#### Acceptance Criteria

1. THE System SHALL display all approved photos in a gallery view
2. THE System SHALL allow guests to upload photos with captions
3. WHEN a guest uploads a photo, THE System SHALL submit it for admin moderation
4. THE System SHALL display upload status (pending, approved, rejected)
5. THE System SHALL allow filtering photos by event or activity
6. THE System SHALL display photos in multiple view modes (grid, carousel, slideshow)
7. THE System SHALL allow guests to download photos
8. THE System SHALL display photo metadata (uploader, date, event)
9. THE System SHALL enforce file size limits (max 10MB per photo)
10. THE System SHALL support batch photo uploads (up to 20 photos at once)

**Integration Note**: Uses existing components:
- `PhotoGallery.tsx` and `EnhancedPhotoGallery.tsx` for photo display
- `PhotoUpload.tsx` for guest photo uploads
- `PhotoService` for photo operations
- Existing routes in `app/guest/photos/`
- B2Service for photo storage

### Requirement 15: Guest Contact Information

**User Story:** As a guest user, I want to access contact information for coordinators and venues, so that I can get help when needed.

#### Acceptance Criteria

1. THE System SHALL display wedding coordinator contact information (name, email, phone)
2. THE System SHALL display venue contact information
3. THE System SHALL display emergency contact information
4. THE System SHALL provide a contact form to send messages to coordinators
5. THE System SHALL display frequently asked questions (FAQ)
6. THE System SHALL allow guests to search the FAQ
7. THE System SHALL display local emergency services contact information (police, hospital)
8. THE System SHALL display timezone information for Costa Rica
9. THE System SHALL display currency and payment information
10. THE System SHALL provide links to local resources (weather, attractions, restaurants)

**Integration Note**: Contact information can be stored in:
- Settings table for coordinator contacts
- Content pages for FAQ and local resources
- Venue/location data for venue contacts

### Requirement 14: Service Integration and Data Flow

**User Story:** As a system architect, I want all guest portal features to use existing backend services, so that data remains consistent across admin and guest interfaces.

#### Acceptance Criteria

1. THE Guest_Portal SHALL use RSVPService for all RSVP operations (create, update, list)
2. THE Guest_Portal SHALL use EventService for event data retrieval (list, get by ID)
3. THE Guest_Portal SHALL use ActivityService for activity data retrieval (list, get by ID, capacity checks)
4. THE Guest_Portal SHALL use AccommodationService for accommodation data (guest assignments, room details)
5. THE Guest_Portal SHALL use TransportationService for transportation data (flight details, shuttle assignments)
6. THE Guest_Portal SHALL use PhotoService for photo gallery operations (list approved, upload, moderation status)
7. THE Guest_Portal SHALL use EmailService for email notifications (RSVP confirmations, updates)
8. THE Guest_Portal SHALL use ContentPagesService for content page rendering (get by slug, list published)
9. THE Guest_Portal SHALL use SectionsService for section rendering (get by page, render content)
10. THE Guest_Portal SHALL enforce Row Level Security policies for all data access

**Existing Services Available**:
- `guestService.ts` - Guest profile management
- `rsvpService.ts` - RSVP operations
- `eventService.ts` - Event data
- `activityService.ts` - Activity data
- `accommodationService.ts` - Accommodation assignments
- `transportationService.ts` - Flight and shuttle data
- `photoService.ts` - Photo operations
- `emailService.ts` - Email sending
- `contentPagesService.ts` - Content page CRUD
- `sectionsService.ts` - Section management
- `itineraryService.ts` - Personalized itinerary generation

**Existing Components Available**:
- `GuestDashboard.tsx` - Main dashboard layout
- `RSVPManager.tsx` - RSVP interface
- `ItineraryViewer.tsx` - Itinerary display
- `AccommodationViewer.tsx` - Accommodation details
- `TransportationForm.tsx` - Flight detail input
- `PhotoGallery.tsx` - Photo display
- `PhotoUpload.tsx` - Photo upload interface
- `SectionRenderer.tsx` - Section rendering
- `ReferenceDisplay.tsx` - Cross-reference links
- `FamilyManager.tsx` - Group member management

**Existing Routes Available**:
- `app/guest/dashboard/` - Guest dashboard
- `app/guest/rsvp/` - RSVP management
- `app/guest/itinerary/` - Itinerary view
- `app/guest/accommodation/` - Accommodation info
- `app/guest/transportation/` - Transportation details
- `app/guest/photos/` - Photo gallery
- `app/guest/family/` - Family group management
- `app/activity/[id]/` - Activity detail page
- `app/event/[id]/` - Event detail page
- `app/[type]/[slug]/` - Dynamic content pages

**Integration Work Needed**:
- Wire up existing components to routes
- Ensure RLS policies are enforced
- Add navigation between pages
- Implement authentication flow
- Add error handling and loading states

### Requirement 16: Responsive Design and Accessibility

**User Story:** As a guest user, I want the portal to work well on my mobile device, so that I can access information on the go.

#### Acceptance Criteria

1. THE Guest_Portal SHALL be fully responsive for viewport widths from 320px to 2560px
2. THE Guest_Portal SHALL use mobile-first design principles
3. THE Guest_Portal SHALL provide touch-friendly controls on mobile devices (minimum 44px touch targets)
4. THE Guest_Portal SHALL meet WCAG 2.1 AA accessibility standards
5. THE Guest_Portal SHALL support keyboard navigation for all interactive elements
6. THE Guest_Portal SHALL provide appropriate ARIA labels for screen readers
7. THE Guest_Portal SHALL maintain color contrast ratios of at least 4.5:1 for text
8. THE Guest_Portal SHALL support browser zoom up to 200% without breaking layout
9. THE Guest_Portal SHALL load critical content within 3 seconds on 3G connections
10. THE Guest_Portal SHALL work in modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

### Requirement 17: Admin Email Template Management

**User Story:** As an admin user, I want to create and manage email templates, so that I can send consistent communications to guests.

#### Acceptance Criteria

1. THE System SHALL provide an interface to create email templates with rich text editing
2. THE System SHALL support template variables: {{guest_name}}, {{event_name}}, {{rsvp_link}}, {{deadline_date}}
3. THE System SHALL allow admins to preview templates with sample data
4. THE System SHALL allow admins to save templates with descriptive names
5. THE System SHALL provide default templates for common scenarios (RSVP confirmation, reminder, deadline)
6. THE System SHALL allow admins to edit existing templates
7. THE System SHALL allow admins to delete templates that are not in use
8. THE System SHALL prevent deletion of templates that are referenced by automated triggers
9. THE System SHALL validate template syntax before saving
10. THE System SHALL display a list of all templates with usage statistics

### Requirement 18: Admin Inline Editing Performance

**User Story:** As an admin user, I want inline editing to be fast and responsive, so that I can efficiently manage large guest lists.

#### Acceptance Criteria

1. WHEN loading the guest list with inline editing, THE System SHALL render within 2 seconds for up to 500 guests
2. WHEN expanding a guest's RSVP section, THE System SHALL load activity data within 500ms
3. WHEN saving an inline RSVP change, THE System SHALL complete within 1 second
4. THE System SHALL use optimistic UI updates to show changes immediately
5. THE System SHALL batch multiple inline changes for efficient database updates
6. THE System SHALL use pagination to limit rendered guests to 50 per page
7. THE System SHALL provide infinite scroll or "load more" for additional guests
8. THE System SHALL debounce inline text input to reduce unnecessary API calls
9. THE System SHALL cache guest RSVP data to avoid redundant fetches
10. THE System SHALL display loading indicators for async operations

### Requirement 19: Guest Portal Performance

**User Story:** As a guest user, I want the portal to load quickly, so that I can access information without waiting.

#### Acceptance Criteria

1. THE Guest_Portal home page SHALL load within 2 seconds on standard broadband
2. THE Guest_Portal SHALL use server-side rendering for initial page load
3. THE Guest_Portal SHALL prefetch critical resources (fonts, images, scripts)
4. THE Guest_Portal SHALL lazy-load images below the fold
5. THE Guest_Portal SHALL use code splitting to reduce initial bundle size
6. THE Guest_Portal SHALL cache static assets for 1 year
7. THE Guest_Portal SHALL use CDN for photo delivery
8. THE Guest_Portal SHALL compress images to WebP format when supported
9. THE Guest_Portal SHALL achieve a Lighthouse performance score of 90+
10. THE Guest_Portal SHALL use service workers for offline content caching

### Requirement 20: Admin Navigation State Management

**User Story:** As an admin user, I want the navigation to remember my location, so that I don't lose my place when navigating.

#### Acceptance Criteria

1. THE System SHALL persist the active tab in browser session storage
2. THE System SHALL persist the active sub-item in browser session storage
3. WHEN an admin refreshes the page, THE System SHALL restore the previous navigation state
4. WHEN an admin navigates back using browser history, THE System SHALL update navigation state
5. THE System SHALL update the browser URL to reflect the current navigation state
6. THE System SHALL support deep linking to specific admin pages
7. THE System SHALL display breadcrumb navigation showing the current location
8. THE System SHALL highlight the active tab and sub-item with distinct styling
9. THE System SHALL animate tab transitions smoothly
10. THE System SHALL maintain scroll position when navigating between pages in the same tab

### Requirement 20: Guest Portal Security

**User Story:** As a system administrator, I want the guest portal to be secure, so that guest data is protected.

#### Acceptance Criteria

1. THE Guest_Portal SHALL enforce Row Level Security for all database queries
2. THE Guest_Portal SHALL validate all user input on both client and server
3. THE Guest_Portal SHALL sanitize all user-generated content to prevent XSS attacks
4. THE Guest_Portal SHALL use HTTPS for all connections
5. THE Guest_Portal SHALL implement CSRF protection for all form submissions
6. THE Guest_Portal SHALL rate-limit API requests to prevent abuse (100 requests per minute per user)
7. THE Guest_Portal SHALL log all authentication attempts
8. THE Guest_Portal SHALL expire guest sessions after 24 hours of inactivity
9. THE Guest_Portal SHALL prevent SQL injection through parameterized queries
10. THE Guest_Portal SHALL implement Content Security Policy headers

### Requirement 21: Admin Home Page Section Manager

**User Story:** As an admin user, I want to arrange content on the admin home page using a flexible section manager, so that I can customize what guests see when they first log in.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a "Manage Home Page" interface accessible from the Content tab
2. THE Section_Manager SHALL allow admins to add, edit, reorder, and delete sections on the home page
3. THE Section_Manager SHALL support rich text content sections with two-column layouts
4. THE Section_Manager SHALL support photo gallery sections with multiple display modes
5. THE Section_Manager SHALL support Reference_Block sections that link to Events, Activities, Content Pages, and Accommodations
6. WHEN adding a Reference_Block, THE System SHALL display a searchable list of available entities to reference
7. WHEN a Reference_Block is added, THE System SHALL display a preview showing how it will appear to guests
8. THE Section_Manager SHALL validate that referenced entities exist before saving
9. THE Section_Manager SHALL detect and prevent circular references between pages
10. THE Section_Manager SHALL auto-save drafts every 30 seconds and provide a "Publish" button to make changes live

**Implementation Note**: This requirement extends the existing Section_Manager functionality (currently used for content pages) to work with the admin home page. The reference block functionality is NEW and has not been implemented yet - it needs to be built from scratch.

**Existing Components to Leverage**:
- `SectionEditor.tsx` - Core section editing interface (needs reference block support added)
- `SectionsService` - Section CRUD operations (needs reference validation added)
- `ReferenceDisplay.tsx` - Guest-facing reference rendering (exists but may need enhancement)
- `useSectionData.ts` - Hook for section data management

**New Components Needed**:
- Reference block picker/selector UI
- Reference validation logic
- Reference preview component

### Requirement 22: Guest Authentication Method Toggle

**User Story:** As an admin user, I want to configure which authentication method guests use, so that I can choose between email matching and magic link based on my needs.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL provide a global authentication settings page under Admin > Settings
2. THE Settings_Page SHALL allow admins to select the default authentication method: Email Matching or Magic Link
3. THE Settings_Page SHALL allow admins to override authentication method for individual guests
4. WHEN Email Matching is selected, THE System SHALL authenticate guests by matching login email to guest record email
5. WHEN Magic Link is selected, THE System SHALL send passwordless login links via email
6. THE System SHALL display the current authentication method on the guest list page
7. THE System SHALL allow bulk updating authentication method for multiple guests
8. WHEN changing authentication method, THE System SHALL send notification emails to affected guests with new login instructions
9. THE System SHALL log all authentication method changes in the audit log
10. THE System SHALL validate that guest email addresses are valid before enabling Magic Link authentication

**Implementation Note**: This is a NEW feature that requires:
- New database field: `guests.auth_method` (enum: 'email_matching' | 'magic_link')
- New settings table field: `settings.default_auth_method`
- New authentication flow logic in auth routes
- Email template updates for login instructions
- UI components for authentication method selection

### Requirement 23: Rich Text Editor Replacement with Lexkit

**User Story:** As an admin user, I want a performant and reliable rich text editor, so that I can efficiently create and edit content without performance issues.

#### Acceptance Criteria

1. THE System SHALL replace the current custom `contentEditable`-based RichTextEditor with Lexkit editor (`@lexkit/editor` v0.0.38)
2. THE Lexkit_Editor SHALL support all existing formatting features: bold, italic, underline, headings (h1, h2, h3), lists (bullet, numbered), links, images, tables, and dividers
3. THE Lexkit_Editor SHALL maintain the existing slash command functionality for quick formatting (/heading1, /heading2, /heading3, /list, /numbered, /table, /link, /image, /divider)
4. THE Lexkit_Editor SHALL integrate with the existing PhotoPicker component for image insertion (modal dialog with photo selection)
5. THE Lexkit_Editor SHALL maintain the same API interface (`value`, `onChange`, `placeholder`, `disabled`, `pageType`, `pageId` props) for backward compatibility
6. THE Lexkit_Editor SHALL sanitize content using the existing `sanitizeRichText` utility from `@/utils/sanitization`
7. THE Lexkit_Editor SHALL support keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline, Ctrl+K for links)
8. THE Lexkit_Editor SHALL provide better performance than the current editor (faster typing, no lag on large documents, no 300ms debounce needed)
9. THE Lexkit_Editor SHALL maintain accessibility features (ARIA labels, keyboard navigation, screen reader support)
10. THE System SHALL update all existing usages of RichTextEditor to use the new Lexkit-based implementation without breaking changes

**Implementation Note**: This is a REPLACEMENT of existing functionality:
- **Package Status**: `@lexkit/editor` v0.0.38 is ALREADY INSTALLED in package.json
- Replace `components/admin/RichTextEditor.tsx` implementation with Lexkit-based editor
- Maintain backward compatibility - same component name, same props interface
- Keep existing features: toolbar, slash commands, link dialog, image picker integration
- Remove custom `contentEditable` implementation and debouncing logic
- Update tests to work with Lexkit editor (may need to mock Lexkit components)

**Current RichTextEditor Features to Preserve**:
- Formatting toolbar with buttons (Bold, Italic, Underline, Lists, Image, Link, Table, Divider)
- Slash command menu with keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- Link insertion dialog with URL and text inputs
- Image picker integration (opens PhotoPicker modal, inserts selected images)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
- Debounced onChange (300ms) - may not be needed with Lexkit's better performance
- Content sanitization on save
- Disabled state support
- Placeholder text support
- Page type and page ID props for photo filtering

**Existing Usages to Update** (no API changes needed):
- `components/admin/SectionEditor.tsx` - Section content editing (line ~400)
- `components/admin/ContentPageForm.tsx` - Content page editing
- `components/admin/EmailComposer.tsx` - Email composition
- Any other components using RichTextEditor

**Performance Goals**:
- Typing latency < 16ms (60fps) - eliminate current lag issues
- No lag on documents up to 10,000 words
- Smooth scrolling and cursor movement
- Efficient re-renders on content changes
- Remove need for 300ms debounce timer

**Migration Strategy**:
1. Create new Lexkit-based implementation in same file (`RichTextEditor.tsx`)
2. Test with SectionEditor first (most complex usage)
3. Verify all features work (toolbar, slash commands, image picker, links)
4. Run existing tests and update as needed
5. Deploy and monitor performance improvements

### Requirement 24: Slug Generation and URL Management

**User Story:** As an admin user, I want all content pages, events, and activities to have correctly generated slugs, so that guest-facing URLs work properly in production, preview, and draft modes.

#### Acceptance Criteria

1. THE System SHALL automatically generate URL-safe slugs from titles using the existing `generateSlug` utility
2. THE System SHALL ensure slugs are lowercase, hyphen-separated, and contain only alphanumeric characters and hyphens
3. THE System SHALL prevent duplicate slugs by appending numeric suffixes (-2, -3, etc.) using `makeUniqueSlug`
4. THE System SHALL validate slug uniqueness across all content pages before saving
5. THE System SHALL validate slug uniqueness across all events before saving
6. THE System SHALL validate slug uniqueness across all activities before saving
7. THE System SHALL preserve existing slugs when updating titles (only generate new slug if slug field is empty)
8. THE System SHALL allow admins to manually override auto-generated slugs with custom values
9. THE System SHALL validate custom slugs match the pattern `^[a-z0-9-]+$` before saving
10. THE System SHALL update all guest-facing routes to use slugs consistently for content pages, events, and activities

**Slug Generation Rules**:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters except hyphens
- Remove leading/trailing hyphens
- Collapse consecutive hyphens to single hyphen
- Ensure minimum length of 1 character after processing

**URL Patterns**:
- Content Pages: `/[type]/[slug]` (e.g., `/page/our-story`, `/page/venue-details`)
- Events: `/event/[slug]` (e.g., `/event/welcome-dinner`, `/event/ceremony`)
- Activities: `/activity/[slug]` (e.g., `/activity/beach-volleyball`, `/activity/sunset-cruise`)

**Draft/Preview Support**:
- Draft content pages accessible at `/[type]/[slug]?preview=true` (admin only)
- Published content pages accessible at `/[type]/[slug]` (all guests)
- Preview mode shows unpublished changes without affecting live content

**Integration Note**: Uses existing utilities:
- `utils/slugs.ts` - `generateSlug`, `isValidSlug`, `makeUniqueSlug` functions
- `services/contentPagesService.ts` - Slug validation and uniqueness checks
- Existing property-based tests validate slug generation correctness

### Requirement 25: Reference Block Modal Previews

**User Story:** As a guest user, I want to see detailed previews of events and activities when clicking reference blocks, so that I can quickly understand key information without navigating away from the current page.

#### Acceptance Criteria

1. WHEN a guest clicks an Event reference block, THE System SHALL display a modal with event preview information
2. THE Event_Preview_Modal SHALL display event name, date, time, location, description, and list of activities
3. THE Event_Preview_Modal SHALL display the guest's RSVP status for the event
4. THE Event_Preview_Modal SHALL provide a "View Full Details" button that navigates to `/event/[slug]`
5. WHEN a guest clicks an Activity reference block, THE System SHALL display a modal with activity preview information
6. THE Activity_Preview_Modal SHALL display activity name, date, time, location, capacity, cost, and description
7. THE Activity_Preview_Modal SHALL display the guest's RSVP status for the activity
8. THE Activity_Preview_Modal SHALL show remaining capacity if activity has capacity limits
9. THE Activity_Preview_Modal SHALL provide a "View Full Details" button that navigates to `/activity/[slug]`
10. THE Activity_Preview_Modal SHALL provide an "RSVP Now" button if guest has not yet RSVP'd

**Modal Design Requirements**:
- Responsive design (full-screen on mobile, centered modal on desktop)
- Tropical Costa Rica theme with consistent styling
- Close button (X) in top-right corner
- Keyboard accessible (Escape key to close, Tab navigation)
- Click outside modal to close
- Smooth fade-in/fade-out animations
- Loading state while fetching reference data

**Reference Block Types**:
- **Event Reference**: Shows event card with date, time, location, activity count
- **Activity Reference**: Shows activity card with date, time, capacity, cost
- **Content Page Reference**: Direct link to content page (no modal)
- **Accommodation Reference**: Shows accommodation card with room types, pricing

**Integration Note**: Extends existing components:
- `components/guest/ReferenceDisplay.tsx` - Add modal trigger functionality
- Create new `components/guest/EventPreviewModal.tsx` component
- Create new `components/guest/ActivityPreviewModal.tsx` component
- Use existing `EventService` and `ActivityService` for data fetching
- Use existing `RSVPService` to display guest's RSVP status

### Requirement 26: Guest Itinerary and Activity Management

**User Story:** As a guest user, I want to view my personalized itinerary and manage my activity RSVPs, so that I can plan my attendance and see my complete schedule.

#### Acceptance Criteria

1. THE System SHALL provide a dedicated Itinerary page at `/guest/itinerary` showing all activities the guest has RSVP'd to
2. THE Itinerary_Page SHALL display activities in chronological order grouped by date
3. THE Itinerary_Page SHALL display activity name, time, location, and RSVP status for each activity
4. THE Itinerary_Page SHALL allow guests to filter activities by date range
5. THE Itinerary_Page SHALL allow guests to export their itinerary as a PDF
6. THE Itinerary_Page SHALL display a calendar view toggle showing activities on a visual calendar
7. THE Itinerary_Page SHALL highlight activities with capacity warnings or deadline approaching
8. THE Itinerary_Page SHALL provide quick links to view full activity details or modify RSVP
9. THE System SHALL display the guest's itinerary summary on the home page dashboard
10. THE System SHALL send email reminders 48 hours before each activity the guest is attending

**Itinerary Features**:
- **Day-by-Day View**: Activities grouped by date with day headers
- **Calendar View**: Visual calendar with activity markers
- **List View**: Compact list of all activities with key details
- **PDF Export**: Printable itinerary with all activity details
- **RSVP Management**: Quick access to modify RSVPs from itinerary page
- **Capacity Alerts**: Visual indicators for activities nearing capacity
- **Deadline Warnings**: Alerts for activities with approaching RSVP deadlines

**Activity Display Information**:
- Activity name and description
- Date and time (with timezone)
- Location with map link
- RSVP status (attending, declined, maybe, pending)
- Guest count (if applicable)
- Dietary restrictions (if meal activity)
- Cost and payment status
- Capacity remaining (if limited capacity)
- RSVP deadline

**Integration Note**: Uses existing components and services:
- `components/guest/ItineraryViewer.tsx` - Itinerary display component (may need enhancement)
- `services/itineraryService.ts` - Itinerary generation service
- `services/rsvpService.ts` - RSVP data retrieval
- `services/activityService.ts` - Activity details
- `services/emailService.ts` - Reminder emails
- Existing route at `app/guest/itinerary/` needs full implementation

### Requirement 27: Guest Portal Navigation and Tab Management

**User Story:** As a guest user, I want intuitive navigation with organized tabs, so that I can easily find and access different sections of the wedding portal.

#### Acceptance Criteria

1. THE Guest_Portal SHALL display a horizontal navigation bar with main tabs: Home, Events, Activities, Itinerary, Photos, Info
2. THE Navigation_Bar SHALL be sticky at the top of the page when scrolling
3. THE Navigation_Bar SHALL highlight the currently active tab
4. WHEN viewing on mobile (viewport < 768px), THE System SHALL display a hamburger menu with collapsible navigation
5. THE Home_Tab SHALL navigate to `/guest/dashboard` showing personalized dashboard
6. THE Events_Tab SHALL navigate to `/guest/events` showing all events the guest is invited to
7. THE Activities_Tab SHALL navigate to `/guest/activities` showing all activities with RSVP options
8. THE Itinerary_Tab SHALL navigate to `/guest/itinerary` showing the guest's personalized schedule
9. THE Photos_Tab SHALL navigate to `/guest/photos` showing the photo gallery
10. THE Info_Tab SHALL display a dropdown with sub-items: Accommodations, Transportation, Contact, FAQ

**Navigation Features**:
- **Breadcrumb Navigation**: Show current location path (e.g., Home > Events > Welcome Dinner)
- **Quick Actions**: Floating action button for common tasks (RSVP, Upload Photo)
- **Notification Badge**: Display count of pending RSVPs or unread announcements
- **Search Function**: Global search across all content pages and activities
- **Back to Top**: Smooth scroll to top button on long pages

**Mobile Navigation**:
- Hamburger menu icon in top-left
- Full-screen overlay menu with large touch targets
- Swipe gestures to open/close menu
- Close menu on navigation selection
- Maintain scroll position when returning to previous page

**Integration Note**: Navigation structure should:
- Use existing routes in `app/guest/` directory
- Integrate with existing authentication state
- Display user's name and group in navigation header
- Provide logout button in navigation menu
- Use tropical theme colors (jungle, sage, ocean) for active states

### Requirement 28: Automated Regression Testing and System Stability

**User Story:** As a development team, we want automated regression testing with property-based tests, so that we maintain the "Zero-Debt" development standard and prevent regressions.

#### Acceptance Criteria

1. THE Wedding_Platform SHALL maintain an automated regression suite using Fast-Check for all core business logic
2. THE System SHALL run property-based tests on every pull request via GitHub Actions CI/CD pipeline
3. WHEN changes are made to type definitions, THE System SHALL trigger build-time failures if TypeScript contracts are violated
4. THE System SHALL maintain property-based tests for all service methods with business rules
5. THE System SHALL validate data integrity properties (uniqueness, referential integrity, cascade behavior)
6. THE System SHALL test security properties (XSS prevention, SQL injection prevention, auth enforcement)
7. THE System SHALL test performance properties (response time < 1s, query efficiency)
8. THE System SHALL maintain regression tests for all previously identified bugs
9. THE System SHALL achieve 90%+ coverage for service layer with property-based tests
10. THE System SHALL fail the build if any property-based test fails

**Property-Based Testing Coverage**:
- **Slug Generation**: Uniqueness, URL-safety, idempotency (existing: `utils/slugs.property.test.ts`)
- **Content Cascade**: Deletion propagation, orphan prevention (existing: `services/contentPagesService.cascadeDeletion.property.test.ts`)
- **Reference Validation**: Circular reference detection, broken link detection (existing: `services/sectionsService.referenceValidation.property.test.ts`)
- **RSVP Business Rules**: Capacity constraints, deadline enforcement, guest count validation
- **Activity Scheduling**: Conflict detection, time validation, location availability
- **Budget Calculations**: Cost totals, subsidy calculations, payment tracking
- **Email Templates**: Variable substitution, HTML sanitization, delivery tracking

**Build-Time Validation**:
- TypeScript strict mode compilation
- Zod schema validation for all API contracts
- ESLint with strict rules enforcement
- Property-based test execution (100 runs minimum per property)
- Integration test suite execution
- E2E smoke tests for critical paths

**Regression Test Requirements**:
- All bugs fixed must have corresponding regression tests
- Regression tests must use property-based testing where applicable
- Tests must validate the bug is fixed and cannot recur
- Tests must be tagged with issue/PR number for traceability

**Integration Note**: Leverages existing testing infrastructure:
- `__tests__/regression/` - Regression test directory
- `__tests__/helpers/arbitraries.ts` - Fast-Check generators
- `.github/workflows/test.yml` - CI/CD pipeline
- `jest.config.js` - Test configuration with property test support

### Requirement 29: Content CMS Ghost Record Prevention

**User Story:** As a system administrator, I want automatic cascade deletion for content pages, so that removing content doesn't leave orphaned database records.

#### Acceptance Criteria

1. THE Content_System SHALL implement cascade deletion such that removing a parent Content_Page automatically deletes all associated Sections
2. WHEN a Section is deleted, THE System SHALL automatically delete all associated Columns
3. WHEN a Content_Page is deleted, THE System SHALL automatically delete all associated Photos linked to that page
4. THE System SHALL validate referential integrity before allowing deletion of referenced entities
5. THE System SHALL prevent deletion of Content_Pages that are referenced by other pages unless cascade is explicitly confirmed
6. THE System SHALL log all cascade deletions in the audit log with full details of deleted records
7. THE System SHALL provide a "soft delete" option that marks records as deleted without removing them from the database
8. WHEN using soft delete, THE System SHALL hide soft-deleted records from all guest-facing views
9. THE System SHALL provide an admin interface to view and restore soft-deleted records within 30 days
10. THE System SHALL permanently delete soft-deleted records after 30 days automatically

**Cascade Deletion Rules**:
- **Content Page Deletion**: Deletes all sections, columns, and page-specific photos
- **Section Deletion**: Deletes all columns within that section
- **Event Deletion**: Deletes all activities, RSVPs, and event-specific photos
- **Activity Deletion**: Deletes all RSVPs for that activity
- **Guest Group Deletion**: Prevents deletion if guests exist; requires reassignment first
- **Location Deletion**: Prevents deletion if referenced by events, activities, or accommodations

**Referential Integrity Checks**:
- Check for references before deletion
- Display warning with list of dependent records
- Require explicit confirmation for cascade deletion
- Provide option to reassign references instead of deleting

**Soft Delete Implementation**:
- Add `deleted_at` timestamp column to all major tables
- Filter out soft-deleted records in all queries (WHERE deleted_at IS NULL)
- Provide admin-only view to see soft-deleted records
- Implement restore functionality that clears `deleted_at` timestamp
- Scheduled job to permanently delete records older than 30 days

**Integration Note**: Extends existing functionality:
- `services/contentPagesService.ts` - Add cascade deletion logic
- Existing property test: `services/contentPagesService.cascadeDeletion.property.test.ts`
- Database migrations to add `deleted_at` columns
- Update RLS policies to filter soft-deleted records

### Requirement 30: Pura Vida Visual Identity and Thematic UI

**User Story:** As a wedding participant, I want a visually cohesive 'Pura Vida' interface with clear iconography and accessible styling, so that the platform feels like an extension of the destination wedding experience.

#### Acceptance Criteria

1. THE System SHALL implement a unified Tailwind CSS design system using emerald, jungle, and sage color palettes for primary actions and backgrounds
2. THE System SHALL utilize the TropicalIcon component as the primary source for all UI iconography (hibiscus, palm, coconut, etc.)
3. WHEN a specific icon is unavailable in the TropicalIcon set, THE System SHALL gracefully fallback to a relevant emoji to ensure visual continuity
4. THE System SHALL enforce consistent focus indicators using an emerald-500 (#22c55e) outline for all interactive elements to meet WCAG 2.1 AA standards
5. THE System SHALL utilize glassmorphism effects (semi-transparent backgrounds with blur) for dashboard cards and modals to provide visual depth
6. THE System SHALL implement responsive typography that adjusts based on device viewport to maintain readability on both mobile and desktop
7. THE System SHALL use the TropicalButton component for all primary actions with consistent emerald-600 background and hover states
8. THE System SHALL use the TropicalCard component for all content containers with rounded-xl borders and sage-100 backgrounds
9. THE System SHALL implement the PuraVidaBanner component on key pages to reinforce the Costa Rican theme
10. THE System SHALL maintain a consistent spacing scale using Tailwind's spacing utilities (4px base unit)

**Color Palette (Costa Rica Theme)**:
- **Emerald**: Primary actions, links, focus states (#10b981, #22c55e, #34d399)
- **Jungle**: Headers, navigation, dark text (#065f46, #047857, #059669)
- **Sage**: Body text, secondary backgrounds (#6b7280, #9ca3af, #d1d5db)
- **Ocean**: Accent colors, info states (#0891b2, #06b6d4, #22d3ee)
- **Sunset**: Warning states, highlights (#f59e0b, #fbbf24, #fcd34d)
- **Volcano**: Error states, destructive actions (#dc2626, #ef4444, #f87171)
- **Cloud**: Light backgrounds, cards (#f9fafb, #ffffff)

**Typography Scale**:
- **Headings**: Font-serif (Playfair Display or similar elegant serif)
- **Body**: Font-sans (Inter or similar clean sans-serif)
- **Mobile**: Base 16px, scale down headings by 20%
- **Desktop**: Base 16px, full heading scale
- **Line Height**: 1.5 for body, 1.2 for headings

**Iconography System**:
- **TropicalIcon Component**: Primary icon source with tropical-themed SVGs
- **Emoji Fallbacks**: Use when TropicalIcon doesn't have specific icon
- **Icon Sizes**: sm (16px), md (24px), lg (32px), xl (48px)
- **Icon Colors**: Inherit from parent or use theme colors

**Glassmorphism Effects**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**Existing Components to Leverage**:
- `components/ui/TropicalButton.tsx` - Themed button component
- `components/ui/TropicalCard.tsx` - Themed card component
- `components/ui/TropicalIcon.tsx` - Icon component with tropical themes
- `components/ui/PuraVidaBanner.tsx` - Costa Rica themed banner
- `components/ui/TropicalLoading.tsx` - Themed loading spinner
- `app/globals.css` - Global styles with Costa Rica color palette

**Accessibility Requirements**:
- All interactive elements have 44px minimum touch target
- Color contrast ratios meet WCAG 2.1 AA (4.5:1 for text, 3:1 for UI components)
- Focus indicators visible on all interactive elements
- Keyboard navigation supported throughout
- Screen reader labels on all icons and images
- Skip navigation links for keyboard users

**Integration Note**: This requirement formalizes existing design patterns:
- Existing color palette in `globals.css` already implements Costa Rica theme
- TropicalIcon component already exists with emoji fallbacks
- TropicalButton and TropicalCard components already implement themed styling
- Focus indicators already implemented with emerald-500 outline
- Responsive typography already configured in Tailwind config
