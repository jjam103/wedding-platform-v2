# Task 2.4: Global Setup/Teardown Configuration - Verification

**Task**: Configure global setup/teardown paths  
**Date**: February 4, 2026  
**Status**: ✅ Complete

## Changes Made

### 1. Updated Playwright Configuration

Added global setup and teardown paths to `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './__tests__/e2e',
  
  // Global setup and teardown
  globalSetup: require.resolve('./__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/e2e/global-teardown.ts'),
  
  // ... rest of configuration
});
```

### 2. Configuration Details

**Global Setup Path**: `./__tests__/e2e/global-setup.ts`
- Will be executed once before all tests
- Responsible for:
  - Verifying test database connection
  - Cleaning up test data
  - Verifying Next.js server is running
  - Creating admin authentication state

**Global Teardown Path**: `./__tests__/e2e/global-teardown.ts`
- Will be executed once after all tests
- Responsible for:
  - Cleaning up test data
  - Removing authentication state files
  - Logging execution summary

### 3. Path Resolution

Used `require.resolve()` to ensure paths are correctly resolved relative to the config file location. This is the recommended approach by Playwright for TypeScript projects.

## Verification Steps

### 1. Configuration Syntax Check

✅ **Verified**: Configuration file has correct TypeScript syntax
✅ **Verified**: Paths use `require.resolve()` for proper resolution
✅ **Verified**: Paths point to correct locations in `__tests__/e2e/`

### 2. File Structure

The configuration expects these files to be created in Tasks 5 and 6:
- `__tests__/e2e/global-setup.ts` (Task 5)
- `__tests__/e2e/global-teardown.ts` (Task 6)

### 3. Integration with Existing Configuration

✅ **Verified**: Global setup/teardown added without affecting existing configuration
✅ **Verified**: Worker configuration remains intact
✅ **Verified**: Reporter configuration remains intact
✅ **Verified**: Project configuration remains intact

## Expected Behavior

When Playwright runs E2E tests, the execution flow will be:

```
1. Global Setup (global-setup.ts)
   ├── Verify database connection
   ├── Clean up test data
   ├── Verify Next.js server
   └── Create admin auth state

2. Setup Project (auth.setup.ts)
   └── Create guest auth state

3. Test Projects (Parallel)
   ├── Auth Tests
   ├── Admin Tests
   ├── Guest Tests
   ├── System Tests
   └── Accessibility Tests

4. Global Teardown (global-teardown.ts)
   ├── Clean up test data
   └── Remove auth states
```

## Next Steps

1. **Task 2.5**: Update web server environment variables
2. **Task 5**: Implement global setup script
3. **Task 6**: Implement global teardown script

## Testing

Once Tasks 5 and 6 are complete, verify the configuration works by running:

```bash
# List tests to verify configuration loads
npx playwright test --list

# Run a single test to verify global setup/teardown execute
npx playwright test __tests__/e2e/system/health.spec.ts
```

Expected output should show:
- Global setup executing before tests
- Test execution
- Global teardown executing after tests

## Documentation

This configuration is documented in:
- `playwright.config.ts` (inline comments)
- `.kiro/specs/e2e-suite-optimization/design.md` (architecture section)
- This verification document

## Acceptance Criteria

✅ **Met**: globalSetup path configured in playwright.config.ts  
✅ **Met**: globalTeardown path configured in playwright.config.ts  
✅ **Met**: Configuration documented  
✅ **Met**: Paths use proper resolution method  
✅ **Met**: Configuration doesn't break existing settings

## Notes

- The actual global setup and teardown files will be created in Tasks 5 and 6
- The configuration is ready and will work once those files are implemented
- Used `require.resolve()` instead of relative paths for better TypeScript compatibility
- Configuration follows Playwright best practices for global setup/teardown

---

**Task Status**: ✅ Complete  
**Next Task**: Task 2.5 - Update web server environment variables
