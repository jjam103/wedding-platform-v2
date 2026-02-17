# E2E Pattern-Based Fix - Master Plan

## 🎯 Mission: Achieve 100% E2E Test Pass Rate

**Current Status**: 261/363 passing (~72%)  
**Target**: 363/363 passing (100%)  
**Gap**: 102 failing tests  
**Strategy**: Pattern-based fixes (5-40 tests per fix)  
**Estimated Time**: 5-6 hours total

---

## 📋 Phase 1: Extract & Analyze Failure Patterns

### Step 1.1: Extract All Failure Messages
**Script**: `scripts/extract-e2e-failures.mjs`

```javascript
// Extract all failure messages from test-results/ directory
// Output: E2E_FAILURE_CATALOG.json
```

**Command**:
```bash
node scripts/extract-e2e-failures.mjs
```

**Output File**: `E2E_FAILURE_CATALOG.json`
- Contains all failure messages
- Test file paths
- Error types
- Stack traces

### Step 1.2: Group Failures by Pattern
**Script**: `scripts/group-failure-patterns.mjs`

```javascript
// Group failures by error message similarity
// Output: E2E_FAILURE_PATTERNS.json
```

**Command**:
```bash
node scripts/group-failure-patterns.mjs
```

**Output File**: `E2E_FAILURE_PATTERNS.json`
- Pattern ID
- Pattern description
- Affected test count
- Test file list
- Example error message

### Step 1.3: Prioritize Patterns by Impact
**Manual Review**: `E2E_PATTERN_PRIORITY_LIST.md`

Sort patterns by:
1. Number of tests affected (highest first)
2. Fix complexity (simplest first for same count)
3. Dependencies (fix blockers first)

---

## 📊 Phase 2: Pattern-Based Fixes

### Pattern Fix Workflow

For each pattern (starting with highest priority):

#### 2.1: Analyze Pattern
**Document**: `E2E_PATTERN_[ID]_ANALYSIS.md`

Template:
```markdown
# Pattern [ID]: [Name]

## Affected Tests
- Count: [X] tests
- Files: [list]

## Root Cause
[Description of underlying issue]

## Example Failure
```
[Error message]
```

## Fix Strategy
[How to fix this pattern]

## Estimated Impact
- Tests fixed: [X]
- Time estimate: [Y] hours
```

#### 2.2: Implement Fix
**Document**: `E2E_PATTERN_[ID]_FIX.md`

Template:
```markdown
# Pattern [ID] Fix Implementation

## Changes Made
1. [File 1]: [Description]
2. [File 2]: [Description]

## Code Changes
[Specific code changes]

## Verification Command
```bash
# Run only affected tests
npx playwright test [test-file-pattern]
```

## Expected Result
- Before: [X] tests failing
- After: [X] tests passing
```

#### 2.3: Verify Fix
**Command**:
```bash
# Run only tests affected by this pattern
npx playwright test --grep="pattern-specific-text"
```

**Document Results**: `E2E_PATTERN_[ID]_VERIFICATION.md`

#### 2.4: Update Progress Tracker
**File**: `E2E_FIX_PROGRESS_TRACKER.md`

---

## 🔄 Phase 3: Incremental Verification

### After Each Pattern Fix

**Run Targeted Tests**:
```bash
# Run only the tests that were failing for this pattern
npx playwright test [specific-test-files]
```

**Update Metrics**:
- Tests fixed this iteration
- Cumulative tests fixed
- Remaining failures
- Pass rate percentage

**Document**: `E2E_PROGRESS_LOG.md`

---

## 📈 Phase 4: Final Verification

### When All Patterns Fixed

**Run Full Suite**:
```bash
npx playwright test --reporter=list > e2e-final-verification.txt
```

**Verify**:
- All 363 tests passing
- No new failures introduced
- Test execution time acceptable

**Document**: `E2E_100_PERCENT_COMPLETE.md`

---

## 🛠️ Tools & Scripts

### Script 1: Extract Failures
**File**: `scripts/extract-e2e-failures.mjs`

Extracts all failure information from `test-results/` directory.

### Script 2: Group Patterns
**File**: `scripts/group-failure-patterns.mjs`

Groups similar failures into patterns.

### Script 3: Run Pattern Tests
**File**: `scripts/run-pattern-tests.mjs`

Runs only tests affected by a specific pattern.

### Script 4: Progress Report
**File**: `scripts/generate-progress-report.mjs`

Generates current progress report.

---

## 📝 Document Structure

### Master Documents (Always Reference These)

1. **E2E_PATTERN_FIX_MASTER_PLAN.md** (this file)
   - Overall strategy and workflow
   - Phase-by-phase instructions

2. **E2E_FIX_PROGRESS_TRACKER.md**
   - Current status
   - Patterns fixed
   - Patterns remaining
   - Pass rate metrics

3. **E2E_FAILURE_PATTERNS.json**
   - All identified patterns
   - Test counts
   - Priority order

### Per-Pattern Documents

For each pattern [ID]:

1. **E2E_PATTERN_[ID]_ANALYSIS.md**
   - Root cause analysis
   - Affected tests
   - Fix strategy

2. **E2E_PATTERN_[ID]_FIX.md**
   - Implementation details
   - Code changes
   - Verification steps

3. **E2E_PATTERN_[ID]_VERIFICATION.md**
   - Test results
   - Before/after metrics
   - Any issues found

### Progress Documents

1. **E2E_PROGRESS_LOG.md**
   - Chronological log of all fixes
   - Metrics after each fix
   - Notes and observations

2. **E2E_CURRENT_STATUS.md**
   - Always up-to-date status
   - Next pattern to fix
   - Blockers or issues

---

## 🎯 Expected Patterns (Based on Previous Analysis)

### Pattern 1: API JSON Error Handling
- **Tests Affected**: ~30-40
- **Root Cause**: Missing JSON parsing in API routes
- **Fix Time**: 1 hour
- **Priority**: HIGH

### Pattern 2: Data Table URL State
- **Tests Affected**: ~20-30
- **Root Cause**: URL state management issues
- **Fix Time**: 2 hours
- **Priority**: HIGH

### Pattern 3: Responsive Design
- **Tests Affected**: ~10-15
- **Root Cause**: Mobile viewport issues
- **Fix Time**: 2 hours
- **Priority**: MEDIUM

### Pattern 4: Missing ARIA Attributes
- **Tests Affected**: ~15-20
- **Root Cause**: Accessibility attributes missing
- **Fix Time**: 30 minutes
- **Priority**: MEDIUM

### Pattern 5: Touch Target Sizes
- **Tests Affected**: ~5-10
- **Root Cause**: Button/link size issues
- **Fix Time**: 15 minutes
- **Priority**: LOW

---

## ⚡ Quick Commands Reference

### Extract Failures
```bash
node scripts/extract-e2e-failures.mjs
```

### Group Patterns
```bash
node scripts/group-failure-patterns.mjs
```

### Run Specific Pattern Tests
```bash
npx playwright test --grep="pattern-keyword"
```

### Run Full Suite (Use Sparingly!)
```bash
npx playwright test --reporter=list
```

### Generate Progress Report
```bash
node scripts/generate-progress-report.mjs
```

---

## 🚫 What NOT to Do

1. **DON'T** run the full suite after every small change
2. **DON'T** fix tests individually (use patterns)
3. **DON'T** skip documentation (future agents need it)
4. **DON'T** fix patterns out of priority order
5. **DON'T** move to next pattern until current is verified

---

## ✅ Success Criteria

- [ ] All 363 tests passing
- [ ] No flaky tests (run suite 3x to verify)
- [ ] All patterns documented
- [ ] Progress tracker complete
- [ ] Verification report generated

---

## 📞 Handoff to Next Agent

When handing off to another agent, provide:

1. **E2E_CURRENT_STATUS.md** - Current state
2. **E2E_FIX_PROGRESS_TRACKER.md** - What's been done
3. **E2E_PATTERN_FIX_MASTER_PLAN.md** - This file
4. Next pattern to work on

**Template Message**:
```
Current E2E Status: [X]/363 tests passing ([Y]%)

Patterns Fixed: [list]
Current Pattern: Pattern [ID] - [Name]
Next Steps: See E2E_PATTERN_[ID]_ANALYSIS.md

All documentation in:
- E2E_PATTERN_FIX_MASTER_PLAN.md (strategy)
- E2E_FIX_PROGRESS_TRACKER.md (progress)
- E2E_CURRENT_STATUS.md (current state)
```

---

**Last Updated**: February 11, 2026  
**Status**: Ready for Phase 1 execution
