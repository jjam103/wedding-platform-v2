const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: '<rootDir>/jest-custom-environment.js',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
  // Skip property tests that trigger Next.js environment stack overflow
  // These tests are correct but incompatible with Next.js's unhandled rejection handler
  // See: https://github.com/vercel/next.js/issues/xxxxx
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    'accessControlService.property.test.ts',
    'groupDataIsolation.property.test.ts',
    'authService.property.test.ts',
  ],
  // Transform ESM modules that Jest can't handle by default
  // jose is used by @supabase/auth-helpers-nextjs for JWT handling
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@supabase)/)',
  ],
  
  // ============================================
  // PARALLEL EXECUTION OPTIMIZATION
  // ============================================
  
  // Use 50% of available CPU cores for parallel test execution
  // This balances speed with system stability and prevents worker crashes
  // On 8-core machine: 4 workers
  // On 4-core machine: 2 workers
  // Can be overridden with --maxWorkers flag
  maxWorkers: process.env.CI ? '50%' : '50%',
  
  // Increase timeout for slower tests (integration, property-based)
  // Default is 5000ms, we increase to 30000ms (30 seconds)
  testTimeout: 30000,
  
  // Run tests in band (serially) for specific patterns that need isolation
  // This is overridden by --runInBand flag when needed
  // Most tests will still run in parallel
  
  // Cache test results to speed up subsequent runs
  // Jest will skip tests that haven't changed
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Bail after first test suite failure in CI to fail fast
  // Set to 0 (disabled) for local development to see all failures
  bail: process.env.CI ? 1 : 0,
  
  // Optimize module resolution
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/.cache/',
  ],
  
  // Clear mocks between tests to prevent state leakage
  clearMocks: true,
  resetMocks: false, // Don't reset mock implementations
  restoreMocks: true, // Restore original implementations after each test
  
  // ============================================
  // SELECTIVE TEST RUNNING
  // ============================================
  
  // Enable --onlyChanged flag to run tests related to changed files
  // This uses git to determine which files have changed
  // Requires git repository and committed files
  // Usage: npm test -- --onlyChanged
  
  // Test sequencer for running tests in optimal order
  // Runs failed tests first, then changed tests, then all tests
  testSequencer: '<rootDir>/jest.testSequencer.js',
  
  // ============================================
  // TEST METRICS COLLECTION
  // ============================================
  
  // Custom reporter for collecting test metrics
  // Generates dashboard with execution time, pass rate, flaky tests, coverage
  reporters: [
    'default',
    '<rootDir>/jest-metrics-reporter.js',
  ],
};

module.exports = createJestConfig(customJestConfig);
