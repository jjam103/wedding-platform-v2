# Accessibility Testing

This directory contains comprehensive accessibility tests for the Destination Wedding Platform, ensuring WCAG 2.1 AA compliance.

## Test Coverage

### 1. Automated Accessibility Tests (axe-core)
**File:** `axe.accessibility.test.tsx`

Automated testing using axe-core to validate:
- **Color Contrast**: WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- **ARIA Attributes**: Proper use of ARIA labels, roles, and states
- **Form Labels**: All form inputs have associated labels
- **Heading Hierarchy**: Logical heading structure (h1 → h2 → h3)
- **Keyboard Accessibility**: All interactive elements are keyboard accessible
- **Image Alt Text**: All images have appropriate alternative text
- **Landmark Regions**: Proper use of semantic HTML and ARIA landmarks
- **Language Attributes**: HTML lang attribute is set

**Components Tested:**
- AccessibleForm and AccessibleFormField
- GuestDashboard
- RSVPManager
- FamilyManager
- PhotoUpload
- ItineraryViewer
- AccommodationViewer
- TransportationForm

**Run Tests:**
```bash
npm run test:accessibility
```

### 2. Keyboard Navigation Tests (Playwright E2E)
**File:** `../e2e/keyboardNavigation.spec.ts`

Manual keyboard navigation testing to validate:
- **Tab Navigation**: Sequential navigation through interactive elements
- **Shift+Tab**: Backward navigation
- **Enter/Space**: Button and link activation
- **Arrow Keys**: Dropdown and list navigation
- **Escape**: Modal/dialog dismissal
- **Home/End**: Text input navigation
- **Focus Visibility**: Clear focus indicators on all elements
- **Focus Trapping**: Modal dialogs trap focus appropriately
- **Focus Restoration**: Focus returns to trigger after modal closes
- **Skip Navigation**: Skip to main content link works

**Test Scenarios:**
- Guest Portal: RSVP forms, photo upload, itinerary viewing
- Admin Portal: Dashboard navigation, guest management tables
- Forms: Field navigation, validation, submission
- Modals: Opening, navigating, closing
- Tables: Row and cell navigation

**Run Tests:**
```bash
npm run test:e2e -- keyboardNavigation.spec.ts
```

### 3. Screen Reader Compatibility Tests (Playwright E2E)
**File:** `../e2e/screenReader.spec.ts`

Screen reader compatibility testing to validate:
- **ARIA Labels**: All interactive elements have accessible names
- **Live Regions**: Dynamic content changes are announced
- **Semantic HTML**: Proper use of HTML5 semantic elements
- **Form Associations**: Labels properly associated with inputs
- **Error Announcements**: Validation errors announced to screen readers
- **Status Messages**: Success/error messages have proper ARIA roles
- **Table Structure**: Tables have headers and captions
- **Dialog Structure**: Modals have proper ARIA dialog roles
- **Link Text**: Descriptive link text (no "click here")
- **Button Labels**: All buttons have accessible names
- **Required Fields**: Required form fields properly indicated
- **Loading States**: Loading indicators announced with aria-busy

**Test Scenarios:**
- Page structure and landmarks
- Form field labeling and validation
- Dynamic content announcements
- Navigation and current page indication
- Error and success message announcements
- Modal/dialog accessibility
- Table accessibility

**Run Tests:**
```bash
npm run test:e2e -- screenReader.spec.ts
```

## WCAG 2.1 AA Compliance

The platform meets WCAG 2.1 Level AA requirements:

### Perceivable
- ✅ Text alternatives for non-text content
- ✅ Captions and alternatives for multimedia
- ✅ Adaptable content structure
- ✅ Sufficient color contrast (4.5:1 minimum)
- ✅ Text resizable up to 200%

### Operable
- ✅ All functionality available via keyboard
- ✅ No keyboard traps
- ✅ Sufficient time for interactions
- ✅ No content that causes seizures
- ✅ Skip navigation links
- ✅ Descriptive page titles
- ✅ Visible focus indicators

### Understandable
- ✅ Language of page identified
- ✅ Predictable navigation
- ✅ Input assistance and error identification
- ✅ Error suggestions provided
- ✅ Error prevention for critical actions

### Robust
- ✅ Valid HTML markup
- ✅ Proper ARIA usage
- ✅ Compatible with assistive technologies

## Accessibility Features

### Built-in Accessibility Utilities
**File:** `utils/accessibility.ts`

Provides helper functions for:
- ARIA label generation
- Screen reader announcements
- Focus management and trapping
- Keyboard navigation handlers
- Skip navigation links
- Validation message creation
- Reduced motion detection
- High contrast mode detection

### Accessible Components

#### AccessibleForm
**File:** `components/ui/AccessibleForm.tsx`

Features:
- Automatic ARIA label generation
- Error announcements to screen readers
- Proper form field associations
- Loading state indicators
- Keyboard navigation support

#### AccessibleFormField
Features:
- Label/input associations
- Required field indicators
- Error message associations
- Help text support
- Proper ARIA attributes

## Testing Best Practices

### When to Run Tests

1. **During Development**: Run accessibility tests alongside unit tests
2. **Before Commits**: Ensure no accessibility regressions
3. **In CI/CD**: Include in automated test pipeline
4. **Before Releases**: Full accessibility audit

### Manual Testing Checklist

In addition to automated tests, perform manual testing:

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test with browser zoom at 200%
- [ ] Test with high contrast mode
- [ ] Test with reduced motion enabled
- [ ] Test on mobile devices
- [ ] Test with different viewport sizes

### Screen Reader Testing

**Recommended Screen Readers:**
- **Windows**: NVDA (free), JAWS (commercial)
- **macOS**: VoiceOver (built-in)
- **Linux**: Orca (free)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

**Testing Workflow:**
1. Enable screen reader
2. Navigate page with Tab key
3. Listen to announcements
4. Verify all content is accessible
5. Test form interactions
6. Test dynamic content updates

## Common Accessibility Issues

### Issues Caught by Automated Tests
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Improper heading hierarchy
- Missing ARIA attributes
- Invalid HTML structure

### Issues Requiring Manual Testing
- Focus order and logic
- Screen reader announcements
- Keyboard trap scenarios
- Context and clarity of labels
- User experience with assistive tech
- Reduced motion preferences

## Continuous Improvement

### Monitoring
- Track accessibility test coverage
- Monitor for new violations
- Review user feedback from assistive tech users

### Updates
- Keep axe-core updated for latest rules
- Review WCAG updates and new guidelines
- Update tests as new components are added

### Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Reporting Issues

When reporting accessibility issues:
1. Specify the WCAG criterion violated
2. Provide steps to reproduce
3. Include assistive technology used
4. Suggest remediation if possible
5. Indicate severity (blocker, critical, major, minor)

## Support

For accessibility questions or issues:
- Review this documentation
- Check WCAG 2.1 guidelines
- Consult with accessibility specialists
- Test with real users who use assistive technologies
