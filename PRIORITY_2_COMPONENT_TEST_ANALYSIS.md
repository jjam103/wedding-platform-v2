# Priority 2: Component Rendering Test Analysis

## Current Status
- **Total Tests**: 3,767
- **Passing**: 3,368 (89.4%)
- **Failing**: 317 (8.4%)
- **Skipped**: 82 (documented)

## Test Failures Identified

### 1. Collapsible Form Tests (app/admin/guests/page.collapsibleForm.test.tsx)
**Issue**: Button selector mismatch
- **Test expects**: `getByRole('button', { name: /add guest/i })`
- **Actual structure**: Button contains `<h2>Add New Guest</h2>` inside it
- **Problem**: The accessible name doesn't match the regex pattern

**Fix**: Update test to use `getByText` instead of `getByRole` with name:
```typescript
// ❌ WRONG
const addButton = screen.getByRole('button', { name: /add guest/i });

// ✅ CORRECT
const addButton = screen.getByText('Add New Guest').closest('button');
// OR
const addButton = screen.getByRole('button', { name: /add new guest/i });
```

### 2. Room Types Page Tests (app/admin/accommodations/[id]/room-types/page.test.tsx)
**Issue**: Multiple elements with same text
- **Error**: "Found multiple elements with the text: Ocean View Suite"
- **Problem**: Test data creates duplicate room types

**Fix**: Use more specific queries with test IDs or unique identifiers:
```typescript
// ❌ WRONG
expect(screen.getByText('Ocean View Suite')).toBeInTheDocument();

// ✅ CORRECT
expect(screen.getAllByText('Ocean View Suite')).toHaveLength(2);
// OR use data-testid
expect(screen.getByTestId('room-type-1')).toHaveTextContent('Ocean View Suite');
```

### 3. Property Tests (app/admin/activities/page.property.test.tsx)
**Issue**: Timing and state update problems
- **Error**: "Maximum update depth exceeded"
- **Problem**: Infinite re-render loop in component

**Fix**: Wrap state updates in `act()` and add proper cleanup:
```typescript
// ❌ WRONG
render(<ActivitiesPage />);
await waitFor(() => {
  expect(screen.getByText(activity.name)).toBeInTheDocument();
});

// ✅ CORRECT
await act(async () => {
  render(<ActivitiesPage />);
});
await waitFor(() => {
  expect(screen.getByText(activity.name)).toBeInTheDocument();
}, { timeout: 2000 });
```

### 4. Guest View Navigation Tests (app/admin/activities/page.guestView.test.tsx)
**Issue**: Incorrect URL expectation
- **Expected**: `/guest/activities/activity-1`
- **Actual**: Different URL structure

**Fix**: Update test expectations to match actual routing:
```typescript
// Check actual implementation first
// Then update test to match
```

## Common Patterns Found

### Pattern A: Mock Data Structure Mismatches
**Status**: ✅ FIXED in Priority 1
- `useLocations` returning objects instead of arrays
- `useEvents` returning wrong structure
- `useSections` missing properties

### Pattern B: Async State Not Awaited
**Status**: ⚠️ NEEDS FIXING
- Components with async data loading
- Missing `act()` wrappers
- Insufficient wait times

### Pattern C: Text Content Mismatches
**Status**: ⚠️ NEEDS FIXING
- Button labels changed but tests not updated
- Accessible names don't match expectations
- Multiple elements with same text

### Pattern D: Form Interaction Issues
**Status**: ⚠️ NEEDS FIXING
- Collapsible forms not expanding properly in tests
- Form fields not found after expansion
- Submit handlers not being called

## Recommended Fix Strategy

### Phase 1: Quick Wins (Est. 50 tests)
1. Fix button selector mismatches in collapsible form tests
2. Update text expectations to match current implementation
3. Add proper `act()` wrappers for async operations

### Phase 2: Structural Fixes (Est. 75 tests)
1. Fix duplicate text issues with better selectors
2. Update URL expectations for navigation tests
3. Add proper cleanup in property tests

### Phase 3: Deep Fixes (Est. 25 tests)
1. Fix infinite re-render loops
2. Improve async state handling
3. Add missing test IDs where needed

## Files Requiring Attention

### High Priority (Blocking Multiple Tests)
1. `app/admin/guests/page.collapsibleForm.test.tsx` - 9 failures
2. `app/admin/accommodations/[id]/room-types/page.test.tsx` - 11 failures
3. `app/admin/activities/page.property.test.tsx` - 3 failures

### Medium Priority (Isolated Issues)
1. `app/admin/activities/page.guestView.test.tsx` - 1 failure
2. Various property tests with timing issues

### Low Priority (Edge Cases)
1. Tests with skipped assertions
2. Tests with flaky behavior

## Next Steps

1. **Immediate**: Fix collapsible form button selectors (9 tests)
2. **Short-term**: Fix room types duplicate text issues (11 tests)
3. **Medium-term**: Fix property test timing issues (3+ tests)
4. **Long-term**: Add comprehensive test IDs for better selectors

## Success Metrics

- **Target**: 95%+ pass rate (3,579+ passing tests)
- **Current**: 89.4% pass rate (3,368 passing tests)
- **Gap**: 211 tests need fixing
- **Priority 2 Target**: Fix ~150 component rendering tests
- **Remaining**: ~60 tests for Priority 3+

## Reference Documents

- `TASK_54_COMPONENT_TEST_FIXES.md` - Mock data structure fixes
- `testing-standards.md` - Testing patterns and conventions
- `code-conventions.md` - Component and test naming conventions
