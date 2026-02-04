# 🔧 Cloudflare CNAME Fix - Step by Step

## The Problem

Your CNAME target is **missing the bucket name prefix**. This is why you're getting 404 errors.

## Visual Explanation

### ❌ Current (WRONG) Configuration:
```
User Request:
  https://cdn.jamara.us/photos/file.jpg
       ↓
Cloudflare CNAME points to:
  jamara.s3.us-east-005.backblazeb2.com  ← MISSING BUCKET NAME!
       ↓
Cloudflare tries to fetch:
  https://jamara.s3.us-east-005.backblazeb2.com/photos/file.jpg
       ↓
  ❌ 404 Not Found (this endpoint doesn't exist)
```

### ✅ Correct Configuration:
```
User Request:
  https://cdn.jamara.us/photos/file.jpg
       ↓
Cloudflare CNAME points to:
  wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com  ← COMPLETE!
       ↓
Cloudflare fetches from:
  https://wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com/photos/file.jpg
       ↓
  ✅ 200 OK (image data returned)
```

## Fix Instructions

### 1. Open Cloudflare Dashboard
- Go to: https://dash.cloudflare.com
- Select your domain: **jamara.us**
- Click **DNS** in the left sidebar

### 2. Find the CNAME Record
Look for a record that looks like this:

| Type  | Name | Target                                    | Proxy Status |
|-------|------|-------------------------------------------|--------------|
| CNAME | cdn  | jamara.s3.us-east-005.backblazeb2.com     | Proxied ☁️   |

### 3. Edit the CNAME Record
Click **Edit** on the `cdn` record and change:

**FROM:**
```
jamara.s3.us-east-005.backblazeb2.com
```

**TO:**
```
wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

**Important:**
- ✅ Keep proxy status **ON** (orange cloud ☁️)
- ✅ Make sure there are no typos
- ✅ The bucket name is: `wedding-photos-2026-jamara`
- ✅ The region is: `us-east-005`

### 4. Save the Changes
Click **Save** to apply the CNAME update.

### 5. Purge Cloudflare Cache
The old 404 errors are cached, so you need to clear them:

1. Go to **Caching** > **Configuration**
2. Click **Purge Everything**
3. Confirm the purge

### 6. Wait 2-3 Minutes
DNS changes propagate quickly, but give it a few minutes to be safe.

### 7. Test the Fix
Run this command in your terminal:

```bash
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Response:
  Status: 200 OK
  Server: cloudflare
  CF-Ray: [some-id]
  CF-Cache-Status: MISS (first request) or HIT (cached)
  x-amz-request-id: [some-id]  ← This confirms B2 connection!
  Content-Type: image/jpeg
  Content-Length: [size] bytes

🎉 SUCCESS! CDN is working!
```

### 8. Restart Dev Server
```bash
npm run dev
```

### 9. Upload Test Photo
1. Go to admin photo gallery
2. Upload a new photo
3. Verify it displays correctly with the blue "B2" badge

## What Changed in the Code

The code in `services/b2Service.ts` was already updated to generate the correct URL format:

```typescript
// Generates: https://cdn.jamara.us/photos/file.jpg
const url = `https://${cdnDomain}/${key}`;
```

This works with virtual-host style CNAMEs where the bucket name is in the CNAME target, not the URL path.

## Why This Matters

Backblaze B2 uses **virtual-host style** URLs for S3-compatible access:
```
https://bucket-name.s3.region.backblazeb2.com/path/to/file
```

When you set up a CNAME, you're essentially creating an alias:
```
cdn.jamara.us → wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

So when someone requests:
```
https://cdn.jamara.us/photos/file.jpg
```

Cloudflare knows to fetch from:
```
https://wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com/photos/file.jpg
```

Without the bucket name in the CNAME target, Cloudflare doesn't know which bucket to fetch from!

## Troubleshooting

### Still getting 404 after the fix?

1. **Double-check the CNAME target** - Make sure it's exactly:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```

2. **Purge cache again** - The old 404 might still be cached

3. **Check with curl:**
   ```bash
   curl -I https://cdn.jamara.us/photos/1770087981693-IMG_0627.jpeg
   ```
   Look for the `x-amz-request-id` header. If it's present, the CDN is reaching B2.

4. **Verify SSL/TLS settings:**
   - Go to SSL/TLS > Overview
   - Should be "Full" or "Full (strict)"

5. **Try a different photo** - The test photo might not exist anymore

### Need images working immediately?

If you can't wait for DNS propagation or troubleshooting:

1. Go to Cloudflare DNS settings
2. Find the `cdn` CNAME record
3. Change proxy status to **DNS only** (gray cloud)
4. This bypasses Cloudflare and goes directly to B2
5. You lose caching benefits, but images will work immediately
6. You can re-enable the proxy (orange cloud) later once everything is working

## Success Checklist

Once the fix is applied, you should see:

- ✅ `node scripts/test-cdn-final.mjs` returns HTTP 200
- ✅ `x-amz-request-id` header is present in responses
- ✅ Photos upload successfully (blue "B2" badge appears)
- ✅ Photos display correctly in the application
- ✅ Fast loading times (Cloudflare edge caching)
- ✅ Reduced B2 bandwidth costs

## Questions?

If you're still having issues after following these steps, check:
1. Is the CNAME target exactly correct? (no typos)
2. Did you purge the Cloudflare cache?
3. Did you wait 2-3 minutes after making changes?
4. Is the proxy status ON (orange cloud)?
5. Are the SSL/TLS settings correct?

The code is already correct - this is purely a Cloudflare DNS configuration issue.
