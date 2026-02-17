# E2E Test Parsing Results - Analysis

**Date**: February 11, 2026  
**Status**: Parsing complete, significant discrepancy found

---

## 🔍 Key Discovery

The parser scripts have a **significant limitation**: They only capture tests with clear pass/fail markers in the output, missing many tests that were executed.

### Actual Test Results (from full run)
- **Total Tests**: 363
- **Executed**: 342 tests (94%)
- **Passed**: 190 tests (52.3%)
- **Failed**: 127 tests (35.0%)
- **Flaky**: 22 tests (6.1%)
- **Skipped**: 3 tests (0.8%)
- **Did Not Run**: 21 tests (5.8%)

### Parser Results (from scripts)
- **Total Tests Captured**: 168 tests (46% of total)
- **Passed**: 147 tests (87.5%)
- **Failed**: 21 tests (12.5%)
- **Missing**: 195 tests not captured by parser

---

## ⚠️ Parser Limitations

### Why Only 168 Tests Were Captured

The parser (`scripts/parse-test-output.mjs`) only captures tests with these specific markers:
```
✓ [test number] [browser] › test path
✘ [test number] [browser] › test path
```

**Tests NOT captured**:
1. Tests without clear pass/fail markers
2. Tests that timed out before completion
3. Tests in the middle of execution when output was truncated
4. Tests with non-standard output format

### Impact on Pattern Analysis

The pattern grouping script found:
- **20 patterns** (all LOW priority)
- **21 failing tests** (only those captured by parser)
- **Missing**: 106 actual failures (127 total - 21 captured)

This means **83% of failures are not in the pattern analysis**.

---

## 📊 What We Actually Know

### From Complete Test Run Output

#### Confirmed Passing (190 tests)
- Accessibility suite: Most tests passing
- Data Table tests: Most passing
- Room Type Capacity: All passing
- CSV Import/Export: All passing
- Some Content Management tests
- Some Event References tests

#### Confirmed Failing (127 tests)
Based on the full output file, failures include:
1. **Responsive Design** (~8-10 tests)
   - Zoom support issues
   - Mobile viewport problems
   - Cross-browser layout issues

2. **Content Management** (~15-20 tests)
   - Content page creation
   - Section management
   - Home page editing
   - Inline section editor

3. **Location Hierarchy** (~8-10 tests)
   - Tree navigation
   - Circular reference prevention
   - Location deletion

4. **Email Management** (~10-15 tests)
   - Email composition
   - Template usage
   - Bulk email operations

5. **Section Management** (~10-15 tests)
   - Cross-entity sections
   - Validation & error handling
   - Section editor UI

6. **User Management** (~5-8 tests)
   - Admin user operations
   - Deactivation workflows

7. **Guest Authentication** (~10-15 tests)
   - Email matching
   - Session management
   - Cookie handling

8. **Guest Views** (~10-15 tests)
   - Preview functionality
   - Navigation
   - Content display

9. **Data Management** (~10-15 tests)
   - Accessibility features
   - Form validation

10. **Photo Upload** (~5-8 tests)
    - File validation
    - Upload workflows

#### Flaky Tests (22 tests)
Tests that failed initially but passed on retry - indicate timing or state management issues.

---

## 🎯 Recommended Next Steps

### Option 1: Manual Pattern Analysis (RECOMMENDED)

Since the parser missed 83% of failures, we should:

1. **Read the full output file** (`e2e-complete-results.txt`)
2. **Manually identify failure patterns** by searching for:
   - `✘` markers (failed tests)
   - Error messages after failures
   - Common error types (timeout, locator not found, assertion failure, etc.)

3. **Group failures manually** into patterns:
   - Pattern 1: Responsive Design Issues (~8-10 tests)
   - Pattern 2: Content Management (~15-20 tests)
   - Pattern 3: Location Hierarchy (~8-10 tests)
   - Pattern 4: Email Management (~10-15 tests)
   - Pattern 5: Section Management (~10-15 tests)
   - Pattern 6: Guest Authentication (~10-15 tests)
   - Pattern 7: Guest Views (~10-15 tests)
   - Pattern 8: User Management (~5-8 tests)
   - Pattern 9: Data Management Accessibility (~10-15 tests)
   - Pattern 10: Photo Upload (~5-8 tests)

4. **Fix patterns systematically** starting with highest impact

### Option 2: Improve Parser Script

Enhance `scripts/parse-test-output.mjs` to:
- Capture tests without clear markers
- Handle timeout scenarios
- Parse error messages more robustly
- Extract all 127 failures

**Time**: 1-2 hours to improve parser, then re-run analysis

### Option 3: Use Playwright's Built-in Reports

Playwright generates JSON reports that might have complete data:
```bash
# Check if JSON report exists
ls -la test-results/

# Or re-run with JSON reporter
npx playwright test --reporter=json > e2e-results.json
```

---

## 💡 Immediate Action Plan

### Step 1: Verify Full Failure Count
```bash
# Count all failure markers in output
grep -c "✘" e2e-complete-results.txt
```

### Step 2: Extract All Failure Test Paths
```bash
# Extract all failed test paths
grep "✘" e2e-complete-results.txt | grep -o "__tests__/e2e/[^›]*" | sort | uniq
```

### Step 3: Group by Test Suite
```bash
# Count failures by suite
grep "✘" e2e-complete-results.txt | grep -o "__tests__/e2e/[^/]*/[^/]*" | sort | uniq -c | sort -rn
```

### Step 4: Manual Pattern Identification

Based on the output, create manual pattern groups:
1. Read failure messages for each suite
2. Identify common root causes
3. Group tests by root cause
4. Prioritize by number of tests affected

---

## 📈 Success Metrics

### Current State
- ✅ Complete test run executed (363 tests)
- ✅ 190 tests passing (52.3%)
- ✅ All failure data collected in output file
- ⚠️ Parser only captured 21/127 failures (16.5%)
- ❌ Pattern analysis incomplete (missing 83% of failures)

### Path to 100%
1. ⏭️ Manual pattern analysis (2-3 hours)
2. ⏭️ Fix Pattern 1 (highest impact)
3. ⏭️ Fix Pattern 2
4. ⏭️ Continue through all patterns
5. ⏭️ Fix flaky tests (22 tests)
6. ⏭️ Final verification
7. 🎯 Achieve 363/363 passing

---

## 🔧 Parser Script Issues

### Current Implementation
```javascript
// Only captures tests with these exact formats:
const testMatch = line.match(/^\s*(✓|✘)\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+)$/);
```

### Problems
1. **Strict regex**: Misses tests with slightly different formatting
2. **Error collection**: Stops after 50 lines or when hitting another test
3. **No retry handling**: Doesn't distinguish between first attempt and retry
4. **Missing context**: Doesn't capture test suite information

### Recommended Improvements
1. More flexible regex patterns
2. Better error message extraction
3. Retry attempt tracking
4. Suite-level grouping
5. Timeout detection
6. Navigation error detection

---

## 📁 Files Generated

### Complete
- ✅ `e2e-complete-results.txt` - Full test output (41.4 minutes, 26,262 lines)
- ✅ `E2E_FAILURE_CATALOG.json` - Partial failures (21/127 captured)
- ✅ `E2E_FAILURE_PATTERNS.json` - Incomplete patterns (20 patterns, 21 tests)
- ✅ `E2E_TEST_RUN_COMPLETE_RESULTS.md` - Test run summary
- ✅ `E2E_SESSION_CONTINUATION_GUIDE.md` - Continuation guide
- ✅ `E2E_PATTERN_FIX_MASTER_PLAN.md` - Fix strategy
- ✅ `E2E_PARSING_RESULTS_ANALYSIS.md` - This file

### Needed
- ⏭️ `E2E_MANUAL_PATTERN_ANALYSIS.md` - Manual pattern identification
- ⏭️ `E2E_COMPLETE_FAILURE_LIST.md` - All 127 failures listed
- ⏭️ `E2E_PATTERN_PRIORITY_LIST.md` - Prioritized fix order

---

## 🎬 Next Agent Instructions

**Current Situation**: Parser scripts incomplete, need manual analysis

**What to Do**:

1. **Extract all failures manually**:
   ```bash
   grep "✘" e2e-complete-results.txt > all-failures.txt
   ```

2. **Count failures by suite**:
   ```bash
   grep "✘" e2e-complete-results.txt | grep -o "__tests__/e2e/[^/]*/[^/]*" | sort | uniq -c | sort -rn
   ```

3. **Read failure messages** for top 3 suites with most failures

4. **Create manual pattern document** with:
   - Pattern ID
   - Description
   - Affected tests (count)
   - Example error message
   - Root cause hypothesis
   - Fix strategy

5. **Start fixing highest priority pattern**

**Alternative**: If you prefer automated approach, improve the parser script first, then re-run analysis.

---

**Status**: Parser limitations identified, manual analysis recommended  
**Next Action**: Manual pattern identification or parser improvement  
**Goal**: Identify all 127 failure patterns and begin systematic fixes

