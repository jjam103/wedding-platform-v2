# Cloudflare Host Header Fix - Step by Step

**Issue:** Cloudflare sends wrong Host header to B2, causing 404 errors  
**Solution:** Create Transform Rule to rewrite Host header  
**Time:** 5 minutes

## 🎯 The Problem (Now Confirmed)

DNS-only test revealed:
- ✅ CNAME is correct
- ✅ DNS resolves properly
- ❌ Cloudflare sends `Host: cdn.jamara.us` to B2
- ❌ B2 expects `Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
- ❌ B2 returns 404 because it doesn't recognize `cdn.jamara.us` as a bucket

## 🔧 The Fix: Transform Rule

### Step 1: Re-enable Cloudflare Proxy

1. Go to: https://dash.cloudflare.com
2. Select domain: `jamara.us`
3. Click **"DNS"** in left sidebar
4. Find the `cdn` CNAME record
5. Click to edit it
6. Toggle to 🟠 **Proxied** (orange cloud)
7. Click **"Save"**

### Step 2: Create Transform Rule

1. In Cloudflare Dashboard, click **"Rules"** in left sidebar
2. Click **"Transform Rules"**
3. Click **"Create rule"** under "HTTP Request Header Modification"
4. Fill in the form:

**Rule name:**
```
B2 Host Header Rewrite
```

**When incoming requests match:**
- Click "Edit expression"
- Paste this:
```
(http.host eq "cdn.jamara.us")
```

**Then:**
- Action: **Set static**
- Header name: `Host`
- Value: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

5. Click **"Deploy"**

### Step 3: Wait & Test

```bash
# Wait 30 seconds for rule to propagate
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

## 📸 Visual Guide

### Transform Rule Configuration

```
┌─────────────────────────────────────────────────────────┐
│ Rule name: B2 Host Header Rewrite                       │
├─────────────────────────────────────────────────────────┤
│ When incoming requests match:                           │
│   (http.host eq "cdn.jamara.us")                        │
├─────────────────────────────────────────────────────────┤
│ Then:                                                   │
│   Set static                                            │
│   Header name: Host                                     │
│   Value: wedding-photos-2026-jamara.s3.us-east-005...  │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Alternative: Origin Rules (If Transform Rules Don't Work)

If Transform Rules don't work, try Origin Rules:

1. Click **"Rules"** → **"Origin Rules"**
2. Click **"Create rule"**
3. **Rule name:** `B2 Origin Override`
4. **When incoming requests match:**
   - Field: `Hostname`
   - Operator: `equals`
   - Value: `cdn.jamara.us`
5. **Then:**
   - **Override origin:** `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
   - **Host header:** `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
6. Click **"Deploy"**

## ✅ Verification Checklist

After creating the rule:

- ☐ Wait 30 seconds
- ☐ Run test script: `node scripts/test-cdn-final.mjs`
- ☐ Should see: `Status: 200 OK`
- ☐ Should see: `x-amz-request-id` header present
- ☐ Restart dev server: `npm run dev`
- ☐ Upload a test photo in admin panel
- ☐ Verify photo displays with blue "B2" badge
- ☐ Check browser console (no errors)
- ☐ Verify images load quickly

## 🎓 Why This Works

### Before (Broken):
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: cdn.jamara.us ❌
                           B2: "No bucket named cdn.jamara.us"
                           Returns: 404
```

### After (Fixed):
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: wedding-photos-2026-jamara.s3... ✅
                           B2: "Found bucket!"
                           Returns: 200 + file
```

## 🚨 Common Mistakes

### ❌ Wrong: Using "Set dynamic"
```
Action: Set dynamic
Value: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
Error: "Filter parsing error - unknown identifier"
```
**Why it fails:** "Set dynamic" expects a Cloudflare expression, not a plain string.

### ✅ Correct: Using "Set static"
```
Action: Set static
Value: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```
**Why it works:** "Set static" accepts a plain string value.

### ❌ Wrong: Forgetting to re-enable proxy
If you leave DNS-only mode, the rule won't apply.

### ✅ Correct: Proxy enabled (orange cloud)
Rule only works when proxy is enabled.

## 📊 Expected Timeline

- Create rule: 2 minutes
- Rule propagation: 30 seconds
- Test: 30 seconds
- Verify in browser: 1 minute
- **Total: 4 minutes**

## 🆘 If It Still Doesn't Work

1. **Check rule is enabled:**
   - Go to Rules → Transform Rules
   - Verify "B2 Host Header Rewrite" shows as "Active"

2. **Check rule expression:**
   - Should be: `(http.host eq "cdn.jamara.us")`
   - NOT: `(hostname eq "cdn.jamara.us")`

3. **Try Origin Rules instead:**
   - Some Cloudflare plans work better with Origin Rules
   - Follow "Alternative" section above

4. **Check Cloudflare plan:**
   - Transform Rules require Pro plan or higher
   - If on Free plan, you may need to upgrade

5. **Contact Cloudflare Support:**
   - If rule is correct but still not working
   - Provide: Domain, rule configuration, test results

## 🎉 Success Indicators

When it's working:
- ✅ Test script shows 200 OK
- ✅ `x-amz-request-id` header present
- ✅ Photos display in browser
- ✅ Blue "B2" badge on uploaded photos
- ✅ No console errors
- ✅ Fast image loading

---

**Ready?** Start with Step 1: Re-enable Cloudflare proxy, then create the Transform Rule.
