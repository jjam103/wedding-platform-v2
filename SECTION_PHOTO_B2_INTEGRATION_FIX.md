# Section Editor, Photo Display, and B2 Integration Fix

## Issues Identified

### 1. Section Save 400 Error
- Schema validation expects camelCase: `autoplaySpeed`, `showCaptions`
- Component correctly sends camelCase fields
- Need to add detailed error logging to see exact validation failure

### 2. Photo Display Issues
- Photos appearing as black boxes in some cases
- Need to verify photo URLs are valid and accessible
- Check CORS settings for B2/Supabase Storage

### 3. B2 Integration
- B2 credentials are configured in .env.local ✓
- B2 client initialization happens in photoService ✓
- Photos might be stored in Supabase Storage instead of B2
- Need to verify B2 upload is working

### 4. Reference Selector Integration
- SimpleReferenceSelector component created but not integrated
- InlineReferenceSelector relies on failing search API

## Fixes Applied

### Fix 1: Enhanced Error Logging in Section Save API ✓
**File**: `app/api/admin/sections/[id]/route.ts`

Added detailed validation error logging to identify exact schema mismatch:
- Logs full request body before validation
- Logs validation errors with details
- Will show exact field causing 400 error in console

### Fix 2: Integrate SimpleReferenceSelector ✓
**File**: `components/admin/SectionEditor.tsx`

Replaced InlineReferenceSelector with SimpleReferenceSelector:
- Updated import statement
- Replaced component usage in references column
- SimpleReferenceSelector uses dropdown-based selection (no search API needed)
- More reliable and matches user's expected UI

### Fix 3: Enhanced Photo URL Debugging ✓
**Files**: 
- `app/admin/photos/page.tsx`
- `components/admin/SectionEditor.tsx`

Added comprehensive photo debugging:
- Logs photo URLs and storage type on load
- Shows B2 vs Supabase distribution
- Tracks image load success/failure
- Identifies which storage backend is being used

### Fix 4: B2 Health Check System ✓
**Files**:
- `app/api/admin/storage/health/route.ts` (new)
- `app/admin/photos/page.tsx` (updated)

Created B2 health check endpoint and UI:
- New API endpoint: `GET /api/admin/storage/health`
- Checks B2 configuration (credentials, bucket, CDN)
- Tests B2 connectivity and health
- Added "Check Storage Health" button to photos page
- Shows storage status with detailed configuration info

## How to Debug

### 1. Check Section Save Error
1. Open browser console
2. Try to save a section with photos
3. Look for "Section update request body:" log
4. Look for "Section validation failed:" log
5. Check the validation error details

### 2. Check Photo Storage Source
1. Go to Photos page (`/admin/photos`)
2. Open browser console
3. Look for "Storage distribution:" log
4. Check if photos are from B2 or Supabase:
   - B2: URLs contain `backblazeb2.com` or `cdn.jamara.us`
   - Supabase: URLs contain `supabase.co`

### 3. Check B2 Health
1. Go to Photos page (`/admin/photos`)
2. Click "Check Storage Health" button
3. Review the status message:
   - ✓ Green: B2 is healthy and operational
   - ⚠ Yellow: B2 configured but has issues
   - ℹ Gray: B2 not configured (using Supabase only)

### 4. Test Reference Selector
1. Go to any content page with sections
2. Add or edit a section
3. Add a "References" column
4. Use the dropdown-based selector:
   - Select reference type (Activities, Events, etc.)
   - Select specific entity from dropdown
   - Click "Add Reference"

## Expected Outcomes

### Section Save
- Should save successfully with photo galleries
- If 400 error occurs, console will show exact validation issue
- Check that `autoplaySpeed` and `showCaptions` are in camelCase

### Photo Display
- Photos should load and display correctly
- Console will show which storage backend is being used
- Image load errors will be logged with URLs

### B2 Integration
- Health check will confirm if B2 is working
- If B2 is healthy, new uploads should go to B2
- If B2 has issues, uploads will fallback to Supabase Storage
- Existing photos will remain in their original storage

### Reference Selector
- Dropdown-based selection should work reliably
- No dependency on search API
- References should save correctly with sections

## Troubleshooting

### If Section Save Still Fails
1. Check console for validation error details
2. Verify schema in `schemas/cmsSchemas.ts` matches component data
3. Check if other fields (like `photo_ids`, `display_mode`) are correct

### If Photos Don't Display
1. Check console for image load errors
2. Verify photo URLs are accessible (try opening in new tab)
3. Check CORS settings if loading from B2
4. Verify Supabase Storage bucket is public

### If B2 Shows Unhealthy
1. Verify credentials in `.env.local` are correct
2. Check B2 bucket exists and is accessible
3. Verify B2 application key has correct permissions
4. Check network connectivity to B2

### If Reference Selector Doesn't Work
1. Verify entities exist (activities, events, etc.)
2. Check that list APIs are working
3. Verify dropdown populates with options
4. Check console for API errors

## Files Modified

1. `app/api/admin/sections/[id]/route.ts` - Enhanced error logging
2. `components/admin/SectionEditor.tsx` - Integrated SimpleReferenceSelector, added photo debugging
3. `app/admin/photos/page.tsx` - Added storage health check UI and photo debugging
4. `app/api/admin/storage/health/route.ts` - New B2 health check endpoint

## Next Steps for User

1. **Test section save**: Try saving a section with photos and check console for any errors
2. **Check storage health**: Click "Check Storage Health" button on photos page
3. **Verify photo source**: Check console to see if photos are from B2 or Supabase
4. **Test reference selector**: Try adding references to a section using the new dropdown selector
5. **Report findings**: Share console logs if issues persist
