# B2 CDN URL Format Fix - FINAL

## Issue

Photos uploaded to B2 were showing the blue "B2" badge (indicating successful upload), but images weren't loading. The console showed:

```
Image failed to load: "https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"
```

Testing the URL with curl showed HTTP 404:
```bash
curl -I "https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"
# HTTP/2 404
```

## Root Cause

The B2 service was generating CDN URLs with the `/file/bucket-name/` prefix, which is the format for direct B2 URLs. However, since Cloudflare CDN is configured with a CNAME pointing `cdn.jamara.us` directly to `s3.us-east-005.backblazeb2.com`, the bucket is already resolved by DNS.

**❌ Wrong Format (with /file/bucket-name/):**
```
https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/[filename]
```

**✅ Correct Format (bucket resolved by DNS):**
```
https://cdn.jamara.us/photos/[filename]
```

## Fix Applied

Updated `services/b2Service.ts` in two places to remove the `/file/bucket-name/` prefix:

### 1. Upload Function (line ~138)
```typescript
// OLD:
const cdnDomain = process.env.B2_CDN_DOMAIN || process.env.CLOUDFLARE_CDN_URL?.replace(/^https?:\/\//, '') || '';
const bucketName = process.env.B2_BUCKET_NAME || '';
const url = `https://${cdnDomain}/file/${bucketName}/${key}`;

// NEW:
const cdnDomain = process.env.B2_CDN_DOMAIN || process.env.CLOUDFLARE_CDN_URL?.replace(/^https?:\/\//, '') || '';
const url = `https://${cdnDomain}/${key}`;
```

### 2. generateCDNUrl Function (line ~232)
```typescript
// OLD:
export function generateCDNUrl(key: string): string {
  const cdnDomain = process.env.B2_CDN_DOMAIN || process.env.CLOUDFLARE_CDN_URL?.replace(/^https?:\/\//, '') || '';
  const bucketName = process.env.B2_BUCKET_NAME || '';
  return `https://${cdnDomain}/file/${bucketName}/${key}`;
}

// NEW:
export function generateCDNUrl(key: string): string {
  const cdnDomain = process.env.B2_CDN_DOMAIN || process.env.CLOUDFLARE_CDN_URL?.replace(/^https?:\/\//, '') || '';
  return `https://${cdnDomain}/${key}`;
}
```

## Testing Required

### Step 1: Restart Dev Server (CRITICAL!)

The code changes won't take effect until you restart:

```bash
# Press Ctrl+C in your terminal
# Then restart:
npm run dev
```

### Step 2: Upload a NEW Photo

**IMPORTANT**: The old photos in the database still have the wrong URLs. You need to upload a NEW photo to test the fix.

1. Go to http://localhost:3000/admin/photos
2. Click "Upload Photos"
3. Upload a NEW test image
4. Verify:
   - ✅ Storage badge shows "B2" (blue)
   - ✅ Image preview loads correctly
   - ✅ No console errors

### Step 3: Verify URL Format

The new photo URL should be:
```
https://cdn.jamara.us/photos/[timestamp]-[filename]
```

Notice there is NO `/file/wedding-photos-2026-jamara/` in the path - just `/photos/`.

### Step 4: Test in Browser

Open the photo URL in a new browser tab. The image should load successfully.

## What About Old Photos?

The old photos have wrong URLs stored in the database. You have two options:

### Option 1: Delete and Re-upload (Recommended for Testing)
1. Delete the old photos from the admin panel
2. Upload them again
3. New URLs will be correct

### Option 2: Manual Database Update (If You Have Many Photos)
If you have many photos with wrong URLs, you could run a database migration to fix them:

```sql
-- Fix photos with /file/bucket-name/ prefix
UPDATE photos 
SET photo_url = REPLACE(
  photo_url, 
  'https://cdn.jamara.us/file/wedding-photos-2026-jamara/', 
  'https://cdn.jamara.us/'
)
WHERE storage_type = 'b2' 
AND photo_url LIKE 'https://cdn.jamara.us/file/wedding-photos-2026-jamara/%';

-- Fix photos without /file/ prefix but with bucket name
UPDATE photos 
SET photo_url = REPLACE(
  photo_url, 
  'https://cdn.jamara.us/wedding-photos-2026-jamara/', 
  'https://cdn.jamara.us/'
)
WHERE storage_type = 'b2' 
AND photo_url LIKE 'https://cdn.jamara.us/wedding-photos-2026-jamara/%';
```

## Success Criteria

B2 storage is fully working when:
1. ✅ Upload shows blue "B2" badge
2. ✅ Image preview loads in admin panel
3. ✅ No console errors about failed image loads
4. ✅ URL format is `https://cdn.jamara.us/photos/[filename]` (no bucket name in path)
5. ✅ Images load when opened in new browser tab

## Why This Format?

When you configure Cloudflare CDN with a CNAME record:
- `cdn.jamara.us` → `s3.us-east-005.backblazeb2.com`

Cloudflare proxies requests to B2, and B2 knows which bucket to serve based on the DNS resolution. The bucket name is NOT needed in the URL path because:
1. The CNAME points to the specific B2 region endpoint
2. The B2 application key is restricted to a specific bucket
3. B2 automatically serves files from that bucket

## Files Modified

- `services/b2Service.ts` - Removed `/file/bucket-name/` prefix from CDN URL generation

## Related Issues

This completes the B2 storage setup:
1. ✅ Fixed environment variable names (B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY)
2. ✅ Fixed region mismatch (us-west-004 → us-east-005)
3. ✅ Created new application key with proper bucket permissions
4. ✅ Fixed CDN URL format to remove `/file/bucket-name/` prefix

---

**Status**: Code fixed, awaiting server restart and new photo upload test
**Date**: 2026-02-03
**Issue**: B2 photos uploaded but not loading (404 errors)
**Resolution**: Removed `/file/bucket-name/` prefix from CDN URLs since Cloudflare CNAME resolves bucket automatically
