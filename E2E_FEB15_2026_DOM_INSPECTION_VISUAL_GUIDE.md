# Visual DOM Inspection Guide

**Date**: February 15, 2026  
**Purpose**: Step-by-step visual guide for DOM inspection

---

## Step 1: Open the Page

1. Open browser to: http://localhost:3000/admin/locations
2. Login: `admin@example.com` / `test-password-123`
3. You should see this:

```
┌────────────────────────────────────────────────────────────┐
│ Locations                                                  │
│ Manage location hierarchy                                 │
│                                                            │
│ [Search locations...]  [+ Add Location]                   │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │  ▶ 📍 Test Country 1771200045628    [Edit] [Delete]   │ │
│ │                                                        │ │
│ │  ▶ 📍 test country two              [Edit] [Delete]   │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## Step 2: Open DevTools

**Press F12** (or right-click anywhere → Inspect)

You'll see:
```
┌─────────────────────────────────────────────────────────────┐
│ Browser Window                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Locations page (as shown above)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ DevTools                                                │ │
│ │ [Elements] [Console] [Network] ...                      │ │
│ │                                                         │ │
│ │ <html>                                                  │ │
│ │   <body>                                                │ │
│ │     <div id="__next">                                   │ │
│ │       ...                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 3: Inspect the Tree Container

**What to do:**
1. Click the **Elements** tab in DevTools
2. Click the **Select Element** tool (top-left corner of DevTools, looks like: 🔍)
3. Hover over the white box containing the locations
4. Click on it

**What you'll see in DevTools:**
```html
<div class="mt-6 bg-white rounded-lg shadow">
  <div>
    <div class="border-b border-gray-200">
      <div class="flex items-center py-3 px-4 hover:bg-gray-50" style="padding-left: 16px;">
        <button ...>▶</button>
        <span class="mr-2">📍</span>
        <div class="flex-1">
          <div class="font-medium text-gray-900">Test Country 1771200045628</div>
        </div>
        <div class="flex gap-2">
          <button ...>Edit</button>
          <button ...>Delete</button>
        </div>
      </div>
    </div>
    <!-- More location nodes... -->
  </div>
</div>
```

**✅ Confirm:** The tree container is `div.mt-6.bg-white.rounded-lg.shadow`

---

## Step 4: Inspect a Location Name

**What to do:**
1. In the browser (top half), right-click on "Test Country 1771200045628"
2. Select "Inspect"
3. DevTools will jump to that element

**What you'll see highlighted:**
```html
<div class="font-medium text-gray-900">Test Country 1771200045628</div>
```

**Document:**
- Element type: `<div>` ✅
- Classes: `font-medium text-gray-900` ✅
- Parent: `<div class="flex-1">` ✅

---

## Step 5: Inspect the Expand Button

**What to do:**
1. In the browser, right-click on the **▶** symbol (the arrow)
2. Select "Inspect"
3. Look at the `<button>` element

**What you'll see:**
```html
<button
  type="button"
  aria-label="Expand"
  aria-expanded="false"
  class="mr-2 text-gray-500 hover:text-gray-700"
>
  ▶
</button>
```

**Document:**
- Has `aria-expanded="false"` ✅
- Has `aria-label="Expand"` ✅
- Text content: `▶` ✅

**CRITICAL TEST:** In the Console tab, run:
```javascript
document.querySelectorAll('button[aria-expanded="false"]').length
```

**Expected result:** `2` (one for each location)

**If you get a different number**, that means the selector is finding other buttons too!

---

## Step 6: Test the Expand Button

**What to do:**
1. In the browser, click the **▶** button next to "Test Country 1771200045628"
2. Watch what happens in DevTools

**What should happen:**
- The button should change from `▶` to `▼`
- The `aria-expanded` attribute should change from `"false"` to `"true"`
- Child locations should appear below (if any exist)

**In DevTools, you should see:**
```html
<button
  type="button"
  aria-label="Collapse"
  aria-expanded="true"
  class="mr-2 text-gray-500 hover:text-gray-700"
>
  ▼
</button>
```

**✅ Confirm:** The `aria-expanded` attribute changes when you click

---

## Step 7: Inspect the Add Location Button

**What to do:**
1. Scroll to top of page
2. Right-click the blue **"+ Add Location"** button
3. Select "Inspect"

**What you'll see:**
```html
<button
  data-testid="add-location-button"
  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
>
  + Add Location
</button>
```

**✅ Confirm:** Has `data-testid="add-location-button"` (perfect!)

---

## Step 8: Inspect the Create Form

**What to do:**
1. In the browser, click the **"+ Add Location"** button
2. Wait for the form to appear
3. Right-click anywhere in the form area
4. Select "Inspect"

**What you'll see:**
```html
<form>
  <div class="space-y-4">
    <div>
      <label>Location Name</label>
      <input name="name" type="text" placeholder="e.g., Tamarindo Beach" />
    </div>
    <div>
      <label>Parent Location</label>
      <select name="parentLocationId">
        <option value="">None (Root Location)</option>
        <option value="5c58e200-...">Test Country 1771200045628</option>
        <option value="e98840e1-...">test country two</option>
      </select>
    </div>
    <div>
      <label>Address</label>
      <input name="address" type="text" />
    </div>
    <div>
      <label>Description</label>
      <textarea name="description"></textarea>
    </div>
    <button type="submit" data-testid="form-submit-button">
      Create
    </button>
  </div>
</form>
```

**✅ Confirm:**
- Form element: `<form>` ✅
- Name input: `input[name="name"]` ✅
- Parent select: `select[name="parentLocationId"]` ✅
- Submit button: `data-testid="form-submit-button"` ✅

---

## Step 9: Console Tests

Open the **Console** tab in DevTools and run these commands:

### Test 1: Find tree container
```javascript
document.querySelector('div.mt-6.bg-white.rounded-lg.shadow')
```
**Expected:** Should return the tree container div

### Test 2: Find location by text
```javascript
document.evaluate("//text()[contains(., 'Test Country 1771200045628')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
```
**Expected:** Should return the text node

### Test 3: Count expand buttons
```javascript
document.querySelectorAll('button[aria-expanded]').length
```
**Expected:** `2` (one for each location)

### Test 4: Find collapsed buttons
```javascript
document.querySelectorAll('button[aria-expanded="false"]').length
```
**Expected:** `2` (both locations start collapsed)

### Test 5: Find Add Location button
```javascript
document.querySelector('[data-testid="add-location-button"]')
```
**Expected:** Should return the Add Location button

### Test 6: Find form (after clicking Add Location)
```javascript
// First click Add Location button, then run:
document.querySelector('form')
```
**Expected:** Should return the form element

---

## Step 10: Report Your Findings

Copy this template and fill in what you found:

```
=== INSPECTION RESULTS ===

1. Tree Container:
   ✅ Confirmed: div.mt-6.bg-white.rounded-lg.shadow

2. Location Name Element:
   Element: <div>
   Classes: font-medium text-gray-900
   
3. Expand Button:
   Element: <button>
   aria-expanded: "false" (changes to "true" when clicked)
   aria-label: "Expand" (changes to "Collapse" when clicked)
   Text: ▶ (changes to ▼ when clicked)
   
4. Console Test Results:
   - document.querySelectorAll('button[aria-expanded]').length = ?
   - document.querySelectorAll('button[aria-expanded="false"]').length = ?
   
5. Add Location Button:
   ✅ Confirmed: data-testid="add-location-button"
   
6. Form Elements:
   ✅ Form: <form>
   ✅ Name input: input[name="name"]
   ✅ Parent select: select[name="parentLocationId"]
   ✅ Submit button: data-testid="form-submit-button"

=== CRITICAL QUESTION ===
When you click the expand button (▶), does the aria-expanded 
attribute change from "false" to "true"?
   [ ] YES - attribute changes
   [ ] NO - attribute stays the same
```

---

## What Happens Next

Once you provide these findings, I'll:

1. ✅ Update Test #1 selectors (tree container, form)
2. ✅ Update Test #2 selectors (location rows)
3. ✅ Update Test #3 selectors (expand buttons)
4. ✅ Update Test #4 selectors (location rows, delete buttons)

Then we'll re-run the tests and they should all pass! 🎉

---

## Quick Reference: What Tests Are Looking For

| Test | Current Selector (WRONG) | What We Need |
|------|-------------------------|--------------|
| #1 | `getByTestId('collapsible-form-content')` | Actual form element |
| #1 | `div.mt-6.bg-white.rounded-lg.shadow` | ✅ Already correct |
| #2 | `tr:has-text("Location A")` | `div:has-text("Location A")` |
| #3 | `button[aria-expanded="false"]` | ✅ Verify this works |
| #4 | `tr:has-text("Delete Parent")` | `div:has-text("Delete Parent")` |

The main issue is tests are looking for **table rows** (`<tr>`) but the tree uses **divs** (`<div>`).
