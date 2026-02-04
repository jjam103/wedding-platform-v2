# E2E Mock Credentials Guide

## Overview

The `.env.e2e` file contains mock credentials for all external services used in the application. These mock values ensure that E2E tests do not trigger real API calls to external services, preventing:

- Actual email sends via Resend
- Real SMS messages via Twilio
- Live file uploads to Backblaze B2
- Actual AI API calls to Google Gemini

## Mock Credential Format

All mock credentials follow a consistent naming pattern to make them clearly identifiable:

### Pattern: `test-{service}-{credential-type}`

This pattern ensures:
1. **Immediate Recognition**: Anyone reading the code can instantly identify test credentials
2. **Safety**: No risk of accidentally using production credentials in tests
3. **Consistency**: All mock credentials follow the same format

## Configured Mock Credentials

### 1. Backblaze B2 Storage

**Purpose**: Cloud storage for photos and files

```bash
B2_ACCESS_KEY_ID=test-b2-access-key-id
B2_SECRET_ACCESS_KEY=test-b2-secret-access-key
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_ID=test-bucket-id
B2_BUCKET_NAME=test-bucket
CLOUDFLARE_CDN_URL=https://test-cdn.example.com
```

**Mock Behavior**:
- Access keys use `test-` prefix
- Bucket ID and name are clearly test values
- CDN URL points to non-existent test domain
- Endpoint and region are real format but won't authenticate

### 2. Resend Email Service

**Purpose**: Transactional email delivery

```bash
RESEND_API_KEY=test-resend-api-key
```

**Mock Behavior**:
- API key uses `test-` prefix
- Will not authenticate with Resend API
- Email sending functions will fail gracefully or be mocked

### 3. Twilio SMS Service

**Purpose**: SMS notifications and alerts

```bash
TWILIO_ACCOUNT_SID=test-twilio-account-sid
TWILIO_AUTH_TOKEN=test-twilio-auth-token
TWILIO_PHONE_NUMBER=+15555555555
```

**Mock Behavior**:
- Account SID and auth token use `test-` prefix
- Phone number uses reserved test number format (+15555555555)
- Will not authenticate with Twilio API

### 4. Google Gemini AI Service

**Purpose**: AI-powered content extraction and generation

```bash
GEMINI_API_KEY=test-gemini-api-key
```

**Mock Behavior**:
- API key uses `test-` prefix
- Will not authenticate with Google Gemini API
- AI functions will fail gracefully or be mocked

## Verification Checklist

✅ **All External Services Covered**:
- [x] Backblaze B2 (storage)
- [x] Resend (email)
- [x] Twilio (SMS)
- [x] Google Gemini (AI)

✅ **Mock Values Clearly Identifiable**:
- [x] All credentials use `test-` prefix
- [x] Test domains and endpoints are clearly non-production
- [x] Phone numbers use reserved test format

✅ **Safety Guarantees**:
- [x] No real API credentials in file
- [x] Mock values won't trigger real API calls
- [x] Services will fail gracefully with mock credentials

## Usage in E2E Tests

### Approach 1: Service Mocking (Recommended)

Mock external service calls at the service layer:

```typescript
// In test setup
jest.mock('@/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/services/b2Service', () => ({
  uploadFile: jest.fn().mockResolvedValue({ 
    success: true, 
    data: { url: 'https://test-cdn.example.com/test-file.jpg' }
  }),
}));
```

### Approach 2: API Interception

Use Playwright's route interception for external API calls:

```typescript
// In E2E test
await page.route('**/api.resend.com/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ id: 'test-email-id', success: true }),
  });
});

await page.route('**/s3.us-west-004.backblazeb2.com/**', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ success: true }),
  });
});
```

### Approach 3: Graceful Degradation

Ensure services handle authentication failures gracefully:

```typescript
// In service implementation
export async function uploadToB2(file: File): Promise<Result<UploadResult>> {
  try {
    // Attempt upload
    const result = await b2Client.upload(file);
    return { success: true, data: result };
  } catch (error) {
    // In E2E tests with mock credentials, this will fail gracefully
    if (isAuthenticationError(error)) {
      console.warn('B2 authentication failed (expected in test environment)');
      return { 
        success: false, 
        error: { 
          code: 'EXTERNAL_SERVICE_ERROR', 
          message: 'Storage service unavailable' 
        } 
      };
    }
    throw error;
  }
}
```

## Environment Isolation

The `.env.e2e` file is completely isolated from production:

1. **Separate Database**: Uses dedicated test database (same as `.env.test`)
2. **Mock Credentials**: All external services use test credentials
3. **Test-Specific Config**: E2E-specific settings (headless mode, workers, timeouts)
4. **No Production Data**: Zero risk of affecting production systems

## Maintenance

### Adding New External Services

When adding a new external service:

1. Add mock credentials to `.env.e2e` using `test-` prefix
2. Document the service in this guide
3. Update the verification checklist
4. Ensure service handles mock credentials gracefully

### Example:

```bash
# New Service: Stripe Payment Processing (mock)
STRIPE_API_KEY=test-stripe-api-key
STRIPE_WEBHOOK_SECRET=test-stripe-webhook-secret
```

## Security Notes

⚠️ **Important**: 
- Never commit real API credentials to `.env.e2e`
- Always use `test-` prefix for mock values
- Keep `.env.e2e` in version control (it contains no secrets)
- Real credentials should only exist in `.env.local` (gitignored)

## Troubleshooting

### Issue: E2E tests making real API calls

**Solution**: Verify mock credentials are loaded:
```typescript
console.log('B2_ACCESS_KEY_ID:', process.env.B2_ACCESS_KEY_ID);
// Should output: test-b2-access-key-id
```

### Issue: External service errors in E2E tests

**Solution**: Ensure services handle authentication failures gracefully or mock the service layer.

### Issue: Tests passing locally but failing in CI

**Solution**: Verify CI environment loads `.env.e2e` correctly:
```yaml
# In .github/workflows/e2e.yml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    NODE_ENV: test
```

## Related Documentation

- [E2E Test Suite Optimization Spec](.kiro/specs/e2e-suite-optimization/requirements.md)
- [Testing Standards](.kiro/steering/testing-standards.md)
- [E2E Consolidation Process](docs/E2E_SUITE_CONSOLIDATION_PROCESS.md)
