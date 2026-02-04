# B2 Cloudflare CDN - Current Diagnosis

**Date:** February 2, 2026  
**Status:** 🔴 CDN returning 404 - CNAME target verification needed

## 🔍 Current Situation

Photos upload successfully to B2 (blue "B2" badge appears), but images fail to load with 404 errors when accessed through Cloudflare CDN.

## ✅ What's Working

1. **B2 Storage**: Photos upload successfully
2. **Direct B2 URLs**: Work perfectly (HTTP 200)
3. **DNS Resolution**: `cdn.jamara.us` resolves to Cloudflare IPs
4. **Cloudflare Proxy**: Active (orange cloud)
5. **Code Configuration**: Correct (generates proper CDN URLs)

## ❌ What's Not Working

1. **CDN URLs**: Return 404 Not Found
2. **B2 Connection**: No `x-amz-request-id` header (not reaching B2)
3. **Cached Errors**: Cloudflare serving cached 404 responses

## 🧪 Test Results

```bash
$ node scripts/test-cdn-final.mjs

Response:
  Status: 404 Not Found
  Server: cloudflare
  CF-Ray: 9c7ee6743f7d3ecb-SJC
  CF-Cache-Status: HIT
  x-amz-request-id: MISSING ❌
  Content-Type: application/json;charset=UTF-8
```

```bash
$ nslookup cdn.jamara.us

Name:   cdn.jamara.us
Address: 104.21.66.68  ✅ Cloudflare IP
Address: 172.67.168.13 ✅ Cloudflare IP
```

## 🎯 Root Cause Analysis

The absence of `x-amz-request-id` header proves that **Cloudflare is not successfully connecting to B2**. This indicates one of:

1. **CNAME target is incorrect** (most likely)
2. **CNAME target is incomplete/truncated**
3. **SSL/TLS configuration issue**
4. **Transform Rule interfering** (already disabled)

## 🔧 Actions Taken

1. ✅ Updated code to use virtual-host style URLs
2. ✅ Disabled "B2 Auth" Transform Rule
3. ✅ Purged Cloudflare cache (multiple times)
4. ✅ Verified B2 environment variables
5. ✅ Confirmed direct B2 URLs work

## 📋 Required CNAME Configuration

The CNAME record in Cloudflare **MUST** be configured exactly as:

```
Type:   CNAME
Name:   cdn
Target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
Proxy:  ON (orange cloud ☁️)
TTL:    Auto
```

**Critical:** The target must be the **full hostname** including:
- Bucket name: `wedding-photos-2026-jamara`
- S3 prefix: `.s3`
- Region: `.us-east-005`
- Domain: `.backblazeb2.com`

## 🚨 User Report

User mentioned seeing the CNAME target appear **truncated** in the Cloudflare UI as:
```
jamara.s3.us-east-005.backblazeb2.com
```

This is **missing** the `wedding-photos-2026-` prefix, which would cause the exact symptoms we're seeing.

## ✅ Next Steps for User

### 1. Verify CNAME Target (CRITICAL)

1. Log into Cloudflare Dashboard
2. Go to DNS settings for `jamara.us`
3. Find the `cdn` CNAME record
4. **Click "Edit"** to see the full target
5. Verify it shows **exactly**:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```

### 2. Update if Incorrect

If the target is wrong or truncated:

1. Clear the Target field
2. Copy and paste: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
3. Ensure Proxy status is ON (orange cloud)
4. Save

### 3. Purge Cache Again

1. Go to Caching > Configuration
2. Click "Purge Everything"
3. Wait 30 seconds

### 4. Wait for Propagation

Wait 2-3 minutes for DNS changes to propagate through Cloudflare's network.

### 5. Test

```bash
node scripts/test-cdn-final.mjs
```

**Expected success indicators:**
- Status: 200 OK
- `x-amz-request-id` header present
- Content-Type: image/jpeg
- Content-Length: [file size]

## 🔄 Alternative: Temporary Bypass

If you need images working immediately:

1. Go to DNS settings
2. Toggle `cdn` record to "DNS only" (gray cloud)
3. This bypasses Cloudflare proxy but images will work
4. Re-enable proxy after fixing CNAME target

## 📊 Why This Matters

The CNAME target tells Cloudflare **where to connect** to fetch content. If it's wrong:

```
❌ Wrong Target: jamara.s3.us-east-005.backblazeb2.com
   → Cloudflare connects to wrong hostname
   → B2 doesn't recognize the bucket
   → Returns 404

✅ Correct Target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   → Cloudflare connects to correct hostname
   → B2 recognizes bucket from hostname
   → Returns file successfully
```

## 🎓 Technical Background

B2's S3-compatible API supports two URL styles:

1. **Path-style** (old): `https://s3.region.backblazeb2.com/bucket/key`
2. **Virtual-host style** (recommended): `https://bucket.s3.region.backblazeb2.com/key`

When using Cloudflare CDN with a CNAME, you **must** use virtual-host style because:
- B2's SSL certificate includes `*.s3.us-east-005.backblazeb2.com`
- This matches `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
- Cloudflare can establish secure connection
- B2 recognizes bucket from hostname

## 📁 Related Files

- `services/b2Service.ts` - Updated to generate correct CDN URLs
- `.env.local` - Contains B2 configuration
- `scripts/test-cdn-final.mjs` - Test script
- `scripts/verify-dns-resolution.mjs` - DNS verification script
- `CLOUDFLARE_CNAME_FIX_GUIDE.md` - Step-by-step fix guide

## 🎯 Success Criteria

Once fixed, you should see:

1. ✅ Test script returns 200 OK
2. ✅ `x-amz-request-id` header present
3. ✅ Images load in photo gallery
4. ✅ Blue "B2" badge on uploaded photos
5. ✅ Fast CDN delivery worldwide

## 📞 Support

If still not working after verifying CNAME:

1. Check SSL/TLS mode (should be "Full")
2. Check for conflicting Transform Rules
3. Check for conflicting Page Rules
4. Share screenshot of CNAME record (when editing)
5. Share output of test script

---

**Summary:** The code is correct. The issue is purely in the Cloudflare CNAME configuration. Verify the target is the complete hostname including the bucket name prefix.
