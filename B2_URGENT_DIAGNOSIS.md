# B2 URGENT DIAGNOSIS - Images Not Showing

## Problem

Images are showing as **BLACK BOXES** in the photo gallery. This means:
1. The `<img>` tags are rendering
2. The URLs are being set
3. But the images are either:
   - Not loading (404/403 errors)
   - CORS blocked
   - Don't exist at those URLs

## Immediate Actions Needed

### 1. Check Browser Console

Open browser DevTools (F12) and look for:
- **Red errors** about failed image loads
- **CORS errors** (Cross-Origin Resource Sharing)
- **404 errors** (images not found)
- **403 errors** (permission denied)

### 2. Check Network Tab

In DevTools Network tab:
- Filter by "Img"
- Look at the photo URLs being requested
- Check the HTTP status codes (should be 200, not 404/403)
- Look at the Response headers for CORS headers

### 3. Verify B2 Bucket Settings

The B2 bucket needs these settings:
- **Bucket Type**: Public
- **CORS Rules**: Must allow your domain
- **Files**: Must actually exist in the bucket

### 4. Check CDN Configuration

Your CDN domain is `cdn.jamara.us`. Verify:
- DNS is pointing to Cloudflare
- Cloudflare is configured to proxy to B2
- Cache settings are correct

## Quick Tests

### Test 1: Check if images exist in Supabase

1. Go to Supabase Dashboard
2. Navigate to Storage > photos bucket
3. Look for files in the `photos/` folder
4. Try to open one directly - does it load?

### Test 2: Check B2 Bucket

1. Log into Backblaze B2
2. Go to your bucket: `wedding-photos-2026-jamara`
3. Look for files - are there any?
4. Try to access one directly via URL

### Test 3: Test CDN

Try accessing an image directly:
```
https://cdn.jamara.us/photos/[filename]
```

Does it load? Or do you get an error?

## Most Likely Causes

### Cause 1: B2 Upload is Failing Silently

**Symptoms**: 
- Photos show "Supabase" badge
- Images are black boxes
- Supabase Storage URLs don't work

**Why**: B2 health check is failing, so uploads go to Supabase, but Supabase Storage bucket might not be configured correctly.

**Fix**: 
1. Check Supabase Storage bucket exists and is public
2. Or fix B2 so uploads go there instead

### Cause 2: CORS Not Configured

**Symptoms**:
- Browser console shows CORS errors
- Images fail to load from B2/CDN

**Why**: B2 bucket doesn't allow requests from your domain

**Fix**: Add CORS rules to B2 bucket:
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

### Cause 3: CDN Not Configured

**Symptoms**:
- URLs use `cdn.jamara.us`
- Images don't load
- DNS/Cloudflare not set up

**Why**: CDN domain isn't actually pointing to B2

**Fix**: Either:
- Configure Cloudflare to proxy to B2
- Or remove CDN domain from env vars to use direct B2 URLs

### Cause 4: Images Don't Exist

**Symptoms**:
- 404 errors in console
- No files in B2 bucket
- No files in Supabase Storage

**Why**: Uploads are failing completely

**Fix**: Check server logs during upload for errors

## Immediate Fix Options

### Option 1: Use Supabase Storage Only (Fastest)

1. Remove B2 env vars temporarily:
```bash
# Comment out in .env.local
# B2_ACCESS_KEY_ID=...
# B2_SECRET_ACCESS_KEY=...
```

2. Ensure Supabase Storage bucket is public:
   - Go to Supabase Dashboard > Storage
   - Create `photos` bucket if it doesn't exist
   - Make it public

3. Restart dev server

4. Upload a test photo

5. Check if it shows (should use Supabase URL)

### Option 2: Fix B2 CORS (If using B2)

1. Log into Backblaze B2
2. Go to bucket settings
3. Add CORS rules (see above)
4. Test upload again

### Option 3: Remove CDN Domain

If CDN isn't configured:

1. Edit `.env.local`:
```bash
# Remove or comment out:
# B2_CDN_DOMAIN=cdn.jamara.us
```

2. Restart dev server

3. Photos will use direct B2 URLs instead

## What To Tell Me

Please check and report:

1. **Browser Console Errors**: Copy/paste any red errors
2. **Network Tab**: What HTTP status codes for images? (200, 404, 403?)
3. **Image URLs**: What URLs are being used? (Supabase? B2? CDN?)
4. **Storage Health**: Click "Check Storage" button - what does it say?
5. **Supabase Storage**: Do you have a `photos` bucket? Is it public?
6. **B2 Bucket**: Log into B2 - are there files in the bucket?

## Server Logs

Check the terminal where `npm run dev` is running. Look for:
- B2 initialization messages
- Upload attempt logs
- Any error messages

Copy/paste relevant logs.

## Next Steps

Once you provide the above information, I can:
1. Identify the exact cause
2. Provide a targeted fix
3. Get images showing immediately

The black boxes mean the HTML is correct but the image sources are wrong/inaccessible. This is a configuration issue, not a code issue.
