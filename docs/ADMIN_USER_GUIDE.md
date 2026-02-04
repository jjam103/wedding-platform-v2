# Admin User Guide - Costa Rica Wedding Management System

**Version**: 1.0
**Last Updated**: February 2, 2026
**Audience**: Wedding Coordinators, Admin Users

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation System](#navigation-system)
3. [Guest Management](#guest-management)
4. [Inline RSVP Management](#inline-rsvp-management)
5. [Event & Activity Management](#event--activity-management)
6. [Admin User Management](#admin-user-management)
7. [Email System](#email-system)
8. [Content Management](#content-management)
9. [Reference Blocks](#reference-blocks)
10. [Section Manager](#section-manager)
11. [Photo Gallery Management](#photo-gallery-management)
12. [Budget Tracking](#budget-tracking)
13. [Analytics & Reporting](#analytics--reporting)

---

## Getting Started

### Logging In

1. Navigate to `/admin` in your browser
2. Sign in with your admin credentials
3. You'll be redirected to the admin dashboard

### Dashboard Overview

The admin dashboard provides:
- Quick stats (total guests, RSVPs, pending items)
- Recent activity feed
- Upcoming events timeline
- Quick action buttons

---

## Navigation System

### Top Navigation

The admin interface uses a horizontal top navigation with 5 main tabs:

1. **Content** - Manage pages, sections, and content
2. **Guests** - Guest lists, groups, and RSVPs
3. **RSVPs** - RSVP analytics and management
4. **Logistics** - Events, activities, accommodations, transportation
5. **Admin** - Settings, users, and system configuration

### Sub-Navigation

Each main tab has sub-items accessible via dropdown:

**Content Tab**:
- Home Page
- Content Pages
- Sections
- Photo Gallery

**Guests Tab**:
- Guest List
- Guest Groups
- Import/Export

**RSVPs Tab**:
- RSVP Analytics
- Activity Capacity
- Deadline Management

**Logistics Tab**:
- Events
- Activities
- Accommodations
- Transportation
- Locations
- Vendors
- Budget

**Admin Tab**:
- Admin Users
- Settings
- Audit Logs
- Deleted Items

### Mobile Navigation

On mobile devices (< 768px):
- Hamburger menu icon appears in top-left
- Tap to open full-screen navigation overlay
- Swipe right to open, swipe left to close
- All navigation items accessible with large touch targets

### Navigation State

Your navigation state persists across page refreshes:
- Active tab remembered
- Active sub-item remembered
- Browser back/forward buttons work correctly

---

## Guest Management

### Viewing Guests

**Location**: Guests → Guest List

The guest list displays all wedding guests with:
- Name and email
- Guest group
- Age type (adult, child, senior)
- Guest type (wedding party, wedding guest, etc.)
- RSVP status summary

### Adding Guests

1. Click "Add Guest" button
2. Fill in required fields:
   - First Name *
   - Last Name *
   - Email (optional)
   - Guest Group *
   - Age Type *
   - Guest Type *
3. Click "Save"

### Editing Guests

1. Click "Edit" button on guest row
2. Modify fields as needed
3. Click "Save" to confirm

### Guest Groups

**Location**: Guests → Guest Groups

Guest groups organize guests by family or party:

**Creating a Group**:
1. Click "Add Group"
2. Enter group name
3. Assign group owner (optional)
4. Click "Save"

**Group Owners**:
- Can update their family members' information
- Can manage RSVPs for their group
- Receive group-specific communications

### Import/Export

**Importing Guests**:
1. Go to Guests → Import/Export
2. Download CSV template
3. Fill in guest data
4. Upload CSV file
5. Review import preview
6. Confirm import

**Exporting Guests**:
1. Go to Guests → Import/Export
2. Select export format (CSV, Excel)
3. Choose fields to include
4. Click "Export"
5. Download file

---

## Inline RSVP Management

### Overview

Inline RSVP management allows you to view and update guest RSVPs directly from the guest list without navigating to separate pages.

### Accessing RSVPs

1. Go to Guests → Guest List
2. Click "Manage RSVPs" button on any guest row
3. RSVP panel expands inline

### RSVP Sections

The RSVP panel has three expandable sections:

**Activities**:
- List of all activities
- Current RSVP status for each
- Guest count
- Dietary restrictions

**Events**:
- List of all events
- Attendance status
- Special requirements

**Accommodations**:
- Room assignments
- Check-in/check-out dates
- Special requests

### Updating RSVPs

**Status Toggle**:
- Click status badge to cycle through: Pending → Attending → Maybe → Declined
- Changes save automatically
- Success toast appears on save
- Error toast appears if save fails (with rollback)

**Guest Count**:
- Enter number of guests attending
- Validates against activity capacity
- Shows warning if capacity < 10% remaining
- Prevents "attending" if capacity = 0

**Dietary Restrictions**:
- Enter dietary requirements in text field
- Saves automatically on blur
- Supports multiple restrictions (comma-separated)

### Capacity Validation

The system automatically:
- Checks capacity before allowing "attending" status
- Displays warning when capacity is low
- Prevents overbooking
- Shows remaining capacity count

### Optimistic UI Updates

- UI updates immediately when you make changes
- Loading spinner shows during save
- Changes rollback automatically if save fails
- Toast notifications confirm success/failure

---

## Event & Activity Management

### Events

**Location**: Logistics → Events

**Creating an Event**:
1. Click "Add Event"
2. Fill in details:
   - Event name *
   - Date and time *
   - Location *
   - Description
   - Capacity (optional)
3. Click "Save"

**Event Sections**:
- Add rich content sections to event pages
- Include photos, text, and reference blocks
- Customize layout (single or two-column)

### Activities

**Location**: Logistics → Activities

**Creating an Activity**:
1. Click "Add Activity"
2. Fill in details:
   - Activity name *
   - Event (parent event) *
   - Date and time *
   - Location *
   - Capacity *
   - Cost per person
   - Host subsidy
   - Description
3. Set restrictions:
   - Adults only (checkbox)
   - Plus-ones allowed (checkbox)
4. Click "Save"

**Activity Types**:
- Ceremony
- Reception
- Meal
- Transport
- Activity
- Custom types

**Capacity Management**:
- Set maximum capacity
- Track current RSVPs
- Receive alerts at 90% capacity
- View capacity utilization in analytics

---

## Admin User Management

**Location**: Admin → Admin Users

**Requirements**: Owner role required

### User Roles

**Admin**:
- Can manage content, guests, events
- Cannot manage other admin users
- Cannot change system settings

**Owner**:
- Full system access
- Can manage admin users
- Can change system settings
- At least one owner must exist

### Adding Admin Users

1. Click "Add Admin User"
2. Enter email address
3. Select role (Admin or Owner)
4. Click "Send Invitation"
5. User receives invitation email with setup link

### Managing Admin Users

**Editing Users**:
- Click "Edit" on user row
- Change role or status
- Click "Save"

**Deactivating Users**:
- Click "Deactivate" on user row
- Confirm deactivation
- User can no longer log in
- Cannot deactivate last owner

**Deleting Users**:
- Click "Delete" on user row
- Confirm deletion
- User permanently removed
- Cannot delete last owner

### Audit Logging

All admin actions are logged:
- User who performed action
- Action type
- Timestamp
- Entity affected
- Changes made

View audit logs: Admin → Audit Logs

---

## Email System

**Location**: Admin → Emails

### Email Templates

**Creating Templates**:
1. Go to Admin → Emails → Templates
2. Click "Add Template"
3. Fill in details:
   - Template name *
   - Subject line *
   - Email body (rich text) *
   - Category
4. Add variables: `{{firstName}}`, `{{eventName}}`, etc.
5. Click "Save"

**Available Variables**:
- `{{firstName}}` - Guest first name
- `{{lastName}}` - Guest last name
- `{{email}}` - Guest email
- `{{groupName}}` - Guest group name
- `{{eventName}}` - Event name
- `{{activityName}}` - Activity name
- `{{date}}` - Event/activity date
- `{{time}}` - Event/activity time
- `{{location}}` - Event/activity location

### Sending Emails

**Individual Emails**:
1. Go to guest detail page
2. Click "Send Email"
3. Select template or compose new
4. Review and edit content
5. Click "Send"

**Bulk Emails**:
1. Go to Guests → Guest List
2. Select guests (checkboxes)
3. Click "Send Email to Selected"
4. Choose template
5. Review recipients
6. Click "Send"

### Email History

View sent emails: Admin → Emails → History

**Email Status**:
- Sent - Successfully delivered
- Pending - Queued for delivery
- Failed - Delivery failed
- Bounced - Email bounced

**Tracking**:
- Delivery status
- Open rate (if tracking enabled)
- Click rate (if tracking enabled)
- Bounce rate

### Automated Emails

**RSVP Confirmations**:
- Sent automatically when guest submits RSVP
- Includes RSVP details and next steps

**Deadline Reminders**:
- Sent automatically before RSVP deadline
- Only to guests who haven't responded

**Activity Reminders**:
- Sent before activity date
- Only to guests who RSVP'd attending

**Configuration**: Admin → Settings → Email Automation

---

## Content Management

**Location**: Content → Content Pages

### Creating Content Pages

1. Click "Add Content Page"
2. Fill in details:
   - Page title *
   - Slug (URL) *
   - Page type (info, activity, accommodation, transportation)
   - Status (draft or published)
3. Click "Save"

### Page Sections

Add content sections to pages:

**Section Types**:
- Rich Text - Formatted text content
- Photo Gallery - Image grid or carousel
- Reference Block - Link to event, activity, or other page

**Adding Sections**:
1. Click "Add Section" on page
2. Choose section type
3. Configure section:
   - Column layout (single or two-column)
   - Content for each column
4. Click "Save"

### Publishing Pages

**Draft Mode**:
- Pages start as drafts
- Only visible to admins
- Preview with `?preview=true` parameter

**Publishing**:
1. Review page content
2. Click "Publish"
3. Page becomes visible to guests
4. Appears in guest navigation

### Page Slugs

- Slugs are URL-friendly identifiers
- Auto-generated from title
- Can be customized
- Must be unique
- Used in URLs: `/info/our-story`

---

## Reference Blocks

### Overview

Reference blocks create links between content pages, events, and activities. They display as interactive cards that guests can click to view details.

### Adding Reference Blocks

1. Edit a content page or section
2. Click "Add Reference Block"
3. Search for entity:
   - Type to search
   - Filter by type (event, activity, page)
4. Select entity from results
5. Preview appears
6. Click "Add"

### Reference Types

**Event References**:
- Display event name, date, time, location
- Show guest's RSVP status
- Link to full event details

**Activity References**:
- Display activity name, date, time, capacity
- Show remaining capacity
- Show guest's RSVP status
- Link to full activity details

**Page References**:
- Display page title and excerpt
- Link to full page

### Reference Validation

The system automatically:
- Validates referenced entities exist
- Detects circular references
- Warns if referenced entity is unpublished
- Prevents broken references

### Managing References

**Editing**:
- Click "Edit" on reference block
- Search for different entity
- Update and save

**Removing**:
- Click "Remove" on reference block
- Confirm removal

**Reordering**:
- Drag and drop reference blocks
- Order saved automatically

---

## Section Manager

**Location**: Content → Sections

### Section Overview

Sections are reusable content blocks that can be added to multiple pages.

### Creating Sections

1. Click "Add Section"
2. Fill in details:
   - Section name *
   - Section type *
   - Column layout *
3. Add content:
   - Rich text
   - Photos
   - Reference blocks
4. Click "Save"

### Section Types

**Text Section**:
- Rich text content
- Supports formatting, links, lists
- Single or two-column layout

**Photo Section**:
- Photo gallery
- Grid or carousel display
- Captions and alt text

**Reference Section**:
- Collection of reference blocks
- Links to events, activities, pages

**Mixed Section**:
- Combination of text, photos, references
- Flexible layout options

### Using Sections

**Adding to Pages**:
1. Edit content page
2. Click "Add Existing Section"
3. Search for section
4. Select and add

**Editing Sections**:
- Changes apply to all pages using section
- Preview changes before saving
- Version history available

### Section Preview

**Preview Mode**:
- Toggle preview on/off
- See how section appears to guests
- Test responsive layout
- Verify reference blocks work

---

## Photo Gallery Management

**Location**: Content → Photo Gallery

### Uploading Photos

**Admin Uploads**:
1. Click "Upload Photos"
2. Select files (max 10MB each)
3. Add metadata:
   - Caption
   - Alt text (for accessibility)
   - Attribution
4. Photos auto-approved for admins
5. Click "Upload"

**Guest Uploads**:
- Guests upload via guest portal
- Photos enter "pending" moderation status
- Admins review and approve/reject

### Photo Moderation

**Reviewing Photos**:
1. Go to Photo Gallery
2. Filter by "Pending"
3. Review each photo
4. Click "Approve" or "Reject"

**Moderation Status**:
- Pending - Awaiting review
- Approved - Visible to all guests
- Rejected - Not visible, can be deleted

### Gallery Settings

**Display Modes**:
- Grid - Photo grid layout
- Carousel - Slideshow with navigation
- Auto-play - Automatic slideshow loop

**Configuration**:
1. Go to Photo Gallery → Settings
2. Choose display mode
3. Set auto-play interval (if applicable)
4. Enable/disable guest uploads
5. Click "Save"

### Photo Organization

**Sorting**:
- Drag and drop to reorder
- Sort by date uploaded
- Sort by caption

**Filtering**:
- Filter by uploader
- Filter by moderation status
- Filter by date range

**Bulk Actions**:
- Select multiple photos
- Approve/reject in bulk
- Delete in bulk
- Download in bulk

---

## Budget Tracking

**Location**: Logistics → Budget

### Budget Overview

Track all wedding expenses:
- Vendor costs
- Activity costs
- Accommodation costs
- Transportation costs
- Total budget and spent amounts

### Adding Vendors

1. Click "Add Vendor"
2. Fill in details:
   - Vendor name *
   - Category *
   - Contact info
   - Base cost *
   - Per-guest cost (optional)
   - Payment status
3. Click "Save"

### Vendor Categories

- Photography
- Catering
- Music/Entertainment
- Flowers/Decor
- Transportation
- Accommodation
- Other

### Payment Tracking

**Payment Status**:
- Unpaid - No payment made
- Partial - Partial payment made
- Paid - Fully paid

**Recording Payments**:
1. Click "Record Payment" on vendor
2. Enter amount paid
3. Enter payment date
4. Add notes (optional)
5. Click "Save"

### Budget Reports

**Summary View**:
- Total budget
- Total spent
- Remaining budget
- Breakdown by category

**Detailed View**:
- Per-vendor costs
- Per-activity costs
- Guest subsidies
- Host contributions

**Exporting**:
- Export to CSV
- Export to Excel
- Print-friendly view

---

## Analytics & Reporting

**Location**: RSVPs → RSVP Analytics

### RSVP Analytics

**Response Rates**:
- Overall response rate
- Response rate by guest type
- Response rate by group
- Response rate over time

**Attendance Tracking**:
- Total attending
- Total declined
- Total maybe
- Total pending

**Activity Capacity**:
- Capacity utilization per activity
- Activities near capacity
- Activities with low attendance

### Guest Analytics

**Demographics**:
- Guest count by age type
- Guest count by guest type
- Guest count by group

**RSVP Status**:
- Guests who haven't responded
- Guests attending all events
- Guests attending specific events

### Reports

**Generating Reports**:
1. Go to RSVPs → RSVP Analytics
2. Select report type
3. Choose date range
4. Apply filters
5. Click "Generate Report"

**Available Reports**:
- RSVP Summary
- Activity Attendance
- Dietary Restrictions
- Transportation Manifest
- Accommodation Assignments

**Exporting Reports**:
- Export to PDF
- Export to CSV
- Export to Excel
- Print-friendly view

---

## Tips & Best Practices

### Guest Management
- Import guests early to allow time for corrections
- Assign group owners to distribute management tasks
- Keep email addresses up to date for communications

### RSVP Management
- Set clear RSVP deadlines
- Send reminders to non-respondents
- Monitor capacity for popular activities
- Follow up with "maybe" responses

### Content Management
- Use drafts to prepare content before publishing
- Preview pages before publishing
- Use reference blocks to connect related content
- Keep page slugs short and descriptive

### Email Communications
- Create templates for common messages
- Test templates before sending to all guests
- Use variables for personalization
- Track email delivery and engagement

### Photo Gallery
- Review guest uploads promptly
- Provide clear upload guidelines to guests
- Use descriptive captions and alt text
- Organize photos by event or date

### Budget Tracking
- Record all expenses as they occur
- Track payments to avoid missed deadlines
- Review budget regularly
- Export reports for financial planning

---

## Troubleshooting

### Common Issues

**Can't log in**:
- Verify email and password
- Check for password reset email
- Contact system administrator

**Changes not saving**:
- Check internet connection
- Look for error messages
- Try refreshing the page
- Contact support if issue persists

**Photos not uploading**:
- Check file size (max 10MB)
- Verify file type (JPEG, PNG, GIF, WebP)
- Check internet connection
- Try uploading fewer photos at once

**Emails not sending**:
- Verify email addresses are correct
- Check email template for errors
- Review email history for delivery status
- Contact support if issue persists

### Getting Help

**Support Resources**:
- User documentation: `/docs`
- Video tutorials: [URL]
- Support email: support@example.com
- Support phone: [Phone Number]

**Reporting Issues**:
1. Note what you were trying to do
2. Note any error messages
3. Take screenshots if helpful
4. Contact support with details

---

## Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save changes
- `Escape` - Close modals and dropdowns
- `Tab` - Navigate forward
- `Shift + Tab` - Navigate backward
- `Enter` - Activate buttons and links
- `Arrow keys` - Navigate dropdowns and lists

---

**End of Admin User Guide**

For additional help, contact support or refer to the developer documentation for technical details.
