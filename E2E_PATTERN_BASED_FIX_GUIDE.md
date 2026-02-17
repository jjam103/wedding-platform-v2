Fix # E2E Test Failures - Pattern-Based Fix Guide

**Goal**: Fix 146 failing tests efficiently by identifying and fixing patterns, not individual tests.

## Pattern 1: API JSON Error Handling (Affects ~30-40 tests)

### Problem
API routes return HTML error pages instead of JSON when errors occur, causing:
```
SyntaxError: Unexpected end of JSON input
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Root Cause
Unhandled exceptions in API routes trigger Next.js error pages (HTML) instead of JSON responses.

### Pattern Fix Template

**Apply to**: All API routes in `app/api/guest-auth/`, `app/api/guest/`, `app/api/admin/`

```typescript
// ❌ BEFORE (causes HTML error pages)
export async function POST(request: Request) {
  const body = await request.json(); // Throws on empty body
  const result = await someOperation(body); // Throws on error
  return NextResponse.json({ success: true, data: result });
}

// ✅ AFTER (returns JSON errors)
export async function POST(request: Request) {
  try {
    // 1. Validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
        { status: 400 }
      );
    }
    
    // 2. Validate required fields
    if (!body.requiredField) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELD', message: 'Required field missing' } },
        { status: 400 }
      );
    }
    
    // 3. Perform operation with error handling
    const result = await someOperation(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error.code === 'NOT_FOUND' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

### Files to Fix
- `app/api/guest-auth/email-match/route.ts`
- `app/api/guest-auth/magic-link/request/route.ts`
- `app/api/guest-auth/magic-link/verify/route.ts`
- Any other API routes with similar issues

### Expected Impact
Fixes ~30-40 tests related to guest authentication

## Pattern 2: Supabase `.single()` Failures (Affects ~20-30 tests)

### Problem
Using `.single()` throws errors when no results or multiple results found:
```
Cannot coerce the result to a single JSON object
```

### Root Cause
`.single()` expects exactly one result and throws otherwise.

### Pattern Fix Template

**Apply to**: All Supabase queries expecting single results

```typescript
// ❌ BEFORE (throws on no results)
const { data: guest, error } = await supabase
  .from('guests')
  .select('*')
  .eq('email', email)
  .single(); // Throws if no results

// ✅ AFTER (handles no results gracefully)
const { data: guest, error } = await supabase
  .from('guests')
  .select('*')
  .eq('email', email)
  .maybeSingle(); // Returns null if no results, doesn't throw

if (error) {
  return { success: false, error: { code: 'DATABASE_ERROR', message: error.message } };
}

if (!guest) {
  return { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } };
}

return { success: true, data: guest };
```

### Files to Fix
- `services/magicLinkService.ts`
- `services/guestService.ts`
- Any service with `.single()` calls

### Expected Impact
Fixes ~20-30 tests related to guest lookup and data fetching

## Pattern 3: Missing ARIA Attributes (Affects ~15-20 tests)

### Problem
Form fields and interactive elements missing accessibility attributes.

### Root Cause
Components not following WCAG 2.1 AA accessibility guidelines.

### Pattern Fix Template

**Apply to**: All form components and interactive elements

```tsx
// ❌ BEFORE (missing accessibility)
<input
  type="text"
  name="firstName"
  required
/>

// ✅ AFTER (with accessibility)
<input
  type="text"
  name="firstName"
  required
  aria-required="true"
  aria-label="First Name"
  aria-describedby={error ? "firstName-error" : undefined}
/>
{error && <span id="firstName-error" className="text-red-600">{error}</span>}
```

```tsx
// ❌ BEFORE (missing expanded state)
<button onClick={() => setExpanded(!expanded)}>
  Toggle
</button>

// ✅ AFTER (with expanded state)
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

### Files to Fix
- `components/admin/*.tsx` (all form components)
- `components/guest/*.tsx` (all form components)
- `components/ui/Button.tsx`
- `components/ui/FormModal.tsx`

### Expected Impact
Fixes ~15-20 accessibility tests

## Pattern 4: Touch Target Size Violations (Affects ~5-10 tests)

### Problem
Interactive elements smaller than 44x44px minimum touch target size.

### Root Cause
Insufficient padding on buttons and interactive elements.

### Pattern Fix Template

**Apply to**: All buttons, links, and interactive elements

```tsx
// ❌ BEFORE (too small)
<button className="p-1 text-sm">
  Click
</button>

// ✅ AFTER (minimum 44x44px)
<button className="p-3 min-h-[44px] min-w-[44px] text-sm">
  Click
</button>
```

```tsx
// ❌ BEFORE (mobile nav too small)
<nav className="flex gap-2">
  <a href="/home" className="p-1">Home</a>
  <a href="/about" className="p-1">About</a>
</nav>

// ✅ AFTER (proper touch targets)
<nav className="flex gap-2">
  <a href="/home" className="p-3 min-h-[44px] flex items-center">Home</a>
  <a href="/about" className="p-3 min-h-[44px] flex items-center">About</a>
</nav>
```

### Files to Fix
- `components/ui/Button.tsx`
- `components/ui/MobileNav.tsx`
- `components/admin/Sidebar.tsx`
- Any component with small interactive elements

### Expected Impact
Fixes ~5-10 touch target tests

## Pattern 5: Async Params in Next.js 15 (Affects ~10-15 tests)

### Problem
Accessing `params` directly without awaiting in Next.js 15 causes runtime errors.

### Root Cause
Next.js 15 changed `params` to be a Promise.

### Pattern Fix Template

**Apply to**: All page components with dynamic routes

```tsx
// ❌ BEFORE (Next.js 14 style)
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id; // Error in Next.js 15
  return <div>{id}</div>;
}

// ✅ AFTER (Next.js 15 style)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await the promise
  return <div>{id}</div>;
}
```

### Files to Fix
- `app/activity/[id]/page.tsx`
- `app/event/[id]/page.tsx`
- `app/[type]/[slug]/page.tsx`
- `app/admin/accommodations/[id]/room-types/page.tsx`
- Any page with dynamic route parameters

### Expected Impact
Fixes ~10-15 tests related to dynamic routes

## Pattern 6: Dropdown Reactivity (Affects ~5-10 tests)

### Problem
Dropdowns don't update when data changes (e.g., after creating a new group).

### Root Cause
Missing dependency arrays or stale closures in `useEffect`.

### Pattern Fix Template

**Apply to**: All dropdown/select components

```tsx
// ❌ BEFORE (doesn't update)
const [groups, setGroups] = useState([]);

useEffect(() => {
  fetchGroups().then(setGroups);
}, []); // Missing refetch trigger

// ✅ AFTER (updates on data change)
const [groups, setGroups] = useState([]);
const [refreshKey, setRefreshKey] = useState(0);

useEffect(() => {
  fetchGroups().then(setGroups);
}, [refreshKey]); // Refetch when refreshKey changes

const handleGroupCreated = () => {
  setRefreshKey(prev => prev + 1); // Trigger refetch
};
```

Or use a data fetching library:

```tsx
// ✅ BETTER (with SWR or React Query)
const { data: groups, mutate } = useSWR('/api/groups', fetcher);

const handleGroupCreated = () => {
  mutate(); // Revalidate data
};
```

### Files to Fix
- `app/admin/guests/page.tsx`
- `components/admin/GuestForm.tsx`
- Any component with dropdowns that should update

### Expected Impact
Fixes ~5-10 tests related to dropdown reactivity

## Pattern 7: Form Validation Display (Affects ~10-15 tests)

### Problem
Validation errors not displayed or not accessible.

### Root Cause
Missing error state management and display logic.

### Pattern Fix Template

**Apply to**: All form components

```tsx
// ❌ BEFORE (no error display)
const handleSubmit = async (data) => {
  await submitForm(data);
};

// ✅ AFTER (with error display)
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = async (data) => {
  // Clear previous errors
  setErrors({});
  
  // Validate
  const validationErrors = validateForm(data);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  // Submit
  const result = await submitForm(data);
  if (!result.success) {
    setErrors({ _form: result.error.message });
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input
      name="email"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : undefined}
    />
    {errors.email && (
      <span id="email-error" className="text-red-600" role="alert">
        {errors.email}
      </span>
    )}
    
    {errors._form && (
      <div className="text-red-600" role="alert">
        {errors._form}
      </div>
    )}
  </form>
);
```

### Files to Fix
- All form components in `components/admin/`
- All form components in `components/guest/`

### Expected Impact
Fixes ~10-15 tests related to form validation

## Batch Fix Strategy

### Step 1: Identify Pattern
Look at failing tests and group by error message/behavior.

### Step 2: Create Fix Template
Write a reusable fix pattern (like above).

### Step 3: Apply to All Instances
Use find/replace or batch editing to apply fix to all affected files.

### Step 4: Test Pattern
Run tests for that pattern to verify fix works.

### Step 5: Move to Next Pattern
Repeat for next failure pattern.

## Priority Order

1. **Pattern 1**: API JSON Error Handling (~30-40 tests)
2. **Pattern 2**: Supabase `.single()` Failures (~20-30 tests)
3. **Pattern 3**: Missing ARIA Attributes (~15-20 tests)
4. **Pattern 4**: Touch Target Sizes (~5-10 tests)
5. **Pattern 5**: Async Params (~10-15 tests)
6. **Pattern 6**: Dropdown Reactivity (~5-10 tests)
7. **Pattern 7**: Form Validation Display (~10-15 tests)

## Efficiency Tips

1. **Use find/replace** for simple pattern fixes
2. **Create code snippets** for common patterns
3. **Fix one pattern completely** before moving to next
4. **Run tests after each pattern** to verify and track progress
5. **Document patterns** as you discover them

## Success Metrics

- ✅ Each pattern fix should resolve 5-40 tests
- ✅ Total time per pattern: 1-4 hours
- ✅ All 7 patterns: ~2-3 days of work
- ✅ Remaining individual fixes: ~1-2 days

**Total**: 3-5 days to fix all patterns and reach 100% pass rate

---

**Start with Pattern 1** (API JSON Error Handling) for maximum impact - it will fix ~30-40 tests in one go!
