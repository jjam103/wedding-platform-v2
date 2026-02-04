# URGENT: Image Visibility Fix - Black Boxes Issue

## Current Situation

**Problem**: Images showing as completely BLACK BOXES in the photo gallery

**Root Causes Identified**:
1. B2 Storage getting 403 Forbidden errors (wrong credentials or permissions)
2. All photos uploading to Supabase Storage (fallback working)
3. Images not rendering in browser (black boxes)
4. Cloudflare CDN configured but not being used (because B2 is failing)

## IMMEDIATE FIX (Do This First)

### Step 1: Check Browser Console

Open the photos page and press F12 (or Cmd+Option+I on Mac):

1. Go to **Console** tab
2. Look for errors containing:
   - "CORS"
   - "Failed to load"
   - "403"
   - "Mixed content"
   - "net::ERR"

**Copy and paste any errors you see here**

### Step 2: Check Network Tab

1. Keep DevTools open
2. Go to **Network** tab
3. Reload the page
4. Filter by "Img"
5. Click on one of the photo requests
6. Check:
   - **Status code** (should be 200, not 403/404)
   - **Response Headers** tab
   - **Preview** tab (should show the image)

**What status code do you see?**

### Step 3: Test Image URL Directly

Open this URL in a new browser tab:
```
https://bwthjirvpdypmbvpsjtl.supabase.co/storage/v1/object/public/photos/photos/1770085791477-IMG_0627.jpeg
```

**Result**:
- ✅ If you see the image → Problem is in the React app (CORS or rendering)
- ❌ If you get error/404 → Problem is with Supabase Storage bucket

### Step 4: Hard Refresh

1. Clear browser cache: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Or try in **Incognito/Private window**

**Does this fix the black boxes?**

## Most Likely Causes & Fixes

### Cause 1: Supabase Storage Bucket Not Public

**Symptoms**: 403 errors in Network tab, images don't load directly

**Fix**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: **Storage** → **photos** bucket
3. Click on bucket settings (gear icon)
4. Make sure **"Public bucket"** is enabled
5. If bucket doesn't exist, create it:
   - Click "New bucket"
   - Name: `photos`
   - Check "Public bucket"
   - Click "Create bucket"

### Cause 2: CORS Not Configured

**Symptoms**: CORS errors in console, images fail to load from Supabase

**Fix**:
1. Go to Supabase Dashboard → **Storage** → **photos** bucket
2. Click **Configuration** or **Settings**
3. Add CORS policy:
```json
{
  "allowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
  "allowedMethods": ["GET", "HEAD"],
  "allowedHeaders": ["*"],
  "maxAgeSeconds": 3600
}
```

### Cause 3: Image Content-Type Issue

**Symptoms**: Images load but show as black, no console errors

**Fix**: This is handled automatically by the upload code, but verify:
1. Check Network tab → Headers → Response Headers
2. Look for `content-type: image/jpeg` (or image/png, etc.)
3. If missing or wrong, the upload code needs to be fixed

### Cause 4: Browser Security (Mixed Content)

**Symptoms**: Console shows "Mixed content" warnings

**Fix**: Make sure you're accessing the app via HTTP (not HTTPS) in development:
- Use `http://localhost:3000` (not `https://localhost:3000`)

## B2 Storage Fix (Secondary Priority)

The B2 403 error means your credentials or bucket permissions are wrong. Here's how to fix it:

### Step 1: Verify B2 Bucket Exists

1. Log into [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Look for bucket: `wedding-photos-2026-jamara`
3. **Does it exist?** If not, create it:
   - Click "Create a Bucket"
   - Bucket Name: `wedding-photos-2026-jamara`
   - Files in Bucket: **Public**
   - Encryption: None (or your preference)
   - Object Lock: Disabled

### Step 2: Check Application Key Permissions

1. Go to [B2 App Keys](https://secure.backblaze.com/app_keys.htm)
2. Find key with ID: `005deeec805bbf50000000003`
3. Check it has these capabilities:
   - ✓ listBuckets
   - ✓ listFiles
   - ✓ readFiles
   - ✓ writeFiles
   - ✓ deleteFiles (optional)

4. **If key is missing capabilities or doesn't exist**:
   - Click "Add a New Application Key"
   - Name: "Wedding Photos Upload"
   - Allow access to: **wedding-photos-2026-jamara** (or "All")
   - Type of Access: **Read and Write**
   - Click "Create New Key"
   - **IMPORTANT**: Copy the `applicationKey` (secret) - you can only see it once!

### Step 3: Update Environment Variables

If you created a new key, update `.env.local`:

```bash
# Replace with your NEW credentials
B2_ACCESS_KEY_ID=your-new-key-id
B2_SECRET_ACCESS_KEY=your-new-secret-key
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=wedding-photos-2026-jamara
B2_BUCKET_ID=5dfe8e0e4c9870c59bbb0f15
B2_CDN_DOMAIN=cdn.jamara.us
CLOUDFLARE_CDN_URL=https://cdn.jamara.us
```

**Note**: The endpoint should match your bucket's region. Check in B2 console:
- If bucket is in `us-east-005` → `https://s3.us-east-005.backblazeb2.com`
- If bucket is in `us-west-004` → `https://s3.us-west-004.backblazeb2.com`

### Step 4: Configure B2 Bucket for Cloudflare CDN

1. In B2 Console, click on your bucket
2. Go to **Bucket Settings**
3. Add **Bucket Info** (JSON):
```json
{
  "cache-control": "max-age=31536000"
}
```

4. Add **CORS Rules**:
```json
[
  {
    "corsRuleName": "allow-all",
    "allowedOrigins": ["*"],
    "allowedOperations": ["s3_get"],
    "allowedHeaders": ["*"],
    "exposeHeaders": [],
    "maxAgeSeconds": 3600
  }
]
```

### Step 5: Verify Cloudflare CDN

Your Cloudflare CDN should already be configured (you said it is), but verify:

1. Log into Cloudflare
2. Select domain: `jamara.us`
3. Go to **DNS** settings
4. Verify CNAME record exists:
   - **Name**: `cdn`
   - **Target**: `s3.us-east-005.backblazeb2.com` (match your B2 region)
   - **Proxy status**: Proxied (orange cloud)

5. Go to **Rules** → **Page Rules**
6. Add rule for `cdn.jamara.us/*`:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 month

### Step 6: Restart Dev Server

After updating `.env.local`:
```bash
# Stop server (Ctrl+C)
npm run dev
```

Look for this message in the terminal:
```
✓ B2 client initialized successfully
```

If you see a warning instead, B2 is still not working.

### Step 7: Test B2 Upload

1. Go to photos page
2. Click "Upload Photos"
3. Upload a test image
4. Check the **storage type badge** - should show "B2" (not "Supabase")
5. Verify image URL contains `cdn.jamara.us` or `backblazeb2.com`
6. Confirm image loads (not black box)

## Diagnostic Commands

### Check if Supabase Storage is accessible:
```bash
curl -I "https://bwthjirvpdypmbvpsjtl.supabase.co/storage/v1/object/public/photos/photos/1770085791477-IMG_0627.jpeg"
```

Should return: `HTTP/2 200`

If you get `403` or `404`, the Supabase bucket is not public.

### Check if B2 bucket is accessible:
```bash
curl -I "https://s3.us-east-005.backblazeb2.com/wedding-photos-2026-jamara/"
```

Should return: `HTTP/2 200` or `HTTP/2 403` (403 is expected without auth)

## What To Tell Me

After checking the above, please report:

1. **Browser Console Errors**: Copy/paste any red errors
2. **Network Tab Status**: What HTTP status code for images? (200, 403, 404?)
3. **Direct URL Test**: Can you see the image when opening URL directly? (Yes/No)
4. **Hard Refresh**: Did hard refresh or incognito fix it? (Yes/No)
5. **Supabase Bucket**: Is the `photos` bucket public? (Yes/No/Doesn't exist)
6. **B2 Bucket**: Does `wedding-photos-2026-jamara` exist in B2? (Yes/No)
7. **B2 Key**: Does the application key have correct permissions? (Yes/No/Don't know)

## Expected Behavior After Fix

### Immediate (Supabase Storage):
- ✅ Images visible as thumbnails (not black boxes)
- ✅ Storage type badges show "Supabase"
- ✅ Photo URLs contain `supabase.co`
- ✅ Upload works smoothly

### After B2 Fix:
- ✅ New uploads show "B2" badge
- ✅ Photo URLs contain `cdn.jamara.us`
- ✅ Images load from CDN
- ✅ Faster image delivery

## Priority Order

1. **FIRST**: Fix image visibility (Supabase bucket public + CORS)
2. **THEN**: Fix B2 credentials (Backblaze console)
3. **FINALLY**: Verify CDN works (Cloudflare + B2)

The app is functional, we just need to make images visible!
