# Cloudflare Rules Checklist

**Status:** SSL/TLS is "Full" ✅, CNAME is correct ✅, but CDN still not reaching B2

**Next Step:** Check for interfering Rules

## 🔍 Rules to Check

Since SSL/TLS and CNAME are correct, a Cloudflare Rule is likely blocking or modifying requests.

### 1. Transform Rules (Check First)

1. Go to **Rules** → **Transform Rules**
2. Click **HTTP Request Header Modification**
3. Look for ANY rules that match `cdn.jamara.us`

**What to look for:**
- Rules that modify `Host` header
- Rules that add/remove `Authorization` header
- Rules that modify any headers for `cdn.jamara.us`

**Action:** Temporarily **disable ALL** Transform Rules, then test

---

### 2. Page Rules

1. Go to **Rules** → **Page Rules**
2. Look for rules matching:
   - `cdn.jamara.us/*`
   - `*.jamara.us/*`
   - `*jamara.us/*`

**What to look for:**
- SSL settings
- Cache Level settings
- Origin Server settings
- Disable Security

**Action:** Temporarily **disable ALL** Page Rules, then test

---

### 3. Configuration Rules

1. Go to **Rules** → **Configuration Rules**
2. Look for rules affecting `cdn.jamara.us`

**What to look for:**
- SSL/TLS settings overrides
- Origin settings
- Cache settings

**Action:** Temporarily **disable ALL** Configuration Rules, then test

---

### 4. Origin Rules

1. Go to **Rules** → **Origin Rules**
2. Look for rules affecting `cdn.jamara.us`

**What to look for:**
- Host Header overrides
- SNI overrides
- Origin selection

**Action:** Temporarily **disable ALL** Origin Rules, then test

---

### 5. Redirect Rules

1. Go to **Rules** → **Redirect Rules**
2. Look for rules affecting `cdn.jamara.us`

**What to look for:**
- Any redirects from `cdn.jamara.us`

**Action:** Temporarily **disable ALL** Redirect Rules, then test

---

## 🧪 Testing Process

After disabling rules:

1. **Purge cache**: Caching → Purge Everything
2. **Wait 30 seconds**
3. **Test**: `node scripts/test-cdn-cache-bust.mjs`

**Expected result if rules were the issue:**
```
Status: 200 OK
x-amz-request-id: [some ID] ✅
```

---

## 🚨 Alternative: Bypass Proxy Test

If disabling all rules doesn't work, try bypassing Cloudflare entirely:

1. Go to **DNS** settings
2. Click on `cdn` CNAME record
3. Toggle to **"DNS only"** (gray cloud ☁️)
4. Save
5. Wait 1 minute
6. Test: `node scripts/test-cdn-final.mjs`

**If this works:**
- ✅ Proves CNAME is correct
- ❌ Proves Cloudflare proxy has an issue
- → Contact Cloudflare support

**If this still fails:**
- ❌ CNAME target is actually wrong
- → Double-check the exact target value

---

## 📊 Diagnostic Summary

| Setting | Status |
|---------|--------|
| Direct B2 | ✅ Works |
| CNAME Target | ✅ Correct (confirmed) |
| SSL/TLS Mode | ✅ Full |
| Cache-bust Test | ❌ Still 404 |
| Rules | ❓ Need to check |

**Conclusion:** A Cloudflare Rule is likely interfering with requests to B2.

---

## ✅ Action Plan

1. ☐ Check Transform Rules → Disable all → Test
2. ☐ Check Page Rules → Disable all → Test
3. ☐ Check Configuration Rules → Disable all → Test
4. ☐ Check Origin Rules → Disable all → Test
5. ☐ Check Redirect Rules → Disable all → Test
6. ☐ If still failing → Try "DNS only" mode
7. ☐ If "DNS only" works → Contact Cloudflare support

---

**Start with Transform Rules - they're the most likely culprit.**
