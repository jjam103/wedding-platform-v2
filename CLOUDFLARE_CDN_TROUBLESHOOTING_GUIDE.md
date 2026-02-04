# Cloudflare CDN Troubleshooting Guide

## Current Status

✅ **B2 Bucket**: Public (confirmed from screenshot)
✅ **Direct B2 URLs**: Working (HTTP 200)
❌ **Cloudflare CDN**: Returning HTTP 401 Unauthorized

## The Mystery

Your Cloudflare CNAME (`cdn.jamara.us`) points to `s3.us-east-005.backblazeb2.com`, but when accessing files through Cloudflare, you get 401 errors even though:
- The bucket is public
- Direct B2 URLs work fine
- The CNAME is configured correctly

## Possible Causes & Solutions

### Cause 1: Cloudflare Cache Has Old 401 Responses

**Problem**: When the bucket was private, Cloudflare cached the 401 responses. Even though the bucket is now public, Cloudflare is serving the cached 401.

**Solution**: Purge Cloudflare cache

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Select your domain: `jamara.us`
3. Go to **Caching** → **Configuration**
4. Click **"Purge Everything"**
5. Confirm the purge
6. Wait 2-3 minutes
7. Test again: `node scripts/test-cdn-urls.mjs`

### Cause 2: Cloudflare Needs Host Header Rewrite

**Problem**: Cloudflare is sending `Host: cdn.jamara.us` to B2, but B2 expects `Host: s3.us-east-005.backblazeb2.com`

**Solution**: Add a Transform Rule to rewrite the Host header

1. Go to Cloudflare Dashboard
2. Select your domain: `jamara.us`
3. Go to **Rules** → **Transform Rules**
4. Click **"Create rule"**
5. Select **"Modify Request Header"**
6. Configure:
   - **Rule name**: `B2 Host Header Rewrite`
   - **When incoming requests match**: 
     - Field: `Hostname`
     - Operator: `equals`
     - Value: `cdn.jamara.us`
   - **Then**:
     - Action: `Set dynamic`
     - Header name: `Host`
     - Value: `s3.us-east-005.backblazeb2.com`
7. Click **"Deploy"**
8. Wait 2-3 minutes for propagation
9. Test: `node scripts/test-cdn-urls.mjs`

### Cause 3: B2 Bucket CORS Settings

**Problem**: B2 might be blocking requests from Cloudflare due to CORS restrictions.

**Solution**: Add CORS rules to your B2 bucket

1. Go to B2 Console: https://secure.backblaze.com/b2_buckets.htm
2. Click on bucket: `wedding-photos-2026-jamara`
3. Click **"Bucket Settings"**
4. Scroll to **"CORS Rules"**
5. Click **"Add CORS Rule"**
6. Add this configuration:
   ```json
   {
     "corsRuleName": "allowCloudflare",
     "allowedOrigins": [
       "https://cdn.jamara.us",
       "https://jamara.us",
       "http://localhost:3000"
     ],
     "allowedOperations": [
       "s3_get",
       "s3_head"
     ],
     "allowedHeaders": ["*"],
     "exposeHeaders": [],
     "maxAgeSeconds": 3600
   }
   ```
7. Click **"Save"**
8. Wait 5 minutes
9. Test: `node scripts/test-cdn-urls.mjs`

### Cause 4: Wrong URL Path Format

**Problem**: The URL path format doesn't match what B2 expects through Cloudflare.

**Current test results**:
- ❌ `https://cdn.jamara.us/wedding-photos-2026-jamara/photos/...` → 404
- ❌ `https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/...` → 401
- ❌ `https://cdn.jamara.us/photos/...` → 404

**Solution**: Try different URL formats

The correct format depends on how your Cloudflare CNAME is configured. Let's test:

```bash
# Test 1: Direct bucket path (what works on direct B2)
curl -I "https://cdn.jamara.us/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"

# Test 2: With /file/ prefix (B2 native format)
curl -I "https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"

# Test 3: Just the key (if Cloudflare resolves bucket automatically)
curl -I "https://cdn.jamara.us/photos/1770087981693-IMG_0627.jpeg"
```

### Cause 5: Cloudflare SSL/TLS Mode

**Problem**: Cloudflare SSL/TLS mode might be incompatible with B2.

**Solution**: Check and adjust SSL/TLS settings

1. Go to Cloudflare Dashboard
2. Select your domain: `jamara.us`
3. Go to **SSL/TLS** → **Overview**
4. Check current mode
5. Try **"Full"** mode (not "Full (strict)")
6. Wait 2-3 minutes
7. Test: `node scripts/test-cdn-urls.mjs`

## Step-by-Step Troubleshooting Plan

### Step 1: Purge Cloudflare Cache (Easiest, Try First)

This is the most likely cause. Do this first:

1. Cloudflare Dashboard → Caching → Purge Everything
2. Wait 3 minutes
3. Run: `node scripts/test-cdn-urls.mjs`

**If this works**: You're done! The issue was cached 401 responses.

**If this doesn't work**: Continue to Step 2.

### Step 2: Add Host Header Rewrite

1. Cloudflare Dashboard → Rules → Transform Rules
2. Create "Modify Request Header" rule (see Cause 2 above)
3. Wait 3 minutes
4. Run: `node scripts/test-cdn-urls.mjs`

**If this works**: You're done! The issue was the Host header.

**If this doesn't work**: Continue to Step 3.

### Step 3: Add B2 CORS Rules

1. B2 Console → Bucket Settings → CORS Rules
2. Add CORS rule (see Cause 3 above)
3. Wait 5 minutes
4. Run: `node scripts/test-cdn-urls.mjs`

**If this works**: You're done! The issue was CORS.

**If this doesn't work**: Continue to Step 4.

### Step 4: Check SSL/TLS Mode

1. Cloudflare Dashboard → SSL/TLS → Overview
2. Change to "Full" mode
3. Wait 3 minutes
4. Run: `node scripts/test-cdn-urls.mjs`

**If this works**: You're done! The issue was SSL/TLS mode.

**If this doesn't work**: The issue is more complex.

## Testing Commands

After each fix attempt, run these commands:

```bash
# Test all URL formats
node scripts/test-cdn-urls.mjs

# Test specific URL with curl
curl -I "https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"

# Check DNS resolution
nslookup cdn.jamara.us

# Check what Cloudflare sees
curl -I -H "Host: cdn.jamara.us" "https://s3.us-east-005.backblazeb2.com/wedding-photos-2026-jamara/photos/1770087981693-IMG_0627.jpeg"
```

## What I've Already Done

I've updated the code to use **direct B2 URLs** as a temporary workaround:

```typescript
// services/b2Service.ts - Now using direct B2 URLs
const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const url = `${endpoint}/${bucketName}/${key}`;
```

This means:
- ✅ Photos will work immediately
- ⚠️ No CDN caching (slower, more expensive)
- ⚠️ No Cloudflare protection

Once we fix Cloudflare, we can switch back to CDN URLs for better performance.

## Next Steps

**What I recommend**:

1. **Try Step 1 first** (Purge Cloudflare cache) - this is most likely the issue
2. **Let me know the result** - I'll help with next steps if needed
3. **Once working**, I'll update the code to use CDN URLs again

**To test right now**:

```bash
# Run the diagnostic script
node scripts/test-cdn-urls.mjs

# If you see HTTP 200 for CDN URLs, it's fixed!
# If you still see 401, try the troubleshooting steps above
```

---

**Current Status**: Using direct B2 URLs (working but not optimal)
**Goal**: Get Cloudflare CDN working for better performance
**Most Likely Fix**: Purge Cloudflare cache
**Test Command**: `node scripts/test-cdn-urls.mjs`
