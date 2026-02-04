/**
 * Test Tagging System
 * 
 * Provides utilities for tagging tests with metadata for selective execution.
 * 
 * Usage:
 * ```typescript
 * import { describeWithTags, itWithTags } from '@/__tests__/helpers/testTags';
 * 
 * describeWithTags('Guest Service', ['unit', 'fast', 'critical'], () => {
 *   itWithTags('should create guest', ['database'], async () => {
 *     // Test implementation
 *   });
 * });
 * ```
 * 
 * Run tests by tag:
 * ```bash
 * npm test -- --testNamePattern="@tag:unit"
 * npm test -- --testNamePattern="@tag:critical"
 * npm test -- --testNamePattern="@tag:fast"
 * ```
 */

/**
 * Available test tags
 */
export type TestTag =
  // Speed tags
  | 'fast'        // <100ms execution
  | 'medium'      // 100ms-1s execution
  | 'slow'        // >1s execution
  
  // Type tags
  | 'unit'        // Unit test
  | 'integration' // Integration test
  | 'e2e'         // End-to-end test
  | 'property'    // Property-based test
  | 'regression'  // Regression test
  
  // Priority tags
  | 'critical'    // Critical path (auth, payments, RLS)
  | 'important'   // Important but not critical
  | 'optional'    // Nice to have
  
  // Feature tags
  | 'auth'        // Authentication
  | 'rls'         // Row Level Security
  | 'api'         // API routes
  | 'database'    // Database operations
  | 'ui'          // UI components
  | 'email'       // Email functionality
  | 'photos'      // Photo management
  | 'rsvp'        // RSVP functionality
  | 'budget'      // Budget tracking
  | 'cms'         // Content management
  
  // Environment tags
  | 'requires-db' // Requires database connection
  | 'requires-auth' // Requires authentication
  | 'requires-server' // Requires running server
  | 'requires-browser' // Requires browser (E2E)
  
  // Stability tags
  | 'stable'      // Stable, reliable test
  | 'flaky'       // Known to be flaky
  | 'wip'         // Work in progress
  | 'skip'        // Skip this test
  ;

/**
 * Test tag metadata
 */
interface TestTagMetadata {
  tags: TestTag[];
  description?: string;
  jiraTicket?: string;
  author?: string;
}

/**
 * Format tags for test name
 */
function formatTags(tags: TestTag[]): string {
  return tags.map(tag => `@tag:${tag}`).join(' ');
}

/**
 * Describe block with tags
 * 
 * @example
 * describeWithTags('Guest Service', ['unit', 'fast', 'critical'], () => {
 *   // Tests
 * });
 */
export function describeWithTags(
  name: string,
  tags: TestTag[],
  fn: () => void
): void {
  const tagString = formatTags(tags);
  describe(`${name} ${tagString}`, fn);
}

/**
 * Test case with tags
 * 
 * @example
 * itWithTags('should create guest', ['database', 'fast'], async () => {
 *   // Test implementation
 * });
 */
export function itWithTags(
  name: string,
  tags: TestTag[],
  fn: () => void | Promise<void>,
  timeout?: number
): void {
  const tagString = formatTags(tags);
  it(`${name} ${tagString}`, fn, timeout);
}

/**
 * Skip test with tags
 */
export function itSkipWithTags(
  name: string,
  tags: TestTag[],
  fn: () => void | Promise<void>
): void {
  const tagString = formatTags(tags);
  it.skip(`${name} ${tagString}`, fn);
}

/**
 * Only run this test with tags
 */
export function itOnlyWithTags(
  name: string,
  tags: TestTag[],
  fn: () => void | Promise<void>,
  timeout?: number
): void {
  const tagString = formatTags(tags);
  it.only(`${name} ${tagString}`, fn, timeout);
}

/**
 * Test metadata decorator
 * 
 * @example
 * testMetadata({
 *   tags: ['unit', 'critical'],
 *   description: 'Tests guest creation with RLS',
 *   jiraTicket: 'PROJ-123',
 *   author: 'john@example.com'
 * });
 */
export function testMetadata(metadata: TestTagMetadata): void {
  // Store metadata for reporting
  // This can be used by custom reporters
  if (typeof expect !== 'undefined' && (expect as any).getState) {
    const state = (expect as any).getState();
    if (state.testPath) {
      // Store metadata in global registry
      if (!(global as any).__TEST_METADATA__) {
        (global as any).__TEST_METADATA__ = new Map();
      }
      (global as any).__TEST_METADATA__.set(state.testPath, metadata);
    }
  }
}

/**
 * Helper to run only fast tests
 */
export const describeFast = (name: string, fn: () => void) =>
  describeWithTags(name, ['fast'], fn);

/**
 * Helper to run only slow tests
 */
export const describeSlow = (name: string, fn: () => void) =>
  describeWithTags(name, ['slow'], fn);

/**
 * Helper to run only critical tests
 */
export const describeCritical = (name: string, fn: () => void) =>
  describeWithTags(name, ['critical'], fn);

/**
 * Helper to run only unit tests
 */
export const describeUnit = (name: string, fn: () => void) =>
  describeWithTags(name, ['unit'], fn);

/**
 * Helper to run only integration tests
 */
export const describeIntegration = (name: string, fn: () => void) =>
  describeWithTags(name, ['integration'], fn);

/**
 * Get all tags from test name
 */
export function getTagsFromTestName(testName: string): TestTag[] {
  const tagRegex = /@tag:(\w+)/g;
  const tags: TestTag[] = [];
  let match;
  
  while ((match = tagRegex.exec(testName)) !== null) {
    tags.push(match[1] as TestTag);
  }
  
  return tags;
}

/**
 * Check if test has specific tag
 */
export function hasTag(testName: string, tag: TestTag): boolean {
  return getTagsFromTestName(testName).includes(tag);
}

/**
 * Check if test has any of the specified tags
 */
export function hasAnyTag(testName: string, tags: TestTag[]): boolean {
  const testTags = getTagsFromTestName(testName);
  return tags.some(tag => testTags.includes(tag));
}

/**
 * Check if test has all of the specified tags
 */
export function hasAllTags(testName: string, tags: TestTag[]): boolean {
  const testTags = getTagsFromTestName(testName);
  return tags.every(tag => testTags.includes(tag));
}
