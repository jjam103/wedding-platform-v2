/**
 * Service Detector for E2E Testing
 * 
 * This module detects the test environment and automatically switches between
 * real and mock external services. This prevents real API calls during E2E tests
 * while allowing the application to use real services in production.
 */

/**
 * Determines if the application is running in E2E test mode
 */
export function isE2ETestMode(): boolean {
  // Check multiple indicators of E2E test environment
  const indicators = [
    process.env.NODE_ENV === 'test',
    process.env.E2E_TEST === 'true',
    process.env.PLAYWRIGHT_TEST === 'true',
    // Check if running with Playwright web server
    process.env.PLAYWRIGHT === '1',
    // Check for test database URL
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('test'),
  ];

  return indicators.some((indicator) => indicator === true);
}

/**
 * Determines if mock services should be used
 */
export function shouldUseMockServices(): boolean {
  // Explicit override to use mocks
  if (process.env.USE_MOCK_SERVICES === 'true') {
    return true;
  }

  // Explicit override to use real services
  if (process.env.USE_MOCK_SERVICES === 'false') {
    return false;
  }

  // Default: use mocks in E2E test mode
  return isE2ETestMode();
}

/**
 * Logs service detection decision
 */
export function logServiceDetection(serviceName: string, useMock: boolean): void {
  if (useMock) {
    console.log(`🧪 [SERVICE DETECTOR] Using MOCK ${serviceName} service (E2E test mode)`);
  } else {
    console.log(`🔌 [SERVICE DETECTOR] Using REAL ${serviceName} service (production mode)`);
  }
}

/**
 * Gets the appropriate B2 service based on environment
 */
export async function getB2Service() {
  const useMock = shouldUseMockServices();
  logServiceDetection('B2', useMock);

  if (useMock) {
    return await import('./mockB2Service');
  } else {
    return await import('@/services/b2Service');
  }
}

/**
 * Gets the appropriate Resend client based on environment
 */
export async function getResendClient() {
  const useMock = shouldUseMockServices();
  logServiceDetection('Resend', useMock);

  if (useMock) {
    const { MockResend } = await import('./mockResendService');
    return new MockResend();
  } else {
    const { Resend } = await import('resend');
    return new Resend(process.env.RESEND_API_KEY);
  }
}

/**
 * Gets the appropriate Twilio client based on environment
 */
export async function getTwilioClient() {
  const useMock = shouldUseMockServices();
  logServiceDetection('Twilio', useMock);

  if (useMock) {
    const { mockTwilio } = await import('./mockTwilioService');
    return mockTwilio('test-account-sid', 'test-auth-token');
  } else {
    const twilio = (await import('twilio')).default;
    return twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
}

/**
 * Gets the appropriate Gemini AI client based on environment
 */
export async function getGeminiClient() {
  const useMock = shouldUseMockServices();
  logServiceDetection('Gemini AI', useMock);

  if (useMock) {
    const { MockGoogleGenerativeAI } = await import('./mockGeminiService');
    return new MockGoogleGenerativeAI('test-gemini-key');
  } else {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
}

/**
 * Environment detection summary
 */
export function getEnvironmentSummary() {
  return {
    nodeEnv: process.env.NODE_ENV,
    isE2ETest: isE2ETestMode(),
    useMockServices: shouldUseMockServices(),
    indicators: {
      e2eTest: process.env.E2E_TEST,
      playwrightTest: process.env.PLAYWRIGHT_TEST,
      playwright: process.env.PLAYWRIGHT,
      testDatabase: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('test'),
    },
  };
}

/**
 * Validates that mock services are being used in test environment
 */
export function validateTestEnvironment(): void {
  if (isE2ETestMode() && !shouldUseMockServices()) {
    console.warn(
      '⚠️  [SERVICE DETECTOR] Running in E2E test mode but mock services are disabled. ' +
      'This may result in real API calls during tests!'
    );
  }
}

/**
 * Resets all mock services (for test cleanup)
 */
export async function resetAllMockServices(): Promise<void> {
  if (!shouldUseMockServices()) {
    return;
  }

  console.log('🧪 [SERVICE DETECTOR] Resetting all mock services...');

  try {
    const [mockB2, mockResend, mockTwilio, mockGemini] = await Promise.all([
      import('./mockB2Service'),
      import('./mockResendService'),
      import('./mockTwilioService'),
      import('./mockGeminiService'),
    ]);

    mockB2.resetB2Client();
    mockResend.resetMockResend();
    mockTwilio.resetMockTwilio();
    mockGemini.resetMockGemini();

    console.log('✅ [SERVICE DETECTOR] All mock services reset');
  } catch (error) {
    console.error('❌ [SERVICE DETECTOR] Failed to reset mock services:', error);
  }
}
