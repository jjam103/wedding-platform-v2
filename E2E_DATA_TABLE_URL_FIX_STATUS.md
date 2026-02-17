# E2E Data Table URL State Management - Current Status

## Test Results: 7/9 Passing (78%)

### ✅ Working Features

1. **Search with debouncing** - FULLY WORKING
   - Search input updates URL after 500ms debounce
   - URL restoration works correctly
   - Tests passing

2. **URL state management** - FULLY WORKING  
   - Synchronous URL updates using `window.history.replaceState()`
   - All URL parameters update immediately
   - URL restoration from page load works perfectly

3. **Sort state management** - WORKING (indicators missing)
   - Sort state updates URL correctly
   - URL restoration works
   - **Issue**: Sort indicators (↑/↓) not showing in table headers

4. **Filter state management** - WORKING (chips not rendering)
   - Filter state updates URL correctly
   - URL restoration works
   - **Issue**: Filter chips not visible in UI

### ❌ Failing Tests

1. **"should display and remove filter chips"** - FAILING
   - **Root Cause**: Filter chips code exists (lines 1287-1310) but not rendering
   - **Symptoms**: Test cannot find `div:has-text("RSVP Status: Attending")`
   - **Investigation Needed**: Why activeFilters array isn't populating or chips aren't visible

2. **"should toggle sort direction and update URL"** - FLAKY
   - Passes on retry
   - Sort indicators missing from table headers

### 🔍 Investigation Findings

#### Filter Chips Issue
- Code location: `app/admin/guests/page.tsx` lines 1287-1310
- `activeFilters` computed correctly in useMemo (lines 682-738)
- Conditional rendering: `{activeFilters.length > 0 && ...}`
- X icon imported correctly: `import { X } from 'lucide-react'`
- State initialization from URL works (lines 95-110)
- URL updates correctly with filter params

**Possible causes**:
1. `activeFilters` array is empty despite state being set
2. Rendering is happening but chips are hidden by CSS
3. Timing issue - chips render after test looks for them
4. Text matching issue with Playwright selector

#### Sort Indicators Issue
- DataTable component HAS sort indicators built-in (DataTable.tsx)
- Indicators show when `sortColumn` matches column key
- Guests page uses `DataTableWithSuspense` wrapper
- DataTable manages its own sort state from URL params

**Root cause**: DataTable is managing sort state internally, but guests page also has its own sort state. Need to verify they're in sync.

### 📋 Next Steps

1. **Debug filter chips**:
   - Add console.log to verify `activeFilters` has data when filter is selected
   - Check if conditional `{activeFilters.length > 0 && ...}` is evaluating correctly
   - Verify timing - does state update before chips try to render?
   - Test with simpler selector in E2E test

2. **Fix sort indicators**:
   - Verify DataTable is receiving sort state from URL
   - Check if DataTableWithSuspense wrapper is passing props correctly
   - Ensure column definitions have `sortable: true`

3. **Re-run tests** after fixes to verify 100% pass rate

### 📁 Key Files

- `app/admin/guests/page.tsx` - Main page with filter chips (lines 1287-1310, activeFilters at 682-738)
- `components/ui/DataTable.tsx` - Table component with built-in sort indicators
- `hooks/useURLState.ts` - URL state management (WORKING)
- `hooks/useDebouncedSearch.ts` - Debounced search (WORKING)
- `__tests__/e2e/accessibility/suite.spec.ts` - E2E tests (lines 843-980)

### 🎯 Success Criteria

- All 9 data table tests passing consistently
- Filter chips visible when filters are active
- Sort indicators (↑/↓) visible in table headers when sorted
- URL state persists across page reloads
- No flaky tests
