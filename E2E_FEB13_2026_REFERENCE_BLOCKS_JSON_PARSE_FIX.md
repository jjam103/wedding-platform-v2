# E2E Reference Blocks Tests - JSON Parse Error Fix
**Date**: February 13, 2026
**Status**: Fix applied - awaiting verification

## Root Cause Identified

The E2E tests were failing because of a **JSON parsing error** in the `GroupedNavigation` component, NOT because of test selector issues.

### Error Evidence
```
⨯ SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>) {
  page: '/admin/content-pages'
}
GET /admin/content-pages 500 in 4.8s
```

### Root Cause
The `GroupedNavigation` component was using `safeGetItem()` + `JSON.parse()` to read localStorage data:

```typescript
// ❌ WRONG - Can throw "Unexpected end of JSON input"
const stored = safeGetItem(STORAGE_KEY);
if (stored) {
  const parsed = JSON.parse(stored);  // Throws if stored === ""
  setExpandedGroups(new Set(parsed));
}
```

**Problem**: `localStorage.getItem()` can return an empty string `""`, and `JSON.parse("")` throws "Unexpected end of JSON input".

### Why This Broke E2E Tests
1. E2E tests run in a clean browser context with empty localStorage
2. Some test runs left localStorage with empty string values
3. When the content pages loaded, GroupedNavigation tried to parse empty string
4. JSON.parse threw an error, crashing the component
5. The page returned 500 error, preventing the editing interface from rendering
6. Tests timed out waiting for elements that never appeared

## Fix Applied

Changed `GroupedNavigation.tsx` to use the safe JSON parsing utilities that already exist in `utils/storage.ts`:

### Changes Made

1. **Updated imports**:
```typescript
// Before
import { safeGetItem, safeSetItem } from '@/utils/storage';

// After
import { safeGetJSON, safeSetJSON } from '@/utils/storage';
```

2. **Fixed localStorage loading** (line ~54):
```typescript
// Before
const stored = safeGetItem(STORAGE_KEY);
if (stored) {
  const parsed = JSON.parse(stored);
  setExpandedGroups(new Set(parsed));
}

// After
const parsed = safeGetJSON<string[]>(STORAGE_KEY, []);
if (parsed.length > 0) {
  setExpandedGroups(new Set(parsed));
}
```

3. **Fixed localStorage saving** (line ~77):
```typescript
// Before
safeSetItem(STORAGE_KEY, JSON.stringify(Array.from(expandedGroups)));

// After
safeSetJSON(STORAGE_KEY, Array.from(expandedGroups));
```

4. **Fixed storage event listener** (line ~110):
```typescript
// Before
if (e.key === STORAGE_KEY && e.newValue) {
  const parsed = JSON.parse(e.newValue);
  setExpandedGroups(new Set(parsed));
}

// After
if (e.key === STORAGE_KEY && e.newValue) {
  const parsed = safeGetJSON<string[]>(STORAGE_KEY, []);
  if (parsed.length > 0) {
    setExpandedGroups(new Set(parsed));
  }
}
```

## Why This Fix Works

The `safeGetJSON` utility (from `utils/storage.ts`) handles all edge cases:
- Returns default value if key doesn't exist
- Returns default value if value is empty string
- Returns default value if JSON parsing fails
- Never throws exceptions

```typescript
export function safeGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to read/parse JSON from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}
```

## Expected Test Results

After this fix:
1. ✅ Content pages will load without 500 errors
2. ✅ Section editor will render correctly
3. ✅ Edit button will open the editing interface
4. ✅ Column type selector will appear
5. ✅ All 8 E2E tests should pass

## Files Modified

- `components/admin/GroupedNavigation.tsx` - Fixed JSON parsing to use safe utilities

## Next Steps

1. Run E2E tests to verify fix: `npm run test:e2e -- referenceBlocks`
2. If tests pass, document success
3. If tests still fail, investigate remaining issues

## Lessons Learned

1. **Always use safe JSON parsing utilities** - Never call `JSON.parse()` directly on localStorage data
2. **Check server logs for errors** - The 500 errors in server logs were the key clue
3. **Don't assume selector issues** - When elements don't appear, check for JavaScript errors first
4. **Use existing utilities** - The project already had `safeGetJSON` but it wasn't being used consistently

## Prevention

To prevent this issue in the future:
1. Add ESLint rule to warn about direct `JSON.parse()` calls on localStorage
2. Update code review checklist to verify safe localStorage usage
3. Add integration tests that verify localStorage edge cases
4. Document the safe storage utilities in developer documentation
