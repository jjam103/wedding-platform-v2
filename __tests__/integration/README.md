# Integration Tests

This directory contains integration tests that validate the interaction between services and external dependencies (database, APIs, etc.).

## Setup

Integration tests require real Supabase credentials to run. To set up:

1. **Copy the example environment file:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in your test Supabase credentials:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   ```

3. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

## Test Organization

### Entity Creation Tests (`entityCreation.integration.test.ts`)
- **Purpose**: Validates that all entity types can be successfully created through their service layers
- **Property**: For any valid entity data, the creation function should successfully create that entity
- **Validates**: Requirements 3.9 (Entity Creation Capability)
- **Entities Tested**: Guest, Event, Activity, Vendor, Accommodation, Location

### CSV Integration Tests (`services/csvIntegration.test.ts`)
- **Purpose**: Validates CSV import/export functionality
- **Tests**: Round-trip data integrity, format validation

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm test __tests__/integration/entityCreation.integration.test.ts

# Run with coverage
npm run test:coverage -- --testPathPattern=integration
```

## Skipped Tests

Integration tests will automatically skip if:
- Supabase environment variables are not configured
- Environment variables contain mock values (from unit test setup)

When skipped, you'll see a warning message with setup instructions.

## Best Practices

1. **Use a separate test database**: Don't run integration tests against your development or production database
2. **Clean up test data**: Integration tests should clean up after themselves
3. **Reduced iterations**: Property-based integration tests use fewer iterations (20 vs 100) due to database overhead
4. **Idempotent tests**: Tests should be able to run multiple times without conflicts

## Troubleshooting

### Tests are skipped
- Verify `.env.test` exists and contains valid Supabase credentials
- Check that credentials are not the mock values from `jest.setup.js`

### Database connection errors
- Verify your Supabase project is running
- Check that the anon key has proper permissions
- Ensure RLS policies allow test operations

### Slow test execution
- Integration tests are slower than unit tests due to database operations
- Consider running integration tests separately from unit tests
- Use `npm test` for fast unit tests, `npm run test:integration` for integration tests
