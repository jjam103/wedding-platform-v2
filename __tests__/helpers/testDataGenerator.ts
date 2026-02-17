/**
 * Test Data Generator
 * 
 * Generates unique test data to prevent race conditions in parallel test execution.
 * Each test gets unique identifiers based on test name, timestamp, and random values.
 */

/**
 * Generate unique test data for a test
 * 
 * @param testName - Name of the test (used as prefix)
 * @returns Object with unique identifiers for test data
 * 
 * @example
 * const testData = generateUniqueTestData('create-guest');
 * // Returns: {
 * //   testId: 'create-guest-1708123456789-abc123',
 * //   email: 'test-create-guest-1708123456789-abc123@example.com',
 * //   groupName: 'Test Group create-guest-1708123456789-abc123',
 * //   ...
 * // }
 */
export function generateUniqueTestData(testName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const testId = `${testName}-${timestamp}-${random}`;
  
  return {
    testId,
    email: `test-${testId}@example.com`,
    groupName: `Test Group ${testId}`,
    eventName: `Test Event ${testId}`,
    activityName: `Test Activity ${testId}`,
    accommodationName: `Test Hotel ${testId}`,
    locationName: `Test Location ${testId}`,
    slug: `test-${testId}`,
    firstName: `Test`,
    lastName: `User ${random}`,
  };
}

/**
 * Generate unique email for test
 * 
 * @param prefix - Optional prefix for email (default: 'test')
 * @returns Unique email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate unique name for test entity
 * 
 * @param entityType - Type of entity (e.g., 'Group', 'Event', 'Activity')
 * @returns Unique name
 */
export function generateUniqueName(entityType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `Test ${entityType} ${timestamp}-${random}`;
}

/**
 * Generate unique slug for test
 * 
 * @param prefix - Optional prefix for slug (default: 'test')
 * @returns Unique slug
 */
export function generateUniqueSlug(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate unique session token
 * 
 * @returns 64-character hex string
 */
export function generateSessionToken(): string {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Generate unique test ID
 * 
 * @param prefix - Optional prefix (default: 'test')
 * @returns Unique test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

export default {
  generateUniqueTestData,
  generateUniqueEmail,
  generateUniqueName,
  generateUniqueSlug,
  generateSessionToken,
  generateTestId,
};
