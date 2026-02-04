# Quick Fix: Missing deleted_at Column Error

## The Error

```
Could not find the 'deleted_at' column of 'activities' in the schema cache
```

## The Solution (2 Minutes)

### Step 1: Open Supabase Dashboard
Go to: https://app.supabase.com → Select your project → SQL Editor

### Step 2: Copy This SQL

Open the file: `supabase/migrations/048_add_soft_delete_columns.sql`

Or copy this quick version:

```sql
-- Add deleted_at columns
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_activities_not_deleted ON activities(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activities_deleted ON activities(deleted_at) WHERE deleted_at IS NOT NULL;

-- Update RLS policy
DROP POLICY IF EXISTS "Guests can view activities" ON activities;
CREATE POLICY "Guests can view activities" ON activities FOR SELECT USING (deleted_at IS NULL);
```

### Step 3: Run in SQL Editor
Paste the SQL and click **Run**

### Step 4: Verify
Try deleting an activity again - it should work!

---

## What This Does

- Adds `deleted_at` column to activities table (soft delete timestamp)
- Adds `deleted_by` column to track who deleted it
- Creates indexes for performance
- Updates RLS policy so guests don't see deleted activities

## Why This Happened

The migration file exists in your codebase but wasn't applied to your hosted Supabase database yet. This is a one-time setup step.

---

## Full Migration (Optional)

If you want to add soft delete to ALL tables (not just activities), run the full migration file:
`supabase/migrations/048_add_soft_delete_columns.sql`

This adds soft delete to:
- content_pages
- sections
- columns
- events
- activities
- photos
- rsvps
