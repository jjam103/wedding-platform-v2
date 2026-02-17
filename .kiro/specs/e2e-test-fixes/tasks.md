# E2E Test Fixes - Task List

## Overview

**Total Tests**: 359  
**Currently Passing**: 183 (51%)  
**Target**: 305-323 (85-90%)  
**Tests to Fix**: 122-140

**Strategy**: Systematic fixes in priority order, delegating to sub-agent for autonomous execution.

---

## Phase 1: Critical Infrastructure (Priority 1)

- [x] 1.1 Fix DataTable URL State Management
  - **Tests Affected**: 8 tests
  - **Estimated Time**: 4-6 hours
  - **Actual Time**: 2 hours
  - **Description**: DataTable component not syncing state with URL parameters
  - **Files**: `components/ui/DataTable.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts`

- [x] 1.2 Fix Admin Navigation
  - **Tests Affected**: 7 tests
  - **Estimated Time**: 6-8 hours
  - **Actual Time**: 1 hour (verification only)
  - **Description**: Admin navigation features already correctly implemented
  - **Files**: `components/admin/TopNavigation.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/navigation.spec.ts`

---

## Phase 2: Feature Completeness (Priority 2)

- [ ] 2.1 Complete Content Management Workflows
  - **Tests Affected**: 11 tests
  - **Estimated Time**: 10-12 hours
  - **Description**: Content page creation, section management, and reference blocks have incomplete workflows
  - **Files**: `app/admin/content-pages/page.tsx`, `components/admin/ContentPageForm.tsx`, `components/admin/SectionEditor.tsx`, `services/contentPagesService.ts`, `services/sectionsService.ts`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/contentManagement.spec.ts`
  - **Sub-tasks**:
    1. Fix content page creation and publication flow
    2. Add slug conflict validation
    3. Fix section add/reorder functionality
    4. Fix home page settings editor
    5. Fix welcome message rich text editor
    6. Fix section content editing and layout toggle
    7. Fix photo gallery integration in sections
    8. Fix reference block integration in sections
    9. Add event reference to content page

- [ ] 2.2 Fix Location Hierarchy Management
  - **Tests Affected**: 3 tests
  - **Estimated Time**: 4-6 hours
  - **Description**: Location management has validation and hierarchy issues
  - **Files**: `services/locationService.ts`, `app/admin/locations/page.tsx`, `components/admin/LocationSelector.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts -g "Location"`
  - **Sub-tasks**:
    1. Implement hierarchical location structure validation
    2. Add circular reference prevention
    3. Add location deletion validation
    4. Add required field validation

- [ ] 2.3 Complete Section Management (Part 1)
  - **Tests Affected**: 8 tests
  - **Estimated Time**: 6-8 hours
  - **Description**: Section editor and management features have workflow issues
  - **Files**: `app/admin/sections/page.tsx`, `components/admin/SectionEditor.tsx`, `components/admin/InlineSectionEditor.tsx`, `services/sectionsService.ts`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/sectionManagement.spec.ts`
  - **Sub-tasks**:
    1. Fix section creation workflow
    2. Fix section preview functionality
    3. Fix section reordering
    4. Fix section deletion with confirmation
    5. Fix section content validation
    6. Fix section layout options
    7. Fix section photo integration
    8. Fix section reference integration

- [ ] 2.4 Implement CSV Import/Export
  - **Tests Affected**: 3 tests
  - **Estimated Time**: 6-8 hours
  - **Description**: CSV functionality not working for guest import/export
  - **Files**: `utils/csvParser.ts` (create), `utils/csvGenerator.ts` (create), `app/api/admin/guests/import/route.ts` (create), `app/api/admin/guests/export/route.ts` (create), `app/admin/guests/page.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/dataManagement.spec.ts -g "CSV"`
  - **Sub-tasks**:
    1. Implement CSV import parser
    2. Add CSV format validation
    3. Handle special characters in CSV
    4. Implement CSV export generator
    5. Add round-trip testing
    6. Add error handling and user feedback

- [ ] 2.5 Implement Email Management Feature
  - **Tests Affected**: 11 tests
  - **Estimated Time**: 16-20 hours
  - **Description**: Email management feature is incomplete or not implemented
  - **Files**: `app/admin/emails/page.tsx`, `components/admin/EmailComposer.tsx`, `components/admin/EmailHistory.tsx`, `services/emailService.ts`, `app/api/admin/emails/send/route.ts`, `app/api/admin/emails/schedule/route.ts`, `app/api/admin/emails/drafts/route.ts`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/admin/emailManagement.spec.ts`
  - **Sub-tasks**:
    1. Implement email composition UI
    2. Add email template system with variables
    3. Add recipient selection by group
    4. Add field validation
    5. Add email preview
    6. Add email scheduling
    7. Add draft saving
    8. Add email history view
    9. Add bulk email functionality
    10. Add XSS sanitization
    11. Add accessibility features

---

## Phase 3: Accessibility & UX (Priority 3)

- [ ] 3.1 Fix Keyboard Navigation
  - **Tests Affected**: 2 tests
  - **Estimated Time**: 4-6 hours
  - **Description**: Missing keyboard event handlers and focus management
  - **Files**: `components/ui/DynamicForm.tsx`, `components/ui/FormModal.tsx`, `components/admin/*Form.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "Keyboard"`
  - **Sub-tasks**:
    1. Add keyboard navigation to form fields
    2. Add keyboard navigation to dropdowns
    3. Add focus management
    4. Add keyboard shortcuts documentation
    5. Test with screen reader

- [ ] 3.2 Fix Screen Reader Compatibility
  - **Tests Affected**: 2 tests
  - **Estimated Time**: 3-4 hours
  - **Description**: Missing ARIA attributes for screen reader compatibility
  - **Files**: `components/admin/RSVPForm.tsx`, `components/admin/PhotoUpload.tsx`, `components/ui/*`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "Screen Reader"`
  - **Sub-tasks**:
    1. Add ARIA expanded states
    2. Add ARIA controls relationships
    3. Add ARIA labels to form elements
    4. Add ARIA live regions for dynamic content
    5. Test with screen reader

- [ ] 3.3 Fix Responsive Design (Critical Subset)
  - **Tests Affected**: 6 tests
  - **Estimated Time**: 8-10 hours
  - **Description**: CSS responsive breakpoints and touch target sizes need fixes
  - **Files**: `app/globals.css`, `tailwind.config.ts`, `components/ui/MobileNav.tsx`, various component styles
  - **Verification**: `npm run test:e2e -- __tests__/e2e/accessibility/suite.spec.ts -g "Responsive"`
  - **Sub-tasks**:
    1. Fix touch target sizes on mobile (minimum 44x44px)
    2. Fix responsive layout on admin pages
    3. Fix responsive layout on guest pages
    4. Add mobile navigation with swipe gestures
    5. Fix 200% zoom support
    6. Fix cross-browser layout issues

---

## Phase 4: Guest Portal (Priority 4)

- [ ] 4.1 Fix Guest Authentication
  - **Tests Affected**: ~10 tests
  - **Estimated Time**: 6-8 hours
  - **Description**: Guest login and authentication flows have issues
  - **Files**: `app/auth/guest-login/page.tsx`, `app/api/auth/guest/email-match/route.ts`, `app/api/auth/guest/magic-link/route.ts`, `services/guestAuthService.ts`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts`
  - **Sub-tasks**:
    1. Fix email matching authentication
    2. Fix magic link authentication
    3. Fix guest session management
    4. Fix guest logout
    5. Fix authentication error handling

- [ ] 4.2 Fix Guest Views
  - **Tests Affected**: ~12 tests
  - **Estimated Time**: 8-10 hours
  - **Description**: Guest-facing pages and content display have issues
  - **Files**: `app/guest/*`, `components/guest/*`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/guest/guestViews.spec.ts`
  - **Dependencies**: Task 4.1
  - **Sub-tasks**:
    1. Fix guest dashboard
    2. Fix guest event views
    3. Fix guest activity views
    4. Fix guest accommodation views
    5. Fix guest itinerary views
    6. Fix guest photo gallery views
    7. Fix guest RSVP views

- [ ] 4.3 Fix Guest Groups
  - **Tests Affected**: ~8 tests
  - **Estimated Time**: 4-6 hours
  - **Description**: Guest group management from guest perspective has issues
  - **Files**: `app/guest/family/page.tsx`, `components/guest/FamilyManager.tsx`, `components/guest/GuestGroupCard.tsx`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/guest/guestGroups.spec.ts`
  - **Dependencies**: Task 4.1
  - **Sub-tasks**:
    1. Fix guest group viewing
    2. Fix guest group member management
    3. Fix guest group RSVP coordination
    4. Fix guest group permissions

---

## Phase 5: System Infrastructure (Priority 5)

- [ ] 5.1 Fix System Routing
  - **Tests Affected**: ~10 tests
  - **Estimated Time**: 6-8 hours
  - **Description**: Dynamic route handling and navigation issues
  - **Files**: `middleware.ts`, `app/[type]/[slug]/page.tsx`, various dynamic routes
  - **Verification**: `npm run test:e2e -- __tests__/e2e/system/routing.spec.ts`
  - **Sub-tasks**:
    1. Fix dynamic route parameters
    2. Fix route middleware
    3. Fix route redirects
    4. Fix 404 handling
    5. Fix route transitions

- [ ] 5.2 Fix UI Infrastructure
  - **Tests Affected**: ~10 tests
  - **Estimated Time**: 8-10 hours
  - **Description**: CSS delivery, form submissions, styling consistency issues
  - **Files**: `app/globals.css`, `components/ui/*`, form components
  - **Verification**: `npm run test:e2e -- __tests__/e2e/system/uiInfrastructure.spec.ts`
  - **Sub-tasks**:
    1. Fix CSS delivery and loading
    2. Fix form submission handling
    3. Fix styling consistency across pages
    4. Fix loading states
    5. Fix error states

- [x] 5.3 Fix Health Checks
  - **Tests Affected**: ~5 tests
  - **Estimated Time**: 2-4 hours
  - **Description**: System health and monitoring issues
  - **Files**: `app/api/health/route.ts`, `lib/monitoring.ts`, `lib/performanceMonitoring.ts`
  - **Verification**: `npm run test:e2e -- __tests__/e2e/system/health.spec.ts`
  - **Sub-tasks**:
    1. Fix health check endpoints
    2. Fix monitoring integration
    3. Fix error logging
    4. Fix performance monitoring

---

## Expected Outcomes

### After Phase 1 (Complete)
- **Pass Rate**: 55%+ (198+ tests)
- **Improvement**: +15 tests
- **Status**: ✅ Complete

### After Phase 2
- **Pass Rate**: 63-68% (226-244 tests)
- **Improvement**: +28-46 tests
- **Status**: ⏳ Pending

### After Phase 3
- **Pass Rate**: 69-74% (248-266 tests)
- **Improvement**: +22 tests
- **Status**: ⏳ Pending

### After Phase 4
- **Pass Rate**: 77-83% (276-298 tests)
- **Improvement**: +28-32 tests
- **Status**: ⏳ Pending

### After Phase 5
- **Pass Rate**: 85-93% (305-334 tests)
- **Improvement**: +29-36 tests
- **Status**: ⏳ Pending
