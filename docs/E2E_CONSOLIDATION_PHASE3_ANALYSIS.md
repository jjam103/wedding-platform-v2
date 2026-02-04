# E2E Test Consolidation - Phase 3 Analysis

**Date**: February 3, 2026  
**Status**: 🔍 ANALYSIS IN PROGRESS

## Current State

### Consolidated Files (8 files in organized directories)
```
__tests__/e2e/
├── admin/
│   ├── navigation.spec.ts (20 tests) ✅
│   ├── photoUpload.spec.ts (18 tests) ✅
│   ├── referenceBlocks.spec.ts (8 tests) ✅
│   ├── rsvpManagement.spec.ts (20 tests) ✅
│   └── sectionManagement.spec.ts (12 tests) ✅
├── auth/
│   └── guestAuth.spec.ts (15 tests) ✅
├── guest/
│   └── guestViews.spec.ts (56 tests) ✅
└── system/
    └── routing.spec.ts (25 tests) ✅
```

**Total Consolidated**: 174 tests in 8 files

### Remaining Files in Root Directory (30+ files)

#### Files That Should Be Deleted (Already Consolidated)
These files were source files for Phase 1 & 2 consolidations and should have been deleted:

1. `adminNavigationFlow.spec.ts` - Consolidated into `admin/navigation.spec.ts`
2. `topNavigationFlow.spec.ts` - Consolidated into `admin/navigation.spec.ts`
3. `guestViewNavigation.spec.ts` - Consolidated into `guest/guestViews.spec.ts`
4. `guestSectionDisplay.spec.ts` - Consolidated into `guest/guestViews.spec.ts`
5. `guestPortalPreviewFlow.spec.ts` - Consolidated into `guest/guestViews.spec.ts`

#### Files That Need Analysis for Phase 3

**Admin-Related Tests** (Potential: `admin/` directory):
- `admin-dashboard.spec.ts` - Admin dashboard functionality
- `admin-pages-styling.spec.ts` - Admin UI styling tests
- `adminUserManagementFlow.spec.ts` - User management (from Phase 8)
- `emailCompositionFlow.spec.ts` - Email composition (from Phase 8)
- `emailSending.spec.ts` - Email sending functionality
- `homePageEditingFlow.spec.ts` - Home page editing
- `authMethodConfigurationFlow.spec.ts` - Auth method configuration
- `contentPageFlow.spec.ts` - Content page management
- `csvImportExportFlow.spec.ts` - CSV import/export
- `eventReferenceFlow.spec.ts` - Event reference management
- `locationHierarchyFlow.spec.ts` - Location hierarchy
- `roomTypeCapacityFlow.spec.ts` - Room type capacity

**Guest-Related Tests** (Potential: `guest/` directory):
- `guestGroupsFlow.spec.ts` - Guest groups functionality
- `guestGroupsDropdown.spec.ts` - Guest groups dropdown
- `guestRegistration.spec.ts` - Guest registration flow
- `rsvpFlow.spec.ts` - Guest RSVP flow (may overlap with admin/rsvpManagement.spec.ts)

**System/Infrastructure Tests** (Potential: `system/` directory):
- `apiHealth.spec.ts` - API health checks
- `css-delivery.spec.ts` - CSS delivery tests
- `css-hot-reload.spec.ts` - CSS hot reload
- `formSubmissions.spec.ts` - Form submission tests
- `guestsApi.spec.ts` - Guests API tests
- `smoke.spec.ts` - Smoke tests

**Accessibility Tests** (Potential: `accessibility/` directory):
- `keyboardNavigation.spec.ts` - Keyboard navigation
- `screenReader.spec.ts` - Screen reader support
- `responsiveDesign.spec.ts` - Responsive design
- `dataTableProperties.spec.ts` - Data table properties

**Setup/Config Files**:
- `auth.setup.ts` - Auth setup (keep as-is)
- `README.md` - Documentation (keep as-is)
- `README_DataTable_Properties.md` - Documentation (keep as-is)

## Phase 3 Consolidation Opportunities

### Priority 1: Delete Old Consolidated Files
**Impact**: Immediate cleanup, no test changes needed  
**Files**: 5 files to delete  
**Effort**: Low (5 minutes)

Files to delete:
1. `adminNavigationFlow.spec.ts`
2. `topNavigationFlow.spec.ts`
3. `guestViewNavigation.spec.ts`
4. `guestSectionDisplay.spec.ts`
5. `guestPortalPreviewFlow.spec.ts`

### Priority 2: Admin Workflow Consolidations
**Impact**: High - Many admin-related tests scattered  
**Estimated Reduction**: 40-50% test reduction  
**Effort**: Medium-High

#### 2.1: Admin Content Management
**Target File**: `admin/contentManagement.spec.ts`  
**Source Files**:
- `contentPageFlow.spec.ts`
- `homePageEditingFlow.spec.ts`
- `eventReferenceFlow.spec.ts`

**Estimated**: 60-80 tests → 30-40 tests

#### 2.2: Admin Email Management
**Target File**: `admin/emailManagement.spec.ts`  
**Source Files**:
- `emailCompositionFlow.spec.ts`
- `emailSending.spec.ts`

**Estimated**: 40-50 tests → 20-25 tests

#### 2.3: Admin Data Management
**Target File**: `admin/dataManagement.spec.ts`  
**Source Files**:
- `csvImportExportFlow.spec.ts`
- `locationHierarchyFlow.spec.ts`
- `roomTypeCapacityFlow.spec.ts`

**Estimated**: 50-60 tests → 25-30 tests

#### 2.4: Admin User & Auth Management
**Target File**: `admin/userManagement.spec.ts`  
**Source Files**:
- `adminUserManagementFlow.spec.ts`
- `authMethodConfigurationFlow.spec.ts`

**Estimated**: 40-50 tests → 20-25 tests

### Priority 3: Guest Workflow Consolidations
**Impact**: Medium - Some guest tests scattered  
**Estimated Reduction**: 30-40% test reduction  
**Effort**: Medium

#### 3.1: Guest Groups & Registration
**Target File**: `guest/guestGroups.spec.ts`  
**Source Files**:
- `guestGroupsFlow.spec.ts`
- `guestGroupsDropdown.spec.ts`
- `guestRegistration.spec.ts`

**Estimated**: 50-60 tests → 30-35 tests

#### 3.2: Guest RSVP (if not already covered)
**Analysis Needed**: Check if `rsvpFlow.spec.ts` overlaps with `admin/rsvpManagement.spec.ts`  
**Action**: Either consolidate into existing file or keep separate if guest-specific

### Priority 4: System & Infrastructure
**Impact**: Medium - Better organization  
**Estimated Reduction**: 20-30% test reduction  
**Effort**: Low-Medium

#### 4.1: System Health & API
**Target File**: `system/health.spec.ts`  
**Source Files**:
- `apiHealth.spec.ts`
- `guestsApi.spec.ts`
- `smoke.spec.ts`

**Estimated**: 30-40 tests → 20-25 tests

#### 4.2: UI Infrastructure
**Target File**: `system/uiInfrastructure.spec.ts`  
**Source Files**:
- `css-delivery.spec.ts`
- `css-hot-reload.spec.ts`
- `formSubmissions.spec.ts`
- `admin-pages-styling.spec.ts`

**Estimated**: 40-50 tests → 25-30 tests

### Priority 5: Accessibility Tests
**Impact**: Low-Medium - Better organization  
**Estimated Reduction**: 10-20% test reduction  
**Effort**: Low

#### 5.1: Accessibility Suite
**Target File**: `accessibility/suite.spec.ts`  
**Source Files**:
- `keyboardNavigation.spec.ts`
- `screenReader.spec.ts`
- `responsiveDesign.spec.ts`
- `dataTableProperties.spec.ts`

**Estimated**: 60-70 tests → 50-55 tests

## Estimated Phase 3 Impact

### If All Priorities Completed

**Test Reduction**:
- Current remaining: ~400-500 tests (estimated)
- After Phase 3: ~250-300 tests (estimated)
- Reduction: ~40-45%

**File Reduction**:
- Current remaining: 30 files
- After Phase 3: ~10-12 files
- Reduction: ~60-65%

**Overall Project Impact** (Phases 1+2+3):
- Total tests: 724 → ~350 (51% reduction)
- Total files: 50 → ~20 (60% reduction)

## Recommended Approach

### Step 1: Immediate Cleanup (Priority 1)
Delete the 5 old consolidated files to clean up the directory.

**Effort**: 5 minutes  
**Impact**: Immediate clarity

### Step 2: High-Value Consolidations (Priority 2)
Focus on admin workflow consolidations as they have the highest impact.

**Order**:
1. Admin Content Management (2.1)
2. Admin Email Management (2.2)
3. Admin Data Management (2.3)
4. Admin User & Auth Management (2.4)

**Effort**: 2-3 hours  
**Impact**: ~150-200 tests reduced

### Step 3: Guest Consolidations (Priority 3)
Consolidate guest-related tests for better organization.

**Effort**: 1-2 hours  
**Impact**: ~20-30 tests reduced

### Step 4: System & Infrastructure (Priority 4)
Organize system and infrastructure tests.

**Effort**: 1-2 hours  
**Impact**: ~20-30 tests reduced

### Step 5: Accessibility (Priority 5)
Create dedicated accessibility test suite.

**Effort**: 30-60 minutes  
**Impact**: ~10-15 tests reduced

## Next Steps

1. **Get User Approval**: Confirm Phase 3 approach and priorities
2. **Start with Cleanup**: Delete old consolidated files
3. **Execute Priority 2**: Admin workflow consolidations
4. **Continue with Priorities 3-5**: As time permits
5. **Measure Impact**: Track test reduction and execution time
6. **Update Documentation**: Document Phase 3 progress

## Success Criteria

- ✅ Delete all old consolidated files
- ✅ Reduce remaining tests by 40%+
- ✅ Reduce remaining files by 60%+
- ✅ Maintain 100% coverage
- ✅ Improve test organization
- ✅ Reduce execution time

---

**Status**: Analysis complete, awaiting approval to proceed  
**Estimated Total Effort**: 5-8 hours  
**Estimated Impact**: 40-45% test reduction, 60-65% file reduction
