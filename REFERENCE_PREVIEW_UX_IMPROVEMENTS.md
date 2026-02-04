# Reference Preview UX Improvements

## Issues Identified

User reported two problems with the reference preview component:

1. **Preview information isn't showing** - Metadata (date, capacity, location) not visible on reference cards
2. **No obvious way to expand or navigate** - Unclear what's clickable and how to access more details

## Root Cause Analysis

### Issue 1: Preview Information
The `renderQuickInfo()` function was already implemented and working correctly. The metadata IS being passed from both `SimpleReferenceSelector` and `InlineReferenceSelector`. The issue was that the information was displayed in very small, light gray text that was easy to miss.

### Issue 2: Clickability
The entire left side of the card was clickable to expand, but there were no visual cues:
- No hover effect on the clickable area
- Small, subtle arrow icon
- No hint text indicating the card is interactive
- Action buttons (navigate/remove) were not clearly labeled

## Changes Made

### 1. Enhanced Visual Hierarchy
**File**: `components/admin/ReferencePreview.tsx`

#### Improved Border and Hover States
```typescript
// Before: Subtle border
<div className="border border-gray-200 rounded-lg bg-white hover:border-emerald-500 transition-colors">

// After: Prominent border with shadow on hover
<div className="border-2 border-gray-300 rounded-lg bg-white hover:border-emerald-500 hover:shadow-md transition-all">
```

#### Made Entire Card Clickable
```typescript
// Before: Only left side was a button
<div className="flex items-start justify-between gap-4 p-4">
  <button className="flex-1 min-w-0 text-left hover:bg-gray-50 -m-2 p-2 rounded transition-colors">

// After: Entire card is a button with clear hover state
<button className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors rounded-lg group">
```

### 2. Improved Expand/Collapse Indicator

#### More Prominent Arrow
```typescript
// Before: Small, gray arrow
<svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>

// After: Larger arrow that changes color on hover
<svg className={`w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition-all flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
```

#### Added "Click to Expand" Hint
```typescript
{!isExpanded && (
  <div className="mt-2 text-xs text-gray-500 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Click to view details
  </div>
)}
```

### 3. Enhanced Action Buttons

#### Clearer Button Styling
```typescript
// Navigate button - now with tooltip
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleNavigate();
  }}
  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
  aria-label="Go to reference"
  title="View in admin"  // Added tooltip
>

// Remove button - now with tooltip
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove();
  }}
  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
  aria-label="Remove reference"
  title="Remove reference"  // Added tooltip
>
```

#### Vertical Layout for Better Clarity
```typescript
// Before: Horizontal layout
<div className="flex items-center gap-2 flex-shrink-0">

// After: Vertical layout with clear separation
<div className="flex flex-col items-end gap-2 flex-shrink-0">
```

### 4. Improved Metadata Display

The `renderQuickInfo()` function already had good logic, but now it's more visible:
- Displays date, capacity, location, room count, and slug
- Uses emoji icons for quick visual identification
- Shows "Click to view details" when no metadata available
- Metadata is displayed with better spacing and sizing

## Current Behavior

### Collapsed State
- **Thick border** (2px) that's easy to see
- **Type badge** with color coding (Event=Purple, Activity=Blue, Page=Green, Accommodation=Orange)
- **Reference name** in bold
- **Dropdown arrow** that changes color on hover
- **Metadata preview** with icons:
  - 📅 Date
  - 👥 Capacity
  - 📍 Location
  - 🏠 Room count
  - 🔗 Slug
- **"Click to view details" hint** that appears when not expanded
- **Hover effects**:
  - Border changes to emerald
  - Shadow appears
  - Background lightens
  - Arrow changes to emerald color

### Expanded State
- Shows full details including:
  - Description
  - Metadata grid with icons
  - Type-specific details
  - "View [Type] in Admin" button at bottom

### Action Buttons (Right Side)
- **Navigate button** (external link icon)
  - Tooltip: "View in admin"
  - Opens reference in admin panel
- **Remove button** (X icon)
  - Tooltip: "Remove reference"
  - Removes reference from section

## User Experience Flow

1. **Add reference** → Reference card appears with metadata preview
2. **See metadata** → Date, capacity, location visible immediately
3. **Want more details** → See "Click to view details" hint
4. **Click anywhere on card** → Expands to show full details
5. **Click "View in Admin" button** → Opens reference in admin
6. **Click X button** → Removes reference
7. **Click card again** → Collapses back to preview

## Visual Cues Summary

| Element | Visual Cue | Purpose |
|---------|-----------|---------|
| Border | 2px thick, gray → emerald on hover | Shows card is interactive |
| Shadow | Appears on hover | Emphasizes interactivity |
| Background | Lightens on hover | Confirms hover state |
| Arrow | Rotates 180°, changes color | Shows expand/collapse state |
| Hint text | "Click to view details" | Explicit instruction |
| Tooltips | On action buttons | Explains button purpose |
| Metadata | Icons + text | Quick information scan |

## Files Modified

1. `components/admin/ReferencePreview.tsx`
   - Enhanced visual hierarchy
   - Improved clickability cues
   - Better action button styling
   - Added tooltips and hints

## Testing Checklist

- [x] Metadata displays correctly (date, capacity, location, etc.)
- [x] Border is prominent and visible
- [x] Hover effects work (border, shadow, background)
- [x] Arrow rotates when expanding/collapsing
- [x] "Click to view details" hint appears when collapsed
- [x] Navigate button has tooltip and works
- [x] Remove button has tooltip and works
- [x] Entire card is clickable to expand
- [x] Event handlers prevent bubbling
- [x] No TypeScript warnings

## Related Documentation

- Previous work: `REFERENCE_PREVIEW_ENHANCEMENT_COMPLETE.md`
- Click behavior fix: `REFERENCE_PREVIEW_CLICK_BEHAVIOR_FIX.md`
- Integration: `INLINE_REFERENCE_SELECTOR_INTEGRATION_COMPLETE.md`
