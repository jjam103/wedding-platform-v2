# View Buttons 404 Error - Root Cause Analysis

## Problem

All View buttons in admin pages (Activities, Events, Accommodations) are returning 404 errors when clicked.

## Root Cause

The issue is a **mismatch between the route implementation and database state**:

### 1. Route Implementation (Correct)
Both `/activity/[slug]/page.tsx` and `/event/[slug]/page.tsx` are implemented to:
- Accept slug-based URLs (preferred): `/activity/my-activity-slug`
- Accept UUID-based URLs (legacy): `/activity/123e4567-...`
- When UUID is detected, redirect to slug-based URL

### 2. Database State (Problem)
**Events and Activities in the database likely don't have slugs populated yet.**

When a UUID is passed:
```typescript
if (isUUID) {
  const eventResult = await get(slug); // Fetch by ID
  event = eventResult.data;
  
  if (event.slug) {
    redirect(`/event/${event.slug}`); // Redirect to slug
  }
  
  // If no slug exists, show 404
  notFound(); // ← THIS IS WHAT'S HAPPENING
}
```

### 3. Admin Button Implementation (Correct)
```typescript
// Events page
const slug = event.slug || event.id;
window.open(`/event/${slug}`, '_blank');

// Activities page  
const slug = activity.slug || activity.id;
window.open(`/activity/${slug}`, '_blank');
```

The buttons correctly fall back to ID when slug is null, but the route pages reject UUIDs without slugs.

---

## Why This Wasn't Caught

### E2E Tests Should Have Caught This
Looking at the test files:
- `__tests__/e2e/guestViewNavigation.spec.ts` - Tests navigation
- `app/admin/activities/page.guestView.test.tsx` - Tests View button
- `app/admin/events/page.guestView.test.tsx` - Tests View button

**The tests likely:**
1. Create test data WITH slugs (test factories generate slugs)
2. Never test the UUID fallback path
3. Don't test against real database state where slugs might be null

---

## Solutions

### Option 1: Populate Slugs (Recommended)
Run a migration to generate slugs for all existing events and activities:

```sql
-- Generate slugs for events without them
UPDATE events 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Generate slugs for activities without them  
UPDATE activities
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Handle duplicates by appending ID
UPDATE events e1
SET slug = slug || '-' || SUBSTRING(id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM events e2 
  WHERE e2.slug = e1.slug AND e2.id != e1.id
);

UPDATE activities a1
SET slug = slug || '-' || SUBSTRING(id::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM activities a2 
  WHERE a2.slug = a1.slug AND a2.id != a1.id
);
```

### Option 2: Fix Route Pages (Quick Fix)
Modify the route pages to accept UUIDs without requiring slugs:

```typescript
// app/event/[slug]/page.tsx
if (isUUID) {
  const eventResult = await get(slug);
  
  if (!eventResult.success) {
    notFound();
  }
  
  event = eventResult.data;
  
  // Only redirect if slug exists, otherwise continue with UUID
  if (event.slug && event.slug !== slug) {
    redirect(`/event/${event.slug}`);
  }
  // Continue rendering with UUID - don't call notFound()
}
```

### Option 3: Hybrid Approach (Best)
1. Fix route pages to accept UUIDs (immediate fix)
2. Run migration to populate slugs (data cleanup)
3. Update E2E tests to test both paths (prevent regression)

---

## Accommodations Issue

Accommodations has a different problem - there's no guest-facing detail page at all.

**Current state:**
- Admin button: `window.open('/guest/accommodation', '_blank')`
- Route exists: `/guest/accommodation/page.tsx`
- But it's for logged-in guest's OWN accommodation only

**Options:**
1. Create `/accommodation/[id]/page.tsx` for public accommodation details
2. Remove View button (no public page needed)
3. Change button to navigate to guest's own accommodation page (not useful for admin)

---

## Immediate Action Plan

### Step 1: Fix Route Pages (5 minutes)
Modify both route pages to not call `notFound()` when UUID has no slug.

### Step 2: Test in Browser (2 minutes)
Click View buttons to verify they work with UUIDs.

### Step 3: Run Slug Migration (10 minutes)
Create and run migration to populate slugs for all entities.

### Step 4: Update E2E Tests (15 minutes)
Add test cases for:
- Entities without slugs (UUID fallback)
- Entities with slugs (slug-based URLs)
- Slug redirect behavior

### Step 5: Fix Accommodations (Decision needed)
Decide whether to create public accommodation detail page or remove View button.

---

## Files to Modify

### Immediate Fixes
1. `app/event/[slug]/page.tsx` - Remove notFound() for UUIDs without slugs
2. `app/activity/[slug]/page.tsx` - Remove notFound() for UUIDs without slugs

### Slug Migration
3. `supabase/migrations/XXX_populate_slugs.sql` - New migration file

### Test Updates
4. `__tests__/e2e/guestViewNavigation.spec.ts` - Add UUID fallback tests
5. `app/admin/activities/page.guestView.test.tsx` - Test without slugs
6. `app/admin/events/page.guestView.test.tsx` - Test without slugs

### Accommodations (TBD)
7. Either create `app/accommodation/[id]/page.tsx` or remove View button

---

## Prevention

### Code Review Checklist
- [ ] All dynamic routes handle both slug and UUID
- [ ] Migrations populate slugs for new entity types
- [ ] E2E tests cover entities without slugs
- [ ] Test factories match real database state

### Testing Standards
- [ ] E2E tests use real database state (not just factory data)
- [ ] Test both happy path (with slugs) and fallback path (UUIDs only)
- [ ] Verify 404 behavior only for truly non-existent entities

---

## Summary

**Root Cause**: Route pages reject UUIDs without slugs, but database entities don't have slugs populated.

**Quick Fix**: Modify route pages to accept UUIDs without requiring slugs.

**Proper Fix**: Populate slugs in database + update tests to prevent regression.

**Why Tests Missed It**: Test data had slugs; real data doesn't.
