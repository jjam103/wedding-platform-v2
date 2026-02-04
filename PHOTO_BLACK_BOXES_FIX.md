# Photo Black Boxes - Troubleshooting Guide

## Issue

Photos appear as black boxes in the gallery instead of displaying images.

## Root Cause Identified ✅

The issue was in the `onError` handler in `app/admin/photos/page.tsx`. The handler was **hiding images** (`display: none`) whenever the `onError` event fired, even if the image actually loaded successfully.

## Fix Applied ✅

Updated the photo gallery page with:

1. **Added CORS attributes** to image elements:
   - `crossOrigin="anonymous"` - Allows cross-origin image loading
   - `referrerPolicy="no-referrer"` - Prevents referrer blocking

2. **Improved error handler** to only hide images that truly failed:
   - Check `naturalWidth === 0` before hiding
   - Enhanced logging to show image dimensions
   - Prevent duplicate placeholders

3. **Better diagnostics** in console:
   - Success logs show image dimensions
   - Error logs show complete image state
   - Warning if onError fires but image has dimensions

## Testing Steps

### 1. Clear Browser Cache (CRITICAL)

The browser may have cached the old broken behavior. Clear cache using:

**Chrome/Edge:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Firefox:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Safari:**
- Mac: `Cmd + Option + R`

### 2. Test in Incognito Mode

Open `/admin/photos` in an incognito/private window:
- Chrome/Edge: `Ctrl/Cmd + Shift + N`
- Firefox: `Ctrl/Cmd + Shift + P`
- Safari: `Cmd + Shift + N`

### 3. Check Browser Console

Open DevTools (F12) and look for:

**Success messages:**
```
✅ Image loaded successfully: https://cdn.jamara.us/photos/...
   naturalWidth: 4032
   naturalHeight: 3024
   complete: true
```

**Error messages (if any):**
```
❌ Image failed to load: https://cdn.jamara.us/photos/...
   complete: false
   naturalWidth: 0
   naturalHeight: 0
```

**Warning messages (false errors):**
```
⚠️ onError fired but image has dimensions: 4032 x 3024
```

### 4. Use Test Page

Open the diagnostic test page:

```bash
# Option 1: Serve locally
cd scripts
python3 -m http.server 8000
# Open: http://localhost:8000/test-image-loading.html

# Option 2: Copy to public folder and access via site
cp scripts/test-image-loading.html public/
# Open: https://your-site.com/test-image-loading.html
```

The test page will show:
- ✅ Direct CDN URL test
- ✅ Fetch API test
- ✅ CORS headers check
- ✅ Database photos loading

## Expected Behavior After Fix

1. **Photos display correctly** (not black boxes)
2. **Blue "B2" badges** visible on photos
3. **Console shows success messages** for each image
4. **No error messages** unless image truly failed
5. **Hover effects work** smoothly

## Verification Checklist

- [ ] Cleared browser cache
- [ ] Tested in incognito mode
- [ ] Checked browser console for errors
- [ ] Verified images display (not black boxes)
- [ ] Verified blue "B2" badges appear
- [ ] Verified hover effects work
- [ ] Tested image upload
- [ ] Tested image moderation (approve/reject)

## Common Issues & Solutions

### Issue 1: Still Seeing Black Boxes

**Cause:** Browser cache not cleared  
**Solution:** 
1. Hard refresh: `Ctrl/Cmd + Shift + R`
2. Clear site data in DevTools
3. Test in incognito mode

### Issue 2: CORS Errors in Console

**Symptom:** Console shows "CORS policy" error  
**Cause:** Cloudflare or B2 blocking cross-origin requests  
**Solution:** 
- Check Cloudflare CORS settings
- Verify `crossOrigin="anonymous"` attribute is present
- Check if Cloudflare Worker is modifying headers

### Issue 3: Mixed Content Warnings

**Symptom:** Console shows "Mixed Content" warning  
**Cause:** Page loaded over HTTPS but images over HTTP  
**Solution:** Ensure all URLs use `https://` (already correct)

### Issue 4: Images Load Then Disappear

**Symptom:** Images flash briefly then turn black  
**Cause:** `onError` handler firing after successful load  
**Solution:** Already fixed - handler now checks `naturalWidth`

### Issue 5: Slow Image Loading

**Symptom:** Images take long time to appear  
**Cause:** CDN not caching or slow B2 response  
**Solution:**
- Check Cloudflare cache status (should be HIT)
- Verify Cloudflare Worker is active
- Check B2 region matches your location

## Diagnostic Commands

```bash
# Check database URLs
node scripts/check-photo-urls.mjs

# Test CDN connectivity
node scripts/test-cdn-final.mjs

# Diagnose photo display
node scripts/diagnose-photo-display.mjs

# Fix any incorrect URLs (if found)
node scripts/fix-b2-photo-urls.mjs
```

## Technical Details

### What Changed

**Before:**
```typescript
onError={(e) => {
  console.error('Image failed to load:', photo.photo_url);
  const target = e.target as HTMLImageElement;
  target.style.display = 'none'; // ❌ Always hides image
  // ... show placeholder
}}
```

**After:**
```typescript
onError={(e) => {
  const target = e.target as HTMLImageElement;
  console.error('❌ Image failed to load:', photo.photo_url, {
    complete: target.complete,
    naturalWidth: target.naturalWidth,
    naturalHeight: target.naturalHeight
  });
  
  // ✅ Only hide if image truly failed
  if (target.naturalWidth === 0) {
    target.style.display = 'none';
    // ... show placeholder
  } else {
    console.warn('⚠️ onError fired but image has dimensions');
  }
}}
```

### Why This Fixes It

1. **CORS attributes** allow browser to load cross-origin images
2. **Referrer policy** prevents referrer-based blocking
3. **Dimension check** prevents hiding successfully loaded images
4. **Enhanced logging** helps diagnose any remaining issues

## Files Modified

- `app/admin/photos/page.tsx` - Updated image elements with CORS attributes and improved error handling
- `scripts/test-image-loading.html` - Created comprehensive diagnostic test page

## Prevention

To prevent this issue in the future:

1. **Always test image loading** in multiple browsers
2. **Check console for errors** during development
3. **Test with real CDN URLs** not just local files
4. **Verify CORS attributes** on all cross-origin images
5. **Use diagnostic tools** before deploying

## Success Indicators

You'll know it's fixed when:
- ✅ Photos display as images (not black boxes)
- ✅ Blue "B2" badges visible
- ✅ Console shows "Image loaded successfully" messages
- ✅ No red errors in console
- ✅ Network tab shows HTTP 200 for images
- ✅ Hover effects work smoothly
- ✅ Images load in incognito mode

## Still Having Issues?

If images still don't load after:
1. Clearing cache
2. Testing in incognito
3. Checking console for errors

Then provide:
1. **Screenshot of browser console** (F12 → Console tab)
2. **Screenshot of Network tab** (F12 → Network → filter by Img)
3. **Browser and version** you're using
4. **Whether it works in incognito mode**

This will help identify if it's a:
- Browser extension blocking images
- Firewall/proxy issue
- DNS resolution problem
- Cloudflare configuration issue
