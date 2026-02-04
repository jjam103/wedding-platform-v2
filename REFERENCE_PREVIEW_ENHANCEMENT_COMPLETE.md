# Reference Preview Enhancement Complete

## Overview
Enhanced the `ReferencePreview` component to display rich information about references with an expandable dropdown interface and clickable navigation to the reference object.

## Changes Made

### 1. Enhanced ReferencePreview Component (`components/admin/ReferencePreview.tsx`)

#### New Features

**Collapsible Interface:**
- Compact header view showing type badge, name, and quick info (date, capacity, location)
- Dropdown arrow button to expand/collapse full details
- Smooth transitions and visual feedback

**Rich Information Display:**
- **Collapsed State**: Shows type badge, name, and 2-3 key metadata points
- **Expanded State**: Fetches and displays full details from API including:
  - Complete description
  - All metadata in organized grid layout
  - Type-specific information (activity type, event date, address, etc.)
  - Status indicators with appropriate colors

**Navigation:**
- Clickable "Go to" button (external link icon) that navigates to the admin page for that reference type
- Opens in same window for seamless workflow
- Uses Next.js router for client-side navigation

**Visual Design:**
- Clean card layout with hover effects
- Icon-based metadata display (calendar, clock, location, people, money, etc.)
- Color-coded type badges (Event=purple, Activity=blue, Page=green, Accommodation=orange, Location=teal)
- Loading spinner while fetching details
- Responsive grid layout for metadata

#### API Integration

The component now fetches full reference details when expanded:

```typescript
GET /api/admin/references/{type}/{id}
```

This provides complete information including:
- Full description
- All metadata fields
- Type-specific properties
- Status information

#### User Experience

**Collapsed View:**
```
[Type Badge] Reference Name
Date • Capacity • Location
[▼] [→] [×]
```

**Expanded View:**
```
[Type Badge] Reference Name
Date • Capacity • Location
[▲] [→] [×]
─────────────────────────
Description
Full description text here...

[Grid of metadata with icons]
📅 Date: Jan 6, 2026
🕐 Time: 6:02 PM
📍 Location: Beach Resort
👥 Capacity: 50 guests
💰 Cost: $150
🔗 Slug: /yoga-session

Activity Type
Wellness Activity
```

### 2. Navigation Behavior

**Click "Go to" button:**
- Events → `/admin/events`
- Activities → `/admin/activities`
- Content Pages → `/admin/content-pages`
- Accommodations → `/admin/accommodations`
- Locations → `/admin/locations`

The admin page will load with all items, and the user can search/filter to find the specific reference.

### 3. Metadata Display

**Supported Fields:**
- Date (with calendar icon)
- Time (with clock icon)
- Location (with map pin icon)
- Capacity (with people icon)
- Cost (with money icon)
- Slug (with link icon)
- Room count (with house icon)
- Status (with checkmark icon, color-coded)

**Type-Specific Fields:**
- **Activities**: Activity type (ceremony, reception, meal, etc.)
- **Events**: Event date with full formatting
- **Accommodations**: Address and city
- **Locations**: Hierarchical location information

## Benefits

1. **Better Information Density**: Shows key info at a glance, full details on demand
2. **Improved Navigation**: One-click access to edit the referenced item
3. **Visual Clarity**: Icons and color coding make information scannable
4. **Performance**: Only fetches full details when user expands
5. **Consistency**: Universal pattern for all reference types in sections

## Example Use Cases

### Scenario 1: Activity Reference in Event Section
```
User adds "Yoga Session" activity reference to event section
→ Sees: [Activity] Yoga Session • Jan 6 • 50 guests
→ Clicks dropdown: Full details with time, location, cost, description
→ Clicks "Go to": Opens activities page to edit if needed
```

### Scenario 2: Content Page Reference
```
User adds "Transportation Info" page reference
→ Sees: [Page] Transportation Info • /transportation-info
→ Clicks dropdown: Full description and status
→ Clicks "Go to": Opens content pages to edit
```

### Scenario 3: Accommodation Reference
```
User adds "Beach Resort" accommodation
→ Sees: [Accommodation] Beach Resort • 25 rooms
→ Clicks dropdown: Address, room count, amenities
→ Clicks "Go to": Opens accommodations page
```

## Technical Implementation

### State Management
- `isExpanded`: Controls dropdown visibility
- `details`: Stores fetched reference data
- `loading`: Shows loading spinner during fetch

### API Call
```typescript
useEffect(() => {
  if (isExpanded && !details && !loading) {
    fetchDetails();
  }
}, [isExpanded]);
```

Only fetches once per reference, caches result.

### Responsive Design
- Grid layout adapts to content
- Icons scale appropriately
- Truncation prevents overflow
- Mobile-friendly touch targets

## Testing Recommendations

1. **Expand/Collapse**: Verify smooth animation and state persistence
2. **API Fetch**: Test with all reference types (event, activity, page, accommodation, location)
3. **Navigation**: Confirm correct admin page opens for each type
4. **Loading State**: Verify spinner shows during fetch
5. **Error Handling**: Test with invalid/deleted references
6. **Metadata Display**: Verify all field types render correctly
7. **Remove Button**: Confirm removal works from both collapsed and expanded states

## Related Files
- `components/admin/ReferencePreview.tsx` - Enhanced component
- `components/admin/SectionEditor.tsx` - Uses ReferencePreview
- `app/api/admin/references/[type]/[id]/route.ts` - API endpoint for fetching details
- `schemas/cmsSchemas.ts` - Reference type definitions

## Status
✅ **COMPLETE** - Reference preview now shows rich information with expandable details and navigation
