# Cloudflare CNAME Fix Guide

## 🔍 Current Status

Your CDN (`cdn.jamara.us`) is returning 404 errors because the CNAME target is likely incorrect or incomplete.

**Evidence:**
- ✅ DNS resolves to Cloudflare IPs (proxied correctly)
- ❌ No `x-amz-request-id` header (not reaching B2)
- ❌ Returns 404 (Cloudflare can't find the backend)

## 🎯 The Fix

You need to verify and update the CNAME record in Cloudflare Dashboard.

### Step 1: Check Current CNAME Target

1. **Log into Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Select your domain**: `jamara.us`
3. **Go to DNS** (left sidebar)
4. **Find the `cdn` record**
5. **Click "Edit"** on the record
6. **Check the "Target" field**

### Step 2: Verify the Target

The target field should show **EXACTLY**:
```
wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

**Common Issues:**
- ❌ Truncated: `jamara.s3.us-east-005.backblazeb2.com` (missing `wedding-photos-2026-`)
- ❌ Wrong format: `s3.us-east-005.backblazeb2.com` (missing bucket name)
- ❌ Extra characters or spaces

### Step 3: Update if Incorrect

If the target is wrong:

1. **Clear the Target field**
2. **Copy and paste this EXACTLY**:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```
3. **Verify these settings**:
   - **Type**: CNAME
   - **Name**: cdn
   - **Target**: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   - **Proxy status**: Proxied (orange cloud ☁️)
   - **TTL**: Auto
4. **Click "Save"**

### Step 4: Purge Cache

After updating the CNAME:

1. **Go to Caching** (left sidebar)
2. **Click "Configuration"**
3. **Click "Purge Everything"**
4. **Confirm the purge**
5. **Wait 30 seconds**

### Step 5: Wait for Propagation

- **Wait 2-3 minutes** for DNS changes to propagate
- Cloudflare's network needs time to update

### Step 6: Test

Run the test script:
```bash
node scripts/test-cdn-final.mjs
```

**Expected result:**
```
Status: 200 OK
x-amz-request-id: [some ID]
✅ SUCCESS! CDN is working!
```

## 🔧 Alternative: Temporary Fix

If you need images working **immediately** while troubleshooting:

1. **Go to DNS settings** in Cloudflare
2. **Click on the `cdn` record**
3. **Toggle Proxy status to "DNS only"** (gray cloud ☁️)
4. **Save**

This bypasses Cloudflare's proxy and goes directly to B2. You lose caching benefits but images will work.

**To re-enable proxy later:**
1. Fix the CNAME target (see above)
2. Toggle back to "Proxied" (orange cloud ☁️)
3. Purge cache

## 📸 What to Look For in Cloudflare UI

When you click "Edit" on the CNAME record, you should see:

```
┌─────────────────────────────────────────────────────────┐
│ Type: CNAME                                             │
│ Name: cdn                                               │
│ Target: wedding-photos-2026-jamara.s3.us-east-005...   │
│         [full target should be visible when editing]    │
│ Proxy status: ☁️ Proxied                               │
│ TTL: Auto                                               │
└─────────────────────────────────────────────────────────┘
```

**Important:** The UI might truncate the display, but when you click "Edit", you should see the **full target** in the input field.

## ✅ Success Indicators

After fixing, you should see:

1. **Test script shows 200 OK**
2. **`x-amz-request-id` header is present** (proves request reached B2)
3. **Images load in the photo gallery**
4. **Blue "B2" badge appears on uploaded photos**

## 🆘 Still Not Working?

If you've verified the CNAME is correct and purged the cache, but it's still not working:

### Check SSL/TLS Settings

1. **Go to SSL/TLS** in Cloudflare
2. **Click "Overview"**
3. **Set encryption mode to "Full"** (not "Flexible")
4. **Save**

### Check Transform Rules

1. **Go to Rules** > **Transform Rules**
2. **Check if any rules modify the Host header**
3. **Disable any rules that affect `cdn.jamara.us`**

### Check Page Rules

1. **Go to Rules** > **Page Rules**
2. **Check if any rules affect `cdn.jamara.us/*`**
3. **Disable any conflicting rules**

## 📞 Need Help?

If you're still stuck, share:
1. Screenshot of the CNAME record (when editing, showing full target)
2. Output of: `node scripts/test-cdn-final.mjs`
3. SSL/TLS encryption mode setting

## 🎉 Expected Final Result

Once working:
- Photos upload to B2 ✅
- CDN URLs are generated ✅
- Images load through Cloudflare ✅
- Fast global delivery ✅
- Reduced bandwidth costs ✅
