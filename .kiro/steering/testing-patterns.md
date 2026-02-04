---
inclusion: always
---

# Testing Patterns & Anti-Patterns

## Common Testing Patterns

### Pattern 1: Test State Updates

```typescript
// ✅ GOOD - Tests that component updates when data changes
test('dropdown updates when groups change', () => {
  const { rerender } = render(<GuestForm groups={[]} />);
  expect(getGroupOptions()).toHaveLength(0);
  
  rerender(<GuestForm groups={[{ id: '1', name: 'Family' }]} />);
  expect(getGroupOptions()).toHaveLength(1);
});
```

**Why**: Catches bugs where components don't react to data changes (useMemo dependencies, etc.)

### Pattern 2: Test Complete Workflows

```typescript
// ✅ GOOD - Tests end-to-end user flow
test('user can create guest from scratch', async ({ page }) => {
  // Create group first
  await page.click('text=Add Group');
  await page.fill('input[name="name"]', 'Family');
  await page.click('text=Create');
  
  // Verify group appears in dropdown
  await page.click('text=Add Guest');
  const options = await page.locator('select[name="groupId"] option').allTextContents();
  expect(options).toContain('Family');
  
  // Create guest
  await page.selectOption('select[name="groupId"]', { label: 'Family' });
  await page.fill('input[name="firstName"]', 'John');
  await page.click('text=Create Guest');
  
  // Verify guest created
  await expect(page.locator('text=John')).toBeVisible();
});
```

**Why**: Validates complete user experience, not just isolated actions

### Pattern 3: Test RLS Policies

```typescript
// ✅ GOOD - Tests with real authentication
test('hosts can create content pages', async () => {
  const hostClient = await createAuthenticatedClient({ role: 'host' });
  const { error } = await hostClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeNull();
});

test('guests cannot create content pages', async () => {
  const guestClient = await createAuthenticatedClient({ role: 'guest' });
  const { error } = await guestClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeTruthy();
});
```

**Why**: Validates security policies with real authentication, not service role

### Pattern 4: Test Form Submissions

```typescript
// ✅ GOOD - Tests with real FormData
test('handles number inputs from HTML forms', async () => {
  const formData = new FormData();
  formData.append('baseCost', '1000');  // String from HTML
  
  const result = await submitVendorForm(formData);
  expect(result.success).toBe(true);
});
```

**Why**: Catches type coercion bugs (HTML forms return strings, not numbers)

### Pattern 5: Test Error States

```typescript
// ✅ GOOD - Tests error display
test('shows toast on validation error', async () => {
  const mockAddToast = jest.fn();
  render(<LocationForm addToast={mockAddToast} />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  await waitFor(() => {
    expect(mockAddToast).toHaveBeenCalledWith({
      type: 'error',
      message: expect.stringContaining('validation')
    });
  });
});
```

**Why**: Validates error handling and user feedback

### Pattern 6: Test Navigation

```typescript
// ✅ GOOD - E2E test verifies route exists
test('manage sections button navigates correctly', async ({ page }) => {
  await page.goto('/admin/events');
  await page.click('text=Manage Sections');
  
  // Should not be 404
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('h1')).toContainText('Sections');
});
```

**Why**: Catches broken navigation links and missing routes

### Pattern 7: Test Component Data Loading

```typescript
// ✅ GOOD - Component must fetch data itself
test('loads and displays locations', async () => {
  await testDb.from('locations').insert([{ id: '1', name: 'Test' }]);
  render(<LocationSelector />);
  
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Why**: Tests real data loading logic, not just rendering with props

## Common Anti-Patterns

### Anti-Pattern 1: Over-Mocking

```typescript
// ❌ BAD - Mocks everything, tests nothing real
const mockSupabase = { from: jest.fn().mockReturnThis(), ... };
const mockRouter = { push: jest.fn() };
const mockToast = { add: jest.fn() };

// ✅ GOOD - Mock only external dependencies
const mockSupabase = createMockSupabaseClient();
// Use real router, real toast in integration tests
```

**Why**: Over-mocking hides real issues

### Anti-Pattern 2: Testing Implementation Details

```typescript
// ❌ BAD - Tests internal state
expect(component.state.isLoading).toBe(true);

// ✅ GOOD - Tests user-visible behavior
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

**Why**: Implementation can change without breaking user experience

### Anti-Pattern 3: Skipping Error Paths

```typescript
// ❌ BAD - Only tests success
test('creates guest', async () => {
  const result = await guestService.create(validData);
  expect(result.success).toBe(true);
});

// ✅ GOOD - Tests all paths
test('creates guest with valid data', async () => { ... });
test('returns error with invalid data', async () => { ... });
test('returns error when database fails', async () => { ... });
test('sanitizes malicious input', async () => { ... });
```

**Why**: Error paths are where bugs hide

### Anti-Pattern 4: Shared Test State

```typescript
// ❌ BAD - Tests depend on each other
let guestId: string;
test('creates guest', async () => {
  const result = await guestService.create(data);
  guestId = result.data.id;
});
test('updates guest', async () => {
  await guestService.update(guestId, data); // Fails if previous test skipped
});

// ✅ GOOD - Tests are independent
test('updates guest', async () => {
  const createResult = await guestService.create(data);
  const updateResult = await guestService.update(createResult.data.id, newData);
  expect(updateResult.success).toBe(true);
});
```

**Why**: Tests should be runnable in any order

### Anti-Pattern 5: Missing Cleanup

```typescript
// ❌ BAD - Leaves test data
test('creates guest', async () => {
  await guestService.create(data);
  // No cleanup
});

// ✅ GOOD - Cleans up after test
afterEach(async () => {
  await testDb.from('guests').delete().neq('id', '');
  jest.clearAllMocks();
});
```

**Why**: Test pollution causes flaky tests

### Anti-Pattern 6: Passing Data as Props

```typescript
// ❌ BAD - Component receives data directly
render(<LocationSelector locations={mockLocations} />);

// ✅ GOOD - Component must fetch data
test('loads and displays locations', async () => {
  await testDb.from('locations').insert([{ id: '1', name: 'Test' }]);
  render(<LocationSelector />);
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

**Why**: Skips loading logic where bugs hide

### Anti-Pattern 7: Mocking Navigation

```typescript
// ❌ BAD - Route might not exist
const mockRouter = { push: jest.fn() };
fireEvent.click(button);
expect(mockRouter.push).toHaveBeenCalledWith('/admin/sections');

// ✅ GOOD - E2E test verifies route exists
test('button navigates correctly', async ({ page }) => {
  await page.click('text=Manage Sections');
  await expect(page).not.toHaveURL(/404/);
});
```

**Why**: Mocked navigation doesn't catch 404s

### Anti-Pattern 8: Using Service Role in Tests

```typescript
// ❌ BAD - Bypasses RLS
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ GOOD - Tests RLS with real auth
const hostClient = await createAuthenticatedClient({ role: 'host' });
const { error } = await hostClient.from('content_pages').insert(...);
expect(error).toBeNull();
```

**Why**: Service role bypasses security policies

## Testing Checklist

### Before Writing Tests
- [ ] Understand the user workflow
- [ ] Identify critical paths
- [ ] Plan test data needs
- [ ] Consider edge cases

### While Writing Tests
- [ ] Test user behavior, not implementation
- [ ] Test all paths (success, error, edge cases)
- [ ] Use descriptive test names
- [ ] Keep tests independent
- [ ] Clean up after tests

### After Writing Tests
- [ ] Run tests locally
- [ ] Verify coverage increased
- [ ] Check for flakiness (run 3x)
- [ ] Review test quality
- [ ] Update documentation

## Quick Decision Guide

### Should I write a unit test?
- ✅ Testing business logic
- ✅ Testing utility functions
- ✅ Testing service methods
- ✅ Testing pure functions

### Should I write an integration test?
- ✅ Testing API routes
- ✅ Testing RLS policies
- ✅ Testing database operations
- ✅ Testing component data loading

### Should I write an E2E test?
- ✅ Testing complete user workflows
- ✅ Testing navigation flows
- ✅ Testing form submissions
- ✅ Testing state updates across pages

## Real-World Examples from Our Codebase

### Example 1: Groups Dropdown Bug
**Bug**: New groups didn't appear in dropdown after creation

**What we tested** (missed bug):
```typescript
test('renders guest form with group options', () => {
  const mockGroups = [{ id: '1', name: 'Family' }];
  render(<GuestsPage groups={mockGroups} />);
  expect(screen.getByText('Family')).toBeInTheDocument();
});
```

**What we should have tested** (would catch bug):
```typescript
test('new group appears in dropdown after creation', async () => {
  render(<GuestsPage />);
  
  // Create a group
  await userEvent.click(screen.getByText('Manage Groups'));
  await userEvent.type(screen.getByLabelText('Group Name'), 'Test Family');
  await userEvent.click(screen.getByText('Create Group'));
  
  // Verify new group appears in dropdown
  await userEvent.click(screen.getByText('Add New Guest'));
  const groupSelect = screen.getByLabelText('Group');
  expect(within(groupSelect).getByText('Test Family')).toBeInTheDocument();
});
```

### Example 2: Next.js 15 Params Bug
**Bug**: Accessing `params.id` directly caused runtime error

**What we tested** (missed bug):
```typescript
test('renders room types page', () => {
  const mockParams = { id: 'accommodation-1' };
  render(<RoomTypesPage params={mockParams} />);
  expect(screen.getByText('Room Types')).toBeInTheDocument();
});
```

**What we should have tested** (would catch bug):
```typescript
test('should load room types page with dynamic accommodation ID', async ({ page }) => {
  await page.goto('/admin/accommodations/test-id/room-types');
  
  // Check console for params errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.waitForLoadState('networkidle');
  
  const paramsErrors = errors.filter(e => 
    e.includes('params') || e.includes('Promise')
  );
  
  expect(paramsErrors).toHaveLength(0);
});
```

### Example 3: RLS Policy Bug
**Bug**: Content pages RLS checked wrong table

**What we tested** (missed bug):
```typescript
const supabase = createClient(url, SERVICE_ROLE_KEY);
const result = await supabase.from('content_pages').insert({ title: 'Test' });
expect(result.error).toBeNull();
```

**What we should have tested** (would catch bug):
```typescript
test('hosts can create content pages', async () => {
  const hostClient = await createAuthenticatedClient({ role: 'host' });
  const { error } = await hostClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeNull();
});

test('guests cannot create content pages', async () => {
  const guestClient = await createAuthenticatedClient({ role: 'guest' });
  const { error } = await guestClient
    .from('content_pages')
    .insert({ title: 'Test', slug: 'test' });
  expect(error).toBeTruthy();
});
```

## Key Takeaways

1. **Test user experience, not code execution**
2. **Test complete workflows, not isolated units**
3. **Test with real runtime (Next.js, database, auth)**
4. **Test state updates and reactivity**
5. **Test integration between layers**
6. **Mock less, integrate more**
7. **Test error paths as thoroughly as success paths**
8. **Clean up after tests**
9. **Keep tests independent**
10. **Use descriptive test names**

## Remember

**High coverage ≠ Quality tests**

91.2% test coverage missed critical bugs because tests focused on isolated units rather than integrated workflows. Focus on testing what users experience, not just what code executes.
