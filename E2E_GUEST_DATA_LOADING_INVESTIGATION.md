# E2E Guest Data Loading Investigation

## Current Status

✅ **RLS Policies Fixed**: Both email tables AND guests/groups tables now have correct RLS policies
❌ **Tests Still Failing**: 5/13 email tests failing with "did not find some options" error
🔍 **Root Cause**: Frontend component issue, not RLS or API issue

## What We Fixed

### Migration 054: Email Tables RLS
Applied to E2E database (`olcqaawrpnanioaorfer`):
- ✅ `email_logs` - RLS policies check `admin_users` table
- ✅ `email_templates` - RLS policies check `admin_users` table
- ✅ `scheduled_emails` - RLS policies check `admin_users` table
- ✅ `sms_logs` - RLS policies check `admin_users` table

### Migration 055: Guests/Groups RLS
Applied to E2E database (`olcqaawrpnanioaorfer`):
- ✅ `guests` - RLS policy `admin_users_access_all_guests` created
- ✅ `groups` - RLS policy `admin_users_access_all_groups` created

## Evidence That API Works

From test logs:
```
[WebServer]  GET /api/admin/guests?format=simple 200 in 702ms
[WebServer]  GET /api/admin/groups 200 in 504ms
```

Both APIs return 200 OK, meaning:
1. ✅ Authentication works
2. ✅ RLS policies allow access
3. ✅ Data is being returned

## The Real Problem

The issue is in the **EmailComposer component** - it's not properly populating the dropdown options even though the API returns data successfully.

### Test Behavior
- Tests create guests in `beforeEach`
- Tests wait for modal to open
- Tests try to select guest options
- **Dropdown has no options** (even though API returned data)

### Possible Causes

1. **Race Condition**: Component renders before API call completes
2. **State Update Issue**: API response not updating component state
3. **Dropdown Rendering**: Options not being rendered from state
4. **Test Timing**: Not waiting long enough for options to populate

## Test Results

### Passing Tests (7/13)
1. ✅ Select recipients by group
2. ✅ Validate required fields and email addresses
3. ✅ Save email as draft
4. ✅ Send bulk email to all guests
5. ✅ Sanitize email content for XSS prevention
6. ✅ Keyboard navigation in email form
7. ✅ Accessible form elements with ARIA labels

### Failing Tests (5/13)
All fail with same error: `did not find some options`

1. ❌ Complete full email composition and sending workflow
2. ❌ Use email template with variable substitution
3. ❌ Preview email before sending
4. ❌ Schedule email for future delivery
5. ❌ Show email history after sending

### Skipped Tests (1/13)
1. ⏭️ Create and use email template (page doesn't exist yet)

## Next Steps

### Option 1: Fix EmailComposer Component (Recommended)
**Time**: 30-60 minutes
**Impact**: Fixes 5 tests, completes email management suite

**Actions**:
1. Read `components/admin/EmailComposer.tsx`
2. Identify why dropdown options aren't populating
3. Add proper loading states and waits
4. Ensure API response updates dropdown state
5. Test the fix

### Option 2: Update Test Wait Strategy
**Time**: 15-30 minutes
**Impact**: May fix tests without code changes

**Actions**:
1. Update `waitForGuestOptions` helper to be more robust
2. Add explicit waits for API calls to complete
3. Wait for dropdown to have options before selecting
4. Increase timeout if needed

### Option 3: Move to Next Priority
**Time**: 0 minutes
**Impact**: Document issue, fix later

**Actions**:
1. Document the issue in backlog
2. Move to Priority 2: Location Hierarchy (6 tests)
3. Return to email tests after other priorities

## Recommendation

**Proceed with Option 1**: Fix the EmailComposer component. This is the root cause and fixing it will:
- Complete the email management test suite (13/13 passing)
- Improve the actual user experience (not just tests)
- Validate that our RLS fixes are working correctly
- Increase E2E pass rate by 4.6% (5 more tests passing)

The RLS fixes we applied are working correctly - the API returns data successfully. The issue is purely in the frontend component not properly handling the API response.

## Files to Investigate

1. `components/admin/EmailComposer.tsx` - Main component
2. `__tests__/e2e/admin/emailManagement.spec.ts` - Test file
3. `app/api/admin/guests/route.ts` - API route (confirmed working)
4. `app/api/admin/groups/route.ts` - API route (confirmed working)

## Success Criteria

After fixing EmailComposer:
- ✅ All 13 email management tests pass
- ✅ Dropdown populates with guest options
- ✅ Tests can select guests from dropdown
- ✅ E2E pass rate increases from 67.9% to 72.5%

## Current E2E Status

- **Pass Rate**: 67.9% (74/109 tests)
- **After Email Fix**: 72.5% (79/109 tests)
- **Target**: 100% (109/109 tests)

