# Manual Testing Round 3 - Fixes In Progress

**Date**: February 3, 2026

## Fixes Completed

### 1. Created Missing API Endpoints ✅

**Issue**: Admin users page was getting 404 errors for missing endpoints

**Files Created**:
- `app/api/auth/session/route.ts` - Returns current user session
- `app/api/admin/admin-users/current/route.ts` - Returns current admin user's role

**Implementation**:
- Both endpoints use Next.js 15 compatible `@supabase/ssr` pattern
- Proper authentication checks
- Consistent error handling

### 2. Fixed Admin Users API Cookie Error ✅

**Issue**: `/api/admin/admin-users` was using deprecated cookie pattern causing 500 errors

**File Fixed**: `app/api/admin/admin-users/route.ts`

**Changes**:
- Updated from `createRouteHandlerClient` to `createServerClient`
- Added proper cookie handling with `await cookies()`
- Applied to both GET and POST methods

---

## Issues Requiring Investigation

### 3. Guest Email Authentication Not Working ⚠️

**Status**: Needs database check

**Possible Causes**:
1. Guest record doesn't have `auth_method` set to `'email_matching'`
2. Email case mismatch (route lowercases email)
3. Guest record doesn't exist

**Investigation Steps**:
```sql
-- Check if guest exists and auth_method
SELECT id, email, auth_method, first_name, last_name 
FROM guests 
WHERE email = 'jaronabaws@gmail.com';

-- If auth_method is NULL, update it
UPDATE guests 
SET auth_method = 'email_matching' 
WHERE email = 'jaronabaws@gmail.com';
```

**API Route**: `app/api/auth/guest/email-match/route.ts` (already correct)

---

### 4. Home Page API 500 Errors ⚠️

**Status**: Needs investigation

**Error**: PUT `/api/admin/home-page` returning 500

**Possible Causes**:
1. Settings don't exist in database
2. `createSetting` function failing
3. Database permission issue

**Investigation**: Check server logs for detailed error

---

## Features To Implement

### 5. Home Page Inline Section Editor 💡

**Status**: Not started

**Implementation**:
1. Add `InlineSectionEditor` component to home page below "Manage Sections" button
2. Similar to content pages implementation
3. Use `pageType="home"` and `pageId="home"`

**Files to Modify**:
- `app/admin/home-page/page.tsx`

**Reference**: `app/admin/content-pages/page.tsx` (already has inline editor)

---

### 6. Auth Method System Setting 💡

**Status**: Not started

**Implementation**:
1. Add system setting `guest_auth_method` with values: `email_matching` | `magic_link`
2. Add UI in admin settings page to toggle between methods
3. Update guest login page to use selected method

**Files to Create/Modify**:
- Add setting to `system_settings` table
- Update `app/admin/settings/page.tsx` to show auth method toggle
- Update `app/auth/guest-login/page.tsx` to check setting

---

### 7. Admin Guest Portal Preview 💡

**Status**: Not started

**Implementation Options**:

**Option A**: Add "View as Guest" button in admin nav
- Opens guest portal in new tab
- Uses admin session but shows guest view

**Option B**: Add guest portal link in admin sidebar
- Direct link to guest home page
- Admin can navigate guest portal while logged in

**Recommended**: Option B (simpler)

**Files to Modify**:
- `components/admin/Sidebar.tsx` - Add guest portal link
- Middleware - Allow admin access to guest routes

---

### 8. PWA Icons 💡

**Status**: Not started

**Implementation**:
1. Generate PWA icons in various sizes
2. Add to `public/icons/` directory
3. Update manifest.json

**Required Sizes**:
- 144x144 (currently missing)
- 192x192
- 512x512

---

## Testing Checklist

### After Fixes
- [ ] Admin users page loads without errors
- [ ] Can create/edit admin users
- [ ] Guest can log in with email matching
- [ ] Home page editor saves without errors
- [ ] No console errors on admin pages

### After Feature Implementation
- [ ] Home page has inline section editor
- [ ] Can toggle auth method in settings
- [ ] Admin can view guest portal
- [ ] PWA icons load correctly

---

## Priority Order

### Immediate (Critical)
1. ✅ Fix admin users API cookie error
2. ✅ Create missing session endpoints
3. ⚠️ Investigate guest authentication issue
4. ⚠️ Fix home page API 500 errors

### High Priority
5. 💡 Add home page inline section editor
6. 💡 Add auth method system setting

### Medium Priority
7. 💡 Add admin guest portal preview

### Low Priority
8. 💡 Add PWA icons

---

## Next Steps

1. **Test admin users page** - Verify it loads without errors now
2. **Check guest database** - Verify auth_method is set correctly
3. **Test guest login** - Try logging in with test email
4. **Check home page API logs** - Find root cause of 500 errors
5. **Implement inline section editor** - Add to home page
6. **Add auth method setting** - System-wide configuration

---

## Related Documentation

- `MANUAL_TESTING_BUGS_ROUND_3.md` - Original bug report
- `MANUAL_TESTING_BUGS_ROUND_3_FIXES.md` - First round of fixes (RSVP cookie error)
- `MANUAL_TESTING_BUGS_ROUND_3_FIXES_COMPLETE.md` - Build error fixes
- `MANUAL_TESTING_BUGS_ROUND_3_REMAINING.md` - Detailed issue analysis
