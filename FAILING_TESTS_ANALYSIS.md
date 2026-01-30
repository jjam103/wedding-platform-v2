# Failing Tests Analysis - Complete Report

**Date**: January 29, 2026  
**Test Run Duration**: 123.4 seconds (~2 minutes)

## Executive Summary

- **Test Suites**: 47 failed, 3 skipped, 143 passed (190 of 193 total)
- **Tests**: 338 failed, 28 skipped, 2,739 passed (3,105 total)
- **Pass Rate**: 88.1% (2,739 / 3,105)
- **Build Status**: ✅ PASSING (0 TypeScript errors)

## Critical Issues

### 1. Missing Dependency
**Issue**: `@testing-library/user-event` not installed  
**Impact**: 1 test suite cannot run  
**Priority**: CRITICAL  
**Fix Time**: 5 minutes

```bash
npm install --save-dev @testing-library/user-event
```

**Affected Files**:
- `components/ui/ConfirmDialog.test.tsx`

### 2. Worker Process Crashes
**Issue**: Jest worker processes terminated with SIGTERM  
**Impact**: Integration tests failing unpredictably  
**Priority**: HIGH  
**Fix Time**: 2-3 hours

**Affected Files**:
- `__tests__/integration/roomTypesApi.integration.test.ts`
- Other integration tests intermittently

**Root Cause**: Likely circular dependencies or memory issues in test setup

### 3. Date Formatting Errors
**Issue**: Invalid date values causing `RangeError: Invalid time value`  
**Impact**: 10+ audit log tests failing  
**Priority**: HIGH  
**Fix Time**: 30 minutes

**Affected Files**:
- `app/admin/audit-logs/page.test.tsx` (10 tests)

**Root Cause**: Mock data contains invalid date strings that cannot be parsed by `Date` constructor

### 4. API Mock Response Format
**Issue**: Mock responses not implementing proper Response interface  
**Impact**: Multiple tests expecting `.json()` method  
**Priority**: HIGH  
**Fix Time**: 1 hour

**Error**: `response.json is not a function`

**Affected Tests**: Multiple API-related tests

## Failing Test Suites by Category

### Component Tests (15 failed suites)

#### 1. app/admin/audit-logs/page.test.tsx (10 failures)
**Issue**: Invalid date formatting in mock data  
**Tests Failing**:
- ✗ should render audit logs table with data
- ✗ should display user email in table
- ✗ should display pagination when multiple pages exist
- ✗ should disable Previous button on first page
- ✗ should call export API when export button clicked
- ✗ should display error message on API error
- ✗ should display empty message when no logs found
- ✗ And 3 more...

**Fix**: Update mock data to use valid ISO date strings

#### 2. components/ui/ConfirmDialog.test.tsx (Suite failed to run)
**Issue**: Missing `@testing-library/user-event` dependency  
**Fix**: Install missing package

#### 3. app/admin/rsvp-analytics/page.test.tsx
**Issue**: API mock response format  
**Tests Failing**: Multiple tests expecting proper Response object

#### 4. app/admin/transportation/page.tsx
**Issue**: Component rendering or mock setup issues  
**Tests Failing**: Multiple tests

#### 5. app/admin/vendors/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 6. app/admin/budget/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 7. app/admin/accommodations/[id]/room-types/page.test.tsx
**Issue**: Dynamic route parameter handling  
**Tests Failing**: Multiple tests

#### 8. app/admin/accommodations/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 9. app/admin/guests/page.modal.test.tsx
**Issue**: Modal interaction tests  
**Tests Failing**: Multiple tests

#### 10. app/admin/guests/page.filtering.test.tsx
**Issue**: Filter functionality tests  
**Tests Failing**: Multiple tests

#### 11. app/admin/activities/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 12. app/admin/events/page.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 13. app/admin/locations/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 14. app/admin/home-page/page.test.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

#### 15. app/admin/content-pages/page.tsx
**Issue**: Mock setup or component state issues  
**Tests Failing**: Multiple tests

### Integration Tests (5 failed suites)

#### 1. __tests__/integration/roomTypesApi.integration.test.ts
**Issue**: Worker process crash (SIGTERM)  
**Fix**: Refactor to mock services instead of importing directly

#### 2. __tests__/integration/locationsApi.integration.test.ts
**Issue**: Likely worker crash or mock setup  
**Fix**: Verify service mocking pattern

#### 3. __tests__/integration/homePageApi.integration.test.ts
**Issue**: Likely worker crash or mock setup  
**Fix**: Verify service mocking pattern

#### 4. __tests__/integration/sectionsApi.integration.test.ts
**Issue**: Likely worker crash or mock setup  
**Fix**: Verify service mocking pattern

#### 5. __tests__/integration/contentPagesApi.integration.test.ts
**Issue**: Likely worker crash or mock setup  
**Fix**: Verify service mocking pattern

### Service Tests (10 failed suites)

#### 1. services/emailService.test.ts (3 failures)
**Status**: 31/34 tests passing (91% pass rate)  
**Issues**:
- Email sending with attachments
- Template variable substitution edge cases
- Delivery tracking webhook handling

#### 2. services/externalServiceGracefulDegradation.test.ts (7 failures)
**Status**: Low pass rate (13%)  
**Issues**:
- B2 Storage failover tests
- Email to SMS fallback tests
- S3Client mocking issues

#### 3. services/accommodationService.test.ts
**Status**: Blocked - requires service refactoring  
**Issue**: Per-function client creation pattern prevents proper mocking

#### 4. services/budgetService.test.ts
**Status**: Paused - mock not being called  
**Issue**: ES module import hoisting problem

#### 5. services/photoService.test.ts
**Status**: May have residual issues  
**Issue**: Upload operations, moderation workflow

#### 6. services/smsService.test.ts
**Status**: 22/24 passing (92% pass rate, 2 skipped)  
**Issue**: Configuration validation tests skipped

#### 7. services/rsvpService.test.ts
**Status**: Should be passing with Pattern A  
**Issue**: Verify all tests pass

#### 8. services/eventService.test.ts
**Status**: Should be passing with Pattern A  
**Issue**: Verify all tests pass

#### 9. services/locationService.test.ts
**Status**: Should be passing with Pattern A  
**Issue**: Verify all tests pass

#### 10. services/vendorBookingService.test.ts
**Status**: Unknown failures  
**Issue**: Need to investigate

### Property-Based Tests (10 failed suites)

#### 1. services/activityCapacityAlert.property.test.ts
**Issue**: Property test data generation or assertions

#### 2. services/eventSchedulingConflict.property.test.ts
**Issue**: Property test data generation or assertions

#### 3. services/referenceSearch.searchResultOrdering.property.test.ts
**Issue**: Property test data generation or assertions

#### 4. services/sectionsService.circularReferenceDetectionAPI.property.test.ts
**Issue**: Property test data generation or assertions

#### 5. services/sectionsService.referenceValidationAPI.property.test.ts
**Issue**: Property test data generation or assertions

#### 6. services/sectionsService.brokenReferenceDetection.property.test.ts
**Issue**: Property test data generation or assertions

#### 7. services/sectionsService.referenceValidation.property.test.ts
**Issue**: Property test data generation or assertions

#### 8. services/contentPagesService.cascadeDeletion.property.test.ts
**Issue**: Property test data generation or assertions

#### 9. services/contentPagesService.slugPreservation.property.test.ts
**Issue**: Property test data generation or assertions

#### 10. services/contentPagesService.uniqueSlug.property.test.ts
**Issue**: Property test data generation or assertions

### Regression Tests (2 failed suites)

#### 1. __tests__/regression/authentication.regression.test.ts (16 failures)
**Issue**: Supabase mock setup for auth methods  
**Tests Failing**:
- signInWithPassword tests
- signInWithMagicLink tests
- Session management tests
- Role-based access control tests
- Session security tests

#### 2. __tests__/regression/emailDelivery.regression.test.ts (17 failures)
**Issue**: Supabase mock setup for email operations  
**Tests Failing**:
- Template validation tests
- Variable substitution tests
- Email sending tests
- Bulk email tests
- Delivery tracking tests
- SMS fallback tests
- Email scheduling tests

### Hook Tests (2 failed suites)

#### 1. hooks/useRoomTypes.test.ts
**Issue**: Hook state management or mock setup

#### 2. hooks/useLocations.test.ts
**Issue**: Hook state management or mock setup

### Component Library Tests (3 failed suites)

#### 1. components/admin/LocationSelector.test.tsx
**Issue**: Component rendering or interaction

#### 2. components/admin/PhotoPicker.test.tsx
**Issue**: Component rendering or interaction

#### 3. components/admin/SectionEditor.tsx
**Issue**: Component rendering or interaction

## Failure Patterns

### Pattern 1: Invalid Date Formatting
**Count**: ~10 tests  
**Root Cause**: Mock data with invalid date strings  
**Solution**: Use valid ISO 8601 date strings in mocks

```typescript
// ❌ WRONG
const mockData = { created_at: 'invalid-date' };

// ✅ CORRECT
const mockData = { created_at: new Date().toISOString() };
```

### Pattern 2: API Mock Response Format
**Count**: ~20 tests  
**Root Cause**: Mocks not implementing Response interface  
**Solution**: Use proper Response mock with `.json()` method

```typescript
// ❌ WRONG
global.fetch = jest.fn().mockResolvedValue({ data: {} });

// ✅ CORRECT
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: {} }),
});
```

### Pattern 3: Worker Process Crashes
**Count**: ~5 test suites  
**Root Cause**: Direct service imports causing circular dependencies  
**Solution**: Mock services at module level

```typescript
// ❌ WRONG
import * as locationService from '@/services/locationService';

// ✅ CORRECT
jest.mock('@/services/locationService', () => ({
  create: jest.fn(),
  list: jest.fn(),
}));
```

### Pattern 4: Missing Dependencies
**Count**: 1 test suite  
**Root Cause**: Package not installed  
**Solution**: Install missing packages

```bash
npm install --save-dev @testing-library/user-event
```

## Priority Fix Order

### Immediate (< 1 hour)
1. **Install missing dependency** (5 min)
   - `npm install --save-dev @testing-library/user-event`
   - Fixes: 1 test suite

2. **Fix date formatting in audit logs** (30 min)
   - Update mock data with valid ISO dates
   - Fixes: 10 tests

3. **Fix API mock response format** (1 hour)
   - Implement proper Response interface in mocks
   - Fixes: ~20 tests

### High Priority (2-4 hours)
4. **Fix worker process crashes** (2-3 hours)
   - Refactor integration tests to mock services
   - Fixes: 5 test suites

5. **Fix regression tests** (2-3 hours)
   - Update Supabase auth mocks
   - Update email service mocks
   - Fixes: 33 tests

### Medium Priority (4-8 hours)
6. **Fix component tests** (4-6 hours)
   - Fix mock setup across 15 component test suites
   - Standardize component testing patterns
   - Fixes: ~100 tests

7. **Fix property-based tests** (2-3 hours)
   - Fix data generation issues
   - Fix assertion logic
   - Fixes: 10 test suites

### Lower Priority (2-4 hours)
8. **Fix service tests** (2-3 hours)
   - Complete emailService fixes
   - Fix externalServiceGracefulDegradation
   - Fixes: 10 tests

9. **Fix hook and component library tests** (1-2 hours)
   - Fix 5 remaining test suites
   - Fixes: ~20 tests

## Estimated Total Fix Time

- **Immediate**: 1.5 hours → Fixes ~31 tests
- **High Priority**: 5-6 hours → Fixes ~38 tests
- **Medium Priority**: 6-9 hours → Fixes ~110 tests
- **Lower Priority**: 3-5 hours → Fixes ~30 tests

**Total**: 15.5-21.5 hours to fix all 338 failing tests

## Success Metrics

### Current State
- ✅ Build: PASSING (0 TypeScript errors)
- ⚠️ Tests: 88.1% passing (2,739 / 3,105)
- ⚠️ Test Suites: 75.4% passing (143 / 190)

### Target State
- ✅ Build: PASSING
- ✅ Tests: 100% passing (3,105 / 3,105)
- ✅ Test Suites: 100% passing (193 / 193)

### Milestones
1. **90% Pass Rate**: Fix immediate issues (~1.5 hours)
2. **95% Pass Rate**: Fix high priority issues (~7 hours)
3. **98% Pass Rate**: Fix medium priority issues (~16 hours)
4. **100% Pass Rate**: Fix all remaining issues (~21 hours)

## Next Steps

1. **Install missing dependency** (NOW)
2. **Fix audit logs date formatting** (TODAY)
3. **Fix API mock response format** (TODAY)
4. **Fix worker crashes** (THIS WEEK)
5. **Fix regression tests** (THIS WEEK)
6. **Fix component tests** (NEXT WEEK)
7. **Fix property tests** (NEXT WEEK)
8. **Fix remaining service/hook tests** (NEXT WEEK)

## Documentation

This analysis has been saved to:
- `FAILING_TESTS_ANALYSIS.md` (this file)
- Test output: `test-results-current.log`

## Related Documents

- `TEST_SUITE_EXECUTION_SUMMARY.md` - Initial test run analysis
- `INTEGRATION_TEST_FIXES_SUMMARY.md` - Integration test refactoring
- `TEST_COVERAGE_REPORT.md` - Coverage analysis
- `docs/TESTING_PATTERN_A_GUIDE.md` - Service testing patterns
