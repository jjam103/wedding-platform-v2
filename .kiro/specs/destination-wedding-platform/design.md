# Design Document: Destination Wedding Management Platform

## Overview

The Destination Wedding Management Platform is a comprehensive web application built with Next.js 16, React 19, and TypeScript that enables wedding couples and their families to coordinate complex destination weddings. The system provides two primary interfaces: an Admin Portal for wedding hosts to manage all aspects of the wedding, and a Guest Portal for attendees to access information and manage their participation.

The platform follows a service-oriented architecture with clear separation between presentation (React components), business logic (service layer), and data access (Supabase integration). The system emphasizes multi-owner collaboration, allowing multiple family members to coordinate guest groups while maintaining strict data isolation through Row Level Security (RLS).

### Key Design Principles

1. **Multi-Tenancy with RLS**: Group-based data isolation enforced at the database level
2. **Service Layer Pattern**: Business logic centralized in dedicated service modules
3. **Type Safety**: Strict TypeScript with Zod validation for all data contracts
4. **Dual Testing**: Unit tests for specific cases, property-based tests for universal rules
5. **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with React
6. **Graceful Degradation**: Fallback mechanisms for all external service dependencies

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Admin Portal   │         │   Guest Portal   │         │
│  │  (Host/Owner)    │         │    (Guests)      │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                             │                    │
│           └──────────────┬──────────────┘                    │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                  Next.js App Router                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │              API Routes Layer                       │     │
│  │  /api/guests  /api/activities  /api/photos  etc.  │     │
│  └────────────────────┬───────────────────────────────┘     │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│               Service Layer (Business Logic)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Guest   │ │ Activity │ │   RSVP   │ │  Photo   │       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ... (17 total service modules)                             │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                 Data Access Layer                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Supabase Client (PostgreSQL + Auth)        │     │
│  │              with Row Level Security               │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│              External Services                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Backblaze│ │  Resend  │ │  Twilio  │ │  Gemini  │       │
│  │ B2 + CDN │ │  Email   │ │   SMS    │ │   AI     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 with Costa Rica-themed color palette
- **Backend**: Next.js API Routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth (email-based with magic links)
- **Storage**: Backblaze B2 (primary) + Cloudflare CDN, Supabase Storage (fallback)
- **Email**: Resend with webhook tracking
- **SMS**: Twilio for fallback communications
- **AI**: Google Gemini API for content extraction
- **Testing**: Jest 29 + React Testing Library + fast-check (property-based testing)
- **Build**: SWC compiler with React Compiler optimizations

### Costa Rica Theming

**Color Palette**:
```typescript
const costaRicaTheme = {
  jungle: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Primary jungle green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  sunset: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',  // Primary sunset orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  ocean: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Primary ocean blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  volcano: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',  // Primary volcano red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  sage: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',  // Primary sage gray
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  cloud: {
    50: '#ffffff',
    100: '#fefefe',
    200: '#fafafa',
    300: '#f5f5f5',
    400: '#efefef',
    500: '#e5e5e5',  // Primary cloud white
    600: '#d4d4d4',
    700: '#a3a3a3',
    800: '#737373',
    900: '#525252',
  },
};
```

**Typography**:
- Font family: System fonts with fallback to sans-serif
- Heading scale: 2xl, xl, lg, base, sm, xs
- Line heights: Relaxed for readability in tropical aesthetic
- Letter spacing: Slightly wider for airy feel

**Tropical UI Elements**:
- Custom tropical icons (palm trees, waves, sun)
- "Pura Vida" branding in header and footer
- Rounded corners for softer, organic feel
- Subtle shadow effects for depth
- Smooth transitions with tropical-themed animations

**Animation Effects**:
```typescript
const tropicalAnimations = {
  fadeIn: 'fade-in 0.5s ease-in',
  slideUp: 'slide-up 0.6s ease-out',
  wave: 'wave 2s ease-in-out infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};
```

**Accessibility Compliance**:
- All color combinations meet WCAG 2.1 AA contrast ratios
- Jungle green on white: 4.5:1 (AA compliant)
- Ocean blue on white: 4.5:1 (AA compliant)
- Sunset orange on dark backgrounds only
- Volcano red for alerts with sufficient contrast

### Progressive Web App (PWA) Architecture

**Service Worker Strategy**:
```typescript
// Cache-first strategy for static assets
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const ITINERARY_CACHE = 'itinerary-v1';

// Cached resources
const staticAssets = [
  '/',
  '/offline',
  '/styles/globals.css',
  '/images/logo.png',
  '/images/tropical-icons.svg',
];

// Cache strategies by route
const cacheStrategies = {
  '/api/itinerary': 'cache-first',
  '/api/events': 'network-first',
  '/api/activities': 'network-first',
  '/api/accommodations': 'cache-first',
  '/images': 'cache-first',
  '/api/rsvp': 'network-only',
};
```

**Offline Capabilities**:
- **Fully Offline**: Itinerary viewing, cached event/activity details, accommodation information
- **Requires Online**: RSVP submission, photo uploads, real-time updates
- **Sync on Reconnect**: Queued RSVP changes, draft photo uploads

**Web App Manifest**:
```json
{
  "name": "Costa Rica Wedding",
  "short_name": "CR Wedding",
  "description": "Destination Wedding Management Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#22c55e",
  "theme_color": "#22c55e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Cache Management**:
- Itineraries cached for 24 hours
- Event/activity data cached for 12 hours
- Static assets cached indefinitely
- Photos cached on-demand
- Cache invalidation on data updates

**Offline Indicators**:
- Toast notification when going offline
- Offline badge in navigation
- Disabled state for online-only features
- Queue indicator for pending syncs


## Components and Interfaces

### Core Service Modules

The system implements 17 service modules that encapsulate all business logic:

1. **guestService**: Guest CRUD operations, bulk operations, CSV import/export
2. **rsvpService**: Event and activity RSVP management, response tracking
3. **activityService**: Activity creation, scheduling, capacity management
4. **photoService**: Photo uploads, moderation workflow, dual-storage management
5. **accommodationService**: Room types, assignments, pricing calculations
6. **locationService**: Hierarchical location management
7. **budgetService**: Cost calculations, subsidy tracking
8. **contentService**: CMS operations for dynamic pages
9. **emailService**: Template management, bulk sending, delivery tracking
10. **b2Service**: Backblaze B2 integration with health checks
11. **accessControlService**: Authorization and permission checks
12. **rsvpAnalyticsService**: Response rate calculations, capacity alerts
13. **eventService**: Event management and scheduling
14. **transportationService**: Flight tracking, shuttle coordination
15. **itineraryService**: Personalized itinerary generation
16. **gallerySettingsService**: Photo gallery configuration
17. **sectionsService**: Page section management for CMS

### Detailed Service Specifications

**gallerySettingsService**:
```typescript
interface GallerySettingsService {
  // Get gallery settings for a page
  getSettings(pageType: string, pageId: string): Promise<Result<GallerySettings>>;
  
  // Update gallery display mode
  updateDisplayMode(pageId: string, mode: 'gallery' | 'carousel' | 'loop'): Promise<Result<void>>;
  
  // Update photo ordering
  updatePhotoOrder(pageId: string, photoIds: string[]): Promise<Result<void>>;
  
  // Configure gallery options
  configureGallery(pageId: string, options: GalleryOptions): Promise<Result<void>>;
}

interface GallerySettings {
  page_type: string;
  page_id: string;
  display_mode: 'gallery' | 'carousel' | 'loop';
  photos_per_row?: number;
  show_captions: boolean;
  autoplay_interval?: number; // for carousel/loop
  transition_effect?: string;
}

interface GalleryOptions {
  photos_per_row?: number;
  show_captions?: boolean;
  autoplay_interval?: number;
  transition_effect?: string;
}
```

**sectionsService**:
```typescript
interface SectionsService {
  // CRUD operations
  createSection(data: CreateSectionDTO): Promise<Result<Section>>;
  getSection(id: string): Promise<Result<Section>>;
  updateSection(id: string, data: UpdateSectionDTO): Promise<Result<Section>>;
  deleteSection(id: string): Promise<Result<void>>;
  
  // Section management
  listSections(pageType: string, pageId: string): Promise<Result<Section[]>>;
  reorderSections(pageId: string, sectionIds: string[]): Promise<Result<void>>;
  
  // Column management
  addColumn(sectionId: string, column: ColumnData): Promise<Result<Column>>;
  updateColumn(columnId: string, data: ColumnData): Promise<Result<Column>>;
  deleteColumn(columnId: string): Promise<Result<void>>;
  
  // Reference validation
  validateReferences(references: Reference[]): Promise<Result<ValidationResult>>;
  detectCircularReferences(pageId: string, references: Reference[]): Promise<Result<boolean>>;
  
  // Version history
  getVersionHistory(pageId: string): Promise<Result<Version[]>>;
  revertToVersion(pageId: string, versionId: string): Promise<Result<Section[]>>;
}

interface CreateSectionDTO {
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom';
  page_id: string;
  display_order: number;
  columns: ColumnData[];
}

interface ColumnData {
  column_number: 1 | 2;
  content_type: 'rich_text' | 'photo_gallery' | 'references';
  content_data: RichTextContent | PhotoGalleryContent | ReferencesContent;
}

interface ValidationResult {
  valid: boolean;
  brokenReferences: Reference[];
  circularReferences: Reference[];
}

interface Version {
  id: string;
  page_id: string;
  created_at: timestamp;
  created_by: string;
  sections_snapshot: Section[];
}
```

**transportationService**:
```typescript
interface TransportationService {
  // Flight tracking
  updateFlightInfo(guestId: string, flightInfo: FlightInfo): Promise<Result<void>>;
  getFlightsByAirport(airportCode: 'SJO' | 'LIR' | 'Other'): Promise<Result<FlightInfo[]>>;
  
  // Manifest generation
  generateArrivalManifest(date: Date): Promise<Result<TransportationManifest[]>>;
  generateDepartureManifest(date: Date): Promise<Result<TransportationManifest[]>>;
  
  // Shuttle coordination
  assignGuestsToShuttle(manifestId: string, guestIds: string[]): Promise<Result<void>>;
  calculateVehicleRequirements(guestCount: number): Promise<Result<VehicleRequirement[]>>;
  
  // Driver sheets
  generateDriverSheet(manifestId: string): Promise<Result<DriverSheet>>;
  
  // Cost tracking
  calculateShuttleCosts(manifests: TransportationManifest[]): Promise<Result<number>>;
}

interface FlightInfo {
  guest_id: string;
  airport_code: 'SJO' | 'LIR' | 'Other';
  flight_number?: string;
  airline?: string;
  arrival_time?: timestamp;
  departure_time?: timestamp;
}

interface VehicleRequirement {
  vehicle_type: string;
  capacity: number;
  quantity_needed: number;
  estimated_cost: number;
}

interface DriverSheet {
  manifest_id: string;
  date: Date;
  time_window: string;
  vehicle_type: string;
  driver_name?: string;
  driver_phone?: string;
  guests: Array<{
    name: string;
    flight_number?: string;
    phone?: string;
    special_requests?: string;
  }>;
  total_guests: number;
  pickup_location: string;
  dropoff_locations: string[];
}
```

**itineraryService**:
```typescript
interface ItineraryService {
  // Generate personalized itinerary
  generateItinerary(guestId: string): Promise<Result<Itinerary>>;
  
  // PDF export
  exportToPDF(guestId: string): Promise<Result<Buffer>>;
  
  // Cache management
  cacheItinerary(guestId: string, itinerary: Itinerary): Promise<Result<void>>;
  getCachedItinerary(guestId: string): Promise<Result<Itinerary | null>>;
  invalidateCache(guestId: string): Promise<Result<void>>;
}

interface Itinerary {
  guest_id: string;
  guest_name: string;
  events: ItineraryEvent[];
  activities: ItineraryActivity[];
  accommodation: AccommodationDetails;
  transportation: TransportationDetails;
  generated_at: timestamp;
}

interface ItineraryEvent {
  id: string;
  name: string;
  date: Date;
  time: string;
  location: string;
  rsvp_status: string;
  description?: string;
}

interface ItineraryActivity {
  id: string;
  name: string;
  date: Date;
  time: string;
  location: string;
  rsvp_status: string;
  cost?: number;
  description?: string;
}
```

### Service Interface Pattern

All services follow a consistent interface pattern:

```typescript
interface ServiceInterface<T> {
  // CRUD Operations
  create(data: CreateDTO): Promise<Result<T>>;
  read(id: string): Promise<Result<T>>;
  update(id: string, data: UpdateDTO): Promise<Result<T>>;
  delete(id: string): Promise<Result<void>>;
  
  // Query Operations
  list(filters: FilterDTO): Promise<Result<T[]>>;
  search(query: SearchDTO): Promise<Result<T[]>>;
  
  // Business Logic
  // ... domain-specific methods
}
```


### Result Type Pattern

All service methods return a `Result<T>` type for consistent error handling:

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorDetails };

interface ErrorDetails {
  code: string;
  message: string;
  details?: unknown;
}
```

### Authentication and Authorization

**Authentication Flow**:
1. User submits email via login form
2. System validates email format and checks user existence
3. For magic link auth: Supabase sends magic link email
4. For password auth: System validates credentials
5. On success: Supabase creates session token
6. Session stored in HTTP-only cookie

**Authorization Layers**:
1. **Middleware**: Protects all `/admin` routes, validates session
2. **RLS Policies**: Database-level access control per table
3. **Service Layer**: Business logic permission checks
4. **Component Level**: UI element visibility based on role

**Role Hierarchy**:
- **Super Admin**: Full system access, can manage all data
- **Host/Owner**: Can manage wedding data, assign group owners
- **Group Owner**: Can manage only their assigned guest group
- **Guest**: Can view/edit own information and family (if adult)

### Multi-Owner Group Coordination

**RLS Implementation**:

The system implements comprehensive Row Level Security policies for all tables to enforce multi-tenant data isolation:

**Guests Table Policies**:
```sql
-- Group owners can access their assigned guests
CREATE POLICY "group_owners_access_their_guests"
ON guests FOR ALL
USING (
  group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Super admins can access all guests
CREATE POLICY "super_admins_access_all_guests"
ON guests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Guests can view their own information
CREATE POLICY "guests_view_own_info"
ON guests FOR SELECT
USING (
  email = auth.jwt() ->> 'email'
);

-- Adult guests can view/edit family members
CREATE POLICY "adults_manage_family"
ON guests FOR ALL
USING (
  group_id IN (
    SELECT group_id FROM guests 
    WHERE email = auth.jwt() ->> 'email' 
    AND age_type = 'adult'
  )
);
```

**Events and Activities Policies**:
```sql
-- Hosts can manage all events
CREATE POLICY "hosts_manage_events"
ON events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view published events matching their guest_type
CREATE POLICY "guests_view_published_events"
ON events FOR SELECT
USING (
  status = 'published' 
  AND (
    visibility = '{}' OR 
    EXISTS (
      SELECT 1 FROM guests 
      WHERE email = auth.jwt() ->> 'email' 
      AND guest_type = ANY(events.visibility)
    )
  )
);

-- Similar policies for activities table
CREATE POLICY "hosts_manage_activities"
ON activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "guests_view_published_activities"
ON activities FOR SELECT
USING (
  status = 'published' 
  AND (
    visibility = '{}' OR 
    EXISTS (
      SELECT 1 FROM guests 
      WHERE email = auth.jwt() ->> 'email' 
      AND guest_type = ANY(activities.visibility)
    )
  )
);
```

**RSVPs Policies**:
```sql
-- Guests can manage their own RSVPs
CREATE POLICY "guests_manage_own_rsvps"
ON rsvps FOR ALL
USING (
  guest_id IN (
    SELECT id FROM guests 
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Hosts can view all RSVPs
CREATE POLICY "hosts_view_all_rsvps"
ON rsvps FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
```

**Photos Policies**:
```sql
-- Users can upload photos
CREATE POLICY "users_upload_photos"
ON photos FOR INSERT
WITH CHECK (
  uploader_id = auth.uid()
);

-- Users can view their own photos
CREATE POLICY "users_view_own_photos"
ON photos FOR SELECT
USING (
  uploader_id = auth.uid()
);

-- All users can view approved photos
CREATE POLICY "all_view_approved_photos"
ON photos FOR SELECT
USING (
  moderation_status = 'approved'
);

-- Hosts can manage all photos
CREATE POLICY "hosts_manage_photos"
ON photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
```

**Accommodations and Room Assignments Policies**:
```sql
-- Hosts manage accommodations
CREATE POLICY "hosts_manage_accommodations"
ON accommodations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests view published accommodations
CREATE POLICY "guests_view_published_accommodations"
ON accommodations FOR SELECT
USING (
  status = 'published'
);

-- Guests view their own room assignments
CREATE POLICY "guests_view_own_assignments"
ON room_assignments FOR SELECT
USING (
  guest_id IN (
    SELECT id FROM guests 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

**Vendors and Budget Policies**:
```sql
-- Only hosts can access vendor information
CREATE POLICY "hosts_only_vendors"
ON vendors FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Only hosts can access vendor bookings
CREATE POLICY "hosts_only_vendor_bookings"
ON vendor_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
```

**CMS Sections and Columns Policies**:
```sql
-- Hosts manage all sections
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

-- Guests can view sections for published pages
CREATE POLICY "guests_view_published_sections"
ON sections FOR SELECT
USING (
  (page_type = 'activity' AND EXISTS (
    SELECT 1 FROM activities 
    WHERE id = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'event' AND EXISTS (
    SELECT 1 FROM events 
    WHERE id = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'accommodation' AND EXISTS (
    SELECT 1 FROM accommodations 
    WHERE id = sections.page_id AND status = 'published'
  ))
  OR (page_type = 'room_type' AND EXISTS (
    SELECT 1 FROM room_types 
    WHERE id = sections.page_id AND status = 'published'
  ))
  OR page_type = 'custom'
);
```

**Audit Logs Policies**:
```sql
-- Only super admins can view audit logs
CREATE POLICY "super_admins_view_audit_logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- System can insert audit logs
CREATE POLICY "system_insert_audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (true);
```

**Group Ownership Model**:
- `groups` table: Defines guest groups (families)
- `group_members` table: Maps users to groups they can manage
- `guests` table: Links guests to their group
- RLS ensures users only see/edit guests in their groups
- Policies cascade through relationships for complex queries


### Admin Portal Architecture

**Dashboard Components**:
- `AdminDashboard.tsx`: Main dashboard with metrics and navigation
- `GuestTabRefactored.tsx`: Guest management interface
- `ActivityManager.tsx`: Activity creation and scheduling
- `RSVPAnalytics.tsx`: Response tracking and analytics
- `EmailManager.tsx`: Email template and campaign management
- `PhotoManagerRefactored.tsx`: Photo moderation interface
- `BudgetTracker.tsx`: Financial tracking and vendor management

**Dashboard Widgets**:
- Guest count and RSVP response rates
- Budget summary with payment status
- Upcoming event deadlines
- Pending photo moderation queue
- Capacity warnings for activities
- Recent guest portal activity

**Creation Workflows**:
Each entity type has a dedicated creation form with:
- Zod schema validation
- Real-time field validation
- Required field indicators
- Contextual help text
- Preview before save
- Success/error notifications

### Guest Portal Architecture

**Portal Components**:
- `GuestDashboard.tsx`: Personalized dashboard
- `RSVPManager.tsx`: Event and activity RSVP interface
- `FamilyManager.tsx`: Family group information management
- `ItineraryViewer.tsx`: Personalized schedule display
- `PhotoUpload.tsx`: Memory photo submission
- `AccommodationViewer.tsx`: Room assignment details
- `TransportationForm.tsx`: Flight information entry

**Family Access Control**:
- Adults can view/edit all family members
- Children can only view/edit themselves
- Determined by `age_type` field and relationship
- Enforced at component and service layers


### Content Management System

**Section-Based Layout**:
- Each page (activity, accommodation, event, custom) has sections
- Each section has 1-2 columns
- Each column contains one content type:
  - Rich text (BlockNote editor)
  - Photo gallery (gallery/carousel/loop modes)
  - Reference links (to other entities)

**Content Types**:
- **Activities**: Event details, schedule, requirements
- **Accommodations**: Property details, amenities, pricing
- **Room Types**: Specific room configurations
- **Events**: Ceremony/reception information
- **Custom Pages**: Flexible content (our story, travel tips, etc.)

**Content Workflow**:
1. Draft state: Editable by hosts, not visible to guests
2. Published state: Visible to guests based on permissions
3. Version history: Track all changes with timestamps
4. Preview mode: See guest view before publishing

**Reference System**:
- Dynamic links between entities
- Automatic updates when referenced content changes
- Broken link detection and warnings
- Circular reference prevention

### Photo Management System

**Dual-Storage Architecture**:

**Primary Storage (Backblaze B2 + Cloudflare CDN)**:
- S3-compatible API for uploads
- Cloudflare CDN subdomain for delivery
- Zero egress costs
- Health check every 5 minutes

**Secondary Storage (Supabase Storage)**:
- Automatic failover on primary failure
- Stores same photos with different URLs
- Seamless switching in database records

**Photo Workflow**:
1. Guest uploads photo via portal
2. System checks primary storage health
3. Upload to active storage (B2 or Supabase)
4. Save photo record with appropriate URL
5. Queue for moderation (pending state)
6. Host reviews and approves/rejects
7. Approved photos visible in galleries

**Moderation States**:
- `pending`: Awaiting host review
- `approved`: Visible in public galleries
- `rejected`: Hidden, with optional reason


### Email and Communication System

**Email Architecture**:
- Resend API for delivery
- Template system with variable substitution
- Webhook endpoint for delivery tracking
- Queue system for bulk sends
- Rate limiting to prevent abuse

**Template Variables**:
- `{{guest_name}}`: Recipient's name
- `{{event_name}}`: Event title
- `{{event_date}}`: Formatted date
- `{{rsvp_deadline}}`: Deadline date
- `{{portal_link}}`: Personalized portal URL
- Custom variables per template

**SMS Fallback (Twilio)**:
- Triggered on email delivery failure
- Used for urgent communications
- Character limit handling
- Delivery confirmation tracking

**Communication Types**:
- RSVP confirmations (automated)
- Activity reminders (scheduled)
- Deadline reminders (automated)
- Custom announcements (manual)
- Photo moderation notifications (automated)

### RSVP System

**Dual-Layer RSVPs**:

**Event-Level RSVP**:
- High-level attendance (ceremony, reception)
- Tracks overall guest participation
- Sets baseline for activity RSVPs

**Activity-Level RSVP**:
- Specific activity attendance
- Capacity tracking per activity
- Dietary restrictions per activity
- Plus-one tracking

**RSVP States**:
- `pending`: No response yet
- `attending`: Confirmed attendance
- `declined`: Not attending
- `maybe`: Tentative (for planning purposes)

**Capacity Management**:
- Soft limits: Warning when approaching capacity
- Hard limits: Prevent RSVPs when full
- Waitlist support for overbooked activities
- Real-time capacity calculations


### Budget and Financial Management

**Cost Calculation Model**:

**Vendor Pricing**:
- Flat rate: Fixed cost regardless of guests
- Per-guest: Cost multiplied by guest count
- Tiered: Different rates for different guest ranges

**Accommodation Subsidies**:
- Per-night subsidy per room
- Per-guest subsidy calculations
- Automatic recalculation on assignment changes

**Budget Categories**:
- Vendors (by type: catering, photography, etc.)
- Activities (per-activity costs)
- Accommodations (room costs and subsidies)
- Transportation (shuttle and vehicle costs)

**Payment Tracking**:
- `unpaid`: No payment received
- `partial`: Some payment received
- `paid`: Fully paid
- Balance due calculations
- Payment history log

### Transportation and Logistics

**Flight Tracking**:
- Airport codes: SJO (San José), LIR (Liberia), Other
- Arrival/departure times
- Flight numbers
- Airline information

**Transportation Manifest**:
- Groups guests by arrival/departure windows
- Assigns to shuttle runs
- Calculates vehicle capacity needs
- Generates driver sheets

**Shuttle Coordination**:
- Vehicle types and capacities
- Driver contact information
- Route planning
- Cost tracking per shuttle


### AI Content Import

**Google Gemini Integration**:
- Extract structured data from URLs
- Parse venue websites for details
- Extract activity information
- Identify vendor contact information

**Import Workflow**:
1. Host provides URL
2. System fetches content
3. Gemini API extracts structured data
4. System validates against schemas
5. Preview shown to host
6. Host confirms or edits
7. Data imported into system

**Supported Content Types**:
- Venue/accommodation details
- Activity descriptions and schedules
- Vendor information
- Event details

**Validation and Sanitization**:
- Zod schema validation
- XSS prevention
- URL validation
- Content length limits

### Analytics and Reporting

**RSVP Analytics**:
- Response rate by guest type
- Attendance projections
- Dietary restriction summaries
- Plus-one statistics

**Budget Reports**:
- Total costs by category
- Payment status summaries
- Outstanding balances
- Subsidy calculations

**Capacity Reports**:
- Activity utilization rates
- Accommodation occupancy
- Transportation capacity

**Guest Engagement**:
- Portal login frequency
- Photo upload statistics
- RSVP completion rates
- Email open rates


## Data Models

### Core Entities

**User**:
```typescript
interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'host' | 'guest';
  created_at: timestamp;
  last_login: timestamp;
}
```

**Group**:
```typescript
interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: timestamp;
}
```

**GroupMember** (for multi-owner coordination):
```typescript
interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'viewer';
  created_at: timestamp;
}
```

**Guest**:
```typescript
interface Guest {
  id: string;
  group_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  age_type: 'adult' | 'child' | 'senior';
  guest_type: 'wedding_party' | 'wedding_guest' | 'prewedding_only' | 'postwedding_only' | string;
  dietary_restrictions?: string;
  plus_one_name?: string;
  plus_one_attending?: boolean;
  arrival_date?: date;
  departure_date?: date;
  airport_code?: 'SJO' | 'LIR' | 'Other';
  flight_number?: string;
  invitation_sent: boolean;
  invitation_sent_date?: date;
  rsvp_deadline?: date;
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```


**Event**:
```typescript
interface Event {
  id: string;
  name: string;
  description?: string;
  event_type: 'ceremony' | 'reception' | 'pre_wedding' | 'post_wedding';
  location_id?: string;
  start_date: timestamp;
  end_date?: timestamp;
  rsvp_required: boolean;
  rsvp_deadline?: date;
  visibility: string[]; // guest_types that can see this event
  content_sections: Section[];
  status: 'draft' | 'published';
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Activity**:
```typescript
interface Activity {
  id: string;
  event_id?: string; // null for independent activities
  name: string;
  description?: string;
  activity_type: 'ceremony' | 'reception' | 'meal' | 'transport' | 'activity' | string;
  location_id?: string;
  start_time: timestamp;
  end_time?: timestamp;
  capacity?: number;
  cost_per_person?: number;
  host_subsidy?: number;
  adults_only: boolean;
  plus_one_allowed: boolean;
  visibility: string[]; // guest_types
  content_sections: Section[];
  status: 'draft' | 'published';
  display_order: number;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RSVP**:
```typescript
interface RSVP {
  id: string;
  guest_id: string;
  event_id?: string;
  activity_id?: string;
  status: 'pending' | 'attending' | 'declined' | 'maybe';
  guest_count?: number;
  dietary_notes?: string;
  special_requirements?: string;
  notes?: string;
  responded_at?: timestamp;
  created_at: timestamp;
  updated_at: timestamp;
}
```


**Vendor**:
```typescript
interface Vendor {
  id: string;
  name: string;
  category: 'photography' | 'flowers' | 'catering' | 'music' | 'transportation' | 'decoration' | 'other';
  contact_name?: string;
  email?: string;
  phone?: string;
  pricing_model: 'flat_rate' | 'per_guest' | 'tiered';
  base_cost: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**VendorBooking**:
```typescript
interface VendorBooking {
  id: string;
  vendor_id: string;
  activity_id?: string;
  event_id?: string;
  booking_date: date;
  notes?: string;
  created_at: timestamp;
}
```

**Accommodation**:
```typescript
interface Accommodation {
  id: string;
  name: string;
  location_id?: string;
  description?: string;
  address?: string;
  content_sections: Section[];
  status: 'draft' | 'published';
  created_at: timestamp;
  updated_at: timestamp;
}
```

**RoomType**:
```typescript
interface RoomType {
  id: string;
  accommodation_id: string;
  name: string;
  description?: string;
  capacity: number;
  total_rooms: number;
  price_per_night: number;
  host_subsidy_per_night?: number;
  content_sections: Section[];
  status: 'draft' | 'published';
  created_at: timestamp;
  updated_at: timestamp;
}
```


**RoomAssignment**:
```typescript
interface RoomAssignment {
  id: string;
  room_type_id: string;
  guest_id: string;
  check_in: date;
  check_out: date;
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Location**:
```typescript
interface Location {
  id: string;
  name: string;
  parent_location_id?: string; // for hierarchical locations
  address?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  created_at: timestamp;
}
```

**Photo**:
```typescript
interface Photo {
  id: string;
  uploader_id: string; // user_id
  photo_url: string; // Cloudflare CDN or Supabase URL
  storage_type: 'b2' | 'supabase';
  page_type: 'event' | 'activity' | 'accommodation' | 'memory';
  page_id?: string;
  caption?: string;
  alt_text?: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_reason?: string;
  display_order?: number;
  created_at: timestamp;
  moderated_at?: timestamp;
}
```

**EmailTemplate**:
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[]; // e.g., ['guest_name', 'event_name']
  created_at: timestamp;
  updated_at: timestamp;
}
```


**EmailLog**:
```typescript
interface EmailLog {
  id: string;
  template_id?: string;
  recipient_email: string;
  subject: string;
  delivery_status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: timestamp;
  delivered_at?: timestamp;
  error_message?: string;
  created_at: timestamp;
}
```

**Section** (for CMS):
```typescript
interface Section {
  id: string;
  page_type: 'activity' | 'event' | 'accommodation' | 'room_type' | 'custom';
  page_id: string;
  display_order: number;
  columns: Column[];
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Column** (for CMS):
```typescript
interface Column {
  id: string;
  section_id: string;
  column_number: 1 | 2;
  content_type: 'rich_text' | 'photo_gallery' | 'references';
  content_data: RichTextContent | PhotoGalleryContent | ReferencesContent;
}

interface RichTextContent {
  html: string;
}

interface PhotoGalleryContent {
  photo_ids: string[];
  display_mode: 'gallery' | 'carousel' | 'loop';
}

interface ReferencesContent {
  references: Array<{
    type: 'activity' | 'event' | 'accommodation' | 'location';
    id: string;
    label?: string;
  }>;
}
```

**TransportationManifest**:
```typescript
interface TransportationManifest {
  id: string;
  manifest_type: 'arrival' | 'departure';
  date: date;
  time_window_start: time;
  time_window_end: time;
  vehicle_type?: string;
  driver_name?: string;
  driver_phone?: string;
  guest_ids: string[];
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

The following properties define the correctness criteria for the Destination Wedding Management Platform. Each property will be implemented as a property-based test using fast-check with a minimum of 100 iterations.

### Property 1: Authentication Session Creation

*For any* valid user credentials, when a user logs in, the system should create a valid session token and store it securely.

**Validates: Requirements 1.3**

### Property 2: Role-Based Access Control

*For any* protected resource and any user role, the system should enforce permissions such that users can only access resources appropriate for their role (super admin > host/owner > group owner > guest).

**Validates: Requirements 1.5**

### Property 3: Group Data Isolation

*For any* group owner and any guest, the group owner should only be able to access and modify guests within their assigned groups, and should have no access to guests in other groups.

**Validates: Requirements 2.2**

### Property 4: Entity Creation Capability

*For any* wedding entity type (guest, event, activity, vendor, accommodation, room type, location, custom page), the admin portal should provide a creation function that successfully creates that entity with valid data.

**Validates: Requirements 3.9**

### Property 5: Guest Input Validation

*For any* guest data where first name, last name, or group ID is missing, or where email is syntactically invalid, the system should reject the creation/update and return a validation error.

**Validates: Requirements 4.16**


### Property 6: XSS and Injection Prevention

*For any* guest input containing XSS patterns (script tags, event handlers) or SQL injection patterns, the sanitization function should remove or neutralize the dangerous content before storage.

**Validates: Requirements 4.18, 18.2**

### Property 7: Bulk Operation Validation Consistency

*For any* set of guest updates, performing them as a bulk operation should apply the same validation and sanitization rules as performing them individually, resulting in the same validation outcomes.

**Validates: Requirements 4.22**

### Property 8: Event Scheduling Conflict Detection

*For any* two events with overlapping time ranges at the same location, the system should detect and report a scheduling conflict when attempting to create or update either event.

**Validates: Requirements 5.11**

### Property 9: Activity Required Field Validation

*For any* activity missing required fields (name, start_time), the validation function should reject the creation/update and return specific field errors.

**Validates: Requirements 6.11**

### Property 10: Event Deletion Integrity

*For any* event with associated independent activities, deleting the event should not cascade delete the independent activities, preserving data integrity.

**Validates: Requirements 6.13**

### Property 11: Capacity Alert Generation

*For any* activity with a defined capacity, when the number of attending RSVPs reaches or exceeds the capacity threshold (e.g., 90%), the system should generate an alert for hosts.

**Validates: Requirements 7.7**

### Property 12: Budget Total Calculation

*For any* set of vendors, activities, and accommodations with associated costs, the total wedding cost should equal the sum of all individual costs (vendor fees + activity costs + accommodation expenses).

**Validates: Requirements 8.2**


### Property 13: Payment Balance Updates

*For any* vendor with an outstanding balance, recording a payment should reduce the balance by exactly the payment amount, and the payment status should update appropriately (unpaid → partial → paid).

**Validates: Requirements 8.8**

### Property 14: Vendor Change Propagation

*For any* vendor with associated bookings, when the vendor's cost changes, all related booking cost calculations should update to reflect the new vendor cost.

**Validates: Requirements 9.10**

### Property 15: Room Assignment Cost Updates

*For any* room assignment, when the assignment changes (different room type, different dates), the related cost calculations (including subsidies) should automatically recalculate based on the new assignment.

**Validates: Requirements 10.14**

### Property 16: Photo Storage URL Consistency

*For any* photo upload, the photo_url saved in the database should use the domain corresponding to the active storage method (Cloudflare CDN domain for B2 storage, Supabase domain for Supabase storage).

**Validates: Requirements 12.7**

### Property 17: Email Template Validation

*For any* email template with invalid syntax (unclosed tags, malformed HTML) or undefined variable references (variables not in the allowed list), the validation function should reject the template and return specific errors.

**Validates: Requirements 13.8**

### Property 18: Adult Family Member Access

*For any* adult family member in a guest group, they should have read and edit access to all other members in their family group, including their spouse and children.

**Validates: Requirements 14.3**

### Property 19: Child Access Restriction

*For any* child/dependent family member in a guest group, they should only have read and edit access to their own information, not to their parents' or siblings' information.

**Validates: Requirements 14.4**


### Property 20: Content Version History

*For any* content update (activity, accommodation, event, custom page), the system should create a new version entry with a timestamp, preserving the previous version in the version history.

**Validates: Requirements 15.11**

### Property 21: Itinerary Caching

*For any* guest's personalized itinerary, after caching via the PWA service worker, the itinerary data should be retrievable from the cache even when offline.

**Validates: Requirements 17.8**

### Property 22: Audit Log Creation

*For any* data modification operation (create, update, delete) on any entity, the system should create an audit log entry containing the user ID, timestamp, entity type, entity ID, and operation type.

**Validates: Requirements 18.6**

### Property 23: CSV Export Validity

*For any* set of guest data, exporting to CSV should produce a valid CSV file with proper headers, correct field delimiters, and properly escaped values.

**Validates: Requirements 20.2**

### Property 24: Guest Data Round-Trip

*For any* valid guest data object, the sequence of operations (export to CSV → import from CSV → export to CSV again) should produce an equivalent guest record with all fields preserved.

**Validates: Requirements 20.4**

### Property 25: Email Template Round-Trip

*For any* valid email template object, the sequence of operations (format to string → parse from string → format to string again) should produce an equivalent template with all fields and variables preserved.

**Validates: Requirements 20.7**

### Property 26: AI Content Schema Validation

*For any* content extracted by the AI import system from a URL, the extracted data should pass Zod schema validation for the target entity type (activity, accommodation, vendor) before being imported.

**Validates: Requirements 21.3**


### Property 27: AI Content Sanitization

*For any* content imported via the AI system containing malicious patterns (script tags, SQL injection attempts), the sanitization function should remove or neutralize the dangerous content before importing.

**Validates: Requirements 21.8**

### Property 28: Transportation Manifest Time Window Grouping

*For any* set of guests with arrival times, the manifest generation should group guests into time windows such that all guests in a window arrive within the specified time threshold (e.g., 2 hours).

**Validates: Requirements 20.1**

### Property 29: Vehicle Capacity Calculation

*For any* transportation manifest with assigned guests, the total guest count should not exceed the combined capacity of assigned vehicles.

**Validates: Requirements 20.2**

### Property 30: Manifest Assignment Updates

*For any* guest with flight information changes, when the flight time is updated, the system should automatically reassign the guest to the appropriate manifest based on the new time window.

**Validates: Requirements 20.8**

### Property 31: Itinerary Cache Retrieval

*For any* guest's personalized itinerary, after caching via the PWA service worker, the itinerary data should be retrievable from the cache even when offline, and should match the originally cached data.

**Validates: Requirements 18.3, 18.4**

### Property 32: Webhook Retry Exponential Backoff

*For any* failed webhook delivery, the retry delays should follow exponential backoff (e.g., 1s, 2s, 4s, 8s), with each retry delay being approximately double the previous delay.

**Validates: Requirements 19.6**

### Property 33: Section Reference Validation

*For any* CMS section containing references to other entities, all referenced entity IDs should exist in their respective tables, and the validation function should detect any broken references.

**Validates: Requirements 9.5**

### Property 34: Circular Reference Detection

*For any* CMS page with sections containing references, the system should detect circular reference chains (A → B → C → A) and prevent their creation.

**Validates: Requirements 9.5**

### Property 35: Gallery Settings Persistence

*For any* photo gallery configuration (display mode, photos per row, autoplay settings), updating the settings should persist the changes such that retrieving the settings returns the updated values.

**Validates: Requirements 7.5**

### Property 36: Costa Rica Theme Color Contrast

*For any* color combination used in the UI from the Costa Rica theme palette, the contrast ratio should meet or exceed WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 17.8**empts, XSS vectors), the sanitization function should neutralize the dangerous content before importing into the system.

**Validates: Requirements 21.8**

## Error Handling

### Error Handling Strategy

The system implements a layered error handling approach:

**1. Input Validation Layer**:
- Zod schema validation at API boundaries
- Immediate rejection of malformed requests
- Detailed validation error messages with field-level feedback

**2. Service Layer**:
- Result type pattern for all service methods
- Structured error codes and messages
- Error context preservation through the call stack

**3. Database Layer**:
- PostgreSQL constraint violations caught and translated
- RLS policy violations return appropriate 403 errors
- Transaction rollback on any error

**4. External Service Layer**:
- Timeout handling for all external API calls
- Retry logic with exponential backoff
- Fallback mechanisms (B2 → Supabase, Email → SMS)
- Circuit breaker pattern for failing services

**5. UI Layer**:
- Error boundaries for React component errors
- User-friendly error messages
- Graceful degradation for non-critical features
- Toast notifications for transient errors

### Error Categories

**Validation Errors** (400):
- Missing required fields
- Invalid data formats
- Business rule violations
- Schema validation failures

**Authentication Errors** (401):
- Invalid credentials
- Expired sessions
- Missing authentication tokens

**Authorization Errors** (403):
- Insufficient permissions
- RLS policy violations
- Group access violations

**Not Found Errors** (404):
- Entity does not exist
- Invalid entity IDs

**Conflict Errors** (409):
- Scheduling conflicts
- Capacity exceeded
- Duplicate entries

**External Service Errors** (502/503):
- B2 storage unavailable
- Email service down
- AI API failures

**Internal Errors** (500):
- Unexpected exceptions
- Database connection failures
- Unhandled edge cases


## Testing Strategy

### Dual Testing Approach

The system employs a comprehensive dual testing strategy combining unit tests and property-based tests:

**Unit Tests (60% of test suite)**:
- Specific examples demonstrating correct behavior
- Edge cases and boundary conditions
- Error condition handling
- Integration points between components
- Mock external services for predictable testing

**Property-Based Tests (40% of test suite)**:
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Business rule validation
- Data integrity verification
- Round-trip properties for serialization

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test
- Configurable seed for reproducible failures
- Shrinking enabled to find minimal failing examples
- Timeout: 30 seconds per property test

**Property Test Structure**:
```typescript
import * as fc from 'fast-check';

describe('Feature: destination-wedding-platform, Property N: [property description]', () => {
  it('should satisfy property across all inputs', () => {
    fc.assert(
      fc.property(
        // Arbitraries (generators)
        fc.record({
          // Generate test data
        }),
        (testData) => {
          // Test the property
          const result = systemUnderTest(testData);
          expect(result).toSatisfyProperty();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Tags**:
Each property test must include a comment tag referencing its design document property:
```typescript
// Feature: destination-wedding-platform, Property 1: Authentication Session Creation
```


### Test Organization

**Test Directory Structure**:
```
src/__tests__/
├── components/          # Component unit tests
├── admin/              # Admin component tests
├── integration/        # Integration tests
├── properties/         # Property-based tests
│   ├── auth.property.test.ts
│   ├── guest.property.test.ts
│   ├── rsvp.property.test.ts
│   └── ...
├── services/           # Service unit tests
│   ├── guestService.test.ts
│   ├── rsvpService.test.ts
│   └── ...
└── utils/              # Utility function tests
```

### Unit Test Coverage Requirements

**Critical Paths (100% coverage required)**:
- Authentication and authorization logic
- Financial calculations (budget, subsidies, payments)
- Data validation and sanitization
- RLS policy enforcement
- RSVP capacity calculations

**Standard Paths (80% coverage required)**:
- Service layer business logic
- API route handlers
- Component rendering logic
- Utility functions

**UI Components (60% coverage required)**:
- Component interaction logic
- Form validation
- State management

### Property Test Coverage

Each of the 36 correctness properties must have a corresponding property-based test:

**Authentication & Authorization (Properties 1-3)**:
1. Authentication Session Creation
2. Role-Based Access Control
3. Group Data Isolation

**Data Management (Properties 4-10)**:
4. Entity Creation Capability
5. Guest Input Validation
6. XSS and Injection Prevention
7. Bulk Operation Validation Consistency
8. Event Scheduling Conflict Detection
9. Activity Required Field Validation
10. Event Deletion Integrity

**Business Logic (Properties 11-15)**:
11. Capacity Alert Generation
12. Budget Total Calculation
13. Payment Balance Updates
14. Vendor Change Propagation
15. Room Assignment Cost Updates

**External Services (Properties 16-17)**:
16. Photo Storage URL Consistency
17. Email Template Validation

**Access Control (Properties 18-19)**:
18. Adult Family Member Access
19. Child Access Restriction

**Content Management (Properties 20, 33-35)**:
20. Content Version History
33. Section Reference Validation
34. Circular Reference Detection
35. Gallery Settings Persistence

**PWA & Caching (Properties 21, 31)**:
21. Itinerary Caching
31. Itinerary Cache Retrieval

**Audit & Security (Properties 22, 27, 36)**:
22. Audit Log Creation
27. AI Content Sanitization
36. Costa Rica Theme Color Contrast

**Data Serialization (Properties 23-26)**:
23. CSV Export Validity
24. Guest Data Round-Trip
25. Email Template Round-Trip
26. AI Content Schema Validation

**Transportation & Logistics (Properties 28-30)**:
28. Transportation Manifest Time Window Grouping
29. Vehicle Capacity Calculation
30. Manifest Assignment Updates

**Webhooks & Automation (Property 32)**:
32. Webhook Retry Exponential Backoff


### Integration Testing

**API Integration Tests**:
- Test all API routes with real Supabase client (test database)
- Verify RLS policies work correctly
- Test authentication flows end-to-end
- Verify external service integrations with mocks

**Database Integration Tests**:
- Test complex queries and joins
- Verify cascade behaviors
- Test transaction rollbacks
- Verify RLS policy enforcement

**External Service Integration Tests**:
- Mock external APIs (B2, Resend, Twilio, Gemini)
- Test fallback mechanisms
- Test error handling and retries
- Verify webhook processing

### Regression Testing

**Automated Regression Suite**:
- Runs on every code change (CI/CD)
- Covers all critical functional areas
- Validates TypeScript contracts
- Checks for performance regressions
- Verifies UI component rendering

**Regression Test Categories**:
- Authentication and authorization
- Data service operations (CRUD)
- Financial calculations
- RSVP capacity management
- Photo storage failover
- Email delivery
- Dynamic route resolution

### Test Data Generation

**Generators for Property Tests**:
```typescript
// Guest generator
const guestArbitrary = fc.record({
  first_name: fc.string({ minLength: 1, maxLength: 50 }),
  last_name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  age_type: fc.constantFrom('adult', 'child', 'senior'),
  guest_type: fc.constantFrom('wedding_party', 'wedding_guest', 'prewedding_only', 'postwedding_only'),
  group_id: fc.uuid(),
});

// Event generator
const eventArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  start_date: fc.date(),
  end_date: fc.date(),
  event_type: fc.constantFrom('ceremony', 'reception', 'pre_wedding', 'post_wedding'),
});

// Malicious input generator (for sanitization tests)
const maliciousInputArbitrary = fc.oneof(
  fc.constant('<script>alert("xss")</script>'),
  fc.constant('"; DROP TABLE guests; --'),
  fc.constant('<img src=x onerror=alert(1)>'),
  fc.string().map(s => s + '<script>'),
);

// Transportation manifest generator
const flightInfoArbitrary = fc.record({
  guest_id: fc.uuid(),
  airport_code: fc.constantFrom('SJO', 'LIR', 'Other'),
  flight_number: fc.option(fc.string({ minLength: 4, maxLength: 10 })),
  arrival_time: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
});

// Time window generator (for manifest grouping)
const timeWindowArbitrary = fc.record({
  start: fc.date(),
  end: fc.date(),
  threshold_hours: fc.integer({ min: 1, max: 4 }),
});

// Vehicle capacity generator
const vehicleArbitrary = fc.record({
  vehicle_type: fc.constantFrom('sedan', 'van', 'minibus', 'bus'),
  capacity: fc.integer({ min: 4, max: 50 }),
  quantity: fc.integer({ min: 1, max: 10 }),
});

// CMS reference generator
const referenceArbitrary = fc.record({
  type: fc.constantFrom('activity', 'event', 'accommodation', 'location'),
  id: fc.uuid(),
  label: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
});

// Gallery settings generator
const gallerySettingsArbitrary = fc.record({
  display_mode: fc.constantFrom('gallery', 'carousel', 'loop'),
  photos_per_row: fc.option(fc.integer({ min: 1, max: 6 })),
  show_captions: fc.boolean(),
  autoplay_interval: fc.option(fc.integer({ min: 1000, max: 10000 })),
});

// Color contrast generator (for theme testing)
const colorPairArbitrary = fc.record({
  foreground: fc.hexaString({ minLength: 6, maxLength: 6 }),
  background: fc.hexaString({ minLength: 6, maxLength: 6 }),
});

// Webhook retry generator
const webhookRetryArbitrary = fc.record({
  attempt: fc.integer({ min: 1, max: 10 }),
  base_delay: fc.integer({ min: 100, max: 2000 }),
});

// Itinerary cache generator
const itineraryCacheArbitrary = fc.record({
  guest_id: fc.uuid(),
  events: fc.array(eventArbitrary, { minLength: 0, maxLength: 10 }),
  activities: fc.array(fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    date: fc.date(),
  }), { minLength: 0, maxLength: 20 }),
  generated_at: fc.date(),
});
```

### Performance Testing

**Load Testing**:
- Simulate 100 concurrent users
- Test bulk operations (100+ guests)
- Measure API response times
- Monitor database query performance

**Performance Benchmarks**:
- API routes: < 200ms response time
- Database queries: < 100ms
- Page load: < 2 seconds
- Photo upload: < 5 seconds per photo

### Accessibility Testing

**WCAG 2.1 AA Compliance**:
- Automated testing with axe-core
- Manual keyboard navigation testing
- Screen reader compatibility testing
- Color contrast validation
- Focus management verification

### Security Testing

**Security Test Suite**:
- XSS injection attempts
- SQL injection attempts
- CSRF protection verification
- Session hijacking prevention
- RLS policy bypass attempts
- File upload validation
- Rate limiting verification

