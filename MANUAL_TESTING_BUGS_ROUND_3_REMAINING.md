# Manual Testing Bugs - Round 3 Remaining Issues

**Date**: February 3, 2026  
**Session**: Additional issues found during testing

## Issues Found

### 1. Home Page Inline Section Editor Missing ⚠️
**Severity**: Medium  
**Page**: `/admin/home-page`  
**Impact**: Cannot edit sections inline on home page

**Description**: The home page has a "Manage Sections" button that opens a modal, but sections should be editable inline below the button (like content pages).

**Expected**: Inline section editor below "Manage Sections" button  
**Actual**: Only modal-based section editor available

---

### 2. Guest Email Authentication Not Working ❌
**Severity**: Critical  
**Page**: `/auth/guest-login`  
**Impact**: Guests cannot log in

**Description**: Email matching authentication isn't working. Test guest `jaronabaws@gmail.com` exists in database but cannot authenticate.

**Expected**: Guest can enter email and authenticate  
**Actual**: Authentication fails

**Root Cause**: Need to investigate email matching API and guest authentication flow

---

### 3. Missing Auth Method Settings ⚠️
**Severity**: High  
**Page**: Admin settings  
**Impact**: Cannot configure authentication method

**Description**: No admin setting to switch between email matching and magic link authentication methods.

**Expected**: Admin setting to choose authentication method (email matching vs magic link)  
**Actual**: No such setting exists

**Implementation Needed**: Add system setting for guest authentication method

---

### 4. Admin Cannot View Guest Portal ⚠️
**Severity**: Medium  
**Impact**: Admins cannot preview guest experience

**Description**: When logged in as admin, there's no way to view the guest portal to see what guests see.

**Expected**: Admin can view/preview guest portal while logged in  
**Actual**: No guest portal access for admins

**Implementation Needed**: Add "View as Guest" or guest portal preview functionality

---

### 5. Admin Users Page Errors ❌
**Severity**: High  
**Page**: `/admin/admin-users`  
**Impact**: Admin user management broken

**Errors**:
```
/api/auth/session:1 Failed to load resource: 404 (Not Found)
/api/admin/admin-users:1 Failed to load resource: 500 (Internal Server Error)
/icons/icon-144x144.png:1 Failed to load resource: 404 (Not Found)
```

**Root Cause**: 
1. Missing `/api/auth/session` endpoint
2. `/api/admin/admin-users` returning 500 error
3. Missing PWA icon file

---

### 6. Missing PWA Icons ⚠️
**Severity**: Low  
**Impact**: PWA manifest warnings

**Error**: `icon-144x144.png` not found in `/public/icons/`

**Expected**: PWA icons exist  
**Actual**: Icons missing

---

## Priority Order

### Critical (Blocks Core Functionality)
1. **Guest Email Authentication Not Working** - Guests cannot log in
2. **Admin Users Page 500 Error** - Admin management broken

### High Priority
3. **Missing Auth Method Settings** - Cannot configure authentication
4. **Admin Users Page 404 Errors** - Missing API endpoints

### Medium Priority
5. **Home Page Inline Section Editor** - UX improvement
6. **Admin Cannot View Guest Portal** - Preview functionality

### Low Priority
7. **Missing PWA Icons** - Cosmetic warnings

---

## Investigation Needed

### Issue #2: Guest Authentication
- Check `/app/api/auth/guest/email-match/route.ts` implementation
- Verify guest exists in database with correct email
- Check authentication flow in `/app/auth/guest-login/page.tsx`
- Test with browser console open to see full error

### Issue #5: Admin Users API
- Check `/app/api/admin/admin-users/route.ts` for 500 error
- Create missing `/app/api/auth/session` endpoint
- Check server logs for error details

---

## Next Steps

1. **Fix Critical Issues**:
   - Investigate guest authentication failure
   - Fix admin users API 500 error
   - Create missing session API endpoint

2. **Implement Missing Features**:
   - Add auth method system setting
   - Add admin guest portal preview
   - Add inline section editor to home page

3. **Fix Minor Issues**:
   - Add missing PWA icons

---

## Related Files

### Authentication
- `app/api/auth/guest/email-match/route.ts`
- `app/auth/guest-login/page.tsx`
- `services/guestService.ts`

### Admin Users
- `app/api/admin/admin-users/route.ts`
- `app/admin/admin-users/page.tsx`
- `services/adminUserService.ts`

### Home Page
- `app/admin/home-page/page.tsx`
- `components/admin/SectionEditor.tsx`

### Settings
- `services/settingsService.ts`
- `app/admin/settings/page.tsx`
