# Service Test Priority Matrix

**Date**: January 29, 2026  
**Task**: 2.3 - Fix Failing Service Tests  
**Status**: Identification Complete - Ready for Execution

## Quick Stats

- **Total Services**: 14 (excluding property tests)
- **Completed**: 5 services (35.7%)
- **Major Progress**: 2 services (rsvpAnalyticsService 75%, transportationService 65.2%)
- **Remaining**: 9 services with 167 failing tests
- **Overall Pass Rate**: 75.7% (521/689 tests)
- **Target**: 100% (689/689 tests)

## Execution Priority

### 🔴 CRITICAL - Complete Nearly-Fixed (2 services, ~3-4 hours)
**ROI**: Highest - Already 70%+ complete

| Service | Tests Failing | Pass Rate | Time Est. | Pattern |
|---------|--------------|-----------|-----------|---------|
| rsvpAnalyticsService.test.ts | 1 | 75% | 30-60 min | Debug Promise.all mocks |
| transportationService.test.ts | 8 | 65.2% | 2-3 hours | Mock chain patterns |

**Why First**: Highest return on investment - minimal work for maximum test coverage gain.

### 🟠 HIGH - Apply Known Patterns (3 services, ~6-10 hours)
**ROI**: High - Proven patterns ready to apply

| Service | Tests Failing | Time Est. | Pattern |
|---------|--------------|-----------|---------|
| vendorService.test.ts | ~25 | 2-3 hours | Pattern A (emailQueueService) |
| photoService.test.ts | 13 | 2-3 hours | Fix Supabase mock chains |
| smsService.test.ts | 20 | 2-4 hours | Fix Twilio + DB mocking |

**Why Second**: Proven patterns exist - straightforward application with predictable outcomes.

### 🟡 MEDIUM - Smaller Fixes (4 services, ~4-6 hours)
**ROI**: Medium - Smaller scope but varied issues

| Service | Tests Failing | Time Est. | Pattern |
|---------|--------------|-----------|---------|
| accommodationService.test.ts | 1 | 15-30 min | Single test fix |
| externalServiceGracefulDegradation.test.ts | 7 | 1-2 hours | S3Client + failover mocking |
| budgetService.test.ts | 9 | 1-2 hours | Mock chain setup |
| rsvpReminderService.test.ts | ~4-8 | 1-2 hours | Standard Supabase patterns |

**Why Third**: Lower impact per hour invested - tackle after high-ROI items complete.

## Recommended Daily Schedule

### Day 1 (4 hours) - Critical Priority
- **Morning** (2 hours): Fix rsvpAnalyticsService.test.ts + transportationService.test.ts (partial)
- **Afternoon** (2 hours): Complete transportationService.test.ts
- **Goal**: 7/14 services complete (50%)

### Day 2 (8 hours) - High Priority
- **Morning** (3 hours): Fix vendorService.test.ts
- **Afternoon** (5 hours): Fix photoService.test.ts + smsService.test.ts (partial)
- **Goal**: 9/14 services complete (64%)

### Day 3 (6 hours) - High + Medium Priority
- **Morning** (2 hours): Complete smsService.test.ts
- **Afternoon** (4 hours): Fix accommodationService + externalServiceGracefulDegradation + budgetService
- **Goal**: 13/14 services complete (93%)

### Day 4 (2 hours) - Final Cleanup
- **Morning** (2 hours): Fix rsvpReminderService.test.ts + final verification
- **Goal**: 14/14 services complete (100%)

## Pattern Reference

### Pattern A: External Client Creation
**Use When**: Service creates its own Supabase client with `createClient()`

```typescript
jest.mock('@supabase/supabase-js', () => {
  const mockFrom = jest.fn();
  const mockSupabaseClient = { from: mockFrom };
  return {
    createClient: jest.fn(() => mockSupabaseClient),
    __mockFrom: mockFrom,
  };
});
```

**Apply To**: vendorService.test.ts

### Pattern B: Module-Level Mocking
**Use When**: Service imports from `@/lib/supabase`

```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() }
}));
```

**Apply To**: Most services (already applied to completed services)

### Pattern C: External Service Mocking
**Use When**: Service calls external APIs (Twilio, S3, etc.)

```typescript
jest.mock('twilio', () => ({
  Twilio: jest.fn(() => ({
    messages: { create: jest.fn() }
  }))
}));
```

**Apply To**: smsService.test.ts, externalServiceGracefulDegradation.test.ts

## Success Criteria

- [ ] All 14 service test suites passing (100%)
- [ ] 689/689 tests passing (currently 521/689)
- [ ] No skipped tests
- [ ] All patterns documented
- [ ] Test execution time < 5 seconds (currently 2.936s ✅)

## Risk Mitigation

### High-Risk Services
1. **smsService.test.ts** (20 failures) - Most complex external service mocking
2. **externalServiceGracefulDegradation.test.ts** (7 failures) - Multiple service failover scenarios

### Mitigation Strategy
- Start with proven patterns (Pattern A for vendorService)
- Document any new patterns discovered
- Run full test suite after each service fix
- Keep changes minimal and focused

## Next Steps

1. ✅ Identification complete
2. ⏭️ Start with Phase 1 (Critical Priority)
3. ⏭️ Apply proven patterns in Phase 2
4. ⏭️ Complete smaller fixes in Phase 3
5. ⏭️ Final verification and documentation

## Documentation

- **Detailed Analysis**: `REMAINING_FAILING_SERVICES.md`
- **Pattern Guide**: `docs/TESTING_PATTERN_A_GUIDE.md`
- **Task List**: `.kiro/specs/test-suite-health-check/tasks.md`
- **This Matrix**: `SERVICE_TEST_PRIORITY_MATRIX.md`
