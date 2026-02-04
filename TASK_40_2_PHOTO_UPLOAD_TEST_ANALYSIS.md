# Task 40.2: Photo Upload via File Input Test Analysis

## Test Execution Result

**Status**: Test Skipped ⏭️  
**Reason**: Upload button not found on `/admin/photos` page

## Root Cause Analysis

The test was looking for an upload button on the `/admin/photos` page, but this page is designed for **photo moderation**, not direct uploads.

### Actual Photo Upload Workflow

Photo uploads in the admin interface happen through the **PhotoPicker component**, which is embedded in the section editor:

1. **Navigate to entity page** (e.g., `/admin/activities`)
2. **Click "Manage Sections"** button
3. **Section editor opens** with PhotoPicker
4. **PhotoPicker modal** contains:
   - "Add Photos from Gallery" button
   - Opens modal with photo grid
   - **Upload button in modal header** with file input
   - File input accepts `multiple` files with `accept="image/*"`

### PhotoPicker Upload Implementation

Located in `components/admin/PhotoPicker.tsx`:

```typescript
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
  <span className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100...">
    Upload Icon + Text
  </span>
</label>
```

### Upload API Endpoint

**Endpoint**: `POST /api/admin/photos`  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Image file (required)
- `metadata`: JSON string with:
  - `page_type`: 'event' | 'activity' | 'accommodation' | 'memory'
  - `page_id`: UUID or 'general'
  - `caption`: string (optional)
  - `alt_text`: string (optional)

**Validation**:
- Allowed types: JPEG, PNG, WebP, GIF
- Max size: 10MB
- Metadata required

## Test Strategy Options

### Option 1: Test via Section Editor (Recommended)
Test the actual user workflow through the section editor:

```typescript
test('should upload photo via file input in PhotoPicker', async ({ page }) => {
  // Navigate to activities page
  await page.goto(`${BASE_URL}/admin/activities`);
  
  // Click "Manage Sections"
  await page.click('button:has-text("Manage Sections")');
  
  // Click "Add Photos from Gallery"
  await page.click('button:has-text("Add Photos from Gallery")');
  
  // Upload file in modal
  const fileInput = page.locator('input[type="file"][aria-label="Upload photos"]');
  await fileInput.setInputFiles(TEST_PHOTO_PATH);
  
  // Verify upload success
  await expect(page.locator('text=/uploaded|success/i')).toBeVisible();
});
```

### Option 2: Test API Directly
Test the upload API endpoint directly:

```typescript
test('should upload photo via API', async ({ request }) => {
  const formData = new FormData();
  formData.append('file', fs.readFileSync(TEST_PHOTO_PATH));
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

### Option 3: Create Standalone Upload Page (Not Recommended)
Would require creating a new admin page specifically for uploads, which doesn't match the current architecture.

## Recommendation

**Update the test to use Option 1** - test through the section editor workflow. This:
- ✅ Tests the actual user workflow
- ✅ Validates the complete integration
- ✅ Matches the application architecture
- ✅ Tests PhotoPicker component functionality
- ✅ Verifies file input, upload, and display

## Test File Location

`__tests__/e2e/photoUploadWorkflow.spec.ts`

## Current Test Status

The test file exists and has comprehensive coverage, but the first test needs to be updated to navigate through the section editor instead of looking for an upload button on the photos moderation page.

## Next Steps

1. Update test to navigate via section editor
2. Locate PhotoPicker modal and upload button
3. Upload test photo
4. Verify upload success and photo appears in picker
5. Run updated test to verify it passes

## Related Files

- `components/admin/PhotoPicker.tsx` - Upload UI component
- `app/api/admin/photos/route.ts` - Upload API endpoint
- `components/admin/SectionEditor.tsx` - Contains PhotoPicker
- `__tests__/e2e/photoUploadWorkflow.spec.ts` - Test file
