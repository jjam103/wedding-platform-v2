# E2E Bug #3: Actual Root Cause Found

## Date: February 12, 2026
## Status: ROOT CAUSE IDENTIFIED

## The Real Problem

The `waitForInlineSectionEditor()` helper function is waiting for the API response (`/api/admin/sections/by-page/home/home`), but the **component is NOT rendering** even after the API completes successfully.

## Why the Component Doesn't Render

### The Conditional Rendering Chain

```typescript
// app/admin/home-page/page.tsx (line 357-368)
{showInlineSectionEditor && (
  <Card className="p-6">
    <InlineSectionEditor 
      pageType="home" 
      pageId="home" 
      onSave={() => {
        console.log('Section saved');
      }}
      compact={false}
    />
  </Card>
)}
```

The component is conditionally rendered based on `showInlineSectionEditor` state.

### The State Toggle

```typescript
// app/admin/home-page/page.tsx (line 180-182)
const handleToggleInlineSectionEditor = () => {
  setShowInlineSectionEditor(!showInlineSectionEditor);
};
```

### The Button Click

```typescript
// Test clicks this button (line 338-340)
<Button
  onClick={handleToggleInlineSectionEditor}
  variant="secondary"
  disabled={saving}
>
  {showInlineSectionEditor ? 'Hide' : 'Show'} Inline Section Editor
</Button>
```

## The Actual Root Cause

**The button click is NOT successfully toggling the state!**

### Evidence from Test Logs

```
[waitForInlineSectionEditor] Step 5: Checking if component exists in DOM...
[waitForInlineSectionEditor] Component count in DOM: 0
[waitForInlineSectionEditor] Component not found in DOM!
[waitForInlineSectionEditor] Card elements count: X
[waitForInlineSectionEditor] Hide button visible (state should be true): false
```

The "Hide button visible" check returns `false`, which means:
- The button text is still "Show Inline Section Editor" (not "Hide")
- The `showInlineSectionEditor` state is still `false`
- The component is NOT being rendered

## Why the Button Click Fails

### Possible Reasons:

1. **Button is disabled**: The button has `disabled={saving}` - if `saving` is `true`, the click won't work
2. **Button is obscured**: Another element might be covering the button
3. **Page is navigating**: The click might trigger a navigation that cancels the state update
4. **React state update timing**: The state update might be batched or delayed
5. **Button click is intercepted**: Something is preventing the click event from reaching the button

## The Test's Flawed Assumption

The test assumes:
1. Click button → State changes → Component renders → API call happens
2. Wait for API call → Component must be visible

But the actual flow is:
1. Click button → State SHOULD change → Component SHOULD render → API call happens
2. Wait for API call → **State didn't change** → Component NOT rendered

## Why Waiting for API is Misleading

The API call `/api/admin/sections/by-page/home/home` happens when the `InlineSectionEditor` component mounts:

```typescript
// components/admin/InlineSectionEditor.tsx (line 60-62)
useEffect(() => {
  fetchSections();
}, [pageType, pageId]);
```

**BUT**: If the component never mounts (because `showInlineSectionEditor` is still `false`), the API call might be happening from a PREVIOUS test or a different component!

## The Real Fix Needed

We need to:

1. **Verify the button click actually works** - Check if the button is clickable
2. **Wait for the state change** - Wait for button text to change from "Show" to "Hide"
3. **Then wait for the component** - Only after state changes, wait for component to appear
4. **Debug why the click fails** - Add logging to understand what's preventing the state change

## Next Steps

1. Add more detailed logging to the test to see:
   - Is the button visible?
   - Is the button enabled?
   - Does the click event fire?
   - Does the button text change?

2. Try different click strategies:
   - `click({ force: true })`
   - `dispatchEvent('click')`
   - Direct state manipulation via `page.evaluate()`

3. Check for race conditions:
   - Is the page still loading when we click?
   - Are there pending API calls that block the UI?
   - Is there a loading overlay covering the button?

## Conclusion

The helper function is waiting for the wrong thing. It's waiting for an API call that might not even be related to the component we're trying to test. We need to wait for the **state change** (button text change) FIRST, then wait for the component to appear.

The API call is a side effect of the component mounting, not a prerequisite for it to mount.
