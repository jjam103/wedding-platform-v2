# End-to-End (E2E) Tests

Comprehensive end-to-end tests for critical user flows using Playwright.

## Overview

E2E tests validate complete user journeys from start to finish, ensuring all components work together correctly. These tests run in real browsers and simulate actual user interactions.

## Test Suites

### 1. Guest Registration Flow (`guestRegistration.spec.ts`)
Tests the complete guest registration process:
- Full registration flow from form to dashboard
- XSS prevention in registration inputs
- Required field validation
- Email format validation
- Duplicate email handling
- Keyboard navigation
- Accessibility compliance

### 2. RSVP Flow (`rsvpFlow.spec.ts`)
Tests the complete RSVP process:
- Event-level RSVP submission
- Activity-level RSVP submission
- Capacity limit enforcement
- RSVP updates and changes
- Declining RSVPs
- Dietary restrictions input
- XSS prevention in RSVP forms
- Guest count validation
- RSVP deadline warnings
- Keyboard navigation
- Accessibility compliance

### 3. Photo Upload and Moderation Flow (`photoUploadModeration.spec.ts`)
Tests the complete photo lifecycle:
- Guest photo upload with metadata
- Admin photo moderation (approve/reject)
- Photo visibility in public gallery
- File type validation
- File size validation
- Batch photo uploads
- XSS prevention in captions
- Keyboard navigation
- Accessibility compliance

### 4. Email Sending Flow (`emailSending.spec.ts`)
Tests the complete email system:
- Email template creation
- Single email sending
- Bulk email sending
- Template variable substitution
- Email delivery tracking
- Email scheduling
- Email address validation
- Required field validation
- XSS prevention in email content
- Email preview
- Keyboard navigation
- Accessibility compliance

## Running E2E Tests

### Prerequisites

1. Install Playwright browsers:
```bash
npx playwright install
```

2. Create test fixtures (see `__tests__/fixtures/README.md`):
```bash
cd __tests__/fixtures
convert -size 800x600 xc:blue test-image.jpg
convert -size 800x600 xc:red test-image-1.jpg
convert -size 800x600 xc:green test-image-2.jpg
echo "This is a test file" > test-file.txt
```

3. Ensure development server is running or configure `webServer` in `playwright.config.ts`

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run with UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Run in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test guestRegistration.spec.ts
```

### Run Specific Test
```bash
npx playwright test -g "should complete full guest registration flow"
```

### Run on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run on Mobile Devices
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Tablet**: iPad Pro
- **Base URL**: `http://localhost:3000` (configurable via `E2E_BASE_URL`)
- **Trace**: Collected on first retry
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure

## Test Structure

Each test suite follows this pattern:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
  });

  test('should perform action', async ({ page }) => {
    // 1. Arrange: Set up test data
    // 2. Act: Perform user actions
    // 3. Assert: Verify expected outcomes
  });
});
```

## Best Practices

### 1. Use Data Test IDs
```typescript
await page.click('[data-testid="submit-button"]');
```

### 2. Wait for Navigation
```typescript
await page.waitForURL(/\/dashboard/);
```

### 3. Use Explicit Waits
```typescript
await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 5000 });
```

### 4. Test User Perspective
Focus on what users see and do, not implementation details.

### 5. Keep Tests Independent
Each test should be able to run in isolation.

### 6. Clean Up Test Data
Use unique identifiers (timestamps) to avoid conflicts:
```typescript
const testEmail = `test-${Date.now()}@example.com`;
```

### 7. Test Accessibility
Include keyboard navigation and ARIA attribute checks.

### 8. Test Security
Verify XSS prevention and input sanitization.

## Debugging Failed Tests

### 1. View Test Report
```bash
npx playwright show-report
```

### 2. View Trace
Traces are automatically collected on first retry. View them in the HTML report.

### 3. Run in Debug Mode
```bash
npm run test:e2e:debug
```

### 4. Add Debug Statements
```typescript
await page.pause(); // Pauses execution
console.log(await page.content()); // Logs page HTML
```

### 5. Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png' });
```

## CI/CD Integration

E2E tests are configured for CI environments:

- **Retries**: 2 retries on failure
- **Workers**: 1 worker (sequential execution)
- **Server**: Starts automatically before tests
- **Artifacts**: Screenshots, videos, and traces saved on failure

### GitHub Actions Example
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  env:
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Coverage

E2E tests cover:

- ✅ Complete user registration flow
- ✅ Complete RSVP flow (event and activity level)
- ✅ Complete photo upload and moderation flow
- ✅ Complete email sending flow
- ✅ XSS prevention across all forms
- ✅ Input validation
- ✅ Keyboard navigation
- ✅ Accessibility compliance
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility

## Maintenance

### Adding New E2E Tests

1. Create new spec file in `__tests__/e2e/`
2. Follow existing test structure
3. Include accessibility and security tests
4. Update this README with test description

### Updating Existing Tests

1. Keep tests focused on user behavior
2. Update selectors if UI changes
3. Maintain test independence
4. Verify tests pass on all browsers

## Troubleshooting

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check if server is running
- Verify network connectivity

### Flaky Tests
- Add explicit waits
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded delays

### Browser Not Found
- Run `npx playwright install`
- Check Playwright version compatibility

### Test Data Conflicts
- Use unique identifiers (timestamps)
- Clean up test data after tests
- Use isolated test databases

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
