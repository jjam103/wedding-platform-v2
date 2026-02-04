# Cloudflare Origin Rules Fix - The Correct Solution

**Issue:** Transform Rules cannot modify the `Host` header (security restriction)  
**Solution:** Use Origin Rules instead  
**Time:** 3 minutes

## 🎯 Why Transform Rules Failed

Cloudflare blocks direct modification of the `Host` header in Transform Rules for security reasons. You'll get this error:

```
'set' is not a valid value for operation because it cannot be used on header 'Host'
```

**Solution:** Use **Origin Rules** which are specifically designed to override the Host header when connecting to origins.

## 🔧 The Correct Fix: Origin Rules

### Step 1: Re-enable Cloudflare Proxy (if needed)

1. Go to: https://dash.cloudflare.com
2. Select domain: `jamara.us`
3. Click **"DNS"** in left sidebar
4. Find the `cdn` CNAME record
5. Make sure it's 🟠 **Proxied** (orange cloud)
6. If not, click to edit and toggle to Proxied

### Step 2: Create Origin Rule

1. In Cloudflare Dashboard, click **"Rules"** in left sidebar
2. Click **"Origin Rules"**
3. Click **"Create rule"**
4. Fill in the form:

**Rule name:**
```
B2 Host Header Override
```

**When incoming requests match:**
- Click "Edit expression"
- Paste this:
```
(http.host eq "cdn.jamara.us")
```

**Then:**
- **Host Header:** Select "Rewrite to"
- **Value:** `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

5. Click **"Deploy"**

### Step 3: Wait & Test

```bash
# Wait 30 seconds for rule to propagate
sleep 30

# Test CDN
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg ✅

🎉 SUCCESS! CDN is working perfectly!
```

## 📸 Visual Guide

### Origin Rule Configuration

```
┌─────────────────────────────────────────────────────────┐
│ Rule name: B2 Host Header Override                      │
├─────────────────────────────────────────────────────────┤
│ When incoming requests match:                           │
│   (http.host eq "cdn.jamara.us")                        │
├─────────────────────────────────────────────────────────┤
│ Then:                                                   │
│   Host Header: Rewrite to                               │
│   Value: wedding-photos-2026-jamara.s3.us-east-005...  │
└─────────────────────────────────────────────────────────┘
```

## 🎓 Why This Works

### Origin Rules vs Transform Rules

**Transform Rules:**
- ❌ Cannot modify `Host` header (security restriction)
- ✅ Can modify other headers (User-Agent, Referer, etc.)
- Used for general header manipulation

**Origin Rules:**
- ✅ CAN modify `Host` header when connecting to origin
- ✅ Specifically designed for origin server configuration
- Used for CDN and origin server integration

### The Flow:

```
Browser → cdn.jamara.us → Cloudflare → B2
                           ↓
                    Origin Rule applies
                    Host: wedding-photos-2026-jamara.s3... ✅
                           ↓
                    B2: "Found bucket!"
                    Returns: 200 + file
```

## ✅ Verification Checklist

After creating the Origin Rule:

- ☐ Wait 30 seconds
- ☐ Run test script: `node scripts/test-cdn-final.mjs`
- ☐ Should see: `Status: 200 OK`
- ☐ Should see: `x-amz-request-id` header present
- ☐ Restart dev server: `npm run dev`
- ☐ Upload a test photo in admin panel
- ☐ Verify photo displays with blue "B2" badge
- ☐ Check browser console (no errors)
- ☐ Verify images load quickly

## 🚨 Common Mistakes

### ❌ Wrong: Using Transform Rules
```
Rules → Transform Rules → Modify Request Header
Error: Cannot modify Host header
```

### ✅ Correct: Using Origin Rules
```
Rules → Origin Rules → Host Header: Rewrite to
Success: Host header modified when connecting to origin
```

### ❌ Wrong: DNS-only mode
Origin Rules only work when proxy is enabled (orange cloud).

### ✅ Correct: Proxied mode
Make sure CNAME is proxied (orange cloud).

## 📊 Expected Timeline

- Create Origin Rule: 2 minutes
- Rule propagation: 30 seconds
- Test: 30 seconds
- Verify in browser: 1 minute
- **Total: 4 minutes**

## 🆘 If It Still Doesn't Work

1. **Check rule is enabled:**
   - Go to Rules → Origin Rules
   - Verify "B2 Host Header Override" shows as "Active"

2. **Check rule expression:**
   - Should be: `(http.host eq "cdn.jamara.us")`
   - NOT: `(hostname eq "cdn.jamara.us")`

3. **Check proxy is enabled:**
   - DNS → `cdn` CNAME → Should be orange cloud (Proxied)
   - If gray cloud (DNS only), rule won't apply

4. **Check Cloudflare plan:**
   - Origin Rules are available on all plans (Free, Pro, Business, Enterprise)
   - If you don't see "Origin Rules", check your plan

5. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or open in incognito/private window

## 🎉 Success Indicators

When it's working:
- ✅ Test script shows 200 OK
- ✅ `x-amz-request-id` header present
- ✅ Photos display in browser
- ✅ Blue "B2" badge on uploaded photos
- ✅ No console errors
- ✅ Fast image loading

## 📝 What We Learned

1. **Transform Rules cannot modify Host header** ❌
2. **Origin Rules are designed for Host header modification** ✅
3. **Origin Rules work at the origin connection level** ✅
4. **This is the correct solution for CDN integration** ✅

---

**Ready?** Create the Origin Rule now and test!
