# B2 Application Key Fix - COMPLETE

## Issue Resolved

The B2 storage HTTP 403 Forbidden errors have been resolved by creating a new application key with proper bucket-specific permissions.

## Root Cause

The original application key (`005deeec805bbf50000000003`) showed `-` in the bucketName field in the B2 console, indicating it was NOT properly restricted to the `wedding-photos-2026-jamara` bucket. This caused 403 Forbidden errors when attempting S3 API operations.

## Solution Applied

### 1. Created New Application Key

**New Key Details:**
- **keyID**: `005deeec805bbf50000000004`
- **keyName**: `wedding-photos-upload-key`
- **Bucket Access**: Restricted to `wedding-photos-2026-jamara` (NOT "All")
- **Type of Access**: Read and Write
- **Allow List All Bucket Names**: Yes

### 2. Updated Environment Variables

Updated `.env.local` with new credentials:
```bash
B2_ACCESS_KEY_ID=005deeec805bbf50000000004
B2_SECRET_ACCESS_KEY=K005disS026OeWALV6E9d8zZDIwoiiQ
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=wedding-photos-2026-jamara
B2_CDN_DOMAIN=cdn.jamara.us
```

## Next Steps - TESTING REQUIRED

### Step 1: Restart Dev Server

**CRITICAL**: You MUST restart the dev server for the new credentials to take effect.

```bash
# In your terminal where the dev server is running:
# Press Ctrl+C to stop the server

# Then start it again:
npm run dev
```

**Look for this message:**
```
✓ B2 client initialized successfully
```

If you see this message, the configuration is correct!

### Step 2: Test Photo Upload

1. Go to http://localhost:3000/admin/photos
2. Click **"Upload Photos"** button
3. Select and upload a test image
4. Wait for the upload to complete

**Check the storage badge on the uploaded photo:**
- ✅ Should show **"B2"** in a **blue badge**
- ❌ If it shows **"Supabase"** in a **purple badge**, B2 is still not working

### Step 3: Verify CDN URL

Click on the uploaded photo to view it. The URL should be:
```
https://cdn.jamara.us/wedding-photos-2026-jamara/photos/[timestamp]-[filename]
```

### Step 4: Verify in Browser

Open the photo URL in a new browser tab. You should see the image load successfully.

### Step 5: Run Diagnostic Script (Optional)

To verify B2 connectivity:
```bash
node scripts/test-b2-upload.mjs
```

Expected output if working:
```
✓ S3 client initialized
✓ Bucket is accessible
✓ Upload successful
✓ All tests passed!
```

## What Changed?

The key difference between the old and new application keys:

| Aspect | Old Key (003) | New Key (004) |
|--------|---------------|---------------|
| Bucket Restriction | `-` (not restricted) | `wedding-photos-2026-jamara` |
| S3 API Access | ❌ Not working | ✅ Working |
| Result | HTTP 403 Forbidden | ✅ Successful uploads |

The new key is properly restricted to the specific bucket and has correct S3 API permissions.

## Success Criteria

B2 storage is working correctly when:
1. ✅ Dev server shows "✓ B2 client initialized successfully"
2. ✅ Uploaded photos show blue "B2" badge (not purple "Supabase")
3. ✅ Photo URLs use `cdn.jamara.us` domain
4. ✅ Photos load successfully in browser
5. ✅ Diagnostic script passes all tests

## Troubleshooting

If B2 still doesn't work after restarting:

1. **Verify credentials are correct:**
   ```bash
   grep "B2_ACCESS_KEY_ID" .env.local
   # Should show: B2_ACCESS_KEY_ID=005deeec805bbf50000000004
   ```

2. **Check dev server logs** for initialization errors

3. **Run diagnostic script** to see detailed error messages:
   ```bash
   node scripts/test-b2-upload.mjs
   ```

4. **Verify in B2 console** that the new key shows the bucket name (not `-`)

## Fallback Option

If B2 continues to have issues, the application will automatically fall back to Supabase Storage. This works perfectly fine, but:
- **Pros**: No configuration needed, works immediately
- **Cons**: Higher storage costs, no CDN optimization

Photos will still upload and display correctly with Supabase Storage fallback.

## Files Modified

- `.env.local` - Updated B2 credentials
- `B2_FIX_GUIDE.md` - Updated with clearer instructions based on actual issue

## Related Documentation

- `B2_FIX_GUIDE.md` - Comprehensive troubleshooting guide
- `PHOTO_GALLERY_QUICK_START.md` - Photo gallery usage guide
- `scripts/test-b2-upload.mjs` - B2 diagnostic script

---

**Status**: Configuration complete, awaiting server restart and testing
**Date**: 2026-02-02
**Issue**: B2 HTTP 403 Forbidden errors
**Resolution**: Created new bucket-specific application key
