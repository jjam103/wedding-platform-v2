# Reference Navigation Fix

## Issue
Reference blocks in sections were not navigating correctly when clicked. They were trying to use entity IDs instead of slugs for navigation, resulting in 404 errors or incorrect routing.

## Root Cause
1. **SectionRenderer**: The `handleReferenceClick` function was using IDs for navigation instead of slugs
2. **Reference Search API**: Not returning slug data for events, activities, and accommodations
3. **ReferenceBlockPicker**: Not storing slug data in metadata when references were selected

## Changes Made

### 1. Updated SectionRenderer Component
**File**: `components/guest/SectionRenderer.tsx`

Fixed the `handleReferenceClick` function to use slugs for navigation:

```typescript
const handleReferenceClick = (reference: Reference) => {
  switch (reference.type) {
    case 'event':
      // Navigate to event page using slug if available, fallback to ID
      if (reference.metadata?.slug) {
        window.location.href = `/event/${reference.metadata.slug}`;
      } else {
        setSelectedEvent(reference.id);
      }
      break;
    case 'activity':
      // Navigate to activity page using slug if available, fallback to ID
      if (reference.metadata?.slug) {
        window.location.href = `/activity/${reference.metadata.slug}`;
      } else {
        setSelectedActivity(reference.id);
      }
      break;
    case 'content_page':
      // Navigate to content page using slug
      window.location.href = `/custom/${reference.metadata?.slug || reference.id}`;
      break;
    case 'accommodation':
      // Navigate to accommodation page using slug if available, fallback to ID
      window.location.href = `/accommodation/${reference.metadata?.slug || reference.id}`;
      break;
  }
};
```

**Benefits**:
- Uses slug-based URLs for all entity types
- Graceful fallback to modal preview if slug not available
- Consistent with universal slug support implementation

### 2. Updated Reference Search API
**File**: `app/api/admin/references/search/route.ts`

Added slug fields to all entity queries:

**Events**:
```typescript
.select('id, title, slug, date, location_id, locations(name)')
// Returns: { id, name, slug, date, location }
```

**Activities**:
```typescript
.select('id, title, slug, date, capacity, location_id, locations(name)')
// Returns: { id, name, slug, date, capacity, location }
```

**Accommodations**:
```typescript
.select('id, name, slug, location_id, locations(name), room_types(count)')
// Returns: { id, name, slug, location, room_count }
```

**Content Pages** (already had slug):
```typescript
.select('id, title, slug, type')
// Returns: { id, title, slug, type }
```

### 3. Updated ReferenceBlockPicker Component
**File**: `components/admin/ReferenceBlockPicker.tsx`

Updated all render functions to store slugs in metadata:

**Events**:
```typescript
metadata: { slug: event.slug, date: event.date, location: event.location }
```

**Activities**:
```typescript
metadata: { slug: activity.slug, date: activity.date, capacity: activity.capacity }
```

**Accommodations**:
```typescript
metadata: { slug: accommodation.slug, location: accommodation.location, room_count: accommodation.room_count }
```

**Content Pages** (already storing slug):
```typescript
metadata: { slug: page.slug, type: page.type }
```

## How It Works

### Reference Creation Flow
1. Admin searches for entity in ReferenceBlockPicker
2. API returns entity data including slug
3. When admin selects reference, slug is stored in metadata
4. Reference is saved to database with slug in metadata

### Reference Navigation Flow
1. Guest views page with reference blocks
2. SectionRenderer renders references with metadata
3. When guest clicks reference:
   - If slug exists in metadata → Navigate to `/[type]/[slug]`
   - If no slug → Show preview modal (fallback)
4. Next.js routes to correct page using slug

## Testing

### Manual Testing Steps
1. **Create References**:
   - Go to admin section editor
   - Add reference blocks for events, activities, content pages, accommodations
   - Verify slug appears in reference picker

2. **View References**:
   - Navigate to guest-facing page with references
   - Click each reference type
   - Verify navigation goes to correct slug-based URL
   - Verify page loads correctly (not 404)

3. **Test All Entity Types**:
   - Event reference → `/event/[slug]`
   - Activity reference → `/activity/[slug]`
   - Content page reference → `/custom/[slug]`
   - Accommodation reference → `/accommodation/[slug]`

### Expected Behavior
- ✅ All references navigate using slug-based URLs
- ✅ No 404 errors when clicking references
- ✅ Consistent URL structure across all entity types
- ✅ Graceful fallback for legacy references without slugs

## Related Files
- `components/guest/SectionRenderer.tsx` - Reference rendering and navigation
- `app/api/admin/references/search/route.ts` - Reference search with slug data
- `components/admin/ReferenceBlockPicker.tsx` - Reference selection with slug storage
- `app/event/[slug]/page.tsx` - Event detail page
- `app/activity/[slug]/page.tsx` - Activity detail page
- `app/accommodation/[slug]/page.tsx` - Accommodation detail page
- `app/[type]/[slug]/page.tsx` - Content page detail page

## Migration Notes

### Existing References
References created before this fix may not have slugs in metadata. The system handles this gracefully:
- If slug exists in metadata → Use slug for navigation
- If no slug → Fall back to preview modal (events/activities) or ID-based URL (accommodations/content pages)

### Database Considerations
No database migration required. Slugs are stored in the `metadata` JSONB field of reference objects within section columns.

## Status
✅ **COMPLETE** - All reference types now navigate using slug-based URLs with proper fallback handling.
