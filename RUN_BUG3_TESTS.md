# How to Run Bug #3 Tests

## Quick Test Commands

### Test Just the Three Fixed Tests
```bash
npm run test:e2e -- contentManagement.spec.ts --grep "toggle inline section editor|edit section content|delete section with confirmation"
```

### Test the Full Content Management Suite
```bash
npm run test:e2e -- contentManagement.spec.ts
```

### Test with Retries (Recommended)
```bash
npm run test:e2e -- contentManagement.spec.ts --retries=2
```

## Expected Results

### Three Fixed Tests
- ✅ "should toggle inline section editor and add sections"
- ✅ "should edit section content and toggle layout"
- ✅ "should delete section with confirmation"

**Expected**: 3/3 passing (100%)

### Full Content Management Suite
**Expected**: 17/17 passing (100%)

## What to Look For

### Success Indicators
```
[Test] Clicking "Show Inline Section Editor" button with retry...
[Test] Button click successful - state changed
[waitForInlineSectionEditor] Button text changed to "Hide" - state updated successfully
[waitForInlineSectionEditor] Component fully loaded and visible!
```

### Failure Indicators (Should Not See)
```
[waitForInlineSectionEditor] Button text did NOT change - state update failed!
[waitForInlineSectionEditor] Show button still visible: true
```

## If Tests Still Fail

1. Check the logs for the specific error
2. Look for timing issues (page load time > 1 second)
3. Consider increasing the initial wait from 1s to 2s
4. Implement React hydration wait (see fallback plan in fix document)

## Verification Steps

1. Run tests once: Should pass
2. Run tests again: Should pass
3. Run tests with retries: Should pass on first attempt

If all three runs pass, the fix is confirmed working.
