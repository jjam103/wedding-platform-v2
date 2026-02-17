# E2E Phase 3 Test Failures - Fix Plan

## Summary
17 failing tests identified across multiple categories. Most failures are related to:
1. Missing ARIA attributes and accessibility features
2. Responsive design issues
3. Data table URL state management
4. Content management form validation

## Failing Tests by Category

### 1. Keyboard Navigation (1 failure)
- **Test 7**: "should navigate form fields and dropdowns with keyboard" (line 136)
  - **Issue**: Form fields or dropdowns not properly keyboard accessible
  - **Fix**: Add proper tabindex, keyboard event handlers

### 2. Screen Reader Compatibility (4 failures)
- **Test 12**: "should have proper page structure with title, landmarks, and headings" (line 243)
  - **Issue**: Missing semantic HTML structure (main, nav, header landmarks)
  - **Fix**: Add proper landmark roles and semantic HTML

- **Test 22**: "should have proper ARIA expanded states and controls relationships" (line 462)
  - **Issue**: Missing aria-expanded, aria-controls on expandable elements
  - **Fix**: Add ARIA attributes to collapsible/expandable components

- **Test 23**: "should have accessible RSVP form and photo upload" (line 484)
  - **Issue**: RSVP form and photo upload missing accessibility attributes
  - **Fix**: Add aria-labels, aria-describedby to form elements

### 3. Responsive Design (6 failures)
- **Test 24**: "should be responsive across admin pages" (line 538)
  - **Issue**: Admin pages not responsive at mobile viewports
  - **Fix**: Add responsive classes, test at 375px, 768px, 1024px

- **Test 25**: "should have adequate touch targets on mobile" (line 575)
  - **Issue**: Touch targets < 44x44px on mobile
  - **Fix**: Ensure all interactive elements meet minimum size

- **Test 26**: "should be responsive across guest pages" (line 557)
  - **Issue**: Guest pages not responsive
  - **Fix**: Add responsive classes to guest portal

- **Test 27**: "should support mobile navigation with swipe gestures" (line 622)
  - **Issue**: Mobile navigation doesn't support swipe
  - **Fix**: Add swipe gesture support or skip test if not required

- **Test 28**: "should support 200% zoom on admin and guest pages" (line 638)
  - **Issue**: Pages break at 200% zoom
  - **Fix**: Use relative units (rem/em), test zoom levels

- **Test 29**: "should render correctly across browsers without layout issues" (line 684)
  - **Issue**: Cross-browser layout issues
  - **Fix**: Test CSS compatibility, add vendor prefixes if needed

### 4. Data Table Accessibility (6 failures)
All related to URL state management in DataTable component:

- **Test 34**: "should update URL with search parameter after debounce" (line 801)
- **Test 35**: "should restore search state from URL on page load" (line 813)
- **Test 36**: "should update URL when filter is applied and remove when cleared" (line 821)
- **Test 37**: "should restore filter state from URL on mount" (line 846)
- **Test 38**: "should display and remove filter chips" (line 858)
- **Test 39**: "should maintain all state parameters together" (line 889)
- **Test 40**: "should restore all state parameters on page load" (line 918)

**Root Cause**: DataTable component not syncing state with URL parameters
**Fix**: Implement URL state management in DataTable component

### 5. Content Management (1 failure)
- **Test 42**: "should validate required fields and handle slug conflicts" (line 112)
  - **Issue**: Form validation not working or slug conflict detection failing
  - **Fix**: Check ContentPageForm validation logic

## Fix Priority

### Priority 1: Data Table URL State (Affects 7 tests)
1. Read DataTable component implementation
2. Add URL state management hooks
3. Implement search, filter, sort URL sync
4. Add state restoration on mount

### Priority 2: Responsive Design (Affects 6 tests)
1. Audit admin and guest pages for responsive classes
2. Add mobile-first responsive utilities
3. Ensure touch targets meet 44x44px minimum
4. Test zoom levels up to 200%

### Priority 3: Screen Reader Compatibility (Affects 4 tests)
1. Add semantic HTML landmarks (main, nav, header)
2. Add ARIA attributes to expandable elements
3. Add accessibility attributes to forms
4. Test with screen reader

### Priority 4: Keyboard Navigation (Affects 1 test)
1. Ensure all interactive elements are keyboard accessible
2. Add proper focus management
3. Test tab order

### Priority 5: Content Management (Affects 1 test)
1. Fix form validation
2. Test slug conflict handling

## Implementation Plan

1. **Phase 1**: Fix DataTable URL state management (highest impact)
2. **Phase 2**: Fix responsive design issues
3. **Phase 3**: Add missing ARIA attributes and semantic HTML
4. **Phase 4**: Fix keyboard navigation
5. **Phase 5**: Fix content management validation
6. **Phase 6**: Run full E2E suite and verify all fixes

## Expected Outcome
All 17 failing tests should pass after implementing these fixes.
