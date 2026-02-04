# Selective Test Running Guide

## Overview

Selective test running allows you to run only the tests that are relevant to your changes, providing faster feedback during development. This guide explains how to use the various selective test running features.

## Quick Start

### Run Only Changed Tests
```bash
# Run tests for files you've changed (requires git)
npm run test:changed

# With coverage
npm run test:changed:coverage
```

### Run Only Failed Tests
```bash
# Run tests that failed in the previous run
npm run test:failed
```

### Run Tests by Tag
```bash
# Run only fast tests (<100ms)
npm run test:fast

# Run only critical tests
npm run test:critical

# Run only unit tests
npm run test:unit

# Run tests with custom tag
npm run test:tag '@tag:auth'
```

## Test Tagging System

### Available Tags

#### Speed Tags
- `fast` - Tests that complete in <100ms
- `medium` - Tests that take 100ms-1s
- `slow` - Tests that take >1s

#### Type Tags
- `unit` - Unit tests (isolated, no external dependencies)
- `integration` - Integration tests (database, API routes)
- `e2e` - End-to-end tests (full browser automation)
- `property` - Property-based tests (fast-check)
- `regression` - Regression tests (prevent known bugs)

#### Priority Tags
- `critical` - Critical path tests (auth, payments, RLS)
- `important` - Important but not critical
- `optional` - Nice to have, can skip in quick runs

#### Feature Tags
- `auth` - Authentication tests
- `rls` - Row Level Security tests
- `api` - API route tests
- `database` - Database operation tests
- `ui` - UI component tests
- `email` - Email functionality tests
- `photos` - Photo management tests
- `rsvp` - RSVP functionality tests
- `budget` - Budget tracking tests
- `cms` - Content management tests

#### Environment Tags
- `requires-db` - Requires database connection
- `requires-auth` - Requires authentication
- `requires-server` - Requires running server
- `requires-browser` - Requires browser (E2E)

#### Stability Tags
- `stable` - Stable, reliable test
- `flaky` - Known to be flaky
- `wip` - Work in progress
- `skip` - Skip this test

### Using Tags in Tests

#### Basic Usage
```typescript
import { describeWithTags, itWithTags } from '@/__tests__/helpers/testTags';

describeWithTags('Guest Service', ['unit', 'fast', 'critical'], () => {
  itWithTags('should create guest', ['database'], async () => {
    const result = await guestService.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
    
    expect(result.success).toBe(true);
  });
  
  itWithTags('should validate email', ['fast'], () => {
    const result = validateEmail('invalid');
    expect(result).toBe(false);
  });
});
```

#### Helper Functions
```typescript
import {
  describeFast,
  describeSlow,
  describeCritical,
  describeUnit,
  describeIntegration,
} from '@/__tests__/helpers/testTags';

// Run only fast tests
describeFast('Email Validation', () => {
  it('should validate email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });
});

// Run only critical tests
describeCritical('Authentication', () => {
  it('should authenticate user', async () => {
    const result = await authService.login('user@example.com', 'password');
    expect(result.success).toBe(true);
  });
});
```

#### Multiple Tags
```typescript
// Combine multiple tags for fine-grained control
describeWithTags('RLS Policies', ['integration', 'critical', 'rls', 'requires-db'], () => {
  itWithTags('should enforce guest group access', ['database', 'auth'], async () => {
    // Test implementation
  });
});
```

### Running Tests by Tag

#### Single Tag
```bash
# Run all unit tests
npm run test:unit

# Run all fast tests
npm run test:fast

# Run all critical tests
npm run test:critical
```

#### Multiple Tags (OR logic)
```bash
# Run tests that have EITHER unit OR integration tag
npm test -- --testNamePattern='@tag:(unit|integration)'

# Run tests that have EITHER fast OR critical tag
npm test -- --testNamePattern='@tag:(fast|critical)'
```

#### Multiple Tags (AND logic)
```bash
# Run tests that have BOTH unit AND fast tags
npm test -- --testNamePattern='@tag:unit.*@tag:fast'

# Run tests that have BOTH critical AND auth tags
npm test -- --testNamePattern='@tag:critical.*@tag:auth'
```

#### Exclude Tags
```bash
# Run all tests EXCEPT slow tests
npm test -- --testNamePattern='^((?!@tag:slow).)*$'

# Run all tests EXCEPT flaky tests
npm test -- --testNamePattern='^((?!@tag:flaky).)*$'
```

## Changed File Detection

### How It Works

The `--onlyChanged` flag uses git to determine which files have changed:

1. Compares current working directory to last commit
2. Identifies changed source files
3. Finds tests that import those files
4. Runs only those tests

### Requirements

- Git repository initialized
- Files committed to git
- Changes staged or in working directory

### Usage

```bash
# Run tests for changed files
npm run test:changed

# Run with coverage
npm run test:changed:coverage

# Run in watch mode (automatically detects changes)
npm run test:watch
```

### Example Workflow

```bash
# 1. Make changes to guestService.ts
vim services/guestService.ts

# 2. Run tests for changed files only
npm run test:changed

# Output:
# Running tests for changed files...
# PASS services/guestService.test.ts
# PASS __tests__/integration/guestsApi.integration.test.ts
# 
# Tests: 2 passed, 2 total
# Time: 1.2s (vs 96s for full suite)
```

### Limitations

- Only detects changes in committed files
- May miss indirect dependencies
- Requires clean git state for accurate detection

## Test Sequencing

### Optimal Test Order

Tests run in this order for fastest feedback:

1. **Failed tests** - From previous run (immediate feedback)
2. **Unit tests** - Fast, catch most bugs
3. **Regression tests** - Prevent known bugs
4. **Property tests** - Comprehensive validation
5. **Integration tests** - Slower, but important
6. **E2E tests** - Slowest, but critical
7. **Other tests** - Uncategorized tests

### Custom Test Sequencer

The custom test sequencer (`jest.testSequencer.js`) automatically:
- Runs failed tests first
- Categorizes tests by type
- Sorts within categories for consistency
- Saves failed tests for next run

### Benefits

- **Faster feedback** - See failures immediately
- **Better prioritization** - Critical tests run first
- **Consistent results** - Same order every time
- **Efficient debugging** - Failed tests grouped together

## CI/CD Integration

### Pull Request Workflow

On pull requests, CI runs only changed tests:

```yaml
- name: Run unit & integration tests
  run: |
    if [ "${{ github.event_name }}" = "pull_request" ]; then
      npm run test:changed -- --coverage
    else
      npm run test:quick -- --coverage
    fi
```

### Benefits

- **Faster CI** - Only run relevant tests
- **Quick feedback** - See results in minutes, not hours
- **Cost savings** - Less CI compute time
- **Better DX** - Faster iteration cycles

### Main Branch Workflow

On main branch, CI runs full test suite:
- All unit tests
- All integration tests
- All E2E tests
- Full coverage report

## Performance Comparison

### Full Test Suite
```bash
npm test

# Tests: 3,355 passed, 3,355 total
# Time: 96 seconds
```

### Changed Tests Only
```bash
npm run test:changed

# Tests: 45 passed, 45 total
# Time: 3.2 seconds (30x faster!)
```

### Fast Tests Only
```bash
npm run test:fast

# Tests: 2,100 passed, 2,100 total
# Time: 12 seconds (8x faster!)
```

### Critical Tests Only
```bash
npm run test:critical

# Tests: 450 passed, 450 total
# Time: 18 seconds (5x faster!)
```

## Best Practices

### 1. Tag All Tests

```typescript
// ✅ GOOD - Tagged for selective running
describeWithTags('Guest Service', ['unit', 'fast', 'critical'], () => {
  itWithTags('should create guest', ['database'], async () => {
    // Test implementation
  });
});

// ❌ BAD - No tags, can't run selectively
describe('Guest Service', () => {
  it('should create guest', async () => {
    // Test implementation
  });
});
```

### 2. Use Appropriate Tags

```typescript
// ✅ GOOD - Accurate tags
describeWithTags('Email Validation', ['unit', 'fast'], () => {
  // Pure function, no I/O, <100ms
});

// ❌ BAD - Inaccurate tags
describeWithTags('Database Query', ['unit', 'fast'], () => {
  // Actually integration test, >1s
});
```

### 3. Run Changed Tests During Development

```bash
# ✅ GOOD - Fast feedback loop
npm run test:watch

# ❌ BAD - Slow feedback loop
npm test
```

### 4. Run Full Suite Before Commit

```bash
# ✅ GOOD - Catch all issues
npm run test:all

# ❌ BAD - Only run changed tests
npm run test:changed
```

### 5. Use Critical Tag for Important Tests

```typescript
// ✅ GOOD - Mark critical paths
describeWithTags('Authentication', ['critical', 'auth'], () => {
  // Auth tests
});

describeWithTags('RLS Policies', ['critical', 'rls'], () => {
  // RLS tests
});

// ❌ BAD - No priority indication
describe('Authentication', () => {
  // Auth tests
});
```

## Troubleshooting

### Changed Tests Not Detected

**Problem:** `--onlyChanged` doesn't detect your changes

**Solutions:**
1. Commit your changes: `git add . && git commit -m "WIP"`
2. Check git status: `git status`
3. Ensure files are tracked: `git ls-files`

### Too Many Tests Running

**Problem:** `--onlyChanged` runs too many tests

**Solutions:**
1. Use more specific tags: `npm run test:fast`
2. Run specific test file: `npm test -- path/to/test.test.ts`
3. Use test name pattern: `npm test -- --testNamePattern='specific test'`

### Tests Not Running in Expected Order

**Problem:** Tests run in wrong order

**Solutions:**
1. Check test sequencer: `jest.testSequencer.js`
2. Clear jest cache: `rm -rf .jest-cache`
3. Run with verbose: `npm test -- --verbose`

### Tags Not Working

**Problem:** Tag-based filtering doesn't work

**Solutions:**
1. Check tag format: Must be `@tag:tagname`
2. Verify test name includes tags
3. Use correct regex: `--testNamePattern='@tag:unit'`

## Advanced Usage

### Custom Tag Combinations

```bash
# Run critical auth tests only
npm test -- --testNamePattern='@tag:critical.*@tag:auth'

# Run fast unit tests only
npm test -- --testNamePattern='@tag:fast.*@tag:unit'

# Run all tests except slow and flaky
npm test -- --testNamePattern='^((?!@tag:slow|@tag:flaky).)*$'
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running tests for changed files..."
npm run test:changed

if [ $? -ne 0 ]; then
  echo "Tests failed! Commit aborted."
  exit 1
fi

echo "All tests passed!"
```

### Watch Mode with Tags

```bash
# Watch mode with fast tests only
npm test -- --watch --testNamePattern='@tag:fast'

# Watch mode with critical tests only
npm test -- --watch --testNamePattern='@tag:critical'
```

### Coverage for Changed Files

```bash
# Coverage for changed files only
npm run test:changed:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Migration Guide

### Adding Tags to Existing Tests

1. **Identify test type:**
   - Unit test? Add `@tag:unit`
   - Integration test? Add `@tag:integration`
   - E2E test? Add `@tag:e2e`

2. **Measure execution time:**
   - <100ms? Add `@tag:fast`
   - 100ms-1s? Add `@tag:medium`
   - >1s? Add `@tag:slow`

3. **Determine priority:**
   - Auth, RLS, payments? Add `@tag:critical`
   - Important feature? Add `@tag:important`
   - Nice to have? Add `@tag:optional`

4. **Add feature tags:**
   - Auth tests? Add `@tag:auth`
   - Database tests? Add `@tag:database`
   - API tests? Add `@tag:api`

### Example Migration

**Before:**
```typescript
describe('Guest Service', () => {
  it('should create guest', async () => {
    // Test implementation
  });
});
```

**After:**
```typescript
import { describeWithTags, itWithTags } from '@/__tests__/helpers/testTags';

describeWithTags('Guest Service', ['unit', 'fast', 'critical'], () => {
  itWithTags('should create guest', ['database'], async () => {
    // Test implementation
  });
});
```

## References

- [Jest CLI Options](https://jestjs.io/docs/cli)
- [Jest Watch Plugins](https://jestjs.io/docs/watch-plugins)
- [Test Tagging Utilities](../__tests__/helpers/testTags.ts)
- [Custom Test Sequencer](../jest.testSequencer.js)
- [Parallel Test Execution](./PARALLEL_TEST_EXECUTION.md)
- [Testing Standards](../.kiro/steering/testing-standards.md)

## Summary

Selective test running provides:
- ✅ **Faster feedback** - Run only relevant tests
- ✅ **Better prioritization** - Critical tests first
- ✅ **Efficient CI** - Only run changed tests on PRs
- ✅ **Flexible filtering** - Tag-based test selection
- ✅ **Optimal ordering** - Failed tests run first

Use selective test running during development for fast iteration, but always run the full suite before committing to catch all issues.
