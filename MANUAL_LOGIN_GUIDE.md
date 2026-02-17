# Manual Login Guide - E2E vs Production Database

**Issue**: You're trying to log in with E2E test credentials (`admin@test.com`) but your dev server is connected to the production database.

## Quick Solution

### Option 1: Use E2E Database (Recommended for Testing)

1. **Stop the dev server** (Ctrl+C)

2. **Start dev server with E2E environment**:
   ```bash
   # Load E2E environment variables
   cp .env.e2e .env.local
   
   # Start dev server
   npm run dev
   ```

3. **Login with E2E credentials**:
   - Email: `admin@example.com`
   - Password: `test-password-123`

4. **Test location hierarchy** at `/admin/locations`

### Option 2: Create Admin User in Production Database

If you want to use the production database:

1. **Check what email you want to use**:
   ```bash
   # Check if you have an admin user
   # (You'll need to query your production database)
   ```

2. **Create admin user** (if needed):
   ```bash
   # Use Supabase dashboard or create via script
   ```

3. **Login with production credentials**

## Current Database Configuration

### Production Database (Current)
- **URL**: `https://bwthjirvpdypmbvpsjtl.supabase.co`
- **File**: `.env.local`
- **Admin User**: Unknown (need to check)

### E2E Test Database
- **URL**: `https://olcqaawrpnanioaorfer.supabase.co`
- **File**: `.env.e2e`
- **Admin User**: `admin@example.com` / `test-password-123`

## Why This Happened

The E2E global setup creates an admin user in the **E2E test database**, but your dev server is running against the **production database**. These are two separate databases with different users.

## Recommendation

**Use the E2E database for testing** since:
- ✅ Admin user already exists
- ✅ Test data is isolated
- ✅ Safe to experiment
- ✅ Matches E2E test environment

## Steps to Switch to E2E Database

```bash
# 1. Stop dev server (Ctrl+C if running)

# 2. Backup current .env.local (optional)
cp .env.local .env.local.backup

# 3. Copy E2E environment
cp .env.e2e .env.local

# 4. Start dev server
npm run dev

# 5. Open browser to http://localhost:3000/auth/login

# 6. Login with:
#    Email: admin@example.com
#    Password: test-password-123

# 7. Navigate to /admin/locations

# 8. Test location hierarchy functionality
```

## After Testing

To switch back to production database:

```bash
# Stop dev server (Ctrl+C)

# Restore production environment
cp .env.local.backup .env.local
# OR manually edit .env.local to use production URL

# Start dev server
npm run dev
```

## Troubleshooting

### "Invalid login credentials" Error
- **Cause**: User doesn't exist in the database you're connected to
- **Fix**: Make sure you're using the right database and credentials

### "Database connection failed"
- **Cause**: Wrong database URL or credentials
- **Fix**: Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and keys

### "Admin user not found"
- **Cause**: Admin user doesn't exist in current database
- **Fix**: Create admin user or switch to E2E database

## Quick Reference

| Database | URL | Admin Email | Password |
|----------|-----|-------------|----------|
| E2E Test | `olcqaawrpnanioaorfer` | `admin@example.com` | `test-password-123` |
| Production | `bwthjirvpdypmbvpsjtl` | (check your records) | (your password) |

---

**Current Status**: Dev server is using **production** database, but you're trying to log in with **E2E test** credentials.

**Solution**: Switch to E2E database (see steps above) or create admin user in production database.
