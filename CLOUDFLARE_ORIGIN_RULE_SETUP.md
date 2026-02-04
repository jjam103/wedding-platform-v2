# Cloudflare Origin Rule Setup - Quick Guide

**Purpose:** Rewrite Host header so B2 recognizes the bucket  
**Time:** 2 minutes

## 🎯 The Problem (Now Understood)

Your CNAME works perfectly, but Cloudflare is sending the wrong Host header:

```
❌ Current: Host: cdn.jamara.us (B2 doesn't recognize this)
✅ Needed:  Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

## 🔧 The Solution: Origin Rule

### Step 1: Access Origin Rules

1. Go to: https://dash.cloudflare.com
2. Select domain: `jamara.us`
3. Click **"Rules"** in left sidebar
4. Click **"Origin Rules"**
5. Click **"Create rule"** button

### Step 2: Configure the Rule

**Rule name:**
```
B2 Host Header Rewrite
```

**When incoming requests match:**
```
Field:    Hostname
Operator: equals
Value:    cdn.jamara.us
```

**Then (Rewrite to):**

Under "Host Header" section:
```
Action: Rewrite to
Value:  wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

### Step 3: Deploy

1. Click **"Deploy"** button
2. Wait 30 seconds for rule to propagate

### Step 4: Re-enable Proxy

Since you're in DNS-only mode, switch back to proxied:

1. Go to **DNS** settings
2. Find `cdn` CNAME record
3. Click to edit
4. Toggle to 🟠 **Proxied** (orange cloud)
5. Save

### Step 5: Test

Wait 1 minute, then run:

```bash
node scripts/test-cdn-final.mjs
```

**Expected output:**
```
Status: 200 OK ✅
x-amz-request-id: [some ID] ✅
Content-Type: image/jpeg

🎉 SUCCESS!
```

## 📸 Visual Reference

### Origin Rule Configuration:

```
┌─────────────────────────────────────────────────────────┐
│ Create Origin Rule                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Rule name: B2 Host Header Rewrite                      │
│                                                         │
│ When incoming requests match...                        │
│   ┌─────────────────────────────────────────────────┐ │
│   │ Field:    [Hostname ▼]                          │ │
│   │ Operator: [equals ▼]                            │ │
│   │ Value:    cdn.jamara.us                         │ │
│   └─────────────────────────────────────────────────┘ │
│                                                         │
│ Then...                                                │
│   ┌─────────────────────────────────────────────────┐ │
│   │ Host Header                                      │ │
│   │   [Rewrite to ▼]                                │ │
│   │   wedding-photos-2026-jamara.s3.us-east-005...  │ │
│   └─────────────────────────────────────────────────┘ │
│                                                         │
│                              [Deploy] [Cancel]          │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Why This Works

**Before (404 errors):**
```
Browser → Cloudflare Proxy → B2
          Host: cdn.jamara.us
                              ↓
                         B2: "Unknown bucket"
                         Returns: 404
```

**After (works perfectly):**
```
Browser → Cloudflare Proxy → B2
          Host: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
                              ↓
                         B2: "Found bucket!"
                         Returns: File ✅
```

## ⚠️ Important Notes

1. **Keep CNAME as-is** - Don't change the CNAME target
2. **Keep SSL/TLS as "Full"** - Don't change this
3. **Keep proxy enabled** - Orange cloud after creating rule
4. **This is the standard B2 + Cloudflare setup** - Many users need this

## 🆘 If Origin Rules Not Available

Some Cloudflare plans don't have Origin Rules. Use Transform Rule instead:

1. **Rules** → **Transform Rules** → **Modify Request Header**
2. **Create rule**
3. **When:** `Hostname equals cdn.jamara.us`
4. **Then:**
   - Action: `Set static`
   - Header name: `Host`
   - Value: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
5. **Deploy**

## ✅ Success Checklist

After creating the rule and testing:

- [ ] Origin Rule created and deployed
- [ ] DNS back to Proxied mode (orange cloud)
- [ ] Test script returns 200 OK
- [ ] Test script shows `x-amz-request-id` header
- [ ] Upload a new photo in admin panel
- [ ] Photo displays with blue "B2" badge
- [ ] No console errors in browser

## 📚 Reference

- Cloudflare Origin Rules: https://developers.cloudflare.com/rules/origin-rules/
- B2 + Cloudflare Guide: https://www.backblaze.com/docs/cloud-storage-deliver-public-backblaze-b2-content-through-cloudflare-cdn

---

**Ready?** Follow Step 1 above to create the Origin Rule.
