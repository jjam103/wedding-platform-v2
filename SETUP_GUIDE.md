# Setup Guide - Environment Configuration

## Quick Start

I've created a `.env.local` file with placeholder values. Follow these steps to get the application fully working:

## Required: Supabase Setup

**These are REQUIRED for the application to work:**

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization and create a project
5. Wait for the project to be provisioned (~2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Link Your Supabase Project

The Supabase CLI is already installed. Now link it to your project:

```bash
npx supabase link --project-ref your-project-ref
```

**To find your project ref:**
1. Go to your Supabase project dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF`
3. Or go to **Settings** → **General** and copy the "Reference ID"

### 4. Push Database Migrations

All migrations are already created in `supabase/migrations/`. Push them to your database:

```bash
npx supabase db push
```

This will apply all migrations in order:
- `001_create_core_tables.sql` - Core tables (guests, groups, events, activities)
- `002_create_rls_policies.sql` - Row Level Security policies
- `004_create_accommodation_tables.sql` - Accommodation and location tables
- `008_create_email_tables.sql` - Email templates and queue
- `009_create_cms_tables.sql` - Content management system

**Alternative: Manual SQL Execution**

If you prefer, you can run migrations manually:

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Copy and paste each migration file content in order (001, 002, 004, 008, 009)

### 5. Restart the Development Server

After updating `.env.local`, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The application should now work at http://localhost:3000

---

## Optional: External Services

These services are optional but enable additional features:

### Email Service (Resend)

**Enables**: Email notifications, RSVP confirmations, reminders

1. Go to [https://resend.com](https://resend.com)
2. Sign up and verify your email
3. Go to **API Keys** and create a new key
4. Update `.env.local`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Photo Storage (Backblaze B2)

**Enables**: Photo gallery, guest photo uploads

1. Go to [https://www.backblaze.com/b2](https://www.backblaze.com/b2)
2. Sign up and create a bucket
3. Go to **App Keys** and create a new key
4. Update `.env.local`:
   ```bash
   B2_APPLICATION_KEY_ID=your-key-id
   B2_APPLICATION_KEY=your-application-key
   B2_BUCKET_NAME=your-bucket-name
   B2_BUCKET_ID=your-bucket-id
   ```

5. (Optional) Set up Cloudflare CDN for faster photo delivery:
   ```bash
   CLOUDFLARE_CDN_URL=https://your-cdn-url.com
   ```

### SMS Service (Twilio)

**Enables**: SMS fallback for email delivery failures

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up and get a phone number
3. Go to **Console** and copy your credentials
4. Update `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### AI Content Extraction (Google Gemini)

**Enables**: AI-powered content extraction from URLs

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Update `.env.local`:
   ```bash
   GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx
   ```

---

## Verification

After setting up Supabase (required), you should be able to:

1. ✅ Visit http://localhost:3000 without errors
2. ✅ Navigate to `/auth/login` to see the login page
3. ✅ Create an account and log in
4. ✅ Access the admin dashboard at `/admin`
5. ✅ Create guests, events, and activities

## Troubleshooting

### "Supabase URL or key required" error

- Make sure `.env.local` exists in the project root
- Verify the values don't have quotes around them
- Restart the dev server after making changes

### Database errors

- Make sure you've run all migrations in order
- Check that RLS policies are enabled in Supabase
- Verify your anon key has the correct permissions

### "Module not found" errors

```bash
npm install
```

### Port 3000 already in use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

---

## Next Steps

Once you have Supabase configured:

1. **Create your first admin user** via Supabase Auth
2. **Set up your wedding details** in the admin dashboard
3. **Import guests** using CSV import
4. **Create events and activities** for your wedding
5. **Configure email templates** for automated notifications

## Need Help?

- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
- Project README: See `README.md` for more details

---

**Current Status**: `.env.local` created with placeholders - update with your actual credentials
