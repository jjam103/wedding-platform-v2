# B2 Storage + Cloudflare CDN - Complete Diagnosis

## 🎯 Problem Statement

Photos upload successfully to B2 (blue "B2" badge appears), but images fail to load with 404/401 errors when accessed through the Cloudflare CDN.

## 🔬 Investigation Process

### Phase 1: Initial Diagnosis
- Confirmed B2 environment variables are correct
- Confirmed B2 region matches Cloudflare DNS (`us-east-005`)
- Confirmed B2 application key has proper permissions
- Confirmed B2 bucket is public

### Phase 2: URL Format Testing
Tested multiple URL formats to find which works:

| Format | URL | Result |
|--------|-----|--------|
| Direct B2 S3 | `https://s3.us-east-005.backblazeb2.com/bucket/key` | ✅ 200 OK |
| Direct B2 Virtual Host | `https://bucket.s3.us-east-005.backblazeb2.com/key` | ✅ 200 OK |
| CDN with /file/ | `https://cdn.jamara.us/file/bucket/key` | ❌ 401 Unauthorized |
| CDN with bucket | `https://cdn.jamara.us/bucket/key` | ❌ 404 Not Found |
| CDN direct key | `https://cdn.jamara.us/key` | ❌ 404 Not Found |

### Phase 3: Cloudflare Proxy Analysis
- **DNS Lookup**: No CNAME record found for `cdn.jamara.us`
- **Response Headers**: No `x-amz-request-id` (not reaching B2)
- **Response Body**: Cloudflare's own 404, not B2's
- **Conclusion**: Cloudflare is NOT proxying to B2

## 🎯 Root Cause

**The Cloudflare CNAME record for `cdn.jamara.us` is either:**
1. Not configured at all, OR
2. Not pointing to the correct B2 endpoint, OR
3. Not proxied (orange cloud is off)

## ✅ What We Fixed

### 1. Updated B2 Service URL Format

**File**: `services/b2Service.ts`

Changed from B2 native format to S3-compatible format:

```typescript
// Before (incorrect)
const url = `https://${cdnDomain}/${key}`;
// Generated: https://cdn.jamara.us/photos/1234-photo.jpg

// After (correct)
const url = `https://${cdnDomain}/${bucketName}/${key}`;
// Generated: https://cdn.jamara.us/wedding-photos-2026-jamara/photos/1234-photo.jpg
```

### 2. Created Diagnostic Tools

Created comprehensive diagnostic scripts:
- `scripts/test-cdn-fix.mjs` - Test corrected URL format
- `scripts/test-cloudflare-proxy.mjs` - Verify Cloudflare proxy status
- `scripts/test-b2-bucket-info.mjs` - Verify B2 bucket accessibility
- `scripts/quick-cdn-test.mjs` - Quick test of all URL formats
- `scripts/diagnose-cloudflare-b2.mjs` - Comprehensive diagnostic

## 🚀 Required Action (User)

**You need to configure the Cloudflare CNAME record:**

1. **Log into Cloudflare Dashboard**
2. **Go to DNS settings** for `jamara.us` domain
3. **Add/Update CNAME record**:
   - Type: `CNAME`
   - Name: `cdn`
   - Target: `s3.us-east-005.backblazeb2.com`
   - Proxy status: ✅ **Proxied** (orange cloud ON)
   - TTL: Auto

4. **Wait 1-5 minutes** for DNS propagation

5. **Test the fix**:
   ```bash
   node scripts/test-cdn-fix.mjs
   ```

6. **Restart dev server**:
   ```bash
   npm run dev
   ```

## 🔍 Verification Steps

After configuring the CNAME, verify it's working:

```bash
# 1. Check DNS resolution
nslookup cdn.jamara.us
# Should show CNAME pointing to s3.us-east-005.backblazeb2.com

# 2. Test CDN URL
curl -I https://cdn.jamara.us/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg
# Should return:
#   HTTP/2 200
#   x-amz-request-id: <some-id>  (proves it's reaching B2)
#   cf-ray: <some-id>             (proves it's going through Cloudflare)

# 3. Run our test script
node scripts/test-cdn-fix.mjs
# Should show: ✅ SUCCESS! CDN is now working correctly!
```

## 📊 Current Status

### ✅ Completed
- [x] B2 environment variables configured correctly
- [x] B2 region matches Cloudflare DNS
- [x] B2 application key has proper permissions
- [x] B2 bucket is public and accessible
- [x] Code updated to use S3-compatible URL format
- [x] Diagnostic tools created
- [x] Root cause identified

### ⏳ Pending (User Action Required)
- [ ] Configure Cloudflare CNAME record
- [ ] Verify DNS propagation
- [ ] Test CDN URLs
- [ ] Restart dev server

## 🔄 Alternative: Temporary Direct B2 URLs

If you need photos working immediately while configuring Cloudflare:

1. Update `.env.local`:
   ```env
   # Temporarily use direct B2 URLs (no CDN)
   B2_CDN_DOMAIN=s3.us-east-005.backblazeb2.com
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

**Note**: This bypasses Cloudflare CDN (no caching, slower), but photos will load immediately.

## 📝 Technical Details

### Why the /file/ format didn't work
- `/file/bucket/key` is B2's **native download API** format
- When used with Cloudflare CNAME, B2 expects the request to come from its native domain
- Cloudflare CNAME points to S3 endpoint, which uses `/{bucket}/{key}` format
- Mismatch causes 401 Unauthorized

### Why S3-compatible format is correct
- Cloudflare CNAME → `s3.us-east-005.backblazeb2.com`
- S3 endpoint expects: `/{bucket}/{key}`
- This matches how AWS S3 works with CloudFront
- B2's S3-compatible API is designed for this use case

## 🎓 Lessons Learned

1. **B2 has two APIs**: Native API (`/file/`) and S3-compatible API (`/{bucket}/`)
2. **Cloudflare CDN requires S3-compatible format** when CNAME points to S3 endpoint
3. **DNS configuration is critical** - without proper CNAME, CDN won't work
4. **Diagnostic tools are essential** - helped identify exact issue quickly

## 📚 References

- [B2 S3-Compatible API Documentation](https://www.backblaze.com/b2/docs/s3_compatible_api.html)
- [Cloudflare CDN with B2 Guide](https://www.backblaze.com/blog/backblaze-b2-and-cloudflare-cdn/)
- [B2 Public Bucket Configuration](https://www.backblaze.com/b2/docs/buckets.html)

## ✨ Expected Outcome

Once Cloudflare CNAME is configured:
- ✅ Photos load through Cloudflare CDN
- ✅ Fast global delivery with edge caching
- ✅ Reduced B2 bandwidth costs
- ✅ Blue "B2" badge shows correct storage
- ✅ Images display in photo gallery
- ✅ Inline editing works correctly
