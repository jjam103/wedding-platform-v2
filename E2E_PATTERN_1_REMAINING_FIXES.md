# E2E Pattern 1 - Remaining Fixes

## Current Status

✅ **Fixed Issues:**
1. Added `total_rooms` field to room_types creation
2. Added `price_per_night` field to room_types creation  
3. Changed timestamp-based slugs to UUID-based slugs (prevents retry conflicts)
4. Removed invalid `type` field from content_pages creation
5. Fixed `order_index` → `display_order` in sections table
6. Fixed `section_columns` → `columns` table name
7. Fixed `column_index` → `column_number` field name
8. Fixed content storage to use `content_data` JSONB with `{html: '...'}` structure

✅ **Test Results:**
- 2 tests passing
- 6 tests failing (all due to using old ID constants instead of slugs)
- 47 tests not run (blocked by failures)

## Remaining Issue

The test file still uses old hardcoded ID constants in many places:
- `TEST_EVENT_ID` (should be `TEST_EVENT_SLUG`)
- `TEST_ACTIVITY_ID` (should be `TEST_ACTIVITY_SLUG`)
- `TEST_ACCOMMODATION_ID` (should be `TEST_ACCOMMODATION_SLUG`)
- `TEST_ROOM_TYPE_ID` (should be `TEST_ROOM_TYPE_SLUG`)
- `TEST_CONTENT_ID` (should be `TEST_CONTENT_SLUG`)

## Locations to Fix

Found 20+ occurrences in `__tests__/e2e/guest/guestViews.spec.ts`:
- Lines 230, 239, 254, 274, 294, 314, 334, 357, 367, 372 (TEST_ACTIVITY_ID)
- Lines 526, 540, 556, 610, 639, 699, 710 (TEST_ACTIVITY_ID)
- Lines 574, 625, 657 (TEST_EVENT_ID)
- Plus more for other constants

## Fix Strategy

Use global find-replace in the test file:
1. `TEST_EVENT_ID` → `TEST_EVENT_SLUG`
2. `TEST_ACTIVITY_ID` → `TEST_ACTIVITY_SLUG`
3. `TEST_ACCOMMODATION_ID` → `TEST_ACCOMMODATION_SLUG`
4. `TEST_ROOM_TYPE_ID` → `TEST_ROOM_TYPE_SLUG`
5. `TEST_CONTENT_ID` → `TEST_CONTENT_SLUG`

## Expected Outcome

After this fix, all 55 guest view tests should pass, improving overall E2E pass rate from 190/363 (52.3%) to ~245/363 (67.5%).

## Next Steps

1. Apply global find-replace to test file
2. Run tests: `npx playwright test __tests__/e2e/guest/guestViews.spec.ts`
3. Verify all 55 tests pass
4. Move to Pattern 2 (Form Validation - 40 failures)
