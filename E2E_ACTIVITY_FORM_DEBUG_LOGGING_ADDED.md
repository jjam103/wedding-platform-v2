# E2E Activity Form Submission - Debug Logging Added

## Summary

Added comprehensive debug logging to the activity creation flow to diagnose why the E2E test is timing out waiting for a 201 response from `/api/admin/activities`.

## Changes Made

### 1. API Route Debug Logging (`app/api/admin/activities/route.ts`)

Added console.log statements at each step of the POST handler:

```typescript
export async function POST(request: Request) {
  try {
    console.log('[Activities API] POST request received');
    
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      console.log('[Activities API] Auth failed:', authError?.message || 'No session');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    console.log('[Activities API] Auth successful, user:', session.user.id);

    // 2. Parse and validate request body
    const body = await request.json();
    console.log('[Activities API] Request body:', JSON.stringify(body, null, 2));

    // 3. Call service
    console.log('[Activities API] Calling activityService.create()');
    const result = await activityService.create(body);
    console.log('[Activities API] Service result:', {
      success: result.success,
      error: result.success ? null : result.error,
      dataId: result.success ? result.data.id : null,
    });

    // 4. Return response with proper status
    if (!result.success) {
      const statusCode = result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      console.log('[Activities API] Returning error response:', statusCode);
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('[Activities API] Returning success response: 201');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[Activities API] Unexpected error:', error);
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

**Logging Points:**
- Request received
- Authentication success/failure
- Request body contents
- Service call initiation
- Service result (success/error)
- Response status code

### 2. Service Layer Debug Logging (`services/activityService.ts`)

Added console.log statements throughout the create() method:

```typescript
export async function create(data: CreateActivityDTO): Promise<Result<Activity>> {
  try {
    console.log('[ActivityService] create() called with data:', JSON.stringify(data, null, 2));
    
    // 1. Validate
    const validation = createActivitySchema.safeParse(data);
    if (!validation.success) {
      console.log('[ActivityService] Validation failed:', validation.error.issues);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.error.issues,
        },
      };
    }
    
    console.log('[ActivityService] Validation passed');

    // 2. Sanitize user input
    const sanitized = {
      ...validation.data,
      name: sanitizeInput(validation.data.name),
      description: validation.data.description ? sanitizeRichText(validation.data.description) : null,
      activityType: sanitizeInput(validation.data.activityType),
    };
    
    console.log('[ActivityService] Data sanitized');

    // 2.1. Generate slug if not provided
    const baseSlug = generateSlug(sanitized.name);
    if (!isValidSlug(baseSlug)) {
      console.log('[ActivityService] Invalid slug generated from name:', sanitized.name);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Activity name must contain at least one alphanumeric character to generate a valid slug',
          details: {
            field: 'name',
            value: sanitized.name,
            reason: 'Generated slug is invalid or empty after normalization',
          },
        },
      };
    }

    // 2.2. Ensure slug is unique
    console.log('[ActivityService] Generating unique slug from base:', baseSlug);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);
    const sanitizedWithSlug = {
      ...sanitized,
      slug: uniqueSlug,
    };
    
    console.log('[ActivityService] Unique slug generated:', uniqueSlug);

    // 3. Database operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const dbData = toSnakeCase(sanitizedWithSlug);
    console.log('[ActivityService] Inserting into database:', JSON.stringify(dbData, null, 2));
    
    const { data: result, error } = await supabase
      .from('activities')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[ActivityService] Database error:', error);
      return {
        success: false,
        error: { code: 'DATABASE_ERROR', message: error.message, details: error },
      };
    }

    console.log('[ActivityService] Activity created successfully:', result.id);
    return { success: true, data: toCamelCase(result) as Activity };
  } catch (error) {
    console.error('[ActivityService] Unexpected error:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
```

**Logging Points:**
- Input data received
- Validation success/failure
- Data sanitization complete
- Slug generation (base and unique)
- Database insert data
- Database operation success/failure
- Final result

## How to Use the Debug Logs

### Running the Test

```bash
npm run test:e2e -- __tests__/e2e/system/uiInfrastructure.spec.ts -g "should submit valid activity form successfully"
```

### Viewing the Logs

The console.log statements will appear in the terminal output where the Next.js dev server is running. Look for lines starting with:
- `[Activities API]` - API route logs
- `[ActivityService]` - Service layer logs

### What to Look For

1. **Request Not Reaching API**: If you don't see `[Activities API] POST request received`, the request isn't making it to the API route
   - Check network tab in Playwright trace
   - Verify the form is actually submitting
   - Check for JavaScript errors in browser console

2. **Authentication Failure**: If you see `[Activities API] Auth failed`, the test authentication isn't working
   - Verify `.auth/user.json` exists and is valid
   - Check that global setup ran successfully
   - Verify cookies are being sent with the request

3. **Validation Failure**: If you see `[ActivityService] Validation failed`, the request body doesn't match the schema
   - Check the logged validation errors
   - Verify all required fields are being sent
   - Check data types (strings vs numbers, etc.)

4. **Database Error**: If you see `[ActivityService] Database error`, there's an issue with the database operation
   - Check the error message and details
   - Verify database connection
   - Check for constraint violations
   - Verify RLS policies aren't blocking the insert

5. **Timeout Before Logs**: If the test times out and you see NO logs at all, the issue is likely:
   - Next.js server not running
   - Wrong URL in test
   - Network connectivity issue
   - Server crashed before handling request

## Expected Log Flow (Success Case)

```
[Activities API] POST request received
[Activities API] Auth successful, user: <uuid>
[Activities API] Request body: {
  "name": "Test Activity 1707...",
  "activityType": "activity",
  "startTime": "2025-02-09T14:00:00.000Z"
}
[Activities API] Calling activityService.create()
[ActivityService] create() called with data: {
  "name": "Test Activity 1707...",
  "activityType": "activity",
  "startTime": "2025-02-09T14:00:00.000Z"
}
[ActivityService] Validation passed
[ActivityService] Data sanitized
[ActivityService] Generating unique slug from base: test-activity-1707...
[ActivityService] Unique slug generated: test-activity-1707...
[ActivityService] Inserting into database: {
  "name": "Test Activity 1707...",
  "activity_type": "activity",
  "start_time": "2025-02-09T14:00:00.000Z",
  "slug": "test-activity-1707...",
  ...
}
[ActivityService] Activity created successfully: <uuid>
[Activities API] Service result: {
  "success": true,
  "error": null,
  "dataId": "<uuid>"
}
[Activities API] Returning success response: 201
```

## Next Steps

1. **Run the test** with the debug logging enabled
2. **Capture the logs** from the Next.js dev server terminal
3. **Analyze the logs** to identify where the flow is breaking
4. **Apply the appropriate fix** based on the findings

## Possible Fixes Based on Log Analysis

### If Auth Fails
- Verify E2E database has proper auth setup
- Check that global setup creates admin user correctly
- Verify `.auth/user.json` is being loaded

### If Validation Fails
- Add missing required fields to test
- Fix data type mismatches
- Ensure datetime format is correct

### If Database Fails
- Check database constraints
- Verify RLS policies
- Ensure service role key is set correctly
- Check for unique constraint violations

### If No Logs Appear
- Verify Next.js server is running
- Check test is hitting correct URL
- Look for server crashes in terminal
- Check for middleware blocking requests

## Files Modified

1. `app/api/admin/activities/route.ts` - Added API route logging
2. `services/activityService.ts` - Added service layer logging

## Related Documents

- `E2E_ACTIVITY_FORM_INVESTIGATION.md` - Initial investigation and analysis
- `E2E_FORM_SUBMISSION_FIX_COMPLETE.md` - Previous E2E test fixes
- `E2E_TEST_INFRASTRUCTURE_COMPLETE_SUMMARY.md` - Test infrastructure overview
