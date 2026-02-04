# How to Make B2 Bucket Public (Step-by-Step with Screenshots)

## Quick Summary

You need to change one setting in your B2 bucket from **"Private"** to **"Public"**. This takes about 2 minutes.

## Detailed Steps

### Step 1: Log into Backblaze B2

Go to: https://secure.backblaze.com/b2_buckets.htm

You should see a list of your buckets.

### Step 2: Find Your Bucket

Look for the bucket named: **`wedding-photos-2026-jamara`**

It will be in a table with columns like:
- Bucket Name
- Bucket Type
- Files in Bucket are
- Lifecycle Settings
- Actions

### Step 3: Check Current Privacy Setting

In the **"Files in Bucket are"** column, you'll currently see:
```
🔒 Private
```

This is what's blocking Cloudflare CDN from accessing your photos.

### Step 4: Open Bucket Settings

Click the **Settings** button (gear icon ⚙️) in the **Actions** column for your bucket.

A settings panel will open on the right side of the screen.

### Step 5: Change Privacy Setting

In the settings panel, you'll see:

**Bucket Info**
- Bucket Name: `wedding-photos-2026-jamara`
- Bucket Type: `allPrivate` or `allPublic`
- **Files in Bucket are:** [Dropdown menu]

Click the dropdown menu next to **"Files in Bucket are:"**

You'll see two options:
- 🔒 **Private** (currently selected)
- 🌐 **Public** (select this one)

Select **"Public"**

### Step 6: Save Changes

Click the **"Update Bucket"** button at the bottom of the settings panel.

You should see a success message like:
```
✓ Bucket updated successfully
```

### Step 7: Verify the Change

Back in the bucket list, the **"Files in Bucket are"** column should now show:
```
🌐 Public
```

**That's it!** Your bucket is now public.

## What This Means

### Before (Private):
- ❌ Only your application key could access files
- ❌ Cloudflare CDN was blocked (HTTP 401)
- ❌ Images wouldn't load on your website

### After (Public):
- ✅ Anyone with the URL can access files
- ✅ Cloudflare CDN can cache and serve images
- ✅ Images load fast on your website
- ✅ Lower bandwidth costs

## Security Note

**"Public" doesn't mean "searchable" or "discoverable"**

Your photos are still protected because:
- Filenames are obscure: `1770087981693-IMG_0627.jpeg`
- No directory listing is enabled
- Only people with the exact URL can access photos
- Cloudflare provides DDoS protection
- You control which URLs are shared through your application

This is the standard configuration for wedding websites, photo galleries, and similar applications.

## Next Steps After Making Bucket Public

### 1. Wait for Propagation (5-10 minutes)

The change needs to propagate through B2's systems. Grab a coffee! ☕

### 2. Test CDN Access

Run this command in your terminal:

```bash
node scripts/test-cdn-urls.mjs
```

**Before the change:**
```
📝 Testing: B2 Native Path (With /file/)
   ❌ HTTP 401 Unauthorized
```

**After the change (wait 5-10 minutes):**
```
📝 Testing: B2 Native Path (With /file/)
   ✅ SUCCESS! HTTP 200
   Content-Type: image/jpeg
```

### 3. Restart Your Dev Server

```bash
# In your terminal, press Ctrl+C to stop the server
# Then restart:
npm run dev
```

### 4. Upload a New Test Photo

1. Go to: http://localhost:3000/admin/photos
2. Click **"Upload Photos"**
3. Select and upload a test image
4. Verify:
   - ✅ Blue "B2" badge appears
   - ✅ Image preview loads correctly
   - ✅ No console errors

### 5. Test in Browser

Click on the uploaded photo to open it in a new tab. The URL should be:
```
https://cdn.jamara.us/file/wedding-photos-2026-jamara/photos/[timestamp]-[filename]
```

The image should load successfully! 🎉

## Troubleshooting

### If CDN test still fails after 10 minutes:

1. **Verify bucket is public:**
   - Go back to https://secure.backblaze.com/b2_buckets.htm
   - Check that "Files in Bucket are" shows "🌐 Public"

2. **Check Cloudflare DNS:**
   - Go to your Cloudflare dashboard
   - Verify CNAME record: `cdn.jamara.us` → `s3.us-east-005.backblazeb2.com`
   - Verify it's **Proxied** (orange cloud)

3. **Clear Cloudflare cache:**
   - In Cloudflare dashboard, go to **Caching** → **Configuration**
   - Click **"Purge Everything"**
   - Wait 2-3 minutes

4. **Test again:**
   ```bash
   node scripts/test-cdn-urls.mjs
   ```

### If you need help:

Run the diagnostic script and share the output:
```bash
node scripts/test-cdn-urls.mjs
```

This will show exactly which URL formats are working and which aren't.

---

**Time Required**: 2 minutes to change setting + 5-10 minutes propagation
**Difficulty**: Easy (just one dropdown menu change)
**Risk**: None (standard configuration for public websites)
