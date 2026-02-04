# Reference Preview Click Handler Fix

## Issue
The reference preview component was navigating to a new page when clicking anywhere on the header, instead of expanding/collapsing inline. Only the explicit "View [Type]" button should navigate away.

## Root Cause
The original design had separate buttons for expand/collapse and navigation in the header, but clicking on the reference name/title area wasn't clearly defined. The expand/collapse arrow was a small button on the right side, making it unclear what should happen when clicking the main content area.

## Solution

### 1. Made the Entire Left Side Clickable for Expand/Collapse
- Converted the left side (name, badge, metadata) into a clickable button
- Added hover effect (`hover:bg-gray-50`) to indicate it's clickable
- Moved the expand/collapse arrow next to the title for better UX
- Added proper event handling with `e.preventDefault()` and `e.stopPropagation()`

### 2. Separated Action Buttons on the Right
- Navigate button (external link icon) - opens admin page
- Remove button (X icon) - removes reference
- Both buttons have explicit click handlers with event propagation prevention

### 3. Added "View in Admin" Button in Expanded Section
- Added a prominent button at the bottom of expanded details
- Clear label: "View [Type] in Admin"
- Full-width button with icon for better visibility
- This is the primary way to navigate to the admin page

## Changes Made

### `components/admin/ReferencePreview.tsx`

**Before:**
```tsx
<div className="flex items-start justify-between gap-4 p-4">
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-1">
      {getTypeBadge()}
      <h4 className="font-medium text-gray-900 truncate">
        {reference.name || details?.name || `${reference.type} (${reference.id.slice(0, 8)}...)`}
      </h4>
    </div>
    {renderQuickInfo()}
  </div>

  <div className="flex items-center gap-2 flex-shrink-0">
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {/* Arrow icon */}
    </button>
    <button onClick={handleNavigate}>
      {/* External link icon */}
    </button>
    <Button onClick={onRemove}>
      {/* X icon */}
    </Button>
  </div>
</div>
```

**After:**
```tsx
<div className="flex items-start justify-between gap-4 p-4">
  {/* Left side - clickable to expand/collapse */}
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }}
    className="flex-1 min-w-0 text-left hover:bg-gray-50 -m-2 p-2 rounded transition-colors"
  >
    <div className="flex items-center gap-2 mb-1">
      {getTypeBadge()}
      <h4 className="font-medium text-gray-900 truncate">
        {reference.name || details?.name || `${reference.type} (${reference.id.slice(0, 8)}...)`}
      </h4>
      {/* Expand/collapse indicator */}
      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
        {/* Arrow icon */}
      </svg>
    </div>
    {renderQuickInfo()}
  </button>

  {/* Right side - action buttons */}
  <div className="flex items-center gap-2 flex-shrink-0">
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleNavigate();
      }}
      className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
      title="View in admin"
    >
      {/* External link icon */}
    </button>
    <Button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove();
      }}
    >
      {/* X icon */}
    </Button>
  </div>
</div>

{/* In expanded section */}
<div className="pt-2 border-t border-gray-100">
  <button
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleNavigate();
    }}
    className="w-full px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center justify-center gap-2"
  >
    <svg className="w-4 h-4">{/* External link icon */}</svg>
    View {reference.type} in Admin
  </button>
</div>
```

## User Experience Improvements

### Collapsed State
- **Click on name/badge/metadata area**: Expands to show details
- **Hover over name area**: Background changes to gray-50 to indicate clickability
- **Arrow icon**: Moves next to title, rotates when expanded
- **External link icon (top right)**: Opens admin page (secondary action)
- **X icon (top right)**: Removes reference

### Expanded State
- **Click on name/badge/metadata area**: Collapses details
- **Arrow icon**: Rotates 180° to point up
- **"View [Type] in Admin" button**: Primary way to navigate to admin page
- **External link icon (top right)**: Still available as quick action
- **X icon (top right)**: Removes reference

## Testing Checklist

- [x] Clicking on reference name expands/collapses inline
- [x] Clicking on reference name does NOT navigate to new page
- [x] External link icon in header navigates to admin page
- [x] "View in Admin" button in expanded section navigates to admin page
- [x] Remove button removes the reference
- [x] Hover states work correctly
- [x] Arrow icon rotates when expanding/collapsing
- [x] Event propagation is properly prevented

## Related Files
- `components/admin/ReferencePreview.tsx` - Main component with click handlers
- `components/admin/SectionEditor.tsx` - Uses ReferencePreview component
- `REFERENCE_PREVIEW_ENHANCEMENT_COMPLETE.md` - Previous enhancement documentation

## Status
✅ **COMPLETE** - Reference preview now properly expands/collapses inline, with clear navigation options
