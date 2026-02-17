# E2E Pattern 7 - Full Implementation Plan

## Objective
Implement all missing features and fix all issues to get Pattern 7 tests passing at 100%.

## Current Status
- **Passing**: 3/11 tests (27.3%)
- **Skipped**: 8/11 tests (72.7%)
- **Time Estimate**: 3-4 hours

## Implementation Phases

### Phase 1: Room Type Capacity Validation (2 tests) - 30 minutes
**Missing Feature**: Form validation for invalid capacity values

**Tasks**:
1. Add Zod schema validation for room type capacity (must be > 0)
2. Update room types API to return validation errors
3. Add client-side validation in room types form
4. Display error toast when validation fails
5. Update tests to verify validation works

**Files to Modify**:
- `schemas/roomTypeSchemas.ts` (create if doesn't exist)
- `app/api/admin/accommodations/[id]/room-types/route.ts`
- `app/admin/accommodations/[id]/room-types/page.tsx`
- `services/roomTypeService.ts` (create if doesn't exist)

### Phase 2: CSV Import Functionality (2 tests) - 1.5 hours
**Missing Feature**: CSV file upload and validation

**Tasks**:
1. Create CSV import API endpoint
2. Add CSV parsing with validation
3. Fix modal overlay click interception issue
4. Add error handling for invalid CSV format
5. Display import results (success/error counts)
6. Update tests to verify import works

**Files to Modify**:
- `app/api/admin/guests/import/route.ts` (create)
- `app/admin/guests/page.tsx` (add import modal)
- `services/csvImportService.ts` (create)
- `utils/csvParser.ts` (create)

### Phase 3: Location Hierarchy API Response Handling (4 tests) - 1.5 hours
**Missing Feature**: Proper API response handling in location tree component

**Tasks**:
1. Debug location API endpoints to ensure they return proper responses
2. Fix location tree component to properly wait for API responses
3. Add loading states during location operations
4. Fix circular reference detection
5. Update tests to use proper wait strategies

**Files to Modify**:
- `app/api/admin/locations/route.ts`
- `app/admin/locations/page.tsx`
- `components/admin/LocationTree.tsx` (if exists)
- `services/locationService.ts`

### Phase 4: Test Updates and Verification (30 minutes)
**Tasks**:
1. Remove all `.skip()` markers from tests
2. Run full Pattern 7 suite
3. Fix any remaining issues
4. Document final results

## Execution Order

1. **Start with Room Type Validation** (easiest, quick win)
2. **Then Location Hierarchy** (most complex, needs debugging)
3. **Finally CSV Import** (medium complexity, new feature)
4. **Verify all tests pass**

## Success Criteria
- All 11 Pattern 7 tests passing
- No skipped tests
- Execution time < 3 minutes
- All features fully functional

## Risk Assessment
- **High Risk**: Location Hierarchy (complex tree interactions)
- **Medium Risk**: CSV Import (new feature implementation)
- **Low Risk**: Room Type Validation (simple validation logic)

## Estimated Timeline
- Phase 1: 30 minutes
- Phase 2: 1.5 hours  
- Phase 3: 1.5 hours
- Phase 4: 30 minutes
- **Total**: 4 hours

Let's begin with Phase 1 (Room Type Validation) as it's the quickest win.
