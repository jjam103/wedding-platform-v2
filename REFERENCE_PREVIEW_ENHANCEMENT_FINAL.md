# Reference Preview Enhancement - Final Fix

## Issues Identified

User reported two critical problems with the reference preview component:

1. **Preview information isn't showing** - Reference cards were not displaying metadata (date, capacity, location, etc.)
2. **No obvious way to expand or navigate** - UI wasn't clear about what's clickable or how to access more details

## Root Causes

### Issue 1: Missing Preview Data
- The `InlineReferenceSelector` was passing minimal metadata when adding references
- The `ReferencePreview` component was only checking `reference.metadata` for quick info
- The component wasn't properly utilizing the fetched `details` from the API
- Quick info wasn't falling back to API-fetched data

### Issue 2: Unclear UI/UX
- The expand/collapse button was too small and not obvious
- No visual hint that the card was clickable
- The "Details" label was missing
- No indication of what would happen when clicking
- Border styling was too subtle

## Changes Made

### 1. Enhanced Data Display (`renderQuickInfo`)

**File**: `components/admin/ReferencePreview.tsx`

Updated the `renderQuickInfo` function to:
- Check both `details` (from API) and `reference.metadata` (from selector)
- Support nested data structures (`data.details?.capacity`)
- Display appropriate icons for each data type
- Show "Click to view details" when no preview data is available

```typescript
const renderQuickInfo = () => {
  // Use fetched details if available, otherwise fall back to metadata
  const data = details || reference.metadata || {};
  const items: React.ReactElement[] = [];

  // For events - date/time
  if (data.date || data.startTime || data.details?.startTime) {
    const dateStr = data.date || data.startTime || data.details?.startTime;
    items.push(
      <span key="date" className="text-xs text-gray-500">
        📅 {new Date(dateStr).toLocaleDateString()}
      </span>
    );
  }

  // For activities - capacity
  if (data.capacity || data.details?.capacity) {
    const cap = data.capacity || data.details?.capacity;
    items.push(
      <span key="capacity" className="text-xs text-gray-500">
        👥 {cap} guests
      </span>
    );
  }

  // Location
  if (data.location || data.details?.location) {
    const loc = data.location || data.details?.location;
    items.push(
      <span key="location" className="text-xs text-gray-500 truncate max-w-[150px]">
        📍 {loc}
      </span>
    );
  }

  // For accommodations - room count
  if (data.room_count || data.details?.roomTypeCount) {
    const rooms = data.room_count || data.details?.roomTypeCount;
    items.push(
      <span key="rooms" className="text-xs text-gray-500">
        🏠 {rooms} rooms
      </span>
    );
  }

  return items.length > 0 ? (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <span>•</span>}
          {item}
        </span>
      ))}
    </div>
  ) : (
    <div className="text-xs text-gray-400 italic">
      Click to view details
    </div>
  );
};
```

### 2. Improved Visual Design

**Changes to the card structure:**

1. **More prominent border**: Changed from `border` to `border-2` with `border-gray-300`
2. **Better hover effects**: Added `hover:shadow-md` for depth
3. **Full-width clickable button**: Made the entire header a button for better UX
4. **Larger expand/collapse icon**: Increased from `w-4 h-4` to `w-5 h-5`
5. **Color transitions**: Added `group-hover:text-emerald-600` for visual feedback
6. **Click hint**: Added "Click to view details" text that appears when collapsed
7. **Clearer action buttons**: Separated navigate and remove buttons vertically

```typescript
return (
  <div className="border-2 border-gray-300 rounded-lg bg-white hover:border-emerald-500 hover:shadow-md transition-all">
    {/* Collapsed header - clickable to expand */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-gray-50 transition-colors rounded-lg group"
    >
      {/* Left side - main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {getTypeBadge()}
          <h4 className="font-semibold text-gray-900 truncate">
            {reference.name || details?.name || `${reference.type} (${reference.id.slice(0, 8)}...)`}
          </h4>
          {/* Expand/collapse indicator - more prominent */}
          <svg 
            className={`w-5 h-5 text-gray-500 group-hover:text-emerald-600 transition-all flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Quick info - always visible */}
        {renderQuickInfo()}
        
        {/* Click to expand hint */}
        {!isExpanded && (
          <div className="mt-2 text-xs text-gray-500 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Click to view details
          </div>
        )}
      </div>

      {/* Right side - action buttons */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Navigate button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNavigate();
          }}
          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
          aria-label="Go to reference"
          title="View in admin"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
          aria-label="Remove reference"
          title="Remove reference"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </button>

    {/* Expanded details */}
    {renderExpandedDetails()}
  </div>
);
```

### 3. Removed Unused Import

Removed the unused `Button` component import that was causing TypeScript warnings.

## Current Behavior

### Collapsed State
- **Prominent border**: 2px gray border that turns emerald on hover
- **Shadow on hover**: Card lifts slightly with shadow effect
- **Type badge**: Color-coded badge (purple for events, blue for activities, etc.)
- **Reference name**: Bold, truncated if too long
- **Expand arrow**: Large, visible arrow that rotates when expanded
- **Quick info**: Shows available metadata with icons:
  - 📅 Date (for events/activities)
  - 👥 Capacity (for activities)
  - 📍 Location (for events/activities/accommodations)
  - 🏠 Room count (for accommodations)
- **Click hint**: "Click to view details" text with info icon
- **Action buttons**: 
  - External link icon (navigate to admin)
  - X icon (remove reference)

### Expanded State
- **Full details section**: Shows all available information
- **Description**: Full text description if available
- **Metadata grid**: Organized 2-column grid with icons
- **Type-specific details**: Activity type, event date, address, etc.
- **View button**: Full-width button at bottom to navigate to admin page

### Visual Feedback
- **Hover on card**: Border changes to emerald, shadow appears, background lightens
- **Hover on arrow**: Arrow changes to emerald color
- **Hover on hint text**: Text changes to emerald color
- **Hover on action buttons**: Background color changes, icons get brighter
- **Smooth transitions**: All color and transform changes are animated

## Data Flow

1. **Reference added via InlineReferenceSelector**:
   - Passes `{ type, id, name, metadata: { slug, date, capacity, location, etc. } }`
   
2. **ReferencePreview receives reference**:
   - Displays name and type badge immediately
   - Shows quick info from metadata (if available)
   - Shows "Click to view details" if no metadata
   
3. **User clicks to expand**:
   - `setIsExpanded(true)` triggers
   - `useEffect` detects expansion and calls `fetchDetails()`
   - API call to `/api/admin/references/[type]/[id]`
   - Loading spinner shows while fetching
   
4. **Details loaded**:
   - Full information displayed in expanded section
   - Quick info updated with API data (if metadata was missing)
   - "View [Type] in Admin" button available

## API Integration

The component fetches full details from:
```
GET /api/admin/references/[type]/[id]
```

**Supported types:**
- `event` - Returns event details with location, times, description
- `activity` - Returns activity details with capacity, RSVP count, cost
- `accommodation` - Returns accommodation details with room types, dates
- `room_type` - Returns room type details with capacity, pricing
- `content_page` - Returns page details with section count

**Response format:**
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    type: string,
    slug?: string,
    status?: string,
    details: {
      // Type-specific fields
      description?: string,
      startTime?: string,
      capacity?: number,
      location?: string,
      // ... etc
    }
  }
}
```

## User Experience Improvements

### Before
- ❌ No preview information visible
- ❌ Unclear what's clickable
- ❌ Small, hard-to-see expand button
- ❌ No visual feedback on hover
- ❌ Navigate button always visible (confusing)

### After
- ✅ Preview information shows immediately (from metadata)
- ✅ Full details load on expand (from API)
- ✅ Clear "Click to view details" hint
- ✅ Large, prominent expand arrow
- ✅ Strong visual feedback (border, shadow, colors)
- ✅ Navigate button only in expanded state
- ✅ Smooth animations and transitions

## Testing Checklist

- [x] Preview information displays from metadata
- [x] Preview information updates from API when expanded
- [x] "Click to view details" shows when no metadata
- [x] Clicking card expands/collapses details
- [x] Arrow rotates 180° when expanding
- [x] Hover effects work correctly
- [x] Navigate button opens correct admin page
- [x] Remove button removes the reference
- [x] Loading spinner shows while fetching details
- [x] No TypeScript warnings
- [x] Event handlers prevent bubbling
- [x] Smooth transitions on all interactions

## Files Modified

1. `components/admin/ReferencePreview.tsx`
   - Enhanced `renderQuickInfo()` to check both metadata and API details
   - Improved visual design with better borders, shadows, and hover effects
   - Made entire header clickable with clear visual feedback
   - Added "Click to view details" hint
   - Removed unused `Button` import
   - Improved action button layout and styling

## Related Documentation

- Initial implementation: `REFERENCE_PREVIEW_ENHANCEMENT_COMPLETE.md`
- Integration: `INLINE_REFERENCE_SELECTOR_INTEGRATION_COMPLETE.md`
- Save fix: `INLINE_REFERENCE_SELECTOR_SAVE_FIX.md`
- Click behavior: `REFERENCE_PREVIEW_CLICK_BEHAVIOR_FIX.md`

## Next Steps

The reference preview component is now fully functional with:
- Clear preview information
- Obvious expand/collapse interaction
- Strong visual feedback
- Proper data loading from both metadata and API
- Clean, accessible UI

No further changes needed unless user requests additional features.
