# Cloudflare DNS Only Bypass Test

**Date:** February 2, 2026  
**Purpose:** Isolate whether the issue is Cloudflare proxy or CNAME target

## 🎯 What This Test Does

This test temporarily disables Cloudflare's proxy to determine:
- ✅ If CNAME works → Issue is Cloudflare proxy configuration
- ❌ If CNAME fails → Issue is CNAME target (despite confirmation)

## 📋 Step-by-Step Instructions

### Step 1: Switch to DNS Only Mode

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select domain**: `jamara.us`
3. **Click "DNS"** in left sidebar
4. **Find the `cdn` CNAME record**
5. **Click on the record** to edit it
6. **Toggle Proxy status**:
   - Current: 🟠 **Proxied** (orange cloud)
   - Change to: ☁️ **DNS only** (gray cloud)
7. **Click "Save"**

### Step 2: Wait for DNS Propagation

```bash
# Wait 60 seconds for DNS to propagate
sleep 60
```

### Step 3: Run Test

```bash
node scripts/test-cdn-final.mjs
```

## 📊 Interpreting Results

### ✅ Result A: Test SUCCEEDS (Status 200)

**Output looks like:**
```
Status: 200 OK ✅
Content-Type: image/jpeg ✅
Content-Length: [some number] ✅
```

**What this means:**
- ✅ CNAME target is correct
- ❌ Cloudflare proxy has a configuration issue
- 🔧 Issue is on Cloudflare's side, not your CNAME

**Next steps:**
1. Re-enable proxy (orange cloud)
2. Contact Cloudflare support with these details:
   - Domain: `jamara.us`
   - CNAME: `cdn.jamara.us` → `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
   - Issue: Proxy returns 404, DNS-only works
   - SSL/TLS: Full mode
   - All rules disabled
   - Test results showing DNS-only works

**Temporary workaround:**
- Leave in "DNS only" mode temporarily
- Images will work but without CDN caching
- Higher bandwidth costs but functional

---

### ❌ Result B: Test FAILS (Status 404 or timeout)

**Output looks like:**
```
Status: 404 Not Found ❌
OR
Error: ENOTFOUND ❌
OR
Error: Timeout ❌
```

**What this means:**
- ❌ CNAME target is actually incorrect
- The target field has a typo or wrong value
- Need to verify character-by-character

**Next steps:**
1. Re-enable proxy (orange cloud) - no point leaving it off
2. Screenshot the EXACT CNAME target when editing
3. Compare character-by-character with:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```
4. Check for:
   - Extra spaces before/after
   - Trailing dot (`.`)
   - Typo in bucket name
   - Wrong region code
   - Missing hyphens

---

## 🔄 After Testing: Re-enable Proxy

**Important:** Don't forget to switch back to proxied mode!

1. Go back to **DNS** settings
2. Click on `cdn` CNAME record
3. Toggle back to: 🟠 **Proxied** (orange cloud)
4. Save

## 🆘 If Result A (DNS-only works)

This means Cloudflare has an internal proxy issue. Possible causes:

### 1. Cloudflare Cache Settings
Even though you purged, check:
- **Caching** → **Configuration**
- Look for custom cache rules for `cdn.jamara.us`
- Ensure "Browser Cache TTL" is not set to "Respect Existing Headers"

### 2. Cloudflare Network Issue
Sometimes Cloudflare's edge network has routing issues:
- Try from a different network/location
- Use a VPN to test from different regions
- Check Cloudflare status: https://www.cloudflarestatus.com/

### 3. Origin Certificate Issue
Even with "Full" mode, check:
- **SSL/TLS** → **Origin Server**
- Ensure no custom origin certificates are configured
- B2 should use its own certificate

### 4. Cloudflare Support Ticket
If DNS-only works but proxy doesn't, this is a Cloudflare issue:
- Open support ticket: https://dash.cloudflare.com/?to=/:account/support
- Include:
  - Domain and CNAME details
  - Test results (DNS-only works, proxy fails)
  - CF-Ray IDs from failed requests
  - Screenshots of SSL/TLS and DNS settings

## 🆘 If Result B (DNS-only fails)

The CNAME target is wrong. To fix:

### 1. Get Correct Target from B2

1. Go to B2 Dashboard: https://secure.backblaze.com/b2_buckets.htm
2. Click on bucket: `wedding-photos-2026-jamara`
3. Look for "Endpoint" or "S3 Endpoint"
4. Should show: `s3.us-east-005.backblazeb2.com`
5. Full target is: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

### 2. Update CNAME

1. Go to Cloudflare DNS
2. Edit `cdn` CNAME record
3. Set target to EXACTLY:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```
4. No trailing dot
5. No extra spaces
6. Save
7. Wait 2 minutes
8. Test again

## 📝 Test Script Reference

The test script (`scripts/test-cdn-final.mjs`) does:
1. Fetches a known photo URL through CDN
2. Checks HTTP status code
3. Checks response headers
4. Reports success/failure

## ⏱️ Time Estimate

- Switch to DNS only: 1 minute
- Wait for propagation: 1 minute
- Run test: 30 seconds
- Switch back to proxied: 1 minute
- **Total: 3-4 minutes**

## 🎯 Expected Outcome

**Most likely:** Result A (DNS-only works)
- This would confirm CNAME is correct
- Issue is Cloudflare proxy configuration
- Requires Cloudflare support or deeper investigation

**Less likely:** Result B (DNS-only fails)
- Would reveal CNAME target is wrong
- Easy fix: update CNAME target
- Test again after update

---

**Ready to proceed?** Follow Step 1 above to switch to DNS only mode.
