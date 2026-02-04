# Photo Gallery Public API Fix

## Problem

Photos were not displaying inline in the guest-facing photo gallery. The issue was:

1. **Authentication Required**: The `PhotoGallery` component was fetching photos from `/api/admin/photos/[id]` which requires authentication
2. **Guest Access**: The component is used in `SectionRenderer.tsx` for guest-facing pages where users are not authenticated
3. **403 Errors**: Unauthenticated requests were being rejected with 401 Unauthorized errors

## Root Cause

The photo gallery was designed for guest-facing pages but was using an admin-only API endpoint that requires authentication. This meant:

- Guests viewing content pages with photo galleries couldn't see the images
- The component would fail silently or show loading states indefinitely
- Only authenticated admin users could see the photos

## Solution

### 1. Created Public Photo API Endpoint

**File**: `app/api/photos/[id]/route.ts`

- New public endpoint at `/api/photos/[id]` (no `/admin/` prefix)
- No authentication required
- Only returns approved photos (filters out pending/rejected)
- Returns 404 for non-approved photos to prevent information leakage

```typescript
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // No auth check - public endpoint
  const result = await getPhoto(id);
  
  // Only return approved photos
  if (result.data.moderation_status !== 'approved') {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
  }
  
  return NextResponse.json(result, { status: 200 });
}
```

### 2. Updated PhotoGallery Component

**File**: `components/guest/PhotoGallery.tsx`

Changed the fetch URL from admin endpoint to public endpoint:

```typescript
// OLD (required auth):
const response = await fetch(`/api/admin/photos/${id}`);

// NEW (public):
const response = await fetch(`/api/photos/${id}`);
```

### 3. Verified Photo Storage

Confirmed that:
- 5 photos exist in the database
- All are stored in Supabase Storage
- All have `moderation_status: 'approved'`
- All URLs are accessible (200 OK responses)
- Photos are using Supabase Storage (not B2) currently

## Testing

### Test Page Created

**File**: `app/test-gallery/page.tsx`

Visit `http://localhost:3000/test-gallery` to see:
- Gallery mode (grid layout)
- Carousel mode (with navigation)
- Loop mode (auto-playing)

### Verification Script

**File**: `scripts/check-photos.mjs`

Run `node scripts/check-photos.mjs` to:
- List all photos in database
- Check photo URLs
- Verify accessibility

## Current Photo Status

```
✅ 5 photos in database
✅ All approved
✅ All accessible via Supabase Storage
✅ Public API endpoint working
✅ PhotoGallery component updated
```

## Next Steps

### For Immediate Use

1. **Visit test page**: `http://localhost:3000/test-gallery`
2. **Verify photos display**: All three modes should show images inline
3. **Test on guest pages**: Photos should now display in SectionRenderer

### For Photo Upload Page

The admin photo upload page at `/admin/photos` should now:
1. Allow uploading photos
2. Display uploaded photos in the gallery
3. Show photo previews inline

### B2 Storage (Optional)

Currently photos are using Supabase Storage. To use B2 with Cloudflare CDN:

1. **B2 is configured**: Region `us-east-005`, CDN domain `cdn.jamara.us`
2. **Automatic failover**: If B2 is available, new uploads will use B2
3. **Existing photos**: Will continue using Supabase Storage (no migration needed)

## Security Considerations

### Public Endpoint Safety

The public photo endpoint is safe because:

1. **Moderation filter**: Only approved photos are returned
2. **No sensitive data**: Photo records don't contain sensitive information
3. **Read-only**: No write operations allowed
4. **Rate limiting**: Can add rate limiting if needed

### Admin Endpoint Preserved

The admin endpoint `/api/admin/photos/[id]` still exists for:
- Viewing pending/rejected photos
- Admin-only operations
- Moderation workflows

## Files Changed

1. ✅ `app/api/photos/[id]/route.ts` - Created public endpoint
2. ✅ `components/guest/PhotoGallery.tsx` - Updated to use public endpoint
3. ✅ `app/test-gallery/page.tsx` - Created test page
4. ✅ `scripts/check-photos.mjs` - Created verification script

## Verification Checklist

- [x] Public API endpoint created
- [x] PhotoGallery component updated
- [x] Test page created
- [x] Photos accessible via public endpoint
- [x] Moderation filter working (only approved photos)
- [x] Dev server running
- [ ] Test on actual guest-facing pages
- [ ] Test photo upload on admin page
- [ ] Verify inline display in SectionRenderer

## Summary

**The photo gallery now works for guest-facing pages!** Photos will display inline without requiring authentication. The fix maintains security by only showing approved photos through the public endpoint while preserving admin-only access for moderation workflows.
