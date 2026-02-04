# E2E Test Quick Fix Guide

## Current Status
- ✅ Schema: All tables and columns present
- ✅ Cleanup: Fixed page_slug → page_id bug
- ⚠️ Pass Rate: 53.6% (194/362 tests)
- ⚠️ Failures: 147 tests failing

## Priority 1: Authentication Failures (19 tests)

### Issue
Guest authentication tests failing with various errors.

### Quick Fixes

1. **Check test user creation:**
```bash
# Verify test users exist
node scripts/create-e2e-admin-user.mjs
```

2. **Review magic link flow:**
```typescript
// Check if magic_link_tokens are being created
// File: app/api/auth/guest/magic-link/route.ts
```

3. **Verify session cookies:**
```typescript
// Ensure cookies are set correctly
// File: app/api/auth/guest/magic-link/verify/route.ts
```

### Tests to Fix
- `__tests__/e2e/auth/guestAuth.spec.ts:115` - Invalid email format
- `__tests__/e2e/auth/guestAuth.spec.ts:142` - Session cookie creation
- `__tests__/e2e/auth/guestAuth.spec.ts:165` - Magic link verification
- `__tests__/e2e/auth/guestAuth.spec.ts:212` - Success message
- `__tests__/e2e/auth/guestAuth.spec.ts:239` - Expired magic link
- `__tests__/e2e/auth/guestAuth.spec.ts:273` - Used magic link

## Priority 2: 404 Errors (96 occurrences)

### Issue
Tests trying to access routes that don't exist or test data not created.

### Quick Fixes

1. **Implement missing /auth/register route:**
```bash
# Create the route file
touch app/auth/register/page.tsx
```

2. **Fix test data creation:**
```typescript
// Ensure activities/events are created before tests
// File: __tests__/e2e/guest/guestViews.spec.ts
test.beforeEach(async () => {
  // Create test activity with proper slug
  const activity = await createTestActivity({
    slug: 'test-activity-slug'
  });
});
```

3. **Use slugs instead of IDs:**
```typescript
// WRONG
await page.goto('/activity/test-activity-id');

// CORRECT
await page.goto('/activity/test-activity-slug');
```

### Common 404 Routes
- `/auth/register` - Not implemented
- `/activity/test-activity-id` - Use slug instead
- `/event/test-event-id` - Use slug instead

## Priority 3: Timeout Errors (77 occurrences)

### Issue
Tests timing out due to slow operations or missing data.

### Quick Fixes

1. **Increase timeouts for slow operations:**
```typescript
// In playwright.config.ts
export default defineConfig({
  timeout: 30000, // Increase from default
  expect: {
    timeout: 10000 // Increase assertion timeout
  }
});
```

2. **Optimize test data setup:**
```typescript
// Use factories for faster data creation
import { createTestGuest, createTestActivity } from '__tests__/helpers/factories';

// Batch create instead of sequential
await Promise.all([
  createTestGuest(),
  createTestActivity(),
  createTestEvent()
]);
```

3. **Add database indexes:**
```sql
-- Check if indexes exist
SELECT * FROM pg_indexes WHERE tablename IN ('guests', 'activities', 'events');
```

## Quick Win Fixes

### 1. Fix Cleanup Errors (DONE ✅)
```typescript
// Changed from page_slug to page_id
await supabase
  .from('sections')
  .delete()
  .like('page_id', pageIdPattern);
```

### 2. Add Missing Route
```typescript
// app/auth/register/page.tsx
export default function RegisterPage() {
  return (
    <div>
      <h1>Guest Registration</h1>
      {/* Add registration form */}
    </div>
  );
}
```

### 3. Fix Test Data Creation
```typescript
// __tests__/helpers/e2eHelpers.ts
export async function createTestActivity(overrides = {}) {
  const slug = overrides.slug || `test-activity-${Date.now()}`;
  const { data } = await supabase
    .from('activities')
    .insert({
      name: 'Test Activity',
      slug,
      start_time: new Date().toISOString(),
      ...overrides
    })
    .select()
    .single();
  return data;
}
```

## Testing the Fixes

### 1. Run specific test file
```bash
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts
```

### 2. Run with debugging
```bash
npx playwright test --debug
```

### 3. Run with headed browser
```bash
npx playwright test --headed
```

### 4. Check test output
```bash
npx playwright show-report
```

## Verification Checklist

After applying fixes:

- [ ] Run diagnostic script: `node scripts/diagnose-e2e-failures.mjs`
- [ ] Check schema: All tables exist ✅
- [ ] Run auth tests: `npx playwright test auth`
- [ ] Run guest view tests: `npx playwright test guestViews`
- [ ] Run full suite: `npx playwright test`
- [ ] Check pass rate: Should be >70%
- [ ] Review failures: Should be <50

## Expected Improvements

| Fix | Tests Affected | Expected Improvement |
|-----|----------------|---------------------|
| Cleanup bug | 47 | +47 tests passing |
| Auth fixes | 19 | +15-19 tests passing |
| 404 fixes | 96 | +50-70 tests passing |
| Timeout fixes | 77 | +30-50 tests passing |
| **Total** | **239** | **+142-186 tests** |

**Target Pass Rate:** 85-95% (307-344 tests passing)

## Next Steps

1. Apply Priority 1 fixes (auth)
2. Apply Priority 2 fixes (404s)
3. Apply Priority 3 fixes (timeouts)
4. Run full test suite
5. Analyze remaining failures
6. Document patterns
7. Update testing standards

## Resources

- [E2E Test Analysis](./E2E_TEST_ANALYSIS_POST_MIGRATION.md)
- [Migration Summary](./E2E_MIGRATION_APPLICATION_SUMMARY.md)
- [E2E Helpers Guide](__tests__/helpers/E2E_HELPERS_GUIDE.md)
- [Factories Guide](__tests__/helpers/FACTORIES_GUIDE.md)

---

**Last Updated:** January 27, 2025  
**Status:** Ready for implementation
