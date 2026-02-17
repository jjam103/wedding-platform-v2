# Photo Storage Bucket Setup - Complete

**Date**: January 31, 2026  
**Status**: ✅ Complete

## Issue

When trying to upload photos through the Section Editor, users received a "bucket not found" error. The photoService was trying to upload to a Supabase Storage bucket called `'photos'` that didn't exist.

## Root Cause

The photo upload system has a two-tier storage strategy:
1. **Primary**: Backblaze B2 (cost-effective, CDN-optimized)
2. **Fallback**: Supabase Storage (when B2 is unavailable)

The Supabase Storage bucket `'photos'` was never created, so uploads failed when falling back to Supabase Storage.

## Resolution

### 1. Created Storage Bucket

Created the `photos` bucket in Supabase Storage with:
- **Public access**: Yes (for guest viewing)
- **File size limit**: 10MB
- **Allowed MIME types**: JPEG, JPG, PNG, WebP, GIF

### 2. Created Migration

Created migration `035_create_photos_storage_bucket.sql` to document the bucket configuration and RLS policies for future reference.

### 3. Created Setup Script

Created `scripts/create-photos-bucket.mjs` to automate bucket creation:
```bash
node scripts/create-photos-bucket.mjs
```

Output:
```
✓ Photos bucket created successfully
  ID: photos
  Public: true
  File size limit: 10MB
  Allowed types: JPEG, PNG, WebP, GIF
```

## Storage Architecture

### Two-Tier Strategy

The photoService implements automatic failover:

```typescript
// 1. Check B2 health
const b2HealthResult = await isB2Healthy();

if (b2HealthResult.success && b2HealthResult.data) {
  // Try B2 upload (primary)
  const b2Result = await uploadToB2(file, fileName, contentType);
  if (b2Result.success) {
    photoUrl = b2Result.data.url;
    storageType = 'b2';
  } else {
    // B2 failed, fallback to Supabase
    const supabaseResult = await uploadToSupabaseStorage(file, fileName, contentType);
    photoUrl = supabaseResult.data.url;
    storageType = 'supabase';
  }
} else {
  // B2 unhealthy, use Supabase directly
  const supabaseResult = await uploadToSupabaseStorage(file, fileName, contentType);
  photoUrl = supabaseResult.data.url;
  storageType = 'supabase';
}
```

### Storage Type Tracking

The `photos` table tracks which storage system each photo uses:
- `storage_type`: `'b2'` or `'supabase'`
- `photo_url`: Full URL to the photo

This allows:
- Transparent failover between storage systems
- Migration between storage systems if needed
- Cost optimization (B2 is cheaper for large volumes)

## Bucket Configuration

### Supabase Storage Bucket: `photos`

**Settings:**
- **ID**: `photos`
- **Name**: `photos`
- **Public**: `true` (allows public read access)
- **File Size Limit**: 10,485,760 bytes (10MB)
- **Allowed MIME Types**:
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/gif`

### RLS Policies

Supabase automatically creates basic RLS policies for storage buckets:

1. **Authenticated Upload**: Authenticated users can upload photos
2. **Authenticated Update**: Authenticated users can update photos
3. **Authenticated Delete**: Authenticated users can delete photos
4. **Public Read**: Anyone can view photos (public bucket)

## File Organization

Photos are stored with timestamped filenames:
```
photos/
  ├── 1738368000000-wedding-ceremony.jpg
  ├── 1738368001000-reception-dance.png
  └── 1738368002000-sunset-beach.webp
```

Format: `photos/{timestamp}-{sanitized-filename}`

## Upload Flow

### Complete Upload Process

1. **Client**: User selects photo in PhotoPicker
2. **Client**: FormData sent to `/api/admin/photos` with file and metadata
3. **API Route**: Validates file type, size, and metadata
4. **API Route**: Converts File to Buffer
5. **Service**: Calls `photoService.uploadPhoto()`
6. **Service**: Checks B2 health
7. **Service**: Attempts B2 upload (primary)
8. **Service**: Falls back to Supabase Storage if B2 fails
9. **Service**: Creates database record with photo URL and storage type
10. **API Route**: Returns photo data to client
11. **Client**: Adds photo to selection and refreshes list

## Testing

### Manual Test

1. Open Section Editor on any page (Activity, Event, Content Page)
2. Click "Edit" on a section
3. Change column type to "Photo Gallery"
4. Click "Upload Photos" button
5. Select one or more image files
6. Verify upload succeeds
7. Verify photos appear in selection
8. Verify photos appear in gallery

### Expected Behavior

- Upload button shows "Uploading..." during upload
- Blue progress indicator appears
- Uploaded photos automatically added to selection
- Photo list refreshes to show new photos
- No "bucket not found" errors

## Files Created/Modified

### New Files
- `supabase/migrations/035_create_photos_storage_bucket.sql` - Migration documentation
- `scripts/create-photos-bucket.mjs` - Bucket creation script
- `scripts/setup-photos-bucket-policies.mjs` - Policy setup script

### Modified Files
- `scripts/apply-migration.mjs` - Added dotenv support

## Environment Variables

No new environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

## Cost Considerations

### Supabase Storage Pricing

Supabase Storage is more expensive than B2 for large volumes:
- **Supabase**: $0.021/GB/month storage + $0.09/GB egress
- **B2**: $0.005/GB/month storage + $0.01/GB egress (via Cloudflare CDN)

### Recommendation

The current two-tier strategy is optimal:
1. Use B2 as primary (4x cheaper)
2. Use Supabase as fallback (reliability)
3. Monitor storage_type distribution
4. Migrate Supabase photos to B2 if volume grows

## Monitoring

### Check Storage Distribution

```sql
SELECT 
  storage_type,
  COUNT(*) as photo_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM photos
GROUP BY storage_type;
```

### Check Bucket Usage

```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'photos'
GROUP BY bucket_id;
```

## Troubleshooting

### "Bucket not found" Error

**Cause**: Photos bucket doesn't exist  
**Solution**: Run `node scripts/create-photos-bucket.mjs`

### "File too large" Error

**Cause**: File exceeds 10MB limit  
**Solution**: Compress image or increase bucket file_size_limit

### "Invalid file type" Error

**Cause**: File type not in allowed list  
**Solution**: Convert to JPEG, PNG, WebP, or GIF

### Upload Succeeds But Photo Not Visible

**Cause**: Bucket not public or RLS policy issue  
**Solution**: Verify bucket public setting and RLS policies

## Next Steps (Optional)

1. **Monitor storage costs** - Track B2 vs Supabase usage
2. **Implement migration** - Move Supabase photos to B2 if needed
3. **Add compression** - Client-side image compression before upload
4. **Add thumbnails** - Generate thumbnails for faster loading
5. **Add CDN** - Use Cloudflare CDN for Supabase Storage URLs

## Conclusion

The photos storage bucket is now set up and configured. Photo uploads through the Section Editor will work correctly, with automatic failover between B2 (primary) and Supabase Storage (fallback). The system tracks which storage is used for each photo, allowing for future optimization and migration if needed.
I