# E2E Test Environment Setup Guide

## Overview

This guide explains how to configure and run E2E tests for the destination wedding platform.

## Quick Start

### 1. Install Playwright Browsers

**IMPORTANT**: Before running E2E tests for the first time, install Playwright browsers:

```bash
# Install all browsers (Chromium, Firefox, WebKit)
npx playwright install

# Or install only Chromium (recommended for faster setup)
npx playwright install chromium
```

This only needs to be done once, or after updating Playwright.

### 2. Environment Configuration

The project includes a `.env.test` file with mock values for testing. For basic E2E tests, no additional configuration is needed.

```bash
# The .env.test file is already configured with mock values
# Tests will run with these mock credentials
```

### 3. Run Tests

```bash
# Run all E2E tests (Chromium only, optimized)
npm run test:e2e

# Run specific test suites
npm run test:e2e:admin      # Admin dashboard tests
npm run test:e2e:css        # CSS delivery tests
npm run test:e2e:flows      # User flow tests
npm run test:e2e:accessibility  # Accessibility tests

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

## Test Configuration

### Playwright Configuration

The `playwright.config.ts` file is optimized for:
- **Single browser testing** (Chromium) by default to speed up execution
- **Limited workers** (4) to prevent overwhelming the dev server
- **Reasonable timeouts** (30s per test, 15s navigation, 10s actions)
- **Automatic dev server startup** with 120s timeout

### Test Environment Variables

The `.env.test` file includes mock values for:
- Supabase (local instance or mock)
- Twilio SMS (mock credentials)
- Resend email (mock API key)
- Backblaze B2 storage (mock credentials)
- Google Gemini AI (mock API key)

## Optimizations Applied

### 1. SMS Service Fix

The `smsService.ts` now uses lazy initialization to prevent Twilio errors when credentials are not configured:

```typescript
// Lazy initialize Twilio client
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    // Return null if credentials are not configured
    if (!accountSid || !authToken || accountSid === 'test') {
      return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}
```

### 2. Reduced Browser Matrix

By default, tests run only on Chromium. To test other browsers:

```bash
# Uncomment browser projects in playwright.config.ts
# Then run:
playwright test --project=firefox
playwright test --project=webkit
```

### 3. Test Batching

New npm scripts allow running tests in smaller batches:

- `test:e2e:admin` - Admin dashboard and styling tests
- `test:e2e:css` - CSS delivery verification tests
- `test:e2e:flows` - User flow tests (email, registration, RSVP)
- `test:e2e:accessibility` - Keyboard navigation and screen reader tests

## Troubleshooting

### Tests Timeout

If tests timeout:
1. Check if dev server started successfully (look for "ready" message)
2. Increase `webServer.timeout` in `playwright.config.ts`
3. Run tests in smaller batches using the batch scripts

### Twilio Errors

If you see "accountSid must start with AC":
1. Verify `.env.test` exists with `TWILIO_ACCOUNT_SID=test`
2. The SMS service will gracefully handle mock credentials

### Supabase Connection Errors

For integration tests that need a real database:
1. Set up a Supabase test project
2. Update `.env.test` with real credentials
3. Run migrations on the test database

### Too Many Test Failures

If many tests fail:
1. Run specific test suites to isolate issues
2. Check browser console for errors
3. Use `--headed` mode to see what's happening
4. Review test screenshots in `test-results/`

## CI/CD Configuration

For CI environments:
- Tests run with 1 worker (sequential)
- 2 retries on failure
- Only Chromium browser
- No server reuse

## Performance Tips

1. **Run tests in parallel locally**: Default 4 workers
2. **Use test batching**: Run only relevant test suites
3. **Reuse dev server**: Set `reuseExistingServer: true` (default for local)
4. **Skip slow tests**: Use `.skip()` for tests that aren't critical

## Test Coverage

Current E2E test coverage:
- ✅ Admin dashboard functionality
- ✅ CSS delivery and styling
- ✅ User flows (email, registration, RSVP)
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Data table properties
- ✅ Photo upload and moderation

## Next Steps

1. Run `npm run test:e2e:css` to verify CSS fix
2. Run `npm run test:e2e:admin` to verify admin pages
3. Review any failures and adjust as needed
4. Consider adding more specific test tags for better organization
