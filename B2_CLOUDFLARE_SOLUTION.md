# B2 + Cloudflare CDN - SOLUTION FOUND! 🎯

## 🔍 Root Cause

When Cloudflare proxies requests to B2, it sends `Host: cdn.jamara.us` in the request headers. However, B2's SSL certificate for `s3.us-east-005.backblazeb2.com` does **NOT** include `cdn.jamara.us` in its Subject Alternative Names (SANs).

This causes an SSL certificate mismatch error, which results in Cloudflare returning 404.

## ✅ Solution

Change your Cloudflare CNAME to use **B2's virtual-host style endpoint**:

### Current Configuration (WRONG)
```
Type: CNAME
Name: cdn
Target: s3.us-east-005.backblazeb2.com  ❌
Proxy: ON (orange cloud)
```

### Correct Configuration
```
Type: CNAME
Name: cdn
Target: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com  ✅
Proxy: ON (orange cloud)
```

## 📋 Step-by-Step Fix

1. **Log into Cloudflare Dashboard**
2. **Go to DNS settings** for `jamara.us`
3. **Click Edit** on the existing `cdn` CNAME record
4. **Change Target** from:
   - `s3.us-east-005.backblazeb2.com`
   
   To:
   - `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`
5. **Keep Proxy status ON** (orange cloud)
6. **Save** the record
7. **Wait 1-2 minutes** for changes to propagate
8. **Test** with: `node scripts/test-cdn-fix.mjs`
9. **Restart dev server**: `npm run dev`

## 🧪 Why This Works

B2's SSL certificate includes these SANs:
- `*.s3.us-east-005.backblazeb2.com` ✅
- `s3.us-east-005.backblazeb2.com` ✅
- `*.backblazeb2.com` ✅

When you use `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com` as the CNAME target:
1. Cloudflare connects to that hostname
2. The SSL certificate matches (covered by `*.s3.us-east-005.backblazeb2.com`)
3. B2 recognizes the bucket from the hostname
4. Request succeeds! ✅

## 🔬 Technical Details

### What Happens with Path-Style (Current - Broken)
```
Client → Cloudflare → B2
         Host: cdn.jamara.us
         Connect to: s3.us-east-005.backblazeb2.com
         ❌ SSL cert doesn't include cdn.jamara.us
         ❌ Connection fails
```

### What Happens with Virtual-Host Style (Fixed)
```
Client → Cloudflare → B2
         Host: cdn.jamara.us (internal)
         Connect to: wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com
         ✅ SSL cert includes *.s3.us-east-005.backblazeb2.com
         ✅ Connection succeeds
```

## 🎉 Expected Result

After making this change:
- ✅ Photos load through Cloudflare CDN
- ✅ Fast global delivery with edge caching
- ✅ Reduced B2 bandwidth costs
- ✅ Blue "B2" badge shows correct storage
- ✅ Images display in photo gallery

## 🧪 Verification

After updating the CNAME, test with:

```bash
# Test the CDN URL
node scripts/test-cdn-fix.mjs

# Should show:
# Status: 200 OK
# ✅ SUCCESS! CDN is now working correctly!
```

## 📝 Alternative: Use Cloudflare Transform Rules

If you prefer to keep the path-style CNAME, you can use Cloudflare Transform Rules to modify the Host header, but the virtual-host style CNAME is simpler and recommended by Backblaze.

## 🔗 References

- [Backblaze B2 + Cloudflare Guide](https://www.backblaze.com/blog/backblaze-b2-and-cloudflare-cdn/)
- [B2 S3-Compatible API](https://www.backblaze.com/b2/docs/s3_compatible_api.html)
- [Cloudflare CNAME Setup](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)

## ✨ Summary

The issue was **NOT** with our code (which is correct), but with the Cloudflare CNAME configuration. By using B2's virtual-host style endpoint as the CNAME target, Cloudflare can successfully proxy requests to B2 without SSL certificate errors.

**Change your CNAME target to**: `wedding-photos-2026-jamara.s3.us-east-005.backblazeb2.com`

That's it! 🎉
