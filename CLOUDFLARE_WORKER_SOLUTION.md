# Cloudflare Worker Solution (Free Plan Compatible)

**Issue:** Origin Rules require Enterprise plan  
**Solution:** Use Cloudflare Worker to rewrite Host header  
**Cost:** Free (Workers are included in Free plan)  
**Time:** 5 minutes

## 🎯 Why This Works

Cloudflare Workers run on every request and CAN modify the Host header when connecting to origins. This is the free alternative to Origin Rules.

## 🔧 Step-by-Step Setup

### Step 1: Create a Worker

1. Go to https://dash.cloudflare.com
2. Select your domain: `jamara.us`
3. Click **"Workers & Pages"** in the left sidebar
4. Click **"Create application"**
5. Click **"Create Worker"**
6. Name it: `b2-cdn-proxy`
7. Click **"Deploy"**

### Step 2: Edit the Worker Code

1. After deployment, click **"Edit code"**
2. **Delete all the existing code**
3. **Paste this code:**

```javascript
export default {
  async fetch(request) {
    // Only handle requests to cdn.jamara.us
    const url = new URL(request.url);
    
    if (url.hostname !== 'cdn.jamara.us') {
      return fetch(request);
    }
    
    // Create new request with B2 hostname
    const b2Url = new URL(request.url);
    b2Url.hostname = 'wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com';
    
    // Create new request with modified Host header
    const modifiedRequest = new Request(b2Url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    
    // Fetch from B2
    const response = await fetch(modifiedRequest);
    
    // Return response with CORS headers
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000');
    
    return newResponse;
  }
};
```

4. Click **"Save and Deploy"**

### Step 3: Add Worker Route

1. Go back to **Workers & Pages**
2. Click on your `b2-cdn-proxy` worker
3. Click **"Triggers"** tab
4. Under "Routes", click **"Add route"**
5. Fill in:
   - **Route:** `cdn.jamara.us/*`
   - **Zone:** `jamara.us`
6. Click **"Add route"**

### Step 4: Ensure Proxy is Enabled

1. Go to **DNS** in left sidebar
2. Find the `cdn` CNAME record
3. Make sure it's 🟠 **Proxied** (orange cloud)
4. If not, toggle it to Proxied

### Step 5: Test

```bash
# Wait 30 seconds for worker to propagate
sleep 30

# Test CDN
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg ✅

🎉 SUCCESS! CDN is working perfectly!
```

## 📊 How It Works

### Before (404):
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: cdn.jamara.us ❌
                           B2: "No bucket with this name"
                           Returns: 404
```

### After (200 OK):
```
Browser → cdn.jamara.us → Cloudflare Worker → B2
                           ↓
                    Worker rewrites URL to:
                    wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
                           ↓
                    B2: "Found bucket!"
                    Returns: 200 + file
```

## ✅ Verification Checklist

- ☐ Worker created and deployed
- ☐ Worker code pasted correctly
- ☐ Route added: `cdn.jamara.us/*`
- ☐ DNS record is Proxied (orange cloud)
- ☐ Wait 30 seconds
- ☐ Test script returns 200 OK
- ☐ Photos display in browser
- ☐ Blue "B2" badge on uploads

## 🎓 Why Workers Are Better Than Origin Rules

**Advantages:**
- ✅ Available on Free plan
- ✅ More flexible (can add custom logic)
- ✅ Can add CORS headers
- ✅ Can add custom caching rules
- ✅ 100,000 requests/day on Free plan

**Disadvantages:**
- Slightly more complex setup (but still easy)
- Uses Worker requests quota (but 100k/day is plenty)

## 🚨 Troubleshooting

### Worker not triggering
- Check route is exactly: `cdn.jamara.us/*`
- Check DNS is Proxied (orange cloud)
- Wait 60 seconds for propagation

### Still getting 404
- Check worker code is pasted correctly
- Check B2 hostname in code matches your bucket
- Check worker is deployed (not just saved)

### Worker errors
- Check browser console for errors
- Go to Workers & Pages → your worker → Logs
- Look for error messages

## 💰 Cost

**Free Plan:**
- 100,000 requests/day
- More than enough for most sites
- If you exceed, upgrade to Workers Paid ($5/month for 10 million requests)

## ⏱️ Time to Fix

- Create worker: 2 minutes
- Add code: 1 minute
- Add route: 1 minute
- Test: 1 minute
- **Total: 5 minutes**

---

**Ready?** Start with Step 1: Create a Worker!
