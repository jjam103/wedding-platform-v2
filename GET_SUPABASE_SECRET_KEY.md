# Get Your Supabase Secret Key

## ✨ Supabase's New Key System

Supabase has moved to a new, more secure key system:
- **Publishable keys** (`sb_publishable_...`) - Safe for client-side use
- **Secret keys** (`sb_secret_...`) - For server-side use only, bypasses RLS

The old `service_role` JWT keys still work but are being phased out.

## Why You Need This

The secret key allows the signup process to create user records in the database, bypassing Row Level Security (RLS) policies. This is needed because new users don't have permissions yet.

## How to Get It

### Step 1: Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/bwthjirvpdypmbvpsjtl

### Step 2: Navigate to API Settings

1. Click **Settings** (gear icon) in the left sidebar
2. Click **API**

### Step 3: Find Your Secret Key

1. Scroll down to the **Project API keys** section
2. Look for the **Secret key** (starts with `sb_secret_...`)
3. Click **Reveal** to see it
4. Click **Copy** to copy it

It looks like: `sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Note**: If you don't see a secret key, you may need to generate one:
- Click **Generate new secret key**
- Give it a name like "Backend API"
- Click **Create**

### Step 4: Add to .env.local

1. Open `.env.local` in your editor
2. Find the line: `SUPABASE_SECRET_KEY=your-secret-key-here`
3. Replace `your-secret-key-here` with the actual key
4. Save the file

Example:
```bash
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Restart Dev Server

The dev server should auto-reload, but if not:
```bash
# Stop (Ctrl+C) and restart
npm run dev
```

### Step 6: Try Signup Again

Go to: http://localhost:3000/auth/signup

Now the signup should work without errors!

## 🔄 If You Only See Old Keys

If you only see `anon` and `service_role` JWT keys (long strings starting with `eyJ...`):

**Option 1: Use the service_role key (works but deprecated)**

1. Copy the `service_role` key
2. In `.env.local`, use it as the secret key:
   ```bash
   SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Option 2: Generate new secret keys (recommended)**

Supabase may be rolling out the new keys gradually. Check their dashboard for an option to enable the new key system.

## ⚠️ Security Warning

**NEVER commit the secret key to git or share it publicly!**

The secret key has full admin access to your database. Keep it secret:
- ✅ Store in `.env.local` (already in `.gitignore`)
- ✅ Use environment variables in production
- ❌ Never commit to git
- ❌ Never share in public forums
- ❌ Never use in client-side code

## 🔑 Key Comparison

| Key Type | Format | Use In | Access Level |
|----------|--------|--------|--------------|
| **Publishable** | `sb_publishable_...` | Client-side (web, mobile) | Low - respects RLS |
| **Secret** | `sb_secret_...` | Server-side only | High - bypasses RLS |
| anon (old) | `eyJ...` (JWT) | Client-side | Low - respects RLS |
| service_role (old) | `eyJ...` (JWT) | Server-side | High - bypasses RLS |

## Alternative: Manual User Creation

If you don't want to add the secret key right now, create users manually:

1. Go to: https://supabase.com/dashboard/project/bwthjirvpdypmbvpsjtl
2. Click **Authentication** → **Users**
3. Click **Add User**
4. Enter email/password
5. Check **Auto Confirm User**
6. Click **Create User**
7. Then add to `users` table:
   - Go to **Table Editor** → **users**
   - Click **Insert** → **Insert row**
   - Fill in: `id` (user's auth ID), `email`, `role` (set to 'host')
   - Click **Save**

Then log in at: http://localhost:3000/auth/login

---

**Once you add the secret key, signup will work automatically!**

## 📚 Learn More

- [Supabase API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
- [Understanding the new key system](https://supabase.com/docs/guides/functions/auth)
