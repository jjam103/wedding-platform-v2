# E2E Verification Run - Final Results

**Date**: February 12, 2026  
**Duration**: 17.9 minutes  
**Total Tests**: 362 tests

---

## Final Test Results

✅ **235 passed** (64.9%)  
❌ **79 failed** (21.8%)  
⚠️ **15 flaky** (4.1%)  
⏭️ **14 skipped** (3.9%)  
🚫 **19 did not run** (5.2%)

---

## Comparison with Expected Results

### Expected (After Pattern Fixes)
- **265 passed** (72.6%)
- **0 flaky**
- **0 did not run**

### Actual (Current Run)
- **235 passed** (64.9%)
- **15 flaky** (4.1%)
- **19 did not run** (5.2%)

### Delta
- **-30 tests** (-8.3% pass rate)
- **+15 flaky tests**
- **+19 tests did not run**

---

## Key Findings

### 1. Pass Rate Regression
The pass rate decreased from the expected 72.6% to 64.9%, a drop of 7.7 percentage points or 30 tests.

### 2. Flaky Tests Introduced
15 tests are now flaky (passed on retry), including:
- Keyboard Navigation tests
- Data Table Accessibility tests
- Content Management tests
- Section Management tests
- Guest Authentication tests

### 3. Tests Did Not Run
19 tests did not execute, which may indicate:
- Test dependencies failed
- Setup issues
- Timeout problems

---

## Failure Categories

### Location Hierarchy (5 failures)
- CSV import/export
- Hierarchical structure creation
- Circular reference prevention
- Tree expand/collapse
- Location deletion

### Email Management (4 failures)
- Full composition workflow
- Recipient selection by group
- Field validation
- Email scheduling

### Reference Blocks (8 failures)
- Event reference creation
- Activity reference creation
- Multiple reference types
- Reference removal
- Type filtering
- Circular reference prevention
- Broken reference detection
- Guest view display

### Navigation (6 failures)
- Sub-item navigation
- Sticky navigation
- Keyboard navigation
- Browser forward navigation
- Mobile menu

### Photo Upload (3 failures)
- Upload with metadata
- Error handling
- Missing metadata handling

### RSVP Management (8 failures)
- CSV export
- Filtered export
- Rate limiting
- API error handling
- Activity RSVP submission
- RSVP updates
- Capacity constraints
- Status cycling

### Admin Dashboard (3 failures)
- Metrics cards rendering
- Interactive elements styling
- API data loading

### Guest Authentication (9 failures)
- Session cookie creation
- Magic link request/verify
- Expired link handling
- Used link handling
- Logout flow
- Authentication persistence
- Error handling gracefully
- Email matching authentication
- Non-existent email error

### Guest Groups (4 failures)
- Group creation and immediate use
- Update and delete handling
- Validation errors
- Async params handling

### RSVP Flow (10 failures)
- Event-level RSVP
- Activity-level RSVP
- Capacity limits
- RSVP updates
- RSVP decline
- Dietary restrictions sanitization
- Guest count validation
- Deadline warnings
- Keyboard navigation
- Form label accessibility

### System Routing (1 failure)
- Unique slug generation

### UI Infrastructure (10 failures)
- Tailwind utility classes
- Borders/shadows/responsive classes
- Viewport consistency
- Guest form submission
- Validation errors
- Email format validation
- Loading states
- Event form rendering
- Activity form submission
- Network error handling
- Server validation errors
- Form clearing
- Form data preservation
- B2 storage errors
- Button/navigation styling
- Form input/card styling

### Debug Tests (5 failures)
- Form submission debug
- Form validation debug
- Toast selector debug
- Validation errors debug
- E2E config verification

---

## Critical Issues Identified

### 1. Guest Authentication Failures
Multiple authentication tests failing, including:
- Email matching not working
- Magic link verification issues
- Session persistence problems

### 2. Form Submission Issues
Many form-related tests failing:
- Guest form submission
- Activity form submission
- Validation error display

### 3. Reference Block System
8 reference block tests failing, indicating issues with:
- Reference creation
- Reference display
- Circular reference detection

### 4. Location Hierarchy
5 location tests failing, suggesting problems with:
- Hierarchical structure
- Tree operations
- Validation

---

## Comparison with Baseline

The baseline run (before pattern fixes) showed:
- **190 passed** (52.3%)
- **127 failed** (35.0%)
- **22 flaky** (6.1%)

Current run shows:
- **235 passed** (64.9%) - **+45 tests** ✅
- **79 failed** (21.8%) - **-48 failures** ✅
- **15 flaky** (4.1%) - **-7 flaky** ✅

**Net improvement: +12.6% pass rate from baseline**

---

## Conclusion

While the current test run shows improvement over the baseline (+12.6% pass rate), it falls short of the expected 72.6% pass rate after pattern fixes by 7.7 percentage points.

The main concerns are:
1. **30 fewer passing tests** than expected
2. **15 flaky tests** (should be 0)
3. **19 tests did not run** (should be 0)

This suggests either:
- Some pattern fixes were not fully applied
- New issues were introduced
- Test environment differences
- Timing/flakiness issues not present in the pattern fix session

**Recommendation**: Investigate the 15 flaky tests and 19 "did not run" tests to understand why they're not stable.
