# Photo Black Boxes - Browser Diagnostic Guide

## Current Status

✅ **CDN is working** - curl tests return HTTP 200  
✅ **CORS headers are set** - `Access-Control-Allow-Origin: *`  
✅ **Database URLs are correct** - All photos use `https://cdn.jamara.us/photos/...`  
✅ **Cloudflare Worker is active** - CF-Cache-Status: HIT  
❌ **Images appear as black boxes in browser** - Even in incognito mode

## Root Cause

The `onError` handler in `app/admin/photos/page.tsx` (lines 838-860) is **hiding failed images** and showing a placeholder, creating the black box effect. The images are failing to load in the browser, but we need to find out WHY.

## Diagnostic Steps

### Step 1: Open Browser Console

1. Open `/admin/photos` page
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for error messages

**What to look for:**
- Red error messages about images
- CORS errors
- Network errors
- CSP (Content Security Policy) violations

**Please copy and paste ALL error messages you see.**

### Step 2: Check Network Tab

1. Keep Developer Tools open (F12)
2. Click the **Network** tab
3. Reload the page
4. Filter by "Img" or "images"
5. Click on one of the failed image requests

**What to check:**
- Status code (should be 200, but might be something else)
- Response headers
- Preview tab (does the image show?)

**Please report:**
- What status code do you see?
- Does the Preview tab show the image?
- What headers are present?

### Step 3: Test with Diagnostic HTML Page

I've created a test page that will help diagnose the issue:

```bash
# Open this file in your browser:
open scripts/test-browser-image-load.html
```

This page runs 4 different tests:
1. Direct `<img>` tag
2. Fetch API
3. Dynamic image creation
4. CSS background-image

**Please report which tests pass and which fail.**

### Step 4: Check for Browser Extensions

Browser extensions (especially ad blockers and privacy tools) can block images:

1. Open `/admin/photos` in **Incognito/Private mode**
2. If images work in incognito but not normal mode → **Extension is blocking**

**Common culprits:**
- uBlock Origin
- Privacy Badger
- AdBlock Plus
- Ghostery
- Any VPN extensions

**To test:** Disable all extensions and reload the page.

### Step 5: Check Content Security Policy

Next.js might be blocking external images. Check `next.config.ts`:

```typescript
// Should have this in images.remotePatterns:
{
  protocol: 'https',
  hostname: 'cdn.jamara.us',
  pathname: '/photos/**',
}
```

### Step 6: Test Direct URL in Browser

1. Copy this URL: `https://cdn.jamara.us/photos/1770094855401-IMG_0627.jpeg`
2. Paste it directly in your browser address bar
3. Press Enter

**What happens?**
- ✅ Image displays → CDN works, issue is in the page
- ❌ Error page → CDN has an issue
- ⏳ Infinite loading → Network/timeout issue

## Common Issues and Fixes

### Issue 1: Content Security Policy (CSP)

**Symptom:** Console shows "Refused to load image because it violates CSP"

**Fix:** Update `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "img-src 'self' https://cdn.jamara.us https://*.supabase.co data: blob:;"
        }
      ]
    }
  ];
}
```

### Issue 2: Mixed Content (HTTP/HTTPS)

**Symptom:** Console shows "Mixed Content" warning

**Fix:** Ensure ALL URLs use `https://` (not `http://`)

Check database:
```sql
SELECT photo_url FROM photos WHERE photo_url LIKE 'http://%';
```

### Issue 3: Cloudflare Worker Not Returning Response Body

**Symptom:** Images load in curl but not browser, no console errors

**Fix:** Update Cloudflare Worker code:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.hostname !== 'cdn.jamara.us') {
      return fetch(request);
    }
    
    // Create B2 URL
    const b2Url = new URL(request.url);
    b2Url.hostname = 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com';
    
    // Fetch from B2
    const response = await fetch(b2Url.toString(), {
      method: request.method,
      headers: request.headers,
    });
    
    // Clone response and add CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000');
    
    return newResponse;
  }
};
```

### Issue 4: Browser Cache

**Symptom:** Images worked before, now they don't

**Fix:** Hard refresh the page:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

Or clear browser cache:
- Chrome: Settings → Privacy → Clear browsing data → Cached images
- Firefox: Settings → Privacy → Clear Data → Cached Web Content

### Issue 5: Cloudflare Cache Serving Old 404s

**Symptom:** curl works, browser doesn't, even in incognito

**Fix:** Purge Cloudflare cache:

1. Go to https://dash.cloudflare.com
2. Select domain: `jamara.us`
3. Click **Caching** → **Configuration**
4. Click **Purge Everything**
5. Confirm
6. Wait 30 seconds
7. Test again

## Temporary Workaround

While we diagnose, you can temporarily disable the error handler to see the actual errors:

**Edit `app/admin/photos/page.tsx` line 838:**

```typescript
// BEFORE (hides errors):
onError={(e) => {
  console.error('Image failed to load:', photo.photo_url);
  // ... placeholder code ...
}}

// AFTER (shows errors):
onError={(e) => {
  console.error('❌ Image failed to load:', photo.photo_url);
  console.error('Error event:', e);
  // Don't hide the image - let it show the broken image icon
}}
```

This will show broken image icons instead of black boxes, making it easier to debug.

## Next Steps

**Please provide:**

1. **Console errors** - Any red errors when loading `/admin/photos`
2. **Network tab status** - What HTTP status code do you see for images?
3. **Diagnostic test results** - Which of the 4 tests pass/fail?
4. **Direct URL test** - Does the image load when you paste the URL directly?
5. **Browser info** - What browser and version are you using?

Once you provide this information, I can pinpoint the exact issue and provide a targeted fix.

## Quick Test Commands

```bash
# Test CORS headers
node scripts/test-cors-headers.mjs

# Test CDN
node scripts/test-cdn-final.mjs

# Open browser diagnostic page
open scripts/test-browser-image-load.html
```

---

**Status:** Waiting for browser console errors and diagnostic test results
