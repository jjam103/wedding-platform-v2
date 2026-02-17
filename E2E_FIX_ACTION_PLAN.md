# E2E Test Suite - Fix Action Plan

**Goal**: Achieve 100% E2E test pass rate  
**Current**: 179/362 passed (49.4%)  
**Target**: 362/362 passed (100%)

## Quick Start: Phase 1 - Authentication Fixes (P0)

### Problem Summary
Guest authentication is completely broken, blocking ~30-40 tests:
- JSON parsing errors in API routes
- Guest lookup query failures
- Magic link flow broken
- Email matching authentication failing

### Root Causes

#### 1. JSON Parsing Errors
```
SyntaxError: Unexpected end of JSON input
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Location**: `/api/guest-auth/email-match`, `/api/guest-auth/magic-link/request`

**Issue**: API returning HTML error pages instead of JSON when errors occur

#### 2. Guest Lookup Failures
```
Cannot coerce the result to a single JSON object
```

**Location**: Guest email lookup queries

**Issue**: `.single()` method failing when no results or multiple results

#### 3. Magic Link Flow Issues
- Token validation failing
- Expired token handling broken
- Already-used token detection not working
- Session persistence issues

### Files to Fix

1. **`app/api/guest-auth/email-match/route.ts`**
   - Add request body validation
   - Handle empty bodies gracefully
   - Return JSON errors (not HTML)
   - Fix guest lookup query

2. **`app/api/guest-auth/magic-link/request/route.ts`**
   - Add request body validation
   - Handle JSON parsing errors
   - Return proper error responses

3. **`app/api/guest-auth/magic-link/verify/route.ts`**
   - Fix token validation logic
   - Handle expired tokens
   - Handle already-used tokens
   - Fix session creation

4. **`services/magicLinkService.ts`**
   - Fix guest lookup to handle no results
   - Use `.maybeSingle()` instead of `.single()`
   - Add proper error handling

5. **`middleware.ts`**
   - Fix guest session validation
   - Handle missing cookies gracefully
   - Improve error logging

### Fix Pattern: API Error Handling

**Before** (causes HTML error pages):
```typescript
export async function POST(request: Request) {
  const body = await request.json(); // Throws on empty body
  const guest = await supabase
    .from('guests')
    .select('*')
    .eq('email', body.email)
    .single(); // Throws on no results
  
  return NextResponse.json({ success: true });
}
```

**After** (returns JSON errors):
```typescript
export async function POST(request: Request) {
  try {
    // Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_EMAIL', message: 'Email is required' } },
        { status: 400 }
      );
    }
    
    // Guest lookup with proper error handling
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('email', body.email)
      .maybeSingle(); // Returns null if no results, doesn't throw
    
    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    if (!guest) {
      return NextResponse.json(
        { success: false, error: { code: 'GUEST_NOT_FOUND', message: 'No guest found with this email' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

### Testing Strategy

After each fix:
1. Run specific test file to verify fix
2. Check for regressions in related tests
3. Move to next fix

**Test commands**:
```bash
# Test email matching
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts -g "email matching"

# Test magic link
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts -g "magic link"

# Test all guest auth
npx playwright test __tests__/e2e/auth/guestAuth.spec.ts

# Full suite (after all fixes)
npm run test:e2e
```

## Phase 2: Accessibility Fixes (P1)

### Problem Summary
Missing ARIA attributes and touch target size violations

### Quick Wins

1. **Add `aria-required` to required form fields**:
   ```tsx
   <input
     type="text"
     name="firstName"
     required
     aria-required="true"  // Add this
   />
   ```

2. **Add `aria-expanded` to collapsible elements**:
   ```tsx
   <button
     onClick={() => setExpanded(!expanded)}
     aria-expanded={expanded}  // Add this
   >
     Toggle
   </button>
   ```

3. **Add `aria-describedby` for error messages**:
   ```tsx
   <input
     type="email"
     name="email"
     aria-describedby={error ? "email-error" : undefined}  // Add this
   />
   {error && <span id="email-error">{error}</span>}
   ```

4. **Fix touch target sizes** (minimum 44x44px):
   ```tsx
   // Before
   <button className="p-1">Click</button>
   
   // After
   <button className="p-3 min-h-[44px] min-w-[44px]">Click</button>
   ```

### Files to Fix

1. **Form components** (`components/admin/*.tsx`, `components/guest/*.tsx`)
2. **Button components** (`components/ui/Button.tsx`)
3. **Navigation components** (`components/ui/MobileNav.tsx`)

## Phase 3: Guest Groups & Registration (P2)

### Problem Summary
Dropdown reactivity and registration flow issues

### Fixes

1. **Fix dropdown reactivity after group creation**:
   - Ensure state updates trigger re-render
   - Add proper dependency arrays to `useEffect`
   - Refetch data after mutations

2. **Fix async params handling**:
   - Await params in Next.js 15
   - Handle loading states
   - Handle error states

3. **Fix registration flow**:
   - Form submission logic
   - XSS validation
   - Input sanitization

## Phase 4-6: Remaining Issues

Continue with content management, RSVP flow, forms, and polish.

## Progress Tracking

Create a checklist to track progress:

```markdown
## Phase 1: Authentication (P0)
- [ ] Fix `/api/guest-auth/email-match` JSON parsing
- [ ] Fix guest lookup query (use `.maybeSingle()`)
- [ ] Fix `/api/guest-auth/magic-link/request` error handling
- [ ] Fix `/api/guest-auth/magic-link/verify` token validation
- [ ] Fix expired token handling
- [ ] Fix already-used token detection
- [ ] Fix session persistence
- [ ] Test: Run guest auth tests
- [ ] Verify: ~30-40 tests now passing

## Phase 2: Accessibility (P1)
- [ ] Add `aria-required` to form fields
- [ ] Add `aria-expanded` to collapsible elements
- [ ] Add `aria-describedby` for errors
- [ ] Add `aria-label` to controls
- [ ] Fix touch target sizes (44x44px minimum)
- [ ] Test: Run accessibility tests
- [ ] Verify: ~20-25 tests now passing

## Phase 3: Guest Groups (P2)
- [ ] Fix dropdown reactivity
- [ ] Fix async params handling
- [ ] Fix registration flow
- [ ] Test: Run guest groups tests
- [ ] Verify: ~15-20 tests now passing

... continue for remaining phases
```

## Success Criteria

- ✅ All 362 tests passing
- ✅ No flaky tests
- ✅ Test suite runs in <30 minutes
- ✅ All accessibility requirements met
- ✅ All authentication flows working
- ✅ All content management features working

## Estimated Timeline

- **Phase 1**: 2 days (authentication)
- **Phase 2**: 1 day (accessibility)
- **Phase 3**: 1 day (guest groups)
- **Phase 4**: 2 days (content management)
- **Phase 5**: 1 day (RSVP & forms)
- **Phase 6**: 1 day (polish)

**Total**: 8 days to 100% pass rate

---

**Ready to start?** Begin with Phase 1 - Authentication fixes. This will unblock the most tests and provide the biggest impact.
