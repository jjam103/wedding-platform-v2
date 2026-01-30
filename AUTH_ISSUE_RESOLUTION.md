# Authentication Issue Resolution

## Issue Summary

**User**: jrnabelsohn@gmail.com  
**Error**: "Invalid login credentials" when attempting to log in  
**Date**: January 28, 2026

## Diagnosis Results

Ran diagnostic script: `node scripts/check-user-status.mjs jrnabelsohn@gmail.com`

**Findings**:
- ✅ User exists in database
- ✅ Email is confirmed
- ✅ User has logged in before (last sign-in: January 26, 2026 at 10:56 PM)
- ❌ Current password is incorrect

**Root Cause**: The password being entered does not match the password stored in Supabase.

## Solution

Reset the password using the provided script:

```bash
node scripts/reset-user-password.mjs jrnabelsohn@gmail.com YourNewPassword123
```

Replace `YourNewPassword123` with your desired password (minimum 8 characters).

## Scripts Created

### 1. `scripts/check-user-status.mjs`
Diagnoses user account status:
- Checks if user exists
- Verifies email confirmation
- Shows last sign-in time
- Provides next steps based on status

**Usage**:
```bash
node scripts/check-user-status.mjs user@example.com
```

### 2. `scripts/confirm-user-email.mjs` (NEW)
Manually confirms a user's email address:
- Finds user by email
- Updates email_confirmed_at timestamp
- Enables login for unconfirmed accounts

**Usage**:
```bash
node scripts/confirm-user-email.mjs user@example.com
```

### 3. `scripts/test-login.mjs` (NEW)
Tests login credentials without browser:
- Uses same Supabase client as web app
- Shows detailed error messages
- Verifies credentials work

**Usage**:
```bash
node scripts/test-login.mjs user@example.com password123
```

### 4. `scripts/reset-user-password.mjs` (EXISTING)
Resets user password:
- Sets new password
- Works for any user
- No email verification required

**Usage**:
```bash
node scripts/reset-user-password.mjs user@example.com NewPassword123
```

### 5. `scripts/create-admin-user.mjs` (EXISTING)
Creates new admin user:
- Auto-confirms email
- Sets initial password
- Ready to use immediately

**Usage**:
```bash
node scripts/create-admin-user.mjs user@example.com Password123
```

## Testing Workflow

### For Password Issues (Current Situation)
1. **Diagnose**: `node scripts/check-user-status.mjs jrnabelsohn@gmail.com`
2. **Reset**: `node scripts/reset-user-password.mjs jrnabelsohn@gmail.com NewPass123`
3. **Test**: `node scripts/test-login.mjs jrnabelsohn@gmail.com NewPass123`
4. **Login**: Visit http://localhost:3000/auth/login

### For Email Confirmation Issues
1. **Diagnose**: `node scripts/check-user-status.mjs user@example.com`
2. **Confirm**: `node scripts/confirm-user-email.mjs user@example.com`
3. **Test**: `node scripts/test-login.mjs user@example.com password`
4. **Login**: Visit http://localhost:3000/auth/login

### For New Users
1. **Create**: `node scripts/create-admin-user.mjs user@example.com Pass123`
2. **Test**: `node scripts/test-login.mjs user@example.com Pass123`
3. **Login**: Visit http://localhost:3000/auth/login

## Documentation Created

### `AUTH_TROUBLESHOOTING_GUIDE.md`
Comprehensive guide covering:
- All common authentication issues
- Step-by-step solutions
- Script usage examples
- Debugging tips
- Environment variable requirements
- Browser troubleshooting

## Next Steps for User

1. **Reset your password**:
   ```bash
   node scripts/reset-user-password.mjs jrnabelsohn@gmail.com YourNewPassword
   ```

2. **Test the new password**:
   ```bash
   node scripts/test-login.mjs jrnabelsohn@gmail.com YourNewPassword
   ```

3. **Log in via browser**:
   - Go to http://localhost:3000/auth/login
   - Email: jrnabelsohn@gmail.com
   - Password: YourNewPassword

## Why This Happened

Possible reasons for password mismatch:
1. Password was changed in Supabase dashboard
2. Different password was used during account creation
3. Password was forgotten
4. Typo when setting initial password

## Prevention

To avoid this in the future:
1. Use a password manager
2. Document passwords securely
3. Use the `test-login.mjs` script to verify credentials immediately after creation
4. Keep a record of the password used in `create-admin-user.mjs`

## Technical Details

### Authentication Flow
1. User enters email/password in browser
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials against stored hash
4. If valid: returns session token
5. If invalid: returns "Invalid login credentials" error

### Password Storage
- Passwords are hashed using bcrypt
- Cannot be retrieved, only reset
- Hash comparison happens server-side in Supabase

### Scripts Use Service Role Key
- Scripts use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Bypasses Row Level Security (RLS)
- Can create/modify users directly
- Should never be exposed to frontend

## Files Modified/Created

### Created
- `scripts/confirm-user-email.mjs` - Email confirmation script
- `scripts/test-login.mjs` - Login testing script
- `AUTH_TROUBLESHOOTING_GUIDE.md` - Comprehensive troubleshooting guide
- `AUTH_ISSUE_RESOLUTION.md` - This file

### Existing (Referenced)
- `scripts/check-user-status.mjs` - User status diagnostic
- `scripts/reset-user-password.mjs` - Password reset
- `scripts/create-admin-user.mjs` - User creation
- `app/auth/login/page.tsx` - Login page with debug logging

## Status

✅ **Diagnosis Complete**: User exists, email confirmed, password incorrect  
✅ **Scripts Created**: All necessary tools available  
✅ **Documentation Complete**: Troubleshooting guide created  
⏳ **Awaiting User Action**: User needs to reset password

## Command to Run Now

```bash
node scripts/reset-user-password.mjs jrnabelsohn@gmail.com YourNewPassword123
```

Replace `YourNewPassword123` with your desired password, then try logging in.
