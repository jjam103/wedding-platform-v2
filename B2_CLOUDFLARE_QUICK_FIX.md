# 🚀 Quick Fix: Cloudflare CNAME

## The Issue
Your CNAME target is **missing the bucket name prefix**.

## The Fix (2 minutes)

### 1. Go to Cloudflare DNS
https://dash.cloudflare.com → **jamara.us** → **DNS**

### 2. Edit the `cdn` CNAME Record

**Change FROM:**
```
jamara.s3.us-east-005.backblazeb2.com
```

**Change TO:**
```
wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
```

Keep proxy ON (orange cloud ☁️)

### 3. Purge Cache
**Caching** → **Configuration** → **Purge Everything**

### 4. Wait 2-3 Minutes
DNS propagation time

### 5. Test
```bash
node scripts/test-cdn-final.mjs
```

Should see: ✅ HTTP 200 with `x-amz-request-id` header

### 6. Restart & Test
```bash
npm run dev
```

Upload a photo and verify it displays.

---

## What's Wrong?

The bucket name (`wedding-photos-2026-`) is missing from your CNAME target.

**Current (WRONG):**
```
cdn.jamara.us → jamara.s3.us-east-005.backblazeb2.com
                ^^^^^^ missing bucket name!
```

**Correct:**
```
cdn.jamara.us → wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
                ^^^^^^^^^^^^^^^^^^^^^^ bucket name included!
```

Without the bucket name, Cloudflare doesn't know which B2 bucket to fetch from, so it returns 404.

---

## Detailed Instructions
See: `CLOUDFLARE_FIX_INSTRUCTIONS.md`

## Current Status
See: `B2_CLOUDFLARE_CDN_FINAL_STATUS.md`
