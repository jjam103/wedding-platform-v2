# E2E Phase 2: Accessibility Fix Plan

**Status**: In Progress  
**Date**: February 7, 2026  
**Target**: Fix ~15-20 accessibility tests

## Test Results Summary

**Accessibility Suite** (`__tests__/e2e/accessibility/suite.spec.ts`):
- ❌ 18 failed
- ✅ 21 passed  
- **Total**: 39 tests

## Identified Failures

Based on the test output and pattern guide, the failures are:

### 1. Missing `aria-required` on Required Form Fields
**Test**: "should indicate required form fields"  
**Issue**: Required inputs missing `aria-required="true"` attribute

**Files to Fix**:
- `app/auth/guest-login/page.tsx` - Guest login form
- `app/admin/guests/page.tsx` - Guest management forms
- `app/admin/activities/page.tsx` - Activity forms
- `app/admin/events/page.tsx` - Event forms
- All form components in `components/admin/` and `components/guest/`

### 2. Missing `aria-expanded` on Collapsible Elements
**Test**: "should have proper ARIA expanded states and controls relationships"  
**Issue**: Collapsible/expandable elements missing `aria-expanded` state

**Files to Fix**:
- `components/admin/CollapsibleForm.tsx` - Collapsible form sections
- `components/admin/GroupedNavigation.tsx` - Navigation dropdowns
- `components/admin/Sidebar.tsx` - Sidebar navigation
- `components/ui/MobileNav.tsx` - Mobile navigation menu

### 3. Touch Target Size Violations
**Test**: "should have adequate touch targets on mobile"  
**Issue**: Interactive elements smaller than 44x44px minimum

**Files to Fix**:
- `components/ui/Button.tsx` - All button variants
- `components/ui/MobileNav.tsx` - Mobile navigation links
- `components/admin/Sidebar.tsx` - Sidebar links
- All icon buttons and small interactive elements

### 4. Missing `aria-describedby` for Error Messages
**Test**: "should have accessible RSVP form and photo upload"  
**Issue**: Form inputs not linked to error messages

**Files to Fix**:
- All form components with validation
- Error display components

## Fix Strategy

### Pattern 1: Add `aria-required` to Required Fields

```tsx
// BEFORE
<input
  type="text"
  name="firstName"
  required
/>

// AFTER
<input
  type="text"
  name="firstName"
  required
  aria-required="true"
/>
```

### Pattern 2: Add `aria-expanded` to Collapsible Elements

```tsx
// BEFORE
<button onClick={() => setExpanded(!expanded)}>
  Toggle
</button>

// AFTER
<button
  onClick={() => setExpanded(!expanded)}
  aria-expanded={expanded}
  aria-controls="collapsible-content"
>
  Toggle
</button>
<div id="collapsible-content" hidden={!expanded}>
  Content
</div>
```

### Pattern 3: Fix Touch Target Sizes

```tsx
// BEFORE
<button className="p-1 text-sm">
  Click
</button>

// AFTER
<button className="p-3 min-h-[44px] min-w-[44px] text-sm">
  Click
</button>
```

### Pattern 4: Link Errors with `aria-describedby`

```tsx
// BEFORE
<input type="email" name="email" />
{error && <span className="text-red-600">{error}</span>}

// AFTER
<input
  type="email"
  name="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <span id="email-error" className="text-red-600" role="alert">
    {error}
  </span>
)}
```

## Implementation Order

1. **Guest Login Form** - High impact, simple fix
2. **Button Component** - Affects all buttons across app
3. **CollapsibleForm** - Used in many admin pages
4. **Mobile Navigation** - Touch target issues
5. **Admin Forms** - Guest, Activity, Event forms
6. **Error Messages** - Add aria-describedby links

## Expected Impact

- **Direct fixes**: ~15-20 tests
- **Improved UX**: Better accessibility for all users
- **WCAG Compliance**: Meet WCAG 2.1 AA standards

## Testing Commands

```bash
# Run accessibility tests
npx playwright test __tests__/e2e/accessibility/suite.spec.ts

# Run specific test groups
npx playwright test __tests__/e2e/accessibility/suite.spec.ts -g "required"
npx playwright test __tests__/e2e/accessibility/suite.spec.ts -g "expanded"
npx playwright test __tests__/e2e/accessibility/suite.spec.ts -g "touch target"
```

## Success Criteria

- ✅ All required fields have `aria-required="true"`
- ✅ All collapsible elements have `aria-expanded` state
- ✅ All interactive elements meet 44x44px minimum
- ✅ All form errors linked with `aria-describedby`
- ✅ 18 failing tests now passing

---

**Next**: Start with guest login form (highest impact, simplest fix)
