# Skipped Tests Analysis

## Summary

**Total Skipped**: 44 tests across multiple test suites

## Breakdown

### 1. Entity Creation Integration Tests (7 tests) - INTENTIONALLY SKIPPED

**File**: `__tests__/integration/entityCreation.integration.test.ts`

**Status**: All 7 tests have `.skip()` - they did NOT run

**Tests**:
1. Guest Creation - should successfully create any valid guest
2. Event Creation - should successfully create any valid event
3. Activity Creation - should successfully create any valid activity
4. Vendor Creation - should successfully create any valid vendor
5. Accommodation Creation - should successfully create any valid accommodation
6. Location Creation - should successfully create any valid location
7. Cross-Entity Creation Consistency - should maintain consistent creation behavior

**Why Skipped**: These are property-based integration tests that were originally skipped because:
- They require a real database (not mocks)
- They were waiting for the dedicated test database setup
- They have `.skip()` in the code

**Database Status**: ✅ Dedicated test database is NOW ready and configured

**Action Needed**: Remove `.skip()` from these tests to enable them

### 2. Component Tests (37 tests) - CONDITIONALLY SKIPPED

**Pattern**: Various component tests with conditional skips

**Examples**:
- "should display capacity utilization in form help text when editing"
- "should filter locations by search query"
- "should not delete if confirmation cancelled"
- "should display error message on load failure"
- "should close form and clear fields after successful creation"
- "should display LocationSelector in the form"
- "should display conflict error when scheduling conflict occurs"
- "should clear conflict error when form is reopened"
- Payment validation tests
- Accessibility tests for guest components
- External service error tests

**Why Skipped**: These appear to be skipped due to:
- Missing mock data
- Component rendering issues
- Test environment setup issues
- Intentional skips for incomplete features

## Recommendations

### High Priority: Enable Entity Creation Tests

The dedicated test database is ready. We should enable these 7 tests:

**Steps**:
1. Remove `.skip()` from all tests in `entityCreation.integration.test.ts`
2. Add the missing arbitraries (validGuestArbitrary, validEventArbitrary, etc.)
3. Run the tests to verify they work with the dedicated database

**Expected Outcome**: 
- 7 additional tests running
- Property-based validation of entity creation
- Real database integration testing

### Medium Priority: Review Component Skips

Many component tests are skipped. These should be reviewed to determine:
- Are they intentionally skipped (incomplete features)?
- Are they skipped due to test issues (should be fixed)?
- Are they skipped due to missing mocks (should be fixed)?

## Current Test Status

### Before Enabling Entity Creation Tests
- **Total Tests**: 3,355
- **Passing**: 2,985 (89%)
- **Skipped**: 44 (1.3%)
- **Failed**: 326 (9.7%)

### After Enabling Entity Creation Tests (Estimated)
- **Total Tests**: 3,355 (same, tests already counted)
- **Passing**: 2,992 (89.2%) - assuming 7 new tests pass
- **Skipped**: 37 (1.1%)
- **Failed**: 326 (9.7%)

## Entity Creation Test Details

### What These Tests Do

Property-based tests that validate:
1. **Guest Creation**: Creates random valid guests and verifies they're stored correctly
2. **Event Creation**: Creates random valid events and verifies properties
3. **Activity Creation**: Creates random valid activities with various configurations
4. **Vendor Creation**: Creates vendors with different pricing models
5. **Accommodation Creation**: Creates accommodations with various attributes
6. **Location Creation**: Creates locations in the hierarchy
7. **Cross-Entity Consistency**: Validates all entity types have consistent creation behavior

### Why They're Important

These tests:
- ✅ Validate real database integration
- ✅ Test RLS policies with actual data
- ✅ Verify entity creation works across all types
- ✅ Use property-based testing to find edge cases
- ✅ Run 20 iterations per test (140 total entity creations)

### Requirements

To enable these tests, we need to:
1. Define the arbitraries (data generators) for each entity type
2. Remove `.skip()` from the tests
3. Ensure `.env.test.dedicated` is loaded

## Next Steps

### Option 1: Enable Entity Creation Tests Now

**Pros**:
- Test the dedicated database setup
- Validate RLS policies work correctly
- Get property-based test coverage
- Verify entity creation across all types

**Cons**:
- Need to create arbitraries (30-60 minutes work)
- May discover database issues that need fixing

**Estimated Time**: 1-2 hours

### Option 2: Leave Skipped for Now

**Pros**:
- Focus on fixing component test failures first
- Database is ready when needed

**Cons**:
- Not testing the dedicated database we just set up
- Missing property-based test coverage

## Recommendation

**Enable the entity creation tests** to validate the dedicated database setup is working correctly. This will:
1. Confirm all migrations applied successfully
2. Verify RLS policies work as expected
3. Test real database integration
4. Provide property-based test coverage

The arbitraries can be created quickly using the existing schemas and factories.
