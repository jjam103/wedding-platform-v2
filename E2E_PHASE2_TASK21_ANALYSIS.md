# E2E Phase 2 - Task 2.1: Content Management Analysis

## Current Status

**Date**: February 5, 2026  
**Test Suite**: `__tests__/e2e/admin/contentManagement.spec.ts`  
**Results**: 10 passed ✅ / 8 failed ❌ (55.6% pass rate)

---

## Test Results Summary

### ✅ Passing Tests (10)

1. **Content Page Management**
   - ✅ should validate required fields and handle slug conflicts
   - ✅ should add and reorder sections with layout options

2. **Home Page Editing**
   - ✅ should handle API errors gracefully and disable fields while saving
   - ✅ should preview home page in new tab

3. **Inline Section Editor**
   - ✅ should toggle inline section editor and add sections
   - ✅ should delete section with confirmation

4. **Event References**
   - ✅ should search and filter events in reference lookup

5. **Content Management Accessibility**
   - ✅ should have proper keyboard navigation in content pages
   - ✅ should have proper ARIA labels and form labels
   - ✅ should have proper keyboard navigation in home page editor
   - ✅ should have keyboard navigation in reference lookup

### ❌ Failing Tests (8)

#### 1. Content Page Creation Flow
**Test**: `should complete full content page creation and publication flow`

**Error**: Cannot find "Manage Sections" button after creating page

**Root Cause**: 
- Page created successfully
- But "Manage Sections" button not found in UI
- Likely missing from content pages list view

**Fix Needed**: Add "Manage Sections" button to content pages table/list

---

#### 2. Slug Conflict Validation
**Test**: `should validate required fields and handle slug conflicts`

**Error**: Slug auto-generation not working as expected

**Root Cause**: 
- Validation works (error message shows)
- But slug auto-generation from title not working
- Expected: "my-test-page-title"
- Actual: Empty or different value

**Fix Needed**: Implement slug auto-generation in ContentPageForm

---

#### 3. Section Reordering
**Test**: `should add and reorder sections with layout options`

**Error**: Layout toggle buttons not found

**Root Cause**:
- Sections can be added
- But "1 Col" / "2 Col" buttons not present
- Layout toggle UI missing

**Fix Needed**: Add layout toggle buttons to section editor

---

#### 4. Home Page Settings Save
**Test**: `should edit home page settings and save successfully`

**Error**: "Last saved" or "saved successfully" message not appearing

**Root Cause**:
- API call succeeds (200 response)
- But success message not displayed to user
- Missing toast/feedback after save

**Fix Needed**: Add success toast after home page save

---

#### 5. Welcome Message Editor
**Test**: `should edit welcome message with rich text editor`

**Error**: Same as #4 - success message not appearing

**Root Cause**: Same - missing success feedback

**Fix Needed**: Same - add success toast

---

#### 6. Section Content Editing
**Test**: `should edit section content and toggle layout`

**Error**: Layout select dropdown doesn't have "two-column" option

**Root Cause**:
- Layout select exists
- But options don't include "two-column" value
- Possible values mismatch

**Fix Needed**: Ensure layout select has correct options

---

#### 7. Photo Gallery & References
**Test**: `should add photo gallery and reference blocks to sections`

**Error**: Reference selector is hidden (not visible)

**Root Cause**:
- Column type select works
- Can select "references" option
- But reference selector UI is hidden
- CSS or conditional rendering issue

**Fix Needed**: Fix reference selector visibility

---

#### 8. Event Reference Creation
**Test**: `should create event and add as reference to content page`

**Error**: Event not appearing in events list after creation

**Root Cause**:
- Event creation form works
- But event doesn't appear in list
- Possible data refresh issue or RLS policy issue

**Fix Needed**: Fix event creation or list refresh

---

## Priority Fixes

### High Priority (Blocking Multiple Tests)

1. **Add Success Toast to Home Page Editor** (Fixes 2 tests)
   - File: `app/admin/home-page/page.tsx`
   - Add toast notification after successful save
   - Show "Last saved: [time]" or "Saved successfully"

2. **Fix Event Creation** (Fixes 1 test, unblocks workflow)
   - File: `app/admin/events/page.tsx`
   - Ensure event appears in list after creation
   - Check RLS policies
   - Check data refresh

### Medium Priority (Feature Completeness)

3. **Add Manage Sections Button** (Fixes 1 test)
   - File: `app/admin/content-pages/page.tsx`
   - Add "Manage Sections" button to each content page row
   - Link to section editor

4. **Implement Slug Auto-Generation** (Fixes 1 test)
   - File: `components/admin/ContentPageForm.tsx`
   - Auto-generate slug from title
   - Convert to lowercase, replace spaces with hyphens
   - Remove special characters

5. **Fix Reference Selector Visibility** (Fixes 1 test)
   - File: `components/admin/InlineSectionEditor.tsx` or `components/admin/SectionEditor.tsx`
   - Ensure reference selector shows when "references" column type selected
   - Check CSS display/visibility
   - Check conditional rendering logic

### Low Priority (UI Polish)

6. **Add Layout Toggle Buttons** (Fixes 1 test)
   - File: Section editor component
   - Add "1 Col" / "2 Col" buttons
   - Toggle section layout

7. **Fix Layout Select Options** (Fixes 1 test)
   - File: Section editor component
   - Ensure select has "one-column" and "two-column" options
   - Match test expectations

---

## Estimated Effort

### Quick Wins (2-3 hours)
- Add success toast (30 min)
- Fix slug auto-generation (1 hour)
- Add Manage Sections button (30 min)
- Fix reference selector visibility (1 hour)

### Medium Effort (3-4 hours)
- Fix event creation (2 hours)
- Add layout toggle buttons (1 hour)
- Fix layout select options (1 hour)

**Total Estimated Time**: 5-7 hours

---

## Implementation Plan

### Step 1: Quick Wins (High Impact, Low Effort)

1. **Add Success Toast to Home Page Editor**
   ```typescript
   // In app/admin/home-page/page.tsx
   // After successful save:
   addToast({
     type: 'success',
     message: 'Home page saved successfully',
   });
   ```

2. **Implement Slug Auto-Generation**
   ```typescript
   // In components/admin/ContentPageForm.tsx
   const generateSlug = (title: string) => {
     return title
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-|-$/g, '');
   };
   
   // On title change:
   if (!slugManuallyEdited) {
     setSlug(generateSlug(title));
   }
   ```

3. **Add Manage Sections Button**
   ```typescript
   // In app/admin/content-pages/page.tsx
   // In table row:
   <button onClick={() => router.push(`/admin/content-pages/${page.id}/sections`)}>
     Manage Sections
   </button>
   ```

### Step 2: Medium Effort Fixes

4. **Fix Event Creation**
   - Check if event is being created in database
   - Check if RLS policies allow reading
   - Ensure list refreshes after creation
   - Add proper error handling

5. **Fix Reference Selector Visibility**
   - Find where reference selector is rendered
   - Check conditional rendering logic
   - Ensure it shows when column type is "references"
   - Check CSS for display: none or visibility: hidden

6. **Add Layout Toggle & Fix Options**
   - Add layout toggle buttons to section editor
   - Ensure select has correct options
   - Wire up layout change handler

---

## Files to Modify

### Primary Files
1. `app/admin/home-page/page.tsx` - Add success toast
2. `components/admin/ContentPageForm.tsx` - Slug auto-generation
3. `app/admin/content-pages/page.tsx` - Add Manage Sections button
4. `app/admin/events/page.tsx` - Fix event creation
5. `components/admin/InlineSectionEditor.tsx` - Fix reference selector visibility
6. `components/admin/SectionEditor.tsx` - Layout toggle and options

### Supporting Files
- `services/contentPagesService.ts` - Slug generation utility
- `services/eventService.ts` - Event creation logic
- `utils/slugs.ts` - Slug utilities (may already exist)

---

## Success Criteria

After fixes:
- ✅ All 8 failing tests pass
- ✅ No regressions in 10 passing tests
- ✅ Pass rate: 18/18 (100%) for content management suite
- ✅ Overall E2E pass rate improves by ~2% (8 more tests passing)

---

## Next Steps

1. **Start with Quick Wins** - Implement success toast and slug auto-generation
2. **Test After Each Fix** - Run specific test to verify
3. **Move to Medium Effort** - Fix event creation and reference selector
4. **Final Verification** - Run full content management suite
5. **Document Results** - Update task list with completion status

---

## Delegation to Sub-Agent

This task is ready for sub-agent delegation with clear:
- ✅ Problem identification
- ✅ Root cause analysis
- ✅ Fix specifications
- ✅ File locations
- ✅ Success criteria
- ✅ Verification steps

**Recommended Approach**: Delegate entire task to sub-agent with this analysis document.

