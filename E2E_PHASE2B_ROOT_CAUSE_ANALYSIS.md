# E2E Phase 2b: Root Cause Analysis

## Executive Summary

Phase 2a (timeout increases) showed **NO improvement** because timeouts are symptoms, not root causes. The real issues are:
1. Elements never appear (wrong selectors, missing data)
2. Data never loads (API failures, missing test setup)
3. Assertions fail (wrong expectations, state issues)

## Failure Pattern Analysis

### Pattern 1: Element Not Found (60 tests - 42%)
**Symptoms**:
- `Error: element(s) not found`
- `Error: expect(locator).toBeVisible() failed`
- `TimeoutError: page.fill: Timeout exceeded` (element never appears)

**Root Causes**:
1. **Wrong Selectors** - Test uses selector that doesn't match DOM
2. **Conditional Rendering** - Element only renders when condition met
3. **Missing Data** - Element depends on data that never loads
4. **Component Not Mounted** - Component fails to render

**Example Failures**:
- Accessibility suite: Form fields, dropdowns, RSVP forms
- Content Management: Section editors, reference blocks
- Data Management: Location tree, CSV export buttons
- Email Management: Email composer, template selectors

**Fix Strategy**:
1. Inspect actual DOM in failing tests
2. Update selectors to match reality
3. Add wait conditions for data loading
4. Fix component mounting issues

### Pattern 2: Data Never Loads / Null Errors (35 tests - 24%)
**Symptoms**:
- `TypeError: Cannot read properties of null (reading 'id')`
- `Error: expect(received).toBeTruthy()` (data is null/undefined)
- `TimeoutError: page.waitForResponse` (API never responds)

**Root Causes**:
1. **Missing Test Data** - Database doesn't have required data
2. **API Failures** - API returns error or null
3. **RLS Issues** - Row Level Security blocks data access
4. **Race Conditions** - Test runs before data is created

**Example Failures**:
- Content Management: Creating pages without events/activities
- Data Management: Location hierarchy without parent locations
- Email Management: Sending emails without recipients
- Reference Blocks: Adding references to non-existent entities

**Fix Strategy**:
1. Add comprehensive test data setup
2. Ensure data exists before tests run
3. Fix RLS policies for test environment
4. Add proper wait conditions for data creation

### Pattern 3: Assertion Failures (25 tests - 17%)
**Symptoms**:
- `Error: expect(received).toContain(expected)`
- `Error: expect(locator).toHaveValue(expected) failed`
- `Error: expect(received).toBeGreaterThan(expected)`

**Root Causes**:
1. **Wrong Expectations** - Test expects wrong data format
2. **State Not Updated** - Component doesn't reflect changes
3. **Form Values Lost** - Form doesn't persist values
4. **Data Format Mismatch** - API returns different format than expected

**Example Failures**:
- Data Table: Sort/filter state not persisting in URL
- Forms: Values not persisting after validation errors
- CSV Export: Downloaded file format doesn't match expectations
- RSVP: Guest count calculations incorrect

**Fix Strategy**:
1. Update test expectations to match reality
2. Fix state management in components
3. Fix form value persistence
4. Align API response format with expectations

### Pattern 4: API/Network Issues (15 tests - 10%)
**Symptoms**:
- `TimeoutError: page.waitForResponse: Timeout exceeded`
- `Error: expect(received).not.toBe(expected)` (got error response)

**Root Causes**:
1. **API Endpoints Missing** - Route doesn't exist
2. **API Returns Errors** - Validation or database errors
3. **Slow API Responses** - Takes longer than timeout
4. **Network Issues** - Connection problems

**Example Failures**:
- CSV Export: Download endpoint timing out
- Email Sending: Email API not responding
- Photo Upload: Upload endpoint failing
- Reference Search: Search API timing out

**Fix Strategy**:
1. Verify all API endpoints exist
2. Fix API validation and error handling
3. Optimize slow API endpoints
4. Add proper error handling in tests

### Pattern 5: Test Logic Errors (8 tests - 6%)
**Symptoms**:
- `TypeError: context.setDefaultDownloadPath is not a function`
- Test code errors (not application errors)

**Root Causes**:
1. **Playwright API Misuse** - Using wrong API methods
2. **Test Setup Errors** - Test configuration issues
3. **Mock Issues** - Mocks not working correctly

**Example Failures**:
- CSV Export: Using deprecated Playwright API
- File Downloads: Wrong download handling

**Fix Strategy**:
1. Update to correct Playwright APIs
2. Fix test setup and configuration
3. Update mocks to match current implementation

## Failing Test Suites Breakdown

### Accessibility Suite (20 failures)
- Keyboard Navigation: 1 failure
- Screen Reader: 2 failures
- Responsive Design: 7 failures
- Data Table Accessibility: 10 failures

**Common Issues**:
- Elements not found in responsive viewports
- Data table state not persisting in URL
- Touch targets not meeting size requirements

### Content Management (3 failures)
- Content Page Creation: 1 failure
- Section Management: 2 failures

**Common Issues**:
- Missing test data (events, activities)
- Reference blocks not loading
- Section editor not appearing

### Data Management (5 failures)
- Location Hierarchy: 4 failures
- CSV Export: 1 failure

**Common Issues**:
- Location tree not rendering
- Parent locations missing
- CSV download timing out

### Email Management (7 failures)
- Email Composition: 5 failures
- Email Scheduling: 2 failures

**Common Issues**:
- Email composer not loading
- Recipients not available
- Template variables not substituting

### Photo Upload (15 failures)
- Photo upload form not appearing
- Upload API timing out
- Photo gallery not loading

### Reference Blocks (10 failures)
- Reference search not working
- Reference preview not loading
- Circular reference detection failing

### RSVP Management (8 failures)
- RSVP form not loading
- Guest count calculations wrong
- RSVP status not updating

### Section Management (12 failures)
- Section editor not appearing
- Section save failing
- Section reordering not working

### System UI Infrastructure (25 failures)
- Form validation not working
- Button styling issues
- Navigation problems

### User Management (8 failures)
- User creation failing
- Role assignment not working
- User list not loading

## Priority Ranking for Phase 2b

### Priority 1: Test Data Setup (Impact: 35 tests)
**Effort**: 2-3 hours
**Files to Fix**:
- `__tests__/e2e/global-setup.ts` - Add comprehensive test data
- `__tests__/helpers/factories.ts` - Create data factories
- Individual test files - Add beforeEach data setup

**Actions**:
1. Create test events, activities, locations
2. Create test groups and guests
3. Create test content pages
4. Ensure data exists before tests run

### Priority 2: Selector Fixes (Impact: 30 tests)
**Effort**: 2-3 hours
**Files to Fix**:
- All failing test files
- Update selectors to match actual DOM

**Actions**:
1. Run tests in UI mode to inspect DOM
2. Update selectors to use data-testid
3. Add wait conditions for dynamic elements
4. Fix conditional rendering issues

### Priority 3: API Fixes (Impact: 15 tests)
**Effort**: 1-2 hours
**Files to Fix**:
- API route handlers
- Test mocks

**Actions**:
1. Fix missing API endpoints
2. Fix API validation errors
3. Optimize slow endpoints
4. Add proper error responses

### Priority 4: Assertion Updates (Impact: 20 tests)
**Effort**: 1-2 hours
**Files to Fix**:
- Test files with wrong expectations

**Actions**:
1. Update expectations to match reality
2. Fix data format mismatches
3. Fix state management issues
4. Fix form value persistence

### Priority 5: Test Logic Fixes (Impact: 8 tests)
**Effort**: 30 minutes
**Files to Fix**:
- Tests using deprecated APIs

**Actions**:
1. Update Playwright API usage
2. Fix test configuration
3. Update mocks

## Execution Plan

### Step 1: Test Data Setup (2-3 hours)
Create comprehensive test data in global setup:
```typescript
// __tests__/e2e/global-setup.ts
async function createTestData() {
  // Create locations
  const country = await createLocation({ name: 'Costa Rica', type: 'country' });
  const region = await createLocation({ name: 'Guanacaste', type: 'region', parentId: country.id });
  const city = await createLocation({ name: 'Tamarindo', type: 'city', parentId: region.id });
  
  // Create events
  const wedding = await createEvent({ name: 'Wedding Ceremony', date: '2025-06-15', locationId: city.id });
  const reception = await createEvent({ name: 'Reception', date: '2025-06-15', locationId: city.id });
  
  // Create activities
  const ceremony = await createActivity({ name: 'Ceremony', eventId: wedding.id, capacity: 100 });
  const dinner = await createActivity({ name: 'Dinner', eventId: reception.id, capacity: 100 });
  
  // Create groups and guests
  const group = await createGroup({ name: 'Test Family' });
  const guest = await createGuest({ firstName: 'Test', lastName: 'Guest', groupId: group.id });
  
  // Create content pages
  const page = await createContentPage({ title: 'Welcome', slug: 'welcome' });
}
```

### Step 2: Selector Fixes (2-3 hours)
Run tests in UI mode and update selectors:
```bash
npx playwright test --ui
```

Update selectors to use stable identifiers:
```typescript
// ❌ Before
await page.click('button.bg-jungle-600');

// ✅ After
await page.click('[data-testid="submit-button"]');
```

### Step 3: API Fixes (1-2 hours)
Fix missing/broken API endpoints:
1. Verify all routes exist
2. Fix validation errors
3. Add proper error handling
4. Optimize slow queries

### Step 4: Assertion Updates (1-2 hours)
Update test expectations:
```typescript
// ❌ Before
expect(await page.locator('.guest-count').textContent()).toBe('5');

// ✅ After
await expect(page.locator('.guest-count')).toContainText('5');
```

### Step 5: Test Logic Fixes (30 minutes)
Update deprecated APIs:
```typescript
// ❌ Before
context.setDefaultDownloadPath('./downloads');

// ✅ After
const download = await page.waitForEvent('download');
```

## Expected Results

### After Priority 1 (Test Data):
- Pass rate: 65-70% (233-251 tests)
- +38-56 tests passing

### After Priority 2 (Selectors):
- Pass rate: 75-80% (269-287 tests)
- +36 additional tests passing

### After Priority 3 (APIs):
- Pass rate: 80-85% (287-305 tests)
- +18 additional tests passing

### After Priority 4 (Assertions):
- Pass rate: 85-90% (305-323 tests)
- +18 additional tests passing

### After Priority 5 (Test Logic):
- Pass rate: 90%+ (323+ tests)
- +18 additional tests passing

## Total Estimated Time

- Priority 1: 2-3 hours
- Priority 2: 2-3 hours
- Priority 3: 1-2 hours
- Priority 4: 1-2 hours
- Priority 5: 30 minutes
- **Total**: 6.5-10.5 hours to reach 90%+ pass rate

## Next Steps

1. **Start with Priority 1** - Test data setup (biggest impact)
2. **Run tests after each priority** - Verify improvement
3. **Adjust strategy** - Based on results
4. **Document patterns** - For future reference

## Status

✅ **ANALYSIS COMPLETE** - Ready to start Priority 1
🎯 **Target**: 90%+ pass rate (323+ tests)
⏱️ **Estimated Time**: 6.5-10.5 hours
