# Why Tests Didn't Catch Manual Testing Bugs

**Date**: January 30, 2026  
**Context**: Manual testing found 8 critical bugs that 91.2% test coverage missed

## Executive Summary

Despite having 91.2% test coverage with 2,969/3,257 tests passing, manual testing revealed 8 critical bugs that prevent basic functionality. This document analyzes why our comprehensive test suite missed these bugs and provides actionable recommendations.

**Key Finding**: Our tests focused on **unit testing isolated components** but missed **integration and end-to-end workflows** that users actually experience.

---

## The Testing Pyramid We Had

```
        /\
       /  \      Unit Tests (70%)
      /____\     ✅ 689/689 service tests passing
     /      \    ✅ Component tests passing
    /________\   ✅ Property tests passing
   /          \  
  /____________\ Integration Tests (25%)
 /              \ ⚠️  Mocked services, not real workflows
/________________\
E2E Tests (5%)
❌ Missing critical user journeys
```

## The Testing Pyramid We Need

```
        /\
       /  \      Unit Tests (60%)
      /____\     ✅ Keep existing coverage
     /      \    
    /________\   Integration Tests (30%)
   /          \  ✅ Real API calls
  /____________\ ✅ Real database operations
 /              \ ✅ RLS policy testing
/________________\
E2E Tests (10%)
✅ Complete user workflows
✅ Navigation testing
✅ Form submission flows
```

---

## Bug-by-Bug Analysis

### Bug #1: Number Field Validation

**What Happened**: HTML forms return strings, schemas expected numbers

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const result = await vendorService.create({
  baseCost: 1000,  // Passed as number
  amountPaid: 500   // Passed as number
});

// ✅ What users actually do
<input type="number" name="baseCost" value="1000" />
// Returns: "1000" (string)
```

**Root Cause**: Tests bypassed HTML form layer

**Fix**: Use `z.coerce.number()` for all form fields

**Prevention**:
```typescript
// Add integration test with real form submission
test('should handle number inputs from HTML forms', async () => {
  const formData = new FormData();
  formData.append('baseCost', '1000');  // String from HTML
  
  const result = await submitVendorForm(formData);
  expect(result.success).toBe(true);
});
```

---

### Bug #2: Accommodation Status Enum Mismatch

**What Happened**: Form had 'available' option, schema expected 'draft'

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const result = await accommodationService.create({
  status: 'draft'  // Used correct enum from schema
});

// ✅ What users saw in form
<option value="available">Available</option>  // Wrong enum!
```

**Root Cause**: No contract tests validating form options match schema

**Fix**: Updated form options to match schema

**Prevention**:
```typescript
// Add contract test
test('form options must match schema enums', () => {
  const formOptions = accommodationForm.fields
    .find(f => f.name === 'status').options;
  const schemaEnum = accommodationSchema.shape.status._def.values;
  
  expect(formOptions.map(o => o.value)).toEqual(schemaEnum);
});
```

---

### Bug #3: Content Pages RLS Policy Error

**What Happened**: RLS policy checked wrong table (`auth.users` vs `users`)

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const supabase = createClient(url, SERVICE_ROLE_KEY);
// Service role bypasses RLS entirely!

const result = await supabase
  .from('content_pages')
  .insert({ title: 'Test' });
// Always succeeds because RLS is bypassed
```

**Root Cause**: Tests used service role key that bypasses RLS

**Fix**: Changed RLS policy to check correct table

**Prevention**:
```typescript
// Add RLS test with real user auth
test('hosts can create content pages', async () => {
  const hostClient = await createAuthenticatedClient({
    email: 'host@example.com',
    role: 'host'
  });
  
  const { error } = await hostClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  
  expect(error).toBeNull();
});

test('guests cannot create content pages', async () => {
  const guestClient = await createAuthenticatedClient({
    email: 'guest@example.com',
    role: 'guest'
  });
  
  const { error } = await guestClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  
  expect(error).toBeTruthy();
  expect(error.message).toContain('row-level security');
});
```

---

### Bug #4: Guest Groups Missing Feature

**What Happened**: Required field with no way to create the data

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const mockGuest = {
  firstName: 'John',
  groupId: 'mock-group-id'  // Mocked valid group
};

// ✅ What users experienced
// No UI to create groups → Can't create guests
```

**Root Cause**: No E2E test for complete user workflow

**Prevention**:
```typescript
// Add E2E test for complete workflow
test('user can create guest from scratch', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // Should be able to create group first
  await page.click('text=Add Guest Group');
  await page.fill('input[name="name"]', 'Family');
  await page.click('text=Create Group');
  
  // Then create guest
  await page.click('text=Add Guest');
  await page.selectOption('select[name="groupId"]', { label: 'Family' });
  await page.fill('input[name="firstName"]', 'John');
  await page.click('text=Create Guest');
  
  await expect(page.locator('text=John')).toBeVisible();
});
```

---

### Bug #5-6: Navigation 404 Errors

**What Happened**: Buttons link to non-existent routes

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const mockRouter = { push: jest.fn() };
fireEvent.click(screen.getByText('Manage Sections'));
expect(mockRouter.push).toHaveBeenCalledWith('/admin/events/1/sections');
// Test passes even though route doesn't exist!
```

**Root Cause**: Mocked navigation doesn't verify routes exist

**Prevention**:
```typescript
// Add route coverage test
test('all navigation links point to existing routes', async () => {
  const routes = await getAllRoutes();  // Get from Next.js
  const links = await getAllNavigationLinks();  // Get from components
  
  for (const link of links) {
    expect(routes).toContain(link.href);
  }
});

// Add E2E navigation test
test('manage sections button navigates correctly', async ({ page }) => {
  await page.goto('/admin/events');
  await page.click('text=Manage Sections');
  
  // Should not be 404
  await expect(page.locator('h1')).not.toContainText('404');
  await expect(page.locator('h1')).toContainText('Sections');
});
```

---

### Bug #7: LocationSelector Not Showing Options

**What Happened**: Component doesn't load data correctly

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const mockLocations = [{ id: '1', name: 'Test' }];
render(<LocationSelector locations={mockLocations} />);
// Component receives data directly, no loading needed

// ✅ What actually happens
<LocationSelector />  // Must fetch data itself
// Data loading fails silently
```

**Root Cause**: Component tests mock data, skip loading logic

**Prevention**:
```typescript
// Add integration test with real API
test('LocationSelector loads and displays locations', async () => {
  // Setup real locations in test database
  await testDb.from('locations').insert([
    { id: '1', name: 'Costa Rica' },
    { id: '2', name: 'Guanacaste' }
  ]);
  
  render(<LocationSelector />);
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Costa Rica')).toBeInTheDocument();
    expect(screen.getByText('Guanacaste')).toBeInTheDocument();
  });
});
```

---

### Bug #8: Error Handling Throws Instead of Toast

**What Happened**: Errors thrown to console instead of user-friendly messages

**Why Tests Missed It**:
```typescript
// ❌ What our tests did
const result = await locationService.create(invalidData);
expect(result.success).toBe(false);
expect(result.error.code).toBe('VALIDATION_ERROR');
// Test passes, but UI never checked

// ✅ What users see
// Console error, no toast message
```

**Root Cause**: Tests check error returns, not UI display

**Prevention**:
```typescript
// Add error UI test
test('shows toast on validation error', async () => {
  const mockAddToast = jest.fn();
  render(<LocationForm addToast={mockAddToast} />);
  
  // Submit invalid data
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      message: expect.stringContaining('validation')
    });
  });
});
```

---

## Test Coverage vs Test Quality

### What We Had: High Coverage, Low Quality

```
✅ 91.2% line coverage
✅ 689/689 service tests passing
✅ All critical paths tested

❌ But tests didn't match user experience
❌ Mocked too much, tested too little
❌ No integration between layers
```

### What We Need: Balanced Coverage, High Quality

```
✅ 80% line coverage (slightly lower is OK)
✅ Service tests with real database
✅ Integration tests with real APIs
✅ E2E tests for critical workflows
✅ RLS tests with real authentication
✅ Contract tests for form/schema alignment
```

---

## The Testing Gaps

### Gap #1: The Mocking Problem

**Problem**: We mocked everything
- Mocked Supabase → Missed RLS bugs
- Mocked navigation → Missed 404s
- Mocked data → Missed loading bugs
- Mocked forms → Missed validation bugs

**Solution**: Mock less, integrate more
- Use real database for integration tests
- Use real API calls for component tests
- Use real navigation for E2E tests
- Use real forms for submission tests

### Gap #2: The Unit Test Trap

**Problem**: 100% unit test coverage ≠ working application

**Example**:
```typescript
// ✅ All these pass
test('vendorService.create works', () => { ... });
test('VendorForm renders', () => { ... });
test('VendorPage displays data', () => { ... });

// ❌ But this fails
test('user can create vendor', () => {
  // Number validation fails!
});
```

**Solution**: Test the integration, not just the units

### Gap #3: The Happy Path Bias

**Problem**: Tests only checked success cases

**What we tested**:
- ✅ Valid data succeeds
- ✅ Service returns success
- ✅ Component renders data

**What we didn't test**:
- ❌ Invalid data shows error toast
- ❌ Missing data shows empty state
- ❌ Loading state displays correctly
- ❌ Error state recovers gracefully

**Solution**: Test error paths as thoroughly as success paths

### Gap #4: The Missing E2E Layer

**Problem**: No tests for complete user journeys

**What we had**:
- Unit tests: ✅ Components work in isolation
- Integration tests: ⚠️  APIs work with mocked services
- E2E tests: ❌ Missing

**What we needed**:
- E2E tests for every critical workflow:
  - Create guest from scratch
  - Create event with sections
  - Upload and moderate photos
  - Send email to guests
  - Generate transportation manifest

---

## Actionable Recommendations

### Immediate Actions (This Week)

1. **Add E2E Tests for Critical Workflows**
   - Guest creation (including group creation)
   - Event creation with sections
   - Activity creation with capacity
   - Content page creation
   - Vendor creation with payments

2. **Add RLS Tests for All Tables**
   - Test with real user authentication
   - Test all roles (super_admin, host, guest)
   - Test all operations (SELECT, INSERT, UPDATE, DELETE)

3. **Add Contract Tests**
   - Form options match schema enums
   - API responses match TypeScript types
   - Database schema matches TypeScript types

### Short Term (This Month)

4. **Refactor Integration Tests**
   - Remove service role key usage
   - Use real user authentication
   - Test with real database operations

5. **Add Form Submission Tests**
   - Test with real HTML forms
   - Test type coercion (string → number)
   - Test validation error display

6. **Add Navigation Tests**
   - Verify all routes exist
   - Test all navigation links
   - Test back button behavior

### Long Term (This Quarter)

7. **Implement Continuous E2E Testing**
   - Run E2E tests on every PR
   - Test in production-like environment
   - Monitor for flaky tests

8. **Add Visual Regression Testing**
   - Screenshot comparison
   - CSS delivery verification
   - Responsive design testing

9. **Implement Chaos Testing**
   - Test with slow network
   - Test with database failures
   - Test with API timeouts

---

## Testing Strategy Going Forward

### The New Testing Pyramid

```
E2E Tests (10%)
├── Critical user workflows
├── Navigation flows
├── Form submissions
└── Error scenarios

Integration Tests (30%)
├── API routes with real database
├── RLS policy testing
├── Component data loading
└── Service integration

Unit Tests (60%)
├── Service methods
├── Utility functions
├── Component rendering
└── Business logic
```

### Test Quality Checklist

Before marking a feature "done", verify:

- [ ] Unit tests pass (isolated components)
- [ ] Integration tests pass (real API calls)
- [ ] E2E test passes (complete workflow)
- [ ] RLS policies tested (real auth)
- [ ] Contract tests pass (form/schema match)
- [ ] Error paths tested (not just happy path)
- [ ] Manual testing completed (real user experience)

---

## Conclusion

**Key Takeaway**: High test coverage doesn't guarantee quality. We had 91.2% coverage but missed critical bugs because we tested units in isolation instead of integrated workflows.

**Moving Forward**:
1. ✅ Keep existing unit tests (they're valuable)
2. ✅ Add integration tests with real dependencies
3. ✅ Add E2E tests for critical workflows
4. ✅ Test with real user authentication
5. ✅ Test error paths as thoroughly as success paths

**The Goal**: Not 100% coverage, but 100% confidence that the application works for real users.

---

## Files Created

1. `MANUAL_TESTING_BUGS_FOUND.md` - Bug documentation
2. `CRITICAL_BUGS_FIXED.md` - Fix documentation
3. `WHY_TESTS_MISSED_BUGS.md` - This analysis
4. `scripts/fix-content-pages-rls.mjs` - RLS fix script

## Files Modified

1. `schemas/vendorSchemas.ts` - Number coercion
2. `schemas/activitySchemas.ts` - Number coercion
3. `schemas/accommodationSchemas.ts` - Number coercion
4. `app/admin/accommodations/page.tsx` - Status enum fix
5. `supabase/migrations/019_create_content_pages_table.sql` - RLS fix
