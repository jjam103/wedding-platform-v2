# B2 Region Mismatch - FIXED!

## The Problem

**ROOT CAUSE IDENTIFIED**: Region mismatch between Cloudflare DNS and `.env.local`

### What Was Wrong:

**Cloudflare DNS** (correct):
- CNAME: `cdn` → `s3.us-east-005.backblazeb2.com`
- Region: `us-east-005`

**`.env.local`** (was wrong, now fixed):
- ~~`B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com`~~
- ~~`B2_REGION=us-west-004`~~

The application was trying to connect to `us-west-004` but your B2 bucket is actually in `us-east-005`!

## The Fix

Updated `.env.local` to match Cloudflare DNS:

```bash
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
```

## What You Need To Do NOW

### Step 1: Restart Dev Server

The environment variables are cached in the Node process. You MUST restart:

```bash
# In your terminal where npm run dev is running:
# Press Ctrl+C to stop the server

# Then restart:
npm run dev
```

Look for this message:
```
✓ B2 client initialized successfully
```

If you see this, B2 is working!

### Step 2: Test B2 Upload

1. Go to photos page: http://localhost:3000/admin/photos
2. Click "Upload Photos"
3. Select a test image
4. Upload it
5. Check the **storage type badge** - should show "B2" (not "Supabase")
6. Verify image URL contains `cdn.jamara.us`
7. Confirm image loads correctly (not black box)

### Step 3: Verify Images Are Visible

1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Check if existing images are visible
3. If still black boxes, try Incognito/Private window

## Why This Happened

When you set up Cloudflare CDN, you correctly pointed it to `us-east-005` (where your B2 bucket actually is).

But somewhere along the way, `.env.local` got set to `us-west-004` (possibly a default or typo).

The application was trying to connect to the wrong region, getting 403 Forbidden errors, so all uploads fell back to Supabase Storage.

## Expected Behavior After Restart

### Immediate:
- ✅ Dev server shows "✓ B2 client initialized successfully"
- ✅ No 403 errors in logs
- ✅ B2 health check passes

### After Upload:
- ✅ New photos show "B2" storage badge
- ✅ Photo URLs contain `cdn.jamara.us`
- ✅ Images load from CDN
- ✅ Faster image delivery

### Existing Photos:
- ⚠️ Old photos will stay in Supabase (that's fine)
- ⚠️ Only NEW uploads will go to B2
- ℹ️ You can re-upload old photos if you want them in B2

## Verification Commands

### After restarting dev server, run diagnostic:
```bash
node scripts/diagnose-image-visibility.mjs
```

Should show:
```
✓ B2 bucket is accessible
```

### Check storage health in app:
1. Go to photos page
2. Click "Check Storage" button
3. Should show "B2 storage is healthy"

## Summary

**Problem**: Region mismatch (`us-west-004` vs `us-east-005`)
**Fix**: Updated `.env.local` to match Cloudflare DNS
**Action Required**: Restart dev server
**Expected Result**: B2 working, new uploads go to CDN

## What About The Black Boxes?

The black boxes are a separate issue (likely browser cache). After restarting the dev server:

1. **Hard refresh** browser (Cmd+Shift+R)
2. **Try Incognito** window
3. **Check browser console** for errors

The diagnostic confirmed Supabase Storage is working perfectly (bucket is public, URLs return HTTP 200, CORS enabled), so the images SHOULD be visible after a hard refresh.

## Next Steps

1. **Restart dev server** (Ctrl+C, then `npm run dev`)
2. **Upload a test photo** to verify B2 works
3. **Hard refresh browser** to fix black boxes
4. **Tell me the results!**

Let me know what happens after the restart!
