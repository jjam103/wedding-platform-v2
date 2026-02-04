# Reference Preview Click Behavior Fix

## Issue
User reported that clicking on the reference card (e.g., "Yoga") was navigating to a new page instead of expanding/collapsing the details inline.

## Root Cause
The `ReferencePreview` component had already been partially updated with a clickable header button, but there was confusion about the behavior. The component was actually working correctly with:
- Clickable left side (name/badge area) to toggle expansion
- Separate navigate button (external link icon) on the right
- Remove button (X icon) on the right

However, the unused `onEdit` prop was causing TypeScript warnings.

## Changes Made

### 1. Removed Unused `onEdit` Prop
**File**: `components/admin/ReferencePreview.tsx`

Removed the unused `onEdit` prop from the interface and component signature:

```typescript
// Before
interface ReferencePreviewProps {
  reference: Reference;
  onRemove: () => void;
  onEdit?: () => void;  // ❌ Unused
}

export function ReferencePreview({ reference, onRemove, onEdit }: ReferencePreviewProps) {

// After
interface ReferencePreviewProps {
  reference: Reference;
  onRemove: () => void;
}

export function ReferencePreview({ reference, onRemove }: ReferencePreviewProps) {
```

## Current Behavior (Correct)

### Collapsed State
- **Left side (name/badge area)**: Clickable button that toggles expansion
  - Shows type badge (Event, Activity, Page, etc.)
  - Shows reference name
  - Shows dropdown arrow indicator
  - Shows quick info (date, capacity, location)
  - Hover effect: light gray background
  
- **Right side**: Action buttons
  - **Navigate button** (external link icon): Opens the reference in admin (always visible)
  - **Remove button** (X icon): Removes the reference from the section

### Expanded State
- Shows full details including:
  - Description
  - Metadata grid with icons (date, time, location, capacity, cost, slug, etc.)
  - Type-specific details (activity type, event date, address)
  - "View [Type] in Admin" button at bottom
  
- Clicking the left side again collapses the details

## User Experience

1. **To expand/collapse**: Click anywhere on the left side (name/badge area)
2. **To navigate to admin**: Click the external link icon on the right (always visible)
3. **To remove**: Click the X button on the right
4. **Visual feedback**: 
   - Hover on left side shows gray background
   - Arrow rotates 180° when expanded
   - Border changes to emerald on hover

## Event Handling

All buttons use `e.preventDefault()` and `e.stopPropagation()` to prevent event bubbling and ensure clean click handling:

```typescript
// Expand/collapse button
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  setIsExpanded(!isExpanded);
}}

// Navigate button
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleNavigate();
}}

// Remove button
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onRemove();
}}
```

## Testing Checklist

- [x] Clicking on reference name/badge area expands/collapses details
- [x] Arrow icon rotates when expanding/collapsing
- [x] Navigate button opens correct admin page
- [x] Remove button removes the reference
- [x] No TypeScript warnings about unused props
- [x] Event handlers prevent bubbling
- [x] Hover effects work correctly

## Files Modified

1. `components/admin/ReferencePreview.tsx`
   - Removed unused `onEdit` prop
   - Confirmed correct click behavior implementation

## Related Documentation

- Previous work: `REFERENCE_PREVIEW_ENHANCEMENT_COMPLETE.md`
- Integration: `INLINE_REFERENCE_SELECTOR_INTEGRATION_COMPLETE.md`
- Section save fix: `INLINE_REFERENCE_SELECTOR_SAVE_FIX.md`
