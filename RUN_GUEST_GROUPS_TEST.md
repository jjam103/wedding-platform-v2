# Run Guest Groups E2E Test

## Quick Start

```bash
# Run the specific failing test
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts -g "should create group and immediately use it for guest creation"
```

## What Was Fixed

**Problem**: Newly created guests were not appearing in the table after creation, causing the test to fail at line 281.

**Root Cause**: Race condition between database commit and table refresh.

**Solution**: Added 100ms delay before `fetchGuests()` to ensure database transaction has committed.

## Files Changed

1. `app/admin/guests/page.tsx` - Added delay before fetchGuests()
2. `app/admin/events/page.tsx` - Added delay before fetchEvents()
3. `app/admin/activities/page.tsx` - Added delay before fetchActivities()
4. `app/admin/accommodations/page.tsx` - Added delay before fetchAccommodations()
5. `__tests__/e2e/guest/guestGroups.spec.ts` - Removed page reload workaround

## Expected Result

```
✅ Test passes without page reload
✅ Guest appears in table immediately after creation
✅ Group name is visible in the guest row
```

## If Test Still Fails

1. **Check Database Connection**
   ```bash
   # Verify E2E database is accessible
   npm run test:e2e:setup
   ```

2. **Check Environment Variables**
   ```bash
   # Ensure .env.test.e2e has correct values
   cat .env.test.e2e | grep SUPABASE
   ```

3. **Increase Wait Time**
   If the test is still flaky, increase the delay in the component:
   ```typescript
   // In app/admin/guests/page.tsx, line 404
   await new Promise(resolve => setTimeout(resolve, 200)); // Increase from 100ms to 200ms
   ```

4. **Check CI Environment**
   CI environments may be slower. The test includes a 1500ms wait which should be sufficient, but you can increase it:
   ```typescript
   // In __tests__/e2e/guest/guestGroups.spec.ts, line 239
   await page.waitForTimeout(2000); // Increase from 1500ms to 2000ms
   ```

## Run All Guest Groups Tests

```bash
# Run entire guest groups test suite
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts
```

## Debug Mode

```bash
# Run with UI for debugging
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts --ui

# Run with headed browser
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts --headed

# Run with debug mode
npx playwright test __tests__/e2e/guest/guestGroups.spec.ts --debug
```

## View Test Report

```bash
# Generate and open HTML report
npx playwright show-report
```

## Related Documentation

- **Fix Details**: `E2E_FEB16_2026_GUEST_GROUPS_TABLE_REFRESH_FIX.md`
- **Complete Summary**: `E2E_FEB16_2026_RACE_CONDITION_FIX_COMPLETE.md`
- **Original Diagnosis**: `E2E_FEB16_2026_PHASE3B_GUEST_GROUPS_COMPLETE_DIAGNOSIS.md`
