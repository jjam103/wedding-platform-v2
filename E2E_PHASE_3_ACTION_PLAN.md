# E2E Phase 3: Action Plan - Email Management Fix

## Current Status

✅ Analysis complete - identified 6 failure patterns affecting 42 tests
✅ Root cause found - RLS policies check wrong table
✅ Migration created - `054_fix_email_logs_rls.sql`
✅ Verification script created - `scripts/verify-email-rls-fix.mjs`
✅ Documentation complete - all guides ready

## Immediate Action Required

### Step 1: Apply Migration (5 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/olcqaawrpnanioaorfer/sql
   ```

2. **Copy Migration SQL**
   - Open file: `supabase/migrations/054_fix_email_logs_rls.sql`
   - Copy all contents (or see `APPLY_EMAIL_RLS_FIX.md` for inline SQL)

3. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run"
   - Verify "Success. No rows returned"

### Step 2: Verify Fix (2 minutes)

Run the verification script:
```bash
node scripts/verify-email-rls-fix.mjs
```

Expected output:
```
✅ All checks passed!
🎯 Next step: Run email management tests
```

### Step 3: Test Email Management (5 minutes)

Run the email tests:
```bash
npx playwright test __tests__/e2e/admin/emailManagement.spec.ts
```

Expected result:
- ✅ All 15 tests pass
- ✅ No failures
- ✅ Duration: ~2-3 minutes

### Step 4: Verify Overall Progress

Run full E2E suite to confirm improvement:
```bash
npm run test:e2e 2>&1 | tee e2e-after-email-fix.log
```

Expected result:
- Pass rate: 61.5% → 75.2% (+13.7%)
- Passed: 67 → 82 tests (+15)
- Failed: 42 → 27 tests (-15)

## What This Fixes

### Tables Updated
- ✅ `email_logs` - Email delivery tracking
- ✅ `email_templates` - Email templates
- ✅ `scheduled_emails` - Scheduled email queue
- ✅ `sms_logs` - SMS delivery tracking

### Tests Fixed (15 total)
1. Complete full email composition and sending workflow
2. Use email template with variable substitution
3. Select recipients by group
4. Validate required fields and email addresses
5. Preview email before sending
6. Schedule email for future delivery
7. Save email as draft
8. Show email history after sending
9. Send bulk email to all guests
10. Sanitize email content for XSS prevention
11. Keyboard navigation in email form
12. Accessible form elements with ARIA labels
13. Email composition accessibility
14. Email template management
15. Email scheduling and delivery

## After Email Fix: Next Priorities

### Priority 2: Location Hierarchy (6 tests - 1-2 hours)
**Files to fix:**
- `components/admin/LocationSelector.tsx` - Add wait conditions
- `__tests__/e2e/admin/dataManagement.spec.ts` - Update test waits

**Strategy:**
1. Add `waitForLoadState('networkidle')` after navigation
2. Add explicit waits for tree component rendering
3. Add waits for expand/collapse animations

### Priority 3: Admin Navigation (7 tests - 1-2 hours)
**Files to fix:**
- `__tests__/e2e/admin/navigation.spec.ts` - Add navigation waits
- `components/admin/Sidebar.tsx` - Verify active state logic

**Strategy:**
1. Add waits for navigation transitions
2. Use `waitForURL()` instead of checking immediately
3. Add waits for active state classes to apply

### Priority 4: CSV Import/Export (4 tests - 1 hour)
**Files to fix:**
- `__tests__/e2e/admin/dataManagement.spec.ts` - Fix file upload

**Strategy:**
1. Use `page.setInputFiles()` for file upload
2. Add waits for file processing
3. Handle download with `page.waitForEvent('download')`

### Priority 5: Accessibility (5 tests - 1 hour)
**Files to fix:**
- `__tests__/e2e/accessibility/suite.spec.ts` - Various fixes

**Strategy:**
1. Add waits for RSVP form rendering
2. Fix viewport scaling for zoom tests
3. Add waits for responsive layout changes

### Priority 6: Content Management (3 tests - 30 minutes)
**Files to fix:**
- `__tests__/e2e/admin/contentManagement.spec.ts` - Add save waits

**Strategy:**
1. Add waits for save operations
2. Fix confirmation dialog interaction
3. Verify success toasts appear

## Timeline to 100%

- **Now**: Apply email fix (15 minutes)
- **+1-2 hours**: Fix location hierarchy (6 tests)
- **+2-4 hours**: Fix admin navigation (7 tests)
- **+3-5 hours**: Fix CSV import/export (4 tests)
- **+4-6 hours**: Fix accessibility (5 tests)
- **+5-7 hours**: Fix content management (3 tests)

**Total**: 5-8 hours to reach 100% pass rate

## Success Metrics

### Current State
- Pass Rate: 61.5%
- Passed: 67 tests
- Failed: 42 tests

### After Email Fix (Target)
- Pass Rate: 75.2%
- Passed: 82 tests
- Failed: 27 tests

### Final Target
- Pass Rate: 100%
- Passed: 109 tests
- Failed: 0 tests

## Troubleshooting

### If Migration Fails
- Check for syntax errors in SQL
- Verify tables exist: `email_logs`, `email_templates`, `scheduled_emails`, `sms_logs`
- Check if old policies exist: `DROP POLICY IF EXISTS` should handle this

### If Verification Fails
- Run: `node scripts/verify-email-rls-fix.mjs`
- Check output for specific issues
- Verify admin user exists in `admin_users` table

### If Tests Still Fail
- Check browser console for errors
- Review test output for specific failures
- Verify API responses are returning data
- Check network tab for failed requests

## Files Created

1. **E2E_PHASE_3_PATTERN_ANALYSIS.md** - Detailed failure analysis
2. **E2E_EMAIL_MANAGEMENT_FIX.md** - Root cause and solution
3. **E2E_PHASE_3_NEXT_STEPS.md** - Manual steps guide
4. **E2E_PHASE_3_COMPLETE_SUMMARY.md** - Executive summary
5. **supabase/migrations/054_fix_email_logs_rls.sql** - Migration file
6. **APPLY_EMAIL_RLS_FIX.md** - Quick application guide
7. **scripts/verify-email-rls-fix.mjs** - Verification script
8. **This file** - Action plan

## Ready to Proceed!

🎯 **Next Action**: Apply the migration via Supabase Dashboard

📖 **Guide**: See `APPLY_EMAIL_RLS_FIX.md` for step-by-step instructions

✅ **Expected Result**: 15 tests fixed, 75.2% pass rate

Let's get those email tests passing! 🚀
