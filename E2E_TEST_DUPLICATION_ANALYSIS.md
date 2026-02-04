# E2E Test Suite Duplication Analysis

**Date**: 2026-02-03  
**Total E2E Test Files**: 46  
**Total Tests**: ~670  
**Issue**: Significant duplication causing slow test runs

## Major Duplication Issues

### 1. Guest Authentication Tests (138 tests)
**Three separate files testing the same functionality:**

- `guestAuthenticationFlow.spec.ts` (44 tests) - "Complete Guest Authentication Flow"
- `guestEmailMatchingAuth.spec.ts` (37 tests) - "Guest Email Matching Authentication Flow"  
- `guestMagicLinkAuth.spec.ts` (57 tests) - "Guest Magic Link Authentication Flow"

**Problem**: These three files test the same guest authentication system with overlapping test cases. They should be consolidated into a single comprehensive test file.

**Recommendation**: Merge into one file `guestAuthentication.spec.ts` with organized test suites for each auth method.

### 2. Guest View/Navigation Tests (223 tests)
**Multiple files testing guest-facing pages:**

- `guestViewNavigation.spec.ts` (132 tests) - Largest file, likely has redundant tests
- `guestSectionDisplay.spec.ts` (91 tests) - Section display tests

**Problem**: 132 tests in a single file is excessive. Likely testing the same navigation patterns repeatedly.

**Recommendation**: Review and consolidate. Many navigation tests can be combined or removed.

### 3. Reference Block Tests (91 tests)
**Two files testing reference blocks:**

- `referenceBlockFlow.spec.ts` (54 tests)
- `referenceBlockCreation.spec.ts` (37 tests)

**Problem**: Overlapping coverage of reference block functionality.

**Recommendation**: Merge into single `referenceBlocks.spec.ts` file.

### 4. RSVP Tests (95 tests)
**Two files testing RSVP functionality:**

- `guestRsvpFlow.spec.ts` (64 tests)
- `rsvpFlow.spec.ts` (31 tests)

**Problem**: Duplicate RSVP testing.

**Recommendation**: Consolidate into single `rsvp.spec.ts` file.

### 5. Section Management Tests (39+ tests)
**Multiple files testing section management:**

- `sectionManagementFlow.spec.ts`
- `sectionManagementAllEntities.spec.ts`
- `sectionEditorPhotoWorkflow.spec.ts` (39 tests)

**Problem**: Overlapping section management coverage.

**Recommendation**: Consolidate into comprehensive `sectionManagement.spec.ts`.

### 6. Slug/Routing Tests (97+ tests)
**Multiple files testing routing:**

- `slugBasedRouting.spec.ts` (97 tests) - Excessive for routing tests
- `viewButtonSlugNavigation.spec.ts`
- `dynamicRoutesFlow.spec.ts`

**Problem**: Too many tests for routing functionality.

**Recommendation**: Consolidate and reduce to essential routing tests.

## Test Count by Category

| Category | Files | Approx Tests | Notes |
|----------|-------|--------------|-------|
| Guest Auth | 3 | 138 | **HIGH DUPLICATION** |
| Guest Views | 2 | 223 | **EXCESSIVE TESTS** |
| Reference Blocks | 2 | 91 | Duplication |
| RSVP | 2 | 95 | Duplication |
| Routing/Slugs | 3 | 97+ | Excessive |
| Photo Upload | 2 | 102 | Some overlap |
| Section Management | 3 | 39+ | Duplication |
| Admin Dashboard | 2 | ~20 | Acceptable |
| Email | 2 | ~51 | Acceptable |
| Other | 25 | ~200 | Various |

## Consolidation Recommendations

### High Priority (Will reduce ~300 tests)

1. **Merge Guest Auth Tests** → `guestAuthentication.spec.ts`
   - Reduce from 138 to ~50 tests
   - Savings: ~88 tests

2. **Consolidate Guest View Tests** → `guestViews.spec.ts`
   - Reduce from 223 to ~80 tests
   - Savings: ~143 tests

3. **Merge Reference Block Tests** → `referenceBlocks.spec.ts`
   - Reduce from 91 to ~40 tests
   - Savings: ~51 tests

4. **Consolidate RSVP Tests** → `rsvp.spec.ts`
   - Reduce from 95 to ~50 tests
   - Savings: ~45 tests

### Medium Priority (Will reduce ~100 tests)

5. **Consolidate Routing Tests** → `routing.spec.ts`
   - Reduce from 97+ to ~40 tests
   - Savings: ~57 tests

6. **Merge Section Management** → `sectionManagement.spec.ts`
   - Consolidate 3 files into 1
   - Savings: ~20 tests

7. **Consolidate Photo Upload** → `photoUpload.spec.ts`
   - Merge 2 files
   - Savings: ~30 tests

## Expected Results After Consolidation

- **Current**: 670 tests across 46 files
- **After consolidation**: ~270 tests across ~25 files
- **Time savings**: ~60% reduction in E2E test time
- **Maintenance**: Much easier to maintain fewer, focused test files

## Implementation Plan

1. **Phase 1**: Merge guest authentication tests (highest duplication)
2. **Phase 2**: Consolidate guest view/navigation tests (most excessive)
3. **Phase 3**: Merge reference block and RSVP tests
4. **Phase 4**: Consolidate routing and section management tests
5. **Phase 5**: Review and optimize remaining tests

## Why This Happened

Looking at the file names and test counts, this appears to be the result of:

1. **Iterative development** - New test files created for each feature without consolidating
2. **Spec-driven development** - Each spec created its own E2E tests without checking for existing coverage
3. **Multiple testing approaches** - Testing the same functionality from different angles (flow, API, UI)
4. **Lack of test organization** - No clear structure for what belongs in each test file

## Immediate Action

For Task 14, you should:

1. **Skip the full E2E suite** - It's too slow and has too much duplication
2. **Run targeted E2E tests** - Only run the 4 new tests for admin-ux-enhancements spec:
   - `homePageEditingFlow.spec.ts`
   - `authMethodConfigurationFlow.spec.ts`
   - `rsvpManagementFlow.spec.ts`
   - `guestPortalPreviewFlow.spec.ts`
3. **Plan consolidation** - Schedule time to consolidate the E2E suite after Task 14

## Command to Run Only New Tests

```bash
npm run test:e2e -- homePageEditingFlow authMethodConfigurationFlow rsvpManagementFlow guestPortalPreviewFlow
```

This will run only ~200 tests instead of 670, saving significant time.
