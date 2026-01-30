# Section 404 Issue - Fix Plan

## Problem

Multiple admin pages have "Manage Sections" buttons that navigate to non-existent routes:

1. **Events Page**: `/admin/events/[id]/sections` - doesn't exist
2. **Activities Page**: `/admin/activities/[id]/sections` - doesn't exist  
3. **Accommodations Page**: `/admin/accommodations/[id]/sections` - doesn't exist
4. **Room Types Page**: `/admin/room-types/[id]/sections` - doesn't exist
5. **Content Pages**: `/admin/content-pages/[id]/sections` - doesn't exist

## Solution Options

### Option 1: Remove Buttons (QUICK FIX - 5 minutes)
**Pros**: Immediate fix, no broken functionality
**Cons**: Removes feature access

### Option 2: Create Section Pages (COMPLETE FIX - 2-3 hours)
**Pros**: Full functionality, proper implementation
**Cons**: Time-consuming, requires testing

### Option 3: Inline Section Editor (MEDIUM FIX - 1 hour)
**Pros**: Better UX, no navigation needed
**Cons**: More complex state management

## Recommended Approach

**Quick Fix Now**: Remove/disable buttons
**Follow-up**: Create proper section pages later

## Implementation

### Quick Fix: Comment Out Buttons

Files to modify:
1. `app/admin/events/page.tsx` - Remove Manage Sections button
2. `app/admin/activities/page.tsx` - Remove Manage Sections button
3. `app/admin/accommodations/page.tsx` - Remove Manage Sections button
4. `app/admin/accommodations/[id]/room-types/page.tsx` - Remove Manage Sections button
5. `app/admin/content-pages/page.tsx` - Remove Sections button

### Changes Needed

For each file, comment out or remove:
- The `handleManageSections` function
- The "Manage Sections" button in the actions column
- Any related state or callbacks

## Testing After Fix

1. Navigate to each admin page
2. Verify no "Manage Sections" buttons appear
3. Verify no console errors
4. Verify other buttons still work

## Future Implementation

When ready to implement sections properly:

1. Create section editor pages:
   - `app/admin/events/[id]/sections/page.tsx`
   - `app/admin/activities/[id]/sections/page.tsx`
   - `app/admin/accommodations/[id]/sections/page.tsx`
   - `app/admin/room-types/[id]/sections/page.tsx`
   - `app/admin/content-pages/[id]/sections/page.tsx`

2. Each page should:
   - Load sections for the parent entity
   - Use SectionEditor component
   - Handle CRUD operations
   - Navigate back to parent page

3. Restore the "Manage Sections" buttons

## Status

- [ ] Quick fix implemented
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Future implementation planned
