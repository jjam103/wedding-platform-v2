# B2 Storage Fix Guide

## Current Status: ✅ Uploads Working, ❌ CDN Access Blocked

**GOOD NEWS**: B2 uploads are working! Photos are successfully uploading to B2 storage.

**ISSUE**: Cloudflare CDN cannot access the photos because the bucket is **Private**.

**Root Cause**: The B2 bucket `wedding-photos-2026-jamara` is set to **Private**, which blocks Cloudflare CDN from serving the images. This causes HTTP 401 Unauthorized errors when trying to load images through the CDN.

**Test Results**:
- ✅ Direct B2 URL works: `https://s3.us-east-005.backblazeb2.com/wedding-photos-2026-jamara/photos/...`
- ❌ CDN URL fails: `https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/...` (HTTP 401)

## The Problem

Diagnostic test results show:
- ✅ Bucket exists: `wedding-photos-2026-jamara`
- ✅ Bucket endpoint: `s3.us-east-005.backblazeb2.com` (matches config)
- ✅ Application key working: Photos upload successfully
- ✅ Direct B2 URLs work: Files are accessible via `s3.us-east-005.backblazeb2.com`
- ❌ **Bucket is Private** (not Public)
- ❌ **Cloudflare CDN returns HTTP 401 Unauthorized**

The bucket privacy setting is blocking Cloudflare CDN from accessing the files.

## Fix Steps - MAKE BUCKET PUBLIC

The application key you created is correct. The issue is that the bucket itself needs to be public for Cloudflare CDN to access it.

### Step 1: Make Bucket Public

1. Go to: https://secure.backblaze.com/b2_buckets.htm
2. Find your bucket: **`wedding-photos-2026-jamara`**
3. Click the **Settings** button (gear icon) next to the bucket
4. Under **"Bucket Info"**, find the setting **"Files in Bucket are:"**
5. Change from **"Private"** to **"Public"**
6. Click **"Update Bucket"** to save

**Why this is safe:**
- Wedding photos are meant to be shared with guests
- Filenames are obscure (timestamp + random characters)
- Cloudflare provides DDoS protection
- You still control access through your application

### Step 2: Wait for Propagation

Wait 5-10 minutes for the bucket privacy change to propagate through B2's systems.

### Step 3: Test CDN Access

Run the diagnostic script to verify CDN access is working:

```bash
node scripts/test-cdn-urls.mjs
```

**Expected output after making bucket public:**
```
📝 Testing: B2 Native Path (With /file/)
   ✅ SUCCESS! HTTP 200
   Content-Type: image/jpeg
```

If you still see HTTP 401, wait a few more minutes and test again.

### Step 4: Restart Dev Server

Once the CDN test passes, restart your dev server:

```bash
# Press Ctrl+C in your terminal
npm run dev
```

Look for: `✓ B2 client initialized successfully`

### Step 5: Upload New Test Photo

1. Go to http://localhost:3000/admin/photos
2. Click **"Upload Photos"**
3. Upload a test image
4. Verify:
   - ✅ Blue "B2" badge appears
   - ✅ Image preview loads correctly
   - ✅ No console errors

### Step 6: Verify CDN URL

The uploaded photo should have a URL like:
```
https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/[timestamp]-[filename]
```

Open this URL in a new browser tab - the image should load successfully!

## What Changed?

The application key you created is working correctly - photos are uploading to B2 successfully. The issue was that the bucket privacy setting was blocking Cloudflare CDN from accessing the files.

By making the bucket **Public**, you allow:
1. **Cloudflare CDN** to cache and serve your images
2. **Anyone with the URL** to view photos (which is what you want for a wedding site)
3. **Faster load times** through CDN caching
4. **Lower bandwidth costs** on your B2 account

The files are still protected by obscure URLs (long random filenames), so only people with the link can access them.

## Alternative: Use Supabase Storage Only

If you can't resolve the B2 issues, the application will automatically fall back to Supabase Storage. This works perfectly fine, but:

- **Pros**: No configuration needed, works immediately
- **Cons**: Higher storage costs, no CDN optimization

To use Supabase only, you can remove the B2 environment variables from `.env.local`:

```bash
# Comment out or remove these lines:
# B2_ACCESS_KEY_ID=...
# B2_SECRET_ACCESS_KEY=...
# B2_ENDPOINT=...
# B2_REGION=...
# B2_BUCKET_NAME=...
# B2_CDN_DOMAIN=...
```

The application will automatically use Supabase Storage for all uploads.

## Diagnostic Commands

### Test B2 Connection
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

### Check Environment Variables
```bash
grep "B2_" .env.local
```

Should show:
```
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
```

### Check Server Logs
Look for these messages in the dev server output:
```
✓ B2 client initialized successfully  # Good!
⚠ B2 credentials not configured        # Missing env vars
⚠ Failed to initialize B2 client       # Configuration error
```

## Common Issues

### Issue: "Bucket not found"
- **Cause**: Bucket name is wrong or bucket doesn't exist
- **Fix**: Verify bucket name in B2 console matches `.env.local`

### Issue: "Access Denied" / HTTP 403
- **Cause**: Application key doesn't have permissions
- **Fix**: Create new key with listBuckets, listFiles, readFiles, writeFiles

### Issue: "Region mismatch"
- **Cause**: Bucket is in different region than configured
- **Fix**: Update `B2_REGION` and `B2_ENDPOINT` to match bucket's actual region

### Issue: "CDN URL returns 404"
- **Cause**: Cloudflare DNS not configured or bucket not public
- **Fix**: 
  1. Make bucket public in B2 console
  2. Verify Cloudflare CNAME points to correct S3 endpoint

## Next Steps

1. **Immediate**: Log into Backblaze B2 console and verify bucket + key configuration
2. **If bucket is in different region**: Update `.env.local` to match
3. **If key is wrong**: Create new application key with correct permissions
4. **After fixing**: Restart dev server and test upload
5. **If still not working**: Use Supabase Storage only (remove B2 env vars)

## Support

If you continue to have issues:
1. Check the B2 console for any error messages or alerts
2. Verify your B2 account is active and in good standing
3. Try creating a completely new bucket and application key
4. Contact Backblaze B2 support if the issue persists
