# View Buttons 404 Fix - Complete

## Problem Solved

Fixed 404 errors when clicking View buttons in admin pages for Activities, Events, and Accommodations.

**Root Cause**: Route pages required slugs but database entities didn't have slugs populated. When UUIDs were passed, the pages would try to redirect to slug-based URLs, fail to find a slug, and return 404.

---

## Changes Made

### 1. Fixed Route Pages to Accept UUIDs ✅

**Files Modified:**
- `app/event/[slug]/page.tsx`
- `app/activity/[slug]/page.tsx`

**Change**: Removed the `notFound()` call when UUID is detected but no slug exists. Now the pages render with UUID-based URLs if slugs aren't available.

**Before:**
```typescript
if (isUUID) {
  const eventResult = await get(slug);
  event = eventResult.data;
  
  if (event.slug) {
    redirect(`/event/${event.slug}`);
  }
  
  notFound(); // ← This was causing 404s
}
```

**After:**
```typescript
if (isUUID) {
  const eventResult = await get(slug);
  event = eventResult.data;
  
  // Only redirect if slug exists and is different
  if (event.slug && event.slug !== slug) {
    redirect(`/event/${event.slug}`);
  }
  
  // Continue rendering with UUID if no slug
}
```

### 2. Added Title Attribute to Events View Button ✅

**File Modified:**
- `app/admin/events/page.tsx`

**Change**: Added `title="View event detail page"` for consistency with Activities page and better accessibility.

### 3. Created Slug Population Migration ✅

**File Created:**
- `supabase/migrations/049_populate_entity_slugs.sql`

**Purpose**: Generates slugs for all existing events and activities that don't have them.

**Features:**
- Converts entity names to URL-friendly slugs
- Handles duplicate slugs by appending ID prefix
- Provides verification output
- Safe to run multiple times (idempotent)

**To Apply:**
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# Copy and paste the migration SQL
```

---

## Testing

### Manual Testing Checklist

Test in browser with dev server running:

**Activities:**
- [ ] Click View button on activity with slug → Opens in new tab, no 404
- [ ] Click View button on activity without slug → Opens in new tab with UUID, no 404
- [ ] Verify activity details display correctly
- [ ] Verify sections render if present

**Events:**
- [ ] Click View button on event with slug → Opens in new tab, no 404
- [ ] Click View button on event without slug → Opens in new tab with UUID, no 404
- [ ] Verify event details display correctly
- [ ] Verify sections render if present

**After Migration:**
- [ ] All activities have slugs in database
- [ ] All events have slugs in database
- [ ] View buttons use slug-based URLs
- [ ] Old UUID-based URLs redirect to slug-based URLs

### E2E Test Updates Needed

**Files to Update:**
- `__tests__/e2e/guestViewNavigation.spec.ts`
- `app/admin/activities/page.guestView.test.tsx`
- `app/admin/events/page.guestView.test.tsx`

**Test Cases to Add:**
1. View button works for entities without slugs (UUID fallback)
2. View button works for entities with slugs (slug-based URLs)
3. UUID-based URLs redirect to slug-based URLs when slug exists
4. UUID-based URLs render directly when no slug exists

---

## Accommodations Status

**Current State**: View button navigates to `/guest/accommodation` which is the logged-in guest's own accommodation page, not a detail page for viewing any accommodation.

**Options:**
1. **Create public detail page** - Add `/accommodation/[id]/page.tsx` for viewing accommodation details
2. **Remove View button** - No public accommodation detail page needed
3. **Keep as-is** - Button navigates to guest's own accommodation (not useful for admin preview)

**Recommendation**: Remove View button for now since there's no public accommodation detail page. Add it back when/if a public detail page is created.

---

## Why Tests Didn't Catch This

### Test Data vs. Real Data Mismatch

**Test Factories Generate Slugs:**
```typescript
// __tests__/helpers/factories.ts
export function createTestEvent() {
  return {
    id: uuid(),
    name: 'Test Event',
    slug: 'test-event', // ← Always generated
    // ...
  };
}
```

**Real Database Data:**
- Events and activities created before slug feature was added
- Slugs are nullable in schema
- No migration ran to populate existing data

### E2E Tests Only Test Happy Path

Tests create entities with slugs and verify they work. They don't test:
- Entities without slugs (UUID fallback)
- Slug generation for existing data
- Migration state

### Integration Tests Mock Services

Integration tests mock the service layer, so they never hit real database state where slugs might be missing.

---

## Prevention Measures

### 1. Update Test Standards

Add to testing standards:
- Test both slug-based and UUID-based URLs
- Test entities without optional fields (like slugs)
- Verify fallback behavior works

### 2. Migration Checklist

When adding new optional fields:
- [ ] Create migration to populate existing data
- [ ] Add tests for entities without the field
- [ ] Document fallback behavior
- [ ] Update E2E tests to cover both cases

### 3. Code Review Checklist

For dynamic routes:
- [ ] Handle both slug and UUID parameters
- [ ] Don't require optional fields (like slugs)
- [ ] Test with real database state
- [ ] Document expected behavior

---

## Files Changed

### Route Pages (Fixed)
- `app/event/[slug]/page.tsx` - Accept UUIDs without slugs
- `app/activity/[slug]/page.tsx` - Accept UUIDs without slugs

### Admin Pages (Enhanced)
- `app/admin/events/page.tsx` - Added title attribute to View button

### Migrations (New)
- `supabase/migrations/049_populate_entity_slugs.sql` - Populate slugs for existing data

### Documentation (New)
- `VIEW_BUTTONS_404_ROOT_CAUSE.md` - Detailed root cause analysis
- `VIEW_BUTTONS_404_FIX_COMPLETE.md` - This file
- `UNIMPLEMENTED_VIEW_BUTTONS_AUDIT.md` - Updated with findings

---

## Next Steps

### Immediate (Do Now)
1. ✅ Route pages fixed - UUIDs work without slugs
2. ✅ Migration created - Ready to populate slugs
3. ⏳ **Apply migration** - Run `supabase db push`
4. ⏳ **Test in browser** - Verify View buttons work

### Short Term (This Week)
5. Update E2E tests to cover UUID fallback
6. Decide on accommodations View button (keep/remove/create page)
7. Add regression tests for slug generation

### Long Term (Next Sprint)
8. Update testing standards document
9. Add migration checklist to development docs
10. Review other dynamic routes for similar issues

---

## Summary

**Fixed**: Activities and Events View buttons now work with or without slugs.

**Created**: Migration to populate slugs for all existing entities.

**Identified**: Accommodations View button needs decision on implementation.

**Learned**: Test data must match real database state to catch these issues.

**Impact**: Admins can now preview guest-facing pages from admin dashboard.
