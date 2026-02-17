# E2E Test #10 - Quick Start Guide

## 🎯 What Was Fixed

Cookie authentication for guest users in E2E Test #10. Cookies now use base64-encoded format with `base64-` prefix.

## ⚡ Quick Test

```bash
# 1. Test API with diagnostic script
node --env-file=.env.test.e2e scripts/test-reference-api.mjs

# 2. Run E2E test
npx playwright test __tests__/e2e/admin/referenceBlocks.spec.ts -g "should display reference blocks in guest view"
```

## ✅ Expected Results

**Diagnostic Script**:
```
✅ API endpoint working correctly with cookies!
   Event name: API Test Event
```

**E2E Test**:
```
✓ should display reference blocks in guest view with preview modals (15s)
```

## 🔧 The Fix

Changed cookie format from plain JSON to base64-encoded:

```typescript
// BEFORE (wrong):
value: JSON.stringify({ access_token, ... })

// AFTER (correct):
const base64Value = Buffer.from(JSON.stringify(cookieValue)).toString('base64');
value: `base64-${base64Value}`
```

## 📁 Files Changed

- ✅ `__tests__/e2e/admin/referenceBlocks.spec.ts` - Updated cookie format
- ✅ `scripts/test-reference-api.mjs` - Updated to test with cookies
- ✅ `supabase/migrations/057_allow_anon_access_to_locations.sql` - DELETED

## 🚨 If Tests Fail

1. **Diagnostic script fails**: Check dev server is running on port 3000
2. **E2E test fails**: Run diagnostic script first to isolate issue
3. **401 Unauthorized**: Cookie format is incorrect

## 📚 Documentation

- Full details: `E2E_FEB15_2026_TEST10_READY_FOR_TESTING.md`
- Root cause: `E2E_FEB14_2026_TEST10_ROOT_CAUSE_CONFIRMED.md`
- Fix details: `E2E_FEB14_2026_TEST10_COOKIE_FORMAT_FIX.md`

---

**Status**: ✅ Ready for testing
**Confidence**: High
**Next**: Run diagnostic script, then E2E test
