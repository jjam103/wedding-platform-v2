# E2E Test Fixes - Design

## Architecture

### Test Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     E2E Test Execution                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Global Setup                              │
│  - Verify database connection                                │
│  - Clean test data                                           │
│  - Create test guest                                         │
│  - Verify Next.js server                                     │
│  - Create admin authentication                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Test Execution                            │
│  - Run tests in parallel (4 workers)                         │
│  - Use saved authentication state                            │
│  - Test against dev server with E2E env                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Global Teardown                           │
│  - Clean test data                                           │
│  - Remove authentication state                               │
└─────────────────────────────────────────────────────────────┘
```

## Fix Strategy

### Priority-Based Approach

```
Priority 1: Critical Infrastructure (15 tests)
    ↓
Priority 2: Feature Completeness (45 tests)
    ↓
Priority 3: Accessibility & UX (40 tests)
    ↓
Priority 4: Guest Portal (30 tests)
    ↓
Priority 5: System Infrastructure (25 tests)
```

### Task Delegation Pattern

```
Main Agent
    │
    ├─→ Analyze failing tests
    │
    ├─→ Create task list
    │
    ├─→ Delegate to Sub-Agent
    │       │
    │       ├─→ Read task requirements
    │       │
    │       ├─→ Analyze affected files
    │       │
    │       ├─→ Implement fixes
    │       │
    │       ├─→ Run verification tests
    │       │
    │       └─→ Report results
    │
    └─→ Verify and continue
```

## Component Patterns

### DataTable URL State Management

**Problem**: State not syncing with URL parameters

**Solution**:
```typescript
// Enhanced URL state restoration
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  // Restore state from URL
  const urlSort = params.get('sort');
  const urlDirection = params.get('direction');
  const urlSearch = params.get('search');
  const urlPage = params.get('page');
  
  // Call parent callbacks to notify of restored state
  if (onSort && urlSort) onSort(urlSort, urlDirection);
  if (onSearch && urlSearch) onSearch(urlSearch);
  if (onPageChange && urlPage) onPageChange(parseInt(urlPage));
  if (onFilter) {
    const filters = {};
    params.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        filters[key.replace('filter_', '')] = value;
      }
    });
    onFilter(filters);
  }
}, [onSort, onSearch, onPageChange, onFilter]);
```

### Admin Navigation

**Pattern**: Already correctly implemented

**Key Features**:
- Tab expansion with state management
- Active state highlighting with aria-current
- Mobile menu with responsive design
- Keyboard navigation support
- Browser navigation sync

### Content Management Workflows

**Pattern**: Multi-step form with validation

```typescript
// Content page creation flow
1. Create content page (title, slug, type)
2. Add sections (layout, content)
3. Add content to sections (text, photos, references)
4. Preview content page
5. Publish content page

// Validation at each step
- Required fields
- Slug uniqueness
- Circular reference prevention
- Content validation
```

### Email Management

**Pattern**: Composition → Preview → Send/Schedule

```typescript
// Email composition flow
1. Select recipients (by group, individual)
2. Compose email (subject, body, template)
3. Preview email (with variable substitution)
4. Send or schedule email
5. View email history

// Features
- Template system with variables
- Draft saving
- Bulk email
- XSS sanitization
- Accessibility
```

## Data Flow

### Authentication Flow

```
Browser
    │
    ├─→ Login Page
    │       │
    │       └─→ POST /api/auth/login
    │               │
    │               ├─→ Supabase Auth
    │               │       │
    │               │       └─→ Create session
    │               │
    │               └─→ Middleware
    │                       │
    │                       ├─→ Check admin_users table
    │                       │
    │                       └─→ Allow/Deny access
    │
    └─→ Admin Dashboard
```

### Data Management Flow

```
Component
    │
    ├─→ User Action (create, update, delete)
    │       │
    │       └─→ API Route
    │               │
    │               ├─→ Validate input (Zod)
    │               │
    │               ├─→ Sanitize input (DOMPurify)
    │               │
    │               ├─→ Service Layer
    │               │       │
    │               │       └─→ Database (Supabase)
    │               │               │
    │               │               └─→ RLS Policies
    │               │
    │               └─→ Return Result<T>
    │
    └─→ Update UI
```

## Testing Patterns

### E2E Test Structure

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to page, authenticate if needed
  });
  
  test('should perform action successfully', async ({ page }) => {
    // Arrange: Set up test data
    // Act: Perform user action
    // Assert: Verify expected outcome
  });
  
  test('should handle error case', async ({ page }) => {
    // Arrange: Set up error condition
    // Act: Perform action that should fail
    // Assert: Verify error handling
  });
  
  test.afterEach(async ({ page }) => {
    // Cleanup: Remove test data if needed
  });
});
```

### Verification Pattern

```bash
# After each fix
1. Run specific test file
   npm run test:e2e -- __tests__/e2e/[file].spec.ts

2. Verify no regressions
   npm run test:e2e -- --timeout=300000

3. Check build
   npm run build

4. Check types
   npm run type-check
```

## Error Handling

### Test Failures

```typescript
// Categorize failures
1. Authentication failures → Check auth setup
2. Navigation failures → Check routes and middleware
3. Data failures → Check database and RLS
4. UI failures → Check component rendering
5. Accessibility failures → Check ARIA and keyboard nav
```

### Debugging Strategy

```typescript
// For each failing test
1. Read test code to understand intent
2. Run test in headed mode to see browser
3. Check browser console for errors
4. Check network tab for API failures
5. Check database for data issues
6. Add console.log to narrow down issue
7. Fix root cause
8. Verify fix
9. Remove debug code
```

## Performance Considerations

### Test Execution

- **Parallel execution**: 4 workers for faster completion
- **Test isolation**: Each test independent
- **Database cleanup**: Fast cleanup between tests
- **Authentication reuse**: Save auth state, reuse across tests

### Development

- **Hot reload**: Dev server with fast refresh
- **Incremental builds**: Only rebuild changed files
- **Type checking**: Fast type checking with tsc
- **Linting**: Fast linting with ESLint

## Security Considerations

### Test Environment

- **Separate database**: E2E tests use dedicated test database
- **Mock credentials**: External services use mock credentials
- **No production data**: Never test against production
- **Clean up**: Always clean up test data

### Code Changes

- **Input validation**: Always validate user input
- **Input sanitization**: Always sanitize user input
- **Authentication**: Always check authentication
- **Authorization**: Always check permissions
- **RLS policies**: Always use RLS for data access

## Accessibility Patterns

### Keyboard Navigation

```typescript
// Required keyboard support
- Tab: Move focus forward
- Shift+Tab: Move focus backward
- Enter: Activate button/link
- Space: Activate button
- Escape: Close modal/dialog
- Arrow keys: Navigate lists/menus
- Home/End: Jump to start/end
```

### Screen Reader Support

```typescript
// Required ARIA attributes
- aria-label: Label for elements without visible text
- aria-labelledby: Reference to label element
- aria-describedby: Reference to description element
- aria-expanded: State of expandable elements
- aria-controls: Reference to controlled element
- aria-current: Current item in navigation
- aria-live: Live region for dynamic content
- role: Semantic role for custom elements
```

### Responsive Design

```typescript
// Required breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

// Required features
- Touch targets: Minimum 44x44px
- Zoom support: Up to 200%
- Responsive layout: Adapts to screen size
- Mobile menu: Hamburger menu on mobile
```

## Code Quality Standards

### TypeScript

- Explicit return types on exported functions
- Explicit types on function parameters
- No `any` types
- Use `unknown` instead of `any`
- Use optional chaining and nullish coalescing

### React

- Named function exports (not arrow functions)
- Explicit props interface
- Default to Server Components
- Use `useCallback` for event handlers
- Use `useMemo` for expensive computations

### Testing

- Descriptive test names
- AAA pattern (Arrange, Act, Assert)
- Test one thing per test
- Independent tests
- Clean up after tests

## Documentation Standards

### Code Comments

```typescript
/**
 * Brief description of function
 * 
 * @param param1 - Description of param1
 * @param param2 - Description of param2
 * @returns Description of return value
 * 
 * @example
 * const result = functionName(param1, param2);
 */
```

### Progress Documentation

```markdown
# Task Name - Status

## Summary
Brief summary of what was done

## Changes
- File 1: Description of changes
- File 2: Description of changes

## Tests Fixed
- Test 1
- Test 2

## Verification
Command to verify fixes

## Results
Pass rate before: X%
Pass rate after: Y%
Improvement: +Z tests
```

## Rollback Strategy

### If Fix Causes Regressions

```bash
# 1. Identify regression
npm run test:e2e -- --timeout=300000

# 2. Revert changes
git diff HEAD
git checkout -- [file]

# 3. Re-run tests
npm run test:e2e -- --timeout=300000

# 4. Analyze and fix properly
```

### If Fix Doesn't Work

```bash
# 1. Verify test is correct
# Read test code, understand intent

# 2. Debug in headed mode
npm run test:e2e -- --headed __tests__/e2e/[file].spec.ts

# 3. Check browser console
# Look for errors, warnings

# 4. Try different approach
# Implement alternative solution

# 5. Verify again
npm run test:e2e -- __tests__/e2e/[file].spec.ts
```

## Success Criteria

### Code Quality
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Follows project conventions
- ✅ Has appropriate comments

### Test Quality
- ✅ Tests pass consistently
- ✅ No flaky tests
- ✅ Tests are independent
- ✅ Tests clean up after themselves

### Feature Quality
- ✅ Feature works end-to-end
- ✅ Error handling works
- ✅ Accessibility works
- ✅ Responsive design works

### Documentation Quality
- ✅ Changes documented
- ✅ Progress tracked
- ✅ Results verified
- ✅ Handoff clear
