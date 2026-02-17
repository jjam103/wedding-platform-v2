# E2E Test Improvement - Master Plan

**Date**: February 16, 2026  
**Purpose**: Complete guide for understanding and executing the full E2E test improvement plan

---

## Quick Navigation

### Understanding the Situation
- **[Context Summary](E2E_FEB16_2026_CONTEXT_SUMMARY.md)** - What we're doing and why (START HERE)
- **[Failed Tests vs Race Condition Fixes](E2E_FEB16_2026_FAILED_TESTS_VS_RACE_CONDITION_FIXES.md)** - Understanding the two separate issues

### Current Work (Phase 2: Race Condition Prevention)
- **[Phase 2 Index](E2E_FEB16_2026_PHASE2_INDEX.md)** - Master navigation for Phase 2
- **[Phase 2 P1 Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md)** - What we've done (17 tests)
- **[Phase 2 P2 Quick Start](E2E_FEB16_2026_PHASE2_P2_QUICK_START.md)** - How to start next phase (~90 tests)

### Future Work (Fixing the 27 Failed Tests)
- **[Single Worker Analysis](E2E_FEB16_2026_SINGLE_WORKER_ANALYSIS.md)** - Detailed breakdown of the 27 failures
- **[Systematic Fix Plan](E2E_FEB16_2026_SYSTEMATIC_FIX_PLAN.md)** - How to fix them

### Helper Functions
- **[Wait Helpers Source](__tests__/helpers/waitHelpers.ts)** - The actual helper code
- **[Usage Guide](__tests__/helpers/E2E_HELPERS_USAGE_GUIDE.md)** - How to use the helpers

---

## The Big Picture

### Current Test Status (332 total tests)

| Category | Count | % | Status |
|----------|-------|---|--------|
| **Passing** | 275 | 82.8% | ✅ Working, some have flaky timeouts |
| **Failing** | 27 | 8.1% | ❌ Consistently broken |
| **Flaky** | 2 | 0.6% | ⚠️ Sometimes pass/fail |
| **Skipped** | 8 | 2.4% | ⏭️ Intentionally disabled |
| **Debug** | 4 | 1.2% | 🗑️ Should be removed |
| **Other** | 16 | 4.8% | 🔍 Need investigation |

---

## The Two Separate Workstreams

### Workstream 1: Race Condition Prevention (Current Focus)

**What**: Replace manual timeouts with semantic wait helpers  
**Target**: ~107 tests (17 done, ~90 remaining)  
**Duration**: 2-3 weeks  
**Impact**: Makes passing tests more reliable, prevents future flakiness

**Status**:
- ✅ Phase 2 P1 Complete (17 tests)
- 🔄 Phase 2 P2 Ready to Begin (~90 tests)

**Documents to Read**:
1. [Context Summary](E2E_FEB16_2026_CONTEXT_SUMMARY.md) - Understand what we're doing
2. [Phase 2 P2 Quick Start](E2E_FEB16_2026_PHASE2_P2_QUICK_START.md) - How to begin
3. [Phase 2 P1 Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md) - Examples and patterns

### Workstream 2: Fix the 27 Failed Tests (Future Work)

**What**: Fix underlying bugs causing consistent failures  
**Target**: 27 tests  
**Duration**: 1-2 weeks  
**Impact**: Increases pass rate from 82% to 90%+

**Status**: Documented but not started

**Documents to Read**:
1. [Failed Tests vs Race Condition Fixes](E2E_FEB16_2026_FAILED_TESTS_VS_RACE_CONDITION_FIXES.md) - Why they're separate
2. [Single Worker Analysis](E2E_FEB16_2026_SINGLE_WORKER_ANALYSIS.md) - Detailed breakdown
3. [Systematic Fix Plan](E2E_FEB16_2026_SYSTEMATIC_FIX_PLAN.md) - How to fix them

---

## Timeline

### Completed ✅
- **Phase 2 P1** (Feb 14-16, 2026)
  - 17 tests updated with race condition prevention helpers
  - 40+ manual timeouts removed
  - 53+ semantic waits added
  - 82% pass rate (14/17 tests passing)

### In Progress 🔄
- **Phase 2 P2** (Feb 17 - Mar 7, 2026)
  - Apply helpers to ~90 more tests
  - 7 test suites to update
  - Priority 1: Content Management, Data Management, Email Management
  - Priority 2: Section Management, Photo Upload
  - Priority 3: Guest Views, Guest Groups

### Future ⏳
- **Fix 27 Failed Tests** (Mar 8-21, 2026)
  - Fix authentication setup (5 tests)
  - Fix CSS loading (6 tests)
  - Fix navigation (4 tests)
  - Fix reference blocks (3 tests)
  - Fix UI infrastructure (4 tests)
  - Remove debug tests (4 tests)
  - Fix other issues (1 test)

---

## How to Use This Master Plan

### If You're Starting Fresh

1. **Read**: [Context Summary](E2E_FEB16_2026_CONTEXT_SUMMARY.md)
   - Understand what we're doing and why
   - Learn about the two separate issues

2. **Read**: [Failed Tests vs Race Condition Fixes](E2E_FEB16_2026_FAILED_TESTS_VS_RACE_CONDITION_FIXES.md)
   - Understand why they're different problems
   - See the evidence

3. **Read**: [Phase 2 P2 Quick Start](E2E_FEB16_2026_PHASE2_P2_QUICK_START.md)
   - Learn how to begin Phase 2 P2
   - See the patterns and examples

4. **Start Work**: Begin with Content Management tests

### If You're Continuing Phase 2 P2

1. **Check**: [Phase 2 Index](E2E_FEB16_2026_PHASE2_INDEX.md)
   - See overall progress
   - Navigate to relevant documents

2. **Review**: [Phase 2 P1 Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md)
   - See examples of completed work
   - Review patterns

3. **Work**: Apply helpers to next test suite

### If You're Planning to Fix the 27 Failed Tests

1. **Read**: [Single Worker Analysis](E2E_FEB16_2026_SINGLE_WORKER_ANALYSIS.md)
   - Understand the root causes
   - See the breakdown by category

2. **Read**: [Systematic Fix Plan](E2E_FEB16_2026_SYSTEMATIC_FIX_PLAN.md)
   - See the priority order
   - Understand the fix approach

3. **Start**: Begin with Priority 1 (authentication setup)

---

## Key Concepts

### What Are Race Condition Fixes?

**Problem**: Tests use arbitrary timeouts that cause random failures
```typescript
await button.click();
await page.waitForTimeout(2000); // Hope 2 seconds is enough
```

**Solution**: Wait for actual conditions
```typescript
await button.click();
await waitForStyles(page);
await waitForCondition(async () => {
  return await toast.isVisible();
}, 5000);
```

**Benefit**: Tests are faster, more reliable, and easier to debug

### What Are the 27 Failed Tests?

**Problem**: Tests consistently fail due to real bugs
- Authentication setup broken
- CSS not loading
- Navigation issues
- Reference blocks broken
- UI infrastructure problems

**Solution**: Fix the underlying bugs
- Fix authentication mechanism
- Fix CSS delivery
- Fix navigation logic
- Fix reference block creation
- Remove debug tests

**Benefit**: Increases pass rate from 82% to 90%+

---

## Success Metrics

### Phase 2 P1 (Complete)
- ✅ 100% of tests updated (17/17)
- ✅ 0 manual timeouts remaining
- ✅ 53+ semantic waits added
- ✅ 25% code reduction
- ✅ 82% pass rate

### Phase 2 P2 (Target)
- 🎯 100% of tests updated (~90/90)
- 🎯 0 manual timeouts remaining
- 🎯 ~200+ semantic waits added
- 🎯 25% code reduction per suite
- 🎯 80%+ pass rate per suite

### Fix 27 Failed Tests (Target)
- 🎯 90%+ overall pass rate (up from 82%)
- 🎯 All authentication tests passing
- 🎯 All CSS loading tests passing
- 🎯 All navigation tests passing
- 🎯 All reference block tests passing

---

## Common Questions

### Q: What's the difference between race condition fixes and fixing failed tests?

**A**: Race condition fixes make passing tests more reliable. Fixing failed tests makes failing tests pass. They're different problems requiring different solutions.

### Q: Which should we do first?

**A**: We're doing race condition fixes first (Phase 2 P2) because:
1. It affects more tests (~90 vs 27)
2. The patterns are established and proven
3. It prevents future flakiness
4. The failed tests need deeper investigation

### Q: Will race condition fixes help the 27 failed tests?

**A**: No. We tested this by running the failed tests sequentially (no parallel execution). They still failed, proving race conditions aren't the issue.

### Q: How long will this take?

**A**: 
- Phase 2 P2: 2-3 weeks (~90 tests)
- Fix 27 failed tests: 1-2 weeks
- Total: 3-5 weeks

### Q: What if I get stuck?

**A**: 
1. Review the [Phase 2 P1 Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md) for examples
2. Check the [Phase 2 Index](E2E_FEB16_2026_PHASE2_INDEX.md) for navigation
3. Read the [Wait Helpers Usage Guide](__tests__/helpers/E2E_HELPERS_USAGE_GUIDE.md)
4. Look at the actual test files that were updated

---

## Document Index

### Essential Reading (Start Here)
1. **[Context Summary](E2E_FEB16_2026_CONTEXT_SUMMARY.md)** - What we're doing and why
2. **[Failed Tests vs Race Condition Fixes](E2E_FEB16_2026_FAILED_TESTS_VS_RACE_CONDITION_FIXES.md)** - The two separate issues
3. **[Phase 2 P2 Quick Start](E2E_FEB16_2026_PHASE2_P2_QUICK_START.md)** - How to begin

### Phase 2 (Race Condition Prevention)
- [Phase 2 Index](E2E_FEB16_2026_PHASE2_INDEX.md) - Master navigation
- [Phase 2 P1 Progress Tracker](E2E_FEB16_2026_PHASE2_P1_PROGRESS_TRACKER.md) - Real-time status
- [Phase 2 P1 Complete Summary](E2E_FEB16_2026_PHASE2_P1_COMPLETE_SUMMARY.md) - Detailed breakdown
- [Phase 2 P1 Final Status](E2E_FEB16_2026_PHASE2_P1_FINAL_STATUS.md) - Final report

### Failed Tests (Future Work)
- [Single Worker Analysis](E2E_FEB16_2026_SINGLE_WORKER_ANALYSIS.md) - Detailed breakdown
- [Systematic Fix Plan](E2E_FEB16_2026_SYSTEMATIC_FIX_PLAN.md) - How to fix them
- [Race Condition Prevention and Fix Plan](E2E_FEB16_2026_RACE_CONDITION_PREVENTION_AND_FIX_PLAN.md) - Overall strategy

### Helper Functions
- [Wait Helpers Source](__tests__/helpers/waitHelpers.ts) - The code
- [Usage Guide](__tests__/helpers/E2E_HELPERS_USAGE_GUIDE.md) - How to use them

### Test Files (Examples)
- [Navigation Tests](__tests__/e2e/admin/navigation.spec.ts) - 9 tests updated
- [Reference Blocks Tests](__tests__/e2e/admin/referenceBlocks.spec.ts) - 8 tests updated

---

## Next Steps

### Immediate (Today)
1. ✅ Read this master plan
2. ✅ Read the Context Summary
3. ✅ Read the Phase 2 P2 Quick Start
4. 🔄 Choose first test suite (Content Management recommended)

### Short-Term (This Week)
1. Apply helpers to Content Management tests (~15 tests)
2. Apply helpers to Data Management tests (~20 tests)
3. Apply helpers to Email Management tests (~12 tests)
4. Document results and update progress tracker

### Medium-Term (Next 2 Weeks)
1. Apply helpers to Section Management tests (~10 tests)
2. Apply helpers to Photo Upload tests (~8 tests)
3. Apply helpers to Guest Views tests (~15 tests)
4. Apply helpers to Guest Groups tests (~10 tests)

### Long-Term (After Phase 2 P2)
1. Fix the 27 failed tests
2. Measure flakiness reduction
3. Update testing standards
4. Document lessons learned

---

**Last Updated**: February 16, 2026  
**Status**: Phase 2 P1 Complete ✅, Phase 2 P2 Ready to Begin 🔄  
**Next Action**: Read Context Summary, then begin Phase 2 P2

