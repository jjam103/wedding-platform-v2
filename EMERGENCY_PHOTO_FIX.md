# EMERGENCY PHOTO FIX - Get Images Showing NOW

## The Problem

Images are BLACK BOXES because:
1. Photos are uploading to B2 successfully
2. URLs are using CDN domain: `https://cdn.jamara.us/photos/...`
3. **BUT** the CDN (`cdn.jamara.us`) is NOT configured yet
4. So the URLs don't work → black boxes

## IMMEDIATE FIX (2 minutes)

### Option 1: Disable CDN - Use Direct B2 URLs

Edit `.env.local` and **comment out** the CDN domain:

```bash
# Backblaze B2 Storage
B2_ACCESS_KEY_ID=005deeec805bbf50000000003
B2_SECRET_ACCESS_KEY=K005u1q6dbxI6ExvXMyOY+RwyD3MsPoK005UIxSRr9iDIJAAIBqbW+wtpBp4og
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=wedding-photos-2026-jamara
B2_BUCKET_ID=5dfe8e0e4c9870c59bbb0f15
# B2_CDN_DOMAIN=cdn.jamara.us  ← COMMENT THIS OUT
# CLOUDFLARE_CDN_URL=https://cdn.jamara.us  ← COMMENT THIS OUT
```

**Then restart your dev server:**
```bash
# Stop the server (Ctrl+C)
npm run dev
```

**Result**: New uploads will use direct B2 URLs like:
```
https://s3.us-west-004.backblazeb2.com/wedding-photos-2026-jamara/photos/...
```

These will work immediately!

### Option 2: Use Supabase Storage Instead

If you want images working RIGHT NOW without B2:

1. **Comment out ALL B2 variables** in `.env.local`:
```bash
# B2_ACCESS_KEY_ID=...
# B2_SECRET_ACCESS_KEY=...
# B2_ENDPOINT=...
# B2_REGION=...
# B2_BUCKET_NAME=...
# B2_BUCKET_ID=...
# B2_CDN_DOMAIN=...
# CLOUDFLARE_CDN_URL=...
```

2. **Ensure Supabase Storage bucket exists**:
   - Go to https://supabase.com/dashboard
   - Navigate to Storage
   - Create a bucket named `photos` if it doesn't exist
   - Make it **PUBLIC**

3. **Restart dev server**

**Result**: All uploads will go to Supabase Storage and work immediately!

## Why This Happened

The code is working correctly:
1. ✅ B2 client initializes
2. ✅ Photos upload to B2
3. ✅ URLs are generated with CDN domain
4. ❌ **BUT** CDN domain doesn't exist yet

The CDN domain `cdn.jamara.us` needs to be configured in Cloudflare to proxy requests to B2. Until that's done, those URLs won't work.

## Configure CDN (Later - Optional)

If you want to use the CDN eventually:

### Step 1: Add DNS Record in Cloudflare

1. Log into Cloudflare
2. Select your domain (`jamara.us`)
3. Go to DNS settings
4. Add a CNAME record:
   - **Name**: `cdn`
   - **Target**: `s3.us-west-004.backblazeb2.com`
   - **Proxy status**: Proxied (orange cloud)

### Step 2: Add Page Rule in Cloudflare

1. Go to Rules > Page Rules
2. Create a new rule:
   - **URL**: `cdn.jamara.us/*`
   - **Settings**:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 month

### Step 3: Configure B2 Bucket for Cloudflare

1. Log into Backblaze B2
2. Go to your bucket settings
3. Add Bucket Info:
   ```json
   {
     "cache-control": "max-age=31536000"
   }
   ```

4. Add CORS rules:
   ```json
   [
     {
       "corsRuleName": "allow-all",
       "allowedOrigins": ["*"],
       "allowedOperations": ["s3_get"],
       "allowedHeaders": ["*"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

### Step 4: Test

Try accessing: `https://cdn.jamara.us/wedding-photos-2026-jamara/photos/test.jpg`

If it works, uncomment the CDN variables in `.env.local` and restart.

## Recommended Approach

**For NOW (to get images working)**:
- Use Option 1 (direct B2 URLs) or Option 2 (Supabase Storage)

**For LATER (when you have time)**:
- Configure the CDN properly
- Then uncomment the CDN variables

## Testing After Fix

1. **Restart dev server** after changing `.env.local`
2. **Upload a new photo**
3. **Check the storage type badge** - should show "B2" or "Supabase"
4. **Verify image loads** - should see actual image, not black box
5. **Check browser console** - should be no errors

## Current Status

- ✅ B2 credentials correct
- ✅ B2 bucket exists
- ✅ Upload code working
- ❌ CDN not configured
- ❌ Images showing as black boxes

## Next Action

**DO THIS NOW**:
1. Edit `.env.local`
2. Comment out the two CDN lines (B2_CDN_DOMAIN and CLOUDFLARE_CDN_URL)
3. Save file
4. Restart dev server (Ctrl+C, then `npm run dev`)
5. Upload a test photo
6. Images should now show!

The CDN can be configured later when you have time. For now, direct B2 URLs will work fine.
