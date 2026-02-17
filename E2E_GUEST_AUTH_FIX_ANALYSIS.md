# E2E Guest Authentication Fix Analysis

## Problem Summary

All 16 guest authentication E2E tests are failing with the error:
```
Failed to create test guest: new row for relation "guests" violates check constraint "valid_guest_email"
```

## Root Cause Analysis

### 1. Email Constraint Definition
From `supabase/migrations/001_create_core_tables.sql`:
```sql
CONSTRAINT valid_guest_email CHECK (
  email IS NULL OR 
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
```

### 2. Test Email Formats Being Used

**In global-setup.ts:**
```typescript
email: 'test.guest@example.com'
```

**In guestAuth.spec.ts beforeEach:**
```typescript
testGuestEmail = `test-guest-${Date.now()}@example.com`;
// Example: test-guest-1738800000000@example.com
```

### 3. Why Tests Are Failing

The emails being used **should be valid** according to the regex pattern. However, there are several potential issues:

#### Issue A: Postgres Regex Syntax
The regex uses `~*` (case-insensitive match) but the pattern might not be working as expected in Postgres.

#### Issue B: Email Already Exists
The global setup might be trying to create a guest that already exists, and the error message is misleading.

#### Issue C: Other Constraint Violations
There might be other constraints (like `NOT NULL` on required fields) that are failing, but the error message is showing the wrong constraint.

## Investigation Steps

### Step 1: Test the Regex Pattern Directly

Run this SQL query in the test database to verify the regex works:
```sql
SELECT 
  'test.guest@example.com' ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AS test1,
  'test-guest-1738800000000@example.com' ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AS test2,
  'john.smith@example.com' ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AS test3;
```

### Step 2: Check for Existing Guests

The global setup checks for existing guests with:
```typescript
.eq('email', 'test@example.com')
```

But then tries to create:
```typescript
email: 'test.guest@example.com'
```

**This is a mismatch!** The check looks for `test@example.com` but creates `test.guest@example.com`.

### Step 3: Check All Required Fields

The guests table has these NOT NULL constraints:
- first_name
- last_name
- group_id
- age_type
- guest_type
- auth_method (might be NOT NULL)

## The Actual Bug

Looking at the global setup code more carefully:

```typescript
// Check if test guest already exists
const { data: existingGuest } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .eq('email', 'test@example.com')  // ❌ WRONG EMAIL
  .maybeSingle();

if (existingGuest) {
  console.log(`   Test guest already exists: test@example.com`);
  return;
}

// ... later ...

// Create test guest
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .insert({
    first_name: 'Test',
    last_name: 'Guest',
    email: 'test.guest@example.com',  // ✅ DIFFERENT EMAIL
    group_id: group.id,
    age_type: 'adult',
    guest_type: 'wedding_guest',
    auth_method: 'email_matching',
  })
```

**The bug**: The code checks if `test@example.com` exists, but then tries to create `test.guest@example.com`. If `test.guest@example.com` already exists from a previous run, the insert will fail.

But wait - that would be a **duplicate key** error, not a constraint violation error.

## Alternative Theory: auth_method Column

Let me check if `auth_method` has a constraint that's failing. The error might be coming from a different constraint than we think.

## Solution

### Fix 1: Make Email Check Consistent
```typescript
// Check if test guest already exists
const { data: existingGuest } = await supabase
  .from('guests')
  .select('id, email, auth_method')
  .eq('email', 'test.guest@example.com')  // ✅ Match the email we're creating
  .maybeSingle();
```

### Fix 2: Add Better Error Logging
```typescript
const { data: guest, error: guestError } = await supabase
  .from('guests')
  .insert({
    first_name: 'Test',
    last_name: 'Guest',
    email: 'test.guest@example.com',
    group_id: group.id,
    age_type: 'adult',
    guest_type: 'wedding_guest',
    auth_method: 'email_matching',
  })
  .select()
  .single();

if (guestError) {
  console.error('Guest creation error details:', {
    message: guestError.message,
    details: guestError.details,
    hint: guestError.hint,
    code: guestError.code,
  });
  throw new Error(`Failed to create test guest: ${guestError.message}`);
}
```

### Fix 3: Use Simpler Email Format
Instead of `test.guest@example.com`, use `testguest@example.com` (no dots or hyphens):

```typescript
email: 'testguest@example.com'
```

### Fix 4: Check auth_method Column Constraint

Run this query to check if auth_method has a constraint:
```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'guests'::regclass
  AND contype = 'c';  -- Check constraints
```

## Next Steps

1. Run diagnostic query to test regex pattern
2. Check for existing guests in test database
3. Verify auth_method column constraints
4. Apply fixes to global-setup.ts and guestAuth.spec.ts
5. Re-run tests to verify fix
