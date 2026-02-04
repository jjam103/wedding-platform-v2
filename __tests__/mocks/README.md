# Mock External Services for E2E Testing

This directory contains mock implementations of external services used during E2E testing. These mocks prevent real API calls while providing realistic responses for testing.

## Overview

The mock services simulate the following external APIs:

1. **Backblaze B2 Storage** (`mockB2Service.ts`) - Photo storage and CDN
2. **Resend Email** (`mockResendService.ts`) - Email delivery
3. **Twilio SMS** (`mockTwilioService.ts`) - SMS messaging
4. **Google Gemini AI** (`mockGeminiService.ts`) - AI content extraction

## Service Detection

The `serviceDetector.ts` module automatically switches between real and mock services based on the environment:

```typescript
import { shouldUseMockServices, getB2Service } from '@/__tests__/mocks/serviceDetector';

// Automatically uses mock in E2E tests, real service in production
const b2Service = await getB2Service();
```

### Detection Logic

Mock services are used when:
- `NODE_ENV === 'test'`
- `E2E_TEST === 'true'`
- `PLAYWRIGHT_TEST === 'true'`
- `PLAYWRIGHT === '1'`
- Test database URL is detected

Override with:
- `USE_MOCK_SERVICES=true` - Force mocks
- `USE_MOCK_SERVICES=false` - Force real services

## Mock B2 Storage Service

### Features
- Simulates file uploads without real API calls
- Generates mock CDN URLs
- Tracks uploads for test verification
- Supports health checks
- Can simulate failures for error testing

### Usage

```typescript
import { uploadToB2, getMockUploads, simulateB2Failure } from '@/__tests__/mocks/mockB2Service';

// Upload file (returns mock URL)
const result = await uploadToB2(fileBuffer, 'photo.jpg', 'image/jpeg');
console.log(result.data.url); // https://test-cdn.example.com/photos/...

// Verify uploads in tests
const uploads = getMockUploads();
expect(uploads).toHaveLength(1);
expect(uploads[0].fileName).toBe('photo.jpg');

// Simulate failure for error testing
simulateB2Failure('Storage quota exceeded');
const failResult = await uploadToB2(fileBuffer, 'photo.jpg', 'image/jpeg');
expect(failResult.success).toBe(false);
```

### API

- `uploadToB2(file, fileName, contentType)` - Mock file upload
- `checkB2Health()` - Mock health check
- `getMockUploads()` - Get all uploaded files
- `simulateB2Failure(message)` - Simulate upload failure
- `resetB2Client()` - Reset mock state

## Mock Resend Email Service

### Features
- Simulates email sending without real delivery
- Tracks sent emails for verification
- Supports template-based emails
- Can simulate delivery failures
- Provides email search and filtering

### Usage

```typescript
import { 
  MockResend, 
  getSentEmails, 
  verifyEmailSent,
  simulateEmailFailure 
} from '@/__tests__/mocks/mockResendService';

// Send email (no real delivery)
const resend = new MockResend();
const result = await resend.emails.send({
  from: 'test@example.com',
  to: 'user@example.com',
  subject: 'Test Email',
  html: '<p>Hello!</p>',
});

// Verify email was sent
expect(verifyEmailSent({
  to: 'user@example.com',
  subject: 'Test Email',
})).toBe(true);

// Get all sent emails
const emails = getSentEmails();
expect(emails).toHaveLength(1);

// Simulate failure
simulateEmailFailure('Invalid recipient');
```

### API

- `MockResend` - Mock Resend client class
- `getSentEmails()` - Get all sent emails
- `getSentEmailsByRecipient(email)` - Filter by recipient
- `getSentEmailsBySubject(subject)` - Filter by subject
- `verifyEmailSent(criteria)` - Check if email was sent
- `simulateEmailFailure(reason)` - Simulate next send failure
- `clearSentEmails()` - Reset sent emails
- `resetMockResend()` - Full reset

## Mock Twilio SMS Service

### Features
- Simulates SMS sending without real delivery
- Tracks sent messages for verification
- Generates realistic message SIDs
- Can simulate delivery failures
- Supports message search and filtering

### Usage

```typescript
import { 
  mockTwilio, 
  getSentMessages, 
  verifySMSSent,
  simulateSMSFailure 
} from '@/__tests__/mocks/mockTwilioService';

// Send SMS (no real delivery)
const client = mockTwilio('test-sid', 'test-token');
const message = await client.messages.create({
  to: '+15551234567',
  from: '+15559876543',
  body: 'Test message',
});

// Verify SMS was sent
expect(verifySMSSent({
  to: '+15551234567',
  containsText: 'Test message',
})).toBe(true);

// Get all sent messages
const messages = getSentMessages();
expect(messages).toHaveLength(1);

// Simulate failure
simulateSMSFailure('Invalid phone number');
```

### API

- `mockTwilio(accountSid, authToken)` - Create mock client
- `getSentMessages()` - Get all sent messages
- `getSentMessagesByRecipient(phone)` - Filter by recipient
- `verifySMSSent(criteria)` - Check if SMS was sent
- `simulateSMSFailure(reason)` - Simulate next send failure
- `clearSentMessages()` - Reset sent messages
- `resetMockTwilio()` - Full reset

## Mock Gemini AI Service

### Features
- Simulates AI content extraction without real API calls
- Returns realistic mock data for activities, accommodations, vendors
- Tracks AI requests for verification
- Can simulate API failures
- Supports custom responses for specific tests

### Usage

```typescript
import { 
  MockGoogleGenerativeAI, 
  getAIRequests, 
  verifyAIRequest,
  simulateAIFailure 
} from '@/__tests__/mocks/mockGeminiService';

// Extract content (returns mock data)
const genAI = new MockGoogleGenerativeAI('test-key');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent('Extract activity data...');
const response = await result.response;
const text = response.text();

// Verify AI request was made
expect(verifyAIRequest({
  contentType: 'activity',
})).toBe(true);

// Get all requests
const requests = getAIRequests();
expect(requests).toHaveLength(1);

// Simulate failure
simulateAIFailure('API quota exceeded');
```

### API

- `MockGoogleGenerativeAI` - Mock Gemini client class
- `getAIRequests()` - Get all AI requests
- `verifyAIRequest(criteria)` - Check if request was made
- `simulateAIFailure(reason)` - Simulate next request failure
- `setCustomResponse(response)` - Set custom response for next request
- `clearAIRequests()` - Reset requests
- `resetMockGemini()` - Full reset

## Service Detector

### Features
- Automatic environment detection
- Seamless switching between real and mock services
- Environment validation
- Centralized mock reset

### Usage

```typescript
import { 
  shouldUseMockServices,
  getB2Service,
  getResendClient,
  getTwilioClient,
  getGeminiClient,
  resetAllMockServices,
  getEnvironmentSummary
} from '@/__tests__/mocks/serviceDetector';

// Check if mocks should be used
if (shouldUseMockServices()) {
  console.log('Using mock services');
}

// Get appropriate service
const b2 = await getB2Service();
const resend = await getResendClient();
const twilio = await getTwilioClient();
const gemini = await getGeminiClient();

// Reset all mocks (in test cleanup)
await resetAllMockServices();

// Get environment info
const env = getEnvironmentSummary();
console.log(env);
```

### API

- `isE2ETestMode()` - Check if in E2E test mode
- `shouldUseMockServices()` - Check if mocks should be used
- `getB2Service()` - Get B2 service (real or mock)
- `getResendClient()` - Get Resend client (real or mock)
- `getTwilioClient()` - Get Twilio client (real or mock)
- `getGeminiClient()` - Get Gemini client (real or mock)
- `resetAllMockServices()` - Reset all mocks
- `getEnvironmentSummary()` - Get environment details
- `validateTestEnvironment()` - Validate test setup

## Testing Patterns

### Basic Test with Mocks

```typescript
import { test, expect } from '@playwright/test';
import { getSentEmails, clearSentEmails } from '@/__tests__/mocks/mockResendService';

test.describe('Email functionality', () => {
  test.beforeEach(async () => {
    // Clear mock state before each test
    clearSentEmails();
  });

  test('should send welcome email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.click('button[type="submit"]');

    // Verify email was sent
    const emails = getSentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe('user@example.com');
    expect(emails[0].subject).toContain('Welcome');
  });
});
```

### Testing Error Scenarios

```typescript
import { test, expect } from '@playwright/test';
import { simulateEmailFailure, clearSentEmails } from '@/__tests__/mocks/mockResendService';

test('should handle email failure gracefully', async ({ page }) => {
  // Simulate email service failure
  simulateEmailFailure('Service unavailable');

  await page.goto('/contact');
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('textarea[name="message"]', 'Test message');
  await page.click('button[type="submit"]');

  // Should show error message
  await expect(page.locator('.error-message')).toContainText('Failed to send');
});
```

### Verifying Service Calls

```typescript
import { test, expect } from '@playwright/test';
import { getMockUploads, resetB2Client } from '@/__tests__/mocks/mockB2Service';

test('should upload photo to B2', async ({ page }) => {
  await page.goto('/photos/upload');
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-photo.jpg');
  await page.click('button:has-text("Upload")');

  // Verify B2 upload was called
  const uploads = getMockUploads();
  expect(uploads).toHaveLength(1);
  expect(uploads[0].fileName).toContain('test-photo.jpg');
  expect(uploads[0].contentType).toBe('image/jpeg');
});
```

## Environment Configuration

### E2E Test Environment (`.env.e2e`)

```bash
# Enable E2E test mode
NODE_ENV=test
E2E_TEST=true

# Mock service credentials (not used but required for validation)
B2_ACCESS_KEY_ID=test-b2-key-id
B2_SECRET_ACCESS_KEY=test-b2-key
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=test-bucket
B2_CDN_DOMAIN=test-cdn.example.com

RESEND_API_KEY=test-resend-key
TWILIO_ACCOUNT_SID=test
TWILIO_AUTH_TOKEN=test
TWILIO_PHONE_NUMBER=+15555555555
GEMINI_API_KEY=test-gemini-key
```

### Force Mock Services

```bash
# Explicitly enable mocks (even outside E2E mode)
USE_MOCK_SERVICES=true
```

### Force Real Services

```bash
# Explicitly disable mocks (even in E2E mode)
USE_MOCK_SERVICES=false
```

## Best Practices

### 1. Always Reset Mocks

```typescript
test.beforeEach(async () => {
  await resetAllMockServices();
});
```

### 2. Verify Service Calls

```typescript
// Don't just test UI - verify service was called correctly
const emails = getSentEmails();
expect(emails[0].subject).toBe('Expected Subject');
```

### 3. Test Error Scenarios

```typescript
// Test how app handles service failures
simulateEmailFailure('Network error');
// ... test error handling
```

### 4. Use Descriptive Assertions

```typescript
// Good
expect(verifyEmailSent({
  to: 'user@example.com',
  subject: 'Welcome',
  containsText: 'activation link',
})).toBe(true);

// Less clear
expect(getSentEmails().length).toBeGreaterThan(0);
```

### 5. Clean Up After Tests

```typescript
test.afterEach(async () => {
  await resetAllMockServices();
});
```

## Troubleshooting

### Mocks Not Being Used

**Problem**: Real API calls are being made during tests

**Solutions**:
1. Check `NODE_ENV` is set to `'test'`
2. Verify `.env.e2e` is loaded
3. Set `USE_MOCK_SERVICES=true` explicitly
4. Check `getEnvironmentSummary()` output

### Mock State Persisting

**Problem**: Mock data from previous test affects current test

**Solutions**:
1. Call `resetAllMockServices()` in `beforeEach`
2. Clear specific mocks: `clearSentEmails()`, `resetB2Client()`, etc.
3. Ensure test isolation

### Service Detection Not Working

**Problem**: Wrong service (real/mock) is being used

**Solutions**:
1. Check environment variables
2. Verify `serviceDetector.ts` logic
3. Use `getEnvironmentSummary()` to debug
4. Check for explicit overrides

## Maintenance

### Adding New Mock Services

1. Create `mock[ServiceName]Service.ts`
2. Implement service interface
3. Add tracking and verification methods
4. Add reset function
5. Update `serviceDetector.ts`
6. Update this README

### Updating Mock Responses

1. Update mock data in service file
2. Ensure responses match real service format
3. Update tests if needed
4. Document changes

## References

- [E2E Test Suite Optimization Spec](../../.kiro/specs/e2e-suite-optimization/)
- [Testing Standards](../../.kiro/steering/testing-standards.md)
- [Playwright Documentation](https://playwright.dev/)

---

**Last Updated**: February 4, 2026  
**Maintainer**: Development Team
