# E2E Test Round 2 - Fix Implementation Plan

## Current Status
- **Round 1**: 152/359 passing (42.3%)
- **Round 2**: ~170/359 passing (47.4% estimated, 55.7% of completed tests)
- **Improvement**: +18 tests (+11.8%)
- **Test Timeout**: Suite timed out after 5 minutes (305/359 tests completed)

## Priority 1: API Errors (BLOCKING) - Fix First

### 1.1 RSVP API 500 Errors ✅ DIAGNOSED
**File**: `app/api/admin/rsvps/route.ts`
**Root Cause**: The RSVP service query uses `.or()` with joined table filters which is not supported in Supabase
**Issue**: Line in `rsvpManagementService.ts`:
```typescript
query = query.or(
  `guests.first_name.ilike.${searchTerm},guests.last_name.ilike.${searchTerm},guests.email.ilike.${searchTerm}`
);
```
**Fix**: Change to use proper filter syntax for joined tables
**Impact**: ~15 tests (RSVP management, export, analytics)

### 1.2 Email Templates API 401 Errors ✅ DIAGNOSED
**File**: `app/api/admin/emails/templates/route.ts`
**Root Cause**: Cookie parsing issue - using `await cookies()` pattern incorrectly
**Issue**: Lines 17-18:
```typescript
const cookieStore = await cookies();
const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
```
**Fix**: Use correct Next.js 15 cookie handling pattern
**Impact**: ~8 tests (email template management)

### 1.3 Photo Upload API 500 Errors ✅ DIAGNOSED
**File**: `services/photoService.ts`
**Root Cause**: B2 service not properly mocked in E2E environment
**Issue**: B2 health check failing, fallback to Supabase not working correctly
**Fix**: Ensure B2 mock service is properly configured for E2E tests
**Impact**: ~5 tests (photo upload, moderation)

## Priority 2: Missing UI Components

### 2.1 Mobile Menu Toggle ✅ DIAGNOSED
**File**: `components/admin/Sidebar.tsx`
**Status**: Already implemented! Lines 88-95 show mobile toggle button
**Issue**: Tests may be looking for wrong selector or button not visible in test viewport
**Fix**: Verify button visibility and add proper test selectors

### 2.2 "Manage Sections" Button ✅ NEEDS IMPLEMENTATION
**Files**: `app/admin/events/page.tsx`, `app/admin/activities/page.tsx`
**Status**: NOT IMPLEMENTED - No "Manage Sections" button in UI
**Fix**: Add button to event/activity detail views that navigates to section editor
**Impact**: ~4 tests (section management navigation)

### 2.3 Email Composer UI ✅ PARTIALLY COMPLETE
**File**: `components/admin/EmailComposer.tsx`
**Status**: Basic structure exists, needs completion
**Missing**: Template preview, recipient count display, send/schedule buttons
**Fix**: Complete the email composer UI with all required features
**Impact**: ~6 tests (email composition workflow)

### 2.4 Reference Block Picker ✅ EXISTS
**File**: `components/admin/ReferenceBlockPicker.tsx`
**Status**: Component exists and is implemented
**Issue**: May have integration issues with section editor
**Fix**: Verify integration and fix any connection issues

## Priority 3: State Management

### 3.1 Data Table URL State ✅ PARTIALLY IMPLEMENTED
**File**: `components/ui/DataTable.tsx`
**Status**: URL state sync exists (lines 75-95) but may have edge cases
**Issue**: Debounced search not updating URL, filter restoration incomplete
**Fix**: Ensure all state changes update URL and restore correctly
**Impact**: ~6 tests (data table filtering, search, sort)

### 3.2 Dropdown Reactivity ✅ NEEDS INVESTIGATION
**Files**: Various form components
**Issue**: Dropdowns not updating after data changes
**Fix**: Ensure proper React key usage and state updates
**Impact**: ~4 tests (guest groups, form interactions)

### 3.3 Session Persistence ✅ NEEDS INVESTIGATION
**Issue**: Auth state not maintained across navigation
**Fix**: Verify cookie handling and session storage
**Impact**: ~3 tests (authentication flow)

## Priority 4: Dynamic Routes

### 4.1 Guest View Routes 404 ✅ NEEDS INVESTIGATION
**Files**: `app/event/[id]/page.tsx`, `app/activity/[id]/page.tsx`
**Issue**: Routes returning 404 for dynamic segments
**Fix**: Verify Next.js 15 dynamic route configuration and params handling
**Impact**: ~15 tests (guest view navigation)

### 4.2 Content Page Routes ✅ NEEDS INVESTIGATION
**File**: `app/[type]/[slug]/page.tsx`
**Issue**: Slug-based routing not working
**Fix**: Verify route configuration and slug generation
**Impact**: ~10 tests (content page display)

## Implementation Order

### Phase 1: API Fixes (Immediate - 2 hours)
1. Fix RSVP API query syntax (30 min)
2. Fix email templates cookie handling (30 min)
3. Configure B2 mock for E2E tests (1 hour)

**Expected Impact**: +30 tests (47% → 55%)

### Phase 2: Critical UI (Next - 3 hours)
1. Add "Manage Sections" buttons (1 hour)
2. Complete email composer UI (1.5 hours)
3. Fix mobile menu visibility (30 min)

**Expected Impact**: +15 tests (55% → 59%)

### Phase 3: State Management (Then - 2 hours)
1. Fix data table URL state edge cases (1 hour)
2. Fix dropdown reactivity (30 min)
3. Verify session persistence (30 min)

**Expected Impact**: +10 tests (59% → 62%)

### Phase 4: Dynamic Routes (Finally - 2 hours)
1. Fix guest view routes (1 hour)
2. Fix content page routes (1 hour)

**Expected Impact**: +20 tests (62% → 68%)

## Total Expected Improvement
- **Current**: 170/359 (47%)
- **After All Fixes**: 245/359 (68%)
- **Target**: 287/359 (80%)

## Files to Modify

### API Routes
- `app/api/admin/rsvps/route.ts` - Fix query syntax
- `app/api/admin/emails/templates/route.ts` - Fix cookie handling
- `__tests__/mocks/mockB2Service.ts` - Ensure proper E2E mocking

### Services
- `services/rsvpManagementService.ts` - Fix search query with joins

### Components
- `app/admin/events/page.tsx` - Add "Manage Sections" button
- `app/admin/activities/page.tsx` - Add "Manage Sections" button
- `components/admin/EmailComposer.tsx` - Complete UI
- `components/ui/DataTable.tsx` - Fix URL state edge cases
- `components/admin/Sidebar.tsx` - Verify mobile toggle

### Routes
- `app/event/[id]/page.tsx` - Verify dynamic route config
- `app/activity/[id]/page.tsx` - Verify dynamic route config
- `app/[type]/[slug]/page.tsx` - Verify slug routing

## Success Criteria
- All API routes return correct status codes (no 500 errors)
- All UI components render and are interactive
- State management works consistently
- Dynamic routes resolve correctly
- Test pass rate improves to 68%+ (245/359 tests)

## Next Steps
1. Start with Phase 1 (API fixes) - highest impact, blocking other tests
2. Run tests after each phase to verify improvements
3. Document any new issues discovered
4. Iterate until 80% pass rate achieved
