# CMS Comparison and useSectionData Hook Addition

## Summary

Analyzed provided `ContentEditor` and `SectionManager` components to identify missing capabilities. Created `useSectionData` hook to centralize section management operations.

## Provided Components Analysis

### ContentEditor Component
**Purpose**: Unified CMS interface for managing events, content pages, and locations

**Features**:
- Tab-based navigation (events, content-pages, locations)
- Inline CRUD forms (collapsible)
- Automatic slug generation
- Integrated section management
- Direct Supabase queries (client-side)

### SectionManager Component
**Purpose**: Inline section management for any page entity

**Features**:
- Uses `useSectionData` hook
- Section list with reordering
- Section form for creation
- Section editor for updates
- Available items lookup

## Architecture Comparison

### Current Architecture (Recommended to Keep)

**Strengths**:
- ✅ Separation of concerns (dedicated pages)
- ✅ Better for large datasets (pagination, filtering)
- ✅ More maintainable (smaller components)
- ✅ Better UX (full-page layouts)
- ✅ Follows Next.js App Router patterns
- ✅ Server-side rendering where appropriate
- ✅ API routes for data operations

**Structure**:
```
/admin/events → Event management page
/admin/content-pages → Content page management
/admin/locations → Location management
/admin/home-page → Section management for home
```

### Provided Architecture (Not Recommended)

**Weaknesses**:
- ❌ Monolithic component (harder to maintain)
- ❌ Client-side Supabase queries (bypasses API layer)
- ❌ Tab-based navigation (cramped for large datasets)
- ❌ Inline forms (less space for complex forms)
- ❌ Doesn't follow current architecture patterns

**Why Not to Adopt**:
1. Current architecture is more scalable
2. API routes provide better security and validation
3. Dedicated pages provide better UX
4. Easier to test and maintain

## What Was Missing: useSectionData Hook

The provided components revealed **one valuable missing piece**: a centralized hook for section operations.

### Created: `hooks/useSectionData.ts`

**Purpose**: Centralize section management logic (similar to `usePhotos` hook)

**Features**:
```typescript
const {
  sections,           // Array of sections for the page
  availableItems,     // Available items for references
  loading,            // Loading state
  error,              // Error state
  loadSections,       // Reload sections
  createSection,      // Create new section
  updateSection,      // Update existing section
  deleteSection,      // Delete section
  reorderSections,    // Reorder sections
} = useSectionData(pageSlug);
```

**Operations**:
1. **Load Sections** - Fetches sections for a page slug
2. **Load Available Items** - Fetches events, activities, pages, locations for references
3. **Create Section** - Creates new section with auto-ordering
4. **Update Section** - Updates section data
5. **Delete Section** - Removes section
6. **Reorder Sections** - Updates sort orders for drag-and-drop

**Benefits**:
- ✅ Centralized section logic
- ✅ Consistent error handling
- ✅ Loading states managed
- ✅ Reusable across components
- ✅ Easier to test
- ✅ Follows existing hook patterns

## Integration with Existing Code

### Before (Without Hook)
```typescript
// Component had to manage all this logic
const [sections, setSections] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadSections() {
    const result = await sectionsService.listByPage(pageSlug);
    if (result.success) setSections(result.data);
    setLoading(false);
  }
  loadSections();
}, [pageSlug]);

const handleCreate = async (data) => {
  const result = await sectionsService.create(data);
  // Reload sections...
};
```

### After (With Hook)
```typescript
// Much cleaner!
const { sections, loading, createSection, updateSection, deleteSection } = useSectionData(pageSlug);

const handleCreate = async (data) => {
  await createSection(data);
  // Sections automatically reload
};
```

### Usage Example

```typescript
import { useSectionData } from '@/hooks/useSectionData';

export function MyPageSections({ pageSlug }: { pageSlug: string }) {
  const {
    sections,
    availableItems,
    loading,
    error,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
  } = useSectionData(pageSlug);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {sections.map(section => (
        <SectionCard
          key={section.id}
          section={section}
          onUpdate={(data) => updateSection(section.id, data)}
          onDelete={() => deleteSection(section.id)}
        />
      ))}
    </div>
  );
}
```

## Where to Use useSectionData Hook

### Existing Pages That Can Benefit

1. **`app/admin/home-page/page.tsx`**
   - Currently manages sections manually
   - Can use hook for cleaner code

2. **`app/admin/events/page.tsx`**
   - If events have sections
   - Simplify section management

3. **`app/admin/content-pages/page.tsx`**
   - Content pages have sections
   - Hook provides available items for references

4. **`components/admin/SectionEditor.tsx`**
   - Can use hook for section operations
   - Cleaner state management

### New Components That Should Use It

Any component that needs to:
- Display sections for a page
- Create/update/delete sections
- Reorder sections
- Reference other entities in sections

## Comparison with Other Hooks

### Similar Patterns in Codebase

1. **`usePhotos`** (just created)
   - Manages photo operations
   - Similar structure and benefits

2. **`useContentPages`** (exists)
   - Manages content page operations
   - Same pattern

3. **`useLocations`** (exists)
   - Manages location operations
   - Consistent approach

4. **`useSections`** (exists)
   - Basic section operations
   - `useSectionData` is more comprehensive

### Why useSectionData is Better Than useSections

**`useSections`** (existing):
- Basic section loading
- No CRUD operations
- No available items
- Limited functionality

**`useSectionData`** (new):
- ✅ Full CRUD operations
- ✅ Available items for references
- ✅ Reordering support
- ✅ Error handling
- ✅ Loading states
- ✅ Auto-reload after operations

## Testing Recommendations

### Unit Tests Needed

```typescript
// hooks/useSectionData.test.ts
describe('useSectionData', () => {
  it('should load sections on mount', async () => {
    // Test initial load
  });

  it('should create section and reload', async () => {
    // Test create operation
  });

  it('should update section and reload', async () => {
    // Test update operation
  });

  it('should delete section and reload', async () => {
    // Test delete operation
  });

  it('should reorder sections', async () => {
    // Test reorder operation
  });

  it('should load available items', async () => {
    // Test available items loading
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

### Integration Tests Needed

Test hook with real API calls:
- Create section via hook
- Update section via hook
- Delete section via hook
- Reorder sections via hook
- Verify database state after operations

## Migration Path

### Phase 1: Add Hook (Complete)
- ✅ Created `hooks/useSectionData.ts`
- ✅ Documented usage

### Phase 2: Update Existing Components
1. Update `app/admin/home-page/page.tsx` to use hook
2. Update `app/admin/content-pages/page.tsx` to use hook
3. Update `components/admin/SectionEditor.tsx` to use hook

### Phase 3: Deprecate Manual Section Management
1. Remove manual section loading logic
2. Remove manual CRUD operations
3. Standardize on hook usage

### Phase 4: Add Tests
1. Write unit tests for hook
2. Write integration tests
3. Update E2E tests to use new patterns

## Benefits Summary

### For Developers
- ✅ Less boilerplate code
- ✅ Consistent section management
- ✅ Easier to test
- ✅ Better error handling
- ✅ Reusable across components

### For Users
- ✅ More reliable section operations
- ✅ Better error messages
- ✅ Consistent UX across pages
- ✅ Faster development of new features

### For Codebase
- ✅ Reduced duplication
- ✅ Centralized logic
- ✅ Easier to maintain
- ✅ Follows established patterns
- ✅ Better separation of concerns

## Conclusion

**Decision**: Keep current page-based architecture, extract `useSectionData` hook

**Rationale**:
1. Current architecture is superior for this use case
2. Hook provides the valuable part of provided components
3. Maintains consistency with existing patterns
4. Easier migration path
5. Better long-term maintainability

**Impact**: Improves code quality without disrupting existing architecture

**Files Created**:
1. `hooks/useSectionData.ts` - Section management hook
2. `CMS_COMPARISON_AND_HOOK_ADDITION.md` - This document

**Next Steps**:
1. Write tests for `useSectionData` hook
2. Update existing components to use hook
3. Document hook usage in developer guide
4. Add to component library examples
