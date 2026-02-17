# Playwright UI Mode - Visual Debugging Guide

## 🎯 What You're Looking For

The tests are failing because **forms aren't opening after clicking "Add" buttons**. Here's exactly what to watch for:

---

## 🚀 How to Run UI Mode

```bash
# Test the content page creation (line 30)
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts:30 --ui

# Or test event creation (line 519)
npx playwright test __tests__/e2e/admin/contentManagement.spec.ts:519 --ui
```

This opens a visual interface where you can:
- ⏯️ Play/pause the test
- 🐌 Watch in slow motion
- 🔍 Inspect the DOM at any moment
- 📸 See screenshots of each step

---

## 👀 What to Watch (Step by Step)

### Step 1: Does the "Add Page" button exist?
**What you'll see:**
- The test navigates to `/admin/content-pages`
- Look for a button that says "Add Page" or "Add New"

**What to check:**
- ✅ Is the button visible on screen?
- ✅ Does it have the right text?
- ❌ If NO button → The page layout might have changed

### Step 2: Does the button get clicked?
**What you'll see:**
- Playwright will highlight the button when it clicks it
- You'll see a flash/outline around the clicked element

**What to check:**
- ✅ Does the button flash/highlight?
- ✅ Does the button respond to the click?
- ❌ If NO highlight → The selector might be wrong

### Step 3: Does a form appear? ⚠️ THIS IS WHERE IT'S FAILING
**What you'll see (or NOT see):**
- After clicking, a form should slide down or fade in
- The form has inputs for "Title" and "Slug"

**What to check:**
- ❌ **If NO form appears** → This is the bug! The form isn't opening.
- ✅ **If form appears but is hidden** → Check CSS (opacity, display, height)
- ✅ **If form appears slowly** → We need longer wait times

### Step 4: Check the DOM Inspector
**In UI mode, click the "DOM" tab:**
- Look for `<ContentPageForm>` or form elements
- Check if they exist but are hidden
- Look for CSS like:
  - `display: none`
  - `opacity: 0`
  - `height: 0`
  - `visibility: hidden`

---

## 🔍 Specific Things to Look For

### Content Pages (line 30)
```typescript
// The test clicks this button:
button:has-text("Add Page")

// Then looks for this input:
input[name="title"]
```

**What you should see:**
1. Button click → Form slides down
2. Form contains: Title input, Slug input, Create button
3. Form is visible (not hidden)

**If form doesn't appear:**
- Check if `isFormOpen` state is changing (React DevTools)
- Check if `ContentPageForm` component is rendering
- Check if there's a CSS transition delay

### Events Page (line 519)
```typescript
// The test clicks this button:
button:has-text("Add Event")

// Then looks for this input:
input[name="name"]
```

**What you should see:**
1. Button click → Collapsible form expands
2. Form contains: Name input, Date input, Location selector
3. Form is visible and interactive

---

## 🐛 Common Issues to Spot

### Issue 1: Form is Lazy-Loaded
**What it looks like:**
- Button clicks
- Nothing happens for 1-2 seconds
- Then form appears

**Solution:** Increase wait time from 1000ms to 2000ms or 3000ms

### Issue 2: Form Has CSS Transition
**What it looks like:**
- Form exists in DOM but is animating in
- Height goes from 0 → full height over 300ms

**Solution:** Wait for form to be fully visible, not just present

### Issue 3: Wrong Button Selector
**What it looks like:**
- Test says it clicked the button
- But nothing happens on screen
- Button might be a different one

**Solution:** Check if there are multiple "Add" buttons and we're clicking the wrong one

### Issue 4: React State Not Updating
**What it looks like:**
- Button clicks
- `isFormOpen` stays `false`
- Form never renders

**Solution:** Check if button's `onClick` handler is wired up correctly

---

## 📊 What to Report Back

After running UI mode, tell me:

1. **Does the button exist and get clicked?**
   - Yes/No
   - If no, what buttons DO you see?

2. **Does a form appear after clicking?**
   - Yes/No
   - If yes, how long does it take?
   - If no, what DOES happen?

3. **If form appears, is it visible or hidden?**
   - Visible
   - Hidden (check CSS)
   - Partially visible (animating)

4. **Any JavaScript errors in console?**
   - Yes (copy the error)
   - No

---

## 🎬 Quick Visual Guide

```
EXPECTED FLOW:
1. Page loads → ✅
2. Click "Add Page" → ✅
3. Form slides down → ❌ FAILING HERE
4. Fill title input → Can't reach this step
5. Click Create → Can't reach this step
6. Item appears in list → Can't reach this step
```

**The test is failing at step 3** - the form isn't opening.

---

## 💡 Alternative: Just Tell Me What You See

If UI mode is confusing, just:
1. Open http://localhost:3000/admin/content-pages in your browser
2. Click the "Add Page" button
3. Tell me what happens:
   - Does a form appear?
   - How long does it take?
   - What does the form look like?

That's all I need to know to fix the tests! 🎯
