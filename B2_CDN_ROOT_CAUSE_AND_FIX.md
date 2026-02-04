# B2 CDN Issue - Root Cause & Fix Summary

**Date:** February 2, 2026  
**Status:** ✅ Solution identified - Use Origin Rules

## 🎯 Root Cause

**Cloudflare is sending the wrong Host header to B2.**

When you request `https://cdn.jamara.us/photos/file.jpg`:
1. Cloudflare receives the request
2. Cloudflare looks up CNAME → `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
3. **Cloudflare sends `Host: cdn.jamara.us` to B2** ❌
4. B2 doesn't recognize `cdn.jamara.us` as a bucket name
5. B2 returns 404

## ✅ The Fix: Origin Rules (NOT Transform Rules)

### Why Not Transform Rules?

Transform Rules **cannot** modify the `Host` header due to Cloudflare security restrictions. You'll get this error:
```
'set' is not a valid value for operation because it cannot be used on header 'Host'
```

### The Correct Solution: Origin Rules

**Origin Rules are specifically designed to modify the Host header when connecting to origin servers.**

### Step-by-Step:

1. **In Cloudflare Dashboard:**
   - Go to Rules → **Origin Rules** (NOT Transform Rules)
   - Click "Create rule"

2. **Rule Configuration:**
   - **Rule name:** `B2 Host Header Override`
   - **When incoming requests match:** Click "Edit expression" and paste:
     ```
     (http.host eq "cdn.jamara.us")
     ```
   - **Then:** 
     - **Host Header:** Select "Rewrite to"
     - **Value:** `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

3. **Deploy the rule**

4. **Ensure Cloudflare proxy is enabled** (orange cloud) on your `cdn` CNAME record

5. **Wait 30 seconds** for propagation

6. **Test:** `node scripts/test-cdn-final.mjs`

## 🚨 Critical: Origin Rules vs Transform Rules

### ❌ Transform Rules
- **Cannot** modify `Host` header (security restriction)
- Error: "'set' is not a valid value for operation because it cannot be used on header 'Host'"
- This is what caused your error

### ✅ Origin Rules
- **Can** modify Host header when connecting to origins
- Specifically designed for CDN and origin server integration
- No restrictions on Host header modification
- **This is the correct solution**

## 📊 Why This Works

### Before (404):
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: cdn.jamara.us ❌
                           B2: "No bucket with this name"
                           Returns: 404
```

### After (200 OK):
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Origin Rule applies
                           Host: wedding-photos-2026-jamara.s3... ✅
                           B2: "Found bucket!"
                           Returns: 200 + file
```

## 🧪 Testing

After creating the Origin Rule:

```bash
# Wait for propagation
sleep 30

# Test CDN
node scripts/test-cdn-final.mjs
```

**Expected result:**
```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg ✅

🎉 SUCCESS! CDN is working perfectly!
```

## ✅ Success Checklist

After implementing:
- ☐ Origin Rule created (NOT Transform Rule)
- ☐ Rule shows as "Active" in Cloudflare
- ☐ Cloudflare proxy enabled (orange cloud)
- ☐ Test script returns 200 OK
- ☐ `x-amz-request-id` header present
- ☐ Photos display in browser
- ☐ Blue "B2" badge appears on uploads
- ☐ No console errors

## 📖 Detailed Instructions

See `CLOUDFLARE_ORIGIN_RULES_FIX.md` for complete step-by-step instructions with visual guide and troubleshooting.

## 📝 What We Learned

1. **CNAME was correct** ✅ (DNS-only test proved this)
2. **SSL/TLS was correct** ✅ (Full mode)
3. **Cache wasn't the issue** ✅ (404 even with cache-busting)
4. **Missing Host header rewrite** ❌ (This was the problem)
5. **Transform Rules cannot modify Host header** ❌ (Security restriction)
6. **Origin Rules are the correct solution** ✅ (Designed for this purpose)

## ⏱️ Time to Fix

- Create Origin Rule: 2 minutes
- Wait for propagation: 30 seconds
- Test and verify: 1 minute
- **Total: ~4 minutes**

---

**Next Step:** Create the Origin Rule (NOT Transform Rule), then test!
