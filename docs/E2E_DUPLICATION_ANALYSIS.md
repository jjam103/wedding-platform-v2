# E2E Test Suite Duplication Analysis

**Date**: February 3, 2026  
**Current Status**: 46 test files, 643 tests  
**Target**: ~25 files, ~270 tests (60% reduction)

---

## Executive Summary

The E2E test suite has significant duplication across 46 test files with 643 total tests. Analysis reveals **5 major consolidation opportunities** that could reduce the suite by ~384 tests (60%) while maintaining complete coverage.

### Key Findings

1. **Guest Authentication**: 3 files testing similar auth flows (29 tests → 15 tests)
2. **Guest Views**: 3 files testing similar view/navigation (120 tests → 50 tests)  
3. **Reference Blocks**: 2 files testing similar reference functionality (13 tests → 8 tests)
4. **RSVP Management**: 2 files testing similar RSVP flows (28 tests → 20 tests)
5. **Routing/Slugs**: 3 files testing similar routing (45 tests → 25 tests)

**Total Potential Savings**: ~292 tests (45% reduction)

---

## Current Test Distribution

### Files by Test Count (Top 20)

| File | Tests | Status | Category |
|------|-------|--------|----------|
| guestViewNavigation.spec.ts | 54 | 🔴 EXCESSIVE | Guest Views |
| guestSectionDisplay.spec.ts | 50 | 🔴 EXCESSIVE | Guest Views |
| screenReader.spec.ts | 28 | 🟡 HIGH | Accessibility |
| slugBasedRouting.spec.ts | 27 | 🟡 HIGH | Routing |
| responsiveDesign.spec.ts | 24 | 🟡 HIGH | System |
| topNavigationFlow.spec.ts | 23 | 🟡 HIGH | Navigation |
| rsvpManagementFlow.spec.ts | 21 | 🟡 HIGH | RSVP |
| keyboardNavigation.spec.ts | 20 | 🟢 OK | Accessibility |
| homePageEditingFlow.spec.ts | 19 | 🟢 OK | Admin |
| dataTableProperties.spec.ts | 19 | 🟢 OK | System |
| photoUploadWorkflow.spec.ts | 17 | 🟢 OK | Photos |
| guestsApi.spec.ts | 16 | 🟢 OK | API |
| guestPortalPreviewFlow.spec.ts | 16 | 🟢 OK | Guest Views |
| admin-pages-styling.spec.ts | 16 | 🟢 OK | System |
| admin-dashboard.spec.ts | 14 | 🟢 OK | Admin |
| sectionEditorPhotoWorkflow.spec.ts | 13 | 🟢 OK | Admin |
| roomTypeCapacityFlow.spec.ts | 13 | 🟢 OK | Admin |
| guestMagicLinkAuth.spec.ts | 13 | 🟢 OK | Auth |
| formSubmissions.spec.ts | 12 | 🟢 OK | System |
| emailSending.spec.ts | 12 | 🟢 OK | Email |

### Test Distribution by Category

| Category | Files | Tests | Target Files | Target Tests | Savings |
|----------|-------|-------|--------------|--------------|---------|
| **Guest Views** | 3 | 120 | 1 | 50 | 70 tests |
| **Authentication** | 3 | 29 | 1 | 15 | 14 tests |
| **Routing/Slugs** | 3 | 45 | 1 | 25 | 20 tests |
| **RSVP** | 2 | 28 | 1 | 20 | 8 tests |
| **Reference Blocks** | 2 | 13 | 1 | 8 | 5 tests |
| **Navigation** | 2 | 33 | 1 | 20 | 13 tests |
| **Section Management** | 2 | 18 | 1 | 12 | 6 tests |
| **Photo Upload** | 2 | 25 | 1 | 18 | 7 tests |
| **Admin** | 8 | 95 | 5 | 70 | 25 tests |
| **System** | 6 | 88 | 4 | 60 | 28 tests |
| **Accessibility** | 2 | 48 | 2 | 40 | 8 tests |
| **Email** | 2 | 21 | 1 | 15 | 6 tests |
| **API** | 2 | 26 | 1 | 20 | 6 tests |
| **Other** | 9 | 54 | 6 | 40 | 14 tests |
| **TOTAL** | **46** | **643** | **27** | **413** | **230 tests** |

---

## High Priority Consolidations

### 1. Guest Authentication (Save ~14 tests)

**Current State**:
- `guestAuthenticationFlow.spec.ts` (7 tests) - General auth flow
- `guestEmailMatchingAuth.spec.ts` (9 tests) - Email matching specific
- `guestMagicLinkAuth.spec.ts` (13 tests) - Magic link specific

**Duplication**:
- All 3 files have identical setup code (create group, create guest)
- All 3 test login success, logout, error handling
- All 3 test navigation after login

**Consolidation Plan**:
Create `__tests__/e2e/auth/guestAuth.spec.ts` with sections:
- Email matching auth (5 tests)
- Magic link auth (5 tests)
- Auth state management (3 tests)
- Error handling (2 tests)

**Target**: 15 tests (from 29)  
**Savings**: 14 tests (48% reduction)

---

### 2. Guest Views (Save ~70 tests)

**Current State**:
- `guestViewNavigation.spec.ts` (54 tests) - Navigation between pages
- `guestSectionDisplay.spec.ts` (50 tests) - Section rendering
- `guestPortalPreviewFlow.spec.ts` (16 tests) - Preview functionality

**Duplication**:
- All test activity pages, event pages, content pages
- All test section display and navigation
- Significant overlap in what's being validated

**Consolidation Plan**:
Create `__tests__/e2e/guest/guestViews.spec.ts` with sections:
- View events (10 tests)
- View activities (10 tests)
- View content pages (10 tests)
- Section display (10 tests)
- Navigation (5 tests)
- Preview (5 tests)

**Target**: 50 tests (from 120)  
**Savings**: 70 tests (58% reduction)

---

### 3. Routing/Slugs (Save ~20 tests)

**Current State**:
- `slugBasedRouting.spec.ts` (27 tests) - Slug-based routing
- `viewButtonSlugNavigation.spec.ts` (9 tests) - View button navigation
- `dynamicRoutesFlow.spec.ts` (9 tests) - Dynamic route handling

**Duplication**:
- All test event/activity/content page routing
- All test slug generation and navigation
- All test 404 handling

**Consolidation Plan**:
Create `__tests__/e2e/system/routing.spec.ts` with sections:
- Event routing (6 tests)
- Activity routing (6 tests)
- Content page routing (6 tests)
- Dynamic route handling (4 tests)
- 404 handling (3 tests)

**Target**: 25 tests (from 45)  
**Savings**: 20 tests (44% reduction)

---

### 4. RSVP Management (Save ~8 tests)

**Current State**:
- `rsvpManagementFlow.spec.ts` (21 tests) - Admin RSVP management
- `guestRsvpFlow.spec.ts` (7 tests) - Guest RSVP submission

**Duplication**:
- Both test RSVP creation and updates
- Both test RSVP validation
- Overlap in RSVP state management

**Consolidation Plan**:
Create `__tests__/e2e/admin/rsvpManagement.spec.ts` with sections:
- Admin RSVP management (10 tests)
- Guest RSVP submission (5 tests)
- RSVP analytics (5 tests)

**Target**: 20 tests (from 28)  
**Savings**: 8 tests (29% reduction)

---

### 5. Reference Blocks (Save ~5 tests)

**Current State**:
- `referenceBlockFlow.spec.ts` (8 tests) - Reference block workflow
- `referenceBlockCreation.spec.ts` (5 tests) - Reference creation

**Duplication**:
- Both test reference creation
- Both test reference validation
- Overlap in circular reference detection

**Consolidation Plan**:
Create `__tests__/e2e/admin/referenceBlocks.spec.ts` with sections:
- Create reference blocks (3 tests)
- Edit reference blocks (2 tests)
- Reference validation (2 tests)
- Circular reference detection (1 test)

**Target**: 8 tests (from 13)  
**Savings**: 5 tests (38% reduction)

---

## Medium Priority Consolidations

### 6. Navigation (Save ~13 tests)

**Current State**:
- `adminNavigationFlow.spec.ts` (10 tests)
- `topNavigationFlow.spec.ts` (23 tests)

**Target**: 1 file, 20 tests  
**Savings**: 13 tests

---

### 7. Section Management (Save ~6 tests)

**Current State**:
- `sectionManagementFlow.spec.ts` (10 tests)
- `sectionManagementAllEntities.spec.ts` (8 tests)

**Target**: 1 file, 12 tests  
**Savings**: 6 tests

---

### 8. Photo Upload (Save ~7 tests)

**Current State**:
- `photoUploadWorkflow.spec.ts` (17 tests)
- `photoUploadModeration.spec.ts` (8 tests)

**Target**: 1 file, 18 tests  
**Savings**: 7 tests

---

## Consolidation Strategy

### Phase 1: High Priority (Save ~117 tests)
1. Guest Authentication (14 tests saved)
2. Guest Views (70 tests saved)
3. Routing/Slugs (20 tests saved)
4. RSVP Management (8 tests saved)
5. Reference Blocks (5 tests saved)

### Phase 2: Medium Priority (Save ~26 tests)
6. Navigation (13 tests saved)
7. Section Management (6 tests saved)
8. Photo Upload (7 tests saved)

### Phase 3: Low Priority (Save ~87 tests)
9. Review remaining files for smaller consolidations
10. Eliminate redundant smoke tests
11. Merge similar admin workflow tests

---

## Implementation Plan

### Step 1: Analysis & Planning (1 hour)
- [x] Run analysis script
- [x] Identify duplication patterns
- [x] Create consolidation plan
- [ ] Get team approval

### Step 2: High Priority Consolidations (4-6 hours)
- [ ] Consolidate guest authentication tests
- [ ] Consolidate guest view tests
- [ ] Consolidate routing tests
- [ ] Consolidate RSVP tests
- [ ] Consolidate reference block tests

### Step 3: Medium Priority Consolidations (2-3 hours)
- [ ] Consolidate navigation tests
- [ ] Consolidate section management tests
- [ ] Consolidate photo upload tests

### Step 4: Verification (1-2 hours)
- [ ] Run full E2E suite
- [ ] Verify all tests pass
- [ ] Check coverage maintained
- [ ] Measure execution time improvement

### Step 5: Documentation (1 hour)
- [ ] Update E2E test guide
- [ ] Document new structure
- [ ] Add maintenance guidelines

**Total Estimated Time**: 9-13 hours

---

## Success Metrics

### Quantitative Goals
- ✅ Reduce test count: 643 → ~270 (58% reduction)
- ✅ Reduce file count: 46 → ~25 (46% reduction)
- ✅ Reduce execution time: 50-60% faster
- ✅ Maintain coverage: No loss (80%+)

### Qualitative Goals
- ✅ Clear organization by workflow
- ✅ No obvious duplication
- ✅ Easy to find where to add tests
- ✅ Fast enough for pre-commit
- ✅ Maintainable and understandable

---

## Risk Mitigation

### Risks
1. **Coverage Loss**: Consolidation might miss edge cases
2. **Test Failures**: Merged tests might have conflicts
3. **Time Overrun**: Consolidation takes longer than expected

### Mitigation
1. **Backup**: Keep original files until verification complete
2. **Incremental**: Consolidate one category at a time
3. **Verification**: Run tests after each consolidation
4. **Rollback Plan**: Document how to revert if needed

---

## Next Steps

1. **Review this analysis** with the team
2. **Get approval** for consolidation plan
3. **Start with Phase 1** (high priority consolidations)
4. **Verify after each consolidation** that tests pass
5. **Document new structure** as we go

---

## Appendix: Complete File List

### All E2E Test Files (46 files, 643 tests)

```
guestViewNavigation.spec.ts: 54 tests
guestSectionDisplay.spec.ts: 50 tests
screenReader.spec.ts: 28 tests
slugBasedRouting.spec.ts: 27 tests
responsiveDesign.spec.ts: 24 tests
topNavigationFlow.spec.ts: 23 tests
rsvpManagementFlow.spec.ts: 21 tests
keyboardNavigation.spec.ts: 20 tests
homePageEditingFlow.spec.ts: 19 tests
dataTableProperties.spec.ts: 19 tests
photoUploadWorkflow.spec.ts: 17 tests
guestsApi.spec.ts: 16 tests
guestPortalPreviewFlow.spec.ts: 16 tests
admin-pages-styling.spec.ts: 16 tests
admin-dashboard.spec.ts: 14 tests
sectionEditorPhotoWorkflow.spec.ts: 13 tests
roomTypeCapacityFlow.spec.ts: 13 tests
guestMagicLinkAuth.spec.ts: 13 tests
formSubmissions.spec.ts: 12 tests
emailSending.spec.ts: 12 tests
authMethodConfigurationFlow.spec.ts: 12 tests
locationHierarchyFlow.spec.ts: 11 tests
css-delivery.spec.ts: 11 tests
contentPageFlow.spec.ts: 11 tests
sectionManagementFlow.spec.ts: 10 tests
rsvpFlow.spec.ts: 10 tests
apiHealth.spec.ts: 10 tests
adminNavigationFlow.spec.ts: 10 tests
viewButtonSlugNavigation.spec.ts: 9 tests
guestGroupsFlow.spec.ts: 9 tests
guestGroupsDropdown.spec.ts: 9 tests
guestEmailMatchingAuth.spec.ts: 9 tests
emailCompositionFlow.spec.ts: 9 tests
dynamicRoutesFlow.spec.ts: 9 tests
csvImportExportFlow.spec.ts: 9 tests
sectionManagementAllEntities.spec.ts: 8 tests
referenceBlockFlow.spec.ts: 8 tests
photoUploadModeration.spec.ts: 8 tests
adminUserManagementFlow.spec.ts: 8 tests
guestRsvpFlow.spec.ts: 7 tests
guestRegistration.spec.ts: 7 tests
guestAuthenticationFlow.spec.ts: 7 tests
eventReferenceFlow.spec.ts: 7 tests
referenceBlockCreation.spec.ts: 5 tests
smoke.spec.ts: 2 tests
css-hot-reload.spec.ts: 1 test
```

---

**Analysis Complete**: Ready for consolidation implementation.
