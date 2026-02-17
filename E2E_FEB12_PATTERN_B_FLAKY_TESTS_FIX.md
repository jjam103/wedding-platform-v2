# Pattern B: Flaky Tests - Fix Strategy

**Date**: February 12, 2026  
**Pattern**: B - Flaky Tests  
**Priority**: 🔴 CRITICAL  
**Tests Affected**: 18 tests (5.0%)

---

## 📊 Flaky Tests Identified

### Category 1: Accessibility Tests (4 flaky)

#### 1. Responsive Design - Guest Pages
**Test**: `__tests__/e2e/accessibility/suite.spec.ts:646:7`  
**Name**: "should be responsive across guest pages"  
**Root Cause**: Viewport resize timing issues  
**Fix Strategy**:
- Add proper wait after viewport resize
- Wait for layout stabilization
- Use `page.waitForLoadState('networkidle')`

#### 2. Responsive Design - Touch Targets
**Test**: `__tests__/e2e/accessibility/suite.spec.ts:662:7`  
**Name**: "should have adequate touch targets on mobile"  
**Root Cause**: Mobile viewport not fully applied before checks  
**Fix Strategy**:
- Ensure viewport is set before navigation
- Add wait for CSS media queries to apply
- Verify touch target sizes after layout complete

#### 3. Data Table - Sort Direction Toggle
**Test**: `__tests__/e2e/accessibility/suite.spec.ts:853:7`  
**Name**: "should toggle sort direction and update URL"  
**Root Cause**: URL update race condition  
**Fix Strategy**:
- Wait for URL to update after sort click
- Use `page.waitForURL()` with pattern matching
- Add debounce wait for URL state

#### 4. Data Table - Restore Sort State
**Test**: `__tests__/e2e/accessibility/suite.spec.ts:888:7`  
**Name**: "should restore sort state from URL on page load"  
**Root Cause**: Page load timing vs URL parsing  
**Fix Strategy**:
- Wait for table to fully render
- Verify sort indicators are visible
- Add wait for data loading complete

---

### Category 2: Content Management Tests (4 flaky)

#### 5. Content Page Creation
**Test**: `__tests__/e2e/admin/contentManagement.spec.ts:30:7`  
**Name**: "should complete full content page creation and publication flow"  
**Root Cause**: Form submission timing, toast notifications  
**Fix Strategy**:
- Add proper waits between form steps
- Wait for toast to appear and disappear
- Verify navigation after submission

#### 6. Home Page Editing
**Test**: `__tests__/e2e/admin/contentManagement.spec.ts:252:7`  
**Name**: "should edit home page settings and save successfully"  
**Root Cause**: Save operation timing  
**Fix Strategy**:
- Wait for save button to be enabled
- Wait for success toast
- Verify data persistence after save

#### 7. Inline Section Editor - Add Sections
**Test**: `__tests__/e2e/admin/contentManagement.spec.ts:380:7`  
**Name**: "should toggle inline section editor and add sections"  
**Root Cause**: Section rendering timing  
**Fix Strategy**:
- Wait for editor to fully load
- Wait for draggable sections to appear
- Add explicit wait for section count update

#### 8. Inline Section Editor - Delete Section
**Test**: `__tests__/e2e/admin/contentManagement.spec.ts:465:7`  
**Name**: "should delete section with confirmation"  
**Root Cause**: Confirmation dialog timing  
**Fix Strategy**:
- Wait for confirmation dialog to appear
- Wait for section to be removed from DOM
- Verify section count after deletion

---

### Category 3: Data Management Tests (2 flaky)

#### 9. Room Type Capacity Validation
**Test**: `__tests__/e2e/admin/dataManagement.spec.ts:689:7`  
**Name**: "should validate capacity and display pricing"  
**Root Cause**: Validation error message timing  
**Fix Strategy**:
- Wait for validation to trigger
- Wait for error message to appear
- Add explicit timeout for validation

#### 10. Data Management Accessibility
**Test**: `__tests__/e2e/admin/dataManagement.spec.ts:744:7`  
**Name**: "should have keyboard navigation and accessible forms"  
**Root Cause**: Page navigation timing  
**Fix Strategy**:
- Wait for page to fully load before keyboard nav
- Add wait after each keyboard action
- Verify focus states are applied

---

### Category 4: Email Management Tests (5 flaky)

#### 11. Email Template with Variables
**Test**: `__tests__/e2e/admin/emailManagement.spec.ts:212:7`  
**Name**: "should use email template with variable substitution"  
**Root Cause**: Network idle timeout (30s exceeded)  
**Fix Strategy**:
- Reduce wait time or use different load state
- Wait for specific elements instead of networkidle
- Add retry logic for slow loads

#### 12. Email Preview
**Test**: `__tests__/e2e/admin/emailManagement.spec.ts:342:7`  
**Name**: "should preview email before sending"  
**Root Cause**: Modal not appearing in time  
**Fix Strategy**:
- Wait for modal to be visible
- Wait for form to be loaded
- Add explicit wait for compose button

#### 13. Schedule Email
**Test**: `__tests__/e2e/admin/emailManagement.spec.ts:453:7`  
**Name**: "should schedule email for future delivery"  
**Root Cause**: Network idle timeout  
**Fix Strategy**:
- Use 'domcontentloaded' instead of 'networkidle'
- Wait for specific UI elements
- Reduce timeout expectations

#### 14. Save Email as Draft
**Test**: `__tests__/e2e/admin/emailManagement.spec.ts:513:7`  
**Name**: "should save email as draft"  
**Root Cause**: Network idle timeout  
**Fix Strategy**:
- Same as #13
- Wait for draft saved confirmation
- Verify draft appears in list

#### 15. Email History
**Test**: `__tests__/e2e/admin/emailManagement.spec.ts:563:7`  
**Name**: "should show email history after sending"  
**Root Cause**: Modal not closing after send  
**Fix Strategy**:
- Wait for modal to close with longer timeout
- Verify send was successful
- Check for success toast before modal check

---

### Category 5: Guest Authentication Tests (3 flaky)

#### 16. Email Matching Authentication
**Test**: `__tests__/e2e/auth/guestAuth.spec.ts:157:7`  
**Name**: "should successfully authenticate with email matching"  
**Root Cause**: Navigation timeout to dashboard  
**Fix Strategy**:
- Increase navigation timeout
- Wait for dashboard elements to appear
- Add retry logic for auth flow

#### 17. Session Cookie Creation
**Test**: `__tests__/e2e/auth/guestAuth.spec.ts:261:7`  
**Name**: "should create session cookie on successful authentication"  
**Root Cause**: Navigation timeout to dashboard  
**Fix Strategy**:
- Same as #16
- Verify cookie is set before navigation check
- Add explicit wait for redirect

#### 18. Magic Link Success Message
**Test**: `__tests__/e2e/auth/guestAuth.spec.ts:357:7`  
**Name**: "should show success message after requesting magic link"  
**Root Cause**: Success message not appearing  
**Fix Strategy**:
- Wait for API call to complete
- Wait for success toast/message
- Increase timeout for message appearance

---

## 🔧 Common Fix Patterns

### Pattern 1: Network Idle Timeouts
**Problem**: `page.waitForLoadState('networkidle')` timing out at 30s  
**Solution**:
```typescript
// ❌ BAD - Can timeout
await page.waitForLoadState('networkidle');

// ✅ GOOD - More reliable
await page.waitForLoadState('domcontentloaded');
await page.waitForSelector('[data-loaded="true"]', { timeout: 15000 });
```

### Pattern 2: Modal/Dialog Timing
**Problem**: Modals not appearing before checks  
**Solution**:
```typescript
// ❌ BAD - Immediate check
await expect(page.locator('h2:has-text("Compose Email")')).toBeVisible();

// ✅ GOOD - Wait with timeout
await expect(page.locator('h2:has-text("Compose Email")')).toBeVisible({ timeout: 10000 });
await page.waitForSelector('form[data-loaded="true"]', { timeout: 15000 });
```

### Pattern 3: Navigation Timing
**Problem**: Navigation to dashboard timing out  
**Solution**:
```typescript
// ❌ BAD - Short timeout
await page.waitForURL('/guest/dashboard', { timeout: 10000 });

// ✅ GOOD - Longer timeout + fallback
await page.waitForURL('/guest/dashboard', { 
  timeout: 20000,
  waitUntil: 'domcontentloaded'
});
// Verify we're on the right page
await expect(page).toHaveURL(/\/guest\/dashboard/);
```

### Pattern 4: Form Submission Timing
**Problem**: Form submission not completing before checks  
**Solution**:
```typescript
// ❌ BAD - No wait after submit
await page.click('button[type="submit"]');
await expect(toast).toBeVisible();

// ✅ GOOD - Wait for submission
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/') && resp.status() === 200),
  page.click('button[type="submit"]')
]);
await expect(toast).toBeVisible({ timeout: 5000 });
```

### Pattern 5: Viewport Resize Timing
**Problem**: Checks happening before viewport fully applied  
**Solution**:
```typescript
// ❌ BAD - Immediate check after resize
await page.setViewportSize({ width: 375, height: 667 });
await expect(element).toBeVisible();

// ✅ GOOD - Wait for layout
await page.setViewportSize({ width: 375, height: 667 });
await page.waitForTimeout(500); // Allow CSS media queries to apply
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

---

## 📋 Fix Implementation Plan

### Phase 1: Quick Wins (1 hour)
Fix tests with simple timeout adjustments:
- Tests #11, #13, #14 (Email management - change networkidle to domcontentloaded)
- Tests #16, #17 (Guest auth - increase navigation timeout)

**Expected**: 5 tests fixed

### Phase 2: Modal/Dialog Fixes (1 hour)
Fix tests with modal timing issues:
- Tests #5, #6, #7, #8 (Content management)
- Tests #12, #15 (Email management)

**Expected**: 6 tests fixed

### Phase 3: Accessibility Fixes (1 hour)
Fix tests with viewport/layout timing:
- Tests #1, #2 (Responsive design)
- Tests #3, #4 (Data table)
- Test #10 (Data management accessibility)

**Expected**: 5 tests fixed

### Phase 4: Validation Fixes (30 minutes)
Fix remaining tests:
- Test #9 (Room type capacity)
- Test #18 (Magic link message)

**Expected**: 2 tests fixed

---

## 🎯 Success Criteria

### Per-Test Success
- [ ] Test passes 5 times in a row
- [ ] No timeout errors
- [ ] No race condition errors
- [ ] Consistent execution time

### Overall Success
- [ ] All 18 flaky tests now stable
- [ ] Pass rate increases from 64.6% to 68.2%
- [ ] Flaky test count reduces from 18 to <5
- [ ] Test suite reliability improved

---

## 📊 Expected Impact

**Current State**:
- Pass rate: 64.6% (234/362)
- Flaky tests: 18 (5.0%)

**After Phase 1** (Quick Wins):
- Pass rate: 66.0% (239/362)
- Flaky tests: 13 (3.6%)

**After Phase 2** (Modal Fixes):
- Pass rate: 67.7% (245/362)
- Flaky tests: 7 (1.9%)

**After Phase 3** (Accessibility Fixes):
- Pass rate: 69.1% (250/362)
- Flaky tests: 2 (0.6%)

**After Phase 4** (Final Fixes):
- Pass rate: 69.6% (252/362)
- Flaky tests: 0 (0%)

**Note**: These are conservative estimates. Actual pass rate may be higher if flaky tests were failing intermittently.

---

## 🚀 Next Steps

### Step 1: Start with Quick Wins
Fix the 5 email management and guest auth tests with simple timeout changes.

### Step 2: Verify Quick Wins
Run tests 5 times to verify stability.

### Step 3: Move to Modal Fixes
Fix the 6 content management and email tests with modal timing issues.

### Step 4: Continue Through Phases
Work through accessibility and validation fixes.

### Step 5: Final Verification
Run full test suite 3 times to verify all flaky tests are now stable.

---

**Status**: Ready to implement  
**Next Action**: Start Phase 1 (Quick Wins)  
**Estimated Time**: 3.5 hours total  
**Expected Result**: 68.2% pass rate, <5 flaky tests
