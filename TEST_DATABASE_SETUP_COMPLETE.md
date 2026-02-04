# Test Database Setup Complete

## Summary

Successfully created and configured a dedicated Supabase test database for property-based integration tests.

## Test Database Details

- **Project Name**: wedding-platform-test
- **Project ID**: olcqaawrpnanioaorfer
- **URL**: https://olcqaawrpnanioaorfer.supabase.co
- **Region**: us-east-1
- **Status**: ACTIVE_HEALTHY
- **Cost**: $0/month (Free tier)
- **Organization**: Jamara's Wedding (vutgckhfejhtktwmvrys)

## API Keys

All keys have been configured in `.env.test.dedicated`:

### Legacy JWT Keys (Required for Auth Admin API)
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (starts with eyJ)
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (starts with eyJ)

### Modern Keys (Optional)
- **Publishable Key**: `sb_publishable_WQL9o677koIzor2XLeHSrg_OgY8rm8r`

## Migration Status

✅ **First migration applied**: `001_create_core_tables.sql`

This creates the core database schema including:
- users table
- groups table
- group_members table
- guests table
- locations table
- events table
- activities table
- rsvps table
- All necessary indexes and triggers

### Remaining Migrations

23 migrations still need to be applied. You can apply them using:

1. **Via Supabase Dashboard** (Recommended for first-time setup):
   - Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/editor
   - Use SQL Editor to run each migration file manually
   - Files are in `supabase/migrations/` directory

2. **Via Supabase CLI** (If you have CLI installed):
   ```bash
   # Link to the test project
   supabase link --project-ref olcqaawrpnanioaorfer
   
   # Push all migrations
   supabase db push
   ```

3. **Via Custom Script** (Automated):
   ```bash
   node scripts/apply-all-migrations-to-test-db.mjs
   ```
   Note: This script may need adjustments based on Supabase API capabilities

## Configuration Files

### `.env.test.dedicated`
New file created with test database credentials. Use this for property-based tests:

```bash
# Run tests with dedicated test database
cp .env.test.dedicated .env.test
npm run test:property
```

### `.env.test` (Current)
Still points to production database with legacy JWT keys for regular integration tests.

## Usage

### Running Property-Based Tests

Once all migrations are applied:

1. **Switch to test database**:
   ```bash
   cp .env.test.dedicated .env.test
   ```

2. **Run property-based tests**:
   ```bash
   npm run test:property
   ```

3. **Optionally enable skipped tests**:
   Edit `__tests__/integration/entityCreation.integration.test.ts` and remove `.skip()` from:
   - Guest Creation
   - Event Creation
   - Activity Creation
   - Vendor Creation
   - Accommodation Creation
   - Location Creation
   - Cross-Entity Creation Consistency

### Switching Between Databases

**Use Production Database** (for regular tests):
```bash
# .env.test points to bwthjirvpdypmbvpsjtl (production)
npm test
```

**Use Test Database** (for property-based tests):
```bash
# Copy test database config
cp .env.test.dedicated .env.test
npm run test:property

# Restore production config when done
git checkout .env.test
```

## Benefits of Dedicated Test Database

1. **Safe Property-Based Testing**: Can run hundreds of random test cases without polluting production data
2. **Isolated Environment**: Test data completely separate from production
3. **Reset Capability**: Can wipe and recreate database without consequences
4. **Parallel Testing**: Can run tests in parallel without conflicts
5. **Cost-Free**: Free tier Supabase project ($0/month)

## Next Steps

1. ✅ Test database created
2. ✅ API keys configured
3. ✅ First migration applied
4. ⏳ **Apply remaining 23 migrations** (see options above)
5. ⏳ Test connection with property-based tests
6. ⏳ Optionally remove `.skip()` from property tests
7. ⏳ Document test database reset procedure

## Troubleshooting

### Connection Issues

Test the connection:
```bash
node scripts/test-auth-setup.mjs
```

### Migration Issues

If migrations fail:
1. Check Supabase Dashboard logs
2. Verify service_role key is correct
3. Apply migrations manually via SQL Editor
4. Check for conflicting table names

### Reset Test Database

To completely reset:
1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/settings/general
2. Pause project
3. Restore project (this wipes all data)
4. Re-apply all migrations

## Security Notes

- ⚠️ **Never commit** `.env.test.dedicated` to git (already in `.gitignore`)
- ⚠️ **Service role key** has full database access - keep secure
- ✅ Test database is isolated from production
- ✅ Free tier has no cost implications

## Related Files

- `.env.test.dedicated` - Test database configuration
- `scripts/setup-test-database.mjs` - Setup script
- `scripts/apply-all-migrations-to-test-db.mjs` - Migration script
- `__tests__/integration/entityCreation.integration.test.ts` - Property-based tests
- `AUTH_KEYS_FIX_COMPLETE.md` - Authentication setup documentation

## Dashboard Links

- **Project Dashboard**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer
- **SQL Editor**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/editor
- **API Settings**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/settings/api
- **Database Settings**: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/settings/database

---

**Status**: Test database created and partially configured. Ready for migration application and testing.
