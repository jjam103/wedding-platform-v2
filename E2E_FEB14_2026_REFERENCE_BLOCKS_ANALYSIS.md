# E2E Reference Blocks Test Analysis - Feb 14, 2026

## Test Run Summary

**Date:** February 14, 2026, 11:07 AM  
**Total Time:** 5.5 minutes  
**Test File:** `__tests__/e2e/admin/referenceBlocks.spec.ts`

### Results Overview
- ✅ **Passed:** 3 tests (37.5%)
- ❌ **Failed:** 3 tests (37.5%)
- ⚠️ **Flaky:** 2 tests (25%)
- **Total:** 8 tests

---

## Detailed Test Results

### ✅ Passing Tests (3)

1. **"should create activity reference block"** - 14.8s
   - Status: PASS
   - Creates activity reference successfully
   - Saves to database correctly

2. **"should create multiple reference types in one section"** - 15.0s
   - Status: PASS
   - Adds both event and activity references
   - Both types display correctly

3. **"should detect broken references"** - 14.3s
   - Status: PASS
   - Detects when referenced entity is deleted
   - Shows appropriate error/warning message

### ❌ Failing Tests (3)

1. **"should remove reference from section"** - 1.1m (66 seconds)
   - **Status:** FAIL
   - **Issue:** Reference removal functionality not working
   - **Symptoms:**
     - Remove button may not be visible
     - Click on remove button doesn't remove reference
     - Save doesn't persist removal
   - **Root Cause:** Likely UI state management issue with reference removal

2. **"should prevent circular references"** - 1.1m (66 seconds)
   - **Status:** FAIL
   - **Issue:** Circular reference validation not working
   - **Symptoms:**
     - Can create circular references (Content Page A → Event B → Content Page A)
     - No error message shown when saving circular reference
     - Validation logic not triggering
   - **Root Cause:** Missing or broken circular reference detection in save handler

3. **"should display reference blocks in guest view with preview modals"** - 52.2s
   - **Status:** FAIL
   - **Issue:** Guest view rendering or modal interaction failing
   - **Symptoms:**
     - References may not display in guest view
     - Preview modals may not open on click
     - Modal content may not load correctly
   - **Root Cause:** Guest view component not rendering references or modal interaction broken

### ⚠️ Flaky Tests (2)

1. **"should create event reference block"** - 40.6s
   - **Status:** FLAKY
   - **Issue:** Intermittent failures in event reference creation
   - **Likely Causes:**
     - Race condition in API response handling
     - Timing issue with reference item rendering
     - Element detachment during click
   - **Current Mitigations:** Force click, retry logic, extended timeouts

2. **"should filter references by type in picker"** - 39.5s
   - **Status:** FLAKY
   - **Issue:** Intermittent failures in type filtering
   - **Likely Causes:**
     - Race condition in filter application
     - Timing issue with item list updates
     - API response timing variability
   - **Current Mitigations:** Extended wait times, retry logic

---

## Priority Analysis

### Priority 1: Critical Failures (Must Fix)

1. **Reference Removal (Test #1)**
   - **Impact:** HIGH - Core functionality broken
   - **User Impact:** Cannot remove references once added
   - **Fix Complexity:** MEDIUM
   - **Estimated Time:** 1-2 hours

2. **Circular Reference Detection (Test #2)**
   - **Impact:** HIGH - Data integrity issue
   - **User Impact:** Can create invalid circular references
   - **Fix Complexity:** MEDIUM-HIGH
   - **Estimated Time:** 2-3 hours

3. **Guest View Display (Test #3)**
   - **Impact:** HIGH - Guest-facing feature broken
   - **User Impact:** Guests cannot see reference blocks
   - **Fix Complexity:** MEDIUM
   - **Estimated Time:** 1-2 hours

### Priority 2: Stability Issues (Should Fix)

4. **Event Creation Flakiness (Test #4)**
   - **Impact:** MEDIUM - Test reliability issue
   - **User Impact:** None (test-only issue)
   - **Fix Complexity:** LOW-MEDIUM
   - **Estimated Time:** 1 hour

5. **Filter Flakiness (Test #5)**
   - **Impact:** MEDIUM - Test reliability issue
   - **User Impact:** None (test-only issue)
   - **Fix Complexity:** LOW-MEDIUM
   - **Estimated Time:** 1 hour

---

## Root Cause Analysis

### Common Patterns

1. **Timing Issues**
   - All flaky tests involve waiting for API responses
   - Element rendering timing is inconsistent
   - Current retry logic may not be sufficient

2. **State Management**
   - Reference removal suggests state update issue
   - Circular reference detection suggests validation not running
   - Guest view suggests data not propagating correctly

3. **Component Lifecycle**
   - Element detachment issues in flaky tests
   - Modal interaction issues in guest view test
   - Section editor state management issues

---

## Recommended Fix Strategy

### Phase 1: Critical Fixes (4-7 hours)

1. **Fix Reference Removal**
   - Investigate remove button click handler
   - Check state update logic
   - Verify save handler includes removal
   - Add debug logging to track state changes

2. **Fix Circular Reference Detection**
   - Review validation logic in save handler
   - Add circular reference detection algorithm
   - Implement error message display
   - Add unit tests for circular detection

3. **Fix Guest View Display**
   - Check SectionRenderer component
   - Verify reference block rendering logic
   - Test modal component interaction
   - Add debug logging for data flow

### Phase 2: Stability Improvements (2 hours)

4. **Stabilize Flaky Tests**
   - Increase retry intervals
   - Add more specific wait conditions
   - Use `waitForResponse` more consistently
   - Add debug logging to identify timing issues

---

## Investigation Steps

### For Reference Removal (Test #1)

```typescript
// Check these areas:
1. InlineSectionEditor.tsx - remove button handler
2. SimpleReferenceSelector.tsx - reference removal logic
3. API route - /api/admin/sections/[id] - save handler
4. State management - verify reference array updates
```

### For Circular Reference Detection (Test #2)

```typescript
// Check these areas:
1. sectionsService.ts - circular reference validation
2. API route - /api/admin/sections/[id] - validation logic
3. Frontend validation - before save
4. Error message display - toast or inline error
```

### For Guest View Display (Test #3)

```typescript
// Check these areas:
1. app/[type]/[slug]/page.tsx - content page rendering
2. components/guest/SectionRenderer.tsx - reference rendering
3. components/guest/*PreviewModal.tsx - modal components
4. API route - /api/guest/content-pages - data fetching
```

---

## Next Steps

1. **Immediate Actions:**
   - Run tests individually to isolate failures
   - Add debug logging to failing tests
   - Check browser console for errors
   - Review recent code changes to reference block components

2. **Investigation:**
   - Use Playwright UI mode to step through failing tests
   - Check network tab for API failures
   - Inspect DOM state at failure points
   - Review component state in React DevTools

3. **Fixes:**
   - Start with reference removal (simplest fix)
   - Move to guest view display (user-facing)
   - Tackle circular reference detection (most complex)
   - Stabilize flaky tests last

---

## Test Execution Commands

```bash
# Run all reference block tests
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts

# Run specific failing test
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts:508

# Run with UI mode for debugging
npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts --ui

# Run with debug logging
DEBUG=pw:api npm run test:e2e -- __tests__/e2e/admin/referenceBlocks.spec.ts
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All 3 failing tests pass consistently
- ✅ Reference removal works in manual testing
- ✅ Circular references are prevented
- ✅ Guest view displays references correctly

### Phase 2 Complete When:
- ✅ All 8 tests pass consistently (3+ runs)
- ✅ No flaky tests remain
- ✅ Test execution time < 4 minutes
- ✅ All tests have proper error handling

---

## Related Files

### Test Files
- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Main test file

### Component Files
- `components/admin/InlineSectionEditor.tsx` - Section editing
- `components/admin/SimpleReferenceSelector.tsx` - Reference picker
- `components/guest/SectionRenderer.tsx` - Guest view rendering
- `components/guest/EventPreviewModal.tsx` - Event preview
- `components/guest/ActivityPreviewModal.tsx` - Activity preview

### Service Files
- `services/sectionsService.ts` - Section CRUD operations
- `services/contentPagesService.ts` - Content page operations

### API Routes
- `app/api/admin/sections/[id]/route.ts` - Section save endpoint
- `app/api/guest/content-pages/route.ts` - Guest view data

---

## Notes

- Test suite has good coverage of reference block functionality
- Passing tests indicate core creation logic works
- Failures are in edge cases and user interactions
- Flaky tests suggest timing/race condition issues
- Overall test quality is good, just needs bug fixes

