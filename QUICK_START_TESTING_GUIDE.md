# Quick Start Testing Guide

**Status**: 7/8 bugs fixed, ready for testing  
**Dev Server**: http://localhost:3000/admin (running on process #3)

## 🚀 Start Testing in 3 Steps

### Step 1: Apply RLS Fix (30 seconds)
```bash
node scripts/fix-content-pages-rls.mjs
```

### Step 2: Test Guest Groups (2 minutes)
1. Go to http://localhost:3000/admin/guest-groups
2. Click "Add Group"
3. Create "Smith Family"
4. Go to http://localhost:3000/admin/guests
5. Click "Add Guest"
6. Select "Smith Family" from dropdown
7. Create guest successfully ✅

### Step 3: Follow Full Checklist
Open `MANUAL_TESTING_SESSION_V2.md` for complete testing procedures

---

## ✅ What's Fixed and Ready to Test

1. **Guest Groups** ✨ NEW - Complete CRUD feature
2. **Guest Creation** - Now works with group selection
3. **Vendor Numbers** - Number fields work correctly
4. **Accommodation Status** - Correct enum values
5. **Content Pages** - Works after RLS fix
6. **Location Selection** - Dropdowns show options
7. **Error Handling** - Shows toast messages

---

## ⚠️ Known Issue

**Manage Sections** - Clicking "Manage Sections" on events/activities gives 404
- **Workaround**: Don't click those buttons
- **Fix Needed**: Create routes or remove buttons

---

## 📋 Quick Test Checklist

- [ ] Create guest group
- [ ] Create guest with group
- [ ] Create vendor with numbers
- [ ] Create accommodation
- [ ] Create content page (after RLS fix)
- [ ] Select location on event
- [ ] Select location on activity
- [ ] Test error handling

---

## 🐛 Found a Bug?

Use this template:

```
Bug: [Short description]
Page: /admin/[page]
Severity: CRITICAL | HIGH | MEDIUM | LOW

Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected: [What should happen]
Actual: [What actually happens]
```

---

## 📚 Full Documentation

- `MANUAL_TESTING_SESSION_V2.md` - Complete testing checklist
- `GUEST_GROUPS_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `BUG_FIXES_COMPLETE.md` - All bug fixes documented
- `WHY_TESTS_MISSED_BUGS.md` - Testing analysis
- `SESSION_CONTINUATION_SUMMARY.md` - Session summary

---

## 🎯 Success Criteria

- ✅ Can create guest groups
- ✅ Can create guests with groups
- ✅ Can create vendors with numbers
- ✅ Can create accommodations
- ✅ Can create content pages
- ✅ Can select locations
- ✅ Errors show as toasts

---

**Happy Testing! 🧪**
