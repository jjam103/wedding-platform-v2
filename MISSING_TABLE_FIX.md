# Missing content_pages Table - Fix Guide

## Current Issue

The `content_pages` table doesn't exist in your Supabase database, causing this error:
```
Could not find the table 'public.content_pages' in the schema cache
```

## Why This Happened

The migration file exists (`supabase/migrations/019_create_content_pages_table.sql`) but hasn't been applied to your database yet. This could happen if:
1. Migrations weren't run after pulling the code
2. Database was reset without re-running migrations
3. Working with a new Supabase project

## Quick Fix (Choose One Method)

### Method 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Paste and Run Migration**:
   - Copy the contents of `supabase/migrations/019_create_content_pages_table.sql`
   - Paste into the SQL editor
   - Click "Run" or press Cmd+Enter

4. **Verify**:
   ```bash
   node scripts/check-database-tables.mjs
   ```
   Should show: ✅ content_pages

### Method 2: Supabase CLI (If Installed)

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Verify
node scripts/check-database-tables.mjs
```

### Method 3: Manual SQL Execution

If you have direct database access:

```sql
-- Run this SQL
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_status ON content_pages(status);

ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosts_manage_content_pages"
ON content_pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'host')
  )
);

CREATE POLICY "guests_view_published_content_pages"
ON content_pages FOR SELECT
USING (status = 'published');

CREATE OR REPLACE FUNCTION update_content_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_pages_updated_at
BEFORE UPDATE ON content_pages
FOR EACH ROW
EXECUTE FUNCTION update_content_pages_updated_at();
```

## Verification

After applying the migration, verify it worked:

```bash
# Check all tables
node scripts/check-database-tables.mjs

# Should show:
# ✅ content_pages
```

Then refresh your browser and try accessing Content Pages again.

## What the Migration Creates

### Table Structure
- `id` - UUID primary key
- `slug` - Unique URL-friendly identifier
- `title` - Page title
- `status` - 'draft' or 'published'
- `created_at` - Timestamp
- `updated_at` - Auto-updated timestamp

### Indexes
- `idx_content_pages_slug` - Fast slug lookups
- `idx_content_pages_status` - Fast status filtering

### RLS Policies
- Hosts can manage all content pages
- Guests can view published pages only

### Triggers
- Auto-update `updated_at` on changes

## Other Missing Tables?

Run the table checker to see if any other tables are missing:

```bash
node scripts/check-database-tables.mjs
```

If other tables are missing, you'll need to run their migrations too. Check `supabase/migrations/` for all migration files.

## Prevention

To avoid this in the future:

1. **Document database setup** in README
2. **Run migrations on setup**:
   ```bash
   supabase db push
   ```
3. **Add to onboarding checklist**:
   - [ ] Clone repo
   - [ ] Install dependencies
   - [ ] Copy `.env.local.example` to `.env.local`
   - [ ] Fill in Supabase credentials
   - [ ] **Run database migrations** ← Add this step
   - [ ] Start dev server

4. **Add migration check to startup**:
   Could add a script that checks for missing tables on `npm run dev`

## Scripts Created

### `scripts/check-database-tables.mjs`
Checks which tables exist in your database:
```bash
node scripts/check-database-tables.mjs
```

Shows:
- ✅ Tables that exist
- ❌ Tables that are missing

### `scripts/apply-content-pages-migration.mjs`
Provides instructions for applying the migration:
```bash
node scripts/apply-content-pages-migration.mjs
```

## Status

⏳ **Awaiting Action**: You need to apply the migration using one of the methods above

Once applied:
✅ content_pages table will exist  
✅ Content Pages admin page will work  
✅ No more "table not found" errors  

## Next Steps

1. **Apply the migration** using Method 1 (Supabase Dashboard) - easiest
2. **Verify** with `node scripts/check-database-tables.mjs`
3. **Refresh browser** and try Content Pages again
4. **Check for other missing tables** if you see similar errors

Let me know once you've applied the migration and I can help verify everything is working!
