# Guest-Side Reference Preview Enhancement

## Summary

Enhanced the guest-side reference display to match the admin-side functionality with expandable preview cards, detailed information, and obvious navigation.

## Changes Made

### 1. Created New Component: `GuestReferencePreview.tsx`

**Location**: `components/guest/GuestReferencePreview.tsx`

**Features**:
- **Expandable/Collapsible Design**: Click to expand and view full details
- **Preview Information**: Shows date, capacity, location, room count immediately from metadata
- **API Detail Fetching**: Loads full details from `/api/admin/references/[type]/[id]` when expanded
- **Clear Visual Hierarchy**:
  - Type badge (Event, Activity, Page, Accommodation, Location)
  - Reference name prominently displayed
  - Expand/collapse arrow indicator
  - Quick info preview (always visible)
  - "Click to view details" hint text
- **Enhanced Expanded View**:
  - Full description
  - Metadata grid with icons (date, time, location, capacity, rooms)
  - Type-specific details (activity type, event date, address)
  - Prominent "View Full [Type]" button for navigation
- **Smooth Animations**: Hover effects, color transitions, shadow on hover
- **Loading States**: Spinner while fetching details

**Visual Design**:
- Border: `border-2 border-sage-200` (Costa Rica theme)
- Hover: `hover:border-jungle-500 hover:shadow-md`
- Background: `hover:bg-jungle-50` on header
- Navigation button: `bg-jungle-600 hover:bg-jungle-700` (prominent CTA)

### 2. Updated Component: `SectionRenderer.tsx`

**Location**: `components/guest/SectionRenderer.tsx`

**Changes**:
- Removed old modal-based preview system (`EventPreviewModal`, `ActivityPreviewModal`)
- Removed `useState` for modal management
- Removed `handleReferenceClick` function
- Removed `getTypeBadge` helper (now in `GuestReferencePreview`)
- Simplified to use `<GuestReferencePreview>` component directly
- Cleaner, more maintainable code

**Before**:
```tsx
<button onClick={() => handleReferenceClick(ref)}>
  {/* Simple card with badge and name */}
</button>
```

**After**:
```tsx
<GuestReferencePreview reference={ref} />
```

## User Experience Improvements

### Before
- Simple clickable cards
- Clicking navigated directly to page (no preview)
- No way to see details without leaving current page
- No visual feedback on what's clickable

### After
- **Expandable preview cards** with clear visual hierarchy
- **Click to expand** and view full details inline
- **Separate navigation button** in expanded state ("View Full [Type]")
- **Clear visual cues**:
  - Hover effects on entire card
  - Expand/collapse arrow
  - "Click to view details" hint text
  - Prominent navigation button when expanded
- **Progressive disclosure**: Quick info → Full details → Navigate

## Navigation Flow

1. **Collapsed State**: Shows type badge, name, quick info (date, capacity, location)
2. **Click to Expand**: Fetches full details from API, shows loading spinner
3. **Expanded State**: Shows full description, metadata grid, type-specific details
4. **Navigate**: Click "View Full [Type]" button to go to dedicated page

## Technical Details

### API Integration
- Uses existing `/api/admin/references/[type]/[id]` endpoint
- Fetches details only when expanded (performance optimization)
- Handles loading and error states gracefully

### Responsive Design
- Works on mobile and desktop
- Metadata grid adapts to screen size
- Truncates long text appropriately

### Accessibility
- Semantic HTML with proper button elements
- Clear focus states
- Descriptive aria-labels
- Keyboard navigable

## Testing Recommendations

### Manual Testing
1. Navigate to any guest-facing page with reference blocks
2. Verify references display in collapsed state with quick info
3. Click to expand - verify loading spinner appears
4. Verify full details display correctly
5. Click "View Full [Type]" button - verify navigation works
6. Click expand arrow again - verify collapse works
7. Test on mobile and desktop

### E2E Test Updates Needed
Update `__tests__/e2e/guestSectionDisplay.spec.ts`:
- Test expand/collapse functionality
- Test detail fetching
- Test navigation button
- Test loading states

### Component Test Updates Needed
Update `components/guest/SectionRenderer.test.tsx`:
- Test `GuestReferencePreview` integration
- Mock API responses for detail fetching
- Test expand/collapse state management

## Files Modified

1. **Created**: `components/guest/GuestReferencePreview.tsx` (new component)
2. **Modified**: `components/guest/SectionRenderer.tsx` (simplified, uses new component)

## Benefits

1. **Consistency**: Guest-side now matches admin-side UX patterns
2. **Better UX**: Users can preview content before navigating
3. **Reduced Navigation**: Less back-and-forth between pages
4. **Clear Actions**: Obvious what's clickable and what it does
5. **Performance**: Details fetched only when needed
6. **Maintainability**: Cleaner code, single responsibility components

## Next Steps

1. Manual test on development server
2. Update E2E tests for new expand/collapse behavior
3. Update component tests for `SectionRenderer`
4. Consider adding keyboard shortcuts (Space/Enter to expand)
5. Consider adding animation transitions for expand/collapse

## Related Files

- Admin-side equivalent: `components/admin/ReferencePreview.tsx`
- API endpoint: `app/api/admin/references/[type]/[id]/route.ts`
- Section renderer test: `components/guest/SectionRenderer.test.tsx`
- E2E test: `__tests__/e2e/guestSectionDisplay.spec.ts`
