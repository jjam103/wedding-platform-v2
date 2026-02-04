# Cloudflare CDN Fix - Quick Checklist ✅

## 🎯 Goal
Get `cdn.jamara.us` to successfully proxy requests to B2 storage.

## 📋 Step-by-Step Checklist

### ☐ Step 1: Verify CNAME Target (5 minutes)

1. ☐ Open Cloudflare Dashboard: https://dash.cloudflare.com
2. ☐ Select domain: `jamara.us`
3. ☐ Click **DNS** in left sidebar
4. ☐ Find the `cdn` record in the list
5. ☐ Click **Edit** button
6. ☐ Check the **Target** field shows **EXACTLY**:
   ```
   wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
   ```
7. ☐ If wrong, copy-paste the correct target above
8. ☐ Verify **Proxy status** is ON (orange cloud ☁️)
9. ☐ Click **Save**

### ☐ Step 2: Purge Cloudflare Cache (1 minute)

1. ☐ Click **Caching** in left sidebar
2. ☐ Click **Configuration** tab
3. ☐ Click **Purge Everything** button
4. ☐ Confirm the purge
5. ☐ Wait 30 seconds

### ☐ Step 3: Wait for Propagation (2-3 minutes)

1. ☐ Wait 2-3 minutes for DNS changes to propagate
2. ☐ Get a coffee ☕

### ☐ Step 4: Test the Fix (1 minute)

Run the test script:
```bash
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Status: 200 OK
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg
✅ SUCCESS! CDN is working!
```

### ☐ Step 5: Verify in Browser (1 minute)

1. ☐ Restart dev server: `npm run dev`
2. ☐ Go to photo gallery page
3. ☐ Upload a test photo
4. ☐ Verify image displays correctly
5. ☐ Check browser console for errors (should be none)

## 🚨 If Still Not Working

### Check SSL/TLS Settings

1. ☐ Go to **SSL/TLS** in Cloudflare
2. ☐ Click **Overview**
3. ☐ Set encryption mode to **Full** (not Flexible)
4. ☐ Save and test again

### Check Transform Rules

1. ☐ Go to **Rules** > **Transform Rules**
2. ☐ Verify "B2 Auth" rule is **disabled**
3. ☐ Check no other rules affect `cdn.jamara.us`

### Temporary Bypass (if urgent)

1. ☐ Go to **DNS** settings
2. ☐ Click on `cdn` record
3. ☐ Toggle to **DNS only** (gray cloud ☁️)
4. ☐ Save
5. ☐ Images will work immediately (no caching)
6. ☐ Re-enable proxy after fixing CNAME

## ✅ Success Indicators

You'll know it's working when:

- ✅ Test script shows `200 OK`
- ✅ `x-amz-request-id` header is present
- ✅ Images load in photo gallery
- ✅ No console errors
- ✅ Blue "B2" badge on photos

## 📸 What You Should See

### In Cloudflare DNS (when editing):
```
┌─────────────────────────────────────────────────────────┐
│ Type: CNAME                                             │
│ Name: cdn                                               │
│ Target: wedding-photos-2026-jamara.s3.us-east-005...   │
│ Proxy status: ☁️ Proxied                               │
│ TTL: Auto                                               │
└─────────────────────────────────────────────────────────┘
```

### In Test Script:
```
🧪 Final CDN Test

Testing URL: https://cdn.jamara.us/photos/...

Response:
  Status: 200 OK ✅
  x-amz-request-id: abc123... ✅
  Content-Type: image/jpeg ✅
  
🎉 SUCCESS! CDN is working!
```

## 🆘 Need Help?

If you're stuck, share:
1. Screenshot of CNAME record (when editing)
2. Output of: `node scripts/test-cdn-final.mjs`
3. SSL/TLS encryption mode setting

## 📚 Reference Documents

- `CLOUDFLARE_CNAME_FIX_GUIDE.md` - Detailed guide
- `B2_CLOUDFLARE_CDN_DIAGNOSIS.md` - Technical diagnosis
- `B2_CLOUDFLARE_SOLUTION.md` - Original solution document

---

**Time estimate:** 10 minutes total  
**Difficulty:** Easy (just copy-paste and click buttons)  
**Impact:** High (fixes all photo loading issues)
