# Testing Debug Guide

Quick reference for debugging common issues during manual testing.

## Quick Diagnostics

### Check System Health
```bash
node scripts/pre-testing-health-check.mjs
```

### Check Dev Server
```bash
# If server isn't responding
curl http://localhost:3000/api/health

# Check server logs
# Look at terminal where npm run dev is running
```

### Check Database Connection
```bash
# Test Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/guests?limit=1"
```

## Common Issues & Solutions

### Issue: Page Shows 404

**Symptoms**: Clicking a link shows "404 - Page Not Found"

**Possible Causes**:
1. Route doesn't exist
2. Dynamic param not being passed correctly
3. Middleware blocking access

**Debug Steps**:
```bash
# Check if route exists in app directory
ls -la app/admin/[page-name]

# Check middleware logs in terminal
# Look for: [Middleware] Access denied

# Check browser console for errors
```

**Solution**:
- Verify route file exists
- Check params are being awaited (Next.js 15+)
- Verify user has correct role for route

---

### Issue: API Returns 401 Unauthorized

**Symptoms**: API calls fail with 401 status

**Possible Causes**:
1. Not logged in
2. Session expired
3. Cookie not being sent
4. RLS policy blocking access

**Debug Steps**:
```bash
# Check browser Application tab
# Look for: sb-[project]-auth-token cookie

# Check API route logs in terminal
# Look for: Authentication required

# Test with curl
curl -H "Authorization: Bearer [token]" \
  http://localhost:3000/api/admin/guests
```

**Solution**:
- Log out and log back in
- Check cookie is being sent in Network tab
- Verify RLS policies allow access
- Check middleware isn't blocking route

---

### Issue: Form Submission Fails

**Symptoms**: Form doesn't save, shows error

**Possible Causes**:
1. Validation error
2. Database constraint violation
3. RLS policy blocking insert/update
4. Missing required field

**Debug Steps**:
```bash
# Check browser console for errors
# Look for: VALIDATION_ERROR, DATABASE_ERROR

# Check Network tab for API response
# Look at response body for error details

# Check terminal for server logs
# Look for: Validation failed, Database error
```

**Solution**:
- Fill all required fields
- Check validation rules in console
- Verify RLS policies allow operation
- Check database constraints

---

### Issue: Dropdown is Empty

**Symptoms**: Select dropdown shows no options

**Possible Causes**:
1. Data not loaded yet
2. API call failed
3. RLS policy blocking read
4. Component not re-rendering

**Debug Steps**:
```bash
# Check Network tab for API calls
# Look for: 200 OK with empty array

# Check browser console for errors
# Look for: Failed to fetch

# Check React DevTools
# Look at component state
```

**Solution**:
- Wait for loading to complete
- Check API returns data
- Verify RLS policies allow read
- Force component re-render (refresh page)

---

### Issue: Toast Notification Doesn't Show

**Symptoms**: Action completes but no feedback

**Possible Causes**:
1. Toast context not available
2. Toast component not rendered
3. Z-index issue (hidden behind other elements)

**Debug Steps**:
```bash
# Check browser console for errors
# Look for: useToast must be used within ToastProvider

# Check Elements tab
# Look for: toast container in DOM

# Check Computed styles
# Look for: z-index, display, visibility
```

**Solution**:
- Verify ToastProvider wraps component
- Check toast container is rendered
- Adjust z-index if needed
- Check toast timeout settings

---

### Issue: Image/Photo Not Displaying

**Symptoms**: Broken image icon or blank space

**Possible Causes**:
1. Invalid image URL
2. CORS issue
3. B2 storage not accessible
4. Image not uploaded correctly

**Debug Steps**:
```bash
# Check Network tab for image request
# Look for: 404, 403, or CORS error

# Check image URL in Elements tab
# Verify URL is correct

# Test B2 storage health
curl http://localhost:3000/api/admin/storage/health
```

**Solution**:
- Verify image was uploaded successfully
- Check B2 credentials are correct
- Verify CDN URL is accessible
- Check CORS settings on B2 bucket

---

### Issue: Slow Page Load

**Symptoms**: Page takes >3 seconds to load

**Possible Causes**:
1. Large database query
2. N+1 query problem
3. Missing database index
4. Large image files

**Debug Steps**:
```bash
# Check Network tab
# Look for: slow API calls (>1s)

# Check terminal for query logs
# Look for: slow query warnings

# Check Performance tab
# Look for: long tasks, layout shifts
```

**Solution**:
- Add pagination to large lists
- Optimize database queries
- Add database indexes
- Compress/resize images
- Use lazy loading

---

### Issue: Console Shows React Errors

**Symptoms**: Red errors in browser console

**Common Errors**:

**"Cannot read property of undefined"**
- Check data is loaded before accessing
- Use optional chaining: `data?.property`

**"Maximum update depth exceeded"**
- Check for infinite loops in useEffect
- Verify dependency arrays are correct

**"Hydration mismatch"**
- Check server/client render same content
- Avoid using Date.now() or random values

**"Hook called outside component"**
- Hooks must be at top level
- Don't call hooks in loops/conditions

---

### Issue: Styling Looks Wrong

**Symptoms**: Layout broken, colors wrong, spacing off

**Possible Causes**:
1. CSS not loaded
2. Tailwind classes not applied
3. CSS specificity conflict
4. Missing responsive classes

**Debug Steps**:
```bash
# Check Network tab
# Look for: globals.css loaded

# Check Elements tab
# Look at: computed styles

# Check for CSS errors in console
```

**Solution**:
- Verify Tailwind config is correct
- Check class names are valid
- Clear browser cache
- Rebuild: npm run build

---

## Browser DevTools Tips

### Console Tab
- Filter by level: Error, Warning, Info
- Preserve log across page loads
- Use `console.table()` for arrays

### Network Tab
- Filter by type: XHR, JS, CSS, Img
- Check request/response headers
- Look at timing breakdown
- Throttle network to test slow connections

### Application Tab
- Check cookies (sb-*-auth-token)
- Check localStorage
- Check sessionStorage
- Clear storage to reset state

### Elements Tab
- Inspect element styles
- Check computed styles
- Modify styles live
- Check element dimensions

### React DevTools
- Inspect component props
- Check component state
- View component hierarchy
- Profile performance

---

## Database Debugging

### Check RLS Policies
```sql
-- In Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'your_table_name';
```

### Check Table Structure
```sql
-- In Supabase SQL Editor
\d your_table_name
```

### Test Query Directly
```sql
-- In Supabase SQL Editor
SELECT * FROM guests LIMIT 10;
```

---

## Performance Debugging

### Check Bundle Size
```bash
npm run build
# Look for: Large chunks warning
```

### Check Memory Leaks
1. Open Chrome DevTools
2. Go to Memory tab
3. Take heap snapshot
4. Perform actions
5. Take another snapshot
6. Compare snapshots

### Check Network Performance
1. Open Network tab
2. Throttle to "Slow 3G"
3. Reload page
4. Check load times

---

## Emergency Commands

### Reset Everything
```bash
# Stop dev server
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build

# Restart dev server
npm run dev
```

### Reset Database (CAUTION!)
```bash
# This will delete all data!
# Only use in development

# Run migrations from scratch
# (Instructions depend on your setup)
```

### Clear Browser Data
1. Open DevTools
2. Application tab
3. Clear storage
4. Reload page

---

## Getting Help

If you're stuck:

1. **Check the logs** - Terminal and browser console
2. **Search the codebase** - Look for similar patterns
3. **Check documentation** - README, steering docs
4. **Ask for help** - Document the issue clearly

### Good Bug Report Template
```markdown
**What I was trying to do**:
[Clear description]

**What I expected**:
[Expected behavior]

**What actually happened**:
[Actual behavior]

**Steps to reproduce**:
1. Step one
2. Step two

**Console errors**:
[Copy/paste errors]

**Screenshots**:
[If helpful]

**Environment**:
- Browser: Chrome 120
- OS: macOS
- Page: /admin/guests
```

---

## Quick Reference

### Useful URLs
- Admin: http://localhost:3000/admin
- API Health: http://localhost:3000/api/health
- Supabase: https://supabase.com/dashboard

### Useful Commands
```bash
# Health check
node scripts/pre-testing-health-check.mjs

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Test
npm test
```

### Useful Keyboard Shortcuts
- `Cmd+Opt+I` - Open DevTools (Mac)
- `Ctrl+Shift+I` - Open DevTools (Windows)
- `Cmd+Opt+J` - Open Console (Mac)
- `Ctrl+Shift+J` - Open Console (Windows)
- `Cmd+R` - Reload page (Mac)
- `Ctrl+R` - Reload page (Windows)
- `Cmd+Shift+R` - Hard reload (Mac)
- `Ctrl+Shift+R` - Hard reload (Windows)

---

**Happy debugging!** 🐛🔍
