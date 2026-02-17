# E2E Pattern-Based Fix Guide

This guide provides systematic fixes for the 8 failure patterns identified in the E2E test suite.

## Pattern 1: Guest Authentication Issues (CRITICAL - Priority 1)

**Impact**: 12 failures + 3 interrupted = 15 tests blocked  
**Cascading Impact**: 174 tests didn't run due to max-failures limit  
**Total Impact**: ~189 tests affected (52% of suite)

### Root Causes

1. **Email Matching Authentication Not Working**
   - Tests stuck in redirect loop to `/auth/guest-login`
   - Never reaches `/guest/dashboard`
   - Session cookie not being created

2. **Session Cookie Creation Failing**
   - Cookie set in test but not recognized by middleware
   - Middleware logs show "No guest session cookie found"

3. **Magic Link Flow Broken**
   - Magic link generation may be working
   - Verification failing
   - Token validation issues

### Affected Tests

```
__tests__/e2e/auth/guestAuth.spec.ts:
- should successfully authenticate with email matching (FAILED)
- should create session cookie on successful authentication (FAILED)
- should successfully request and verify magic link (FAILED)
- should show success message after requesting magic link (FAILED)
- should show error for expired magic link (FAILED)
- should show error for already used magic link (FAILED)
- should show error for invalid or missing token (INTERRUPTED)
- should complete logout flow (INTERRUPTED)
- should persist authentication across page refreshes (INTERRUPTED)
```

### Fix Strategy

#### Step 1: Diagnose Email Matching Flow
```bash
# Check if email matching API is working
curl -X POST http://localhost:3000/api/auth/guest/email-match \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Expected**: Should return guest data and create session  
**If Failing**: Check `app/api/auth/guest/email-match/route.ts`

#### Step 2: Verify Session Cookie Format
```typescript
// In middleware.ts, add logging:
console.log('[Middleware] Guest session cookie:', {
  name: 'guest_session',
  value: cookies.get('guest_session')?.value,
  allCookies: cookies.getAll().map(c => c.name)
});
```

**Check**:
- Is cookie being set with correct name?
- Is cookie value in expected format?
- Is cookie httpOnly/secure/sameSite correct?

#### Step 3: Fix Session Verification
```typescript
// In middleware.ts, verify session query:
const { data: sessions, error } = await supabase
  .from('guest_sessions')
  .select('*')
  .eq('token_prefix', tokenPrefix)
  .gt('expires_at', new Date().toISOString())
  .single();

console.log('[Middleware] Session verification:', {
  found: !!sessions,
  error: error?.message,
  tokenPrefix
});
```

#### Step 4: Fix Magic Link Flow
```typescript
// Check magic link generation:
// app/api/auth/guest/magic-link/route.ts

// Check magic link verification:
// app/api/auth/guest/magic-link/verify/route.ts

// Ensure token is:
// 1. Generated correctly
// 2. Stored in database
// 3. Verified correctly
// 4. Marked as used after verification
```

### Files to Fix

1. `app/api/auth/guest/email-match/route.ts` - Email matching endpoint
2. `app/api/auth/guest/magic-link/route.ts` - Magic link generation
3. `app/api/auth/guest/magic-link/verify/route.ts` - Magic link verification
4. `middleware.ts` - Guest session verification
5. `services/magicLinkService.ts` - Magic link business logic
6. `__tests__/helpers/guestAuthHelpers.ts` - Test helper functions

### Expected Outcome

After fixes:
- Email matching creates valid session cookie
- Middleware recognizes and validates session
- Magic link generation and verification work
- Logout clears session properly
- Session persists across page refreshes

**Estimated Impact**: Unblocks 189 tests (52% of suite)

---

## Pattern 2: Email Management Issues (Priority 2)

**Impact**: 11 failures  
**Affected Suite**: `__tests__/e2e/admin/emailManagement.spec.ts`

### Root Causes

1. **Email Composer Not Loading Guest Data**
   - Guest list not populating
   - Recipient selection failing

2. **Template Variable Substitution Failing**
   - Variables not being replaced
   - Template rendering broken

3. **Recipient Selection by Group Not Working**
   - Group filter not working
   - Bulk selection failing

4. **Draft Saving Broken**
   - Draft API endpoint issues
   - State not persisting

### Affected Tests

```
- should complete full email composition and sending workflow
- should use email template with variable substitution
- should select recipients by group
- should validate required fields and email addresses
- should preview email before sending
- should schedule email for future delivery
- should save email as draft (FLAKY)
- should navigate to email templates page (FLAKY)
- should sanitize email content for XSS prevention
- should have keyboard navigation in email form (FLAKY)
```

### Fix Strategy

#### Step 1: Fix Guest Data Loading
```typescript
// In EmailComposer component:
useEffect(() => {
  const loadGuests = async () => {
    const response = await fetch('/api/admin/guests');
    const data = await response.json();
    
    console.log('[EmailComposer] Loaded guests:', {
      count: data.guests?.length,
      success: data.success
    });
    
    setGuests(data.guests || []);
  };
  
  loadGuests();
}, []);
```

**Check**: Are guests loading? Is RLS policy allowing access?

#### Step 2: Fix Template Variable Substitution
```typescript
// In emailService.ts:
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}
```

#### Step 3: Fix Recipient Selection by Group
```typescript
// In EmailComposer component:
const handleGroupSelect = (groupId: string) => {
  const groupGuests = guests.filter(g => g.group_id === groupId);
  setSelectedRecipients(prev => [
    ...prev,
    ...groupGuests.map(g => g.email).filter(e => e)
  ]);
};
```

#### Step 4: Fix Draft Saving
```typescript
// Create draft API endpoint:
// app/api/admin/emails/drafts/route.ts

export async function POST(request: Request) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('email_drafts')
    .insert({
      subject: body.subject,
      content: body.content,
      recipients: body.recipients,
      template_id: body.templateId
    })
    .select()
    .single();
    
  return NextResponse.json({ success: !error, data });
}
```

### Files to Fix

1. `components/admin/EmailComposer.tsx` - Email composition UI
2. `services/emailService.ts` - Email business logic
3. `app/api/admin/emails/route.ts` - Email sending endpoint
4. `app/api/admin/emails/drafts/route.ts` - Draft management
5. `app/api/admin/emails/templates/route.ts` - Template management

### Expected Outcome

After fixes:
- Email composer loads guest data
- Template variables substitute correctly
- Recipient selection by group works
- Drafts save and load properly
- Email preview works
- Scheduling works

**Estimated Impact**: Fixes 11 tests

---

## Pattern 3: Reference Block Issues (Priority 2)

**Impact**: 8 failures  
**Affected Suite**: `__tests__/e2e/admin/referenceBlocks.spec.ts`

### Root Causes

1. **Reference Picker Not Working**
   - Search not finding references
   - Selection not working
   - Modal not closing

2. **Circular Reference Detection Failing**
   - Not preventing circular references
   - Validation not working

3. **Guest View Preview Modals Broken**
   - Modals not opening
   - Content not loading
   - Close button not working

### Affected Tests

```
- should create event reference block
- should create activity reference block
- should create multiple reference types in one section
- should remove reference from section
- should filter references by type in picker
- should prevent circular references
- should detect broken references
- should display reference blocks in guest view with preview modals
```

### Fix Strategy

#### Step 1: Fix Reference Picker Search
```typescript
// In ReferenceBlockPicker component:
const searchReferences = async (query: string, type: string) => {
  const response = await fetch(
    `/api/admin/references/search?q=${query}&type=${type}`
  );
  const data = await response.json();
  
  console.log('[ReferencePicker] Search results:', {
    query,
    type,
    count: data.results?.length
  });
  
  setResults(data.results || []);
};
```

#### Step 2: Fix Circular Reference Detection
```typescript
// In sectionsService.ts:
export async function detectCircularReference(
  sectionId: string,
  referenceId: string,
  referenceType: string
): Promise<boolean> {
  // Check if referenceId's sections contain sectionId
  const { data: referenceSections } = await supabase
    .from('sections')
    .select('reference_blocks')
    .eq('entity_id', referenceId)
    .eq('entity_type', referenceType);
    
  for (const section of referenceSections || []) {
    const blocks = section.reference_blocks || [];
    if (blocks.some(b => b.id === sectionId)) {
      return true; // Circular reference detected
    }
  }
  
  return false;
}
```

#### Step 3: Fix Guest View Preview Modals
```typescript
// In SectionRenderer component:
const handleReferenceClick = async (referenceId: string, type: string) => {
  const response = await fetch(
    `/api/guest/references/${type}/${referenceId}`
  );
  const data = await response.json();
  
  setPreviewData(data);
  setPreviewModalOpen(true);
};
```

### Files to Fix

1. `components/admin/ReferenceBlockPicker.tsx` - Reference picker UI
2. `components/admin/InlineReferenceSelector.tsx` - Inline reference selector
3. `components/guest/SectionRenderer.tsx` - Guest view rendering
4. `services/sectionsService.ts` - Section business logic
5. `app/api/admin/references/search/route.ts` - Reference search endpoint
6. `app/api/guest/references/[type]/[id]/route.ts` - Guest reference preview

### Expected Outcome

After fixes:
- Reference picker searches and selects correctly
- Circular references prevented
- Broken references detected
- Guest view preview modals work
- Reference blocks display correctly

**Estimated Impact**: Fixes 8 tests

---

## Pattern 4: Location Hierarchy Issues (Priority 2)

**Impact**: 4 failures  
**Affected Suite**: `__tests__/e2e/admin/dataManagement.spec.ts`

### Root Causes

1. **Tree Structure Creation Failing**
   - Parent-child relationships not saving
   - Hierarchy not displaying

2. **Circular Reference Prevention Not Working**
   - Can set parent to child
   - Validation not working

3. **Expand/Collapse Functionality Broken**
   - Tree nodes not expanding
   - State not persisting

4. **Search Not Working**
   - Search not filtering tree
   - Results not highlighting

### Affected Tests

```
- should create hierarchical location structure
- should prevent circular reference in location hierarchy
- should expand/collapse tree and search locations
- should delete location and validate required fields
```

### Fix Strategy

#### Step 1: Fix Tree Structure Creation
```typescript
// In LocationSelector component:
const createLocation = async (data: LocationData) => {
  const response = await fetch('/api/admin/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      type: data.type,
      parent_id: data.parentId || null
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Reload tree to show new location
    await loadLocations();
  }
};
```

#### Step 2: Fix Circular Reference Prevention
```typescript
// In locationService.ts:
export async function validateLocationParent(
  locationId: string,
  parentId: string
): Promise<Result<boolean>> {
  // Check if parentId is a descendant of locationId
  const descendants = await getDescendants(locationId);
  
  if (descendants.includes(parentId)) {
    return {
      success: false,
      error: {
        code: 'CIRCULAR_REFERENCE',
        message: 'Cannot set parent to a descendant location'
      }
    };
  }
  
  return { success: true, data: true };
}
```

#### Step 3: Fix Expand/Collapse
```typescript
// In LocationSelector component:
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

const toggleNode = (nodeId: string) => {
  setExpandedNodes(prev => {
    const next = new Set(prev);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    return next;
  });
};
```

#### Step 4: Fix Search
```typescript
// In LocationSelector component:
const searchLocations = (query: string) => {
  const filtered = locations.filter(loc =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );
  
  // Expand all parent nodes of filtered results
  const nodesToExpand = new Set<string>();
  filtered.forEach(loc => {
    let current = loc.parent_id;
    while (current) {
      nodesToExpand.add(current);
      const parent = locations.find(l => l.id === current);
      current = parent?.parent_id;
    }
  });
  
  setExpandedNodes(nodesToExpand);
  setFilteredLocations(filtered);
};
```

### Files to Fix

1. `components/admin/LocationSelector.tsx` - Location tree UI
2. `services/locationService.ts` - Location business logic
3. `app/api/admin/locations/route.ts` - Location CRUD endpoints
4. `app/api/admin/locations/[id]/route.ts` - Single location operations

### Expected Outcome

After fixes:
- Tree structure creates correctly
- Circular references prevented
- Expand/collapse works
- Search filters and highlights
- Delete validates dependencies

**Estimated Impact**: Fixes 4 tests

---

## Pattern 5-8: Additional Patterns

See separate documents for:
- Pattern 5: Navigation Issues (9 failures + 2 flaky)
- Pattern 6: CSV Import/Export Issues (4 failures)
- Pattern 7: Photo Upload Issues (3 failures)
- Pattern 8: Flaky Tests (13 flaky)

---

## Fix Execution Plan

### Week 1: Critical Blockers
**Days 1-3**: Pattern 1 (Guest Authentication)
- Fix email matching flow
- Fix session cookie creation
- Fix magic link generation/verification
- Fix logout flow
- **Expected**: Unblock 189 tests

**Days 4-5**: Re-run full suite
- Verify Pattern 1 fixes
- Identify newly revealed issues
- Update fix plan

### Week 2: Core Functionality
**Days 1-2**: Pattern 2 (Email Management)
- Fix guest data loading
- Fix template substitution
- Fix recipient selection
- Fix draft saving

**Days 3-4**: Pattern 3 (Reference Blocks)
- Fix reference picker
- Fix circular reference detection
- Fix guest view previews

**Day 5**: Pattern 4 (Location Hierarchy)
- Fix tree structure
- Fix circular reference prevention
- Fix expand/collapse and search

### Week 3: UX & Reliability
**Days 1-2**: Pattern 5 (Navigation)
- Fix mobile menu
- Fix state persistence
- Fix keyboard navigation

**Days 3-4**: Patterns 6-7 (CSV & Photos)
- Fix CSV import/export
- Fix photo upload

**Day 5**: Pattern 8 (Flaky Tests)
- Add proper wait conditions
- Fix race conditions

### Week 4: Verification & Stabilization
**Days 1-3**: Full suite runs
- Run full suite multiple times
- Fix any remaining issues
- Stabilize flaky tests

**Days 4-5**: Documentation & Handoff
- Document all fixes
- Update test patterns guide
- Create maintenance guide

---

## Success Criteria

- ✅ Pattern 1 fixed: Guest authentication 100% passing
- ✅ Pattern 2 fixed: Email management 100% passing
- ✅ Pattern 3 fixed: Reference blocks 100% passing
- ✅ Pattern 4 fixed: Location hierarchy 100% passing
- ✅ Patterns 5-7 fixed: Navigation, CSV, Photos 100% passing
- ✅ Pattern 8 fixed: No flaky tests
- ✅ Overall pass rate: 95%+ (344+/362 tests)
- ✅ Full suite runs in <20 minutes
- ✅ All tests stable (no flakiness)

---

## Monitoring & Verification

After each pattern fix:
1. Run affected test suite
2. Verify 100% passing
3. Run full suite
4. Check for cascading fixes
5. Update progress tracking
6. Move to next pattern

**Progress Tracking**: Update `E2E_FULL_SUITE_RESULTS_SUMMARY.md` after each pattern fix.
