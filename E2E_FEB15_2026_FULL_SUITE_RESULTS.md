# E2E Test Suite - Full Run Results (Feb 15, 2026)

## Test Execution Complete ✅

**Date:** February 15, 2026  
**Duration:** 2.1 hours  
**Configuration:** Sequential execution (workers: 1)

## Final Results

```
✅ 217 tests passed
❌ 104 tests failed
⚠️  8 tests flaky
⏭️  14 tests skipped
⏸️  19 tests did not run

Total: 362 tests
Pass Rate: 59.9%
```

## Sequential Execution Verification ✅

### Configuration Status
The test suite is correctly configured for **sequential execution**:

**File:** `playwright.config.ts`
```typescript
workers: 1,  // Sequential execution to avoid parallel resource contention
```

**Reason (from comments):**
> When running all 8 reference block tests in parallel (4 workers), the server and database
> cannot handle the concurrent load, causing timing issues and test failures.
> Sequential execution ensures reliable test results at the cost of longer execution time.

### Test File Configuration
- ✅ Section management tests: No per-file serial configuration needed (global workers: 1)
- ✅ Reference blocks tests: No per-file serial configuration needed (global workers: 1)
- ✅ All tests run sequentially by default

**Note:** Individual test files do NOT need `test.describe.configure({ mode: 'serial' })` because the global `workers: 1` setting already enforces sequential execution across ALL tests.

## Failure Analysis

### High-Priority Failures (Need Investigation)

#### 1. Guest Authentication Issues (Multiple Tests)
- Email matching authentication failures
- Magic link verification issues
- Session cookie creation problems
- Logout flow failures
- Authentication persistence issues

**Example Error:**
```
Error: Authentication failed - still on login page
```

**Affected Tests:**
- `should successfully authenticate with email matching`
- `should create session cookie on successful authentication`
- `should successfully request and verify magic link`
- `should show error for already used magic link`
- `should complete logout flow`
- `should persist authentication across page refreshes`
- `should log authentication events in audit log`

#### 2. Form Submission & Validation (Multiple Tests)
- Guest form submission failures
- Event form rendering issues
- Activity form submission problems
- Network error handling
- Server validation error handling
- Form state preservation

**Affected Tests:**
- `should submit valid guest form successfully`
- `should show validation errors for missing required fields`
- `should validate email format`
- `should show loading state during submission`
- `should render event form with all required fields`
- `should submit valid activity form successfully`
- `should handle network errors gracefully`
- `should handle validation errors from server`
- `should clear form after successful submission`
- `should preserve form data on validation error`

#### 3. Section Management Issues
- Section creation with rich text
- Section editor access across entity types
- Cross-entity UI consistency
- Entity-specific features
- Reference validation
- Loading states during save
- Error handling

**Affected Tests:**
- `should create new section with rich text content`
- `should access section editor from all entity types`
- `should maintain consistent UI across entity types`
- `should handle entity-specific section features`
- `should validate references in sections`
- `should handle loading states during save operations`
- `should handle errors during section operations`

#### 4. Reference Blocks Management
- Event reference block creation
- Activity reference block creation
- Multiple reference types in one section
- Reference removal
- Reference filtering by type
- Circular reference prevention
- Broken reference detection
- Guest view display with preview modals

**Affected Tests:**
- `should create event reference block`
- `should create activity reference block`
- `should create multiple reference types in one section`
- `should remove reference from section`
- `should filter references by type in picker`
- `should prevent circular references`
- `should detect broken references`
- `should display reference blocks in guest view with preview modals`

#### 5. Email Management
- Recipient selection by group
- Email scheduling for future delivery
- Draft saving
- Email history display
- Accessibility (ARIA labels)

**Affected Tests:**
- `should select recipients by group`
- `should schedule email for future delivery`
- `should save email as draft`
- `should show email history after sending`
- `should have accessible form elements with ARIA labels`

#### 6. RSVP Management
- CSV export (all RSVPs)
- CSV export (filtered RSVPs)
- Rate limiting on export
- API error handling
- Activity RSVP submission with dietary restrictions
- RSVP updates
- Capacity constraint enforcement
- RSVP status cycling
- Guest count validation

**Affected Tests:**
- `should export RSVPs to CSV`
- `should export filtered RSVPs to CSV`
- `should handle rate limiting on export`
- `should handle API errors gracefully`
- `should submit RSVP for activity with dietary restrictions`
- `should update existing RSVP`
- `should enforce capacity constraints`
- `should cycle through RSVP statuses`
- `should validate guest count is positive`

#### 7. Guest Groups Management
- Group creation and immediate use
- Group updates and deletion
- Multiple groups in dropdown
- Validation errors and form states
- Network error handling and duplicate prevention
- Dropdown reactivity after group creation
- Async params and state across navigation
- Loading and error states in dropdown
- Accessibility attributes

**Affected Tests:**
- `should create group and immediately use it for guest creation`
- `should update and delete groups with proper handling`
- `should handle multiple groups in dropdown correctly`
- `should show validation errors and handle form states`
- `should handle network errors and prevent duplicates`
- `should update dropdown immediately after creating new group`
- `should handle async params and maintain state across navigation`
- `should handle loading and error states in dropdown`
- `should have proper accessibility attributes`

#### 8. Guest Views
- Event page display
- Preview link in admin sidebar
- Guest portal opening in new tab
- Guest view vs admin view
- Admin session preservation
- Preview from any admin page

**Affected Tests:**
- `should display event page with header and details`
- `should have preview link in admin sidebar`
- `should open guest portal in new tab when clicked`
- `should show guest view in preview (not admin view)`
- `should not affect admin session when preview is opened`
- `should work from any admin page`

#### 9. Data Management
- CSV import with summary
- CSV validation and special characters
- Location hierarchy creation
- Circular reference prevention
- Tree expand/collapse and search
- Location deletion and validation

**Affected Tests:**
- `should import guests from CSV and display summary`
- `should validate CSV format and handle special characters`
- `should create hierarchical location structure`
- `should prevent circular reference in location hierarchy`
- `should expand/collapse tree and search locations`
- `should delete location and validate required fields`

#### 10. Navigation Issues
- Sub-item navigation
- Sticky navigation with glassmorphism
- Keyboard navigation
- Browser back/forward navigation
- Mobile menu open/close
- Tab expansion in mobile menu
- Navigation state persistence
- Mobile menu state persistence

**Affected Tests:**
- `should navigate to sub-items and load pages correctly`
- `should have sticky navigation with glassmorphism effect`
- `should support keyboard navigation`
- `should handle browser back navigation`
- `should handle browser forward navigation`
- `should open and close mobile menu`
- `should expand tabs and navigate in mobile menu`
- `should persist navigation state across page refreshes`
- `should persist state in mobile menu`

#### 11. Admin Dashboard
- Dashboard loading
- Tailwind CSS styling
- Navigation links
- Interactive element styling
- API data loading

**Affected Tests:**
- `should load admin dashboard without errors`
- `should have Tailwind CSS styling applied`
- `should have navigation links`
- `should have interactive elements styled correctly`
- `should load dashboard data from APIs`

#### 12. System & Infrastructure
- Environment variable loading
- Locations page loading
- Event routing (404 for non-existent slugs)
- Unique slug generation
- Tailwind utility classes
- Borders, shadows, responsive classes
- Viewport consistency
- Photos page B2 storage
- Button and navigation styling
- Form input and card styling
- Responsive design across guest pages

**Affected Tests:**
- `should load environment variables from .env.e2e`
- `Locations page should load without errors`
- `should show 404 for non-existent event slug`
- `should generate unique slugs for events with same name`
- `should apply Tailwind utility classes correctly`
- `should apply borders, shadows, and responsive classes`
- `should render consistently across viewport sizes`
- `should load photos page without B2 storage errors`
- `should have styled buttons and navigation`
- `should have styled form inputs and cards`
- `should be responsive across guest pages`

#### 13. User Management
- Keyboard navigation and accessibility labels

**Affected Tests:**
- `should have proper keyboard navigation and labels`

#### 14. Debug Tests (Should be removed or fixed)
- `debug form submission`
- `debug form validation errors`
- `debug toast selector`
- `debug validation errors`
- `DEBUG: Understand guest creation workflow`
- `DEBUG: Check form state and reactivity`

### Flaky Tests (8 tests - Need Stabilization)

1. **Inline Section Editor**
   - `should toggle inline section editor and add sections`

2. **Email Management**
   - `should save email as draft`
   - `should show email history after sending`
   - `should have accessible form elements with ARIA labels`

3. **Section Management**
   - `should save all sections and show preview`

4. **Guest Authentication**
   - `should show error for invalid or missing token`
   - `should log authentication events in audit log`

5. **System Routing**
   - `should show 404 for non-existent event slug`

## Pattern Analysis

### Common Failure Patterns

1. **Authentication Flow Issues**
   - Tests fail at login/authentication step
   - Session cookies not being created properly
   - Magic link verification failing

2. **Form Submission Failures**
   - Forms not submitting successfully
   - Validation errors not displaying
   - Loading states not working

3. **UI Component Issues**
   - Section editors not appearing
   - Reference pickers not working
   - Dropdowns not updating

4. **Data Loading Issues**
   - API calls failing
   - Data not loading in components
   - State not updating after operations

5. **Navigation Issues**
   - Routes not loading
   - 404 errors for valid routes
   - Navigation state not persisting

## Next Steps

### Immediate Actions

1. **Fix Guest Authentication** (Highest Priority)
   - Investigate why authentication is failing
   - Check session cookie creation
   - Verify magic link flow
   - Test logout functionality

2. **Fix Form Submissions**
   - Debug form submission failures
   - Check validation error display
   - Verify loading states
   - Test network error handling

3. **Stabilize Flaky Tests**
   - Add proper wait conditions
   - Improve selectors
   - Add retry logic where appropriate
   - Fix timing issues

4. **Remove Debug Tests**
   - Delete or fix debug test files
   - Clean up test suite

### Investigation Required

1. **Section Management**
   - Why are section editors not appearing?
   - Are there timing issues with React state updates?
   - Do we need better wait conditions?

2. **Reference Blocks**
   - Why are reference operations failing?
   - Are there API issues?
   - Do we need better error handling?

3. **Email Management**
   - Why is recipient selection failing?
   - Are there issues with the email composer?
   - Do we need to fix the email API?

4. **RSVP Management**
   - Why are CSV exports failing?
   - Are there rate limiting issues?
   - Do we need to fix the RSVP API?

## Configuration Verification ✅

### Sequential Execution
- ✅ Global workers set to 1
- ✅ All tests run sequentially
- ✅ No parallel execution issues
- ✅ No need for per-file serial configuration

### Test Infrastructure
- ✅ Global setup/teardown configured
- ✅ Authentication state persisted
- ✅ Environment variables loaded
- ✅ Web server configured
- ✅ Reporters configured

## Recommendations

1. **Focus on Authentication First**
   - This is blocking many other tests
   - Fix will likely improve pass rate significantly

2. **Fix Form Submissions**
   - Many tests depend on forms working
   - Critical for user workflows

3. **Stabilize Flaky Tests**
   - These are close to passing
   - Small fixes could make them reliable

4. **Clean Up Debug Tests**
   - Remove or fix debug tests
   - Keep test suite clean

5. **Investigate Systematic Issues**
   - Look for common root causes
   - Fix infrastructure issues first
   - Then tackle individual test failures

## Success Metrics

- **Current Pass Rate:** 59.9%
- **Target Pass Rate:** 95%+
- **Tests to Fix:** ~100 tests
- **Flaky Tests to Stabilize:** 8 tests

## Timeline Estimate

- **Authentication Fixes:** 2-4 hours
- **Form Submission Fixes:** 2-3 hours
- **Flaky Test Stabilization:** 1-2 hours
- **Individual Test Fixes:** 8-12 hours
- **Total Estimated Time:** 13-21 hours

## Conclusion

The test suite is correctly configured for sequential execution with `workers: 1`. The main issues are:

1. **Guest authentication failures** - blocking many tests
2. **Form submission issues** - affecting user workflows
3. **UI component problems** - section editors, reference pickers
4. **Flaky tests** - need stabilization

The sequential execution is working as intended. The failures are due to actual bugs or test implementation issues, not parallel execution problems.

**Next Session:** Focus on fixing guest authentication first, as this is the highest priority and will likely improve the pass rate significantly.
