# Quick Start: Test Database

## TL;DR

You now have a dedicated test database for property-based tests. Here's how to use it:

## Apply Remaining Migrations (Required First)

### Option 1: Supabase Dashboard (Easiest)
1. Go to: https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/editor
2. Click "New Query"
3. Copy/paste each migration file from `supabase/migrations/`
4. Run them in order (002, 003, 004, etc.)

### Option 2: Supabase CLI
```bash
supabase link --project-ref olcqaawrpnanioaorfer
supabase db push
```

## Run Property-Based Tests

```bash
# Switch to test database
cp .env.test.dedicated .env.test

# Run property tests
npm run test:property

# Switch back to production database
git checkout .env.test
```

## Enable Skipped Tests (Optional)

Edit `__tests__/integration/entityCreation.integration.test.ts`:

```typescript
// Remove .skip() from these tests:
describe.skip('Property: Guest Creation', () => {  // Remove .skip
describe.skip('Property: Event Creation', () => {  // Remove .skip
// ... etc
```

## Database Info

- **Test DB**: olcqaawrpnanioaorfer (https://olcqaawrpnanioaorfer.supabase.co)
- **Production DB**: bwthjirvpdypmbvpsjtl (https://bwthjirvpdypmbvpsjtl.supabase.co)
- **Cost**: $0/month (free tier)

## Key Files

- `.env.test.dedicated` - Test database config (use for property tests)
- `.env.test` - Production database config (use for regular tests)
- `TEST_DATABASE_SETUP_COMPLETE.md` - Full documentation

## Current Status

✅ Test database created  
✅ API keys configured  
✅ First migration applied (001_create_core_tables)  
⏳ 23 migrations remaining  
⏳ Property tests ready to enable  

---

**Next Step**: Apply remaining migrations using one of the options above
