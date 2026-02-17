# DOM Inspection Guide for Location Hierarchy Tests

**Date**: February 15, 2026  
**Purpose**: Find the correct selectors for E2E tests

## Step-by-Step DOM Inspection

### Step 1: Open DevTools Elements Tab

1. Press **F12** (or right-click → Inspect)
2. Click the **Elements** tab
3. Click the **Select Element** tool (top-left corner, looks like a cursor in a box)

### Step 2: Find the Tree Container

**What to look for**: The main container that holds all location tree nodes

**How to find it**:
1. Click on any location name in the tree (e.g., "Test Country 1771200045628")
2. DevTools will highlight the element
3. Look at the HTML structure in Elements tab

**What to document**:
```
Container element:
- Tag: <div>, <ul>, <section>?
- Class names: class="..."
- Data attributes: data-testid="...", data-tree="..."
- ID: id="..."
```

**Example of what you might see**:
```html
<div class="space-y-2 mt-4">
  <!-- This is the tree container -->
  <div class="border-b border-gray-200">
    <!-- This is a tree node -->
  </div>
</div>
```

### Step 3: Find Location Name Elements

**What to look for**: The text elements showing location names

**How to find it**:
1. Right-click on "Test Country 1771200045628" text
2. Select "Inspect"
3. Look at the element containing the text

**What to document**:
```
Location name element:
- Tag: <span>, <div>, <button>?
- Class names: class="..."
- Parent element structure
- Any data attributes
```

**Example**:
```html
<span class="font-medium text-gray-900">
  Test Country 1771200045628
</span>
```

### Step 4: Find Expand/Collapse Buttons

**What to look for**: The ▶ button that expands/collapses children

**How to find it**:
1. Look for the ▶ symbol next to "Test Country 1771200045628"
2. Right-click on it → Inspect
3. Check the button element

**What to document**:
```
Expand button:
- Tag: <button>
- aria-expanded: "false" or "true"
- aria-label: "..."
- Class names: class="..."
- Icon/symbol: ▶, ▼, or SVG?
```

**Example**:
```html
<button 
  type="button"
  aria-expanded="false"
  aria-label="Expand Test Country 1771200045628"
  class="p-1 hover:bg-gray-100 rounded"
>
  ▶
</button>
```

### Step 5: Find the "Add Location" Button

**What to look for**: The button that opens the create form

**How to find it**:
1. Scroll to top of page
2. Right-click "Add Location" button → Inspect

**What to document**:
```
Add button:
- Tag: <button>
- Text content: "Add Location"
- Class names: class="..."
- Any data attributes
```

### Step 6: Find the Create Form

**What to look for**: The form that appears when you click "Add Location"

**How to find it**:
1. Click "Add Location" button
2. Right-click on the form → Inspect
3. Look at form structure

**What to document**:
```
Form container:
- Tag: <form>, <div>?
- Class names: class="..."
- Visible/hidden state

Form fields:
- Name input: <input name="..." />
- Type select: <select name="..." />
- Parent select: <select name="..." />

Submit button:
- Tag: <button type="submit">
- Text: "Create", "Save"?
- Class names: class="..."
```

## Quick Copy-Paste Template

Copy this and fill it in while inspecting:

```
=== TREE CONTAINER ===
Element: 
Classes: 
Data attributes: 

=== LOCATION NAME ===
Element: 
Classes: 
Text content: "Test Country 1771200045628"
Parent structure: 

=== EXPAND BUTTON ===
Element: <button>
aria-expanded: 
aria-label: 
Classes: 
Icon: 

=== ADD LOCATION BUTTON ===
Element: 
Text: 
Classes: 

=== CREATE FORM ===
Form element: 
Form classes: 
Name input: 
Type select: 
Submit button: 
Submit button text: 
```

## What the E2E Tests Need

Once you have this information, the E2E tests need these selectors:

### Test #1: Create hierarchical structure
```typescript
// Find tree container
await page.locator('[YOUR_TREE_SELECTOR]')

// Find location by name
await page.locator('text=Test Country 1771200045628')
```

### Test #2 & #4: Form submission
```typescript
// Find Add button
await page.click('[YOUR_ADD_BUTTON_SELECTOR]')

// Find form
await page.locator('[YOUR_FORM_SELECTOR]')

// Find submit button
await page.click('[YOUR_SUBMIT_BUTTON_SELECTOR]')
```

### Test #3: Expand/collapse
```typescript
// Find expand button for specific location
await page.locator('[aria-label="Expand Test Country 1771200045628"]')
// OR
await page.locator('button[aria-expanded="false"]').first()
```

## Common Selector Patterns

Here are typical patterns you might find:

### By Text Content
```typescript
page.locator('text=Test Country 1771200045628')
page.getByText('Add Location')
```

### By Role and Name
```typescript
page.getByRole('button', { name: 'Add Location' })
page.getByRole('button', { name: /expand/i })
```

### By Test ID (if present)
```typescript
page.locator('[data-testid="location-tree"]')
page.locator('[data-testid="add-location-btn"]')
```

### By ARIA Attributes
```typescript
page.locator('[aria-expanded="false"]')
page.locator('[aria-label*="Expand"]')
```

### By Class Names (less reliable)
```typescript
page.locator('.location-tree')
page.locator('.tree-node')
```

## Pro Tips

1. **Use the Console**: In DevTools Console, test selectors:
   ```javascript
   document.querySelector('[YOUR_SELECTOR]')
   document.querySelectorAll('[YOUR_SELECTOR]')
   ```

2. **Check Uniqueness**: Make sure your selector only finds ONE element:
   ```javascript
   document.querySelectorAll('[YOUR_SELECTOR]').length
   // Should return 1 for unique selectors
   ```

3. **Prefer Semantic Selectors**: Use roles, labels, and text content over class names

4. **Check Visibility**: Make sure elements are visible:
   ```javascript
   const el = document.querySelector('[YOUR_SELECTOR]');
   console.log(window.getComputedStyle(el).display); // Should not be "none"
   ```

## Next Steps After Inspection

1. **Document your findings** using the template above
2. **Share the selectors** with me
3. **I'll update the E2E tests** with the correct selectors
4. **Re-run tests** to verify they pass

## Example of Good Documentation

```
=== TREE CONTAINER ===
Element: <div class="space-y-2 mt-4">
Classes: space-y-2 mt-4
Data attributes: none

=== LOCATION NAME ===
Element: <span class="font-medium text-gray-900">
Classes: font-medium text-gray-900
Text content: "Test Country 1771200045628"
Parent structure: <div> → <div> → <span>

=== EXPAND BUTTON ===
Element: <button type="button">
aria-expanded: "false"
aria-label: none (this is a problem!)
Classes: p-1 hover:bg-gray-100 rounded
Icon: ▶ (text content)

=== ADD LOCATION BUTTON ===
Element: <button type="button">
Text: "Add Location"
Classes: bg-jungle-600 text-white px-4 py-2 rounded

=== CREATE FORM ===
Form element: <form>
Form classes: p-4 space-y-4
Name input: <input name="name" type="text">
Type select: <select name="type">
Submit button: <button type="submit">
Submit button text: "Create"
```

This level of detail is perfect for fixing the E2E tests!
