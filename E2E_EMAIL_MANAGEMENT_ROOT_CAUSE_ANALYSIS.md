# E2E Email Management Test Failures - Root Cause Analysis

## Status: IDENTIFIED

## Test Failures
- `should preview email before sending` - TimeoutError selecting guest option
- `should schedule email for future delivery` - TimeoutError selecting guest option

## Root Cause

The API route fixes we applied are **working correctly** and properly validating query parameters. However, the **EmailComposer component** is sending invalid query parameters that are being rejected by the new validation.

### Evidence from Page Snapshot
```yaml
- alert [ref=e88]:
  - img [ref=e90]
  - paragraph [ref=e93]: Invalid query parameters
  - button "Close notification" [ref=e94]:
```

The alert shows "Invalid query parameters" - this is the validation error from `/api/admin/guests` GET endpoint.

## What's Happening

1. Test creates a guest in `beforeEach`
2. Test opens email compose modal
3. EmailComposer component calls `/api/admin/guests?format=simple` (and possibly other params)
4. **NEW**: Our Zod validation rejects the request because optional params are being sent incorrectly
5. API returns 400 with "Invalid query parameters" error
6. Guest dropdown remains empty (no options loaded)
7. Test tries to select guest option that doesn't exist
8. Test times out after 15 seconds

## The Problem

The EmailComposer component in `components/admin/EmailComposer.tsx` is likely:
- Sending query parameters as `null` instead of omitting them
- Not handling the API error response properly
- Not showing a user-friendly error when guests fail to load

## The Solution

We already fixed this in the previous session! The file `components/admin/EmailComposer.tsx` was updated to:
1. Use `format=simple` query parameter
2. Add defensive checks with `Array.isArray()`
3. Handle errors individually for each API call

However, the issue is that the component might still be sending other optional parameters (like `groupId`, `ageType`, etc.) as `null` values in the query string.

## Next Steps

1. **Verify the EmailComposer component** is not sending null query parameters
2. **Check the API call** in EmailComposer to ensure it only sends `format=simple`
3. **Run the tests again** to confirm the fix works

## Expected Behavior After Fix

- EmailComposer should call: `/api/admin/guests?format=simple`
- API should return: `{ success: true, data: [guest1, guest2, ...] }`
- Dropdown should populate with guest options
- Tests should pass

## Files to Check

- `components/admin/EmailComposer.tsx` - Component making the API call
- `app/api/admin/guests/route.ts` - API route with new validation (already fixed)
- `__tests__/e2e/admin/emailManagement.spec.ts` - Test file

## Status

✅ API routes fixed (proper validation)
❓ EmailComposer component needs verification
⏳ Tests pending re-run after component verification
