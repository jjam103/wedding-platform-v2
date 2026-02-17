# E2E Test Infrastructure Fix Implementation

## Current Status
- **Test File**: `__tests__/e2e/system/uiInfrastructure.spec.ts`
- **Current Pass Rate**: 19/25 tests passing (76%)
- **Skipped Tests**: 3 (2 CSS tests + 1 activity form test)
- **Failing Tests**: 3 (event form + 2 CSS tests)

## Analysis

### Components Already Fixed
✅ **DynamicForm** - Already has `data-testid="form-submit-button"` and `data-testid="form-cancel-button"`
✅ **CollapsibleForm** - Already has `data-testid="collapsible-form-toggle"`, `data-testid="collapsible-form-content"`, `data-testid="form-submit-button"`, and `data-testid="form-cancel-button"`
✅ **Events Page** - Already has `data-testid="add-event-button"`

### Test File Already Has
✅ **Test Isolation** - `beforeEach` and `afterEach` hooks already implemented
✅ **CSS Tests** - Already updated to check for CSS loading rather than specific colors

### What Needs to be Done

#### Phase 1: Test File Updates
1. ✅ Test isolation already implemented
2. ✅ CSS tests already updated
3. ⚠️ Event form test needs to use data-testid (partially done)
4. ⚠️ Activity form test is skipped - needs to be un-skipped

#### Phase 2: Playwright Config
1. Add retry logic for flaky tests
2. Mark slow tests appropriately

## Implementation Plan

### Step 1: Update Event Form Test
The event form test already uses `[data-testid="add-event-button"]` and `[data-testid="form-submit-button"]`, so it should work. The issue might be timing or state pollution.

### Step 2: Un-skip Activity Form Test
The activity form test is currently skipped. We need to:
1. Un-skip the test
2. Ensure it uses proper selectors
3. Add proper waits for form expansion

### Step 3: Add Retry Logic to Playwright Config
Add retry configuration to handle occasional timing issues.

## Expected Outcomes

After implementation:
- **Phase 1**: 24-25/25 tests passing (96-100%)
- **Phase 2**: 25/25 tests passing (100%) with retries

## Next Steps

1. Run tests to verify current state
2. Un-skip activity form test
3. Add retry logic to playwright.config.ts
4. Run full test suite to verify 100% pass rate
