# E2E Phase 1 Fix Plan - Critical Infrastructure

## Overview
Fixing 15 critical infrastructure tests (8 DataTable + 7 Navigation) to increase pass rate from 51% to 55%+.

## Task 1: DataTable URL State Management (8 tests)

### Issues Identified:
1. **Filter chips not displaying properly** - Missing `filter-chip` class and proper styling
2. **URL not updating correctly** - Filter parameters not being set/removed properly
3. **State not restoring from URL** - Initial state not reading URL params correctly
4. **Sort indicators not showing** - Missing visual feedback for sort direction

### Fixes Required:

#### Fix 1.1: Add filter-chip class for test selectors
- Add `filter-chip` class to filter chip divs
- Add `type="button"` to remove buttons
- Make × button more visible with `font-bold` and `ml-1`

#### Fix 1.2: Fix URL parameter handling
- Ensure filter parameters use correct naming (`filter_${key}`)
- Fix filter removal to properly delete URL params
- Add proper debouncing for search URL updates

#### Fix 1.3: Improve state restoration
- Ensure all URL params are read on mount
- Fix filter state initialization from URL
- Handle edge cases (empty values, missing params)

#### Fix 1.4: Add sort visual indicators
- Ensure ↑/↓ arrows are visible
- Add proper aria-sort attributes
- Fix sort direction toggle logic

## Task 2: Admin Navigation (7 tests)

### Issues Identified:
1. **Tabs not expanding properly** - Sub-items not showing when tab clicked
2. **Active state not highlighting** - Missing emerald color scheme
3. **aria-current not set** - Accessibility attributes missing
4. **Mobile menu not working** - Toggle functionality broken
5. **Keyboard navigation broken** - Arrow keys not working
6. **Browser back/forward not updating state** - Navigation state not syncing

### Fixes Required:

#### Fix 2.1: Fix tab expansion in TopNavigation
- Ensure clicking tab shows sub-items
- Fix activeTab state management
- Add proper aria-expanded attributes

#### Fix 2.2: Fix active state highlighting
- Use emerald color scheme (bg-emerald-50, text-emerald-700, bg-emerald-600)
- Add aria-current="page" to active elements
- Ensure border-emerald-600 for active tab border

#### Fix 2.3: Fix mobile menu
- Ensure hamburger button works
- Fix menu open/close state
- Add proper aria-expanded and aria-label
- Close menu after navigation

#### Fix 2.4: Fix keyboard navigation
- Implement ArrowLeft/ArrowRight for tab navigation
- Add Home/End key support
- Ensure proper focus management

#### Fix 2.5: Fix browser navigation
- Listen to pathname changes
- Update activeTab/activeSubItem from URL
- Persist state in sessionStorage

## Implementation Order:
1. DataTable fixes (highest priority - 8 tests)
2. Navigation fixes (7 tests)
3. Run tests to verify
4. Document results

## Success Criteria:
- All 8 DataTable URL state tests pass
- All 7 Navigation tests pass
- Total passing tests: 183 → 198 (55%+ pass rate)
- No regressions in existing passing tests
