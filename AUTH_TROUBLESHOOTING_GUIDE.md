# Authentication Troubleshooting Guide

## Current Status

**User**: jrnabelsohn@gmail.com  
**Status**: ✅ Email confirmed  
**Last Login**: January 26, 2026 at 10:56 PM  
**Issue**: Getting "Invalid login credentials" error

## Diagnosis

The user account exists and email is confirmed. The most likely cause is an **incorrect password**.

## Solution Steps

### Step 1: Test Current Password

If you remember your password, test it with:

```bash
node scripts/test-login.mjs jrnabelsohn@gmail.com YourPassword
```

This will tell you if the password is correct or not.

### Step 2: Reset Password (Recommended)

Since you're getting "Invalid login credentials", reset your password:

```bash
node scripts/reset-user-password.mjs jrnabelsohn@gmail.com NewPassword123
```

Replace `NewPassword123` with your desired password (minimum 8 characters).

### Step 3: Verify Login

After resetting, try logging in at:
- http://localhost:3000/auth/login
- Email: jrnabelsohn@gmail.com
- Password: (the new password you set)

## Available Scripts

### 1. Check User Status
```bash
node scripts/check-user-status.mjs jrnabelsohn@gmail.com
```
Shows:
- User ID
- Email confirmation status
- Last sign-in time
- Account creation date

### 2. Test Login Credentials
```bash
node scripts/test-login.mjs jrnabelsohn@gmail.com YourPassword
```
Tests if credentials work without using the browser.

### 3. Reset Password
```bash
node scripts/reset-user-password.mjs jrnabelsohn@gmail.com NewPassword123
```
Sets a new password for the user.

### 4. Confirm Email (if needed)
```bash
node scripts/confirm-user-email.mjs jrnabelsohn@gmail.com
```
Manually confirms email (not needed in your case - already confirmed).

### 5. Create New User
```bash
node scripts/create-admin-user.mjs email@example.com Password123
```
Creates a new admin user with auto-confirmed email.

## Common Issues & Solutions

### Issue: "Invalid login credentials"
**Causes**:
1. Wrong password (most common)
2. Email not confirmed (not your issue - already confirmed)
3. Account disabled in Supabase

**Solution**: Reset password with script above

### Issue: "Email not confirmed"
**Cause**: User created but email verification not completed

**Solution**:
```bash
node scripts/confirm-user-email.mjs user@example.com
```

### Issue: "User not found"
**Cause**: User doesn't exist in database

**Solution**:
```bash
node scripts/create-admin-user.mjs user@example.com Password123
```

### Issue: Login works in script but not in browser
**Causes**:
1. Browser cache/cookies
2. Environment variables not loaded
3. CORS issues

**Solution**:
1. Clear browser cache and cookies
2. Hard refresh (Cmd+Shift+R on Mac)
3. Check browser console for errors
4. Verify `.env.local` has correct Supabase credentials

## Environment Variables Required

Make sure `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Debugging Login Issues

### Enable Debug Logging

The login page already has extensive console logging. Open browser DevTools (F12) and check the Console tab when logging in.

You'll see:
- Email being used
- Password length
- Supabase URL
- Anon key (first 20 chars)
- Login response details
- Error messages

### Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Authentication → Users
4. Find your user (jrnabelsohn@gmail.com)
5. Check:
   - Email confirmed? (should be ✅)
   - Account disabled? (should be ❌)
   - Last sign in time

### Test with Different Browser

Try logging in with:
- Incognito/Private window
- Different browser
- Different device

This helps identify if it's a browser-specific issue.

## Next Steps

**Immediate action**: Reset your password

```bash
node scripts/reset-user-password.mjs jrnabelsohn@gmail.com YourNewPassword123
```

Then try logging in at http://localhost:3000/auth/login

If that doesn't work, run the test-login script to verify:

```bash
node scripts/test-login.mjs jrnabelsohn@gmail.com YourNewPassword123
```

If the script works but browser doesn't, it's a browser/session issue. Clear cookies and try again.

## Support

If none of these solutions work:
1. Check Supabase dashboard for any account issues
2. Verify environment variables are correct
3. Check browser console for JavaScript errors
4. Try creating a new test user to verify the system works
