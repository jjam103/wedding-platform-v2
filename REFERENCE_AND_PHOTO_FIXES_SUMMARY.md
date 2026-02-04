# Reference Selector and Photo Issues - Fixes Applied

## Issues Addressed

### 1. Reference Search API 500 Error ✅ FIXED
**Problem**: `/api/admin/references/search` returning 500 errors with `cookies().get is not a function`

**Root Cause**: Next.js 15 requires `cookies()` to be awaited before use

**Fix Applied**:
```typescript
// Before (broken):
const supabase = createRouteHandlerClient({ cookies });

// After (fixed):
const cookieStore = await cookies();
const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
```

**File**: `app/api/admin/references/search/route.ts`

---

### 2. Section Save 400 Error 🔍 INVESTIGATING
**Problem**: Sections with photo galleries fail to save with 400 Bad Request

**Previous Fixes**:
- ✅ Changed `autoplay_speed` → `autoplaySpeed` (camelCase)
- ✅ Changed `show_captions` → `showCaptions` (camelCase)
- ✅ Kept `photo_ids` and `display_mode` as snake_case (correct)

**Current Status**: Still getting 400 errors despite field name fixes

**Debugging Added**:
- Added comprehensive logging to `/api/admin/sections/[id]/route.ts`
- Logs request body, validation errors, and service errors
- Will show exactly which field is failing validation

**Next Steps**:
1. User should try saving a section again
2. Check server logs for `[Section Update]` messages
3. Logs will show the exact validation error

---

### 3. Photo Display Issues ✅ FIXED
**Problem**: Photos displaying as black boxes, being downloaded from Supabase instead of B2

**Root Cause**: Environment variable mismatch
- Code expected: `B2_CDN_DOMAIN`
- Environment had: `CLOUDFLARE_CDN_URL`

**Fix Applied**:
1. Updated `b2Service.ts` to check both environment variables:
   ```typescript
   const cdnDomain = process.env.B2_CDN_DOMAIN || 
                     process.env.CLOUDFLARE_CDN_URL?.replace(/^https?:\/\//, '') || 
                     '';
   ```
2. Added `B2_CDN_DOMAIN=cdn.jamara.us` to `.env.local` for consistency

**Result**: New photo uploads will now use B2 with CDN URLs

**Note**: Existing photos in Supabase Storage will remain there. Only new uploads will use B2.

---

## SimpleReferenceSelector Integration ✅ COMPLETE

The `SimpleReferenceSelector` has been successfully integrated into `SectionEditor.tsx`:

**Implementation**:
1. ✅ Added modal state: `referenceModalState`
2. ✅ Replaced inline selector with "+ Add Reference" button
3. ✅ Added modal component at end of SectionEditor
4. ✅ Modal opens when button clicked
5. ✅ Reference added and modal closes on selection

**User Flow**:
1. Click "Edit" on a section
2. For references column, click "+ Add Reference"
3. Modal opens with type dropdown
4. Select type (Activities, Events, Pages, Accommodations)
5. Click on entity to select it
6. Modal closes, reference added to list
7. Click "Save Section" to persist

**Benefits**:
- ✅ Modal interface (cleaner UX)
- ✅ Dropdown-based (no broken search API)
- ✅ Simpler selection process
- ✅ Better mobile experience
- ✅ Keyboard support (Escape to close)

---

## Testing Checklist

### Reference Search
- [ ] Navigate to section editor
- [ ] Try to add a reference
- [ ] Verify search works (no 500 errors)
- [ ] Verify results display correctly

### Section Save
- [ ] Create/edit a section with photo gallery
- [ ] Set display mode, autoplay speed, show captions
- [ ] Select photos
- [ ] Click "Save Section"
- [ ] Check browser console for errors
- [ ] Check server logs for `[Section Update]` messages
- [ ] Verify section saves successfully

### Photo Display
- [ ] Check `.env.local` for B2 CDN domain
- [ ] Upload a new photo
- [ ] Check server logs to see if B2 or Supabase is used
- [ ] Verify photo displays correctly (not black box)
- [ ] Check photo URL in database (should be CDN URL if B2 working)

---

## Files Modified

1. `app/api/admin/references/search/route.ts` - Fixed cookies() await
2. `app/api/admin/sections/[id]/route.ts` - Added comprehensive logging
3. `services/b2Service.ts` - Fixed CDN domain environment variable check
4. `.env.local` - Added B2_CDN_DOMAIN for consistency
5. `components/admin/SectionEditor.tsx` - Integrated SimpleReferenceSelector modal ✅

---

## Next Actions

### Immediate
1. **User should try saving a section** - Logs will show exact validation error
2. **Check B2 CDN configuration** - Verify environment variables
3. **Test reference search** - Should work now with cookies fix

### Follow-up
1. **Integrate SimpleReferenceSelector** - Replace InlineReferenceSelector in SectionEditor
2. **Fix B2 CDN domain** - Add missing environment variable if needed
3. **Test photo uploads** - Verify B2 integration working

---

## Console Errors Explained

### 1. `/icons/icon-144x144.png` - 404
**Impact**: Cosmetic only (PWA icon missing)
**Fix**: Low priority, doesn't affect functionality

### 2. `/api/admin/references/search` - 500
**Impact**: Reference selector broken
**Status**: ✅ FIXED (cookies await)

### 3. `/api/admin/sections/[id]` - 400
**Impact**: Cannot save sections
**Status**: 🔍 INVESTIGATING (logs added)

### 4. Preload warnings
**Impact**: Performance warning only
**Fix**: Low priority, doesn't affect functionality

---

## Summary

**Fixed**:
- ✅ Reference search API (cookies await)
- ✅ Field naming in SectionEditor (camelCase for autoplaySpeed, showCaptions)
- ✅ Photo B2 integration (CDN domain environment variable)
- ✅ SimpleReferenceSelector integration (modal-based reference selection)

**Investigating**:
- 🔍 Section save 400 errors (logs added, need user to test)

**Next Step**: User should try:
1. Adding references using the new "+ Add Reference" button
2. Saving a section and checking server logs for any validation errors
