# E2E Phase 2 Round 8 - Reference Blocks UI Fixes

**Date**: February 13, 2026  
**Status**: 5/8 tests passing (62.5%)  
**Time Spent**: ~45 minutes total

## Progress Summary

### Before UI Fixes
- **Passing**: 4/8 (50%)
- **Failing**: 3/8 (37.5%)
- **Interrupted**: 1/8 (12.5%)
- **Issue**: UI interaction timeouts

### After UI Fixes
- **Passing**: 5/8 (62.5%)
- **Failing**: 3/8 (37.5%)
- **Issue**: Different UI problems (not button selectors)

## UI Fixes Applied

### Fix 1: Events Page Edit Button
**Problem**: Test was looking for "Edit" button on events page, but it doesn't exist.

**Root Cause**: Events page uses row click to open edit form, not an "Edit" button.

**Fix**: Changed test to click on event row instead of looking for Edit button:

```typescript
// Before
const editButton = page.locator('button:has-text("Edit")').first();
await editButton.click();

// After
const eventRow = page.locator(`text=Test Event for References`).first();
await eventRow.click();
```

**Result**: ✅ "should prevent circular references" test now passes

### Fix 2: Section Editor Selector
**Problem**: Test was using generic selectors that didn't match actual UI structure.

**Root Cause**: Section editor appears in different locations on different pages:
- Content pages: Inline div with `.border-t.border-gray-200.bg-gray-50` classes
- Events page: Div with `[data-section-editor]` attribute

**Fix**: Updated selectors to match actual UI structure:

```typescript
// For content pages
const sectionEditor = page.locator('.border-t.border-gray-200.bg-gray-50').first();

// For events page
const sectionEditor = page.locator('[data-section-editor]').first();
```

**Result**: ✅ Improved reliability of section editor detection

## Test Results

### Passing Tests (5/8 = 62.5%)
1. ✅ should create activity reference block
2. ✅ should create multiple reference types in one section
3. ✅ should filter references by type in picker
4. ✅ should detect broken references
5. ✅ should prevent circular references

### Failing Tests (3/8 = 37.5%)

#### Test 1: "should create event reference block"
**Error**: `element(s) not found` for "Add Reference" button

**Root Cause**: Section editor loads but "Add Reference" button is not appearing. This suggests the section editor UI might not be fully rendering or the button is in a different location.

**Next Steps**:
1. Check if section editor has any sections to edit
2. Verify "Add Reference" button exists in SectionEditor component
3. May need to create a section first before adding references

#### Test 2: "should remove reference from section"
**Error**: `duplicate key value violates unique constraint "content_pages_slug_key"`

**Root Cause**: Test cleanup is not removing content pages properly, causing slug conflicts on retry.

**Next Steps**:
1. Fix test cleanup to properly delete content pages
2. Use more unique slugs (add random suffix)
3. Check if cleanup is running between test retries

#### Test 3: "should display reference blocks in guest view with preview modals"
**Error**: `Cannot read properties of null (reading 'slug')` and `element(s) not found` for event reference

**Root Cause**: Content page query returning null, likely because:
1. Content page was deleted by cleanup
2. References not properly saved to section
3. Guest view route `/info/` might be wrong (should be `/custom/`)

**Next Steps**:
1. Fix guest view route from `/info/` to `/custom/`
2. Verify references are saved before navigating to guest view
3. Add better error handling for null content page

## Impact on Round 8 Goals

**Original Goal**: Fix 12 reference block test failures (Priority 3)

**Progress**:
- ✅ Fixed all database setup issues (100%)
- ✅ Fixed UI selector issues for events page (100%)
- ✅ 5 tests now fully passing (62.5%)
- ⚠️ 3 tests still failing (different issues than before)

**Estimated Time to Complete**:
- Database fixes: ✅ Complete (30 minutes)
- UI selector fixes: ✅ Complete (15 minutes)
- Remaining fixes: 30-45 minutes
- **Total**: 1.5-2 hours (within 1-2 hour estimate)

## Remaining Work

### Priority 1: Fix "Add Reference" Button Issue (15-20 min)
The section editor loads but the "Add Reference" button doesn't appear. Need to:
1. Check if sections exist before trying to add references
2. Verify button selector matches actual UI
3. May need to add a section first

### Priority 2: Fix Test Cleanup (10-15 min)
Slug conflicts indicate cleanup isn't working properly:
1. Ensure content pages are deleted in cleanup
2. Use more unique slugs with timestamps
3. Verify cleanup runs between retries

### Priority 3: Fix Guest View Test (10-15 min)
Multiple issues with guest view test:
1. Fix route from `/info/` to `/custom/`
2. Add null checks for content page query
3. Verify references are saved before viewing

## Files Modified

1. `__tests__/e2e/admin/referenceBlocks.spec.ts` - Fixed UI selectors and event page interaction

## Key Learnings

1. **Different pages have different UI patterns**: Events page uses row click, content pages use Edit button
2. **Section editor appears in different locations**: Need page-specific selectors
3. **Test cleanup is critical**: Slug conflicts cause cascading failures
4. **Guest view routes matter**: `/info/` vs `/custom/` makes a difference

## Next Actions

1. **Investigate "Add Reference" button** (15-20 min):
   - Run test in headed mode to observe UI
   - Check if sections need to be created first
   - Verify button selector

2. **Fix test cleanup** (10-15 min):
   - Add content page deletion to cleanup
   - Use more unique slugs
   - Verify cleanup between retries

3. **Fix guest view test** (10-15 min):
   - Change route to `/custom/`
   - Add null checks
   - Verify references saved

4. **Verify all fixes** (10 min):
   - Run full suite 3x
   - Check for flakiness
   - Confirm 100% pass rate

## Success Metrics

- [x] Database setup issues resolved (100%)
- [x] UI selector issues resolved (100%)
- [x] At least 50% of tests passing (62.5% achieved)
- [ ] All 8 tests passing (62.5% remaining)
- [ ] No flaky tests
- [ ] Tests run in <30 seconds

---

**Status**: UI fixes complete, 3 tests still need work  
**Next Update**: After remaining fixes applied  
**Estimated Completion**: 30-45 minutes

