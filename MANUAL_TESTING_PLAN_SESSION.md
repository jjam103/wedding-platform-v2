# Manual Testing Plan - Session

**Date**: February 2, 2026  
**Status**: Ready for Testing  
**Build Status**: ✅ Passing  
**Dev Server**: ✅ Running on http://localhost:3000

## Pre-Testing Checklist

- [x] Build successful (`npm run build`)
- [x] Dev server running (`npm run dev`)
- [x] TypeScript compilation passing
- [ ] Database migrations applied
- [ ] Test data seeded

## Testing Priority Areas

Based on recent changes and known issues, focus on these areas:

### 1. Critical Path Testing (Priority 1)

#### Admin Authentication & Access
- [ ] Login to admin dashboard
- [ ] Verify role-based access control
- [ ] Check session persistence
- [ ] Test logout functionality

#### Guest Groups Management
- [ ] Navigate to `/admin/guest-groups`
- [ ] Create a new guest group
- [ ] Edit existing group
- [ ] Delete a group
- [ ] Verify RLS policies (groups only visible to owners)

#### Guest Management
- [ ] Navigate to `/admin/guests`
- [ ] Create a new guest
- [ ] Verify group dropdown populates correctly
- [ ] Edit guest details
- [ ] Test bulk operations
- [ ] Verify guest filtering

### 2. Content Management (Priority 2)

#### Content Pages
- [ ] Navigate to `/admin/content-pages`
- [ ] Create a new content page
- [ ] Add sections with rich text
- [ ] Add photo galleries
- [ ] Add reference blocks
- [ ] Save and verify content persists
- [ ] Test preview functionality
- [ ] Verify slug generation

#### Section Editor
- [ ] Open section editor
- [ ] Test two-column layout
- [ ] Add rich text content
- [ ] Add photos via photo picker
- [ ] Add reference blocks
- [ ] Test manual save button
- [ ] Verify content saves correctly

#### Photo Management
- [ ] Navigate to `/admin/photos`
- [ ] Upload new photos
- [ ] Edit photo captions
- [ ] Test photo moderation (approve/reject)
- [ ] Verify photo gallery display modes
- [ ] Test photo picker in section editor

### 3. Events & Activities (Priority 2)

#### Events
- [ ] Navigate to `/admin/events`
- [ ] Create a new event
- [ ] Edit event details
- [ ] Add activities to event
- [ ] Test bulk delete
- [ ] Verify event slug generation
- [ ] Test "View" button navigation

#### Activities
- [ ] Navigate to `/admin/activities`
- [ ] Create a new activity
- [ ] Set capacity limits
- [ ] Configure RSVP settings
- [ ] Test bulk operations
- [ ] Verify activity slug generation

### 4. Accommodations & Locations (Priority 3)

#### Locations
- [ ] Navigate to `/admin/locations`
- [ ] Create location hierarchy (country → region → city)
- [ ] Test parent-child relationships
- [ ] Verify location selector in other forms

#### Accommodations
- [ ] Navigate to `/admin/accommodations`
- [ ] Create new accommodation
- [ ] Add room types
- [ ] Set pricing and capacity
- [ ] Test room type management

### 5. Budget & Vendors (Priority 3)

#### Budget Dashboard
- [ ] Navigate to `/admin/budget`
- [ ] View budget summary
- [ ] Verify calculations
- [ ] Test subsidy tracking

#### Vendors
- [ ] Navigate to `/admin/vendors`
- [ ] Add new vendor
- [ ] Set pricing (flat rate vs per-guest)
- [ ] Update payment status
- [ ] Verify cost calculations

### 6. Guest Portal (Priority 2)

#### Guest Authentication
- [ ] Test guest login flow
- [ ] Verify email matching
- [ ] Test magic link authentication

#### Guest Views
- [ ] Navigate to guest event pages
- [ ] Test RSVP functionality
- [ ] View itinerary
- [ ] Test photo gallery viewing
- [ ] Verify content page display

### 7. Cross-Cutting Concerns (Priority 1)

#### Navigation
- [ ] Test all admin sidebar links
- [ ] Verify breadcrumbs
- [ ] Test mobile navigation
- [ ] Check for 404 errors on "View" buttons

#### Forms & Validation
- [ ] Test form validation messages
- [ ] Verify error handling
- [ ] Test toast notifications
- [ ] Check loading states

#### Styling & UI
- [ ] Verify CSS loads correctly
- [ ] Check responsive design
- [ ] Test button styling
- [ ] Verify color scheme consistency

## Known Issues to Verify Fixed

### Recently Fixed Issues
1. **Guest Groups Dropdown** - Verify new groups appear immediately
2. **Next.js 15 Params** - Verify dynamic routes work correctly
3. **RLS Policies** - Verify content pages and guest groups RLS
4. **Cookie Handling** - Verify API authentication works
5. **Toast Notifications** - Verify toasts display correctly
6. **View Button 404s** - Verify all view buttons navigate correctly

### Areas with Recent Changes
- Photo moderation workflow
- Section editor save functionality
- Reference block picker
- Bulk delete operations
- Slug generation and routing

## Testing Workflow

### For Each Feature:
1. **Navigate** to the feature page
2. **Create** a new item (if applicable)
3. **Read** - verify item displays correctly
4. **Update** - edit the item
5. **Delete** - remove the item (or test soft delete)
6. **Verify** - check related functionality still works

### Error Testing:
- Try to submit forms with invalid data
- Test with missing required fields
- Verify error messages are clear
- Check that errors don't crash the app

### Performance Testing:
- Note any slow page loads
- Check for console errors
- Verify no memory leaks (long sessions)
- Test with realistic data volumes

## Bug Reporting Template

When you find an issue, document it with:

```markdown
### Bug: [Short Description]

**Severity**: Critical / High / Medium / Low
**Page**: /admin/[page-name]
**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Console Errors**:
[Any errors from browser console]

**Screenshots**:
[If applicable]

**Additional Context**:
[Any other relevant information]
```

## Post-Testing Actions

After completing manual testing:

1. **Document all bugs** found in a new file: `MANUAL_TESTING_BUGS_[DATE].md`
2. **Prioritize bugs** by severity
3. **Create fix plan** for critical and high-priority bugs
4. **Update test coverage** - add automated tests for bugs found
5. **Verify fixes** - retest after fixes are applied

## Quick Start Commands

```bash
# Start dev server
npm run dev

# Check build
npm run build

# Run specific test suite
npm test -- --testPathPattern="[pattern]"

# Check TypeScript
npm run type-check

# Run linter
npm run lint
```

## Testing Notes

- **Browser**: Test in Chrome/Firefox/Safari
- **Viewport**: Test desktop (1920x1080) and mobile (375x667)
- **Network**: Test with normal and slow 3G
- **Data**: Use realistic test data, not just "test" entries
- **Session**: Test both fresh session and returning user

## Success Criteria

Testing session is complete when:
- [ ] All Priority 1 areas tested
- [ ] All Priority 2 areas tested
- [ ] All known issues verified fixed
- [ ] All bugs documented
- [ ] No critical bugs remaining
- [ ] Performance is acceptable
- [ ] UI/UX is consistent

---

**Ready to begin testing!** Start with Priority 1 areas and work through systematically.
