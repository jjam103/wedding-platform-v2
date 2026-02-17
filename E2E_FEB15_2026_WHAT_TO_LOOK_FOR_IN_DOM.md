# What to Look For in the DOM - Quick Reference

**Date**: February 15, 2026  
**Status**: Component is working, need actual DOM selectors  
**Goal**: Find the correct selectors to fix E2E tests

## Quick Summary

The tree IS rendering correctly! Console logs confirm:
- ✅ `renderTreeNode` is being called
- ✅ Two locations are visible: "Test Country 1771200045628" and "test country two"
- ✅ Children detection works (first location has 1 child)

**The E2E tests just need the correct selectors!**

---

## What You'll See in the Browser

When you open http://localhost:3000/admin/locations, you should see:

```
┌─────────────────────────────────────────────┐
│ Locations                                   │
│ Manage location hierarchy                  │
│                                             │
│ [Search box...] [+ Add Location]           │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ▶ 📍 Test Country 1771200045628  [Edit] [Delete] │
│ │ ▶ 📍 test country two            [Edit] [Delete] │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Step-by-Step: What to Inspect

### 1. Find the Tree Container

**What to do:**
1. Right-click anywhere in the white box containing the locations
2. Select "Inspect"
3. Look for the outermost `<div>` that wraps all locations

**What you're looking for:**
```html
<div class="mt-6 bg-white rounded-lg shadow">
  <!-- All location nodes are inside here -->
</div>
```

**Document this:**
- ✅ Confirmed: `div.mt-6.bg-white.rounded-lg.shadow` is the tree container

---

### 2. Find a Location Name Element

**What to do:**
1. Right-click on "Test Country 1771200045628" text
2. Select "Inspect"
3. Look at the element containing the text

**What you're looking for:**
```html
<div class="font-medium text-gray-900">Test Country 1771200045628</div>
```

**Document this:**
- Element type: `<div>` (not `<span>`)
- Classes: `font-medium text-gray-900`
- Parent structure: Check what wraps this div

---

### 3. Find the Expand Button (▶)

**What to do:**
1. Right-click on the ▶ symbol next to "Test Country 1771200045628"
2. Select "Inspect"
3. Look at the `<button>` element

**What you're looking for:**
```html
<button
  aria-label="Expand"
  aria-expanded="false"
  type="button"
  class="mr-2 text-gray-500 hover:text-gray-700"
>
  ▶
</button>
```

**Document this:**
- ✅ Has `aria-expanded` attribute (good!)
- ✅ Has `aria-label` attribute (check if it says "Expand" or "Collapse")
- Text content: ▶ or ▼

**CRITICAL FOR TEST #3:** The test is currently looking for `button[aria-expanded="false"]` - verify this selector works!

---

### 4. Find the "Add Location" Button

**What to do:**
1. Scroll to top of page
2. Right-click the blue "+ Add Location" button
3. Select "Inspect"

**What you're looking for:**
```html
<button
  data-testid="add-location-button"
  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
  + Add Location
</button>
```

**Document this:**
- ✅ Has `data-testid="add-location-button"` (perfect!)
- Text content: "+ Add Location" or "Add Location"

---

### 5. Find the Create Form

**What to do:**
1. Click "+ Add Location" button
2. Wait for form to appear
3. Right-click on the form area
4. Select "Inspect"

**What you're looking for:**
```html
<form>
  <input name="name" type="text" />
  <select name="parentLocationId">
    <option value="">None (Root Location)</option>
    <!-- More options here -->
  </select>
  <button type="submit" data-testid="form-submit-button">
    Create
  </button>
</form>
```

**Document this:**
- Form element: `<form>` tag
- Name input: `input[name="name"]`
- Parent select: `select[name="parentLocationId"]`
- Submit button: Has `data-testid="form-submit-button"` (perfect!)

---

## Quick Test in Console

Open DevTools Console and run these commands to verify selectors:

```javascript
// 1. Find tree container
document.querySelector('div.mt-6.bg-white.rounded-lg.shadow')
// Should return: <div class="mt-6 bg-white rounded-lg shadow">...</div>

// 2. Find location by text
document.querySelector('text=Test Country 1771200045628')
// Should return: the element containing that text

// 3. Find expand buttons
document.querySelectorAll('button[aria-expanded="false"]')
// Should return: NodeList of collapsed expand buttons

// 4. Find Add Location button
document.querySelector('[data-testid="add-location-button"]')
// Should return: <button data-testid="add-location-button">...</button>

// 5. Count how many expand buttons exist
document.querySelectorAll('button[aria-expanded]').length
// Should return: 2 (one for each location with potential children)
```

---

## What the Tests Are Currently Looking For (WRONG)

### Test #1: Create hierarchical structure
```typescript
// ❌ WRONG: Looking for data-testid that doesn't exist
const formContent = page.getByTestId('collapsible-form-content');

// ✅ CORRECT: Should look for actual form element
const formContent = page.locator('form');
```

### Test #2 & #4: Form submission
```typescript
// ❌ WRONG: Looking for table rows
const location1Row = page.locator(`tr:has-text("${location1Name}")`);

// ✅ CORRECT: Should look for div elements in tree
const location1Row = page.locator(`div:has-text("${location1Name}")`);
```

### Test #3: Expand/collapse
```typescript
// ❌ WRONG: Clicking wrong button (might be clicking tab button)
const collapsedButtons = page.locator('button[aria-expanded="false"]');

// ✅ CORRECT: Need to verify this selector actually finds tree expand buttons
// Check in console: document.querySelectorAll('button[aria-expanded="false"]')
```

---

## What to Report Back

Copy this template and fill it in:

```
=== TREE CONTAINER ===
✅ Confirmed: div.mt-6.bg-white.rounded-lg.shadow

=== LOCATION NAME ===
Element type: <div> or <span>?
Classes: 
Text: "Test Country 1771200045628"

=== EXPAND BUTTON ===
Element: <button>
aria-expanded: "false" ✅
aria-label: "Expand" or "Collapse"?
Text content: ▶ or ▼?
Classes: 

=== ADD LOCATION BUTTON ===
✅ Confirmed: data-testid="add-location-button"
Text: "+ Add Location"

=== CREATE FORM ===
Form element: <form> ✅
Name input: input[name="name"] ✅
Parent select: select[name="parentLocationId"] ✅
Submit button: data-testid="form-submit-button" ✅

=== CRITICAL QUESTION ===
When you run this in console:
  document.querySelectorAll('button[aria-expanded="false"]').length

How many buttons does it find? (Should be 2)
```

---

## Expected Outcome

Once you provide the DOM structure, I'll update these selectors in the test file:

1. **Test #1** - Fix tree container and form selectors
2. **Test #2** - Fix location row selectors (div not tr)
3. **Test #3** - Fix expand button selector (verify it's finding tree buttons, not tab buttons)
4. **Test #4** - Fix location row selectors (div not tr)

Then we'll re-run the tests and they should pass! 🎉

---

## Why This Matters

The component is working perfectly. The only reason tests are failing is because they're looking for:
- ❌ `<tr>` elements (table rows) - but the tree uses `<div>` elements
- ❌ `data-testid="collapsible-form-content"` - but the form doesn't have this
- ❌ Wrong button selectors - might be clicking tab buttons instead of tree expand buttons

Once we have the correct selectors, all 4 tests will pass!
