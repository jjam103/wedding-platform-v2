# E2E Test Suite Consolidation Process

**Goal**: Ensure complete E2E test coverage while eliminating duplication for efficient test execution before manual testing.

**Current State**: 670 tests across 46 files  
**Target State**: ~270 tests across ~25 files  
**Expected Time Savings**: ~60% reduction in E2E test execution time

---

## Phase 1: Inventory & Analysis (1-2 hours)

### Step 1.1: Create Test Coverage Matrix

Create a spreadsheet or document mapping:

1. **User Workflows** (what users actually do)
2. **Current Test Files** (which files test each workflow)
3. **Test Count** (how many tests per file)
4. **Duplication Score** (how much overlap exists)

**Template**:

```
| Workflow | Files Testing It | Total Tests | Duplication? |
|----------|------------------|-------------|--------------|
| Guest Login | guestAuthenticationFlow.spec.ts, guestEmailMatchingAuth.spec.ts, guestMagicLinkAuth.spec.ts | 138 | HIGH |
| Admin CRUD Operations | Multiple | X | MEDIUM |
```

### Step 1.2: Identify Critical User Journeys

List the **essential user workflows** that MUST be tested:

**Admin Workflows**:
- Login and authentication
- Create/edit/delete guests
- Create/edit/delete events
- Create/edit/delete activities
- Manage RSVPs
- Upload and manage photos
- Create/edit content pages
- Manage sections and references
- Configure settings
- Send emails

**Guest Workflows**:
- Login (email matching + magic link)
- View events and activities
- Submit RSVPs
- View itinerary
- Upload photos
- View content pages

**System Workflows**:
- Navigation (admin + guest)
- Form submissions
- Data validation
- Error handling
- Responsive design
- Accessibility

### Step 1.3: Map Tests to Workflows

For each test file, document:
- What workflow(s) it covers
- What specific scenarios it tests
- Whether those scenarios are tested elsewhere

---

## Phase 2: Define Consolidation Strategy (30 minutes)

### Step 2.1: Establish File Naming Convention

**New Structure**:
```
__tests__/e2e/
├── auth/
│   ├── adminAuth.spec.ts          # Admin login/logout
│   └── guestAuth.spec.ts          # Both email matching + magic link
├── admin/
│   ├── guestManagement.spec.ts    # CRUD for guests
│   ├── eventManagement.spec.ts    # CRUD for events
│   ├── activityManagement.spec.ts # CRUD for activities
│   ├── rsvpManagement.spec.ts     # RSVP workflows
│   ├── photoManagement.spec.ts    # Photo upload/moderation
│   ├── contentManagement.spec.ts  # Pages + sections
│   ├── referenceBlocks.spec.ts    # Reference system
│   ├── emailComposition.spec.ts   # Email workflows
│   └── settings.spec.ts           # Settings configuration
├── guest/
│   ├── guestViews.spec.ts         # View events/activities/pages
│   ├── guestRsvp.spec.ts          # RSVP submission
│   ├── guestItinerary.spec.ts     # Itinerary viewing
│   └── guestPhotos.spec.ts        # Photo uploads
├── navigation/
│   ├── adminNavigation.spec.ts    # Admin navigation
│   └── guestNavigation.spec.ts    # Guest navigation
├── forms/
│   └── formSubmissions.spec.ts    # Form validation
├── system/
│   ├── routing.spec.ts            # Slug-based routing
│   ├── responsive.spec.ts         # Responsive design
│   ├── accessibility.spec.ts      # A11y compliance
│   └── errorHandling.spec.ts      # Error states
└── smoke/
    └── smoke.spec.ts              # Quick smoke tests
```

### Step 2.2: Define Test Scope Per File

**Rule**: Each file should test ONE primary workflow with 10-15 tests maximum.

**Test Structure**:
```typescript
describe('Workflow Name', () => {
  // Setup
  beforeEach(() => { /* common setup */ });
  
  // Happy path (2-3 tests)
  describe('Happy Path', () => {
    test('should complete primary workflow successfully');
    test('should handle secondary workflow successfully');
  });
  
  // Edge cases (3-5 tests)
  describe('Edge Cases', () => {
    test('should handle empty state');
    test('should handle maximum values');
    test('should handle special characters');
  });
  
  // Error handling (2-3 tests)
  describe('Error Handling', () => {
    test('should show validation errors');
    test('should handle server errors gracefully');
  });
  
  // Integration (2-3 tests)
  describe('Integration', () => {
    test('should integrate with related feature A');
    test('should integrate with related feature B');
  });
});
```

---

## Phase 3: Consolidation Execution (4-6 hours)

### Step 3.1: High Priority Consolidations

#### 3.1.1: Guest Authentication (Save ~88 tests)

**Current**: 3 files, 138 tests
**Target**: 1 file, 50 tests

**Action Plan**:
1. Create `__tests__/e2e/auth/guestAuth.spec.ts`
2. Review all 3 existing files
3. Extract unique test scenarios
4. Organize into:
   - Email matching auth (15 tests)
   - Magic link auth (15 tests)
   - Auth state management (10 tests)
   - Error handling (10 tests)
5. Delete old files:
   - `guestAuthenticationFlow.spec.ts`
   - `guestEmailMatchingAuth.spec.ts`
   - `guestMagicLinkAuth.spec.ts`

**Verification**:
```bash
npm run test:e2e -- auth/guestAuth.spec.ts
```

#### 3.1.2: Guest Views (Save ~143 tests)

**Current**: 2 files, 223 tests
**Target**: 1 file, 80 tests

**Action Plan**:
1. Create `__tests__/e2e/guest/guestViews.spec.ts`
2. Review `guestViewNavigation.spec.ts` (132 tests) - identify redundant navigation tests
3. Review `guestSectionDisplay.spec.ts` (91 tests)
4. Consolidate into:
   - View events (15 tests)
   - View activities (15 tests)
   - View content pages (15 tests)
   - Section display (15 tests)
   - Navigation between views (10 tests)
   - Responsive behavior (10 tests)
5. Delete old files

**Verification**:
```bash
npm run test:e2e -- guest/guestViews.spec.ts
```

#### 3.1.3: Reference Blocks (Save ~51 tests)

**Current**: 2 files, 91 tests
**Target**: 1 file, 40 tests

**Action Plan**:
1. Create `__tests__/e2e/admin/referenceBlocks.spec.ts`
2. Merge `referenceBlockFlow.spec.ts` + `referenceBlockCreation.spec.ts`
3. Organize into:
   - Create reference blocks (10 tests)
   - Edit reference blocks (10 tests)
   - Reference validation (10 tests)
   - Circular reference detection (10 tests)
4. Delete old files

#### 3.1.4: RSVP Management (Save ~45 tests)

**Current**: 2 files, 95 tests
**Target**: 1 file, 50 tests

**Action Plan**:
1. Create `__tests__/e2e/admin/rsvpManagement.spec.ts`
2. Merge `guestRsvpFlow.spec.ts` + `rsvpFlow.spec.ts`
3. Organize into:
   - Admin RSVP management (20 tests)
   - Guest RSVP submission (20 tests)
   - RSVP analytics (10 tests)
4. Delete old files

#### 3.1.5: Routing/Slugs (Save ~57 tests)

**Current**: 3 files, 97+ tests
**Target**: 1 file, 40 tests

**Action Plan**:
1. Create `__tests__/e2e/system/routing.spec.ts`
2. Review `slugBasedRouting.spec.ts` (97 tests) - likely testing same routes repeatedly
3. Consolidate into:
   - Event routing (10 tests)
   - Activity routing (10 tests)
   - Content page routing (10 tests)
   - Dynamic route handling (10 tests)
4. Delete old files

### Step 3.2: Medium Priority Consolidations

#### 3.2.1: Section Management (Save ~20 tests)

**Current**: 3 files
**Target**: 1 file, 30 tests

Merge:
- `sectionManagementFlow.spec.ts`
- `sectionManagementAllEntities.spec.ts`
- `sectionEditorPhotoWorkflow.spec.ts`

Into: `__tests__/e2e/admin/contentManagement.spec.ts`

#### 3.2.2: Photo Upload (Save ~30 tests)

**Current**: 2 files, 102 tests
**Target**: 1 file, 70 tests

Merge:
- `photoUploadWorkflow.spec.ts`
- `photoUploadModeration.spec.ts`

Into: `__tests__/e2e/admin/photoManagement.spec.ts`

#### 3.2.3: Navigation (Save ~20 tests)

**Current**: 3 files
**Target**: 2 files

Merge:
- `adminNavigationFlow.spec.ts`
- `topNavigationFlow.spec.ts`

Into: `__tests__/e2e/navigation/adminNavigation.spec.ts`

Keep `guestNavigation.spec.ts` separate (after consolidation with guest views)

---

## Phase 4: Quality Assurance (2-3 hours)

### Step 4.1: Coverage Verification

For each consolidated file, verify it covers:

**Checklist**:
- [ ] Happy path workflow
- [ ] Primary edge cases
- [ ] Error handling
- [ ] Validation
- [ ] Integration with related features
- [ ] No duplicate scenarios from other files

### Step 4.2: Run Consolidated Tests

```bash
# Run each new file individually
npm run test:e2e -- auth/guestAuth.spec.ts
npm run test:e2e -- guest/guestViews.spec.ts
npm run test:e2e -- admin/referenceBlocks.spec.ts
npm run test:e2e -- admin/rsvpManagement.spec.ts
npm run test:e2e -- system/routing.spec.ts

# Run full suite
npm run test:e2e
```

### Step 4.3: Performance Verification

**Measure**:
- Time to run old suite: ~X minutes
- Time to run new suite: ~Y minutes
- Reduction: (X-Y)/X * 100%

**Target**: 50-60% reduction

### Step 4.4: Coverage Comparison

```bash
# Generate coverage report
npm run test:e2e -- --coverage

# Compare:
# - Old suite coverage: X%
# - New suite coverage: Y%
# - Ensure Y >= X (no coverage loss)
```

---

## Phase 5: Documentation & Maintenance (1 hour)

### Step 5.1: Update Test Documentation

Create `docs/E2E_TEST_GUIDE.md`:

```markdown
# E2E Test Guide

## Test Organization

Our E2E tests are organized by user workflow:

### Auth Tests (`__tests__/e2e/auth/`)
- `adminAuth.spec.ts`: Admin authentication
- `guestAuth.spec.ts`: Guest authentication (email + magic link)

### Admin Tests (`__tests__/e2e/admin/`)
- `guestManagement.spec.ts`: Guest CRUD operations
- `eventManagement.spec.ts`: Event CRUD operations
- ... (list all files)

## Adding New Tests

1. Identify the workflow being tested
2. Find the appropriate test file
3. Add test to relevant describe block
4. Keep tests focused and minimal
5. Avoid duplication

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific workflow
npm run test:e2e -- auth/guestAuth

# Run specific test
npm run test:e2e -- auth/guestAuth -t "should login with email matching"
```

## Test Principles

1. **One workflow per file**: Each file tests one primary user workflow
2. **10-15 tests maximum**: Keep files focused and fast
3. **No duplication**: If a scenario is tested elsewhere, don't repeat it
4. **Integration over isolation**: Test real user workflows, not isolated components
5. **Fast execution**: Target <5 minutes for full suite
```

### Step 5.2: Create Test Maintenance Guidelines

Add to `.kiro/steering/testing-standards.md`:

```markdown
## E2E Test Maintenance

### Before Adding New E2E Tests

1. **Check for existing coverage**: Search existing E2E tests for similar scenarios
2. **Identify the workflow**: Determine which user workflow you're testing
3. **Find the right file**: Add to existing file if workflow matches
4. **Keep it minimal**: Only test what can't be tested at lower levels
5. **Avoid duplication**: Don't test the same scenario multiple times

### E2E Test Limits

- **Maximum tests per file**: 15
- **Maximum test files**: 30
- **Target execution time**: <5 minutes for full suite
- **Coverage target**: 80% of critical user workflows

### When to Create New E2E Test File

Only create a new file if:
1. Testing a completely new user workflow
2. Existing files are at capacity (15 tests)
3. The workflow doesn't fit existing categories

### E2E Test Review Checklist

Before merging E2E tests:
- [ ] No duplication with existing tests
- [ ] Tests real user workflow (not isolated component)
- [ ] File has <15 tests
- [ ] Tests run in <30 seconds
- [ ] Tests are independent (no shared state)
- [ ] Tests clean up after themselves
```

### Step 5.3: Update package.json Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:auth": "playwright test auth/",
    "test:e2e:admin": "playwright test admin/",
    "test:e2e:guest": "playwright test guest/",
    "test:e2e:system": "playwright test system/",
    "test:e2e:smoke": "playwright test smoke/",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## Phase 6: Continuous Monitoring (Ongoing)

### Step 6.1: Set Up Test Metrics

Track:
- **Test count**: Should stay ~270 or less
- **Execution time**: Should stay <5 minutes
- **Duplication score**: Run analysis monthly
- **Coverage**: Should maintain 80%+

### Step 6.2: Monthly Review Process

**Schedule**: First Monday of each month

**Process**:
1. Run duplication analysis script
2. Review test count per file
3. Identify files exceeding 15 tests
4. Check for new duplication
5. Consolidate if needed

### Step 6.3: Automated Checks

Create `.github/workflows/e2e-health-check.yml`:

```yaml
name: E2E Test Health Check

on:
  pull_request:
    paths:
      - '__tests__/e2e/**'

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Count E2E tests
        run: |
          TOTAL_TESTS=$(grep -r "test\|it(" __tests__/e2e/*.spec.ts | wc -l)
          echo "Total E2E tests: $TOTAL_TESTS"
          if [ $TOTAL_TESTS -gt 300 ]; then
            echo "❌ E2E test count exceeds limit (300)"
            exit 1
          fi
      
      - name: Check file test counts
        run: |
          for file in __tests__/e2e/**/*.spec.ts; do
            COUNT=$(grep -c "test\|it(" "$file" || echo 0)
            if [ $COUNT -gt 20 ]; then
              echo "❌ $file has $COUNT tests (limit: 20)"
              exit 1
            fi
          done
      
      - name: Check for duplicate test names
        run: |
          DUPLICATES=$(grep -rh "test\|it(" __tests__/e2e/*.spec.ts | sort | uniq -d)
          if [ ! -z "$DUPLICATES" ]; then
            echo "❌ Duplicate test names found:"
            echo "$DUPLICATES"
            exit 1
          fi
```

---

## Success Criteria

### Quantitative Metrics

- [ ] Test count reduced from 670 to ~270 (60% reduction)
- [ ] File count reduced from 46 to ~25 (46% reduction)
- [ ] Execution time reduced by 50-60%
- [ ] No loss in test coverage (maintain 80%+)
- [ ] All tests passing

### Qualitative Metrics

- [ ] Clear test organization by workflow
- [ ] No obvious duplication
- [ ] Easy to find where to add new tests
- [ ] Fast enough to run before every commit
- [ ] Maintainable and understandable

---

## Rollback Plan

If consolidation causes issues:

1. **Keep old files**: Don't delete until new files are verified
2. **Git branches**: Do consolidation in feature branch
3. **Incremental approach**: Consolidate one category at a time
4. **Verification**: Run both old and new tests in parallel initially
5. **Rollback**: Revert to old files if coverage drops or tests fail

---

## Timeline

**Total Estimated Time**: 8-12 hours

- **Phase 1** (Inventory): 1-2 hours
- **Phase 2** (Strategy): 30 minutes
- **Phase 3** (Execution): 4-6 hours
- **Phase 4** (QA): 2-3 hours
- **Phase 5** (Documentation): 1 hour
- **Phase 6** (Setup monitoring): 30 minutes

**Recommended Approach**: Split across 2-3 work sessions

---

## Next Steps

1. **Review this process** with the team
2. **Schedule consolidation work** (before manual testing)
3. **Start with Phase 1** (inventory and analysis)
4. **Execute high-priority consolidations** (Phase 3.1)
5. **Verify and document** (Phases 4-5)
6. **Set up monitoring** (Phase 6)
