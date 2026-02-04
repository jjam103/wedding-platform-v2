# B2 CDN URL Troubleshooting

## Current Issue

Photos are uploading successfully to B2 (blue "B2" badge appears), but images fail to load with 404 errors.

**Latest Error:**
```
Image failed to load: "https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"
```

## Cloudflare CDN Configuration

Your Cloudflare DNS has:
- **CNAME**: `cdn.jamara.us` → `s3.us-east-005.backblazeb2.com`
- **Proxied**: Yes (orange cloud)

## Possible URL Formats

B2 with Cloudflare CDN can use different URL formats depending on configuration:

### Format 1: Direct S3 Path (No /file/ prefix)
```
https://cdn.jamara.us/wedding-photos-2026-jamara/photos/[filename]
```

### Format 2: B2 Native Path (With /file/ prefix)
```
https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/[filename]
```

### Format 3: Direct to Key (No bucket name)
```
https://cdn.jamara.us/photos/[filename]
```

## Testing Steps

### Step 1: Find an Uploaded File

From your recent uploads, you have:
- `photos/1770087981693-IMG_0627.jpeg`
- `photos/1770087821962-IMG_0632.jpeg`

### Step 2: Test Each URL Format

Open each URL in a new browser tab to see which one works:

**Test 1 - Direct S3 Path:**
```
https://cdn.jamara.us/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
```

**Test 2 - B2 Native Path:**
```
https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
```

**Test 3 - Direct to Key:**
```
https://cdn.jamara.us/photos/1770087981693-IMG_0627.jpeg
```

**Test 4 - Direct B2 Endpoint (No CDN):**
```
https://s3.us-east-005.backblazeb2.com/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
```

### Step 3: Report Which URL Works

Once you find which URL format successfully loads the image, let me know and I'll update the code to use that format.

## Alternative: Check Cloudflare Transform Rules

Your Cloudflare might have URL transform rules that affect the path. Check:

1. Go to Cloudflare Dashboard
2. Select your domain (`jamara.us`)
3. Go to **Rules** → **Transform Rules**
4. Check if there are any URL rewrites for `cdn.jamara.us`

Common transform rules:
- Remove `/file/bucket-name/` prefix
- Add `/file/bucket-name/` prefix
- Direct passthrough (no changes)

## Quick Fix: Use Direct B2 URLs

If CDN URLs aren't working, we can temporarily use direct B2 URLs:

```typescript
// In services/b2Service.ts, change the URL generation to:
const url = `https://s3.us-east-005.backblazeb2.com/${bucketName}/${key}`;
```

This bypasses Cloudflare CDN but will still work (just slower and more expensive).

## Next Steps

1. **Test all 4 URL formats** above in your browser
2. **Report which one loads the image successfully**
3. I'll update the code to use the correct format
4. Restart dev server
5. Upload new test photo
6. Verify it loads correctly

---

**Status**: Awaiting URL format test results
**Date**: 2026-02-03
**Issue**: B2 uploads succeed but images return 404
**Next**: Determine correct Cloudflare CDN URL format
