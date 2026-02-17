# E2E Data Table Filter Chips - Debug Analysis

## Problem Statement

Filter chips are not rendering when filters are applied, causing E2E test failure:
- Test: "should display and remove filter chips"
- Expected: Filter chip with text "RSVP Status: Attending" to be visible
- Actual: Element not found

## Debug Findings

### Console Output Analysis

When test selects "attending" from dropdown:
1. URL updates correctly: `/admin/guests?direction=asc&filter_rsvpStatus=attending`
2. Page renders with EMPTY state:
   ```
   [GuestsPage] activeFilters computed: {
     filters: [],
     rsvpStatusFilter: '',  // ← Should be 'attending'!
     ...
   }
   ```

### Root Cause

The component is rendering with empty state AFTER the URL is updated. This indicates one of two issues:

1. **State not being set by onChange handler**
   - Dropdown onChange calls `setRsvpStatusFilter(e.target.value)`
   - State should update immediately
   - Need to verify onChange is actually firing

2. **Page navigation resetting state**
   - `useURLState` hook uses both `window.history.replaceState()` and `router.replace()`
   - `router.replace()` might be causing a navigation that resets component state
   - State restoration useEffect only runs on mount (`[isInitialized]` dependency)
   - If page navigates, state is lost and not restored

### Code Flow

1. User selects "attending" from dropdown
2. `onChange` fires → `setRsvpStatusFilter('attending')`
3. State update triggers URL update useEffect (lines 203-228)
4. `updateURL()` is called with `filter_rsvpStatus: 'attending'`
5. `useURLState` hook updates URL using `window.history.replaceState()` AND `router.replace()`
6. **PROBLEM**: Component re-renders with empty state
7. State restoration useEffect doesn't run (only runs on mount)
8. `activeFilters` computed with empty `rsvpStatusFilter`
9. Filter chips don't render (`activeFilters.length === 0`)

## Potential Solutions

### Solution 1: Fix State Restoration (RECOMMENDED)

Make state restoration run when URL changes, not just on mount:

```typescript
// Add searchParams to dependency array
useEffect(() => {
  if (!isInitialized) return;
  
  const params = getAllParams();
  // Restore all state from URL
  ...
}, [isInitialized, searchParams]); // ← Add searchParams
```

**Pros**: Keeps URL as source of truth, handles browser back/forward
**Cons**: Need to prevent infinite loops with URL update effect

### Solution 2: Remove router.replace() from useURLState

Only use `window.history.replaceState()` without Next.js router:

```typescript
// In useURLState hook
window.history.replaceState(null, '', newURL);
// Remove: router.replace(newURL, { scroll: false });
```

**Pros**: Prevents navigation that resets state
**Cons**: Might break Next.js routing features

### Solution 3: Use Ref to Track State Source

Track whether state came from user action or URL restoration:

```typescript
const isRestoringFromURL = useRef(false);

// In restoration effect
isRestoringFromURL.current = true;
// restore state
isRestoringFromURL.current = false;

// In URL update effect
if (isRestoringFromURL.current) return; // Don't update URL
```

**Pros**: Prevents loops while allowing both directions
**Cons**: More complex, harder to maintain

## Recommended Fix

Implement Solution 1 with loop prevention:

```typescript
const isUpdatingURL = useRef(false);

// Restore state from URL when it changes
useEffect(() => {
  if (!isInitialized || isUpdatingURL.current) return;
  
  const params = getAllParams();
  // Restore state...
}, [isInitialized, searchParams]);

// Update URL when state changes
useEffect(() => {
  if (!isInitialized) return;
  
  isUpdatingURL.current = true;
  updateURL({...});
  // Reset flag after a tick
  setTimeout(() => { isUpdatingURL.current = false; }, 0);
}, [state dependencies...]);
```

## Debug Logging Added

Added console.log statements to track:
1. State restoration effect execution
2. URL parameters being restored
3. Dropdown onChange events
4. activeFilters computation

Run test again to see full flow in console output.

## Next Steps

1. Run test with debug logging to confirm flow
2. Implement recommended fix (Solution 1 with loop prevention)
3. Remove debug logging after fix is verified
4. Update E2E test if needed (use data-testid selectors)
5. Verify all 9 data table tests pass
