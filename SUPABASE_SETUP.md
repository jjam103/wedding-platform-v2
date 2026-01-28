# Supabase Setup - Quick Start

## You're Right! 

Yes, the database migrations can be set up using the **Supabase Power** that's already installed in Kiro. Here's how:

## Option 1: Using Supabase CLI (Recommended)

The Supabase CLI is already installed as a dev dependency. Follow these steps:

### 1. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create/open your project
2. Go to **Settings** → **API**
3. Copy these values and update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Link Your Project

Find your project reference ID:
- Look at your Supabase dashboard URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`
- Or go to **Settings** → **General** → "Reference ID"

Then link it:
```bash
npx supabase link --project-ref YOUR-PROJECT-REF
```

You'll be prompted to enter your database password (found in Settings → Database).

### 3. Push Migrations

All migrations are already created in `supabase/migrations/`. Push them:

```bash
npx supabase db push
```

This applies all 5 migration files in order:
- ✅ Core tables (guests, groups, events, activities, RSVPs)
- ✅ Row Level Security policies
- ✅ Accommodation and location tables
- ✅ Email templates and queue
- ✅ Content management system

### 4. Verify Setup

Check that tables were created:
```bash
npx supabase db diff --linked
```

If it shows "No schema changes detected", you're all set!

### 5. Restart Dev Server

The server should auto-reload, but if not:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Option 2: Using Supabase Power (Advanced)

If you want to use Kiro's Supabase Power for more advanced database operations:

### Available Commands

The Supabase Power provides tools for:
- Listing tables and inspecting schema
- Applying migrations
- Getting security and performance advisors
- Managing RLS policies
- Creating database functions

### Workflow

1. **Link project** (same as above)
2. **Use Kiro to apply migrations**: Ask Kiro to "apply the database migrations using the Supabase power"
3. **Sync changes**: `npx supabase migration fetch --yes`
4. **Generate types**: `npx supabase gen types --linked > types/supabase.ts`

---

## Option 3: Manual SQL (If CLI Doesn't Work)

If you have issues with the CLI, you can run migrations manually:

1. Go to your Supabase dashboard
2. Click **SQL Editor**
3. Copy and paste each file's content in order:
   - `supabase/migrations/001_create_core_tables.sql`
   - `supabase/migrations/002_create_rls_policies.sql`
   - `supabase/migrations/004_create_accommodation_tables.sql`
   - `supabase/migrations/008_create_email_tables.sql`
   - `supabase/migrations/009_create_cms_tables.sql`
4. Click "Run" for each one

---

## What Gets Created

After running migrations, your database will have:

### Core Tables
- `guests` - Guest information and RSVP data
- `groups` - Family/group organization
- `group_members` - Multi-owner access control
- `events` - Wedding events (ceremony, reception, etc.)
- `activities` - Activities within events
- `rsvps` - Guest RSVP responses

### Accommodation
- `locations` - Hierarchical location data
- `accommodations` - Hotels and venues
- `room_types` - Room categories
- `room_assignments` - Guest room assignments

### Email System
- `email_templates` - Customizable email templates
- `email_queue` - Scheduled and queued emails
- `email_logs` - Delivery tracking

### Content Management
- `pages` - Custom content pages
- `sections` - Page sections with rich content
- `gallery_settings` - Photo gallery configuration

### Security
- Row Level Security (RLS) policies on all tables
- Multi-tenant data isolation by group
- Role-based access control (owner, editor, viewer)

---

## Troubleshooting

### "Project not linked"
```bash
npx supabase link --project-ref YOUR-PROJECT-REF
```

### "Database password required"
Find it in: Supabase Dashboard → Settings → Database → Database Password

### "Migration already applied"
That's fine! It means the migration was already run. Skip to the next one.

### "Permission denied"
Make sure you're using the correct database password and have owner access to the project.

### "Cannot connect to database"
Check that your Supabase project is active and not paused (free tier projects pause after inactivity).

---

## Next Steps

Once migrations are applied:

1. ✅ Restart your dev server
2. ✅ Visit http://localhost:3000
3. ✅ Create your first admin user via Supabase Auth
4. ✅ Start using the application!

---

**Current Status**: 
- ✅ Supabase CLI installed (v2.72.8)
- ✅ Migrations ready in `supabase/migrations/`
- ✅ `.env.local` created (needs your credentials)
- ⏳ Waiting for: Project linking and migration push
