# E2E Test Suite - Next Steps

## Current Status

✅ **Test Infrastructure**: Working perfectly
- Authentication: ✅ Working
- Database: ✅ Configured and aligned
- RLS Policies: ✅ Fixed
- Server: ✅ Running
- Test execution: ✅ Completing successfully

📊 **Test Results**: 152/359 passing (42.3%)

## Fix Applied in This Session

### 1. Content Pages - Add Page Button ✅
**File**: `app/admin/content-pages/page.tsx`
**Change**: Added "Add Page" button to header that's always visible
**Impact**: Should fix 5+ content management tests

### 2. CSV Import/Export - Already Implemented ✅
**File**: `app/admin/guests/page.tsx`
**Status**: CSV import/export buttons and handlers already exist
**Note**: Tests may be failing due to other issues (timing, validation, etc.)

## Priority Fixes Needed

### Immediate (Can be done quickly)

1. **~~Add CSV Import/Export Buttons to Guests Page~~** ✅ Already done
   - Buttons exist in UI
   - Handlers implemented
   - May need to debug why tests are still failing

2. **Fix Navigation Issues**
   - Ensure all admin sidebar links work
   - Fix mobile menu toggle
   - Add keyboard navigation support
   - Estimated time: 1 hour

3. **Add Missing ARIA Labels**
   - Add aria-label to all buttons without text
   - Add aria-describedby to form fields
   - Add role attributes to landmarks
   - Estimated time: 2 hours

### High Priority (Core Features)

4. **Implement Email Management UI**
   - Create `/admin/emails` page
   - Email composition form
   - Template selector
   - Recipient selection
   - Preview functionality
   - Send/Schedule/Draft buttons
   - Email history view
   - Estimated time: 8 hours

5. **Complete Location Hierarchy UI**
   - Add parent location selector
   - Show hierarchy visualization
   - Add circular reference validation
   - Add cascade delete warnings
   - Estimated time: 4 hours

6. **Implement Data Table URL State Management**
   - Update URL when search changes
   - Update URL when filters change
   - Update URL when sort changes
   - Restore state from URL on mount
   - Estimated time: 3 hours

### Medium Priority (UX & Accessibility)

7. **Fix Responsive Design Issues**
   - Test at mobile viewport
   - Test at 200% zoom
   - Fix overflow issues
   - Increase touch target sizes
   - Estimated time: 4 hours

8. **Complete Photo Upload Features**
   - Add metadata fields (caption, alt text)
   - Improve error handling
   - Add validation
   - Estimated time: 2 hours

9. **Complete Reference Blocks**
   - Fix event reference block creation
   - Fix activity reference block creation
   - Add validation
   - Estimated time: 2 hours

### Lower Priority (Nice to Have)

10. **Add Preview Functionality**
    - Add preview link in admin sidebar
    - Implement session isolation
    - Estimated time: 3 hours

## Recommended Approach

### Week 1: Quick Wins & Core Features
- Day 1: CSV buttons, navigation fixes (2 hours)
- Day 2: ARIA labels (2 hours)
- Day 3-4: Email management UI (8 hours)
- Day 5: Location hierarchy UI (4 hours)

**Expected result**: ~220/359 tests passing (61%)

### Week 2: UX & Remaining Features
- Day 1: Data table URL state (3 hours)
- Day 2: Responsive design fixes (4 hours)
- Day 3: Photo upload & reference blocks (4 hours)
- Day 4: Preview functionality (3 hours)
- Day 5: Testing & bug fixes (4 hours)

**Expected result**: ~300/359 tests passing (84%)

### Week 3: Polish & Edge Cases
- Fix remaining test failures
- Address edge cases
- Performance optimization
- Final testing

**Expected result**: ~340/359 tests passing (95%)

## Testing Strategy

After each batch of fixes:

```bash
# Run E2E tests
npm run test:e2e

# Check specific test suite
npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts

# Run with UI for debugging
npm run test:e2e -- --ui
```

## Success Criteria

- ✅ 80%+ tests passing before production deployment
- ✅ All critical user workflows working
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Mobile responsive
- ✅ No console errors

## Notes

- Most failures are incomplete UI, not bugs
- Test infrastructure is solid
- Guest views working well (high pass rate)
- Admin features need most work
- Accessibility needs systematic attention

## Current Blockers

None - all tools and infrastructure are working. Just need to implement missing UI features.

## Resources Needed

- Developer time: ~40 hours over 3 weeks
- Design review for email management UI
- Accessibility testing tools
- Mobile devices for testing

## Next Action

Start with quick wins:
1. Add CSV buttons to guests page
2. Fix navigation issues
3. Add ARIA labels

Then move to email management UI (biggest impact).
