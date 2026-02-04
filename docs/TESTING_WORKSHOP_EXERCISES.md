# Testing Workshop - Hands-On Exercises

## Exercise 1: Property-Based Testing

### Task: Slug Generation Property Test

Write a property test that verifies slug generation produces URL-safe slugs for any input.

**File**: `utils/slugs.property.test.ts`

**Requirements**:
1. Slug should only contain lowercase letters, numbers, and hyphens
2. Slug should not start or end with hyphen
3. Slug should not contain consecutive hyphens
4. Slug should not be empty

**Starter Code**:
```typescript
import fc from 'fast-check';
import { generateSlug } from '@/utils/slugs';

describe('Property: Slug Generation', () => {
  it('should generate URL-safe slugs for any input', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      (input) => {
        const slug = generateSlug(input);
        
        // TODO: Add property assertions
      }
    ));
  });
});
```

**Solution** (Don't peek until you try!):
```typescript
import fc from 'fast-check';
import { generateSlug } from '@/utils/slugs';

describe('Property: Slug Generation', () => {
  it('should generate URL-safe slugs for any input', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      (input) => {
        const slug = generateSlug(input);
        
        // Property 1: Only valid characters
        expect(slug).toMatch(/^[a-z0-9-]+$/);
        
        // Property 2: No leading/trailing hyphens
        expect(slug).not.toMatch(/^-|-$/);
        
        // Property 3: No consecutive hyphens
        expect(slug).not.toMatch(/--/);
        
        // Property 4: Not empty
        expect(slug.length).toBeGreaterThan(0);
      }
    ));
  });
  
  it('should be idempotent', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 100 }),
      (input) => {
        const slug1 = generateSlug(input);
        const slug2 = generateSlug(slug1);
        
        // Generating slug from slug should return same slug
        expect(slug1).toBe(slug2);
      }
    ));
  });
});
```

---

## Exercise 2: Integration Testing

### Task: Content Pages API Integration Test

Write integration tests for the content pages API that verify authentication and RLS policies.

**File**: `__tests__/integration/contentPagesApi.integration.test.ts`

**Requirements**:
1. Test authenticated user can create content page
2. Test unauthenticated requests are rejected
3. Test user can only see their own content pages
4. Test proper error handling

**Starter Code**:
```typescript
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';

describe('Content Pages API - Integration', () => {
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    const testUser = await createTestUser();
    authToken = testUser.authToken;
    userId = testUser.userId;
  });
  
  afterAll(async () => {
    await cleanupTestData(userId);
  });
  
  it('should create content page with authentication', async () => {
    // TODO: Implement test
  });
  
  it('should reject unauthenticated requests', async () => {
    // TODO: Implement test
  });
});
```

**Solution**:
```typescript
import { createTestUser, cleanupTestData } from '@/__tests__/helpers/testAuth';

describe('Content Pages API - Integration', () => {
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    const testUser = await createTestUser();
    authToken = testUser.authToken;
    userId = testUser.userId;
  });
  
  afterAll(async () => {
    await cleanupTestData(userId);
  });
  
  it('should create content page with authentication', async () => {
    const response = await fetch('http://localhost:3000/api/admin/content-pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'Test Page',
        slug: 'test-page',
        type: 'custom',
      }),
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Test Page');
    expect(data.data.slug).toBe('test-page');
  });
  
  it('should reject unauthenticated requests', async () => {
    const response = await fetch('http://localhost:3000/api/admin/content-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Page',
        slug: 'test-page',
        type: 'custom',
      }),
    });
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });
  
  it('should only return pages owned by authenticated user', async () => {
    // Create page for this user
    await fetch('http://localhost:3000/api/admin/content-pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'My Page',
        slug: 'my-page',
        type: 'custom',
      }),
    });
    
    // Fetch all pages
    const response = await fetch('http://localhost:3000/api/admin/content-pages', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    // Verify RLS: Should only see own pages
    data.data.forEach((page: any) => {
      expect(page.created_by).toBe(userId);
    });
  });
  
  it('should handle validation errors', async () => {
    const response = await fetch('http://localhost:3000/api/admin/content-pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        // Missing required fields
        type: 'custom',
      }),
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## Exercise 3: E2E Testing

### Task: Section Management E2E Test

Write an E2E test that verifies the complete section management workflow.

**File**: `__tests__/e2e/sectionManagement.spec.ts`

**Requirements**:
1. Navigate to event details
2. Open section editor
3. Add new section
4. Fill section content
5. Save section
6. Verify section appears in preview

**Starter Code**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Section Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });
  
  test('should add section to event', async ({ page }) => {
    // TODO: Implement test
  });
});
```

**Solution**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Section Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });
  
  test('should add section to event', async ({ page }) => {
    // Navigate to events
    await page.goto('/admin/events');
    
    // Click on first event
    await page.click('[data-testid="event-row"]:first-child');
    
    // Open section editor
    await page.click('text=Manage Sections');
    
    // Wait for editor to load
    await page.waitForSelector('[data-testid="section-editor"]');
    
    // Add new section
    await page.click('button:has-text("Add Section")');
    
    // Fill section title
    await page.fill('[name="sectionTitle"]', 'Test Section');
    
    // Fill left column content
    await page.fill('[data-testid="left-column-editor"]', 'This is the left column content');
    
    // Fill right column content
    await page.fill('[data-testid="right-column-editor"]', 'This is the right column content');
    
    // Save section
    await page.click('button:has-text("Save Section")');
    
    // Verify toast notification
    await expect(page.locator('.toast')).toContainText('Section saved successfully');
    
    // Verify section appears in list
    await expect(page.locator('text=Test Section')).toBeVisible();
    
    // Toggle preview
    await page.click('button:has-text("Preview")');
    
    // Verify section content in preview
    await expect(page.locator('[data-testid="section-preview"]')).toContainText('This is the left column content');
    await expect(page.locator('[data-testid="section-preview"]')).toContainText('This is the right column content');
  });
  
  test('should reorder sections with drag and drop', async ({ page }) => {
    await page.goto('/admin/events');
    await page.click('[data-testid="event-row"]:first-child');
    await page.click('text=Manage Sections');
    
    // Get initial order
    const firstSection = await page.locator('[data-testid="section-item"]:first-child').textContent();
    const secondSection = await page.locator('[data-testid="section-item"]:nth-child(2)').textContent();
    
    // Drag first section to second position
    await page.dragAndDrop(
      '[data-testid="section-item"]:first-child',
      '[data-testid="section-item"]:nth-child(2)'
    );
    
    // Verify order changed
    const newFirstSection = await page.locator('[data-testid="section-item"]:first-child').textContent();
    expect(newFirstSection).toBe(secondSection);
  });
  
  test('should delete section', async ({ page }) => {
    await page.goto('/admin/events');
    await page.click('[data-testid="event-row"]:first-child');
    await page.click('text=Manage Sections');
    
    // Click delete on first section
    await page.click('[data-testid="section-item"]:first-child button[aria-label="Delete"]');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify toast
    await expect(page.locator('.toast')).toContainText('Section deleted');
  });
});
```

---

## Exercise 4: Complete Feature Testing

### Task: Guest Dietary Restrictions

Implement complete test coverage for a new feature: guest dietary restrictions.

**Requirements**:
1. Property-based test for input sanitization
2. Integration test for API endpoint
3. E2E test for UI workflow

**Files to Create**:
- `services/guestService.dietaryRestrictions.property.test.ts`
- `__tests__/integration/guestDietaryRestrictions.integration.test.ts`
- `__tests__/e2e/guestDietaryRestrictions.spec.ts`

**Hints**:
- Use `maliciousInputArbitrary` for property test
- Test both POST and PATCH endpoints
- Verify dietary restrictions display in guest list
- Test validation (max length, special characters)

**Solution**: Try implementing this yourself first! Refer to the workshop examples for guidance.

---

## Bonus Exercises

### Exercise 5: Flaky Test Debugging

**Scenario**: This test is flaky. Fix it.

```typescript
test('should load guest list', async ({ page }) => {
  await page.goto('/admin/guests');
  await page.waitForTimeout(1000); // ❌ BAD
  expect(await page.locator('[data-testid="guest-row"]').count()).toBeGreaterThan(0);
});
```

**Solution**:
```typescript
test('should load guest list', async ({ page }) => {
  await page.goto('/admin/guests');
  
  // ✅ GOOD: Wait for specific element
  await page.waitForSelector('[data-testid="guest-row"]');
  
  // ✅ GOOD: Use Playwright's auto-waiting
  await expect(page.locator('[data-testid="guest-row"]')).toHaveCount(5);
});
```

### Exercise 6: Test Refactoring

**Scenario**: Refactor this test to use test helpers.

```typescript
it('should create guest', async () => {
  const response = await fetch('/api/admin/guests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123',
    },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      groupId: 'group-123',
      ageType: 'adult',
      guestType: 'wedding_guest',
    }),
  });
  
  expect(response.status).toBe(201);
});
```

**Solution**:
```typescript
import { createTestUser } from '@/__tests__/helpers/testAuth';
import { createTestGuest } from '@/__tests__/helpers/factories';

it('should create guest', async () => {
  const { authToken } = await createTestUser();
  const guestData = createTestGuest();
  
  const response = await fetch('/api/admin/guests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(guestData),
  });
  
  expect(response.status).toBe(201);
});
```

---

## Self-Assessment Checklist

After completing the exercises, check if you can:

- [ ] Write property-based tests with fast-check
- [ ] Create custom arbitraries for domain models
- [ ] Write integration tests with real authentication
- [ ] Test RLS policies are enforced
- [ ] Write E2E tests with Playwright
- [ ] Use proper waits and selectors in E2E tests
- [ ] Test complete user workflows
- [ ] Handle test cleanup properly
- [ ] Debug flaky tests
- [ ] Refactor tests to use helpers

---

## Additional Resources

- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Jest Documentation](https://jestjs.io/)

---

## Need Help?

- Ask in #testing Slack channel
- Review workshop slides
- Check example tests in codebase
- Attend office hours (Fridays 2-3pm)

