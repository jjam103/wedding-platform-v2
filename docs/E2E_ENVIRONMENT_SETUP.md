# E2E Environment Setup

**Last Updated**: February 4, 2026  
**Status**: Complete

## Overview

This document describes the E2E test environment configuration and how environment variables are loaded for Playwright tests.

## Environment Configuration

### .env.e2e File

E2E tests use a dedicated environment configuration file `.env.e2e` that contains:

1. **Test Database Credentials**: Dedicated Supabase test database (shared with integration tests)
2. **Mock Service Credentials**: Mock credentials for external services to prevent real API calls
3. **E2E-Specific Settings**: Configuration for test execution (workers, timeouts, etc.)

### Environment Variables

#### Required Variables

```bash
# Supabase Test Database
NEXT_PUBLIC_SUPABASE_URL=https://olcqaawrpnanioaorfer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>

# E2E Configuration
E2E_BASE_URL=http://localhost:3000
E2E_WORKERS=2
```

#### Optional Variables

```bash
# Mock External Services
B2_ACCESS_KEY_ID=test-b2-access-key-id
B2_SECRET_ACCESS_KEY=test-b2-secret-access-key
RESEND_API_KEY=test-resend-api-key
TWILIO_ACCOUNT_SID=test-twilio-account-sid
GEMINI_API_KEY=test-gemini-api-key

# Test Execution Settings
E2E_HEADLESS=true
E2E_TIMEOUT=30000
E2E_SCREENSHOT_ON_FAILURE=true
E2E_VIDEO=retain-on-failure
E2E_TRACE=retain-on-failure
```

## Playwright Configuration

### Loading Environment Variables

The `playwright.config.ts` file loads environment variables from `.env.e2e` using dotenv:

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load E2E environment variables from .env.e2e
dotenv.config({ path: '.env.e2e' });

export default defineConfig({
  // ... configuration
});
```

### How It Works

1. **Startup**: When Playwright starts, it loads `playwright.config.ts`
2. **Environment Loading**: The config file calls `dotenv.config({ path: '.env.e2e' })`
3. **Variable Injection**: All variables from `.env.e2e` are injected into `process.env`
4. **Test Access**: Tests can access variables via `process.env.VARIABLE_NAME`
5. **Web Server**: The Next.js dev server also receives these environment variables

### Configuration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Playwright Startup                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Load playwright.config.ts                      │
│  • Import dotenv                                            │
│  • Call dotenv.config({ path: '.env.e2e' })                │
│  • Load all environment variables                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Environment Variables Available                │
│  • process.env.NEXT_PUBLIC_SUPABASE_URL                    │
│  • process.env.E2E_BASE_URL                                │
│  • process.env.E2E_WORKERS                                 │
│  • ... all other variables from .env.e2e                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Start Web Server (Next.js)                     │
│  • Inherits environment variables                           │
│  • Uses test database credentials                           │
│  • Uses mock service credentials                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Run E2E Tests                                  │
│  • Tests access variables via process.env                  │
│  • Web server uses test configuration                       │
│  • Mock services prevent real API calls                     │
└─────────────────────────────────────────────────────────────┘
```

## Verification

### Verify Environment Loading

Run the verification script to check that all environment variables are loaded correctly:

```bash
node scripts/verify-e2e-env.mjs
```

Expected output:

```
✅ Successfully loaded .env.e2e

📋 Checking required environment variables:

  ✅ NEXT_PUBLIC_SUPABASE_URL: https://olcqaawrpnanioaorfer.supabase.co
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOi...
  ✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOi...
  ✅ E2E_BASE_URL: http://localhost:3000
  ✅ E2E_WORKERS: 2

📋 Checking optional environment variables:

  ✅ B2_ACCESS_KEY_ID: test-b2-ac...
  ✅ RESEND_API_KEY: test-resen...
  ✅ TWILIO_ACCOUNT_SID: test-twilio-account-sid
  ✅ GEMINI_API_KEY: test-gemin...
  ✅ E2E_HEADLESS: true
  ✅ E2E_TIMEOUT: 30000

============================================================
✅ All required environment variables are set!
✨ E2E tests are ready to run.
```

### Verify in Tests

You can verify environment variables are accessible in your tests:

```typescript
import { test, expect } from '@playwright/test';

test('environment variables are loaded', async () => {
  expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
  expect(process.env.E2E_BASE_URL).toBe('http://localhost:3000');
});
```

## Mock Services

### Why Mock Services?

E2E tests use mock credentials for external services to:

1. **Prevent Real API Calls**: Avoid charges and rate limits
2. **Ensure Test Isolation**: Tests don't depend on external service availability
3. **Speed Up Tests**: Mock responses are instant
4. **Consistent Results**: Mock responses are predictable

### Mock Service Detection

Services detect the test environment and use mocks automatically:

```typescript
// Example: B2 Service
const isTestEnvironment = process.env.B2_ACCESS_KEY_ID?.startsWith('test-');

if (isTestEnvironment) {
  // Use mock B2 client
  return createMockB2Client();
} else {
  // Use real B2 client
  return createRealB2Client();
}
```

### Configured Mock Services

- **Backblaze B2**: Mock file storage (no real uploads)
- **Resend**: Mock email sending (no real emails)
- **Twilio**: Mock SMS sending (no real SMS)
- **Google Gemini**: Mock AI responses (no real API calls)

## Test Database

### Shared Test Database

E2E tests use the same dedicated test database as integration tests:

- **URL**: `https://olcqaawrpnanioaorfer.supabase.co`
- **Purpose**: Isolated from production data
- **Migrations**: All migrations applied
- **RLS Policies**: Fully configured
- **Cleanup**: Test data cleaned up after each run

### Database Isolation

- Each test suite cleans up its data
- Tests use unique identifiers (e.g., `test-guest-123`)
- Global teardown removes all test data
- No interference with production database

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Tests can't access environment variables

**Solution**:
1. Verify `.env.e2e` file exists in project root
2. Check file has correct variable names
3. Run verification script: `node scripts/verify-e2e-env.mjs`
4. Ensure dotenv is installed: `npm install dotenv`

### Wrong Environment Variables

**Problem**: Tests use wrong database or service credentials

**Solution**:
1. Check `.env.e2e` is being loaded (not `.env.local`)
2. Verify Playwright config has `dotenv.config({ path: '.env.e2e' })`
3. Check for conflicting environment variables in shell
4. Restart Playwright if config was changed

### Mock Services Not Working

**Problem**: Tests make real API calls instead of using mocks

**Solution**:
1. Verify mock credentials in `.env.e2e` start with `test-`
2. Check service detection logic recognizes test environment
3. Review service initialization logs
4. Ensure services check environment before making calls

### Test Database Connection Failed

**Problem**: Can't connect to test database

**Solution**:
1. Verify test database credentials in `.env.e2e`
2. Check test database is accessible (not paused)
3. Verify network connection
4. Check Supabase project status

## Best Practices

### DO

✅ Use `.env.e2e` for all E2E-specific configuration  
✅ Use mock credentials for external services  
✅ Verify environment loading before running tests  
✅ Keep test database separate from production  
✅ Clean up test data after each run  
✅ Document any new environment variables  

### DON'T

❌ Commit `.env.e2e` with real credentials to git  
❌ Use production credentials in E2E tests  
❌ Make real API calls to external services  
❌ Share test database with production  
❌ Leave test data in database after tests  
❌ Hard-code environment-specific values in tests  

## References

- [Playwright Configuration](../playwright.config.ts)
- [E2E Test Suite Optimization Spec](.kiro/specs/e2e-suite-optimization/)
- [Testing Standards](.kiro/steering/testing-standards.md)
- [dotenv Documentation](https://github.com/motdotla/dotenv)

## Changelog

### 2026-02-04
- ✅ Added dotenv loading to `playwright.config.ts`
- ✅ Created verification script `scripts/verify-e2e-env.mjs`
- ✅ Documented environment configuration
- ✅ Verified all environment variables load correctly

---

**Status**: Complete  
**Task**: 2.1 Add dotenv loading for `.env.e2e`  
**Spec**: e2e-suite-optimization
