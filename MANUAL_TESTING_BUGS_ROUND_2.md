# Manual Testing Bugs - Round 2

## Issues Found

### 1. Settings Page Cookie Error
**Error**: `nextCookies.get is not a function`
**Location**: `app/admin/settings/page.tsx`
**Cause**: Using deprecated `createServerComponentClient({ cookies })` pattern from Next.js 13
**Impact**: Settings page completely broken

### 2. Room Types - Create Button Not Working
**Location**: `app/admin/accommodations/[id]/room-types/page.tsx`
**Cause**: Client component trying to use async params without proper unwrapping
**Impact**: Cannot create new room types

### 3. Guest Groups Not Showing in Add Guest Form
**Location**: `app/admin/guests/page.tsx`
**Cause**: Groups dropdown not populated correctly
**Impact**: Cannot assign guests to groups when creating

### 4. Vendors Page - Need to Add Vendor Button
**Location**: `app/admin/vendors/page.tsx`
**Cause**: Missing "Add Vendor" button in header
**Impact**: Cannot create new vendors

### 5. Content Pages RLS Policy Error
**Error**: `new row violates row-level security policy for table "content_pages"`
**Location**: `supabase/migrations/019_create_content_pages_table.sql`
**Cause**: RLS policy checks `users` table for role, but should check `profiles` table
**Impact**: Cannot create content pages

## Root Causes

### Next.js 15 Compatibility
- `createServerComponentClient({ cookies })` is deprecated
- Must use `createServerClient` from `@supabase/ssr` with async cookies
- All server components need to await `cookies()` call

### RLS Policy Issues
- Content pages policy references wrong table (`users` instead of `profiles`)
- Need to verify user roles exist in correct table

### Missing UI Elements
- Vendors page missing primary action button
- Room types page has async params issue

## Fixes Required

1. **Update all server components to use new auth pattern**
2. **Fix content_pages RLS policy to use profiles table**
3. **Add "Add Vendor" button to vendors page**
4. **Fix room types async params handling**
5. **Verify guest groups dropdown population**

## Testing Checklist

After fixes:
- [ ] Settings page loads without errors
- [ ] Can create room types
- [ ] Guest groups appear in add guest form
- [ ] Can create vendors
- [ ] Can create content pages
- [ ] All admin pages load without cookie errors
    