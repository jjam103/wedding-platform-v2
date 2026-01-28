# CSS Troubleshooting Guide

This guide provides comprehensive troubleshooting steps for CSS styling issues in the Destination Wedding Platform.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Browser DevTools Verification](#browser-devtools-verification)
4. [Configuration Verification](#configuration-verification)
5. [Testing CSS Delivery](#testing-css-delivery)
6. [Preventive Measures](#preventive-measures)

## Quick Diagnosis

### Automated Diagnostic Script

Run the automated diagnostic script to quickly identify CSS issues:

```bash
npm run diagnose:css
```

The script checks:
- ✓ globals.css exists and is readable
- ✓ PostCSS configuration is valid
- ✓ Tailwind configuration has correct content paths
- ✓ Root layout imports CSS correctly
- ✓ Required dependencies are installed

### Expected Output

```
=== CSS Styling Diagnostic Report ===

✓ globals.css exists and is readable
✓ PostCSS config uses @tailwindcss/postcss
✓ Tailwind config has correct content paths
✓ Layout imports globals.css correctly
✓ Dependencies are correct

All checks passed. If you're still experiencing issues, try:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear .next directory and restart dev server
```

## Common Issues and Solutions

### Issue 1: Browser Cache (Most Common)

**Symptoms:**
- Page loads but appears unstyled
- Old styles showing after changes
- Styles work in incognito mode

**Solution:**

```bash
# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear browser cache:
# Chrome: Ctrl+Shift+Delete → Clear browsing data
# Firefox: Ctrl+Shift+Delete → Clear recent history
# Safari: Cmd+Option+E → Empty caches
```

**Prevention:**
- Disable cache in DevTools Network tab during development
- Use incognito/private mode for testing

### Issue 2: Next.js Build Cache

**Symptoms:**
- CSS changes not reflected
- Styles work after clean build
- Inconsistent styling behavior

**Solution:**

```bash
# Clear .next directory
rm -rf .next

# Restart development server
npm run dev
```

**Prevention:**
- Add `.next` to `.gitignore` (already done)
- Clear cache before production builds

### Issue 3: Turbopack CSS Processing

**Symptoms:**
- CSS works with Webpack but not Turbopack
- Styles missing in Next.js 16
- CSS compilation timing issues

**Solution:**

```bash
# Try running without Turbopack
next dev --no-turbopack

# Or add to package.json scripts:
"dev:webpack": "next dev --no-turbopack"
```

**If this fixes the issue:**
1. Update to latest Next.js version: `npm update next`
2. Check Next.js GitHub issues for Turbopack CSS bugs
3. Consider using Webpack temporarily

### Issue 4: PostCSS Configuration

**Symptoms:**
- CSS not compiling
- No Tailwind classes in output
- PostCSS plugin errors

**Solution:**

Verify `postcss.config.mjs` has correct Tailwind v4 plugin:

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**Common mistakes:**
```javascript
// ❌ WRONG - Old Tailwind v3 syntax
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

// ✅ CORRECT - Tailwind v4 syntax
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**Verify plugin installation:**
```bash
npm list @tailwindcss/postcss

# If not installed:
npm install --save-dev @tailwindcss/postcss
```

### Issue 5: Tailwind Content Paths

**Symptoms:**
- Some components styled, others not
- New components missing styles
- Styles work after restart

**Solution:**

Verify `tailwind.config.ts` includes all component directories:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add any other directories with components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

**Common mistakes:**
```typescript
// ❌ WRONG - Missing directories
content: ['./app/**/*.tsx'],

// ❌ WRONG - Incorrect glob pattern
content: ['./app/*.tsx'], // Missing **

// ✅ CORRECT - All directories and file types
content: [
  './app/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
],
```

### Issue 6: CSS Import Missing

**Symptoms:**
- No CSS loaded at all
- 404 error for CSS file
- Empty styles in DevTools

**Solution:**

Verify `app/layout.tsx` imports globals.css:

```typescript
import './globals.css'; // Must be at top of file

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Common mistakes:**
```typescript
// ❌ WRONG - Incorrect path
import '../globals.css';
import 'globals.css';

// ❌ WRONG - Import after code
export default function RootLayout() {
  import './globals.css'; // Too late!
}

// ✅ CORRECT - Relative path at top
import './globals.css';
```

### Issue 7: Missing Tailwind Directives

**Symptoms:**
- CSS file loads but no Tailwind classes
- Empty or minimal CSS output
- Custom CSS works but Tailwind doesn't

**Solution:**

Verify `app/globals.css` has Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom CSS below */
```

**All three directives are required:**
- `@tailwind base` - Tailwind's base styles
- `@tailwind components` - Component classes
- `@tailwind utilities` - Utility classes

## Browser DevTools Verification

### Step-by-Step Verification

1. **Open DevTools**
   - Press F12 or right-click → Inspect

2. **Check Network Tab**
   - Go to Network tab
   - Refresh page (Ctrl+R)
   - Filter by CSS
   - Look for CSS file requests

3. **Verify CSS File**
   - Check HTTP status (should be 200)
   - Click on CSS file
   - Inspect contents
   - Look for Tailwind classes (`.bg-white`, `.p-6`, etc.)

4. **Check Elements Tab**
   - Select an element
   - Check class attribute has Tailwind classes
   - Go to Computed tab
   - Verify CSS properties are applied

5. **Check Console Tab**
   - Look for CSS-related errors
   - Check for failed resource loads
   - Look for MIME type errors

### What to Look For

**Good Signs:**
- ✓ CSS file request with 200 status
- ✓ CSS file size > 0 bytes
- ✓ CSS contains `.bg-white`, `.text-gray-900`, etc.
- ✓ Elements have Tailwind classes in HTML
- ✓ Computed styles show CSS properties
- ✓ No console errors

**Bad Signs:**
- ✗ No CSS file request
- ✗ 404 error for CSS file
- ✗ CSS file is empty (0 bytes)
- ✗ CSS missing Tailwind classes
- ✗ Elements missing class attributes
- ✗ Computed styles show defaults only
- ✗ Console errors about CSS

## Configuration Verification

### PostCSS Configuration

**File:** `postcss.config.mjs`

**Checklist:**
- [ ] File exists in project root
- [ ] Uses `@tailwindcss/postcss` plugin
- [ ] Plugin is installed in node_modules
- [ ] Configuration is exported correctly
- [ ] No conflicting plugins

**Verify:**
```bash
# Check file exists
ls -la postcss.config.mjs

# Check plugin installation
npm list @tailwindcss/postcss

# View configuration
cat postcss.config.mjs
```

### Tailwind Configuration

**File:** `tailwind.config.ts`

**Checklist:**
- [ ] File exists in project root
- [ ] Content paths include `./app/**/*`
- [ ] Content paths include `./components/**/*`
- [ ] Content paths use correct glob patterns
- [ ] No v3-specific deprecated options

**Verify:**
```bash
# Check file exists
ls -la tailwind.config.ts

# Check content paths
grep "content:" tailwind.config.ts -A 5
```

### Next.js Layout

**File:** `app/layout.tsx`

**Checklist:**
- [ ] File exists
- [ ] Imports `./globals.css`
- [ ] Import is at top of file
- [ ] Import path is correct (relative)

**Verify:**
```bash
# Check CSS import
grep "import.*globals.css" app/layout.tsx
```

### Global CSS

**File:** `app/globals.css`

**Checklist:**
- [ ] File exists
- [ ] Contains `@tailwind base`
- [ ] Contains `@tailwind components`
- [ ] Contains `@tailwind utilities`
- [ ] No syntax errors

**Verify:**
```bash
# Check file exists
ls -la app/globals.css

# Check Tailwind directives
grep "@tailwind" app/globals.css
```

## Testing CSS Delivery

### Automated Tests

**Run CSS delivery E2E test:**
```bash
npm run test:e2e:css
```

**Run all admin styling tests:**
```bash
npm run test:e2e:admin
```

**Run full E2E suite:**
```bash
npm run test:e2e
```

### Manual Testing

**Test checklist:**
- [ ] Open `/admin` in browser
- [ ] Verify page is styled (colors, spacing, typography)
- [ ] Check DevTools Network tab for CSS file
- [ ] Verify CSS file loads with 200 status
- [ ] Check Elements tab for Tailwind classes
- [ ] Verify computed styles are applied
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on different viewport sizes (mobile, tablet, desktop)
- [ ] Test with browser cache disabled
- [ ] Test in incognito/private mode

### Production Build Test

**Test production build:**
```bash
# Build for production
npm run build

# Start production server
npm start

# Open http://localhost:3000/admin
# Verify styling is identical to development
```

## Preventive Measures

### Development Workflow

1. **Always run diagnostic after CSS changes:**
   ```bash
   npm run diagnose:css
   ```

2. **Clear cache before testing:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Test in multiple browsers:**
   - Chrome (primary)
   - Firefox
   - Safari (if on Mac)

4. **Use DevTools cache disable:**
   - Open DevTools → Network tab
   - Check "Disable cache" checkbox

### CI/CD Integration

The project includes automated CSS verification in CI/CD:

**File:** `.github/workflows/css-verification.yml`

**Checks performed:**
- PostCSS configuration validation
- Tailwind configuration validation
- CSS import verification
- Build test with CSS output verification
- E2E CSS delivery test

**Runs on:**
- Push to main/develop branches
- Pull requests to main/develop
- Changes to CSS-related files

### Code Review Checklist

When reviewing CSS-related changes:

- [ ] PostCSS config unchanged or updated correctly
- [ ] Tailwind config unchanged or updated correctly
- [ ] No changes to CSS import in layout
- [ ] No removal of Tailwind directives
- [ ] CSS changes tested in browser
- [ ] E2E tests pass
- [ ] No console errors

### Monitoring

**Watch for these warning signs:**
- Increased CSS file size (check build output)
- Slower CSS compilation times
- Console warnings about CSS
- Failed E2E tests
- User reports of styling issues

## Getting Help

If you've tried all troubleshooting steps and still have issues:

1. **Check the diagnostic output:**
   ```bash
   npm run diagnose:css
   ```

2. **Run the E2E tests:**
   ```bash
   npm run test:e2e:css
   ```

3. **Check recent changes:**
   ```bash
   git log --oneline -10 -- "*.css" "*.config.*"
   ```

4. **Review the CSS Fix Summary:**
   - See `CSS_FIX_SUMMARY.md` for detailed fix history

5. **Check Next.js documentation:**
   - [Next.js CSS Documentation](https://nextjs.org/docs/app/building-your-application/styling)
   - [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)

6. **Search for known issues:**
   - [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
   - [Tailwind CSS GitHub Issues](https://github.com/tailwindlabs/tailwindcss/issues)

## Quick Reference

### Commands

```bash
# Diagnostic
npm run diagnose:css

# Clear cache
rm -rf .next

# Development
npm run dev
npm run dev:webpack  # Without Turbopack

# Testing
npm run test:e2e:css
npm run test:e2e:admin

# Build
npm run build
npm start
```

### Files to Check

```
postcss.config.mjs       # PostCSS configuration
tailwind.config.ts       # Tailwind configuration
app/layout.tsx           # CSS import
app/globals.css          # Tailwind directives
package.json             # Dependencies
```

### Key Concepts

- **Tailwind v4** uses `@tailwindcss/postcss` plugin (not `tailwindcss`)
- **Content paths** must include all component directories
- **CSS import** must be in root layout at top of file
- **Browser cache** is the most common cause of styling issues
- **Turbopack** may have CSS processing differences from Webpack
