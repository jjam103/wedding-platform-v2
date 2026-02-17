# E2E Phase 2 - Quick Start Guide

## Current Status
- ✅ Phase 1 Complete: Auth state persistence fixed
- 📊 Pass Rate: 54.3% (195/359 tests)
- 🎯 Target: 90%+ pass rate (323+ tests)
- 📉 Remaining Failures: 143 tests

## Phase 2 Priorities

### Priority 1: Timeout Issues (~60-70 tests) ⏱️
**Impact**: Highest - affects most remaining failures

**Quick Wins**:
1. Increase global timeout in `playwright.config.ts`:
   ```typescript
   timeout: 30 * 1000, // Increase from 30s to 60s
   expect: {
     timeout: 10 * 1000, // Increase from 5s to 10s
   },
   ```

2. Add explicit waits in common patterns:
   ```typescript
   // Before clicking
   await page.waitForLoadState('networkidle');
   
   // Before filling forms
   await page.waitForSelector('input[name="email"]', { state: 'visible' });
   
   // After API calls
   await page.waitForResponse(resp => resp.url().includes('/api/'));
   ```

3. Identify slow API endpoints and optimize

**Files to Check**:
- `playwright.config.ts` - Global timeout settings
- Test files with `TimeoutError` in results
- API route handlers that might be slow

### Priority 2: Element Not Found (~40-50 tests) 🔍
**Impact**: High - second most common issue

**Quick Wins**:
1. Update selectors to use data-testid:
   ```typescript
   // ❌ Fragile
   await page.click('button.bg-jungle-600');
   
   // ✅ Stable
   await page.click('[data-testid="submit-button"]');
   ```

2. Add wait conditions before assertions:
   ```typescript
   // ❌ Flaky
   expect(await page.locator('.success-message').isVisible()).toBe(true);
   
   // ✅ Stable
   await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
   ```

3. Check for conditional rendering issues

**Files to Check**:
- Test files with `element(s) not found` errors
- Components with conditional rendering
- Dynamic content that loads after page load

### Priority 3: Assertion Failures (~20-30 tests) ✅
**Impact**: Medium - specific test logic issues

**Quick Wins**:
1. Fix test data setup in factories:
   ```typescript
   // Ensure test data matches expected format
   export function createTestGuest() {
     return {
       email: 'test@example.com', // Valid email format
       firstName: 'Test',
       lastName: 'Guest',
       // ... other required fields
     };
   }
   ```

2. Verify form submission logic:
   ```typescript
   // Wait for form submission to complete
   await page.click('button[type="submit"]');
   await page.waitForURL(/\/success/);
   await page.waitForLoadState('networkidle');
   ```

3. Check API response format matches expectations

**Files to Check**:
- `__tests__/helpers/factories.ts` - Test data factories
- Test files with assertion failures
- API routes that return data

### Priority 4: Database Constraint (1 test) 🗄️
**Impact**: Low - only affects setup

**Quick Fix**:
Update test guest email in `__tests__/e2e/global-setup.ts`:
```typescript
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .insert({
    first_name: 'Test',
    last_name: 'Guest',
    email: 'test.guest@example.com', // ✅ Valid email format
    group_id: group.id,
    age_type: 'adult',
    guest_type: 'wedding_guest',
    auth_method: 'email_matching',
  })
  .select()
  .single();
```

## Execution Strategy

### Option A: Sequential (Safest)
1. Fix Priority 1 (Timeouts) - 2-3 hours
2. Run tests, verify improvement
3. Fix Priority 2 (Selectors) - 2-3 hours
4. Run tests, verify improvement
5. Fix Priority 3 (Assertions) - 1-2 hours
6. Fix Priority 4 (Database) - 15 minutes
7. Final test run

**Total Time**: 5-8 hours
**Expected Result**: 90%+ pass rate

### Option B: Parallel (Faster, Riskier)
1. Fix all quick wins simultaneously
2. Run full test suite
3. Iterate on remaining failures

**Total Time**: 3-5 hours
**Expected Result**: 85-90% pass rate

## Commands

### Run Full E2E Suite
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts
```

### Run Tests in UI Mode (for debugging)
```bash
npx playwright test --ui
```

### Generate HTML Report
```bash
npx playwright show-report
```

## Success Criteria

### Phase 2a Complete (Timeouts Fixed):
- 🎯 Pass rate: 70%+ (251+ tests)
- 🎯 Timeout errors: <10

### Phase 2b Complete (Selectors Fixed):
- 🎯 Pass rate: 80%+ (287+ tests)
- 🎯 Element not found errors: <5

### Phase 2c Complete (Assertions Fixed):
- 🎯 Pass rate: 90%+ (323+ tests)
- 🎯 Assertion failures: <5

### Phase 2 Complete:
- 🎯 Pass rate: 90%+ (323+ tests)
- 🎯 Total failures: <36
- 🎯 All critical user flows passing

## Next Steps

1. **Choose execution strategy** (Sequential recommended)
2. **Start with Priority 1** (Timeouts - biggest impact)
3. **Run tests after each priority** to verify improvement
4. **Document patterns** as you find them
5. **Celebrate wins!** 🎉

---

**Ready to start?** Begin with Priority 1 (Timeouts) for maximum impact!
