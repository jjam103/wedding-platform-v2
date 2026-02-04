# Photo Caption Editing Guide

## Current State

Currently, photo captions can only be set **during upload** and **cannot be edited** after the photo is uploaded. This is a limitation in the current implementation.

## Where Captions Are Set

### 1. Admin Photo Upload
**Location**: Admin Dashboard → Photo Gallery → Upload Photos

When uploading photos as an admin:
1. Select photos to upload
2. For each photo, you'll see input fields for:
   - **Caption** (optional) - The text that appears below the photo
   - **Alt Text** (optional) - For accessibility/screen readers
3. Enter captions before clicking "Upload All"

**File**: `components/admin/AdminPhotoUpload.tsx`

### 2. Guest Photo Upload
**Location**: Guest Portal → Photos → Upload

When guests upload photos:
1. Select photos to upload
2. For each photo, add a caption in the text field
3. Upload the photos

**File**: `components/guest/PhotoUpload.tsx`

## Current Limitation: No Caption Editing

Once a photo is uploaded, there is currently **no way to edit the caption** through the UI. The photo management page (`/admin/photos`) only allows you to:
- View photos
- Approve/Reject photos (moderation)
- Delete photos
- View existing captions (read-only)

## Workaround: Re-upload the Photo

If you need to change a caption:
1. Download the photo
2. Delete the old photo
3. Re-upload with the correct caption

## Recommended Enhancement

To add caption editing functionality, we would need to:

### 1. Add Edit Button to Photo Preview Modal

Update `app/admin/photos/page.tsx` to add an "Edit" button that opens an edit form.

### 2. Create Edit Form

Add a form with fields for:
- Caption (editable text input)
- Alt Text (editable text input)
- Display Order (optional)

### 3. Create Update API Endpoint

Add `PUT /api/admin/photos/[id]` endpoint to update photo metadata:

```typescript
// app/api/admin/photos/[id]/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth check
  // 2. Validate input (caption, alt_text)
  // 3. Update photo record in database
  // 4. Return updated photo
}
```

### 4. Update Photo Service

Add `updateMetadata` method to `photoService.ts`:

```typescript
export async function updateMetadata(
  photoId: string,
  data: { caption?: string; alt_text?: string; display_order?: number }
): Promise<Result<Photo>> {
  // Validate and update photo metadata
}
```

## Quick Implementation

If you need this feature now, here's a minimal implementation:

### Step 1: Add Edit Modal Component

```typescript
// In app/admin/photos/page.tsx

function PhotoEditModal({ 
  photo, 
  onClose, 
  onSave 
}: { 
  photo: Photo; 
  onClose: () => void; 
  onSave: (id: string, data: { caption?: string; alt_text?: string }) => Promise<void>;
}) {
  const [caption, setCaption] = useState(photo.caption || '');
  const [altText, setAltText] = useState(photo.alt_text || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(photo.id, { caption, alt_text: altText });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Photo Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter photo caption..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (for accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe the image..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-jungle-500 text-white rounded-lg hover:bg-jungle-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: Add Edit Button to Preview Modal

In the `PhotoPreviewModal` component, add an "Edit" button:

```typescript
<button
  onClick={() => {
    onClose();
    setEditingPhoto(photo);
  }}
  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
>
  Edit Details
</button>
```

### Step 3: Create Update API Endpoint

```typescript
// app/api/admin/photos/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updatePhotoSchema = z.object({
  caption: z.string().max(500).optional(),
  alt_text: z.string().max(200).optional(),
  display_order: z.number().int().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = updatePhotoSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
    }

    // Update photo
    const { data: photo, error } = await supabase
      .from('photos')
      .update({
        caption: validation.data.caption,
        alt_text: validation.data.alt_text,
        display_order: validation.data.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update photo' } },
      { status: 500 }
    );
  }
}
```

## Summary

**Current Workflow**:
1. Captions are set during upload only
2. No editing after upload
3. Must re-upload to change captions

**To Add Editing**:
1. Add edit modal to photos page
2. Create PUT endpoint for photo updates
3. Add save handler to update database

Would you like me to implement the caption editing feature now?
