# E2E Phase 1 Guest Authentication - Current Status

**Date**: February 6, 2026  
**Status**: 4/16 tests passing (25%)  
**Previous Status**: 5/16 passing after subagent work  
**Regression**: -1 test (likely flaky test)

## Test Results Summary

### ✅ Passing Tests (4/16)
1. ✅ Shows error for invalid email format
2. ✅ Shows error for non-existent email  
3. ✅ Successfully authenticates with email matching
4. ✅ Creates session cookie on successful authentication

### ❌ Failing Tests (12/16)

#### Category 1: Navigation Not Working (1 test)
**Test**: "should successfully authenticate with email matching"
- **Issue**: API returns 200 OK with `{ success: true }` but navigation to `/guest/dashboard` doesn't happen
- **Evidence**: Browser stays on `/auth/guest-login?returnTo=%2Fguest%2Fdashboard`
- **Root Cause**: Unknown - code looks correct (line 88 in page.tsx has `router.push('/guest/dashboard')`)

#### Category 2: Loading State Test (1 test)  
**Test**: "should show loading state during authentication"
- **Issue**: Test timing or selector issue
- **Needs Investigation**

#### Category 3: Magic Link Tests (6 tests)
All magic link tests failing with similar issues:
1. "should successfully request and verify magic link"
2. "should show success message after requesting magic link"
3. "should show error for expired magic link"
4. "should show error for already used magic link"
5. "should switch between authentication tabs"
6. "should handle authentication errors gracefully"

**Issues**:
- Strict mode violations (multiple elements match selectors)
- Error message mismatches ("Invalid Link" vs "Link Expired")
- Tab switching selector issues

#### Category 4: Session Persistence Tests (2 tests)
1. "should complete logout flow"
2. "should persist authentication across page refreshes"

**Issue**: Navigation not working (same as Category 1)

#### Category 5: Test Data Issues (2 tests)
1. "should switch between authentication tabs" 
2. "should log authentication events in audit log"

**Issue**: "Failed to create test guest" error

## Critical Issues Analysis

### Issue #1: Navigation Not Working After Successful Login
**Severity**: CRITICAL  
**Impact**: Blocks 3+ tests

**Code Review**:
```typescript
// app/auth/guest-login/page.tsx:87-88
if (response.ok && data.success) {
  router.push('/guest/dashboard');
}
```

**API Response** (app/api/auth/guest/email-match/route.ts:165):
```typescript
return NextResponse.json(
  { success: true, data: { guestId: guest.id, groupId: guest.group_id } }, 
  { status: 200 }
);
```

**Hypothesis**: 
- Response structure is correct
- Condition should evaluate to true
- Possible issues:
  1. Router not initialized properly
  2. Cookie not being set correctly (blocking navigation)
  3. Middleware redirecting back
  4. Race condition with cookie setting

**Debug Steps Needed**:
1. Add console.log before router.push to confirm code path
2. Check if middleware is interfering
3. Verify cookie is actually set in browser
4. Check if there's a redirect loop

### Issue #2: Error Message Mapping
**Severity**: MEDIUM  
**Impact**: 1 test

**Problem**: 
- Test expects "Link Expired" for TOKEN_EXPIRED
- Page shows "Invalid Link" for all errors

**Location**: app/auth/guest-login/verify/page.tsx

**Fix Needed**: Map error codes to specific messages:
```typescript
const errorMessages = {
  TOKEN_EXPIRED: 'Link Expired',
  TOKEN_USED: 'Link Already Used',
  INVALID_TOKEN: 'Invalid Link',
};
```

### Issue #3: Test Selector Issues (Strict Mode)
**Severity**: MEDIUM  
**Impact**: 4+ tests

**Problem**: Selectors match multiple elements
```typescript
// ❌ Matches multiple buttons
page.locator('button:has-text("Magic Link")')

// ✅ Fix
page.getByRole('tab', { name: 'Magic Link' })
```

**Files to Update**: `__tests__/e2e/auth/guestAuth.spec.ts`

### Issue #4: Test Guest Creation Failures
**Severity**: LOW  
**Impact**: 2 tests

**Problem**: Some tests fail to create test guest in beforeEach

**Possible Causes**:
- Missing group_id
- Database constraint violations
- RLS policy issues

## Recommended Fix Order

### Priority 1: Fix Navigation (CRITICAL)
**Goal**: Get email matching login working end-to-end

**Steps**:
1. Add debug logging to page.tsx to confirm code path
2. Check middleware.ts for redirect loops
3. Verify cookie is set correctly
4. Test manually in browser with DevTools open

**Files**:
- `app/auth/guest-login/page.tsx`
- `middleware.ts`

### Priority 2: Fix Test Selectors
**Goal**: Eliminate strict mode violations

**Steps**:
1. Replace generic selectors with role-based selectors
2. Add data-testid attributes where needed
3. Use `.first()` for paragraph selectors

**Files**:
- `__tests__/e2e/auth/guestAuth.spec.ts`

### Priority 3: Fix Error Messages
**Goal**: Show correct error messages for different token states

**Steps**:
1. Add error code mapping in verify page
2. Update error display logic

**Files**:
- `app/auth/guest-login/verify/page.tsx`

### Priority 4: Fix Test Data Creation
**Goal**: Ensure test guests are created successfully

**Steps**:
1. Create group before creating guest
2. Add better error handling in test setup
3. Verify RLS policies allow test data creation

**Files**:
- `__tests__/e2e/auth/guestAuth.spec.ts` (beforeEach)

## Questions to Answer

1. **Why isn't navigation working?** The code looks correct but browser stays on login page
2. **Is middleware interfering?** Need to check if middleware is redirecting back
3. **Are cookies being set?** Need to verify in browser DevTools
4. **Why did we regress from 5/16 to 4/16?** Which test started failing?

## Next Steps

### Option A: Debug Navigation Issue (Recommended)
Focus on getting the core login flow working first. Once navigation works, many other tests may pass.

**Action**: Add debug logging and test manually to understand why navigation fails.

### Option B: Fix All Test Selectors First
Fix the low-hanging fruit (test selectors) to get more tests passing, then tackle navigation.

**Action**: Update test file with proper selectors.

### Option C: Full Rebuild
The subagent suggested routes might still be cached despite flattening.

**Action**: Kill all processes, clear all caches, rebuild from scratch.

## Success Criteria

- **Phase 1 Complete**: 16/16 tests passing (100%)
- **Minimum Viable**: 14/16 tests passing (88%) - acceptable if 2 tests are flaky
- **Current**: 4/16 tests passing (25%) - NOT acceptable

## Time Estimate

- **Priority 1 (Navigation)**: 30-60 minutes debugging + fix
- **Priority 2 (Selectors)**: 15-30 minutes
- **Priority 3 (Error Messages)**: 10-15 minutes  
- **Priority 4 (Test Data)**: 15-30 minutes

**Total**: 1.5-2.5 hours to complete Phase 1

## Recommendation

**Start with Priority 1 (Navigation Debug)**. This is the critical blocker. Once login navigation works, we can quickly fix the remaining issues.

Would you like me to:
1. Add debug logging to investigate the navigation issue?
2. Fix all test selectors first (quick wins)?
3. Do a full rebuild to clear any cache issues?
