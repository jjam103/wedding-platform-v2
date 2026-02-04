# B2 Cloudflare CDN Issue - Root Cause Identified

**Date:** February 2, 2026  
**Status:** 🔴 Root cause identified - Cloudflare proxy configuration issue

## 🎯 DNS-Only Test Results

**Test Command:** `node scripts/test-cdn-final.mjs` (with DNS-only mode)

**Result:** SSL Certificate Mismatch Error
```
Hostname/IP does not match certificate's altnames: 
Host: cdn.jamara.us is not in the cert's altnames
```

## 🔬 What This Tells Us

### ✅ Good News
1. **DNS resolution works** - `cdn.jamara.us` correctly resolves to B2's IP
2. **CNAME target is correct** - DNS is pointing to the right place
3. **Network connectivity works** - Connection reaches B2 servers

### ❌ The Problem
**B2's SSL certificate doesn't include `cdn.jamara.us`**

B2's certificate includes:
- `*.s3.us-east-005.backblazeb2.com` ✅
- `s3.us-east-005.backblazeb2.com` ✅
- `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` ✅ (via wildcard)

But NOT:
- `cdn.jamara.us` ❌

## 🧩 Why This Matters

### DNS-Only Mode (Current Test)
```
Browser → cdn.jamara.us → B2 Server
                           ↓
                    SSL cert check fails ❌
                    (cert doesn't include cdn.jamara.us)
```

### Proxied Mode (What Should Work)
```
Browser → cdn.jamara.us → Cloudflare Edge → B2 Server
          ↓                                   ↓
    Cloudflare cert ✅              B2 cert ✅
    (includes cdn.jamara.us)        (includes *.s3.us-east-005...)
```

**Cloudflare's proxy should:**
1. Accept connections to `cdn.jamara.us` (using Cloudflare's certificate)
2. Connect to B2 using `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` (matching B2's certificate)

## 🔍 Why Cloudflare Proxy Is Failing

Since DNS-only mode shows the CNAME is correct, but proxied mode returns 404, the issue is:

**Cloudflare is not correctly rewriting the Host header when connecting to B2.**

### What's Happening:
1. Browser requests: `https://cdn.jamara.us/photos/file.jpg`
2. Cloudflare receives request
3. Cloudflare looks up CNAME: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
4. **Cloudflare connects to B2 but sends Host header: `cdn.jamara.us`** ❌
5. B2 doesn't recognize `cdn.jamara.us` as a valid bucket
6. B2 returns 404

### What Should Happen:
1. Browser requests: `https://cdn.jamara.us/photos/file.jpg`
2. Cloudflare receives request
3. Cloudflare looks up CNAME: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
4. **Cloudflare connects to B2 and sends Host header: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`** ✅
5. B2 recognizes the bucket
6. B2 returns file (200 OK)

## 🔧 Solution: Host Header Rewrite

You need to tell Cloudflare to rewrite the Host header when proxying to B2.

### Option 1: Transform Rule (Recommended)

1. **Go to Cloudflare Dashboard** → Rules → Transform Rules
2. **Click "Create rule"** under "HTTP Request Header Modification"
3. **Rule name:** `B2 Host Header Rewrite`
4. **When incoming requests match:**
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `cdn.jamara.us`
5. **Then:**
   - Action: `Set static`
   - Header name: `Host`
   - Value: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
6. **Click "Deploy"**

### Option 2: Origin Rules (Alternative)

1. **Go to Cloudflare Dashboard** → Rules → Origin Rules
2. **Click "Create rule"**
3. **Rule name:** `B2 Origin Override`
4. **When incoming requests match:**
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `cdn.jamara.us`
5. **Then:**
   - Override origin: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
   - Host header: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
6. **Click "Deploy"**

## ⚠️ Important: Re-enable Proxy First

Before creating the rule:

1. **Go to DNS settings**
2. **Edit `cdn` CNAME record**
3. **Toggle back to 🟠 Proxied** (orange cloud)
4. **Save**
5. **Then create the Transform/Origin Rule**

## 🧪 Testing After Fix

After creating the rule:

```bash
# Wait 30 seconds for rule to propagate
sleep 30

# Test CDN
node scripts/test-cdn-final.mjs
```

**Expected result:**
```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg ✅
```

## 📊 Why Previous Fixes Didn't Work

### SSL/TLS Mode = "Full" ✅
- This was correct
- Ensures Cloudflare → B2 uses HTTPS
- But doesn't fix Host header issue

### All Rules Disabled ❌
- This was the problem!
- You NEED a Transform/Origin Rule
- Without it, Cloudflare sends wrong Host header

### Cache Purged ✅
- This was correct
- But cache wasn't the issue

### CNAME Target Correct ✅
- This was correct
- DNS-only test proved it

## 🎓 Technical Explanation

### Virtual-Host Style S3 URLs

B2 uses "virtual-host style" S3 URLs:
```
https://bucket-name.s3.region.backblazeb2.com/key
```

The bucket name is in the hostname, not the path.

### Host Header Requirement

When B2 receives a request, it looks at the `Host` header to determine which bucket:
- `Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` → ✅ Bucket found
- `Host: cdn.jamara.us` → ❌ No bucket with this name

### Cloudflare's Default Behavior

By default, Cloudflare preserves the original Host header:
- Browser sends: `Host: cdn.jamara.us`
- Cloudflare forwards: `Host: cdn.jamara.us`
- B2 receives: `Host: cdn.jamara.us` → 404 (bucket not found)

### With Transform Rule

Transform Rule rewrites the Host header:
- Browser sends: `Host: cdn.jamara.us`
- Cloudflare rewrites: `Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
- B2 receives: `Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` → 200 (bucket found)

## 📝 Summary

1. **CNAME is correct** ✅ (DNS-only test proved this)
2. **SSL/TLS is correct** ✅ (Full mode)
3. **Missing: Host header rewrite** ❌ (This is the issue)

**Fix:** Create Transform Rule or Origin Rule to rewrite Host header

## ✅ Next Steps

1. ☐ Re-enable Cloudflare proxy (orange cloud)
2. ☐ Create Transform Rule for Host header rewrite
3. ☐ Wait 30 seconds
4. ☐ Test: `node scripts/test-cdn-final.mjs`
5. ☐ Verify images load in browser
6. ☐ Check for blue "B2" badge on photos

---

**Time to fix:** 5 minutes  
**Confidence:** 95% (this is the exact issue)

