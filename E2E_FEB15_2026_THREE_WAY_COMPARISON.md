# E2E Test Suite - Three-Way Comparison

**Date**: February 15, 2026  
**Purpose**: Compare three test runs to determine best baseline

---

## Test Runs Compared

### 1. Feb 12, 2026 (Dev Server) - BASELINE
- **Passed**: 228
- **Failed**: 0
- **Flaky**: 17
- **Execution Time**: N/A minutes
- **Pass Rate**: 63.0%

### 2. Feb 15, 2026 (Dev Server)
- **Passed**: 275
- **Failed**: 60
- **Flaky**: 4
- **Execution Time**: N/A minutes
- **Pass Rate**: 76.0%

### 3. Feb 15, 2026 (Production Build)
- **Passed**: 245
- **Failed**: 0
- **Flaky**: 7
- **Execution Time**: N/A minutes
- **Pass Rate**: 67.7%

---

## Regression Analysis

### Regressions (Feb 12 Dev → Feb 15 Prod)
**Count**: 0 tests

✅ **NO REGRESSIONS FOUND!**

### Improvements (Feb 12 Dev → Feb 15 Prod)
**Count**: 0 tests

None

---

## Recommendation

### 🏆 Best Baseline: **FEB15DEV**

**Reasoning**:
- Feb 15 Dev has the best overall metrics:
- - 275 passing tests
- - 4 flaky tests

**Scores**:
- Feb 12 Dev: 0/100
- Feb 15 Dev: 70/100
- Feb 15 Production: 10/100

---

## Next Steps

1. **Use feb15Dev as the baseline** for future test runs
2. Continue with pattern-based fixes
3. Address 7 flaky tests
4. Target 90% pass rate (326/362 tests)

---

**Generated**: 2026-02-15T22:41:18.976Z
