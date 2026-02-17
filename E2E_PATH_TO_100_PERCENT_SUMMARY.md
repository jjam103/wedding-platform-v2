# E2E Test Suite - Path to 100% Passing

**Current Status**: 224 passed | 104 failed | 9 flaky (66.5% pass rate)  
**Goal**: 337 passed | 0 failed | 0 flaky (100% pass rate)  
**Gap**: 113 tests need fixing

---

## 🎯 The 5 Patterns That Account for ALL Failures

### 1. **Dropdown/Select Timeout** (~40-50 failures) 🔴 CRITICAL
**Problem**: Select elements found but not interactive - waiting for data to load

**Tests Affected**:
- Location Hierarchy (5 tests) - ALL FAILING
- Email recipient selection
- Guest group selection  
- Reference type selection
- CSV field mapping

**Fix**:
```typescript
// Helper function needed
async function waitForDropdownOptions(page, selector, minOptions = 1) {
  await page.waitForFunction(
    ({ sel, min }) => {
      const select = document.querySelector(sel);
      return select && !select.disabled && select.options.length > min;
    },
    { sel: selector, min: minOptions },
    { timeout: 10000 }
  );
}

// Usage
await waitForDropdownOptions(page, 'select[name="parentLocationId"]', 1);
await page.selectOption('select[name="parentLocationId"]', parentId);
```

---

### 2. **API Data Loading Race** (~20-30 failures) 🔴 CRITICAL
**Problem**: UI interactions happen before API data loads

**Tests Affected**:
- Email Management dropdowns
- Content Management references
- Photo Upload metadata
- RSVP activity lists

**Fix**:
```typescript
// Wait for API response before interaction
await page.waitForResponse(
  (response) => response.url().includes('/api/admin/guests') && response.status() === 200,
  { timeout: 10000 }
);

// Or wait for dropdown to populate
await waitForDropdownOptions(page, 'select#recipients', 1);
```

---

### 3. **Page Load Timeout** (~15-20 failures) 🟡 MEDIUM
**Problem**: Pages take >15s to load

**Tests Affected**:
- Admin navigation
- Content Management home page
- CSV import page

**Fix**:
```typescript
// Increase timeout + use domcontentloaded
await page.goto('/admin/locations', { 
  timeout: 30000,
  waitUntil: 'domcontentloaded'
});

// Or wait for specific element
await page.goto('/admin/locations', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('h1:has-text("Locations")', { timeout: 10000 });
```

---

### 4. **Button/Form Submission** (~10-15 failures) 🟡 MEDIUM
**Problem**: Buttons disabled or forms not ready

**Tests Affected**:
- Guest form submission
- Activity form submission
- Email preview toggle (1 test failing now)
- RSVP submission

**Fix**:
```typescript
// Wait for button to be enabled
const submitButton = page.locator('button[type="submit"]');
await submitButton.waitFor({ state: 'visible' });
await expect(submitButton).toBeEnabled({ timeout: 5000 });
await submitButton.click();
```

---

### 5. **Keyboard Navigation** (~5-10 failures) 🟢 LOW
**Problem**: Focus management and tab order issues

**Tests Affected**:
- Keyboard navigation in forms (1 test failing now)
- Tab navigation in admin

**Fix**:
```typescript
// Add focus settling time
await page.keyboard.press('Tab');
await page.waitForTimeout(100);
const focused = await page.evaluate(() => document.activeElement?.tagName);
expect(['INPUT', 'SELECT', 'BUTTON']).toContain(focused);
```

---

## 📋 3-Phase Fix Plan

### Phase 1: Quick Wins (1-2 days) → 85% pass rate
**Target**: Fix ~65 tests

1. Create `__tests__/helpers/e2eWaiters.ts` with helper functions
2. Fix Pattern 1 (Dropdown Timeouts) - ~40 tests
3. Fix Pattern 3 (Page Load Timeouts) - ~15 tests  
4. Fix Pattern 4 (Button Clicks) - ~10 tests

**Files to Create**:
- `__tests__/helpers/e2eWaiters.ts` (helper functions)

**Files to Update**:
- `playwright.config.ts` (increase timeouts)
- All location hierarchy tests
- Email management preview test
- CSV import tests

---

### Phase 2: API Loading (2-3 days) → 95% pass rate
**Target**: Fix ~30 tests

1. Fix Pattern 2 (API Race Conditions) - ~25 tests
2. Add API response waiters to all data-dependent tests
3. Improve form submission waits

**Files to Update**:
- Email management tests (dropdown waits)
- Content management tests (reference waits)
- Photo upload tests (metadata waits)
- RSVP management tests (activity list waits)

---

### Phase 3: Polish (1-2 days) → 100% pass rate
**Target**: Fix ~18 tests (9 failing + 9 flaky)

1. Fix Pattern 5 (Keyboard Navigation) - ~10 tests
2. Stabilize 9 flaky tests
3. Add retry logic for transient failures

**Files to Update**:
- Keyboard navigation tests
- All flaky tests (add better waits)

---

## 🚀 Immediate Next Steps

### Step 1: Create Helper Functions (30 minutes)
```bash
# Create the helper file
touch __tests__/helpers/e2eWaiters.ts
```

Add these functions:
- `waitForDropdownOptions(page, selector, minOptions)`
- `waitForButtonEnabled(page, selector)`
- `waitForApiResponse(page, urlPattern)`

### Step 2: Update Playwright Config (5 minutes)
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000,           // Global timeout
  expect: { timeout: 10000 }, // Assertion timeout
  use: {
    actionTimeout: 15000,      // Action timeout
    navigationTimeout: 30000,  // Navigation timeout
  },
});
```

### Step 3: Fix Location Hierarchy Tests (1 hour)
These 5 tests are ALL failing due to Pattern 1. Fixing them will immediately improve pass rate by 1.5%.

**File**: `__tests__/e2e/admin/dataManagement.spec.ts`

Add before each location creation:
```typescript
await waitForDropdownOptions(page, 'select[name="parentLocationId"]', 1);
```

### Step 4: Fix Email Preview Test (15 minutes)
**File**: `__tests__/e2e/admin/emailManagement.spec.ts`

Add wait for preview section:
```typescript
await expect(page.locator('div:has-text("Preview")').first()).toBeVisible();
await page.waitForTimeout(500); // Let preview render
await previewButton.click();
```

---

## 📊 Expected Progress

| Phase | Tests Fixed | Pass Rate | Timeline |
|-------|-------------|-----------|----------|
| Current | 0 | 66.5% | - |
| Phase 1 | 65 | 85% | 1-2 days |
| Phase 2 | 30 | 95% | 2-3 days |
| Phase 3 | 18 | 100% | 1-2 days |
| **Total** | **113** | **100%** | **5-7 days** |

---

## 🎯 Success Criteria

- ✅ All 337 tests passing
- ✅ 0 flaky tests
- ✅ Average test duration <15 seconds
- ✅ No timeout errors
- ✅ Stable CI/CD pipeline

---

## 💡 Key Insights

1. **Most failures are timing issues, not bugs** - The application works, tests just don't wait properly
2. **Pattern 1 is the biggest issue** - Fixing dropdown timeouts alone improves pass rate by 15%
3. **Helper functions prevent future issues** - Reusable wait functions make tests maintainable
4. **Systematic approach is key** - Fix patterns, not individual tests
5. **Quick wins available** - Phase 1 can be completed in 1-2 days for immediate 85% pass rate

---

## 📁 Files to Create/Update

### Create:
- `__tests__/helpers/e2eWaiters.ts` - Helper functions for common wait patterns

### Update:
- `playwright.config.ts` - Increase timeouts
- `__tests__/e2e/admin/dataManagement.spec.ts` - Location hierarchy tests
- `__tests__/e2e/admin/emailManagement.spec.ts` - Email preview test
- `__tests__/e2e/admin/contentManagement.spec.ts` - Content management tests
- `__tests__/e2e/admin/photoUpload.spec.ts` - Photo upload tests
- `__tests__/e2e/admin/referenceBlocks.spec.ts` - Reference block tests
- `__tests__/e2e/admin/rsvpManagement.spec.ts` - RSVP management tests
- `__tests__/e2e/admin/navigation.spec.ts` - Navigation tests
- `__tests__/e2e/accessibility/suite.spec.ts` - Keyboard navigation test

---

## 🔗 Related Documents

- `E2E_FAILURE_PATTERNS_ANALYSIS.md` - Detailed analysis of all failure patterns
- `E2E_EMAIL_MANAGEMENT_FINAL_STATUS.md` - Email management test fixes (12/13 passing)
- `.kiro/steering/api-standards.md` - API standards that were applied to fix API routes

---

**Ready to start?** Begin with Step 1 (Create Helper Functions) and work through the phases systematically. Each phase builds on the previous one, and you'll see immediate improvements in pass rate.
