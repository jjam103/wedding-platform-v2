# Code Audit Script Guide

## Overview
The audit script (`scripts/audit-hardcoded-values.mjs`) automatically scans the codebase for potential issues like hardcoded routes, missing providers, and configuration problems.

## Running the Audit

### Manual Run
```bash
npm run test:audit
```

### Automatic Run
The audit runs automatically before `npm run test:all`:
```bash
npm run test:all  # Runs audit, then types, tests, and build
```

## What It Checks

### 🔴 High Severity
- **Hardcoded `/new` routes** - Routes like `/admin/guests/new` that don't exist
- **Hardcoded `/edit` routes** - Routes like `/admin/guests/edit` that may not exist  
- **Missing ToastProvider** - Components using `useToast()` without provider wrapper

### 🟡 Medium Severity
- **Hardcoded API URLs** - External URLs that should be environment variables
- Excludes documentation URLs (w3.org, github.com, nextjs.org)
- Excludes known services (supabase.co, example.com)

### 🟢 Low Severity
- **Hardcoded ports** - Port numbers in configuration
- Usually acceptable in test/config files

## Exit Codes
- **0** - No high severity issues (safe to proceed)
- **1** - High severity issues found (should be fixed)

## False Positives

The script is configured to avoid common false positives:

### Admin Pages with ToastProvider
✅ Files in `app/admin/` and `components/admin/` are automatically considered wrapped by the admin layout's ToastProvider.

### Documentation URLs
✅ URLs in comments pointing to documentation (W3C, GitHub, Next.js docs) are ignored.

### Test Configuration
✅ Localhost URLs in test files (Playwright config, Jest setup) are expected and ignored.

## Integration with CI/CD

### Pre-commit Hook (Recommended)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run test:audit
if [ $? -ne 0 ]; then
  echo "❌ Audit failed. Fix issues before committing."
  exit 1
fi
```

### GitHub Actions
Add to `.github/workflows/test.yml`:
```yaml
- name: Run code audit
  run: npm run test:audit
```

## Common Issues and Fixes

### Issue: Hardcoded `/new` Route
```typescript
// ❌ BAD
href: '/admin/guests/new'

// ✅ GOOD
href: '/admin/guests'  // Then use modal on the page
```

### Issue: Missing ToastProvider
```typescript
// ❌ BAD - Component uses useToast() but isn't wrapped
export function MyComponent() {
  const { addToast } = useToast();  // Will crash!
}

// ✅ GOOD - Wrap in layout or parent component
<ToastProvider>
  <MyComponent />
</ToastProvider>
```

### Issue: Hardcoded API URL
```typescript
// ❌ BAD
const API_URL = 'https://api.myservice.com';

// ✅ GOOD
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

## Customizing the Audit

Edit `scripts/audit-hardcoded-values.mjs` to add new patterns:

```javascript
const patterns = [
  {
    name: 'My Custom Check',
    regex: /pattern-to-match/g,
    severity: 'HIGH',  // or 'MEDIUM', 'LOW'
    description: 'What this checks for',
    exclude: ['allowed-value']  // Optional
  }
];
```

## Best Practices

1. **Run audit before committing** - Catch issues early
2. **Fix high severity issues immediately** - They indicate broken functionality
3. **Review medium severity** - May need environment variables
4. **Low severity is informational** - Usually acceptable

## Maintenance

The audit script should be updated when:
- New routing patterns are introduced
- New context providers are added
- New configuration patterns emerge
- False positives are discovered

## Related Documentation
- [Testing Standards](.kiro/steering/testing-standards.md)
- [Code Conventions](.kiro/steering/code-conventions.md)
- [404 Issue Resolution](404_ISSUE_FINAL_RESOLUTION.md)
