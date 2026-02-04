# Cloudflare Origin Rules - Visual Step-by-Step Guide

## 🎯 Quick Summary

**Problem:** Transform Rules can't modify `Host` header  
**Solution:** Use Origin Rules instead  
**Time:** 3 minutes

---

## Step 1: Navigate to Origin Rules

1. Go to https://dash.cloudflare.com
2. Select your domain: **jamara.us**
3. In the left sidebar, click **"Rules"**
4. Click **"Origin Rules"**
5. Click the blue **"Create rule"** button

---

## Step 2: Name Your Rule

In the "Rule name" field at the top, enter:
```
B2 Origin Override
```

---

## Step 3: Set the Condition

1. Find the section: **"When incoming requests match..."**
2. Click **"Edit expression"** (on the right side)
3. A text box will appear
4. Paste this exact expression:
```
(http.host eq "cdn.jamara.us")
```

---

## Step 4: Configure Host Header Override

1. Scroll down to the **"Then..."** section
2. Find the **"Rewrite to"** subsection
3. Look for the checkbox labeled **"Host Header"**
4. ☑️ **Check the "Host Header" checkbox**
5. A text field will appear below it
6. In that text field, enter:
```
wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

---

## Step 5: Deploy the Rule

1. Scroll to the bottom of the page
2. Click the blue **"Deploy"** button
3. Wait for the success message

---

## Step 6: Verify Proxy is Enabled

1. Click **"DNS"** in the left sidebar
2. Find the `cdn` CNAME record
3. Make sure it shows 🟠 **Proxied** (orange cloud icon)
4. If it shows ⚪ **DNS only** (gray cloud), click to edit and toggle to Proxied

---

## Step 7: Wait and Test

Open your terminal and run:

```bash
# Wait 30 seconds for the rule to propagate
sleep 30

# Test the CDN
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Testing CDN URL: https://cdn.jamara.us/photos/test-file.jpg

Status: 200 OK ✅
x-amz-request-id: ABC123XYZ ✅
Content-Type: image/jpeg ✅

🎉 SUCCESS! CDN is working perfectly!
```

---

## ✅ Success Checklist

- ☐ Origin Rule created (NOT Transform Rule)
- ☐ Rule name: "B2 Origin Override"
- ☐ Expression: `(http.host eq "cdn.jamara.us")`
- ☐ Host Header checkbox is checked ✓
- ☐ Host Header value: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
- ☐ Rule deployed successfully
- ☐ DNS record is Proxied (orange cloud)
- ☐ Test script returns 200 OK
- ☐ Photos display in browser

---

## 🚨 Common Issues

### Issue 1: Can't find "Origin Rules"
**Solution:** Make sure you're in the "Rules" section, not "DNS" or "SSL/TLS"

### Issue 2: "Host Header" checkbox is grayed out
**Solution:** Make sure you've entered the expression first in the "When" section

### Issue 3: Test still returns 404
**Solution:** 
- Wait 60 seconds (rules can take time to propagate)
- Check that DNS record is Proxied (orange cloud)
- Verify the Host Header value is exactly: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

### Issue 4: Don't see "Origin Rules" option
**Solution:** Origin Rules are available on all Cloudflare plans. If you don't see it:
- Refresh the page
- Try a different browser
- Clear browser cache

---

## 🎓 What This Does

**Before (404):**
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: cdn.jamara.us ❌
                           B2: "No bucket with this name"
                           Returns: 404
```

**After (200 OK):**
```
Browser → cdn.jamara.us → Cloudflare → B2
                           Host: wedding-photos-2026-jamara.s3... ✅
                           B2: "Found bucket!"
                           Returns: 200 + file
```

The Origin Rule tells Cloudflare: "When someone requests `cdn.jamara.us`, connect to B2 using the Host header `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` so B2 knows which bucket to serve."

---

## 📞 Need Help?

If you're still having issues after following these steps:

1. Double-check each step above
2. Wait 2-3 minutes for full propagation
3. Try testing in an incognito/private browser window
4. Check the rule is showing as "Active" in Cloudflare Dashboard

---

**Ready?** Start with Step 1 and work through each step carefully!
