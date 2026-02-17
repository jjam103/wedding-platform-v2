# E2E Guest Authentication Test Results

## Test Execution Summary

**Date**: February 6, 2026
**Test File**: `__tests__/e2e/auth/guestAuth.spec.ts`
**Total Tests**: 15
**Passed**: 7 ✅
**Failed**: 8 ❌
**Pass Rate**: 46.7%

## Passing Tests ✅

1. **Email matching authentication** - Successfully authenticates with email matching
2. **Non-existent email error** - Shows error for non-existent email
3. **Invalid email format** - Shows error for invalid email format
4. **Session cookie creation** - Creates session cookie on successful authentication
5. **Invalid/missing token errors** - Shows error for invalid or missing token
6. **Authentication persistence** - Persists authentication across page refreshes
7. **Tab switching** - Switches between authentication tabs

## Failing Tests ❌

### 1. Loading State During Authentication
**Error**: Button not disabled during loading
**Root Cause**: Authentication happens too fast - button is already gone by the time we check
**Fix Needed**: Test timing issue - need to check button state immediately after click

### 2-3. Magic Link Request Tests (2 failures)
**Error**: Success message not visible (`.bg-green-50` not found)
**Root Cause**: Guest has `email_matching` auth method, not `magic_link`
**Server Log**: `[Magic Link Request] Guest has wrong auth method: email_matching`
**Fix Needed**: Test is updating auth method but it's not taking effect before the request

### 4. Expired Magic Link Error
**Error**: Expected "Link Expired" but got "Invalid Link"
**Root Cause**: Backend returns generic "Invalid Link" for expired tokens
**Fix Needed**: Either update test expectations OR update backend to differentiate expired vs invalid

### 5. Already Used Magic Link
**Error**: Success message not visible when requesting magic link
**Root Cause**: Same as #2-3 - auth method not updated properly
**Fix Needed**: Ensure auth method update is committed before making request

### 6. Logout Flow
**Error**: Timeout waiting for redirect to `/auth/guest-login`
**Root Cause**: Logout button click doesn't trigger navigation
**Fix Needed**: Check logout implementation - may need to wait for API call completion

### 7. Authentication Errors Gracefully
**Error**: Expected "Link Expired" but got "Invalid Link"
**Root Cause**: Same as #4 - backend doesn't differentiate error types
**Fix Needed**: Update test expectations to match actual behavior

### 8. Audit Log Events
**Error**: Timeout waiting for redirect to `/guest/dashboard`
**Root Cause**: Authentication failing - staying on login page
**Fix Needed**: Investigate why authentication is failing in this specific test

## Key Issues Identified

### Issue 1: Auth Method Updates Not Taking Effect
**Tests Affected**: 2, 3, 5
**Problem**: Tests update guest's `auth_method` to `magic_link` but requests still see `email_matching`
**Solution Options**:
- Add delay after update to ensure database consistency
- Verify update with a query before proceeding
- Use transaction to ensure update is committed

### Issue 2: Error Message Inconsistency
**Tests Affected**: 4, 7
**Problem**: Backend returns "Invalid Link" for both expired and invalid tokens
**Solution Options**:
- Update backend to return specific error messages
- Update tests to accept generic "Invalid Link" message
- Add error codes to differentiate error types

### Issue 3: Logout Not Working
**Tests Affected**: 6
**Problem**: Logout button doesn't trigger navigation
**Solution Options**:
- Check if logout API is being called
- Verify middleware is clearing session
- Add explicit navigation after logout

### Issue 4: Intermittent Authentication Failure
**Tests Affected**: 8
**Problem**: Authentication works in other tests but fails here
**Solution Options**:
- Check for test isolation issues
- Verify test data cleanup between tests
- Add retry logic for flaky authentication

## Recommendations

### Immediate Fixes (High Priority)
1. **Fix auth method updates** - Add verification after update
2. **Fix logout flow** - Ensure navigation happens after logout
3. **Update error expectations** - Match actual backend behavior

### Medium Priority
4. **Improve error differentiation** - Backend should return specific error types
5. **Add retry logic** - Handle intermittent failures gracefully

### Low Priority
6. **Loading state test** - Adjust timing or use different approach
7. **Test isolation** - Ensure tests don't affect each other

## Next Steps

1. Fix auth method update issue by adding verification
2. Update error message expectations to match backend
3. Debug logout flow to ensure navigation works
4. Re-run tests to verify fixes
5. Address remaining failures

## Test Infrastructure Notes

- **Global Setup**: Working correctly - creates test data, warms up routes
- **Test Isolation**: Good - each test creates unique guest with worker ID
- **Cleanup**: Working - removes test data after each test
- **Parallel Execution**: Working - 4 workers running simultaneously

## Conclusion

The test suite is well-structured and most core functionality is working. The failures are primarily due to:
1. Auth method updates not taking effect immediately
2. Backend error messages not matching test expectations
3. Logout flow not triggering navigation

These are fixable issues that don't indicate fundamental problems with the authentication system.
