# E2E Phase 2: Content Management Workflows - Starting

## Task Overview
**Task 2.1**: Complete Content Management Workflows  
**Tests Affected**: 11 tests  
**Estimated Time**: 10-12 hours  
**Priority**: High (Phase 2, Priority 2)

## Current Status
- Phase 1 complete (DataTable URL state, Admin navigation verified)
- Starting Phase 2 with highest-impact task
- E2E tests currently running in background

## Sub-tasks to Complete

### 1. Fix content page creation and publication flow
- Verify content page creation form works
- Add publication status toggle
- Test save and publish workflows

### 2. Add slug conflict validation
- Check for duplicate slugs before save
- Show user-friendly error messages
- Suggest alternative slugs

### 3. Fix section add/reorder functionality
- Verify sections can be added to pages
- Implement drag-and-drop reordering
- Save section order to database

### 4. Fix home page settings editor
- Verify home page configuration works
- Test welcome message editing
- Test hero image upload

### 5. Fix welcome message rich text editor
- Verify rich text editor loads
- Test formatting options
- Test content saving

### 6. Fix section content editing and layout toggle
- Verify section content can be edited
- Test layout toggle (1-column vs 2-column)
- Save layout preferences

### 7. Fix photo gallery integration in sections
- Verify photos can be added to sections
- Test photo selection UI
- Test photo display in sections

### 8. Fix reference block integration in sections
- Verify reference blocks can be added
- Test reference selection UI
- Test reference display in sections

### 9. Add event reference to content page
- Implement event reference picker
- Test event linking
- Verify event display on content pages

## Files to Modify
1. `app/admin/content-pages/page.tsx` - Main content pages management
2. `components/admin/ContentPageForm.tsx` - Content page form
3. `components/admin/SectionEditor.tsx` - Section editing
4. `services/contentPagesService.ts` - Content page business logic
5. `services/sectionsService.ts` - Section business logic

## Verification
```bash
npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts
```

## Next Steps
1. Read the failing E2E test to understand exact requirements
2. Identify which sub-tasks are already complete
3. Fix remaining issues systematically
4. Verify fixes with E2E tests
