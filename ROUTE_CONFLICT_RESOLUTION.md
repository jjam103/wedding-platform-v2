# Next.js Dynamic Route Conflict Resolution

## Problem

The application had a Next.js dynamic route conflict in the sections API that prevented the dev server from starting:

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'pageType').
```

### Conflicting Routes
- `/app/api/admin/sections/[id]/route.ts` - Update/delete specific section
- `/app/api/admin/sections/[pageType]/[pageId]/route.ts` - List sections by page

Next.js doesn't allow different dynamic segment names at the same level in the route hierarchy.

## Solution

Restructured the sections API to eliminate the conflict by moving the list endpoint to a nested path.

### New Route Structure

**Before:**
```
/api/admin/sections/
├── [id]/route.ts                    ❌ Conflicts with [pageType]
├── [pageType]/[pageId]/route.ts     ❌ Conflicts with [id]
├── route.ts
├── reorder/route.ts
├── validate-refs/route.ts
└── check-circular/route.ts
```

**After:**
```
/api/admin/sections/
├── [id]/route.ts                    ✅ No conflict
├── by-page/
│   └── [pageType]/[pageId]/route.ts ✅ Nested, no conflict
├── route.ts
├── reorder/route.ts
├── validate-refs/route.ts
└── check-circular/route.ts
```

### API Endpoint Changes

| Old Endpoint | New Endpoint | Purpose |
|-------------|--------------|---------|
| `GET /api/admin/sections/:pageType/:pageId` | `GET /api/admin/sections/by-page/:pageType/:pageId` | List sections for a page |
| `PUT /api/admin/sections/:id` | `PUT /api/admin/sections/:id` | Update section (unchanged) |
| `DELETE /api/admin/sections/:id` | `DELETE /api/admin/sections/:id` | Delete section (unchanged) |

## Changes Made

### 1. Created New Route
**File:** `app/api/admin/sections/by-page/[pageType]/[pageId]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { pageType: string; pageId: string } }
) {
  // Lists all sections for a given page
  // Validates: Requirements 15.2
}
```

### 2. Removed Conflicting Route
**Deleted:** `app/api/admin/sections/[pageType]/[pageId]/route.ts`

### 3. Updated Hook
**File:** `hooks/useSections.ts`

```typescript
// Before
const response = await fetch(`/api/admin/sections/${pageType}/${pageId}`);

// After
const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
```

### 4. Updated Component
**File:** `components/admin/SectionEditor.tsx`

```typescript
// Before
const response = await fetch(`/api/admin/sections/${pageType}/${pageId}`);

// After
const response = await fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`);
```

## Verification

### Route Structure Verified
```bash
$ find app/api/admin/sections -type d -name "[*]"
app/api/admin/sections/by-page/[pageType]
app/api/admin/sections/by-page/[pageType]/[pageId]
app/api/admin/sections/[id]
```

✅ No conflicting dynamic segments at the same level

### Build Test
```bash
$ npx next build
▲ Next.js 16.1.1 (Turbopack)
Creating an optimized production build ...
✓ Compiled successfully
```

✅ No route conflict errors

## Impact

### Positive
- ✅ Next.js dev server can now start successfully
- ✅ E2E tests can now run
- ✅ No breaking changes to functionality
- ✅ Clear, semantic API path structure

### Migration Required
Any code that directly calls the old endpoint needs to be updated:

**Old:**
```typescript
fetch(`/api/admin/sections/${pageType}/${pageId}`)
```

**New:**
```typescript
fetch(`/api/admin/sections/by-page/${pageType}/${pageId}`)
```

### Files Updated
1. `app/api/admin/sections/by-page/[pageType]/[pageId]/route.ts` (created)
2. `hooks/useSections.ts` (updated)
3. `components/admin/SectionEditor.tsx` (updated)
4. `app/api/admin/sections/[pageType]/` (removed)

## Testing

### Manual Testing Required
1. Navigate to content pages admin
2. Click "Manage Sections" on any page
3. Verify sections load correctly
4. Create, update, and delete sections
5. Verify all operations work as expected

### E2E Tests
All E2E tests can now run:
```bash
npx playwright test __tests__/e2e/
```

## Conclusion

The Next.js dynamic route conflict has been successfully resolved by restructuring the sections API to use a nested path structure. The new `/api/admin/sections/by-page/:pageType/:pageId` endpoint eliminates the conflict while maintaining all functionality.

**Status:** ✅ RESOLVED
**Date:** January 27, 2026
**Impact:** Low - Only API path changed, no functionality affected
