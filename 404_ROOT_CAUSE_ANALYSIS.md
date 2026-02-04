# 404 Root Cause Analysis - View Buttons

## Problem
All View buttons in admin pages (Activities, Events, Accommodations) are returning 404 errors when clicked.

## Root Cause
**The slug columns don't exist in the database.**

### Evidence
```bash
$ node scripts/check-slugs.mjs
❌ Error fetching events: column events.slug does not exist
❌ Error fetching activities: column activities.slug does not exist
```

### Why This Causes 404s

1. **Admin buttons use slugs**: All View buttons try to open `/activity/{slug}` or `/event/{slug}`
2. **Guest pages require slugs**: The page components check for slugs and call `notFound()` if missing:
   ```typescript
   // app/activity/[slug]/page.tsx
   if (isUUID) {
     const activityResult = await get(slug);
     if (activity.slug) {
       redirect(`/activity/${activity.slug}`);
     }
     notFound(); // ← Returns 404 if no slug exists
   }
   ```

3. **Database has no slug columns**: Migration `038_add_slug_columns_to_events_activities.sql` exists but hasn't been applied

## Why Tests Didn't Catch This

### E2E Tests Should Have Caught This
The following tests exist but apparently didn't run or failed silently:
- `__tests__/e2e/guestViewNavigation.spec.ts` - Tests View button navigation
- `__tests__/e2e/slugBasedRouting.spec.ts` - Tests slug-based routes
- `__tests__/regression/guestViewRoutes.regression.test.ts` - Regression tests for routes

### Possible Reasons
1. **Tests run against test database** - Test DB may have migrations applied, but production/dev DB doesn't
2. **Tests create test data with slugs** - Test factories may generate slugs programmatically
3. **Tests not run recently** - CI/CD may not be running E2E tests
4. **Tests mock the data** - May not actually hit real database

## Solution

### Immediate Fix: Apply Migration

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/038_add_slug_columns_to_events_activities.sql`
3. Paste and execute
4. Verify with: `SELECT id, name, slug FROM events LIMIT 5;`

**Option 2: Using Supabase CLI**
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply pending migrations
supabase db push
```

**Option 3: Manual SQL**
```sql
-- Add slug columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_activities_slug ON activities(slug);

-- Create slug generation function
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    );
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER events_generate_slug
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

CREATE TRIGGER activities_generate_slug
  BEFORE INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION generate_slug_from_name();

-- Generate slugs for existing records
UPDATE events SET slug = NULL WHERE slug IS NULL; -- Trigger will generate
UPDATE activities SET slug = NULL WHERE slug IS NULL; -- Trigger will generate

-- Make columns NOT NULL after migration
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE activities ALTER COLUMN slug SET NOT NULL;
```

### Verify Fix
```bash
node scripts/check-slugs.mjs
```

Expected output:
```
✅ All events have slugs (X/X)
✅ All activities have slugs (X/X)
```

## Additional Issues Found

### 1. Accommodations Route Doesn't Exist
The admin Accommodations page has a View button pointing to `/guest/accommodation/{id}`, but:
- Route exists: `/guest/accommodation/page.tsx`
- **BUT**: It's for logged-in guest's own accommodation, not a detail page by ID
- **Fix needed**: Either create `/accommodation/[id]/page.tsx` or remove View button

### 2. Admin Button Implementations Are Correct
Contrary to initial audit, all admin View buttons already use `window.open(..., '_blank')`:
- ✅ Activities: `window.open(\`/activity/${slug}\`, '_blank')`
- ✅ Events: `window.open(\`/event/${slug}\`, '_blank')`  
- ✅ Content Pages: `window.open(\`/custom/${page.slug}\`, '_blank')`

The issue was never the button implementation - it was always the missing database columns.

## Prevention

### 1. Migration Tracking
- Add migration status check to CI/CD
- Create script to verify all migrations applied
- Document migration application process

### 2. E2E Test Improvements
- Ensure E2E tests run against same DB as development
- Add pre-test migration check
- Fail tests if required columns missing

### 3. Development Setup
- Add migration check to `npm run dev`
- Create setup script that verifies DB schema
- Document required migrations in README

## Files Created
- `scripts/check-slugs.mjs` - Diagnostic script to check slug columns
- `404_ROOT_CAUSE_ANALYSIS.md` - This document

## Related Documentation
- `UNIMPLEMENTED_VIEW_BUTTONS_AUDIT.md` - Initial (incorrect) audit
- `404_BUTTONS_SOLUTION_GUIDE.md` - Previous fix for Activities
- `TASK_31_SLUG_ROUTING_COMPLETE.md` - Slug implementation documentation
- `supabase/migrations/038_add_slug_columns_to_events_activities.sql` - Migration file
