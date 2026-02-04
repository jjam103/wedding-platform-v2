# E2E Test Suite Optimization - Design

**Feature Name**: e2e-suite-optimization  
**Created**: February 4, 2026  
**Status**: Draft

## Overview

This document outlines the technical design for optimizing the E2E test suite to ensure reliable, fast, and comprehensive testing. The design focuses on environment configuration, test execution infrastructure, CI/CD integration, and performance optimization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     E2E Test Suite                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth Tests │  │  Admin Tests │  │  Guest Tests │    │
│  │   (15 tests) │  │  (120 tests) │  │  (71 tests)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ System Tests │  │  A11y Tests  │                       │
│  │  (53 tests)  │  │  (52 tests)  │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Test Infrastructure                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Playwright Test Runner                   │ │
│  │  • Parallel execution (4 workers)                    │ │
│  │  • Global setup/teardown                             │ │
│  │  • Screenshot/video capture                          │ │
│  │  • Retry logic (2 retries in CI)                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Test Environment                         │ │
│  │  • Dedicated test database                           │ │
│  │  • Mock external services                            │ │
│  │  • Test authentication                               │ │
│  │  • Data cleanup utilities                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Under Test                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Next.js Dev Server                       │ │
│  │  • Running on localhost:3000                         │ │
│  │  • Using .env.test configuration                     │ │
│  │  • Connected to test database                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Dependencies                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Supabase   │  │  B2 Storage  │  │    Resend    │    │
│  │  Test DB     │  │   (Mocked)   │  │   (Mocked)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │    Twilio    │  │    Gemini    │                       │
│  │   (Mocked)   │  │   (Mocked)   │                       │
│  └──────────────┘  └──────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Environment Configuration

#### 1.1 Environment Files

**`.env.e2e`** - E2E-specific environment configuration:
```bash
# Supabase Test Database
NEXT_PUBLIC_SUPABASE_URL=https://olcqaawrpnanioaorfer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>

# Mock External Services
B2_ACCESS_KEY_ID=test-b2-key-id
B2_SECRET_ACCESS_KEY=test-b2-key
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET_NAME=test-bucket
CLOUDFLARE_CDN_URL=https://test-cdn.example.com

RESEND_API_KEY=test-resend-key
TWILIO_ACCOUNT_SID=test
TWILIO_AUTH_TOKEN=test
TWILIO_PHONE_NUMBER=+15555555555
GEMINI_API_KEY=test-gemini-key

# E2E Test Configuration
E2E_BASE_URL=http://localhost:3000
E2E_HEADLESS=true
E2E_WORKERS=4
```

#### 1.2 Playwright Configuration

**`playwright.config.ts`** - Updated configuration:
```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load E2E environment variables
dotenv.config({ path: '.env.e2e' });

export default defineConfig({
  testDir: './__tests__/e2e',
  
  // Timeouts
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  
  // Execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : parseInt(process.env.E2E_WORKERS || '4'),
  
  // Reporters
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-html' }],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
  ],
  
  // Shared settings
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 15 * 1000,
    actionTimeout: 10 * 1000,
  },

  // Projects
  projects: [
    // Setup project
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },
    
    // Test projects
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Web server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
      // Use E2E environment variables
      ...process.env,
    },
  },
});
```

### 2. Test Infrastructure

#### 2.1 Global Setup

**`__tests__/e2e/global-setup.ts`** - Global test setup:
```typescript
import { chromium, FullConfig } from '@playwright/test';
import { createTestClient } from '../helpers/testDb';
import { cleanup } from '../helpers/cleanup';

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2E Global Setup Starting...');
  
  // 1. Verify test database connection
  console.log('📊 Verifying test database connection...');
  const supabase = createTestClient();
  const { error } = await supabase.from('guests').select('count').limit(1);
  if (error) {
    throw new Error(`Test database connection failed: ${error.message}`);
  }
  console.log('✅ Test database connected');
  
  // 2. Clean up any leftover test data
  console.log('🧹 Cleaning up test data...');
  await cleanup();
  console.log('✅ Test data cleaned');
  
  // 3. Verify Next.js server is running
  console.log('🌐 Verifying Next.js server...');
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  try {
    const response = await fetch(baseURL);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    console.log('✅ Next.js server is running');
  } catch (error) {
    throw new Error(`Next.js server not accessible: ${error}`);
  }
  
  // 4. Create admin authentication state
  console.log('🔐 Setting up admin authentication...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login as admin
  await page.goto(`${baseURL}/admin/login`);
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'test-password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/**');
  
  // Save authentication state
  await context.storageState({ path: '.auth/user.json' });
  await browser.close();
  console.log('✅ Admin authentication saved');
  
  console.log('✨ E2E Global Setup Complete!');
}

export default globalSetup;
```

#### 2.2 Global Teardown

**`__tests__/e2e/global-teardown.ts`** - Global test teardown:
```typescript
import { FullConfig } from '@playwright/test';
import { cleanup } from '../helpers/cleanup';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2E Global Teardown Starting...');
  
  // 1. Clean up test data
  console.log('🗑️  Cleaning up test data...');
  await cleanup();
  console.log('✅ Test data cleaned');
  
  // 2. Remove authentication state
  console.log('🔓 Removing authentication state...');
  if (fs.existsSync('.auth/user.json')) {
    fs.unlinkSync('.auth/user.json');
    console.log('✅ Authentication state removed');
  }
  
  console.log('✨ E2E Global Teardown Complete!');
}

export default globalTeardown;
```

#### 2.3 Test Helpers

**`__tests__/helpers/e2eHelpers.ts`** - E2E test utilities:
```typescript
import { Page, expect } from '@playwright/test';
import { createTestClient } from './testDb';

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Fill form and submit
 */
export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonText: string = 'Submit'
) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`input[name="${name}"], textarea[name="${name}"]`, value);
  }
  await page.click(`button:has-text("${submitButtonText}")`);
}

/**
 * Wait for toast message
 */
export async function waitForToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'info' = 'success'
) {
  const toastSelector = `.toast.${type}`;
  await expect(page.locator(toastSelector)).toBeVisible();
  await expect(page.locator(toastSelector)).toContainText(message);
}

/**
 * Create test data in database
 */
export async function createTestGuest(data: {
  firstName: string;
  lastName: string;
  email: string;
  groupId: string;
}) {
  const supabase = createTestClient();
  const { data: guest, error } = await supabase
    .from('guests')
    .insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      group_id: data.groupId,
      age_type: 'adult',
      guest_type: 'wedding_guest',
    })
    .select()
    .single();
  
  if (error) throw new Error(`Failed to create test guest: ${error.message}`);
  return guest;
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}
```

### 3. Test Execution

#### 3.1 Test Organization

```
__tests__/e2e/
├── auth/
│   ├── auth.setup.ts          # Global auth setup
│   └── guestAuth.spec.ts      # 15 tests
├── admin/
│   ├── navigation.spec.ts     # 20 tests
│   ├── contentManagement.spec.ts  # 22 tests
│   ├── emailManagement.spec.ts    # 13 tests
│   ├── dataManagement.spec.ts     # 17 tests
│   ├── userManagement.spec.ts     # 12 tests
│   ├── rsvpManagement.spec.ts     # 20 tests
│   ├── referenceBlocks.spec.ts    # 8 tests
│   ├── sectionManagement.spec.ts  # 12 tests
│   └── photoUpload.spec.ts        # 18 tests
├── guest/
│   ├── guestViews.spec.ts     # 56 tests
│   └── guestGroups.spec.ts    # 15 tests
├── system/
│   ├── routing.spec.ts        # 25 tests
│   ├── health.spec.ts         # 25 tests
│   └── uiInfrastructure.spec.ts   # 28 tests
└── accessibility/
    └── suite.spec.ts          # 52 tests
```

#### 3.2 Test Execution Flow

```
1. Global Setup
   ├── Verify database connection
   ├── Clean up test data
   ├── Verify Next.js server
   └── Create admin auth state

2. Setup Project (auth.setup.ts)
   └── Create guest auth state

3. Test Projects (Parallel)
   ├── Auth Tests (15 tests)
   ├── Admin Tests (120 tests)
   ├── Guest Tests (71 tests)
   ├── System Tests (53 tests)
   └── Accessibility Tests (52 tests)

4. Global Teardown
   ├── Clean up test data
   └── Remove auth states
```

### 4. CI/CD Integration

#### 4.1 GitHub Actions Workflow

**`.github/workflows/e2e-tests.yml`** - E2E test workflow:
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  e2e-tests:
    name: E2E Test Suite
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Create .env.e2e
        run: |
          echo "NEXT_PUBLIC_SUPABASE_URL=${{ secrets.TEST_SUPABASE_URL }}" >> .env.e2e
          echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.TEST_SUPABASE_ANON_KEY }}" >> .env.e2e
          echo "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}" >> .env.e2e
          echo "B2_ACCESS_KEY_ID=test-b2-key-id" >> .env.e2e
          echo "B2_SECRET_ACCESS_KEY=test-b2-key" >> .env.e2e
          echo "RESEND_API_KEY=test-resend-key" >> .env.e2e
          echo "TWILIO_ACCOUNT_SID=test" >> .env.e2e
          echo "TWILIO_AUTH_TOKEN=test" >> .env.e2e
          echo "GEMINI_API_KEY=test-gemini-key" >> .env.e2e
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-screenshots
          path: test-results/screenshots/
          retention-days: 7
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('test-results/e2e-results.json', 'utf8'));
            
            const passed = results.suites.reduce((sum, s) => sum + s.specs.filter(spec => spec.ok).length, 0);
            const failed = results.suites.reduce((sum, s) => sum + s.specs.filter(spec => !spec.ok).length, 0);
            const total = passed + failed;
            
            const comment = `## E2E Test Results
            
            - ✅ Passed: ${passed}/${total}
            - ❌ Failed: ${failed}/${total}
            - ⏱️ Duration: ${(results.duration / 1000).toFixed(2)}s
            
            ${failed > 0 ? '⚠️ Some tests failed. Check the artifacts for details.' : '🎉 All tests passed!'}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 5. Performance Optimization

#### 5.1 Parallel Execution Strategy

```typescript
// Optimal worker configuration
const workers = {
  local: 4,  // 4 workers for local development
  ci: 1,     // 1 worker for CI (limited resources)
};

// Test sharding for large suites
const shards = {
  total: 4,  // Split tests into 4 shards
  current: process.env.SHARD_INDEX || 1,
};
```

#### 5.2 Test Data Optimization

```typescript
// Use database transactions for faster cleanup
export async function cleanupWithTransaction() {
  const supabase = createTestClient();
  
  // Start transaction
  const { error } = await supabase.rpc('cleanup_test_data', {
    test_prefix: 'test-',
  });
  
  if (error) {
    console.error('Cleanup failed:', error);
  }
}

// Use test data snapshots
export async function createTestDataSnapshot() {
  // Create snapshot of clean database state
  // Restore snapshot before each test run
}
```

#### 5.3 Performance Monitoring

```typescript
// Track test execution time
export function measureTestPerformance(testName: string) {
  const start = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - start;
      console.log(`⏱️  ${testName}: ${duration}ms`);
      
      // Log slow tests
      if (duration > 10000) {
        console.warn(`⚠️  Slow test detected: ${testName} (${duration}ms)`);
      }
    },
  };
}
```

### 6. Coverage Verification

#### 6.1 Workflow Coverage Matrix

```typescript
// Track which workflows are covered by E2E tests
export const workflowCoverage = {
  auth: {
    guestEmailMatching: true,
    guestMagicLink: true,
    adminLogin: true,
    logout: true,
  },
  admin: {
    guestManagement: true,
    eventManagement: true,
    activityManagement: true,
    rsvpManagement: true,
    photoManagement: true,
    contentManagement: true,
    emailManagement: true,
    userManagement: true,
  },
  guest: {
    viewEvents: true,
    viewActivities: true,
    submitRsvp: true,
    viewItinerary: true,
    uploadPhotos: true,
  },
  system: {
    routing: true,
    navigation: true,
    forms: true,
    accessibility: true,
  },
};
```

#### 6.2 Coverage Reporting

```typescript
// Generate coverage report
export async function generateCoverageReport() {
  const report = {
    totalTests: 212,
    passingTests: 0,
    failingTests: 0,
    skippedTests: 0,
    coverage: {
      workflows: 0,
      criticalPaths: 0,
    },
    executionTime: 0,
  };
  
  // Calculate coverage metrics
  // Generate HTML report
  // Upload to CI artifacts
}
```

## Data Model

### Test Data Structure

```typescript
interface TestGuest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  groupId: string;
  ageType: 'adult' | 'child' | 'senior';
  guestType: 'wedding_party' | 'wedding_guest' | 'prewedding_only';
  authMethod: 'email_matching' | 'magic_link';
}

interface TestGroup {
  id: string;
  name: string;
  groupOwnerId: string | null;
}

interface TestEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  slug: string;
}

interface TestActivity {
  id: string;
  name: string;
  eventId: string;
  capacity: number;
  slug: string;
}
```

## Error Handling

### Test Failure Handling

```typescript
// Retry failed tests automatically
test.describe.configure({ retries: 2 });

// Capture context on failure
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Capture screenshot
    await page.screenshot({
      path: `test-results/failures/${testInfo.title}.png`,
    });
    
    // Capture console logs
    const logs = await page.evaluate(() => {
      return (window as any).__testLogs || [];
    });
    
    // Capture network requests
    const requests = await page.evaluate(() => {
      return (window as any).__testRequests || [];
    });
    
    // Save debug info
    await testInfo.attach('debug-info', {
      body: JSON.stringify({ logs, requests }, null, 2),
      contentType: 'application/json',
    });
  }
});
```

## Security Considerations

### 1. Test Data Isolation
- Use dedicated test database separate from production
- Clean up test data after each run
- Never use production credentials in tests

### 2. Secrets Management
- Store test credentials in GitHub Secrets
- Never commit credentials to repository
- Use environment-specific configuration

### 3. Access Control
- Test authentication and authorization
- Verify RLS policies
- Test permission boundaries

## Performance Targets

### Execution Time Targets

```
Target: <10 minutes for full suite

Breakdown:
- Setup: <1 minute
- Auth tests (15): <2 minutes
- Admin tests (120): <4 minutes
- Guest tests (71): <2 minutes
- System tests (53): <1.5 minutes
- Accessibility tests (52): <1.5 minutes
- Teardown: <30 seconds

Total: ~8 minutes (20% buffer = 10 minutes)
```

### Performance Budgets

```typescript
export const performanceBudgets = {
  testExecution: {
    individual: 30000,  // 30s per test
    suite: 600000,      // 10 minutes total
  },
  pageLoad: {
    initial: 3000,      // 3s initial load
    navigation: 1000,   // 1s navigation
  },
  api: {
    response: 500,      // 500ms API response
  },
};
```

## Monitoring and Alerting

### Test Metrics

```typescript
export interface TestMetrics {
  executionTime: number;
  passRate: number;
  flakeRate: number;
  coveragePercentage: number;
  slowTests: string[];
  failedTests: string[];
}

// Track metrics over time
export async function trackMetrics(metrics: TestMetrics) {
  // Store in test-results/metrics/
  // Generate trend reports
  // Alert on regressions
}
```

## Migration Strategy

### Phase 1: Environment Setup (Week 1)
1. Create `.env.e2e` configuration
2. Update `playwright.config.ts`
3. Verify test database connection
4. Test mock external services

### Phase 2: Infrastructure (Week 1)
1. Implement global setup/teardown
2. Create test helpers
3. Update test data factories
4. Verify cleanup utilities

### Phase 3: CI/CD Integration (Week 2)
1. Create GitHub Actions workflow
2. Configure secrets
3. Test workflow execution
4. Set up artifact upload

### Phase 4: Execution & Optimization (Week 2)
1. Run full test suite
2. Identify slow tests
3. Optimize parallel execution
4. Measure performance

### Phase 5: Monitoring & Documentation (Week 3)
1. Set up coverage reporting
2. Create performance dashboards
3. Document test patterns
4. Train team on E2E testing

## Success Criteria

### Quantitative Metrics
- ✅ All 212 tests passing (100% pass rate)
- ✅ Execution time <10 minutes
- ✅ 100% coverage of critical workflows
- ✅ Zero flaky tests (0% flake rate)
- ✅ CI/CD integration complete

### Qualitative Metrics
- ✅ Clear test organization
- ✅ Easy to add new tests
- ✅ Fast feedback on failures
- ✅ Reliable test results
- ✅ Good developer experience

## References

- [Playwright Documentation](https://playwright.dev/)
- [E2E Consolidation Progress](../../docs/E2E_CONSOLIDATION_PROGRESS.md)
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Testing Patterns](.kiro/steering/testing-patterns.md)

---

**Next Steps**: Create tasks document with implementation steps.
