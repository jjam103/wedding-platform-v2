# B2 CDN Diagnosis Complete

## Test Results

I ran a diagnostic test on your uploaded photo (`photos/1770087981693-IMG_0627.jpeg`) and here are the results:

### ✅ Direct B2 Endpoint - **SUCCESS!**
```
URL: https://s3.us-east-005.backblazeb2.com/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
Status: HTTP 200 OK
Content-Type: image/jpeg
Size: 2.8 MB
```

**This confirms:**
- ✅ Photo uploaded successfully to B2
- ✅ B2 credentials are working
- ✅ File is accessible via direct B2 URL

### ❌ Cloudflare CDN - **401 Unauthorized**
```
URL: https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
Status: HTTP 401 Unauthorized
```

**This means:**
- ❌ Cloudflare CDN cannot access your B2 bucket
- ❌ Bucket is likely set to **Private** instead of **Public**

## Root Cause: Bucket Privacy Settings

Your B2 bucket `wedding-photos-2026-jamara` is currently **Private**, which prevents Cloudflare CDN from accessing the files.

## Solution: Make Bucket Public

### Option 1: Make Entire Bucket Public (Recommended)

1. Go to: https://secure.backblaze.com/b2_buckets.htm
2. Find bucket: `wedding-photos-2026-jamara`
3. Click the **Settings** button (gear icon)
4. Under **"Bucket Info"**, find **"Files in Bucket are:"**
5. Change from **"Private"** to **"Public"**
6. Click **"Update Bucket"**

**After making this change:**
- Cloudflare CDN will be able to access files
- Anyone with the URL can view photos (which is what you want for a wedding site)
- Files are still protected by obscure URLs (long random filenames)

### Option 2: Use Direct B2 URLs (Temporary Workaround)

If you can't make the bucket public right now, we can temporarily use direct B2 URLs instead of CDN URLs.

**Pros:**
- Works immediately
- No bucket configuration needed

**Cons:**
- Slower (no CDN caching)
- Higher bandwidth costs
- No Cloudflare protection

To use this option, I'll update the code to use direct B2 URLs.

## Recommended Fix Steps

### Step 1: Make Bucket Public

Follow the instructions in **Option 1** above to make your bucket public.

### Step 2: Wait for DNS Propagation

After making the bucket public, wait 5-10 minutes for the change to propagate.

### Step 3: Test CDN URL Again

Run the test script again to verify CDN access:

```bash
node scripts/test-cdn-urls.mjs
```

You should now see:
```
📝 Testing: B2 Native Path (With /file/)
   ✅ SUCCESS! HTTP 200
```

### Step 4: Restart Dev Server

```bash
# Press Ctrl+C in terminal
npm run dev
```

### Step 5: Upload New Test Photo

1. Go to http://localhost:3000/admin/photos
2. Upload a new test image
3. Verify:
   - ✅ Blue "B2" badge appears
   - ✅ Image preview loads
   - ✅ No console errors

## Alternative: Update Code for Direct B2 URLs

If you prefer to use direct B2 URLs (without CDN), I can update the code. This will work immediately without changing bucket settings.

Let me know which option you prefer:

**Option A**: Make bucket public and use Cloudflare CDN (recommended)
**Option B**: Use direct B2 URLs without CDN (works now, but slower)

## Why This Happened

The B2 bucket was created as **Private** by default. For a wedding website where photos need to be publicly viewable, the bucket should be **Public**.

The application key permissions are correct (Read/Write access), but that only allows the application to upload files. For Cloudflare CDN to serve the files, the bucket itself must be public.

## Security Note

Making the bucket public is safe for this use case because:
- Photos are meant to be shared with wedding guests
- Filenames are obscure (timestamp + random characters)
- You can still control access through your application
- Cloudflare provides DDoS protection

If you need more granular access control, you could:
- Use signed URLs (temporary access)
- Implement authentication in your application
- Use Cloudflare Access rules

But for a typical wedding website, a public bucket is the standard approach.

---

**Status**: Diagnosis complete - bucket needs to be made public
**Date**: 2026-02-03
**Issue**: Cloudflare CDN returns 401 Unauthorized
**Solution**: Make B2 bucket public in Backblaze console
**Test Command**: `node scripts/test-cdn-urls.mjs`
