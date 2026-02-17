# Phase 1 - Skipped Tests Identified

**Date**: February 15, 2026  
**Total Skipped**: 14 tests  
**Status**: ✅ All identified

---

## All 14 Skipped Tests

### 1. Guest Authentication (1 test)
**File**: `__tests__/e2e/auth/guestAuth.spec.ts:243`
```typescript
test.skip('should show loading state during authentication', async ({ page }) => {
```
**Reason**: Likely UI/UX enhancement not yet implemented
**Action**: Review if loading states are now implemented

---

### 2. Email Management (1 test)
**File**: `__tests__/e2e/admin/emailManagement.spec.ts:610`
```typescript
test.skip('should send bulk email to all guests', async ({ page }) => {
```
**Reason**: Bulk email feature may not be fully implemented
**Action**: Check if bulk email functionality exists

---

### 3. User Management (6 tests)
**File**: `__tests__/e2e/admin/userManagement.spec.ts`

#### Test 1 (Line 38)
```typescript
test.skip('Admin user management tests require Supabase admin user creation to be enabled', () => {});
```
**Reason**: Placeholder test explaining why suite is skipped
**Action**: Remove (not a real test)

#### Test 2 (Line 45)
```typescript
test.skip('Auth method configuration tests are covered by integration tests', () => {});
```
**Reason**: Duplicate coverage in integration tests
**Action**: Remove (not a real test)

#### Test 3 (Line 47)
```typescript
test.skip('should change default auth method and bulk update guests', async ({ page }) => {
```
**Reason**: Auth method feature may not be fully implemented
**Action**: Check if auth method configuration exists

#### Test 4 (Line 90)
```typescript
test.skip('should verify new guest inherits default auth method', async ({ page }) => {
```
**Reason**: Auth method inheritance may not be implemented
**Action**: Check if inheritance logic exists

#### Test 5 (Line 137)
```typescript
test.skip('should handle API errors gracefully and disable form during save', async ({ page }) => {
```
**Reason**: Error handling may not be complete
**Action**: Test error handling behavior

#### Test 6 (Line 174)
```typescript
test.skip('should display warnings and method descriptions', async ({ page }) => {
```
**Reason**: UI warnings may not be implemented
**Action**: Check if warnings are displayed

---

### 4. System Routing (2 tests)
**File**: `__tests__/e2e/system/routing.spec.ts`

#### Test 1 (Line 397)
```typescript
test.skip('should show draft content in preview mode when authenticated', async ({ page }) => {
```
**Reason**: Draft/preview mode may not be implemented
**Action**: Check if preview mode exists

#### Test 2 (Line 493)
```typescript
test.skip('should handle query parameters correctly', async ({ page }) => {
```
**Reason**: Query parameter handling may have issues
**Action**: Test query parameter behavior

---

### 5. UI Infrastructure (1 test)
**File**: `__tests__/e2e/system/uiInfrastructure.spec.ts:226`
```typescript
test.skip('should hot reload CSS changes within 2 seconds without full page reload', async ({ page }) => {
```
**Reason**: Dev-mode only test, not applicable to production
**Action**: Remove or mark as dev-only

---

### 6. Guest Groups (3 tests)
**File**: `__tests__/e2e/guest/guestGroups.spec.ts`

#### Test 1 (Line 410)
```typescript
test.skip('should complete full guest registration flow', async ({ page }) => {
```
**Reason**: Guest registration may not be fully implemented
**Action**: Check if registration flow exists

#### Test 2 (Line 442)
```typescript
test.skip('should prevent XSS and validate form inputs', async ({ page }) => {
```
**Reason**: Security validation may not be complete
**Action**: Test XSS prevention and validation

#### Test 3 (Line 487)
```typescript
test.skip('should handle duplicate email and be keyboard accessible', async ({ page }) => {
```
**Reason**: Duplicate email handling or accessibility may not be complete
**Action**: Test duplicate email and keyboard navigation

---

## Summary by Category

| Category | Count | Action Needed |
|----------|-------|---------------|
| **Placeholder tests** | 2 | Remove (not real tests) |
| **Dev-mode only** | 1 | Remove or mark as dev-only |
| **Feature not implemented** | 8 | Check if feature exists, enable or keep skipped |
| **Needs investigation** | 3 | Test and decide |

---

## Recommended Actions

### Immediate Removal (3 tests)
1. User Management line 38 - Placeholder
2. User Management line 45 - Placeholder
3. UI Infrastructure line 226 - Dev-mode only

**Impact**: -3 skipped tests (14 → 11)

### Investigate and Enable (11 tests)
1. Guest Auth - Loading state
2. Email Management - Bulk email
3. User Management - Auth method (4 tests)
4. System Routing - Preview mode and query params (2 tests)
5. Guest Groups - Registration flow (3 tests)

**Potential Impact**: +0 to +11 passing tests (depends on implementation status)

---

## Next Steps

1. **Remove placeholder tests** (5 minutes)
   - Delete lines 38 and 45 from userManagement.spec.ts
   - Delete or comment line 226 from uiInfrastructure.spec.ts

2. **Check feature implementation** (2-3 hours)
   - Manually test each feature in the app
   - Determine if feature is implemented
   - Document findings

3. **Enable and fix tests** (2-4 hours)
   - Enable tests for implemented features
   - Fix any test issues
   - Verify tests pass

---

**Status**: ✅ All 14 skipped tests identified and categorized  
**Next Action**: Remove 3 placeholder/dev-only tests  
**Timeline**: Can complete removal in 5 minutes

