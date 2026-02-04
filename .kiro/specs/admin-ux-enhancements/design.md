# Admin UX Enhancements - Design Document

## Overview

This design addresses critical UX gaps and missing features in the admin dashboard identified during manual testing. The enhancements focus on improving guest authentication reliability, fixing API errors, adding inline editing capabilities, and providing comprehensive RSVP management.

## Architecture

### System Components

1. **Guest Authentication System**
   - Auth method configuration in system settings
   - Migration scripts for existing guest records
   - Dual authentication support (email matching + magic link)

2. **Home Page Management**
   - Fixed API error handling
   - Inline section editor component
   - Improved settings persistence

3. **RSVP Management Dashboard**
   - Centralized RSVP viewing and management
   - Advanced filtering and search
   - Bulk operations support
   - Real-time statistics

4. **Navigation Enhancements**
   - Guest portal preview link
   - Updated sidebar navigation

## Components and Interfaces

### 1. InlineSectionEditor Component

**Purpose**: Allow admins to edit home page sections without navigating away

**Location**: `components/admin/InlineSectionEditor.tsx`

**Props Interface**:
```typescript
interface InlineSectionEditorProps {
  pageType: 'home';
  pageId: string;
  onSave?: () => void;
  compact?: boolean;
}
```


**Features**:
- Embedded section list with inline editing
- Add/edit/delete sections
- Drag-and-drop reordering
- Photo picker integration
- Reference block picker integration
- Auto-save functionality
- Compact mode for embedding in other pages

**State Management**:
```typescript
interface SectionEditorState {
  sections: Section[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  editingSection: string | null;
}
```

### 2. RSVPManager Component

**Purpose**: Comprehensive RSVP management interface

**Location**: `components/admin/RSVPManager.tsx`

**Props Interface**:
```typescript
interface RSVPManagerProps {
  initialFilters?: RSVPFilters;
}

interface RSVPFilters {
  eventId?: string;
  activityId?: string;
  status?: RSVPStatus;
  guestId?: string;
  searchQuery?: string;
}
```

**Features**:
- Tabular view of all RSVPs
- Multi-level filtering (event, activity, status, guest)
- Search by guest name or email
- Bulk status updates
- Export to CSV
- Real-time statistics dashboard
- Inline editing of RSVP details


### 3. AuthMethodSettings Component

**Purpose**: Configure default guest authentication method

**Location**: `components/admin/AuthMethodSettings.tsx`

**Props Interface**:
```typescript
interface AuthMethodSettingsProps {
  currentMethod: 'email_matching' | 'magic_link';
  onUpdate: (method: 'email_matching' | 'magic_link') => Promise<void>;
}
```

**Features**:
- Radio button selection between auth methods
- Description of each method
- Bulk update existing guests option
- Warning about changing auth method
- Save confirmation

## Data Models

### System Settings Extension

**Table**: `system_settings`

**New Fields**:
```sql
-- Add to existing system_settings table
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS default_auth_method TEXT DEFAULT 'email_matching';
ALTER TABLE system_settings ADD CONSTRAINT check_auth_method 
  CHECK (default_auth_method IN ('email_matching', 'magic_link'));
```

**Settings Keys**:
- `default_auth_method`: 'email_matching' | 'magic_link'

### RSVP View Model

**Purpose**: Denormalized view for efficient RSVP querying

**Structure**:
```typescript
interface RSVPViewModel {
  id: string;
  guestId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  eventId: string | null;
  eventName: string | null;
  activityId: string | null;
  activityName: string | null;
  status: RSVPStatus;
  guestCount: number | null;
  dietaryRestrictions: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```


## API Endpoints

### 1. Home Page API Fix

**Endpoint**: `PUT /api/admin/home-page`

**Current Issue**: Returns 500 errors when settings don't exist

**Fix Strategy**:
- Use `upsert` pattern instead of separate update/create
- Better error handling for missing settings
- Proper transaction handling
- Detailed error logging

**Updated Implementation**:
```typescript
export async function PUT(request: Request) {
  try {
    // 1. Auth check
    const { session, error: authError } = await getSession();
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Validate request
    const body = await request.json();
    const validation = homePageConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: validation.error.issues } },
        { status: 400 }
      );
    }
    
    // 3. Upsert settings (handles create or update)
    const result = await settingsService.upsertHomePageConfig(validation.data);
    
    // 4. Return response
    if (!result.success) {
      return NextResponse.json(result, { status: getStatusCode(result.error.code) });
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Home page API error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update home page' } },
      { status: 500 }
    );
  }
}
```


### 2. RSVP Management API

**Endpoint**: `GET /api/admin/rsvps`

**Purpose**: Retrieve all RSVPs with filtering and pagination

**Query Parameters**:
```typescript
interface RSVPQueryParams {
  page?: number;
  limit?: number;
  eventId?: string;
  activityId?: string;
  status?: RSVPStatus;
  guestId?: string;
  search?: string;
  sortBy?: 'guestName' | 'eventName' | 'activityName' | 'status' | 'createdAt';
  order?: 'asc' | 'desc';
}
```

**Response**:
```typescript
{
  success: true,
  data: RSVPViewModel[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  statistics: {
    totalRSVPs: number,
    byStatus: {
      attending: number,
      declined: number,
      maybe: number,
      pending: number
    },
    totalGuestCount: number
  }
}
```

**Endpoint**: `PATCH /api/admin/rsvps/bulk`

**Purpose**: Bulk update RSVP statuses

**Request Body**:
```typescript
{
  rsvpIds: string[],
  status: RSVPStatus,
  notes?: string
}
```

**Endpoint**: `GET /api/admin/rsvps/export`

**Purpose**: Export RSVPs to CSV

**Query Parameters**: Same as GET /api/admin/rsvps

**Response**: CSV file download


### 3. Auth Method Configuration API

**Endpoint**: `GET /api/admin/settings/auth-method`

**Purpose**: Get current default auth method

**Response**:
```typescript
{
  success: true,
  data: {
    defaultAuthMethod: 'email_matching' | 'magic_link'
  }
}
```

**Endpoint**: `PUT /api/admin/settings/auth-method`

**Purpose**: Update default auth method

**Request Body**:
```typescript
{
  defaultAuthMethod: 'email_matching' | 'magic_link',
  updateExistingGuests?: boolean
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    defaultAuthMethod: 'email_matching' | 'magic_link',
    updatedGuestsCount?: number
  }
}
```

## Database Migrations

### Migration 1: Add default_auth_method to system_settings

**File**: `supabase/migrations/051_add_default_auth_method.sql`

```sql
-- Add default_auth_method column to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS default_auth_method TEXT DEFAULT 'email_matching';

-- Add constraint to ensure valid values
ALTER TABLE system_settings 
ADD CONSTRAINT check_default_auth_method 
CHECK (default_auth_method IN ('email_matching', 'magic_link'));

-- Insert default setting if not exists
INSERT INTO system_settings (key, value, description, category, is_public)
VALUES (
  'default_auth_method',
  'email_matching',
  'Default authentication method for new guests',
  'authentication',
  false
)
ON CONFLICT (key) DO NOTHING;
```


### Migration 2: Fix guest auth_method values

**File**: `scripts/fix-guest-auth-methods.mjs`

```javascript
/**
 * Fix guest auth_method values
 * 
 * Sets all guests with NULL or invalid auth_method to 'email_matching'
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGuestAuthMethods() {
  console.log('Fixing guest auth_method values...');
  
  // Update all guests with NULL or invalid auth_method
  const { data, error } = await supabase
    .from('guests')
    .update({ auth_method: 'email_matching' })
    .or('auth_method.is.null,auth_method.not.in.(email_matching,magic_link)')
    .select('id');
  
  if (error) {
    console.error('Error fixing auth methods:', error);
    process.exit(1);
  }
  
  console.log(`Fixed ${data.length} guest records`);
  console.log('Done!');
}

fixGuestAuthMethods();
```

## Service Layer Updates

### settingsService Extensions

**New Methods**:

```typescript
/**
 * Upsert home page configuration
 * Handles both create and update in a single operation
 */
export async function upsertHomePageConfig(
  config: HomePageConfig
): Promise<Result<HomePageConfig>> {
  // Implementation uses upsert pattern for each setting
}

/**
 * Get default auth method
 */
export async function getDefaultAuthMethod(): Promise<Result<'email_matching' | 'magic_link'>> {
  // Implementation
}

/**
 * Update default auth method
 */
export async function updateDefaultAuthMethod(
  method: 'email_matching' | 'magic_link',
  updateExistingGuests: boolean
): Promise<Result<{ updatedCount: number }>> {
  // Implementation
}
```


### New rsvpManagementService

**Purpose**: Centralized RSVP querying and management

**Location**: `services/rsvpManagementService.ts`

**Methods**:

```typescript
/**
 * List all RSVPs with filtering and pagination
 */
export async function listRSVPs(
  filters: RSVPFilters,
  pagination: { page: number; limit: number }
): Promise<Result<{ data: RSVPViewModel[]; total: number; statistics: RSVPStatistics }>> {
  // Implementation with complex joins
}

/**
 * Bulk update RSVP statuses
 */
export async function bulkUpdateRSVPs(
  rsvpIds: string[],
  status: RSVPStatus,
  notes?: string
): Promise<Result<{ updatedCount: number }>> {
  // Implementation
}

/**
 * Export RSVPs to CSV
 */
export async function exportRSVPsToCSV(
  filters: RSVPFilters
): Promise<Result<string>> {
  // Implementation returns CSV string
}

/**
 * Get RSVP statistics
 */
export async function getRSVPStatistics(
  filters?: RSVPFilters
): Promise<Result<RSVPStatistics>> {
  // Implementation
}
```

## Navigation Updates

### Sidebar Navigation Changes

**File**: `components/admin/GroupedNavigation.tsx`

**Changes**:
1. Add "Preview Guest Portal" link in "Quick Actions" group
2. Add "RSVPs" link in "Guest Management" group

**Updated Navigation Structure**:
```typescript
const navigationGroups = [
  {
    title: 'Quick Actions',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '🏠' },
      { href: '/', label: 'Preview Guest Portal', icon: '👁️', external: true },
    ]
  },
  {
    title: 'Guest Management',
    items: [
      { href: '/admin/guests', label: 'Guests', icon: '👥' },
      { href: '/admin/guest-groups', label: 'Guest Groups', icon: '👨‍👩‍👧‍👦' },
      { href: '/admin/rsvps', label: 'RSVPs', icon: '✓', badge: pendingRSVPCount },
    ]
  },
  // ... other groups
];
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth Method Consistency

*For any* guest record, the auth_method field should always contain a valid value ('email_matching' or 'magic_link'), never NULL or invalid values

**Validates: Requirements 1.1, 1.2**

### Property 2: Home Page Settings Upsert

*For any* home page configuration update, the API should successfully create or update settings without returning 500 errors, regardless of whether settings previously existed

**Validates: Requirements 2.1, 2.2**

### Property 3: Inline Section Editor State Sync

*For any* section edit operation in the InlineSectionEditor, the changes should be immediately reflected in the section list without requiring a page refresh

**Validates: Requirements 3.2, 3.3**

### Property 4: Default Auth Method Inheritance

*For any* newly created guest, the auth_method should automatically inherit the system's default_auth_method setting

**Validates: Requirements 4.3**

### Property 5: Bulk Auth Method Update

*For any* bulk update operation on guest auth methods, all selected guests should have their auth_method updated to the specified value

**Validates: Requirements 4.4**

### Property 6: Guest Portal Preview Isolation

*For any* admin user clicking "Preview Guest Portal", the preview should open in a new tab showing the guest view without affecting the admin session

**Validates: Requirements 5.2, 5.3**

### Property 7: RSVP Filter Composition

*For any* combination of RSVP filters (event, activity, status, guest), the results should only include RSVPs matching ALL specified criteria

**Validates: Requirements 6.2**

### Property 8: RSVP Statistics Accuracy

*For any* set of RSVPs, the statistics dashboard should accurately reflect the count of RSVPs by status and total guest count

**Validates: Requirements 6.5**

### Property 9: Bulk RSVP Update Atomicity

*For any* bulk RSVP status update operation, either all specified RSVPs should be updated successfully, or none should be updated (atomic operation)

**Validates: Requirements 6.4**


## Error Handling

### Home Page API Errors

**Error Scenarios**:
1. Settings table doesn't exist → Create with migration
2. Individual setting missing → Upsert creates it
3. Invalid data format → Return 400 with validation details
4. Database connection failure → Return 500 with generic message
5. Concurrent updates → Use optimistic locking

**Error Codes**:
- `VALIDATION_ERROR` (400): Invalid home page configuration
- `UNAUTHORIZED` (401): Not authenticated
- `DATABASE_ERROR` (500): Database operation failed
- `INTERNAL_ERROR` (500): Unexpected error

### RSVP Management Errors

**Error Scenarios**:
1. Invalid filter parameters → Return 400 with details
2. RSVP not found → Return 404
3. Bulk update partial failure → Return 207 (Multi-Status) with details
4. Export timeout → Return 503 with retry-after header

**Error Codes**:
- `VALIDATION_ERROR` (400): Invalid filter or update parameters
- `NOT_FOUND` (404): RSVP not found
- `PARTIAL_SUCCESS` (207): Some bulk operations failed
- `TIMEOUT` (503): Export operation timed out

### Auth Method Configuration Errors

**Error Scenarios**:
1. Invalid auth method value → Return 400
2. Bulk update fails → Rollback transaction, return 500
3. Setting not found → Create with default value

**Error Codes**:
- `VALIDATION_ERROR` (400): Invalid auth method
- `DATABASE_ERROR` (500): Failed to update settings or guests

## Testing Strategy

### Unit Tests

**Components**:
- `InlineSectionEditor`: Rendering, editing, saving, error states
- `RSVPManager`: Filtering, sorting, bulk operations, export
- `AuthMethodSettings`: Selection, bulk update, confirmation

**Services**:
- `settingsService.upsertHomePageConfig`: Create and update paths
- `rsvpManagementService.listRSVPs`: Filtering, pagination, statistics
- `rsvpManagementService.bulkUpdateRSVPs`: Success and partial failure

**API Routes**:
- `/api/admin/home-page`: GET and PUT with various scenarios
- `/api/admin/rsvps`: GET with filters, PATCH bulk update, GET export
- `/api/admin/settings/auth-method`: GET and PUT

### Integration Tests

**Workflows**:
1. Home page settings creation and update flow
2. RSVP filtering with multiple criteria
3. Bulk RSVP status update
4. Auth method configuration and guest update
5. CSV export generation

### Property-Based Tests

**Properties to Test**:
1. Auth method validation (Property 1)
2. Home page upsert idempotence (Property 2)
3. RSVP filter composition (Property 7)
4. RSVP statistics accuracy (Property 8)
5. Bulk update atomicity (Property 9)

**Test Configuration**:
- Minimum 100 iterations per property test
- Tag format: **Feature: admin-ux-enhancements, Property {number}: {property_text}**

### E2E Tests

**User Workflows**:
1. Admin edits home page with inline section editor
2. Admin configures auth method and updates existing guests
3. Admin filters and manages RSVPs
4. Admin previews guest portal
5. Admin exports RSVP data to CSV

## Performance Considerations

### RSVP Query Optimization

**Challenges**:
- Complex joins across guests, events, activities, rsvps tables
- Large result sets with pagination
- Real-time statistics calculation

**Solutions**:
1. Create database indexes on frequently filtered columns
2. Use materialized view for RSVP statistics (optional)
3. Implement query result caching (5-minute TTL)
4. Limit export to 10,000 records with streaming for larger sets

**Indexes Needed**:
```sql
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_activity_id ON rsvps(activity_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_id ON rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON rsvps(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at);
```

### Inline Section Editor Performance

**Optimizations**:
1. Debounce auto-save (500ms delay)
2. Lazy load photo picker and reference picker
3. Virtual scrolling for large section lists
4. Optimistic UI updates

## Security Considerations

### Authentication

- All admin endpoints require authentication
- Guest portal preview opens in new tab but doesn't expose admin session
- Auth method changes require admin role

### Authorization

- Only admins can access RSVP management
- Only admins can configure auth methods
- Bulk operations limited to 100 records per request

### Data Validation

- All inputs sanitized with DOMPurify
- Zod schemas validate all API requests
- SQL injection prevented by Supabase query builder
- XSS prevention in rich text fields

### Rate Limiting

- RSVP export limited to 1 request per minute per user
- Bulk updates limited to 10 requests per minute per user
- Auth method changes limited to 5 requests per hour per user

## Deployment Considerations

### Migration Order

1. Run database migration (051_add_default_auth_method.sql)
2. Run guest auth_method fix script
3. Deploy updated code
4. Verify settings API works
5. Test RSVP management page
6. Verify guest authentication

### Rollback Plan

1. Revert code deployment
2. Remove default_auth_method column (if needed)
3. Restore previous settings service

### Monitoring

- Track home page API error rates
- Monitor RSVP query performance
- Alert on bulk update failures
- Track auth method distribution

## Future Enhancements

1. **Advanced RSVP Analytics**: Charts and graphs for RSVP trends
2. **RSVP Reminders**: Automated reminders for pending RSVPs
3. **Guest Portal Customization**: Theme and layout options
4. **Multi-language Support**: Internationalization for guest portal
5. **Mobile App**: Native mobile app for guests
