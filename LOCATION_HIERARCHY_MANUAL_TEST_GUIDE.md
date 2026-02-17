# Location Hierarchy - Manual Testing Guide

**Date**: 2026-02-09
**Component**: `app/admin/locations/page.tsx`
**Fix**: Changed `expandedNodes` from `Set<string>` to `Record<string, boolean>`

## Quick Test (5 minutes)

### Prerequisites
1. Dev server running: `npm run dev`
2. Navigate to: `http://localhost:3000/admin/locations`
3. Login with admin credentials

### Test Steps

#### Test 1: Create Parent and Child (Auto-Expansion)
**Expected**: Child appears immediately without manual expansion

1. Click "Add Location" button
2. Fill in form:
   - Name: "Test Country"
   - Type: "Country"
   - Parent Location: (leave empty)
3. Click "Save"
4. **Verify**: "Test Country" appears in the list
5. Click "Add Location" again
6. Fill in form:
   - Name: "Test City"
   - Type: "City"
   - Parent Location: "Test Country"
7. Click "Save"
8. **✅ PASS**: "Test City" appears immediately under "Test Country" (parent auto-expanded)
9. **❌ FAIL**: "Test City" not visible (need to manually expand parent)

#### Test 2: Toggle Expansion
**Expected**: Expansion button works correctly

1. Click the collapse button (▼) next to "Test Country"
2. **✅ PASS**: "Test City" disappears, button changes to ▶
3. **❌ FAIL**: Nothing happens or button doesn't change
4. Click the expand button (▶) next to "Test Country"
5. **✅ PASS**: "Test City" reappears, button changes to ▼
6. **❌ FAIL**: Nothing happens or button doesn't change

#### Test 3: Create Multiple Children
**Expected**: All children appear immediately

1. Ensure "Test Country" is expanded
2. Click "Add Location"
3. Fill in form:
   - Name: "Test City 2"
   - Type: "City"
   - Parent Location: "Test Country"
4. Click "Save"
5. **✅ PASS**: "Test City 2" appears immediately under "Test Country"
6. **❌ FAIL**: "Test City 2" not visible

#### Test 4: Edit Child Location
**Expected**: Tree updates correctly after edit

1. Click "Edit" on "Test City"
2. Change name to "Test City Updated"
3. Click "Save"
4. **✅ PASS**: Name updates in tree, parent remains expanded
5. **❌ FAIL**: Tree collapses or name doesn't update

#### Test 5: Aria Attributes
**Expected**: Accessibility attributes update correctly

1. Open browser DevTools (F12)
2. Inspect the expand/collapse button next to "Test Country"
3. **✅ PASS**: Button has `aria-expanded="true"` when expanded
4. Click to collapse
5. **✅ PASS**: Button has `aria-expanded="false"` when collapsed
6. **❌ FAIL**: `aria-expanded` doesn't change

## Cleanup

After testing, delete test locations:
1. Click "Delete" on "Test City"
2. Click "Delete" on "Test City 2"
3. Click "Delete" on "Test Country"

## What Was Fixed

### Before (Broken)
```typescript
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

const toggleNode = (id: string) => {
  setExpandedNodes(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};

const isExpanded = expandedNodes.has(location.id);
```

**Problem**: React can't detect changes to Set objects (they're mutable), so:
- Component doesn't re-render when expansion state changes
- `aria-expanded` attribute doesn't update
- Newly created children not visible

### After (Fixed)
```typescript
const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

const toggleNode = (id: string) => {
  setExpandedNodes(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};

const isExpanded = expandedNodes[location.id] || false;
```

**Solution**: Using object with spread operator creates new reference, triggering React re-render.

## Expected Results

All 5 tests should **PASS** ✅

If any test fails, the component fix needs adjustment.

## Automated Test Coverage

Once E2E authentication is fixed, these tests will run automatically:

- `__tests__/e2e/admin/dataManagement.spec.ts` (lines 220-570)
  - "should create parent and child location with auto-expansion"
  - "should toggle location expansion"
  - "should preserve expansion state after data reload"
  - "should update aria-expanded attribute correctly"

## Related Documents

- `E2E_LOCATION_HIERARCHY_COMPONENT_FIX_COMPLETE.md` - Complete fix summary
- `E2E_LOCATION_HIERARCHY_FIX_ANALYSIS.md` - Detailed analysis
- `E2E_PHASE1_LOCATION_HIERARCHY_VERIFICATION_SUMMARY.md` - Previous analysis
