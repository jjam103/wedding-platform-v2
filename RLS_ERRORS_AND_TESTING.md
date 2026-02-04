# RLS Errors and How Testing Would Have Caught Them

**Date**: January 30, 2026  
**Issue**: Permission denied errors for sections and content_pages tables

---

## The Errors

You encountered two RLS (Row Level Security) errors:

1. **Sections table**: "permission denied for table users"
2. **Content pages**: "new row violates row-level security policy for table 'content_pages'"

---

## Root Cause

The RLS policies in `supabase/migrations/009_create_cms_tables.sql` were incorrectly referencing `auth.users.role`:

```sql
-- ❌ WRONG - auth.users doesn't have a role column
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')  -- ❌ This column doesn't exist!
  )
);
```

The correct table is `users` (not `auth.users`):

```sql
-- ✅ CORRECT - users table has the role column
CREATE POLICY "hosts_manage_sections"
ON sections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users  -- ✅ Correct table
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);
```

---

## Why Tests Didn't Catch This

From `WHY_TESTS_MISSED_BUGS.md`, this is **Issue #3: No RLS Testing**:

### The Problem

> **Unit tests used service role that bypasses RLS**
> 
> - Tests used `SUPABASE_SERVICE_ROLE_KEY`
> - Service role bypasses ALL RLS policies
> - Tests never actually validated security
> - RLS errors only appear with real user authentication

### What Was Missing

```typescript
// ❌ WRONG - Unit tests use service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Bypasses RLS!
);

// Test passes even though RLS is broken
const result = await sectionsService.create(data);
expect(result.success).toBe(true);  // ✅ Passes (but RLS is broken!)
```

### What Should Have Been Done

```typescript
// ✅ CORRECT - Integration tests use real auth
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // Uses RLS!
);

// Sign in as actual user
await supabase.auth.signInWithPassword({
  email: 'host@example.com',
  password: 'test123'
});

// Test with real RLS policies
const result = await sectionsService.create(data);
// ❌ Would have FAILED - catching the RLS bug!
expect(result.success).toBe(true);
```

---

## How Testing Improvements Would Catch This

The testing improvements in `TESTING_IMPROVEMENTS_COMPLETE.md` specifically address this:

### 1. Real API Integration Tests

From `__tests__/integration/realApi.integration.test.ts`:

```typescript
describe('Real API Integration Tests', () => {
  it('should create section with real authentication', async () => {
    // Uses real Next.js server
    // Uses real authentication
    // Uses real RLS policies
    
    const response = await fetch(`${serverUrl}/api/admin/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie  // Real auth!
      },
      body: JSON.stringify(sectionData)
    });
    
    const result = await response.json();
    
    // ❌ Would have FAILED with RLS error
    expect(response.status).toBe(201);
    expect(result.success).toBe(true);
  });
});
```

### 2. E2E Tests with Real Auth

From `__tests__/e2e/guestGroupsFlow.spec.ts` pattern:

```typescript
test('should create section through UI', async ({ page }) => {
  // Real browser
  // Real authentication
  // Real database with RLS
  
  await page.goto('/admin/events/123/sections');
  await page.click('button:has-text("Add Section")');
  
  // ❌ Would have shown RLS error in browser
  await expect(page.locator('.error')).not.toBeVisible();
});
```

### 3. RLS-Specific Tests

**New test type needed** (not yet implemented):

```typescript
describe('RLS Policy Tests', () => {
  let hostClient: SupabaseClient;
  let guestClient: SupabaseClient;
  
  beforeEach(async () => {
    // Create clients with real auth (not service role)
    hostClient = await createAuthenticatedClient('host@example.com');
    guestClient = await createAuthenticatedClient('guest@example.com');
  });
  
  it('should allow hosts to create sections', async () => {
    const { data, error } = await hostClient
      .from('sections')
      .insert({ page_type: 'event', page_id: '123', display_order: 0 });
    
    // ❌ Would have FAILED - catching RLS bug!
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
  
  it('should prevent guests from creating sections', async () => {
    const { data, error } = await guestClient
      .from('sections')
      .insert({ page_type: 'event', page_id: '123', display_order: 0 });
    
    // Should fail (guests can't create)
    expect(error).toBeDefined();
    expect(error.code).toBe('42501'); // Permission denied
  });
});
```

---

## The Fix

### Option 1: Run Migration Script (Recommended)

```bash
node scripts/apply-sections-rls-fix.mjs
```

This applies the migration `020_fix_sections_rls_policies.sql`.

### Option 2: Manual Fix via Supabase Dashboard

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the SQL from `supabase/migrations/020_fix_sections_rls_policies.sql`
4. Click "Run"

### What the Fix Does

- ✅ Drops old policies that reference `auth.users.role`
- ✅ Creates new policies that reference `users.role`
- ✅ Fixes sections, columns, gallery_settings, content_versions tables
- ✅ Fixes content_pages table (if it exists)

---

## Testing Strategy Going Forward

### Immediate (This Sprint)

1. **Add RLS Integration Tests**
   ```typescript
   // __tests__/integration/rlsPolicies.integration.test.ts
   - Test with real auth (not service role)
   - Test host permissions
   - Test guest permissions
   - Test unauthenticated access
   ```

2. **Update Existing Integration Tests**
   ```typescript
   // Change from service role to real auth
   - Use SUPABASE_ANON_KEY instead of SERVICE_ROLE_KEY
   - Sign in as test users
   - Validate RLS policies work
   ```

3. **Add E2E Tests for Sections**
   ```typescript
   // __tests__/e2e/sectionsManagement.spec.ts
   - Test creating sections through UI
   - Test editing sections
   - Test deleting sections
   - Verify no permission errors
   ```

### Long-term (Next Quarter)

1. **Automated RLS Testing**
   - Test all tables have RLS enabled
   - Test all policies are correct
   - Test with multiple user roles
   - Test edge cases (expired sessions, etc.)

2. **Security Audit**
   - Review all RLS policies
   - Test with penetration testing tools
   - Verify no data leaks
   - Document security model

3. **CI/CD Integration**
   - Run RLS tests in CI
   - Block merges if RLS tests fail
   - Require security review for policy changes

---

## Lessons Learned

### What Went Wrong

1. **Service role in tests** - Bypassed all security
2. **No real auth testing** - Never validated RLS
3. **No integration tests** - Only unit tests with mocks
4. **No E2E tests** - Never tested complete workflows

### What We're Fixing

1. ✅ **Real API tests** - Test with real Next.js server
2. ✅ **E2E tests** - Test complete user workflows
3. ⏳ **RLS tests** - Test with real authentication (TODO)
4. ⏳ **Security tests** - Validate all policies (TODO)

### Key Takeaway

> **High test coverage (91.2%) doesn't mean high quality**
> 
> - Unit tests with mocks miss integration issues
> - Service role bypasses security
> - Need real auth, real API, real database tests

---

## Impact

### Before Fix
- ❌ Cannot create sections (permission denied)
- ❌ Cannot create content pages (RLS violation)
- ❌ Section editor completely broken
- ❌ Content management unusable

### After Fix
- ✅ Can create sections
- ✅ Can create content pages
- ✅ Section editor works
- ✅ Content management functional
- ✅ RLS policies enforce security correctly

---

## Related Documentation

- `TESTING_IMPROVEMENTS_COMPLETE.md` - Testing strategy
- `WHY_TESTS_MISSED_BUGS.md` - Analysis of testing gaps
- `supabase/migrations/020_fix_sections_rls_policies.sql` - The fix
- `scripts/apply-sections-rls-fix.mjs` - Migration script

---

## Summary

**Question**: Would the testing fix plan have caught this?

**Answer**: **YES!** Specifically:

1. ✅ **Real API integration tests** - Would have failed with RLS error
2. ✅ **E2E tests with real auth** - Would have shown permission denied
3. ⏳ **RLS-specific tests** - Not yet implemented, but planned

The testing improvements directly address this by:
- Using real authentication (not service role)
- Testing against real database with RLS
- Validating complete user workflows
- Testing security policies explicitly

This is **exactly** the type of bug the testing improvements are designed to catch!

---

**Status**: ✅ Fix available  
**Migration**: `020_fix_sections_rls_policies.sql`  
**Script**: `scripts/apply-sections-rls-fix.mjs`  
**Testing**: Would have caught with real auth tests
