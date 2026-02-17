# E2E Next Actions - February 12, 2026

## Current Situation

**Status**: ⚠️ Blocked  
**Issue**: `/admin/home-page` route not loading within 10 seconds  
**Impact**: 4 tests with Phase 1 fixes cannot be verified  
**Confidence**: Phase 1 fixes are correctly applied and ready to test

## Immediate Next Steps (Choose One)

### Option 1: Debug and Fix Route Issue (RECOMMENDED)

**Time Estimate**: 30-60 minutes  
**Success Probability**: High  
**Impact**: Unblocks 4 tests, validates Phase 1 pattern, fixes potential real bug

#### Step-by-Step Debugging Guide

**Step 1: View Test Trace (5 min)**
```bash
# Open the most detailed test artifact
npx playwright show-trace test-results/admin-contentManagement-Ho-60835-tings-and-save-successfully-chromium-retry1/trace.zip
```

**What to look for:**
- Network tab: Does `/api/admin/home-page` GET request happen?
- Network tab: What status code? (200, 401, 404, 500?)
- Console tab: Any JavaScript errors?
- Console tab: Any API error messages?
- DOM snapshot at failure: What's actually rendered?
- DOM snapshot: Is there a loading spinner stuck?

**Step 2: Test API Endpoint Manually (5 min)**
```bash
# First, get the admin auth token from test setup
# It should be in .auth/admin.json

# Then test the endpoint
curl -v \
  -H "Authorization: Bearer <token-from-auth-file>" \
  -H "Cookie: <cookies-from-auth-file>" \
  http://localhost:3000/api/admin/home-page

# Expected: { "success": true, "data": { ... } }
# If error: Note the error message and status code
```

**Step 3: Check Database Schema (5 min)**
```bash
# Connect to E2E database
psql $E2E_DATABASE_URL

# Check if system_settings table exists
\dt system_settings

# If exists, check structure
\d system_settings

# Check if home_page_config exists
SELECT * FROM system_settings WHERE key = 'home_page_config';

# If no data, check if migration was applied
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
```

**Step 4: Check API Route Implementation (5 min)**
```bash
# Read the API route
cat app/api/admin/home-page/route.ts

# Look for:
# 1. Does GET handler exist?
# 2. Does it query system_settings table?
# 3. Does it handle missing data gracefully?
# 4. Does it have proper error handling?
# 5. Does it check auth properly?
```

**Step 5: Check Page Component (5 min)**
```bash
# Read the page component
cat app/admin/home-page/page.tsx

# Look for:
# 1. Is there a loading state?
# 2. Does it make an API call on mount?
# 3. Does it handle API errors?
# 4. Is the h1 always rendered or conditional?
# 5. Are there any console.log statements we can check?
```

#### Common Issues and Fixes

**Issue 1: system_settings table doesn't exist**
```bash
# Check if migration exists
ls -la supabase/migrations/*system_settings*

# If exists, apply it to E2E database
psql $E2E_DATABASE_URL < supabase/migrations/050_create_system_settings_table.sql

# Verify
psql $E2E_DATABASE_URL -c "\dt system_settings"
```

**Issue 2: No data in system_settings**
```bash
# Insert default home page config
psql $E2E_DATABASE_URL << EOF
INSERT INTO system_settings (key, value, created_at, updated_at)
VALUES (
  'home_page_config',
  '{"title": "Welcome", "subtitle": "Test", "ctaText": "Get Started", "ctaLink": "/events"}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EOF

# Verify
psql $E2E_DATABASE_URL -c "SELECT * FROM system_settings WHERE key = 'home_page_config';"
```

**Issue 3: API route doesn't have GET handler**
```typescript
// Add to app/api/admin/home-page/route.ts

export async function GET(request: Request) {
  try {
    // Check auth
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get config from database
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'home_page_config')
      .single();

    if (error) {
      // If no data exists, return default config
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            title: 'Welcome to Our Wedding',
            subtitle: 'Join us in Costa Rica',
            ctaText: 'View Events',
            ctaLink: '/events'
          }
        });
      }

      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.value
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UNKNOWN_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
```

**Issue 4: RLS policy blocks access**
```sql
-- Check RLS policies on system_settings
SELECT * FROM pg_policies WHERE tablename = 'system_settings';

-- If too restrictive, update policy
DROP POLICY IF EXISTS "Admin users can read system settings" ON system_settings;

CREATE POLICY "Admin users can read system settings"
ON system_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);
```

#### Verification After Fix

```bash
# 1. Test API endpoint manually again
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/admin/home-page

# Should return: { "success": true, "data": { ... } }

# 2. Test page loads in browser
# Open: http://localhost:3000/admin/home-page
# Should see: "Home Page Editor" heading

# 3. Re-run the 4 tests
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts --grep "Home Page Editing"

# Expected: All 4 tests pass
```

---

### Option 2: Increase Timeout (QUICK FIX)

**Time Estimate**: 5 minutes  
**Success Probability**: Medium  
**Impact**: May unblock tests if page is just slow

#### Implementation

```typescript
// In __tests__/e2e/admin/contentManagement.spec.ts
// Update the beforeEach hook (line 247-250)

test.beforeEach(async ({ page }) => {
  // Changed from 'domcontentloaded' to 'networkidle'
  // Increased timeout from default to 30s
  await page.goto('http://localhost:3000/admin/home-page', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Increased timeout from 10s to 30s
  await expect(page.locator('h1:has-text("Home Page Editor")')).toBeVisible({ 
    timeout: 30000 
  });
});
```

#### Pros and Cons

**Pros:**
- ✅ Quick to implement (5 minutes)
- ✅ May unblock tests immediately
- ✅ Low risk change

**Cons:**
- ❌ Doesn't fix underlying issue
- ❌ Tests will be slower (30s vs 10s)
- ❌ May hide real performance problems
- ❌ If API is actually failing, this won't help

#### When to Use

Use this option if:
- You need to unblock tests immediately
- You suspect the page is just slow (not broken)
- You plan to investigate the root cause later

---

### Option 3: Skip Tests Temporarily (UNBLOCK PROGRESS)

**Time Estimate**: 2 minutes  
**Success Probability**: 100%  
**Impact**: Allows progress on remaining 11 tests

#### Implementation

```typescript
// In __tests__/e2e/admin/contentManagement.spec.ts
// Add .skip to the describe block (line 246)

test.describe.skip('Home Page Editing', () => {
  // TODO: Re-enable after fixing /admin/home-page route loading issue
  // Issue: Route takes >10s to load, h1 element never appears
  // Investigation needed: Check /api/admin/home-page GET endpoint
  // See: E2E_FEB12_2026_SESSION_COMPLETE.md for details
  
  test.beforeEach(async ({ page }) => {
    // ... existing code
  });

  // ... all 4 tests
});
```

#### Pros and Cons

**Pros:**
- ✅ Unblocks progress on other tests
- ✅ Can apply Phase 1 pattern to remaining 11 tests
- ✅ Can come back to these 4 tests later
- ✅ Documents the issue clearly

**Cons:**
- ❌ Leaves tests disabled
- ❌ Issue remains unfixed
- ❌ Can't verify Phase 1 pattern works

#### When to Use

Use this option if:
- Root cause investigation will take too long
- You want to make progress on other tests
- You plan to fix the issue in a separate session

---

## Recommended Path Forward

### My Recommendation: Option 1 (Debug and Fix)

**Reasoning:**

1. **Real Bug**: If the API is failing, this affects real users too
2. **Pattern Validation**: We need to verify Phase 1 fixes work
3. **Remaining Work**: Same pattern will be applied to 11 more tests
4. **Time Investment**: 30-60 minutes now saves time later

**Execution Plan:**

1. **Investigate** (20 minutes)
   - View test trace
   - Test API endpoint
   - Check database
   - Check API route

2. **Fix** (20 minutes)
   - Apply appropriate fix based on findings
   - Test fix manually
   - Verify in browser

3. **Verify** (10 minutes)
   - Re-run 4 tests
   - Confirm all pass
   - Document findings

4. **Continue** (60-90 minutes)
   - Apply Phase 1 pattern to remaining 11 tests
   - Run full content management suite
   - Celebrate success 🎉

### Alternative: Option 3 + Option 1 Later

If time is limited right now:

1. **Skip these 4 tests** (2 minutes)
2. **Apply Phase 1 to remaining 11 tests** (60-90 minutes)
3. **Come back to investigate route issue** (30-60 minutes later)

This allows progress while deferring the investigation.

---

## Success Criteria

### For Option 1 (Fix Route)

- ✅ API endpoint returns 200 with valid data
- ✅ Page loads in browser showing "Home Page Editor"
- ✅ All 4 tests pass
- ✅ Phase 1 pattern validated

### For Option 2 (Increase Timeout)

- ✅ All 4 tests pass with increased timeout
- ⚠️ Tests take longer to run
- ⚠️ Underlying issue still exists

### For Option 3 (Skip Tests)

- ✅ Tests are skipped with clear TODO comment
- ✅ Can proceed with remaining 11 tests
- ⚠️ 4 tests remain disabled

---

## After Resolution

### Next Phase: Apply Pattern to Remaining 11 Tests

Once the route issue is fixed (or tests are skipped), apply Phase 1 pattern to:

1. **Content Page Management** (3 tests)
   - Full creation flow
   - Validation and slug conflicts
   - Add and reorder sections

2. **Inline Section Editor** (5 tests)
   - Toggle and add sections
   - Edit content and layout
   - Delete section
   - Add photo gallery and references
   - One more test

3. **Event References** (2 tests)
   - Create event and add as reference
   - One more test

4. **Content Management Accessibility** (1 test)
   - Keyboard navigation and accessible forms

**Estimated Time**: 2-3 hours  
**Expected Outcome**: 15/15 content management tests passing

---

## Documentation Created

1. ✅ `E2E_FEB12_2026_SESSION_COMPLETE.md` - Comprehensive session summary
2. ✅ `E2E_FEB12_2026_PHASE1_VERIFICATION.md` - Detailed fix verification
3. ✅ `E2E_FEB12_2026_TEST_RESULTS.md` - Test execution results
4. ✅ `E2E_FEB12_2026_NEXT_ACTIONS.md` - This file (action plan)

---

## Quick Start Commands

### To Debug (Option 1)
```bash
# View trace
npx playwright show-trace test-results/admin-contentManagement-Ho-60835-tings-and-save-successfully-chromium-retry1/trace.zip

# Test API
curl -H "Authorization: Bearer $(cat .auth/admin.json | jq -r '.cookies[0].value')" \
     http://localhost:3000/api/admin/home-page

# Check database
psql $E2E_DATABASE_URL -c "SELECT * FROM system_settings WHERE key = 'home_page_config';"
```

### To Increase Timeout (Option 2)
```bash
# Edit the file
code __tests__/e2e/admin/contentManagement.spec.ts

# Update line 247-250 with increased timeouts
# Then re-run tests
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts --grep "Home Page Editing"
```

### To Skip Tests (Option 3)
```bash
# Edit the file
code __tests__/e2e/admin/contentManagement.spec.ts

# Add .skip to line 246: test.describe.skip('Home Page Editing', () => {
# Then continue with other tests
```

---

**Created**: February 12, 2026  
**Status**: Ready for execution  
**Recommended**: Option 1 (Debug and Fix)
