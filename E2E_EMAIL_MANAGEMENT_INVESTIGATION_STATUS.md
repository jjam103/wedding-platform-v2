# E2E Email Management Investigation Status

## Current Status

**Problem**: 5/13 tests timeout waiting for guest IDs to appear in dropdown

**Root Cause Hypothesis**: Test data (guests) are being created but not appearing in the EmailComposer dropdown within the timeout period.

## Investigation Steps Taken

### Step 1: Added Enhanced Logging
Added logging to:
1. Test setup - log guest IDs immediately after creation
2. Test setup - verify guests exist in database after creation
3. `waitForSpecificGuests()` helper - log current dropdown options before waiting
4. Increased timeout from 10s to 15s

### Step 2: Test Execution
Running tests with enhanced logging to see:
- What guest IDs are created
- What's actually in the dropdown
- Whether the API is returning the guests

## Key Questions to Answer

1. **Are guests being created?**
   - Check test setup logs for "Created test guest" messages
   - Check "Verified guests in database" message

2. **What's in the dropdown?**
   - Check "Current dropdown options" log
   - Compare with "Looking for IDs" log

3. **Is the API working?**
   - Check for `/api/admin/guests?format=simple` 200 response
   - Check EmailComposer logs for guest count

## Possible Root Causes

### Hypothesis 1: Database Transaction Not Committed
**Symptom**: Guests created but not visible to API query
**Solution**: Add explicit wait or transaction commit

### Hypothesis 2: API Caching
**Symptom**: API returns old/empty data
**Solution**: Add cache-busting or wait for API to refresh

### Hypothesis 3: Component State Issue
**Symptom**: API returns guests but component doesn't render them
**Solution**: Check EmailComposer state management

### Hypothesis 4: RLS Policy Blocking
**Symptom**: Guests created but RLS prevents API from seeing them
**Solution**: Check RLS policies for guests table

## Next Steps

### If Guests Are Created But Not in Dropdown
1. Check if API is returning the guests (EmailComposer logs)
2. Check if component is rendering the options (React state)
3. Add wait for API call to complete before opening modal

### If Guests Are Not Being Created
1. Check database connection in test setup
2. Check for errors in test setup
3. Verify cleanup isn't running too early

### If API Returns Empty
1. Check RLS policies
2. Check authentication in API call
3. Add explicit wait after guest creation

## Test Execution Log Analysis

Waiting for test execution to complete to analyze logs...

## Files Modified

1. `__tests__/e2e/admin/emailManagement.spec.ts`
   - Added logging to test setup
   - Added guest verification query
   - Enhanced `waitForSpecificGuests()` logging
   - Increased timeout to 15s

## Expected Log Output

```
[Test Setup] Created test group: <uuid>
[Test Setup] Created test guest 1: <uuid> <email>
[Test Setup] Created test guest 2: <uuid> <email>
[Test Setup] Verified guests in database: [...]
[Test] Waiting for specific guests to appear: [<uuid1>, <uuid2>]
[Test] Form data loaded
[Test] Recipients select found
[Test] Current dropdown options: [...]
[Browser] Available guest IDs in dropdown: [...]
[Browser] Looking for IDs: [<uuid1>, <uuid2>]
[Browser] All guests found: true/false
```

## Decision Tree

```
Are guests created?
├─ NO → Fix test setup
└─ YES → Are guests in database?
    ├─ NO → Fix database transaction
    └─ YES → Does API return guests?
        ├─ NO → Fix API/RLS
        └─ YES → Does component render guests?
            ├─ NO → Fix component state
            └─ YES → Fix wait strategy
```

## Status: IN PROGRESS

Waiting for test execution with enhanced logging to complete.
