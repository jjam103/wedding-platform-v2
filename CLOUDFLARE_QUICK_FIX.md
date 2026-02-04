# Quick Fix: Use Origin Rules (NOT Transform Rules)

## ⚡ The Issue

Transform Rules **cannot** modify the `Host` header. You got this error:
```
'set' is not a valid value for operation because it cannot be used on header 'Host'
```

## ✅ The Solution

Use **Origin Rules** instead - they're specifically designed for this.

## 🚀 Quick Steps

1. **Go to Cloudflare Dashboard** → Rules → **Origin Rules**

2. **Click "Create rule"**

3. **Fill in:**
   - **Rule name:** `B2 Host Header Override`
   - **When incoming requests match:** Click "Edit expression"
     ```
     (http.host eq "cdn.jamara.us")
     ```
   - **Then:**
     - **Host Header:** Select "Rewrite to"
     - **Value:** `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

4. **Click "Deploy"**

5. **Wait 30 seconds**

6. **Test:**
   ```bash
   node scripts/test-cdn-final.mjs
   ```

## 🎯 Expected Result

```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg ✅

🎉 SUCCESS!
```

---

**Time:** 3 minutes total
