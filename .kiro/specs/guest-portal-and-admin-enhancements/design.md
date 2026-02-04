# Design Document: Guest Portal and Admin Enhancements

## Overview

This design document specifies the architecture and implementation approach for comprehensive enhancements to both the admin dashboard and guest-facing portal. The implementation leverages 100% complete backend services (17 services) and many existing components, focusing on integration, wiring, and new UI features rather than building from scratch.

**Key Design Principles:**
- **Parallel Implementation**: Admin-side (Req 1-4, 21-23) and guest-side (Req 5-20) can proceed simultaneously
- **Leverage Existing Code**: Use existing services, components, and routes wherever possible
- **Zero-Debt Development**: Maintain property-based testing and regression test coverage
- **Pura Vida Theme**: Consistent tropical Costa Rica visual identity throughout
- **Accessibility First**: WCAG 2.1 AA compliance for all new features

**Implementation Strategy:**
1. **Phase 1**: Admin navigation redesign and inline RSVP management (Req 1-2)
2. **Phase 2**: Guest authentication and portal foundation (Req 5-7, 22)
3. **Phase 3**: Guest content pages and activities (Req 8-10, 24-25)
4. **Phase 4**: Admin enhancements (Req 3-4, 17-18, 21, 23)
5. **Phase 5**: Guest logistics and photos (Req 11-13, 26-27)
6. **Phase 6**: Testing, performance, and polish (Req 16, 19, 28-30)

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │   Admin Dashboard    │  │     Guest Portal             ││
│  │  - Top Navigation    │  │  - Home Dashboard            ││
│  │  - Inline RSVP Mgmt  │  │  - Content Pages             ││
│  │  - Section Manager   │  │  - Events & Activities       ││
│  │  - Email Composer    │  │  - RSVP Management           ││
│  │  - User Management   │  │  - Photo Gallery             ││
│  └──────────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes Layer                           │
│  /api/admin/*  │  /api/guest/*  │  /api/auth/*              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (17 Services)                │
│  guestService │ rsvpService │ eventService │ activityService│
│  contentPagesService │ sectionsService │ photoService       │
│  emailService │ accommodationService │ transportationService│
│  itineraryService │ budgetService │ locationService        │
│  b2Service │ aiContentService │ settingsService            │
│  accessControlService                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  Supabase PostgreSQL + Row Level Security (RLS)             │
│  Backblaze B2 Storage (Photos)                              │
└─────────────────────────────────────────────────────────────┘
```


### Component Architecture

**Admin Dashboard Components:**
```
app/admin/
├── layout.tsx (NEW - Top Navigation)
├── page.tsx (Dashboard home)
├── guests/
│   └── page.tsx (ENHANCED - Inline RSVP)
├── admin-users/
│   └── page.tsx (NEW - User Management)
├── emails/
│   └── page.tsx (ENHANCED - Email Composer)
├── home-page/
│   └── page.tsx (ENHANCED - Section Manager with References)
└── settings/
    └── page.tsx (ENHANCED - Auth Method Toggle)

components/admin/
├── TopNavigation.tsx (NEW)
├── InlineRSVPEditor.tsx (NEW)
├── AdminUserManager.tsx (NEW)
├── EmailComposer.tsx (ENHANCED)
├── SectionEditor.tsx (ENHANCED - Reference Blocks)
├── ReferenceBlockPicker.tsx (NEW)
├── ReferencePreview.tsx (NEW)
└── RichTextEditor.tsx (REPLACE - Lexkit Integration)
```

**Guest Portal Components:**
```
app/guest/
├── layout.tsx (NEW - Guest Navigation)
├── dashboard/
│   └── page.tsx (NEW - Home Dashboard)
├── events/
│   └── page.tsx (NEW - Events List)
├── activities/
│   └── page.tsx (NEW - Activities List)
├── itinerary/
│   └── page.tsx (ENHANCED - Personalized Schedule)
├── photos/
│   └── page.tsx (EXISTING - Photo Gallery)
├── accommodation/
│   └── page.tsx (EXISTING - Accommodation Info)
├── transportation/
│   └── page.tsx (EXISTING - Transportation Info)
└── family/
    └── page.tsx (EXISTING - Family Management)

app/auth/
├── guest-login/
│   └── page.tsx (NEW - Email Matching + Magic Link)
└── magic-link/
    └── page.tsx (NEW - Magic Link Handler)

app/[type]/[slug]/
└── page.tsx (ENHANCED - Dynamic Content Pages)

app/event/[slug]/
└── page.tsx (ENHANCED - Event Detail with Slug)

app/activity/[slug]/
└── page.tsx (ENHANCED - Activity Detail with Slug)

components/guest/
├── GuestNavigation.tsx (NEW)
├── GuestDashboard.tsx (ENHANCED)
├── EventCard.tsx (NEW)
├── ActivityCard.tsx (NEW)
├── EventPreviewModal.tsx (NEW)
├── ActivityPreviewModal.tsx (NEW)
├── RSVPQuickAction.tsx (NEW)
├── ItineraryViewer.tsx (ENHANCED)
├── SectionRenderer.tsx (ENHANCED - Reference Modals)
└── ReferenceDisplay.tsx (ENHANCED - Modal Triggers)
```


## Database Schema Changes

### New Tables

**admin_users** (Requirement 3)
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_by UUID REFERENCES admin_users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_status ON admin_users(status);
```

**email_templates** (Requirement 17)
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT CHECK (category IN ('rsvp', 'reminder', 'announcement', 'custom')),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_templates_category ON email_templates(category);
```

**email_history** (Requirement 4)
```sql
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  recipient_ids UUID[] NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_history_sent_at ON email_history(sent_at);
CREATE INDEX idx_email_history_delivery_status ON email_history(delivery_status);
```

### Schema Modifications

**guests table** (Requirement 22)
```sql
ALTER TABLE guests 
ADD COLUMN auth_method TEXT DEFAULT 'email_matching' 
CHECK (auth_method IN ('email_matching', 'magic_link'));

CREATE INDEX idx_guests_auth_method ON guests(auth_method);
```

**settings table** (Requirement 22)
```sql
ALTER TABLE settings 
ADD COLUMN default_auth_method TEXT DEFAULT 'email_matching' 
CHECK (default_auth_method IN ('email_matching', 'magic_link'));
```

**Soft Delete Support** (Requirement 29)
```sql
-- Add deleted_at column to major tables
ALTER TABLE content_pages ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE sections ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE columns ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE photos ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create indexes for soft delete queries
CREATE INDEX idx_content_pages_deleted_at ON content_pages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_sections_deleted_at ON sections(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_deleted_at ON activities(deleted_at) WHERE deleted_at IS NULL;
```

**Slug Support** (Requirement 24)
```sql
-- Add slug columns if not already present
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes for slug lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Add slug generation trigger
CREATE OR REPLACE FUNCTION generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_generate_slug
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_title();

CREATE TRIGGER activities_generate_slug
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_title();
```


## API Endpoint Specifications

### Admin API Routes

**Admin User Management** (Requirement 3)
```typescript
POST   /api/admin/admin-users          // Create admin user
GET    /api/admin/admin-users          // List admin users
PUT    /api/admin/admin-users/[id]     // Update admin user
DELETE /api/admin/admin-users/[id]     // Delete admin user
POST   /api/admin/admin-users/[id]/deactivate  // Deactivate user
POST   /api/admin/admin-users/[id]/invite      // Resend invitation
```

**Email Management** (Requirement 4, 17)
```typescript
POST   /api/admin/emails/send          // Send email to guests
POST   /api/admin/emails/schedule      // Schedule email
GET    /api/admin/emails/history       // Get email history
GET    /api/admin/emails/templates     // List templates
POST   /api/admin/emails/templates     // Create template
PUT    /api/admin/emails/templates/[id] // Update template
DELETE /api/admin/emails/templates/[id] // Delete template
POST   /api/admin/emails/preview       // Preview email with variables
```

**Inline RSVP Management** (Requirement 2)
```typescript
GET    /api/admin/guests/[id]/rsvps    // Get guest RSVPs
PUT    /api/admin/guests/[id]/rsvps/[rsvpId]  // Update RSVP inline
POST   /api/admin/guests/[id]/rsvps   // Create RSVP inline
```

**Reference Block Management** (Requirement 21, 25)
```typescript
GET    /api/admin/references/search    // Search entities for reference picker
GET    /api/admin/references/validate  // Validate reference exists
GET    /api/admin/references/preview/[type]/[id]  // Get reference preview data
POST   /api/admin/references/detect-circular  // Detect circular references
```

**Settings Management** (Requirement 22)
```typescript
GET    /api/admin/settings             // Get all settings
PUT    /api/admin/settings/auth-method // Update default auth method
PUT    /api/admin/guests/[id]/auth-method  // Override guest auth method
POST   /api/admin/guests/bulk-auth-method  // Bulk update auth method
```

### Guest API Routes

**Authentication** (Requirement 5, 22)
```typescript
POST   /api/auth/guest/email-match     // Email matching authentication
POST   /api/auth/guest/magic-link      // Request magic link
GET    /api/auth/guest/magic-link/verify  // Verify magic link token
POST   /api/auth/guest/logout          // Logout guest
GET    /api/auth/guest/session         // Get current session
```

**Guest Profile** (Requirement 6)
```typescript
GET    /api/guest/profile              // Get guest profile
PUT    /api/guest/profile              // Update guest profile
GET    /api/guest/family               // Get family members
PUT    /api/guest/family/[id]          // Update family member (group owner only)
```

**Guest RSVP** (Requirement 10)
```typescript
GET    /api/guest/rsvps                // Get guest RSVPs
POST   /api/guest/rsvps                // Create RSVP
PUT    /api/guest/rsvps/[id]           // Update RSVP
GET    /api/guest/rsvps/summary        // Get RSVP summary
```

**Guest Content** (Requirement 8, 9)
```typescript
GET    /api/guest/content-pages        // List published content pages
GET    /api/guest/content-pages/[slug] // Get content page by slug
GET    /api/guest/events               // List guest's events
GET    /api/guest/events/[slug]        // Get event by slug
GET    /api/guest/activities           // List guest's activities
GET    /api/guest/activities/[slug]    // Get activity by slug
```

**Guest Itinerary** (Requirement 26)
```typescript
GET    /api/guest/itinerary            // Get personalized itinerary
GET    /api/guest/itinerary/pdf        // Export itinerary as PDF
GET    /api/guest/itinerary/calendar   // Get calendar view data
```

**Guest Photos** (Requirement 13)
```typescript
GET    /api/guest/photos               // List approved photos
POST   /api/guest/photos/upload        // Upload photo (pending moderation)
GET    /api/guest/photos/my-uploads    // Get guest's uploaded photos
```


## Detailed Component Designs

### Requirement 1: Admin Top Navigation

**Component: TopNavigation.tsx**

```typescript
interface Tab {
  id: string;
  label: string;
  icon: string;
  subItems: SubItem[];
}

interface SubItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

const NAVIGATION_TABS: Tab[] = [
  {
    id: 'content',
    label: 'Content',
    icon: '📝',
    subItems: [
      { id: 'home-page', label: 'Home Page', href: '/admin/home-page' },
      { id: 'activities', label: 'Activities', href: '/admin/activities' },
      { id: 'events', label: 'Events', href: '/admin/events' },
      { id: 'content-pages', label: 'Content Pages', href: '/admin/content-pages' },
      { id: 'locations', label: 'Locations', href: '/admin/locations' },
      { id: 'photos', label: 'Photos', href: '/admin/photos' },
    ],
  },
  {
    id: 'guests',
    label: 'Guests',
    icon: '👥',
    subItems: [
      { id: 'guest-list', label: 'Guest List', href: '/admin/guests' },
      { id: 'guest-groups', label: 'Guest Groups', href: '/admin/guest-groups' },
      { id: 'import-export', label: 'Import/Export', href: '/admin/guests/import-export' },
    ],
  },
  {
    id: 'rsvps',
    label: 'RSVPs',
    icon: '✓',
    subItems: [
      { id: 'rsvp-analytics', label: 'RSVP Analytics', href: '/admin/rsvp-analytics' },
      { id: 'activity-rsvps', label: 'Activity RSVPs', href: '/admin/activities/rsvps' },
      { id: 'event-rsvps', label: 'Event RSVPs', href: '/admin/events/rsvps' },
      { id: 'deadlines', label: 'Deadlines', href: '/admin/rsvps/deadlines' },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: '🚗',
    subItems: [
      { id: 'accommodations', label: 'Accommodations', href: '/admin/accommodations' },
      { id: 'transportation', label: 'Transportation', href: '/admin/transportation' },
      { id: 'budget', label: 'Budget', href: '/admin/budget' },
      { id: 'vendors', label: 'Vendors', href: '/admin/vendors' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: '⚙️',
    subItems: [
      { id: 'admin-users', label: 'Admin Users', href: '/admin/admin-users' },
      { id: 'settings', label: 'Settings', href: '/admin/settings' },
      { id: 'email-templates', label: 'Email Templates', href: '/admin/emails/templates' },
      { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs' },
    ],
  },
];
```

**State Management:**
- Active tab stored in session storage: `sessionStorage.getItem('activeTab')`
- Active sub-item stored in session storage: `sessionStorage.getItem('activeSubItem')`
- URL reflects current location: `/admin/[tab]/[sub-item]`
- Browser back/forward updates navigation state

**Mobile Behavior:**
- Viewport < 768px: Hamburger menu
- Full-screen overlay with large touch targets (44px minimum)
- Swipe gestures to open/close
- Close on navigation selection

**Styling:**
- Horizontal tabs with emerald-600 active state
- Sub-navigation dropdown below active tab
- Sticky positioning (top: 0)
- Z-index: 50 (above content, below modals)
- Glassmorphism effect: `backdrop-filter: blur(10px)`


### Requirement 2: Inline RSVP Management

**Component: InlineRSVPEditor.tsx**

```typescript
interface InlineRSVPEditorProps {
  guestId: string;
  onUpdate?: () => void;
}

interface RSVPSection {
  type: 'activities' | 'events' | 'accommodations';
  label: string;
  items: RSVPItem[];
}

interface RSVPItem {
  id: string;
  name: string;
  status: 'attending' | 'declined' | 'maybe' | 'pending';
  guestCount?: number;
  dietaryRestrictions?: string;
  capacity?: number;
  capacityRemaining?: number;
}
```

**Interaction Flow:**
1. Guest row displays "Manage RSVPs" button
2. Click expands inline editor with three sections: Activities, Events, Accommodations
3. Each section displays items with status toggle controls
4. Status toggle cycles: pending → attending → maybe → declined → pending
5. Changes save immediately with optimistic UI updates
6. Loading spinner shows during save
7. Success/error toast displays after save completes

**Status Toggle UI:**
```
[✓] Attending (green)
[?] Maybe (yellow)
[✗] Declined (red)
[ ] Pending (gray)
```

**Capacity Validation:**
- Check capacity before allowing "attending" status
- Display warning if capacity < 10% remaining
- Prevent "attending" if capacity = 0
- Show capacity remaining: "15 / 50 spots"

**Guest Count & Dietary Restrictions:**
- Show inline input fields for activities requiring headcount
- Show inline textarea for meal activities
- Debounce input changes (500ms) before saving
- Validate guest count ≤ activity max per guest

**Performance Optimization:**
- Lazy load RSVP data when section expands
- Cache RSVP data for 5 minutes
- Batch multiple changes into single API call
- Use React.memo for RSVP item components


### Requirement 3: Admin User Management

**Component: AdminUserManager.tsx**

```typescript
interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'owner';
  status: 'active' | 'inactive';
  invitedBy?: string;
  invitedAt: string;
  lastLoginAt?: string;
}

interface AdminUserManagerProps {
  currentUserId: string;
  currentUserRole: 'admin' | 'owner';
}
```

**Features:**
- List all admin users in DataTable
- Add new admin user by email
- Edit user role (owner only)
- Deactivate user (owner only)
- Delete user (owner only)
- Resend invitation email
- View last login timestamp
- Filter by role and status

**Business Rules:**
- Only owners can manage admin users
- Cannot delete/deactivate last owner account
- Invitation email sent automatically on creation
- Deactivated users cannot log in
- Audit log entry created for all actions

**Invitation Email Template:**
```
Subject: You've been invited to manage [Wedding Name]

Hi,

You've been invited by [Inviter Name] to help manage the wedding website for [Couple Names].

Your role: [Admin/Owner]

Click here to set up your account: [Setup Link]

This invitation expires in 7 days.
```

**API Integration:**
- Uses existing `accessControlService` for authorization checks
- New `adminUserService` for CRUD operations
- Email sent via `emailService`
- Audit log via `auditLogService`


### Requirement 5 & 22: Guest Authentication

**Authentication Flow Diagram:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Guest Login Page                          │
│                                                              │
│  [Email Matching]  [Magic Link]  ← Tabs based on setting   │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         Email Matching              Magic Link
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ Enter email address   │   │ Enter email address   │
    │ [Submit]              │   │ [Send Link]           │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ Match email to guest  │   │ Generate secure token │
    │ record in database    │   │ Send email with link  │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │ Create session        │   │ User clicks link      │
    │ Redirect to dashboard │   │ Verify token          │
    └───────────────────────┘   │ Create session        │
                                │ Redirect to dashboard │
                                └───────────────────────┘
```

**Email Matching Implementation:**

```typescript
// app/api/auth/guest/email-match/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  
  // 1. Find guest by email
  const { data: guest, error } = await supabase
    .from('guests')
    .select('*')
    .eq('email', email)
    .eq('auth_method', 'email_matching')
    .single();
  
  if (error || !guest) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Email not found' }
    }, { status: 404 });
  }
  
  // 2. Create session
  const session = await createGuestSession(guest.id);
  
  // 3. Set session cookie
  cookies().set('guest_session', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  });
  
  return NextResponse.json({
    success: true,
    data: { guestId: guest.id, groupId: guest.group_id }
  });
}
```

**Magic Link Implementation:**

```typescript
// app/api/auth/guest/magic-link/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  
  // 1. Find guest by email
  const { data: guest, error } = await supabase
    .from('guests')
    .select('*')
    .eq('email', email)
    .eq('auth_method', 'magic_link')
    .single();
  
  if (error || !guest) {
    return NextResponse.json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Email not found' }
    }, { status: 404 });
  }
  
  // 2. Generate secure token (15 minute expiry)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  // 3. Store token in database
  await supabase.from('magic_link_tokens').insert({
    guest_id: guest.id,
    token,
    expires_at: expiresAt
  });
  
  // 4. Send email with magic link
  const magicLink = `${process.env.NEXT_PUBLIC_URL}/auth/magic-link/verify?token=${token}`;
  await emailService.send({
    to: email,
    subject: 'Your login link',
    html: `<p>Click here to log in: <a href="${magicLink}">Log In</a></p><p>This link expires in 15 minutes.</p>`
  });
  
  return NextResponse.json({
    success: true,
    data: { message: 'Magic link sent to your email' }
  });
}

// app/api/auth/guest/magic-link/verify/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  // 1. Verify token
  const { data: tokenRecord, error } = await supabase
    .from('magic_link_tokens')
    .select('*, guests(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .eq('used', false)
    .single();
  
  if (error || !tokenRecord) {
    return NextResponse.redirect('/auth/guest-login?error=invalid_token');
  }
  
  // 2. Mark token as used
  await supabase
    .from('magic_link_tokens')
    .update({ used: true })
    .eq('token', token);
  
  // 3. Create session
  const session = await createGuestSession(tokenRecord.guest_id);
  
  // 4. Set session cookie
  cookies().set('guest_session', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  });
  
  return NextResponse.redirect('/guest/dashboard');
}
```

**Authentication Method Configuration:**

Admin can configure default method in Settings:
```typescript
// Default for all new guests
settings.default_auth_method = 'email_matching' | 'magic_link'

// Override per guest
guests.auth_method = 'email_matching' | 'magic_link'
```

**Security Considerations:**
- Magic link tokens are single-use
- Tokens expire after 15 minutes
- Tokens are cryptographically secure (32 bytes)
- Sessions expire after 24 hours of inactivity
- All authentication attempts logged
- Rate limiting: 5 attempts per email per hour


### Requirement 21: Admin Home Page Section Manager with Reference Blocks

**Component: ReferenceBlockPicker.tsx**

```typescript
interface ReferenceBlockPickerProps {
  onSelect: (reference: Reference) => void;
  onClose: () => void;
  pageType: string;
  pageId: string;
}

interface Reference {
  type: 'event' | 'activity' | 'content_page' | 'accommodation';
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}
```

**Reference Search Interface:**
- Searchable dropdown with type filter
- Real-time search as user types (debounced 300ms)
- Results grouped by type
- Preview card shows key information
- "Add Reference" button to confirm selection

**Search API:**
```typescript
GET /api/admin/references/search?q=ceremony&types=event,activity

Response:
{
  success: true,
  data: {
    events: [
      { id: '123', name: 'Wedding Ceremony', date: '2024-06-15', location: 'Beach' }
    ],
    activities: [
      { id: '456', name: 'Ceremony Rehearsal', date: '2024-06-14', capacity: 50 }
    ]
  }
}
```

**Reference Validation:**
- Check that referenced entity exists before saving
- Detect circular references (page A → page B → page A)
- Warn if referenced entity is unpublished/draft
- Validate reference type matches expected schema

**Circular Reference Detection Algorithm:**
```typescript
function detectCircularReference(
  currentPageId: string,
  newReferenceId: string,
  pageType: string
): boolean {
  const visited = new Set<string>();
  const stack = [newReferenceId];
  
  while (stack.length > 0) {
    const pageId = stack.pop()!;
    
    if (pageId === currentPageId) {
      return true; // Circular reference detected
    }
    
    if (visited.has(pageId)) {
      continue;
    }
    
    visited.add(pageId);
    
    // Get all references from this page
    const references = await getPageReferences(pageId, pageType);
    stack.push(...references.map(r => r.id));
  }
  
  return false;
}
```

**Reference Block Storage:**
```typescript
// Stored in columns.content_data for 'references' content_type
{
  references: [
    {
      type: 'event',
      id: 'event-123',
      name: 'Wedding Ceremony',
      description: 'Join us for our special day',
      metadata: {
        date: '2024-06-15',
        time: '16:00',
        location: 'Sunset Beach'
      }
    },
    {
      type: 'activity',
      id: 'activity-456',
      name: 'Beach Volleyball',
      description: 'Fun beach games',
      metadata: {
        date: '2024-06-14',
        capacity: 20,
        capacityRemaining: 8
      }
    }
  ]
}
```

**Component: ReferencePreview.tsx**

Shows preview of referenced entity in admin interface:
```typescript
interface ReferencePreviewProps {
  reference: Reference;
  onRemove: () => void;
  onEdit: () => void;
}
```

Preview displays:
- Entity type badge
- Entity name
- Key metadata (date, time, capacity, etc.)
- "View Full Details" link
- "Remove" button
- "Edit Reference" button


### Requirement 23: Lexkit Rich Text Editor Integration

**Current RichTextEditor Issues:**
- Custom `contentEditable` implementation
- 300ms debounce causes typing lag
- Performance degrades on large documents
- Complex state management
- Difficult to maintain

**Lexkit Benefits:**
- Built-in performance optimizations
- No debounce needed (efficient re-renders)
- Extensible plugin architecture
- Better accessibility support
- Active maintenance and updates

**Implementation Strategy:**

```typescript
// components/admin/RichTextEditor.tsx (REPLACE implementation)
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Editor, EditorContent, useEditor } from '@lexkit/editor';
import { sanitizeRichText } from '@/utils/sanitization';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  pageType?: string;
  pageId?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  pageType,
  pageId,
}: RichTextEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  
  const editor = useEditor({
    content: value,
    editable: !disabled,
    extensions: [
      // Core extensions
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      Link,
      Image,
      Table,
      HorizontalRule,
      
      // Slash commands
      SlashCommands.configure({
        commands: [
          { name: 'heading1', label: 'Heading 1', action: () => editor.chain().focus().setHeading({ level: 1 }).run() },
          { name: 'heading2', label: 'Heading 2', action: () => editor.chain().focus().setHeading({ level: 2 }).run() },
          { name: 'heading3', label: 'Heading 3', action: () => editor.chain().focus().setHeading({ level: 3 }).run() },
          { name: 'list', label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run() },
          { name: 'numbered', label: 'Numbered List', action: () => editor.chain().focus().toggleOrderedList().run() },
          { name: 'table', label: 'Table', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run() },
          { name: 'link', label: 'Link', action: () => setShowLinkDialog(true) },
          { name: 'image', label: 'Image', action: () => setShowImagePicker(true) },
          { name: 'divider', label: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
        ],
      }),
      
      // Keyboard shortcuts
      KeyboardShortcuts.configure({
        'Mod-b': () => editor.chain().focus().toggleBold().run(),
        'Mod-i': () => editor.chain().focus().toggleItalic().run(),
        'Mod-u': () => editor.chain().focus().toggleUnderline().run(),
        'Mod-k': () => setShowLinkDialog(true),
      }),
    ],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = sanitizeRichText(html);
      onChange(sanitized);
    },
  });
  
  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);
  
  const handleImageSelect = useCallback((imageUrl: string) => {
    editor?.chain().focus().setImage({ src: imageUrl }).run();
    setShowImagePicker(false);
  }, [editor]);
  
  const handleLinkInsert = useCallback((url: string, text: string) => {
    editor?.chain().focus().setLink({ href: url }).insertContent(text).run();
    setShowLinkDialog(false);
  }, [editor]);
  
  if (!editor) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded" />;
  }
  
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={disabled}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={disabled}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          disabled={disabled}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          disabled={disabled}
          title="Bullet List"
        >
          •
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          disabled={disabled}
          title="Numbered List"
        >
          1.
        </ToolbarButton>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <ToolbarButton
          onClick={() => setShowImagePicker(true)}
          disabled={disabled}
          title="Insert Image"
        >
          🖼️
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => setShowLinkDialog(true)}
          disabled={disabled}
          title="Insert Link (Ctrl+K)"
        >
          🔗
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          disabled={disabled}
          title="Insert Table"
        >
          ⊞
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          title="Insert Divider"
        >
          ―
        </ToolbarButton>
      </div>
      
      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
      
      {/* Image Picker Modal */}
      {showImagePicker && (
        <PhotoPicker
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
          pageType={pageType}
          pageId={pageId}
        />
      )}
      
      {/* Link Dialog */}
      {showLinkDialog && (
        <LinkDialog
          onInsert={handleLinkInsert}
          onClose={() => setShowLinkDialog(false)}
        />
      )}
    </div>
  );
}

function ToolbarButton({ onClick, active, disabled, title, children }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}
```

**Migration Checklist:**
1. ✅ Install @lexkit/editor v0.0.38 (already installed)
2. Replace RichTextEditor.tsx implementation
3. Maintain same props interface (backward compatible)
4. Test with SectionEditor (most complex usage)
5. Test with ContentPageForm
6. Test with EmailComposer
7. Update tests to mock Lexkit components
8. Verify performance improvements (no lag, no debounce)
9. Verify all features work (toolbar, slash commands, image picker, links)
10. Deploy and monitor

**Performance Targets:**
- Typing latency < 16ms (60fps)
- No lag on documents up to 10,000 words
- Smooth scrolling and cursor movement
- Remove 300ms debounce timer


### Requirement 24: Slug Generation and URL Management

**Slug Generation Flow:**

```
Title Input → Generate Slug → Validate → Check Uniqueness → Save
     ↓              ↓             ↓            ↓              ↓
"Our Story"  → "our-story"  → ✓ valid  → ✓ unique  → "our-story"
"Café Menu"  → "cafe-menu"  → ✓ valid  → ✗ exists  → "cafe-menu-2"
"---"        → ""           → ✗ invalid → N/A       → Error
```

**Slug Generation Rules** (from `utils/slugs.ts`):
1. Convert to lowercase
2. Trim whitespace
3. Remove special characters (keep alphanumeric, underscore, space, hyphen)
4. Replace underscores with hyphens
5. Replace spaces with hyphens
6. Collapse multiple hyphens to single hyphen
7. Remove leading/trailing hyphens
8. Validate contains at least one alphanumeric character

**Uniqueness Enforcement:**
```typescript
// services/contentPagesService.ts
async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug;
  let counter = 2;
  
  while (true) {
    const exists = await checkSlugExists(uniqueSlug, excludeId);
    if (!exists) return uniqueSlug;
    
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
}
```

**URL Patterns:**
- Content Pages: `/[type]/[slug]` (e.g., `/page/our-story`)
- Events: `/event/[slug]` (e.g., `/event/ceremony`)
- Activities: `/activity/[slug]` (e.g., `/activity/beach-volleyball`)

**Draft/Preview Support:**
- Draft pages: `/[type]/[slug]?preview=true` (admin only)
- Published pages: `/[type]/[slug]` (all guests)
- Preview mode shows unpublished changes
- Preview requires admin authentication

**Slug Preservation:**
- Existing slugs preserved when updating titles
- Only generate new slug if slug field is empty
- Allow manual slug override
- Validate manual slugs match pattern `^[a-z0-9-]+$`

**Migration Strategy:**
- Add slug columns to events and activities tables
- Generate slugs for existing records
- Update all routes to use slugs
- Maintain backward compatibility with ID-based URLs (redirect to slug URLs)


### Requirement 25: Reference Block Modal Previews

**Component: EventPreviewModal.tsx**

```typescript
interface EventPreviewModalProps {
  eventId: string;
  eventSlug: string;
  onClose: () => void;
}

interface EventPreviewData {
  id: string;
  slug: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  activities: Activity[];
  guestRSVPStatus: 'attending' | 'declined' | 'maybe' | 'pending';
}
```

**Modal Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]                                                     │
│                                                          │
│  🎉 Wedding Ceremony                                    │
│  📅 June 15, 2024 at 4:00 PM                           │
│  📍 Sunset Beach, Manuel Antonio                        │
│                                                          │
│  Join us for our special ceremony on the beach...       │
│                                                          │
│  Activities (3):                                         │
│  • Ceremony (4:00 PM - 5:00 PM)                        │
│  • Cocktail Hour (5:00 PM - 6:00 PM)                   │
│  • Reception (6:00 PM - 10:00 PM)                      │
│                                                          │
│  Your RSVP: ✓ Attending                                │
│                                                          │
│  [View Full Details]  [RSVP Now]                       │
└─────────────────────────────────────────────────────────┘
```

**Component: ActivityPreviewModal.tsx**

```typescript
interface ActivityPreviewModalProps {
  activityId: string;
  activitySlug: string;
  onClose: () => void;
}

interface ActivityPreviewData {
  id: string;
  slug: string;
  name: string;
  date: string;
  time: string;
  location: string;
  description: string;
  capacity?: number;
  capacityRemaining?: number;
  cost?: number;
  hostSubsidy?: number;
  guestCost?: number;
  requirements?: string;
  guestRSVPStatus: 'attending' | 'declined' | 'maybe' | 'pending';
}
```

**Modal Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]                                                     │
│                                                          │
│  🏐 Beach Volleyball                                    │
│  📅 June 14, 2024 at 2:00 PM                           │
│  📍 Playa Espadilla                                     │
│                                                          │
│  Fun beach volleyball tournament with prizes!           │
│                                                          │
│  👥 Capacity: 12 / 20 spots remaining                  │
│  💰 Cost: $15 per person                               │
│  📋 Requirements: Bring sunscreen and water            │
│                                                          │
│  Your RSVP: Pending                                     │
│                                                          │
│  [View Full Details]  [RSVP Now]                       │
└─────────────────────────────────────────────────────────┘
```

**Modal Behavior:**
- Fade-in animation (200ms)
- Click outside to close
- Escape key to close
- Keyboard accessible (Tab navigation)
- Mobile: Full-screen on small devices
- Desktop: Centered modal (max-width: 600px)
- Loading state while fetching data
- Error state if data fetch fails

**RSVP Quick Action:**
- "RSVP Now" button opens inline RSVP form
- Form shows within modal (no navigation)
- Submit saves RSVP and updates modal
- Success message displays in modal
- "View Full Details" navigates to full page

**Data Fetching:**
```typescript
// Fetch event preview data
GET /api/guest/events/[slug]/preview

Response:
{
  success: true,
  data: {
    id: 'event-123',
    slug: 'ceremony',
    name: 'Wedding Ceremony',
    date: '2024-06-15',
    time: '16:00',
    location: 'Sunset Beach',
    description: '...',
    activities: [...],
    guestRSVPStatus: 'attending'
  }
}
```

**Integration with SectionRenderer:**
```typescript
// components/guest/SectionRenderer.tsx
{column.content_type === 'references' && (
  <div className="space-y-3">
    {(column.content_data?.references || []).map((ref: any) => (
      <div
        key={ref.id}
        onClick={() => {
          if (ref.type === 'event') {
            setPreviewModal({ type: 'event', id: ref.id, slug: ref.slug });
          } else if (ref.type === 'activity') {
            setPreviewModal({ type: 'activity', id: ref.id, slug: ref.slug });
          }
        }}
        className="border border-sage-200 rounded-lg p-4 hover:border-jungle-400 transition-colors cursor-pointer"
      >
        {/* Reference card content */}
      </div>
    ))}
  </div>
)}

{previewModal && previewModal.type === 'event' && (
  <EventPreviewModal
    eventId={previewModal.id}
    eventSlug={previewModal.slug}
    onClose={() => setPreviewModal(null)}
  />
)}

{previewModal && previewModal.type === 'activity' && (
  <ActivityPreviewModal
    activityId={previewModal.id}
    activitySlug={previewModal.slug}
    onClose={() => setPreviewModal(null)}
  />
)}
```


### Requirement 27: Guest Portal Navigation

**Component: GuestNavigation.tsx**

```typescript
interface NavigationTab {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const GUEST_NAVIGATION_TABS: NavigationTab[] = [
  { id: 'home', label: 'Home', href: '/guest/dashboard', icon: '🏠' },
  { id: 'events', label: 'Events', href: '/guest/events', icon: '🎉' },
  { id: 'activities', label: 'Activities', href: '/guest/activities', icon: '🏖️' },
  { id: 'itinerary', label: 'Itinerary', href: '/guest/itinerary', icon: '📅' },
  { id: 'photos', label: 'Photos', href: '/guest/photos', icon: '📸' },
  { id: 'info', label: 'Info', href: '#', icon: 'ℹ️', subItems: [
    { id: 'accommodations', label: 'Accommodations', href: '/guest/accommodation' },
    { id: 'transportation', label: 'Transportation', href: '/guest/transportation' },
    { id: 'contact', label: 'Contact', href: '/guest/contact' },
    { id: 'faq', label: 'FAQ', href: '/guest/faq' },
  ]},
];
```

**Desktop Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│  🌴 [Wedding Name]    Home  Events  Activities  Itinerary   │
│                       Photos  Info ▼                         │
│                                        [Guest Name] [Logout] │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Navigation:**
```
┌─────────────────────────────────────────────────────────────┐
│  ☰  [Wedding Name]                          [Guest Name]    │
└─────────────────────────────────────────────────────────────┘

[Hamburger Menu Expanded]
┌─────────────────────────────────────────────────────────────┐
│  [X]                                                         │
│                                                              │
│  🏠 Home                                                    │
│  🎉 Events                                                  │
│  🏖️ Activities                                              │
│  📅 Itinerary                                               │
│  📸 Photos                                                  │
│  ℹ️ Info                                                    │
│    • Accommodations                                         │
│    • Transportation                                         │
│    • Contact                                                │
│    • FAQ                                                    │
│                                                              │
│  [Logout]                                                   │
└─────────────────────────────────────────────────────────────┘
```

**Navigation Features:**
- Sticky positioning (top: 0)
- Active tab highlighted with emerald-600 background
- Notification badge for pending RSVPs
- Breadcrumb navigation below main nav
- Quick action floating button (bottom-right)
- Search function (Ctrl+K to open)

**Breadcrumb Navigation:**
```
Home > Events > Wedding Ceremony
```

**Quick Action Button:**
- Floating button in bottom-right corner
- Opens menu with common actions:
  - RSVP to Activity
  - Upload Photo
  - View Itinerary
  - Contact Coordinator

**Search Function:**
```typescript
// Global search across content
GET /api/guest/search?q=beach

Response:
{
  success: true,
  data: {
    contentPages: [...],
    events: [...],
    activities: [...]
  }
}
```

**State Management:**
- Active tab stored in URL path
- Scroll position preserved on back navigation
- Search history stored in session storage
- Notification count fetched on mount


### Requirement 29: Cascade Deletion and Soft Delete

**Cascade Deletion Rules:**

```
Content Page Deletion
  ├─> Delete all Sections (page_type='custom', page_id=content_page.id)
  │   └─> Delete all Columns (section_id=section.id)
  └─> Delete all Photos (page_type='custom', page_id=content_page.id)

Event Deletion
  ├─> Delete all Activities (event_id=event.id)
  │   └─> Delete all RSVPs (activity_id=activity.id)
  └─> Delete all Event RSVPs (event_id=event.id)

Activity Deletion
  └─> Delete all RSVPs (activity_id=activity.id)

Guest Group Deletion
  └─> Prevent if guests exist (require reassignment first)

Location Deletion
  └─> Prevent if referenced by events, activities, or accommodations
```

**Soft Delete Implementation:**

```sql
-- Add deleted_at columns
ALTER TABLE content_pages ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE sections ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE columns ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE photos ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update RLS policies to filter soft-deleted records
CREATE POLICY "Filter soft-deleted content_pages"
  ON content_pages FOR SELECT
  USING (deleted_at IS NULL);

-- Similar policies for other tables
```

**Service Layer Implementation:**

```typescript
// services/contentPagesService.ts
export async function deleteContentPage(id: string, soft: boolean = true): Promise<Result<void>> {
  if (soft) {
    // Soft delete - mark as deleted
    const { error } = await supabase
      .from('content_pages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
    }
    
    // Also soft delete associated sections
    await supabase
      .from('sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('page_type', 'custom')
      .eq('page_id', id);
    
  } else {
    // Hard delete - permanently remove
    await supabase.from('sections').delete().eq('page_type', 'custom').eq('page_id', id);
    await supabase.from('content_pages').delete().eq('id', id);
  }
  
  return { success: true, data: undefined };
}

export async function restoreContentPage(id: string): Promise<Result<void>> {
  const { error } = await supabase
    .from('content_pages')
    .update({ deleted_at: null })
    .eq('id', id);
  
  if (error) {
    return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
  }
  
  // Also restore associated sections
  await supabase
    .from('sections')
    .update({ deleted_at: null })
    .eq('page_type', 'custom')
    .eq('page_id', id);
  
  return { success: true, data: undefined };
}
```

**Admin Interface:**

```typescript
// components/admin/DeletedItemsManager.tsx
interface DeletedItem {
  id: string;
  type: 'content_page' | 'event' | 'activity';
  name: string;
  deletedAt: string;
  deletedBy?: string;
}

// Show deleted items in admin panel
GET /api/admin/deleted-items?type=content_page

// Restore deleted item
POST /api/admin/deleted-items/[id]/restore

// Permanently delete item
DELETE /api/admin/deleted-items/[id]/permanent
```

**Scheduled Cleanup Job:**

```typescript
// Cron job runs daily at 2 AM
// Permanently deletes items soft-deleted > 30 days ago
export async function cleanupOldDeletedItems() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await supabase
    .from('content_pages')
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', thirtyDaysAgo.toISOString());
  
  // Similar for other tables
}
```

**Referential Integrity Checks:**

```typescript
// Before deleting, check for references
export async function checkReferences(entityType: string, entityId: string): Promise<Reference[]> {
  const references: Reference[] = [];
  
  // Check sections referencing this entity
  const { data: sections } = await supabase
    .from('sections')
    .select('*, columns(*)')
    .eq('deleted_at', null);
  
  for (const section of sections || []) {
    for (const column of section.columns) {
      if (column.content_type === 'references') {
        const refs = column.content_data?.references || [];
        const hasReference = refs.some((r: any) => r.id === entityId && r.type === entityType);
        if (hasReference) {
          references.push({
            type: 'section',
            id: section.id,
            name: section.title || 'Untitled Section',
          });
        }
      }
    }
  }
  
  return references;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Navigation Properties

**Property 1: Active Tab Highlighting**
*For any* navigation tab that is currently active, the tab SHALL display highlighting with emerald-600 background color
**Validates: Requirements 1.9**

**Property 2: Navigation State Persistence**
*For any* navigation within the same tab, the active tab and sub-item state SHALL be preserved in session storage and restored on page refresh
**Validates: Requirements 1.10, 20.1, 20.2, 20.3**

**Property 3: Mobile Navigation Responsiveness**
*For any* viewport width less than 768px, the navigation SHALL display a hamburger menu instead of horizontal tabs
**Validates: Requirements 1.8, 27.4**

### RSVP Management Properties

**Property 4: RSVP Status Toggle Cycle**
*For any* RSVP status control, clicking SHALL cycle through states in order: pending → attending → maybe → declined → pending
**Validates: Requirements 2.4**

**Property 5: Capacity Constraint Enforcement**
*For any* RSVP update that would cause an activity to exceed its capacity, the update SHALL be rejected with a validation error
**Validates: Requirements 2.9, 10.7**

**Property 6: RSVP Save Feedback**
*For any* RSVP change operation, the system SHALL display visual feedback (loading spinner during save, success/error message after completion)
**Validates: Requirements 2.10**

**Property 7: Guest Count Validation**
*For any* activity RSVP with guest count, the guest count SHALL be less than or equal to the activity's maximum guests per party setting
**Validates: Requirements 10.3**

**Property 8: RSVP Deadline Enforcement**
*For any* RSVP submission after the deadline, the system SHALL reject the submission with a deadline error
**Validates: Requirements 10.5**

### Admin User Management Properties

**Property 9: Invitation Email Sending**
*For any* newly created admin user, an invitation email SHALL be sent to the provided email address
**Validates: Requirements 3.2**

**Property 10: Owner-Only Action Restriction**
*For any* restricted action (delete wedding, manage billing, delete admin users), only users with role='owner' SHALL be able to perform the action
**Validates: Requirements 3.4**

**Property 11: Deactivated Account Login Prevention**
*For any* admin user with status='inactive', authentication attempts SHALL be rejected with an unauthorized error
**Validates: Requirements 3.8**

**Property 12: Last Owner Protection**
*For any* deletion or deactivation attempt on an admin user, IF that user is the last remaining owner, THEN the operation SHALL be prevented with a validation error
**Validates: Requirements 3.10**

**Property 13: Admin Action Audit Logging**
*For any* admin user management action (create, update, delete, deactivate), an audit log entry SHALL be created with action details
**Validates: Requirements 3.9**

### Authentication Properties

**Property 14: Email Matching Authentication**
*For any* guest with auth_method='email_matching', authentication SHALL succeed if and only if the provided email matches the guest's email in the database
**Validates: Requirements 5.2, 22.4**

**Property 15: Magic Link Token Expiry**
*For any* magic link token, the token SHALL be invalid after 15 minutes from creation time
**Validates: Requirements 5.9**

**Property 16: Magic Link Single Use**
*For any* magic link token, after successful authentication, the token SHALL be marked as used and SHALL NOT be valid for subsequent authentication attempts
**Validates: Requirements 5.3**

**Property 17: Session Expiry**
*For any* guest session, the session SHALL expire after 24 hours of inactivity
**Validates: Requirements 20.8**

### Guest Profile and Family Management Properties

**Property 18: Personalized Content Display**
*For any* logged-in guest, the displayed content SHALL be filtered based on their group membership and RSVP status
**Validates: Requirements 6.1**

**Property 19: Group Owner Edit Permissions**
*For any* guest who is a group owner, they SHALL be able to update profile information and RSVP status for all members in their group
**Validates: Requirements 6.4, 6.5, 6.6, 6.7**

**Property 20: Row Level Security Enforcement**
*For any* guest data query, the results SHALL only include data for guests in the same group as the authenticated user
**Validates: Requirements 6.10, 20.1**

**Property 21: Profile Update Confirmation**
*For any* successful profile or RSVP update, the system SHALL display a confirmation message to the user
**Validates: Requirements 6.8**

**Property 22: Critical Update Notifications**
*For any* guest update to dietary restrictions, plus-ones, or RSVP changes, an email notification SHALL be sent to admins
**Validates: Requirements 6.12**

### Slug Generation Properties

**Property 23: Slug URL Safety**
*For any* generated slug, the slug SHALL contain only lowercase letters, numbers, and hyphens, and SHALL contain at least one alphanumeric character
**Validates: Requirements 24.2, 24.9**

**Property 24: Slug Uniqueness**
*For any* content page, event, or activity, the slug SHALL be unique within its entity type (no two content pages with same slug, no two events with same slug, etc.)
**Validates: Requirements 24.3, 24.4, 24.5**

**Property 25: Slug Preservation on Update**
*For any* entity update where the slug field is not empty, the existing slug SHALL be preserved even if the title changes
**Validates: Requirements 24.7**

**Property 26: Slug Generation from Title**
*For any* entity creation where the slug field is empty, a slug SHALL be automatically generated from the title using the generateSlug utility
**Validates: Requirements 24.1**

### Reference Block Properties

**Property 27: Reference Existence Validation**
*For any* reference block added to a section, the referenced entity SHALL exist in the database before the section is saved
**Validates: Requirements 21.8**

**Property 28: Circular Reference Detection**
*For any* reference block that would create a circular reference path (page A → page B → page A), the system SHALL reject the reference with a validation error
**Validates: Requirements 21.9**

**Property 29: Reference Preview Data Completeness**
*For any* reference block modal preview, the displayed data SHALL include all required fields: name, date/time (if applicable), location (if applicable), and guest RSVP status
**Validates: Requirements 25.2, 25.3, 25.6, 25.7**

### Cascade Deletion Properties

**Property 30: Content Page Cascade Deletion**
*For any* content page deletion, all associated sections and columns SHALL also be deleted (or soft-deleted if using soft delete)
**Validates: Requirements 29.1, 29.2**

**Property 31: Event Cascade Deletion**
*For any* event deletion, all associated activities and RSVPs SHALL also be deleted
**Validates: Requirements 29.1**

**Property 32: Soft Delete Filtering**
*For any* query on a table with soft delete support, records with deleted_at IS NOT NULL SHALL be excluded from results (unless explicitly querying deleted items)
**Validates: Requirements 29.8**

**Property 33: Soft Delete Restoration**
*For any* soft-deleted item restored within 30 days, the item and all its cascaded children SHALL have their deleted_at field set to NULL
**Validates: Requirements 29.9**

**Property 34: Referential Integrity Check**
*For any* entity deletion attempt, IF the entity is referenced by other entities, THEN the system SHALL display a warning with the list of dependent records
**Validates: Requirements 29.4**

### Itinerary Properties

**Property 35: Itinerary Chronological Ordering**
*For any* guest itinerary, activities SHALL be displayed in chronological order grouped by date
**Validates: Requirements 26.2**

**Property 36: Itinerary RSVP Filtering**
*For any* guest itinerary, only activities where the guest has RSVP status='attending' SHALL be included
**Validates: Requirements 26.1**

**Property 37: Itinerary Reminder Emails**
*For any* activity in a guest's itinerary, a reminder email SHALL be sent 48 hours before the activity start time
**Validates: Requirements 26.10**

### Visual Identity Properties

**Property 38: Focus Indicator Visibility**
*For any* interactive element, when focused via keyboard navigation, a visible emerald-500 outline SHALL be displayed
**Validates: Requirements 30.4**

**Property 39: Color Contrast Compliance**
*For any* text element, the color contrast ratio between text and background SHALL be at least 4.5:1 for normal text and 3:1 for large text
**Validates: Requirements 30.4**

**Property 40: Touch Target Size**
*For any* interactive element on mobile devices, the touch target size SHALL be at least 44px × 44px
**Validates: Requirements 16.3**


## Error Handling

### Error Categories

**Validation Errors (400)**
- Invalid email format
- Empty required fields
- Slug format violations
- Capacity exceeded
- Deadline passed
- Invalid RSVP status

**Authentication Errors (401)**
- Email not found
- Magic link expired
- Magic link already used
- Session expired
- Invalid credentials

**Authorization Errors (403)**
- Non-owner attempting restricted action
- Guest accessing another group's data
- Deactivated admin attempting login
- Last owner deletion attempt

**Not Found Errors (404)**
- Guest not found
- Event not found
- Activity not found
- Content page not found
- Reference entity not found

**Conflict Errors (409)**
- Duplicate slug
- Circular reference detected
- Referenced entity in use

**Server Errors (500)**
- Database connection failure
- Email service unavailable
- External service timeout

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
}
```

### User-Facing Error Messages

**Validation Errors:**
- "Please enter a valid email address"
- "This field is required"
- "Activity is at full capacity"
- "RSVP deadline has passed"
- "Slug must contain only lowercase letters, numbers, and hyphens"

**Authentication Errors:**
- "Email not found. Please check your email address."
- "This login link has expired. Please request a new one."
- "This login link has already been used. Please request a new one."
- "Your session has expired. Please log in again."

**Authorization Errors:**
- "You don't have permission to perform this action"
- "Cannot delete the last owner account"
- "Your account has been deactivated. Please contact an administrator."

**Not Found Errors:**
- "Page not found"
- "Event not found"
- "Activity not found"

**Conflict Errors:**
- "A page with this slug already exists. Try: [suggested-slug]"
- "This reference would create a circular loop"
- "Cannot delete: This item is referenced by other pages"

### Error Recovery Strategies

**Network Errors:**
- Retry failed requests up to 3 times with exponential backoff
- Display offline indicator if network unavailable
- Queue actions for retry when connection restored

**Session Expiry:**
- Detect expired session on API call
- Redirect to login page with return URL
- Preserve form data in session storage
- Restore form data after re-authentication

**Validation Errors:**
- Highlight invalid fields in red
- Display inline error messages
- Prevent form submission until errors resolved
- Provide suggestions for fixing errors

**Capacity Errors:**
- Display remaining capacity before RSVP
- Show waitlist option if capacity full
- Notify guest when spot becomes available


## Testing Strategy

### Dual Testing Approach

**Unit Tests (60%)**
- Service method business logic
- Utility functions (slug generation, sanitization)
- Component rendering and interactions
- Hook state management
- Validation logic

**Property-Based Tests (30%)**
- RSVP capacity constraints
- Slug generation rules
- Circular reference detection
- Cascade deletion behavior
- Authentication flows
- Row Level Security enforcement

**E2E Tests (10%)**
- Complete user workflows
- Guest authentication flows
- RSVP submission flows
- Admin user management flows
- Reference block creation flows
- Navigation state persistence

### Property-Based Test Configuration

**Minimum 100 iterations per property test**

**Tag Format:**
```typescript
// Feature: guest-portal-and-admin-enhancements, Property 23: Slug URL Safety
test('slug generation produces URL-safe slugs', () => {
  fc.assert(
    fc.property(fc.string(), (title) => {
      const slug = generateSlug(title);
      if (slug) {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug).toMatch(/[a-z0-9]/); // At least one alphanumeric
      }
    }),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Critical Paths (100%)**
- Authentication flows
- RSVP submission
- Admin user management
- Cascade deletion
- Row Level Security

**Service Layer (90%)**
- All service methods
- All business rules
- All validation logic
- All error paths

**API Routes (85%)**
- All endpoints
- All HTTP methods
- All error responses
- All authentication checks

**Components (70%)**
- All user interactions
- All state changes
- All conditional rendering
- All error states

### Regression Test Requirements

**All bugs fixed must have corresponding regression tests**

**Existing Regression Tests:**
- `__tests__/regression/guestGroupsRls.regression.test.ts` - RLS policy enforcement
- `__tests__/regression/contentPagesRls.regression.test.ts` - Content page RLS
- `__tests__/regression/sectionsColumnsRls.regression.test.ts` - Section RLS
- `__tests__/regression/photosRls.regression.test.ts` - Photo RLS
- `__tests__/regression/photoFieldConsistency.regression.test.ts` - Photo field consistency
- `__tests__/regression/guestViewRoutes.regression.test.ts` - Guest view routing
- `__tests__/regression/dynamicRoutes.regression.test.ts` - Dynamic route handling

**New Regression Tests Needed:**
- Authentication method switching
- Magic link token expiry
- Circular reference detection
- Cascade deletion with soft delete
- Slug uniqueness enforcement
- Reference block validation
- Inline RSVP capacity validation
- Last owner protection

### E2E Test Scenarios

**Guest Authentication Flow:**
1. Visit guest login page
2. Enter email (email matching)
3. Verify redirect to dashboard
4. Verify personalized content displayed
5. Logout and verify session cleared

**Magic Link Flow:**
1. Visit guest login page
2. Switch to magic link tab
3. Enter email
4. Check email for magic link
5. Click magic link
6. Verify redirect to dashboard
7. Attempt to reuse link (should fail)

**RSVP Submission Flow:**
1. Login as guest
2. Navigate to activities page
3. Click RSVP on activity
4. Fill in guest count and dietary restrictions
5. Submit RSVP
6. Verify confirmation message
7. Verify RSVP appears in itinerary

**Admin User Management Flow:**
1. Login as owner
2. Navigate to admin users page
3. Add new admin user
4. Verify invitation email sent
5. Deactivate admin user
6. Verify user cannot login
7. Attempt to delete last owner (should fail)

**Reference Block Creation Flow:**
1. Login as admin
2. Navigate to home page manager
3. Add new section
4. Change column type to references
5. Search for event
6. Add event reference
7. Preview reference block
8. Publish changes
9. Login as guest
10. Verify reference block displays
11. Click reference block
12. Verify modal opens with event preview

### Performance Testing

**Load Testing:**
- 500 concurrent guests
- 1000 RSVP submissions per minute
- 100 admin users managing content simultaneously

**Response Time Targets:**
- API endpoints: < 500ms (p95)
- Page load: < 2 seconds (p95)
- RSVP submission: < 1 second (p95)
- Search: < 300ms (p95)

**Database Query Optimization:**
- All queries use indexes
- N+1 query prevention
- Pagination for large result sets
- Caching for frequently accessed data

### Accessibility Testing

**Automated Tests:**
- Axe-core integration in E2E tests
- Color contrast validation
- ARIA label validation
- Keyboard navigation testing

**Manual Testing:**
- Screen reader testing (NVDA, JAWS)
- Keyboard-only navigation
- Mobile touch target testing
- Zoom testing (up to 200%)

**WCAG 2.1 AA Compliance:**
- All interactive elements keyboard accessible
- All images have alt text
- All forms have labels
- Color contrast ratios meet standards
- Focus indicators visible
- Skip navigation links provided


## State Management

### Client-Side State

**Navigation State:**
- Active tab: `sessionStorage.getItem('activeTab')`
- Active sub-item: `sessionStorage.getItem('activeSubItem')`
- Scroll position: `sessionStorage.getItem('scrollPosition')`
- Breadcrumb history: `sessionStorage.getItem('breadcrumbs')`

**Authentication State:**
- Guest session: HTTP-only cookie `guest_session`
- Admin session: HTTP-only cookie `admin_session`
- Session expiry: 24 hours
- Refresh on activity

**Form State:**
- Draft content: `localStorage.getItem('draft_[pageId]')`
- Auto-save interval: 30 seconds
- Restore on page load
- Clear on successful save

**RSVP State:**
- Cached RSVP data: React Query cache (5 minutes)
- Optimistic updates: Immediate UI update, rollback on error
- Pending changes: Queue for batch submission

**Search State:**
- Search history: `sessionStorage.getItem('searchHistory')`
- Recent searches: Last 10 searches
- Search filters: URL query parameters

### Server-Side State

**Database State:**
- PostgreSQL with Row Level Security
- Real-time subscriptions for live updates
- Optimistic locking for concurrent edits
- Audit log for all mutations

**Session State:**
- Session tokens stored in database
- Session metadata (IP, user agent, last activity)
- Automatic cleanup of expired sessions
- Rate limiting per session

**Cache State:**
- Redis cache for frequently accessed data
- Cache invalidation on mutations
- TTL: 5 minutes for dynamic data, 1 hour for static data
- Cache warming on deployment

### State Synchronization

**Real-Time Updates:**
- Supabase real-time subscriptions for RSVP changes
- WebSocket connection for live notifications
- Automatic reconnection on disconnect
- Conflict resolution: Last write wins

**Optimistic Updates:**
- Immediate UI update on user action
- Background API call to persist change
- Rollback UI on error
- Display error message and retry option

**Offline Support:**
- Service worker for offline caching
- Queue mutations for retry when online
- Display offline indicator
- Sync queued actions on reconnection


## Performance Optimization

### Frontend Optimization

**Code Splitting:**
- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading for below-the-fold content
- Prefetching for likely next pages

**Image Optimization:**
- Next.js Image component for automatic optimization
- WebP format with fallback
- Responsive images with srcset
- Lazy loading with intersection observer
- CDN delivery via Backblaze B2

**Bundle Optimization:**
- Tree shaking for unused code
- Minification and compression
- Gzip/Brotli compression
- Critical CSS inlining
- Font subsetting

**Rendering Optimization:**
- Server-side rendering for initial load
- Static generation for content pages
- Incremental static regeneration
- React Server Components where applicable

**Caching Strategy:**
- Static assets: 1 year cache
- API responses: 5 minutes cache
- Content pages: 1 hour cache
- User-specific data: No cache

### Backend Optimization

**Database Optimization:**
- Indexes on frequently queried columns
- Composite indexes for multi-column queries
- Partial indexes for filtered queries
- Query plan analysis and optimization

**API Optimization:**
- Response compression
- Pagination for large result sets
- Field selection to reduce payload size
- Batch endpoints for multiple operations

**Caching Strategy:**
- Redis cache for hot data
- Database query result caching
- CDN caching for static content
- Edge caching for API responses

**Connection Pooling:**
- Supabase connection pooling
- Maximum 100 connections
- Connection timeout: 30 seconds
- Idle connection cleanup

### Performance Monitoring

**Metrics to Track:**
- Page load time (p50, p95, p99)
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- API response time
- Database query time

**Performance Budgets:**
- Initial bundle size: < 200KB
- Total page weight: < 1MB
- API response time: < 500ms (p95)
- Database query time: < 100ms (p95)
- Lighthouse performance score: > 90

**Monitoring Tools:**
- Vercel Analytics for real user monitoring
- Sentry for error tracking
- Custom performance logging
- Database query logging


## Security Considerations

### Authentication Security

**Password-less Authentication:**
- Magic links use cryptographically secure tokens (32 bytes)
- Tokens expire after 15 minutes
- Tokens are single-use only
- Tokens stored hashed in database

**Session Security:**
- HTTP-only cookies prevent XSS attacks
- Secure flag requires HTTPS
- SameSite=Lax prevents CSRF
- Session tokens rotated on privilege escalation
- Sessions expire after 24 hours inactivity

**Rate Limiting:**
- 5 login attempts per email per hour
- 100 API requests per user per minute
- 10 magic link requests per email per hour
- Exponential backoff on repeated failures

### Authorization Security

**Row Level Security (RLS):**
- All database queries filtered by RLS policies
- Guests can only access their group's data
- Admins can access all data
- Service role bypasses RLS (admin operations only)

**Role-Based Access Control:**
- Owner role: Full access to all features
- Admin role: Limited access (no billing, no user management)
- Guest role: Read-only access to own group data
- Group owner: Edit access to group members

**API Authorization:**
- All API routes check authentication
- Protected routes verify session token
- Admin routes verify admin role
- Owner-only routes verify owner role

### Input Validation

**Client-Side Validation:**
- Form validation before submission
- Type checking with TypeScript
- Zod schema validation
- Sanitization of user input

**Server-Side Validation:**
- All inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via DOMPurify sanitization
- CSRF protection via SameSite cookies

**File Upload Security:**
- File type validation (images only)
- File size limits (10MB max)
- Virus scanning (future enhancement)
- Secure file storage with signed URLs

### Data Protection

**Encryption:**
- HTTPS for all connections (TLS 1.3)
- Database encryption at rest
- Sensitive data encrypted in database
- Secure token generation

**Data Privacy:**
- Guest data isolated by group
- Admin audit logging
- GDPR compliance (data export, deletion)
- Privacy policy and terms of service

**Backup and Recovery:**
- Daily database backups
- Point-in-time recovery
- Backup encryption
- Disaster recovery plan

### Security Monitoring

**Audit Logging:**
- All admin actions logged
- All authentication attempts logged
- All data mutations logged
- Log retention: 90 days

**Anomaly Detection:**
- Unusual login patterns
- Rapid API requests
- Failed authentication attempts
- Privilege escalation attempts

**Incident Response:**
- Security incident playbook
- Automated alerting for suspicious activity
- Manual review of audit logs
- Regular security audits


## Visual Design System

### Pura Vida Color Palette

**Primary Colors:**
```css
--emerald-600: #10b981;  /* Primary actions, links */
--emerald-500: #22c55e;  /* Focus indicators */
--emerald-400: #34d399;  /* Hover states */

--jungle-800: #065f46;   /* Headers, dark text */
--jungle-700: #047857;   /* Navigation */
--jungle-600: #059669;   /* Active states */

--sage-900: #111827;     /* Body text */
--sage-700: #374151;     /* Secondary text */
--sage-600: #4b5563;     /* Tertiary text */
--sage-200: #e5e7eb;     /* Borders */
--sage-100: #f3f4f6;     /* Backgrounds */

--ocean-600: #0891b2;    /* Info states */
--ocean-500: #06b6d4;    /* Accent */
--ocean-400: #22d3ee;    /* Highlights */

--sunset-600: #f59e0b;   /* Warning states */
--sunset-500: #fbbf24;   /* Alerts */
--sunset-400: #fcd34d;   /* Highlights */

--volcano-600: #dc2626;  /* Error states */
--volcano-500: #ef4444;  /* Destructive actions */
--volcano-400: #f87171;  /* Error highlights */

--cloud-50: #f9fafb;     /* Light backgrounds */
--cloud-white: #ffffff;  /* Cards, modals */
```

### Typography

**Font Families:**
```css
--font-serif: 'Playfair Display', Georgia, serif;  /* Headings */
--font-sans: 'Inter', -apple-system, sans-serif;   /* Body */
```

**Type Scale:**
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

**Line Heights:**
```css
--leading-tight: 1.2;   /* Headings */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.75; /* Long-form content */
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Styles

**TropicalButton:**
```css
.tropical-button {
  background: var(--emerald-600);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 200ms;
}

.tropical-button:hover {
  background: var(--emerald-700);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.tropical-button:focus {
  outline: 2px solid var(--emerald-500);
  outline-offset: 2px;
}
```

**TropicalCard:**
```css
.tropical-card {
  background: white;
  border-radius: 1rem;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--sage-200);
}

.tropical-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--jungle-400);
}
```

**Glassmorphism Effect:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Iconography

**TropicalIcon Component:**
- Hibiscus: 🌺 (primary brand icon)
- Palm: 🌴 (navigation, headers)
- Coconut: 🥥 (food, activities)
- Beach: 🏖️ (activities, locations)
- Sunset: 🌅 (events, photos)
- Wave: 🌊 (water activities)
- Pineapple: 🍍 (welcome, tropical theme)

**Emoji Fallbacks:**
- When TropicalIcon doesn't have specific icon
- Use relevant emoji with aria-label
- Ensure emoji renders consistently across platforms

### Accessibility

**Focus Indicators:**
```css
*:focus-visible {
  outline: 2px solid var(--emerald-500);
  outline-offset: 2px;
}
```

**Color Contrast:**
- Text on white: sage-900 (21:1 ratio)
- Text on sage-100: sage-900 (18:1 ratio)
- Links: emerald-600 (4.5:1 ratio)
- Buttons: white on emerald-600 (4.5:1 ratio)

**Touch Targets:**
```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-3);
}
```

### Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

**Mobile-First Approach:**
- Base styles for mobile (< 640px)
- Tablet styles at md breakpoint
- Desktop styles at lg breakpoint
- Large desktop styles at xl breakpoint


## Implementation Phases

### Phase 1: Admin Navigation Redesign (Week 1)

**Goals:**
- Implement horizontal top navigation
- Add mobile responsive menu
- Persist navigation state
- Update all admin pages to use new navigation

**Deliverables:**
- `components/admin/TopNavigation.tsx`
- `app/admin/layout.tsx` (updated)
- Navigation state management
- Mobile hamburger menu
- Session storage persistence

**Testing:**
- Unit tests for TopNavigation component
- E2E tests for navigation flows
- Mobile responsiveness tests
- State persistence tests

### Phase 2: Guest Authentication (Week 2)

**Goals:**
- Implement email matching authentication
- Implement magic link authentication
- Add authentication method configuration
- Create guest login page

**Deliverables:**
- `app/auth/guest-login/page.tsx`
- `app/api/auth/guest/email-match/route.ts`
- `app/api/auth/guest/magic-link/route.ts`
- `app/api/auth/guest/magic-link/verify/route.ts`
- Database migrations for auth_method field
- Admin settings for auth method configuration

**Testing:**
- Unit tests for authentication logic
- E2E tests for both auth flows
- Security tests for token expiry
- Rate limiting tests

### Phase 3: Inline RSVP Management (Week 3)

**Goals:**
- Implement inline RSVP editor
- Add capacity validation
- Optimize performance for large guest lists
- Add batch update support

**Deliverables:**
- `components/admin/InlineRSVPEditor.tsx`
- `app/api/admin/guests/[id]/rsvps/route.ts`
- Optimistic UI updates
- Capacity validation logic
- Performance optimizations

**Testing:**
- Unit tests for RSVP editor
- Property tests for capacity validation
- Performance tests for 500+ guests
- E2E tests for RSVP workflows

### Phase 4: Guest Portal Foundation (Week 4)

**Goals:**
- Implement guest navigation
- Create guest dashboard
- Add personalized content display
- Implement family management

**Deliverables:**
- `components/guest/GuestNavigation.tsx`
- `app/guest/dashboard/page.tsx`
- `app/guest/layout.tsx`
- Family member management UI
- Row Level Security enforcement

**Testing:**
- Unit tests for guest components
- Property tests for RLS enforcement
- E2E tests for guest workflows
- Accessibility tests

### Phase 5: Reference Blocks and Section Manager (Week 5)

**Goals:**
- Implement reference block picker
- Add circular reference detection
- Create reference preview modals
- Enhance section editor

**Deliverables:**
- `components/admin/ReferenceBlockPicker.tsx`
- `components/admin/ReferencePreview.tsx`
- `components/guest/EventPreviewModal.tsx`
- `components/guest/ActivityPreviewModal.tsx`
- Circular reference detection algorithm
- Reference validation logic

**Testing:**
- Unit tests for reference components
- Property tests for circular reference detection
- E2E tests for reference workflows
- Integration tests for reference validation

### Phase 6: Lexkit Editor Integration (Week 6)

**Goals:**
- Replace RichTextEditor with Lexkit
- Maintain backward compatibility
- Improve performance
- Update all usages

**Deliverables:**
- `components/admin/RichTextEditor.tsx` (replaced)
- Lexkit configuration
- Toolbar implementation
- Slash commands
- Image picker integration

**Testing:**
- Unit tests for editor component
- Integration tests with SectionEditor
- Performance benchmarks
- Accessibility tests

### Phase 7: Slug Management and Dynamic Routes (Week 7)

**Goals:**
- Add slug generation for events and activities
- Implement slug-based routing
- Add preview mode support
- Migrate existing records

**Deliverables:**
- Database migrations for slug columns
- Slug generation triggers
- `app/event/[slug]/page.tsx` (updated)
- `app/activity/[slug]/page.tsx` (updated)
- Migration script for existing records

**Testing:**
- Property tests for slug generation
- Unit tests for slug validation
- E2E tests for slug-based routing
- Migration verification tests

### Phase 8: Admin User Management and Email System (Week 8)

**Goals:**
- Implement admin user management
- Create email template system
- Add email history tracking
- Implement scheduled emails

**Deliverables:**
- `components/admin/AdminUserManager.tsx`
- `app/admin/admin-users/page.tsx`
- `app/api/admin/admin-users/route.ts`
- `app/api/admin/emails/templates/route.ts`
- `app/api/admin/emails/send/route.ts`
- Email template editor
- Email history viewer

**Testing:**
- Unit tests for admin user management
- Property tests for last owner protection
- E2E tests for email workflows
- Integration tests for email service

### Phase 9: Guest Content Pages and Activities (Week 9)

**Goals:**
- Implement guest events page
- Implement guest activities page
- Add RSVP functionality
- Create itinerary viewer

**Deliverables:**
- `app/guest/events/page.tsx`
- `app/guest/activities/page.tsx`
- `app/guest/itinerary/page.tsx`
- `components/guest/EventCard.tsx`
- `components/guest/ActivityCard.tsx`
- `components/guest/ItineraryViewer.tsx` (enhanced)

**Testing:**
- Unit tests for guest pages
- E2E tests for RSVP workflows
- Integration tests for itinerary generation
- Accessibility tests

### Phase 10: Cascade Deletion and Soft Delete (Week 10)

**Goals:**
- Implement soft delete functionality
- Add cascade deletion logic
- Create deleted items manager
- Implement scheduled cleanup

**Deliverables:**
- Database migrations for deleted_at columns
- Soft delete service methods
- `components/admin/DeletedItemsManager.tsx`
- Scheduled cleanup job
- Referential integrity checks

**Testing:**
- Property tests for cascade deletion
- Unit tests for soft delete logic
- E2E tests for deletion workflows
- Integration tests for cleanup job

### Phase 11: Performance Optimization and Polish (Week 11)

**Goals:**
- Optimize database queries
- Implement caching strategy
- Add performance monitoring
- Optimize bundle size

**Deliverables:**
- Database indexes
- Redis caching layer
- Performance monitoring setup
- Bundle optimization
- Image optimization

**Testing:**
- Performance benchmarks
- Load testing
- Query optimization verification
- Bundle size analysis

### Phase 12: Final Testing and Documentation (Week 12)

**Goals:**
- Complete regression test suite
- Perform security audit
- Write user documentation
- Conduct accessibility audit

**Deliverables:**
- Complete test coverage
- Security audit report
- User documentation
- Accessibility audit report
- Deployment checklist

**Testing:**
- Full regression test suite
- Security penetration testing
- Accessibility compliance testing
- User acceptance testing

## Deployment Strategy

### Staging Deployment

**Pre-Deployment Checklist:**
- All tests passing (unit, integration, E2E, property)
- Code review completed
- Database migrations tested
- Performance benchmarks met
- Security audit passed
- Accessibility audit passed

**Staging Environment:**
- Deploy to staging environment
- Run smoke tests
- Perform manual testing
- Verify all features working
- Check performance metrics
- Test with real data (anonymized)

### Production Deployment

**Deployment Steps:**
1. Create database backup
2. Run database migrations
3. Deploy new code
4. Verify deployment successful
5. Run smoke tests
6. Monitor error rates
7. Monitor performance metrics
8. Verify all features working

**Rollback Plan:**
- Keep previous version deployed
- Database migration rollback scripts ready
- Feature flags for gradual rollout
- Monitoring alerts configured
- On-call engineer available

**Post-Deployment:**
- Monitor error rates for 24 hours
- Monitor performance metrics
- Collect user feedback
- Address any issues immediately
- Document lessons learned

