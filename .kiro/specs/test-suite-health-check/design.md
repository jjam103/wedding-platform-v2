# Test Suite Health Check - Design

## Fix Strategy

### Phase 1: Critical Blockers (HIGH PRIORITY)
Fix issues that prevent any tests from running.

#### 1.1 Build Script Fix
**Problem**: `validate-contracts.ts` uses ES module syntax but runs with ts-node in CommonJS mode

**Solution**:
- Convert script to use `.mjs` extension OR
- Update ts-node configuration to support ES modules OR
- Temporarily bypass validation in test command

**Files**:
- `scripts/validate-contracts.ts`
- `package.json` (test script)

#### 1.2 TypeScript Mock Fixes
**Problem**: Supabase mock return types don't match expected types

**Solution**:
- Update mock helper to properly type `mockReturnValue` chains
- Add explicit type annotations to mock functions
- Fix `mockResolvedValue` to return properly typed objects

**Pattern**:
```typescript
// Before (causes type errors)
mockSupabase.from.mockReturnValue({
  select: jest.fn().mockReturnValue({
    single: jest.fn().mockResolvedValue({ data: {...}, error: null })
  })
});

// After (properly typed)
const mockSelect = jest.fn().mockReturnValue({
  single: jest.fn().mockResolvedValue({ data: {...}, error: null })
});
const mockFrom = jest.fn().mockReturnValue({
  select: mockSelect
});
mockSupabase.from = mockFrom as any;
```

**Files**: All `*.test.ts` files with Supabase mocks

#### 1.3 MockFile Implementation
**Problem**: Missing `bytes` property required by File interface

**Solution**:
```typescript
class MockFile implements File {
  // ... existing properties
  async bytes(): Promise<Uint8Array> {
    return new Uint8Array(await this.arrayBuffer());
  }
}
```

**Files**: `utils/fileValidation.test.ts`

### Phase 2: Integration Test Stability (HIGH PRIORITY)

#### 2.1 Worker Process Crashes
**Problem**: Jest workers terminated with SIGTERM/SIGABRT

**Root Causes**:
- Memory leaks in test setup
- Unhandled promise rejections
- Circular dependencies in imports

**Solutions**:
- Add proper cleanup in `afterEach` hooks
- Wrap async operations in try-catch
- Reduce worker count for integration tests
- Add `--detectOpenHandles` flag to identify leaks

**Configuration**:
```javascript
// jest.config.js
module.exports = {
  maxWorkers: 2, // Reduce for integration tests
  testTimeout: 10000, // Increase timeout
  forceExit: true, // Force exit after tests
};
```

#### 2.2 Request Not Defined Error
**Problem**: Next.js `Request` object not available in test environment

**Solution**:
- Mock Next.js server context properly
- Use `node-mocks-http` for request/response mocking
- Add polyfills for Web APIs in Jest setup

**Files**:
- `jest.setup.js`
- `__tests__/integration/locationsApi.integration.test.ts`

#### 2.3 Empty API Responses
**Problem**: API routes returning `{}` instead of proper error format

**Solution**:
- Ensure all API routes use consistent error handling
- Add middleware to enforce response format
- Update tests to properly mock authentication

**Pattern**:
```typescript
// API Route
export async function GET(request: Request) {
  try {
    // ... logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'ERROR', message: 'Failed' } },
      { status: 500 }
    );
  }
}
```

### Phase 3: Component Test Fixes (MEDIUM PRIORITY)

#### 3.1 Infinite Render Loop Fix
**Problem**: `app/admin/vendors/page.tsx` has useEffect without proper dependencies

**Current Code**:
```typescript
useEffect(() => {
  fetchVendors();
}, []); // Missing dependencies

const fetchVendors = async () => {
  // ... fetch logic
  setVendors(result.data.vendors || []);
};
```

**Solution**:
```typescript
const fetchVendors = useCallback(async () => {
  // ... fetch logic
  setVendors(result.data.vendors || []);
}, [addToast]); // Add dependencies

useEffect(() => {
  fetchVendors();
}, [fetchVendors]);
```

**Files**:
- `app/admin/vendors/page.tsx`
- `app/admin/activities/page.tsx`
- `app/admin/guests/page.tsx`

#### 3.2 Test Timeout Issues
**Problem**: Async operations in tests exceed 5000ms timeout

**Solutions**:
- Increase timeout for specific tests: `it('test', async () => {...}, 10000)`
- Mock slow operations (API calls, database queries)
- Use `waitFor` with explicit timeout
- Ensure proper cleanup to prevent hanging promises

**Pattern**:
```typescript
it('should load data', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  }, { timeout: 10000 });
}, 15000); // Test timeout
```

#### 3.3 Duplicate Element Queries
**Problem**: Multiple elements with same text causing query failures

**Solution**:
- Use more specific queries: `getByRole`, `getByTestId`
- Add `data-testid` attributes to components
- Use `getAllByText` when multiple elements expected
- Query within specific containers

**Pattern**:
```typescript
// Before
expect(screen.getByText('Vendor Name')).toBeInTheDocument();

// After
const table = screen.getByRole('table');
expect(within(table).getByText('Vendor Name')).toBeInTheDocument();
```

### Phase 4: Property Test Stabilization (MEDIUM PRIORITY)

#### 4.1 Unique Test Data Generation
**Problem**: Property tests generate duplicate data causing conflicts

**Solution**:
- Add unique identifiers to generated data
- Use `fc.uniqueArray` for collections
- Clear state between property test runs

**Pattern**:
```typescript
fc.assert(
  fc.property(
    fc.uniqueArray(vendorArbitrary, { 
      minLength: 1, 
      maxLength: 10,
      selector: (v) => v.name // Ensure unique names
    }),
    async (vendors) => {
      // Test logic
    }
  ),
  { numRuns: 50 }
);
```

#### 4.2 Query Specificity
**Problem**: Tests fail when multiple elements match query

**Solution**:
- Use `*AllBy*` variants when appropriate
- Add container-scoped queries
- Use `data-testid` for property tests

### Phase 5: Smoke Test Improvements (LOW PRIORITY)

#### 5.1 Consistent Error Format
**Problem**: Some endpoints return empty objects

**Solution**:
- Add API response validation middleware
- Ensure all error paths return proper format
- Add integration tests for error scenarios

#### 5.2 Content-Type Headers
**Problem**: Some responses missing proper headers

**Solution**:
- Ensure all API routes set `Content-Type: application/json`
- Use `NextResponse.json()` consistently
- Add header validation to smoke tests

## Testing Strategy

### Test Execution Order
1. Fix TypeScript errors first (enables type checking)
2. Fix build scripts (enables test execution)
3. Fix integration tests (validates API layer)
4. Fix component tests (validates UI layer)
5. Fix property tests (validates business rules)
6. Fix smoke tests (validates contracts)

### Validation Approach
After each phase:
1. Run `npm run test:types` - must pass
2. Run affected test suite - must pass
3. Run full test suite - check for regressions
4. Commit fixes with descriptive message

### Rollback Strategy
- Each fix committed separately
- If fix causes regressions, revert and reassess
- Document any skipped tests with TODO comments

## Performance Improvements

### Parallel Execution
- Keep unit tests at maxWorkers=4
- Reduce integration tests to maxWorkers=2
- Run E2E tests sequentially

### Test Optimization
- Mock external services consistently
- Reduce test data size where possible
- Use `beforeAll` for expensive setup
- Clear mocks in `afterEach`, not `beforeEach`

### Target Metrics
- Total execution time: < 300 seconds (from 680s)
- Integration tests: < 60 seconds
- Component tests: < 120 seconds
- Property tests: < 60 seconds

## Risk Mitigation

### High-Risk Changes
- Supabase mock updates (affects 100+ tests)
- useEffect dependency fixes (may change behavior)
- Integration test environment setup

### Mitigation Strategies
- Test each fix in isolation
- Run full suite after each change
- Keep changes minimal and focused
- Document any behavior changes

### Rollback Plan
- Git commit after each successful fix
- Tag stable states
- Maintain changelog of fixes
- Document any breaking changes
