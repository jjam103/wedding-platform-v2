# Task 40.2: Photo Upload Test - Actual Workflow Documentation

## Current Test Status

**Test**: `should upload photo via file input`  
**Status**: Skipping - "Add Photos button not found in section editor"

## Actual UI Workflow Discovery

### Step-by-Step Workflow

1. **Navigate to Activities Page** ✅
   - URL: `/admin/activities`
   - Page loads with activity list

2. **Click "Sections" Button** ✅
   - Button text: "▶ Sections" or "▼ Hide Sections"
   - Expands inline section editor below activity row

3. **Section Editor Appears** ✅
   - Component: `<SectionEditor pageType="activity" pageId={activityId} />`
   - Shows existing sections or "No sections yet" message

4. **PhotoPicker Integration** ⚠️
   - PhotoPicker is NOT a standalone modal
   - PhotoPicker is embedded WITHIN section columns
   - Only appears when a section has a photo gallery column

### The Missing Step

The test is looking for an "Add Photos from Gallery" button, but this button is part of the PhotoPicker component which is only rendered when:

1. A section exists
2. The section has a column
3. The column's `content_type` is `'photo_gallery'`

### PhotoPicker Rendering Logic

From `components/admin/SectionEditor.tsx`:

```typescript
{column.content_type === 'photo_gallery' && (
  <div className="space-y-3">
    {/* Display mode selector */}
    <select>...</select>
    
    {/* Photo picker */}
    <PhotoPicker
      selectedPhotoIds={(column.content_data as any).photo_ids || []}
      onSelectionChange={(photoIds) => {...}}
      pageType={pageType}
      pageId={pageId}
      disabled={saving}
    />
  </div>
)}
```

### PhotoPicker UI

From `components/admin/PhotoPicker.tsx`:

```typescript
// Selected photos preview (if any selected)
{selectedPhotoIds.length > 0 && (
  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
    <h4>Selected Photos ({selectedPhotoIds.length})</h4>
    <div className="grid grid-cols-4 gap-3">
      {/* Photo thumbnails */}
    </div>
  </div>
)}

// Add photos button
<button
  onClick={() => setShowPicker(true)}
  className="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-300 rounded-md..."
>
  + Add Photos from Gallery
</button>

// Modal (when showPicker is true)
{showPicker && (
  <div className="fixed inset-0 z-50...">
    <div className="bg-white rounded-lg...">
      <div className="flex items-center justify-between p-6 border-b">
        <h3>Select Photos</h3>
        
        {/* Upload button in modal header */}
        <label className="relative cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading || disabled}
            className="sr-only"
            aria-label="Upload photos"
          />
          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md...">
            Upload Icon + Text
          </span>
        </label>
      </div>
      {/* Photo grid */}
    </div>
  </div>
)}
```

## Complete Test Workflow

To test photo upload via file input, the test needs to:

1. ✅ Navigate to `/admin/activities`
2. ✅ Click "▶ Sections" button to expand section editor
3. ❌ **Check if sections exist**
   - If no sections: Click "Add Section" or "Create First Section"
4. ❌ **Check if section has photo gallery column**
   - If no photo column: Need to add a column with type 'photo_gallery'
5. ❌ **Find PhotoPicker component** (embedded in section)
6. ❌ **Click "+ Add Photos from Gallery"** button
7. ❌ **Modal opens** with photo grid and upload button
8. ❌ **Click upload button** (label with file input)
9. ❌ **Select file** from file input
10. ❌ **Wait for upload** to complete
11. ❌ **Verify photo appears** in modal grid

## Test Complexity Issue

The current test is too complex because it requires:
- Creating a section (if none exist)
- Adding a photo gallery column (if none exist)
- Then accessing the PhotoPicker
- Then uploading a photo

This is testing multiple features, not just photo upload.

## Recommended Solutions

### Option 1: Test API Directly (Simplest)
Test the upload API endpoint directly without UI:

```typescript
test('should upload photo via API', async ({ request }) => {
  const formData = new FormData();
  formData.append('file', await fs.promises.readFile(TEST_PHOTO_PATH));
  formData.append('metadata', JSON.stringify({
    page_type: 'activity',
    page_id: 'test-id',
    caption: 'Test photo',
    alt_text: 'Test alt text'
  }));
  
  const response = await request.post('/api/admin/photos', {
    data: formData
  });
  
  expect(response.status()).toBe(201);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.data.photo_url).toBeTruthy();
});
```

### Option 2: Test with Pre-existing Section
Create test data setup that ensures a section with photo gallery exists:

```typescript
test.beforeEach(async ({ page }) => {
  // Create activity with section containing photo gallery
  await setupTestActivityWithPhotoSection();
});

test('should upload photo via file input', async ({ page }) => {
  // Navigate to pre-configured activity
  await page.goto(`${BASE_URL}/admin/activities`);
  
  // Expand sections (section with photo gallery already exists)
  await page.click('button:has-text("Sections")');
  
  // PhotoPicker should be visible
  await page.click('button:has-text("Add Photos from Gallery")');
  
  // Upload in modal
  const fileInput = page.locator('input[type="file"][aria-label="Upload photos"]');
  await fileInput.setInputFiles(TEST_PHOTO_PATH);
  
  // Verify upload
  await expect(page.locator('img[src*="photo"]')).toBeVisible();
});
```

### Option 3: Simplify Test Scope
Test only that the file input exists and accepts files, not the full upload:

```typescript
test('should have file input for photo upload', async ({ page }) => {
  // Setup: ensure photo gallery section exists
  await setupPhotoGallerySection();
  
  await page.goto(`${BASE_URL}/admin/activities`);
  await page.click('button:has-text("Sections")');
  await page.click('button:has-text("Add Photos from Gallery")');
  
  // Verify file input exists and has correct attributes
  const fileInput = page.locator('input[type="file"][aria-label="Upload photos"]');
  await expect(fileInput).toBeVisible();
  await expect(fileInput).toHaveAttribute('accept', 'image/*');
  await expect(fileInput).toHaveAttribute('multiple', '');
});
```

## Recommendation

**Use Option 1** - Test the API directly. This:
- ✅ Tests the actual upload functionality
- ✅ Doesn't depend on complex UI state
- ✅ Is faster and more reliable
- ✅ Focuses on the upload feature, not section management
- ✅ Can be run in isolation

The UI integration (PhotoPicker → API) is already tested in other E2E tests like `sectionEditorPhotoWorkflow.spec.ts`.

## Next Steps

1. Update test to use API-based approach
2. Or add test setup to create section with photo gallery
3. Document the decision in test file
4. Run updated test to verify it passes
