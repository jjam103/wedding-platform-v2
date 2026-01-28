# Manual Accessibility Testing Guide

This guide provides comprehensive instructions for performing manual accessibility testing on the Destination Wedding Platform admin interface.

**Requirements:** 21.1-21.7

## Overview

Manual accessibility testing complements automated testing by validating real-world user experiences with assistive technologies. This guide covers:

1. Keyboard-only navigation testing
2. Screen reader compatibility testing (NVDA, JAWS, VoiceOver)
3. Color contrast verification (WCAG 2.1 AA)
4. Zoom testing up to 200%

## Prerequisites

### Required Tools

#### Screen Readers
- **Windows**: NVDA (free) - https://www.nvaccess.org/download/
- **Windows**: JAWS (commercial trial) - https://www.freedomscientific.com/downloads/jaws/
- **macOS**: VoiceOver (built-in) - Enable in System Preferences > Accessibility
- **Linux**: Orca (free) - Pre-installed on most distributions

#### Browser Extensions
- **axe DevTools** - https://www.deque.com/axe/devtools/
- **WAVE** - https://wave.webaim.org/extension/
- **Lighthouse** (built into Chrome DevTools)

#### Color Contrast Tools
- **Contrast Checker** - https://webaim.org/resources/contrastchecker/
- **Color Contrast Analyzer** - https://www.tpgi.com/color-contrast-checker/

## Test Environment Setup

### 1. Start the Development Server

```bash
npm run dev
```

Navigate to: http://localhost:3000/admin

### 2. Enable Screen Reader

#### Windows (NVDA)
1. Install NVDA from https://www.nvaccess.org/download/
2. Launch NVDA (Desktop shortcut or Ctrl+Alt+N)
3. NVDA will announce "NVDA started"

#### macOS (VoiceOver)
1. Press Cmd+F5 to toggle VoiceOver
2. VoiceOver will announce "VoiceOver on"
3. Use VoiceOver Utility (Cmd+F8) for settings

#### Linux (Orca)
1. Press Super+Alt+S to toggle Orca
2. Orca will announce "Screen reader on"

## Testing Procedures

---

## 1. Keyboard-Only Navigation Testing

**Objective:** Verify all functionality is accessible without a mouse.

### Test Setup
1. Disconnect or disable your mouse
2. Use only keyboard for all interactions
3. Document any functionality that cannot be accessed

### Key Combinations to Test

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Navigate forward | Tab | Tab |
| Navigate backward | Shift+Tab | Shift+Tab |
| Activate button/link | Enter or Space | Enter or Space |
| Open dropdown | Enter or Space | Enter or Space |
| Navigate dropdown | Arrow keys | Arrow keys |
| Close modal/dialog | Escape | Escape |
| Submit form | Enter | Enter |
| Save (shortcut) | Ctrl+S | Cmd+S |

### Test Checklist

#### Admin Dashboard
- [ ] Tab through all navigation items
- [ ] Verify focus indicators are visible on all elements
- [ ] Activate each navigation link with Enter
- [ ] Verify current page is indicated
- [ ] Test grouped navigation expand/collapse with Enter/Space
- [ ] Navigate through all groups using Tab

#### Collapsible Forms
- [ ] Tab to "Add New" button
- [ ] Activate with Enter or Space to expand form
- [ ] Tab through all form fields
- [ ] Verify focus order is logical (top to bottom, left to right)
- [ ] Fill out form using keyboard only
- [ ] Submit form with Enter
- [ ] Cancel form with Escape or Tab to Cancel button
- [ ] Verify unsaved changes warning appears when appropriate

#### Data Tables
- [ ] Tab to table
- [ ] Navigate table rows with Tab
- [ ] Activate row actions (Edit, Delete) with Enter
- [ ] Navigate to pagination controls
- [ ] Change pages using keyboard
- [ ] Test sorting by activating column headers

#### Modal Dialogs
- [ ] Open modal with keyboard
- [ ] Verify focus moves to modal
- [ ] Tab through modal content
- [ ] Verify focus is trapped within modal
- [ ] Close modal with Escape
- [ ] Verify focus returns to trigger element

#### Dropdown Menus
- [ ] Tab to dropdown
- [ ] Open with Enter or Space
- [ ] Navigate options with Arrow keys
- [ ] Select option with Enter
- [ ] Close without selecting with Escape

#### Search and Filters
- [ ] Tab to search input
- [ ] Type search query
- [ ] Navigate to filter dropdowns
- [ ] Apply filters using keyboard
- [ ] Clear filters using keyboard

### Expected Results
✅ **PASS**: All functionality accessible via keyboard
✅ **PASS**: Focus indicators visible on all interactive elements
✅ **PASS**: Logical tab order throughout application
✅ **PASS**: No keyboard traps (can always navigate away)
✅ **PASS**: Escape key closes modals and dropdowns

❌ **FAIL**: Any functionality requires mouse
❌ **FAIL**: Focus indicators missing or invisible
❌ **FAIL**: Illogical tab order
❌ **FAIL**: Keyboard trap (cannot navigate away)

---

## 2. Screen Reader Compatibility Testing

**Objective:** Verify all content and functionality is announced correctly by screen readers.

### Test Setup
1. Enable screen reader (see Prerequisites)
2. Navigate using screen reader commands
3. Listen to all announcements
4. Document missing or incorrect announcements

### Screen Reader Commands

#### NVDA (Windows)
| Action | Command |
|--------|---------|
| Read next item | Down Arrow |
| Read previous item | Up Arrow |
| Read current line | Insert+Up Arrow |
| Read from cursor | Insert+Down Arrow |
| Navigate headings | H (next), Shift+H (previous) |
| Navigate links | K (next), Shift+K (previous) |
| Navigate buttons | B (next), Shift+B (previous) |
| Navigate form fields | F (next), Shift+F (previous) |
| Navigate tables | T (next), Shift+T (previous) |
| Navigate landmarks | D (next), Shift+D (previous) |
| List all headings | Insert+F7 |
| List all links | Insert+F7, then Tab |
| Stop reading | Ctrl |

#### VoiceOver (macOS)
| Action | Command |
|--------|---------|
| Start/Stop | Cmd+F5 |
| Navigate next | VO+Right Arrow |
| Navigate previous | VO+Left Arrow |
| Activate item | VO+Space |
| Navigate headings | VO+Cmd+H |
| Navigate links | VO+Cmd+L |
| Navigate form controls | VO+Cmd+J |
| Navigate tables | VO+Cmd+T |
| Navigate landmarks | VO+U |
| Read from top | VO+A |
| Stop reading | Ctrl |

*VO = Ctrl+Option*

### Test Checklist

#### Page Structure
- [ ] Page title is announced when page loads
- [ ] Main heading (h1) is announced
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Landmark regions are announced (banner, navigation, main, contentinfo)
- [ ] Skip navigation link is available and functional

#### Navigation
- [ ] Navigation menu is announced as "navigation"
- [ ] Current page is indicated
- [ ] Navigation groups are announced with expand/collapse state
- [ ] Badge counts are announced (e.g., "3 pending items")
- [ ] Links have descriptive text (not "click here")

#### Forms
- [ ] Form fields have associated labels
- [ ] Required fields are announced as "required"
- [ ] Field types are announced (text, email, select, etc.)
- [ ] Help text is announced
- [ ] Error messages are announced
- [ ] Error messages are associated with fields
- [ ] Success messages are announced

#### Interactive Elements
- [ ] Buttons are announced as "button"
- [ ] Links are announced as "link"
- [ ] Current state is announced (expanded, collapsed, selected)
- [ ] Disabled elements are announced as "disabled"
- [ ] Loading states are announced

#### Dynamic Content
- [ ] Live regions announce updates
- [ ] Toast notifications are announced
- [ ] Form validation errors are announced
- [ ] Success messages are announced
- [ ] Loading indicators are announced

#### Tables
- [ ] Tables are announced as "table"
- [ ] Table captions are announced
- [ ] Column headers are announced
- [ ] Row headers are announced (if applicable)
- [ ] Cell content is announced with context

#### Modals and Dialogs
- [ ] Modal opening is announced
- [ ] Modal title is announced
- [ ] Modal role is "dialog"
- [ ] Focus moves to modal
- [ ] Modal content is accessible
- [ ] Modal closing is announced
- [ ] Focus returns to trigger

### Expected Results
✅ **PASS**: All content is announced
✅ **PASS**: Announcements are clear and descriptive
✅ **PASS**: Interactive elements have proper roles
✅ **PASS**: Dynamic content updates are announced
✅ **PASS**: Forms are fully accessible

❌ **FAIL**: Content not announced
❌ **FAIL**: Unclear or confusing announcements
❌ **FAIL**: Missing or incorrect ARIA roles
❌ **FAIL**: Dynamic updates not announced
❌ **FAIL**: Forms missing labels or associations

---

## 3. Color Contrast Verification

**Objective:** Verify all text and interactive elements meet WCAG 2.1 AA contrast requirements.

### Contrast Requirements

#### WCAG 2.1 Level AA
- **Normal text** (< 18pt or < 14pt bold): 4.5:1 minimum
- **Large text** (≥ 18pt or ≥ 14pt bold): 3:1 minimum
- **UI components and graphics**: 3:1 minimum

### Test Procedure

#### Using Browser DevTools
1. Open Chrome DevTools (F12)
2. Select element with text
3. Check "Contrast" section in Styles panel
4. Verify checkmarks for AA and AAA compliance

#### Using Contrast Checker Tool
1. Open https://webaim.org/resources/contrastchecker/
2. Enter foreground color (text color)
3. Enter background color
4. Verify WCAG AA compliance

### Test Checklist

#### Text Colors
- [ ] Body text (sage-900 on white): ___:1 ratio
- [ ] Secondary text (sage-700 on white): ___:1 ratio
- [ ] Tertiary text (sage-600 on white): ___:1 ratio
- [ ] Link text (jungle-600 on white): ___:1 ratio
- [ ] Error text (volcano-700 on white): ___:1 ratio
- [ ] Success text (jungle-700 on white): ___:1 ratio

#### Button Colors
- [ ] Primary button (white on jungle-600): ___:1 ratio
- [ ] Secondary button (sage-900 on sage-100): ___:1 ratio
- [ ] Danger button (white on volcano-600): ___:1 ratio
- [ ] Disabled button (sage-400 on sage-100): ___:1 ratio

#### Status Badges
- [ ] Active badge (jungle-800 on jungle-100): ___:1 ratio
- [ ] Inactive badge (sage-800 on sage-100): ___:1 ratio
- [ ] Warning badge (sunset-800 on sunset-100): ___:1 ratio
- [ ] Error badge (volcano-800 on volcano-100): ___:1 ratio

#### Form Elements
- [ ] Input text (sage-900 on white): ___:1 ratio
- [ ] Input border (sage-300): ___:1 ratio (3:1 minimum)
- [ ] Placeholder text (sage-400 on white): ___:1 ratio
- [ ] Focus indicator (jungle-500): ___:1 ratio (3:1 minimum)

#### Navigation
- [ ] Navigation text (sage-700 on white): ___:1 ratio
- [ ] Active navigation (jungle-700 on jungle-50): ___:1 ratio
- [ ] Hover state (sage-900 on sage-50): ___:1 ratio

### Expected Results
✅ **PASS**: All text meets 4.5:1 minimum (or 3:1 for large text)
✅ **PASS**: All UI components meet 3:1 minimum
✅ **PASS**: Focus indicators meet 3:1 minimum

❌ **FAIL**: Text below 4.5:1 (or 3:1 for large text)
❌ **FAIL**: UI components below 3:1
❌ **FAIL**: Focus indicators below 3:1

---

## 4. Zoom Testing (up to 200%)

**Objective:** Verify application remains functional and readable at 200% zoom.

### Test Procedure

#### Browser Zoom
1. Open application in browser
2. Zoom to 200% (Ctrl/Cmd + Plus key, or Ctrl/Cmd + 0 then Ctrl/Cmd + Plus 5 times)
3. Test all functionality
4. Verify no content is cut off or overlapping

### Test Checklist

#### Layout
- [ ] Page layout adapts to zoom level
- [ ] No horizontal scrolling required
- [ ] Content reflows appropriately
- [ ] No overlapping elements
- [ ] All content remains visible

#### Navigation
- [ ] Navigation menu remains accessible
- [ ] All navigation items visible
- [ ] Grouped navigation works correctly
- [ ] Mobile navigation appears if appropriate

#### Forms
- [ ] Form fields remain usable
- [ ] Labels remain associated with inputs
- [ ] Buttons remain clickable
- [ ] Error messages remain visible
- [ ] Help text remains readable

#### Tables
- [ ] Table content remains readable
- [ ] Horizontal scrolling available if needed
- [ ] Column headers remain visible
- [ ] Row actions remain accessible

#### Modals
- [ ] Modals remain centered
- [ ] Modal content remains readable
- [ ] Close button remains accessible
- [ ] Modal doesn't extend beyond viewport

#### Interactive Elements
- [ ] Buttons remain clickable
- [ ] Links remain clickable
- [ ] Dropdowns remain functional
- [ ] Tooltips remain visible

### Expected Results
✅ **PASS**: All content readable at 200% zoom
✅ **PASS**: All functionality remains accessible
✅ **PASS**: Layout adapts appropriately
✅ **PASS**: No content cut off or hidden

❌ **FAIL**: Content unreadable at 200% zoom
❌ **FAIL**: Functionality broken at zoom level
❌ **FAIL**: Layout breaks or overlaps
❌ **FAIL**: Content cut off or hidden

---

## Test Results Documentation

### Test Summary Template

```markdown
# Manual Accessibility Test Results

**Date:** [Date]
**Tester:** [Name]
**Browser:** [Browser and Version]
**Screen Reader:** [Screen Reader and Version]
**Operating System:** [OS and Version]

## Test Results Summary

| Test Category | Status | Issues Found |
|---------------|--------|--------------|
| Keyboard Navigation | ✅ PASS / ❌ FAIL | [Number] |
| Screen Reader (NVDA) | ✅ PASS / ❌ FAIL | [Number] |
| Screen Reader (JAWS) | ✅ PASS / ❌ FAIL | [Number] |
| Screen Reader (VoiceOver) | ✅ PASS / ❌ FAIL | [Number] |
| Color Contrast | ✅ PASS / ❌ FAIL | [Number] |
| Zoom (200%) | ✅ PASS / ❌ FAIL | [Number] |

## Detailed Findings

### Issue 1: [Title]
- **Severity:** Critical / High / Medium / Low
- **Category:** Keyboard / Screen Reader / Contrast / Zoom
- **WCAG Criterion:** [e.g., 2.1.1 Keyboard]
- **Description:** [Detailed description]
- **Steps to Reproduce:**
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected Behavior:** [What should happen]
- **Actual Behavior:** [What actually happens]
- **Recommendation:** [How to fix]

### Issue 2: [Title]
[Same format as above]

## Overall Assessment

[Summary of accessibility compliance]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]
```

---

## Common Issues and Solutions

### Keyboard Navigation Issues

#### Issue: Focus indicator not visible
**Solution:** Add visible focus styles to all interactive elements
```css
button:focus, a:focus, input:focus {
  outline: 2px solid #jungle-500;
  outline-offset: 2px;
}
```

#### Issue: Keyboard trap in modal
**Solution:** Implement focus trapping with proper escape handling
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

### Screen Reader Issues

#### Issue: Button not announced
**Solution:** Add aria-label or ensure button has text content
```tsx
<button aria-label="Close dialog">×</button>
```

#### Issue: Dynamic content not announced
**Solution:** Use ARIA live regions
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>
```

### Color Contrast Issues

#### Issue: Text fails contrast check
**Solution:** Use darker text color or lighter background
```css
/* Before: sage-600 on white (3.8:1) */
color: #6b7280;

/* After: sage-700 on white (4.6:1) */
color: #374151;
```

### Zoom Issues

#### Issue: Content cut off at 200% zoom
**Solution:** Use responsive units and flexible layouts
```css
/* Before: Fixed width */
width: 800px;

/* After: Flexible width */
max-width: 100%;
width: 50rem;
```

---

## Resources

### WCAG 2.1 Guidelines
- https://www.w3.org/WAI/WCAG21/quickref/
- https://www.w3.org/WAI/WCAG21/Understanding/

### Screen Reader Documentation
- **NVDA:** https://www.nvaccess.org/files/nvda/documentation/userGuide.html
- **JAWS:** https://www.freedomscientific.com/training/jaws/
- **VoiceOver:** https://support.apple.com/guide/voiceover/welcome/mac

### Testing Tools
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WAVE:** https://wave.webaim.org/
- **Lighthouse:** https://developers.google.com/web/tools/lighthouse
- **Color Contrast Analyzer:** https://www.tpgi.com/color-contrast-checker/

### Best Practices
- **WebAIM:** https://webaim.org/
- **A11y Project:** https://www.a11yproject.com/
- **Inclusive Components:** https://inclusive-components.design/
- **Deque University:** https://dequeuniversity.com/

---

## Continuous Testing

### When to Test
- Before each release
- After major UI changes
- When adding new components
- After accessibility bug fixes
- Quarterly comprehensive audits

### Automated Testing Integration
- Run automated tests in CI/CD pipeline
- Use Lighthouse CI for continuous monitoring
- Set up accessibility regression testing
- Monitor for new violations

### User Feedback
- Provide accessibility feedback form
- Monitor support tickets for accessibility issues
- Conduct user testing with assistive technology users
- Implement reported fixes promptly

---

## Certification and Compliance

### WCAG 2.1 Level AA Compliance
This application aims to meet WCAG 2.1 Level AA standards:

- ✅ **Perceivable:** Information and UI components presentable to users
- ✅ **Operable:** UI components and navigation operable by all users
- ✅ **Understandable:** Information and UI operation understandable
- ✅ **Robust:** Content interpretable by assistive technologies

### Accessibility Statement
Include an accessibility statement on the website:
- Commitment to accessibility
- Conformance level (WCAG 2.1 AA)
- Known limitations
- Feedback mechanism
- Contact information

---

## Conclusion

Manual accessibility testing is essential for ensuring a truly accessible application. While automated tools catch many issues, manual testing with real assistive technologies provides the most accurate assessment of user experience.

**Remember:** Accessibility is not a one-time task but an ongoing commitment to inclusive design.

For questions or assistance with accessibility testing, consult the resources listed above or reach out to accessibility specialists.
