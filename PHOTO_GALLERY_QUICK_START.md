# Photo Gallery Quick Start Guide

## ✅ Problem Fixed

**Photos now display inline in guest galleries!** No more authentication errors.

## 🚀 Quick Test

### 1. Test Gallery Page
Visit: **http://localhost:3000/test-gallery**

You should see:
- ✅ Grid of 5 photos (Gallery mode)
- ✅ Carousel with navigation (Carousel mode)
- ✅ Auto-playing slideshow (Loop mode)

### 2. Admin Photo Upload
Visit: **http://localhost:3000/admin/photos**

1. Click "Upload Photos" button
2. Select photos (JPEG, PNG, WebP, GIF - max 10MB)
3. Photos upload and display immediately
4. All admin uploads are auto-approved

### 3. Check Existing Photos
Run: `node scripts/check-photos.mjs`

Shows:
- All photos in database
- Photo URLs and accessibility
- Storage type (B2 or Supabase)

## 📋 What Was Fixed

### Before
```typescript
// ❌ Required authentication
fetch('/api/admin/photos/[id]')
// Result: 401 Unauthorized for guests
```

### After
```typescript
// ✅ Public endpoint
fetch('/api/photos/[id]')
// Result: Photos display for everyone (approved only)
```

## 🎯 Key Features

### Guest-Facing Gallery
- ✅ No authentication required
- ✅ Only shows approved photos
- ✅ Three display modes (gallery, carousel, loop)
- ✅ Captions and alt text support
- ✅ Responsive design

### Admin Photo Management
- ✅ Multi-file upload
- ✅ Drag & drop support
- ✅ Photo moderation (approve/reject)
- ✅ Edit captions and alt text
- ✅ Real-time updates
- ✅ Storage health check

### Storage
- ✅ Supabase Storage (current)
- ✅ B2 with Cloudflare CDN (configured, ready)
- ✅ Automatic failover
- ✅ CDN domain: cdn.jamara.us

## 🔧 How to Use in Your Pages

### In SectionRenderer (Guest Pages)
```tsx
<SectionRenderer
  sections={[
    {
      content_type: 'photo_gallery',
      content_data: {
        photo_ids: ['id-1', 'id-2', 'id-3'],
        display_mode: 'gallery', // or 'carousel' or 'loop'
        autoplay_speed: 3000, // for loop mode
        show_captions: true,
      }
    }
  ]}
/>
```

### Direct Component Usage
```tsx
import { PhotoGallery } from '@/components/guest/PhotoGallery';

<PhotoGallery 
  photoIds={['id-1', 'id-2']}
  displayMode="carousel"
  showCaptions={true}
  autoplaySpeed={3000}
/>
```

## 🔐 Security

### Public Endpoint (`/api/photos/[id]`)
- ✅ No authentication required
- ✅ Only returns approved photos
- ✅ Pending/rejected photos return 404
- ✅ Read-only access

### Admin Endpoint (`/api/admin/photos/[id]`)
- ✅ Authentication required
- ✅ Full CRUD operations
- ✅ View all photos (pending, approved, rejected)
- ✅ Moderation workflows

## 📊 Current Status

### Photos in Database
```
✅ 5 photos total
✅ All approved
✅ All accessible
✅ All using Supabase Storage
```

### B2 Configuration
```
✅ Region: us-east-005
✅ Endpoint: https://s3.us-east-005.backblazeb2.com
✅ CDN: cdn.jamara.us
✅ Bucket: wedding-photos-2026-jamara
✅ Ready for new uploads
```

## 🎨 Display Modes

### Gallery Mode (Grid)
```tsx
<PhotoGallery 
  photoIds={ids}
  displayMode="gallery"
/>
```
- Grid layout (1-3 columns responsive)
- Hover effects
- Captions below images

### Carousel Mode (Manual)
```tsx
<PhotoGallery 
  photoIds={ids}
  displayMode="carousel"
/>
```
- One photo at a time
- Previous/Next buttons
- Dot indicators
- Click dots to jump to photo

### Loop Mode (Auto-play)
```tsx
<PhotoGallery 
  photoIds={ids}
  displayMode="loop"
  autoplaySpeed={3000}
/>
```
- Auto-advances every 3 seconds
- Smooth transitions
- Progress indicators
- Loops continuously

## 🐛 Troubleshooting

### Photos Not Displaying?

1. **Check photo IDs are correct**
   ```bash
   node scripts/check-photos.mjs
   ```

2. **Verify public endpoint works**
   ```bash
   curl http://localhost:3000/api/photos/[photo-id]
   ```

3. **Check browser console** for errors

4. **Verify photos are approved**
   - Visit `/admin/photos`
   - Check "Approved" tab

### Upload Not Working?

1. **Check file type** (JPEG, PNG, WebP, GIF only)
2. **Check file size** (max 10MB)
3. **Check authentication** (must be logged in as admin)
4. **Check browser console** for errors

### B2 Not Being Used?

1. **Check storage health**
   - Visit `/admin/photos`
   - Click "Check Storage" button

2. **Verify B2 credentials** in `.env.local`
   ```bash
   B2_ACCESS_KEY_ID=...
   B2_SECRET_ACCESS_KEY=...
   B2_BUCKET_NAME=...
   B2_REGION=us-east-005
   B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
   ```

3. **Check B2 health**
   - If unhealthy, uploads use Supabase (automatic failover)
   - If healthy, new uploads use B2

## 📝 Files Changed

### Created
- ✅ `app/api/photos/[id]/route.ts` - Public endpoint
- ✅ `app/test-gallery/page.tsx` - Test page
- ✅ `scripts/check-photos.mjs` - Verification script

### Modified
- ✅ `components/guest/PhotoGallery.tsx` - Use public endpoint
- ✅ `.env.local` - B2 region corrected

## ✨ Summary

**Everything is working!** Photos display inline for guests, admin can upload and manage photos, and B2 storage is configured with automatic failover to Supabase.

### Next Steps
1. Visit test page: http://localhost:3000/test-gallery
2. Upload a photo: http://localhost:3000/admin/photos
3. Test on your actual guest pages
4. Enjoy your working photo gallery! 🎉
