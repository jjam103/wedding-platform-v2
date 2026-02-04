# Manual Testing Bugs - Round 3

**Date**: February 2, 2026  
**Testing Session**: Events, Home Page, and Guest RSVPs

## Critical Issues Found

### 1. Event Location Dropdown Not Populating ❌
**Severity**: High  
**Page**: `/admin/events`  
**Impact**: Cannot assign locations to events

**Description**: When creating or editing an event, the location dropdown does not populate with available locations.

**Expected**: Dropdown should show all locations from the locations table  
**Actual**: Dropdown is empty or not loading

**Root Cause**: Likely missing location fetch or incorrect data binding

---

### 2. View Event Page Shows No Content ❌
**Severity**: High  
**Page**: Event view/detail page  
**Impact**: Cannot view event details after creation

**Description**: After creating an event, clicking "View" shows a blank or incomplete page with no event-related information.

**Expected**: Should display event details (name, date, time, location, description, activities, etc.)  
**Actual**: Page shows nothing or minimal content

**Root Cause**: Event detail page may not be implemented or data not loading correctly

---

### 3. Guest RSVP Expansion - Cookie Error ❌
**Severity**: Critical  
**Page**: `/admin/guests` (inline RSVP editor)  
**Impact**: Cannot view or manage guest RSVPs

**Error**:
```
nextCookies.get is not a function
at InlineRSVPEditor.useCallback[loadRSVPData] (components/admin/InlineRSVPEditor.tsx:87:15)
```

**Code Frame**:
```typescript
85 |
86 |       if (!result.success) {
> 87 |         throw new Error(result.error?.message || 'Failed to load RSVPs');
|               ^
88 |       }
89 |
90 |       const data = result.data;
```

**Root Cause**: Same Next.js 15 cookie compatibility issue - using deprecated `createServerComponentClient({ cookies })` pattern instead of new `@supabase/ssr` pattern

**Related**: This is the same issue we fixed in Round 2 for other pages

---

### 4. B2 Storage Unknown Error ❌
**Severity**: High  
**Page**: Photo upload/management areas  
**Impact**: Photo uploads may be failing

**Description**: Getting "unknown B2 storage error" when attempting photo operations

**Expected**: Photos should upload successfully to B2 storage  
**Actual**: Error occurs during B2 operations

**Root Cause**: Need more details - could be:
- B2 credentials issue
- B2 bucket configuration
- Network/connectivity issue
- B2 service initialization error

**Action Needed**: Check browser console for full error details

---

## Feature Requests / UX Improvements

### 5. Event Page Should Have Inline Section Editing 💡
**Type**: Feature Request  
**Priority**: Medium

**Request**: Event pages should have the same inline section editing capability as content pages

**Current State**: Events don't have section editing  
**Desired State**: Events should support rich content sections like content pages do

**Benefits**:
- Consistent UX across content types
- Richer event descriptions
- Ability to add photos, references, and formatted content to events

---

### 6. Inline Sections Need Title and Optional Subtitle/Description 💡
**Type**: Feature Enhancement  
**Priority**: Medium

**Request**: Inline section editor should include:
- Title field (required)
- Subtitle/description field (optional)

**Current State**: Sections may not have clear title/subtitle fields  
**Desired State**: Each section should have structured metadata

**Benefits**:
- Better content organization
- Clearer section hierarchy
- Improved accessibility

---

### 7. Home Page Should Have Section Editors 💡
**Type**: Feature Request  
**Priority**: High

**Request**: Home page (`/admin/home-page`) should have inline section editing like content pages

**Current State**: Home page may not have section editing capability  
**Desired State**: Home page should support the same section management as content pages

**Benefits**:
- Consistent CMS experience
- Easier home page content management
- No need for separate home page editing interface

---

## Priority Fix Order

### Immediate (Critical)
1. **Guest RSVP Cookie Error** - Blocks RSVP management completely
2. **B2 Storage Error** - Blocks photo functionality

### High Priority
3. **Event Location Dropdown** - Blocks event creation workflow
4. **View Event Page** - Blocks event viewing

### Medium Priority (Feature Requests)
5. Home page section editors
6. Event page section editing
7. Section title/subtitle fields

---

## Root Cause Analysis

### Next.js 15 Cookie Pattern (Issue #3)
**Pattern**: Multiple pages still using deprecated cookie pattern  
**Solution**: Systematic audit and update of all components using cookies

**Files to Check**:
- `components/admin/InlineRSVPEditor.tsx` (confirmed issue)
- Any other components using `createServerComponentClient`

### Missing Data Loading (Issues #1, #2)
**Pattern**: Dropdowns not populating, pages not showing data  
**Solution**: Verify data fetching hooks and API calls

---

## Testing Checklist

After fixes:
- [ ] Guest RSVP expansion works without errors
- [ ] Event location dropdown populates with locations
- [ ] View event page displays all event details
- [ ] Photo uploads work without B2 errors
- [ ] All cookie-related errors resolved
- [ ] No console errors on any admin pages

---

## Next Steps

1. Fix critical cookie error in InlineRSVPEditor
2. Investigate and fix B2 storage error
3. Fix event location dropdown
4. Implement/fix event view page
5. Consider feature requests for section editing

