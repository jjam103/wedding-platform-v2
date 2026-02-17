# E2E Activity Form Submission Investigation

## Current Status

After fixing the authentication cookie issue in the E2E test infrastructure, 9 out of 10 form submission tests now pass. However, one test is still failing:

**Failing Test**: `should submit valid activity form successfully`

## Test Details

**Location**: `__tests__/e2e/system/uiInfrastructure.spec.ts` (lines 516-570)

**Error**: TimeoutError waiting for response from `/api/admin/activities` with status 201
- Timeout: 10000ms exceeded
- Test ran twice (initial + 1 retry), both failed with same error

## What the Test Does

1. Navigates to `/admin/activities`
2. Opens the collapsible form
3. Fills in required fields:
   - `name`: `Test Activity ${Date.now()}`
   - `activityType`: First option from dropdown
   - `startTime`: Tomorrow at 2 PM (ISO format)
4. Clicks submit button
5. **FAILS HERE**: Waits for API response with status 201

## Investigation Findings

### 1. Form Component (`CollapsibleForm.tsx`)
- Form correctly handles submission via `handleSubmit`
- Converts datetime-local values to ISO 8601 format before validation
- Validates with Zod schema using `safeParse()`
- Calls `onSubmit` prop with validated data
- Has proper error handling and loading states

### 2. Activities Page (`app/admin/activities/page.tsx`)
- `handleSubmit` callback makes fetch request to `/api/admin/activities`
- Uses POST method for create, PUT for update
- Sends JSON body with form data
- Expects `{ success: true, data: Activity }` response
- Shows toast notification on success/error

### 3. API Route (`app/api/admin/activities/route.ts`)
- POST handler follows 4-step pattern:
  1. ✅ Authentication check
  2. ✅ Parse request body
  3. ✅ Call `activityService.create()`
  4. ✅ Return 201 on success, 400/500 on error

### 4. Activity Service (`services/activityService.ts`)
- `create()` method follows 3-step pattern:
  1. ✅ Validate with `createActivitySchema.safeParse()`
  2. ✅ Sanitize user input
  3. ✅ Generate unique slug
  4. ✅ Insert into database
  5. ✅ Return `Result<Activity>`

### 5. Activity Schema (`schemas/activitySchemas.ts`)
Required fields for creation:
- ✅ `name`: string (1-100 chars)
- ✅ `activityType`: string (min 1 char)
- ✅ `startTime`: datetime string

Optional fields:
- `eventId`, `description`, `locationId`, `endTime`, `capacity`, `costPerPerson`, `hostSubsidy`, `adultsOnly`, `plusOneAllowed`, `visibility`, `status`, `displayOrder`

## Possible Root Causes

### 1. Missing Default Values
The test only fills in the 3 required fields. However, the schema has optional fields that might have database constraints:
- `status`: Defaults to 'draft' in schema? Check database
- `adultsOnly`: Boolean field - might need explicit false
- `plusOneAllowed`: Boolean field - might need explicit false
- `visibility`: Array field - might need empty array []
- `displayOrder`: Number field - might need default value

### 2. Database Constraints
The `activities` table might have NOT NULL constraints on fields that the schema marks as optional:
- Check `supabase/migrations/*_create_activities_table.sql`
- Verify column definitions match schema

### 3. Slug Generation Issue
The service generates a slug from the activity name. If slug generation fails or produces a duplicate, it might cause a silent error:
- Check `ensureUniqueSlug()` function
- Verify slug validation logic

### 4. Authentication Issue
Although the test setup includes authentication, there might be an issue with:
- Session not being properly passed to API route
- Service role key not being available in test environment
- RLS policies blocking the insert

### 5. Timing Issue
The form might be submitting before all data is properly set:
- React state updates are asynchronous
- Form might submit before datetime conversion completes
- Network request might be made before body is fully serialized

## Next Steps

1. **Check Database Schema**: Verify `activities` table column constraints
2. **Add Debug Logging**: Add console.log statements to API route and service
3. **Check Test Environment**: Verify environment variables are set correctly
4. **Run Test with Trace**: Use Playwright trace to see network requests
5. **Check Browser Console**: Look for JavaScript errors in test browser
6. **Verify Default Values**: Ensure all required database fields have values

## Recommended Fixes

### Fix 1: Add Default Values to Form Submission
Update `app/admin/activities/page.tsx` `handleSubmit` to include defaults:

```typescript
const handleSubmit = useCallback(async (data: any) => {
  try {
    const isEdit = !!selectedActivity;
    const url = isEdit ? `/api/admin/activities/${selectedActivity.id}` : '/api/admin/activities';
    const method = isEdit ? 'PUT' : 'POST';

    // Ensure all required fields have values
    const payload = {
      ...data,
      status: data.status || 'draft',
      adultsOnly: data.adultsOnly ?? false,
      plusOneAllowed: data.plusOneAllowed ?? false,
      visibility: data.visibility || [],
      displayOrder: data.displayOrder ?? 0,
    };

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    // ...
  }
}, [selectedActivity, addToast, fetchActivities]);
```

### Fix 2: Add Debug Logging to API Route
Update `app/api/admin/activities/route.ts` POST handler:

```typescript
export async function POST(request: Request) {
  try {
    console.log('[API] POST /api/admin/activities - Start');
    
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('[API] Auth failed:', authError);
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    console.log('[API] Auth successful, user:', session.user.id);

    // 2. Parse and validate request body
    const body = await request.json();
    console.log('[API] Request body:', JSON.stringify(body, null, 2));

    // 3. Call service
    const result = await activityService.create(body);
    console.log('[API] Service result:', result.success ? 'SUCCESS' : 'FAILED', result);

    // 4. Return response with proper status
    if (!result.success) {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      console.log('[API] Returning error:', statusCode, result.error);
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('[API] Returning success: 201');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
```

### Fix 3: Check Database Schema
Verify the `activities` table has proper defaults:

```sql
-- Check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;
```

### Fix 4: Update Test to Include All Fields
Update the test to provide all fields with explicit values:

```typescript
test('should submit valid activity form successfully', async ({ page }) => {
  await page.goto('/admin/activities');
  await page.waitForLoadState('networkidle');
  
  // Open form
  const formToggle = page.locator('[data-testid="collapsible-form-toggle"]');
  const isExpanded = await formToggle.getAttribute('aria-expanded');
  if (isExpanded === 'false') {
    await formToggle.click();
    await page.waitForTimeout(500);
  }
  
  // Fill ALL fields explicitly
  await page.fill('input[name="name"]', `Test Activity ${Date.now()}`);
  await page.selectOption('select[name="activityType"]', 'activity');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  await page.fill('input[name="startTime"]', tomorrow.toISOString().slice(0, 16));
  
  // Add explicit values for optional fields
  await page.selectOption('select[name="status"]', 'draft');
  
  // Submit and wait for response
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/admin/activities') && resp.request().method() === 'POST',
    { timeout: 10000 }
  );
  
  await page.click('[data-testid="form-submit-button"]');
  
  const response = await responsePromise;
  console.log('Response status:', response.status());
  console.log('Response body:', await response.text());
  
  expect(response.status()).toBe(201);
  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout: 5000 });
});
```

## Conclusion

The most likely issue is that the form is not providing all required database fields, causing the insert to fail silently or return an error that's not being properly handled. The recommended approach is to:

1. Add debug logging to see exactly what's happening
2. Ensure all database fields have proper defaults
3. Update the form submission to include explicit default values
4. Verify the test is waiting for the correct response

Once we identify the exact error, we can apply the appropriate fix.
