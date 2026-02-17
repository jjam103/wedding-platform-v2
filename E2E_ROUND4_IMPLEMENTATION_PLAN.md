# E2E Test Round 4 - Implementation Plan

## Current Status
- **Round 3 Results**: 180/326 tests passing (55%)
- **Target**: 280+/359 tests passing (80%+)
- **Next Phase**: Phase 1 - Missing Routes (Highest Impact)

## Phase 1: Missing Guest Routes (CRITICAL - Blocks ~50 tests)

### Priority: HIGHEST
**Expected Impact**: +50 tests (55% → 70% pass rate)
**Estimated Time**: 3-4 hours

### Routes to Implement

#### 1. Guest Registration Route
**File**: `app/auth/register/page.tsx`
**Status**: MISSING - causing test failures
**Requirements**:
- Guest registration form (first name, last name, email)
- Integration with guest authentication system
- Form validation and error handling
- Redirect to guest dashboard after successful registration
- Use existing auth patterns from `app/auth/guest-login/page.tsx`

**Implementation**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/guest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/guest/dashboard');
      } else {
        setError(result.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-jungle-800 mb-6">Guest Registration</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### 2. Event Detail Route (Slug-based)
**File**: `app/event/[slug]/page.tsx`
**Status**: Route exists at `app/event/[id]/page.tsx` but needs slug support
**Requirements**:
- Display event details for guests
- Show event name, date, time, location, description
- Display event sections (using SectionRenderer)
- Show RSVP status and form
- Handle both ID and slug-based routing

**Note**: Check if `app/event/[slug]/page.tsx` already exists. If so, verify it works. If not, enhance `app/event/[id]/page.tsx` to support slug lookup.

#### 3. Activity Detail Route (Slug-based)
**File**: `app/activity/[slug]/page.tsx`
**Status**: Route exists at `app/activity/[id]/page.tsx` but needs slug support
**Requirements**:
- Display activity details for guests
- Show activity name, date, time, location, description
- Display activity sections
- Show RSVP status and form
- Handle both ID and slug-based routing

**Note**: Similar to event route - check existing implementation and enhance if needed.

#### 4. Photo Gallery/Memories Route
**File**: `app/memories/page.tsx`
**Status**: MISSING - causing test failures
**Requirements**:
- Display photo gallery for guests
- Show only approved photos
- Use existing PhotoGallery component
- Filter by event/activity if needed
- Responsive grid layout

**Implementation**:
```typescript
import { PhotoGallery } from '@/components/guest/PhotoGallery';

export default function MemoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-jungle-800 mb-8">Wedding Memories</h1>
      <PhotoGallery />
    </div>
  );
}
```

#### 5. Activities Overview/Itinerary Route
**File**: `app/activities-overview/page.tsx`
**Status**: MISSING - causing test failures
**Requirements**:
- Display guest's personalized itinerary
- Show all activities guest has RSVP'd to
- Chronological ordering by date/time
- Use existing ItineraryViewer component
- Show event details and RSVP status

**Implementation**:
```typescript
import { ItineraryViewer } from '@/components/guest/ItineraryViewer';

export default function ActivitiesOverviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-jungle-800 mb-8">Your Itinerary</h1>
      <ItineraryViewer />
    </div>
  );
}
```

#### 6. Content Page Route (Verify Existing)
**File**: `app/[type]/[slug]/page.tsx`
**Status**: EXISTS - verify it works correctly
**Action**: Test this route with E2E tests to ensure it's working

### Implementation Checklist

- [ ] Create `app/auth/register/page.tsx`
- [ ] Create or enhance `app/event/[slug]/page.tsx`
- [ ] Create or enhance `app/activity/[slug]/page.tsx`
- [ ] Create `app/memories/page.tsx`
- [ ] Create `app/activities-overview/page.tsx`
- [ ] Verify `app/[type]/[slug]/page.tsx` works
- [ ] Test all routes return 200 (not 404)
- [ ] Run E2E tests to verify improvements
- [ ] Document any issues found

## Phase 2: Fix RSVP API Errors (HIGH PRIORITY - Blocks ~20 tests)

### Priority: HIGH
**Expected Impact**: +20 tests (70% → 77% pass rate)
**Estimated Time**: 2-3 hours

### Issues to Fix

#### 1. RSVP API 500 Errors
**File**: `app/api/admin/rsvps/route.ts`
**Issue**: Service returning 500 errors after `.or()` query fix
**Action**: Debug `rsvpManagementService.listRSVPs()` method
**Possible Causes**:
- In-memory filtering logic has bugs
- Pagination counts incorrect after filtering
- Statistics calculation failing

#### 2. RSVP Analytics API 500 Errors
**File**: `app/api/admin/rsvp-analytics/route.ts`
**Issue**: Analytics endpoint returning 500 errors
**Action**: Debug analytics calculation logic

## Phase 3: Fix Photo Upload API (MEDIUM PRIORITY - Blocks ~5 tests)

### Priority: MEDIUM
**Expected Impact**: +5 tests (77% → 78% pass rate)
**Estimated Time**: 1-2 hours

### Issues to Fix

#### 1. Photo Upload API 500 Errors
**File**: `app/api/admin/photos/route.ts`
**Issue**: Photo upload failing with 500 errors
**Action**: Verify B2 mock service configuration in `__tests__/mocks/mockB2Service.ts`

## Phase 4: Complete UI Components (MEDIUM PRIORITY - Blocks ~15 tests)

### Priority: MEDIUM
**Expected Impact**: +15 tests (78% → 83% pass rate)
**Estimated Time**: 2-3 hours

### Components to Complete

#### 1. Email Composer UI
**File**: `components/admin/EmailComposer.tsx`
**Missing Features**:
- Template preview
- Recipient count display
- Send/schedule buttons functionality

#### 2. Data Table URL State
**File**: `components/ui/DataTable.tsx`
**Issue**: Debounced search not updating URL correctly
**Action**: Fix URL state synchronization

#### 3. Mobile Menu
**File**: `components/admin/Sidebar.tsx`
**Issue**: Toggle button may not be visible in test viewport
**Action**: Verify button visibility and add proper test selectors

## Phase 5: Fix Dynamic Route Params (LOW PRIORITY - Blocks ~10 tests)

### Priority: LOW
**Expected Impact**: +10 tests (83% → 86% pass rate)
**Estimated Time**: 1-2 hours

### Issues to Fix

#### 1. Next.js 15 Params Handling
**Files**: All dynamic routes
**Issue**: Some routes may not be using `await params` correctly
**Action**: Audit all dynamic routes and ensure proper async params handling

## Testing Strategy

### After Each Phase
1. Run full E2E test suite: `npm run test:e2e`
2. Analyze results and compare to previous run
3. Document improvements and remaining issues
4. Proceed to next phase if target met

### Specific Test Suites to Monitor
- `__tests__/e2e/system/routing.spec.ts` - Route resolution
- `__tests__/e2e/guest/guestViews.spec.ts` - Guest pages
- `__tests__/e2e/auth/guestAuth.spec.ts` - Authentication
- `__tests__/e2e/admin/rsvpManagement.spec.ts` - RSVP management
- `__tests__/e2e/admin/photoUpload.spec.ts` - Photo uploads

## Success Metrics

| Phase | Tests Fixed | Pass Rate | Cumulative |
|-------|-------------|-----------|------------|
| Current | - | 55% | 180/326 |
| Phase 1 | +50 | 70% | 230/326 |
| Phase 2 | +20 | 77% | 250/326 |
| Phase 3 | +5 | 78% | 255/326 |
| Phase 4 | +15 | 83% | 270/326 |
| Phase 5 | +10 | 86% | 280/326 |
| **Target** | **+100** | **86%+** | **280+/326** |

## Notes

- Focus on Phase 1 first - highest impact
- Keep implementations minimal but functional
- Follow existing code patterns and conventions
- Use existing components and services
- Add proper error handling and loading states
- Ensure accessibility compliance (ARIA labels, keyboard navigation)
- Test incrementally after each major change

## Next Steps

1. **Immediate**: Start with Phase 1 - implement missing routes
2. **After Phase 1**: Run E2E tests and analyze results
3. **Continue**: Proceed with Phase 2 if Phase 1 successful
4. **Iterate**: Continue through phases until 80%+ pass rate achieved

## Resources

- **E2E Round 3 Results**: `E2E_ROUND3_RESULTS.md`
- **Fix Plan**: `E2E_ROUND2_FIX_PLAN.md`
- **Applied Fixes**: `E2E_ROUND2_FIXES_APPLIED.md`
- **Testing Standards**: `.kiro/steering/testing-standards.md`
- **Code Conventions**: `.kiro/steering/code-conventions.md`
