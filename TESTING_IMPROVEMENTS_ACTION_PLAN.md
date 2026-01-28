# Testing Improvements Action Plan

## Quick Wins (Implement Now)

### 1. Add Build Verification to Test Script
**Time**: 5 minutes  
**Impact**: High

```json
// package.json
{
  "scripts": {
    "test": "npm run build && jest",
    "test:quick": "jest",
    "test:full": "npm run build && npm test && npm run test:e2e"
  }
}
```

**Why**: Catches compilation errors before tests run

### 2. Create Pre-commit Hook
**Time**: 10 minutes  
**Impact**: High

```bash
# .husky/pre-commit
#!/bin/sh
npm run build
npm run test:quick
```

**Why**: Prevents committing broken code

### 3. Update CI/CD Pipeline
**Time**: 15 minutes  
**Impact**: High

```yaml
# .github/workflows/test.yml
- name: Build
  run: npm run build
- name: Test
  run: npm test
- name: E2E
  run: npm run test:e2e
```

**Why**: Catches issues before merge

## Medium-term Improvements (Next Sprint)

### 4. Real API Integration Tests
**Time**: 2-3 hours  
**Impact**: High

Create `__tests__/integration/realApi.integration.test.ts`:

```typescript
import { spawn } from 'child_process';

describe('Real API Integration', () => {
  let server;
  
  beforeAll(async () => {
    server = spawn('npm', ['run', 'dev']);
    await waitForServer(3000);
  });
  
  afterAll(() => server.kill());
  
  test('locations API works', async () => {
    const res = await fetch('http://localhost:3000/api/admin/locations');
    expect(res.ok).toBe(true);
  });
});
```

**Why**: Tests actual runtime behavior

### 5. Smoke Tests for All API Routes
**Time**: 1-2 hours  
**Impact**: Medium

```typescript
// __tests__/smoke/apiRoutes.smoke.test.ts
const API_ROUTES = [
  '/api/admin/locations',
  '/api/admin/guests',
  '/api/admin/activities',
  // ... all routes
];

describe('API Smoke Tests', () => {
  API_ROUTES.forEach(route => {
    test(`${route} responds`, async () => {
      const res = await fetch(`http://localhost:3000${route}`);
      expect(res.status).toBeLessThan(500);
    });
  });
});
```

**Why**: Quickly validates all endpoints work

### 6. Update Mock Strategy
**Time**: 3-4 hours  
**Impact**: Medium

Replace Jest mocks with MSW (Mock Service Worker):

```typescript
// __tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/admin/locations', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: [] }));
  }),
];
```

**Why**: Mocks at network level, closer to reality

## Long-term Improvements (Next Quarter)

### 7. Contract Testing
**Time**: 1 week  
**Impact**: High

Use Pact or similar for API contract testing:

```typescript
// Define contract
const contract = {
  request: {
    method: 'GET',
    path: '/api/admin/locations',
  },
  response: {
    status: 200,
    body: {
      success: true,
      data: arrayOf(locationSchema),
    },
  },
};
```

**Why**: Ensures API contracts don't break

### 8. Type-safe API Client
**Time**: 1 week  
**Impact**: Medium

Generate types from API routes:

```typescript
// Auto-generated from routes
type LocationsAPI = {
  GET: {
    response: Result<LocationWithChildren[]>;
  };
  POST: {
    request: CreateLocationDTO;
    response: Result<Location>;
  };
};
```

**Why**: Type safety across frontend/backend

### 9. Staging Environment with Automated Tests
**Time**: 2 weeks  
**Impact**: High

- Set up staging environment
- Deploy on every PR
- Run full test suite
- Block merge if tests fail

**Why**: Catches issues before production

### 10. Visual Regression Testing
**Time**: 1 week  
**Impact**: Medium

Use Percy or Chromatic for visual testing:

```typescript
test('admin dashboard looks correct', async ({ page }) => {
  await page.goto('/admin');
  await percySnapshot(page, 'Admin Dashboard');
});
```

**Why**: Catches UI regressions

## Metrics to Track

### Before Improvements
- Build failures caught: 0% (in tests)
- API coverage: ~30% (mocked only)
- E2E coverage: ~10% (manual)
- Time to detect issues: Days/weeks

### After Improvements
- Build failures caught: 100% (in CI)
- API coverage: ~80% (real + mocked)
- E2E coverage: ~50% (automated)
- Time to detect issues: Minutes

## Priority Matrix

```
High Impact, Low Effort:
1. Build verification in tests ⭐⭐⭐
2. Pre-commit hooks ⭐⭐⭐
3. CI/CD updates ⭐⭐⭐

High Impact, High Effort:
4. Real API tests ⭐⭐
5. Contract testing ⭐⭐
6. Staging environment ⭐⭐

Medium Impact, Low Effort:
7. Smoke tests ⭐
8. Update mocks ⭐

Medium Impact, High Effort:
9. Type-safe client ⭐
10. Visual regression ⭐
```

## Implementation Timeline

### Week 1 (Quick Wins)
- Day 1: Build verification
- Day 2: Pre-commit hooks
- Day 3: CI/CD updates
- Day 4-5: Documentation

### Week 2-3 (Medium-term)
- Week 2: Real API tests + Smoke tests
- Week 3: Update mock strategy

### Month 2-3 (Long-term)
- Month 2: Contract testing + Type-safe client
- Month 3: Staging environment + Visual regression

## Success Criteria

### Phase 1 (Quick Wins)
- ✅ All tests run after build
- ✅ Pre-commit hooks prevent broken commits
- ✅ CI/CD catches issues before merge

### Phase 2 (Medium-term)
- ✅ 50+ real API integration tests
- ✅ Smoke tests for all routes
- ✅ MSW replaces Jest mocks

### Phase 3 (Long-term)
- ✅ Contract tests for all APIs
- ✅ Type-safe API client
- ✅ Staging environment with automated tests
- ✅ Visual regression tests

## Resources Needed

### Tools
- MSW (Mock Service Worker) - Free
- Pact (Contract testing) - Free
- Percy/Chromatic (Visual testing) - $$$
- Staging server - $$

### Time
- Developer time: ~40 hours total
- DevOps time: ~20 hours (staging setup)
- Total: ~2 months part-time

### Budget
- Visual testing tool: ~$150/month
- Staging server: ~$50/month
- Total: ~$200/month

## Next Steps

1. **This Week**: Implement quick wins (1-3)
2. **Next Sprint**: Plan medium-term improvements (4-6)
3. **Next Quarter**: Roadmap long-term improvements (7-10)

## Questions to Answer

- [ ] Which visual testing tool? (Percy vs Chromatic)
- [ ] Where to host staging? (Vercel vs AWS)
- [ ] Contract testing framework? (Pact vs Dredd)
- [ ] Budget approval for tools?

## Conclusion

These improvements will:
- Catch issues earlier (minutes vs days)
- Increase confidence in deployments
- Reduce production bugs
- Improve developer experience

Start with quick wins this week, then gradually implement medium and long-term improvements.
