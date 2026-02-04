# Section Editor Fixes - Manual Testing Checklist

**Date**: [Fill in test date]  
**Tester**: [Fill in tester name]  
**Environment**: http://localhost:3000  
**Status**: ⏳ Pending

---

## Overview

This checklist validates the section editor photo functionality fixes implemented in Phase 5 of the testing improvements spec. All three critical bugs have been fixed:

1. **Selected Photos Display** - Photos now show thumbnails immediately
2. **Guest Preview** - Preview displays actual photos with correct field names
3. **Rich Text Photo Insertion** - Photo insertion workflow confirmed working

## Prerequisites

### Before Testing
- [ ] Development server running: `npm run dev`
- [ ] Admin authenticated at http://localhost:3000/admin
- [ ] Test photos uploaded and approved in photo gallery
- [ ] At least 3-5 test photos available for selection
- [ ] Browser console open to monitor for errors

### Test Data Setup
- [ ] Create test event: "Test Wedding Ceremony"
- [ ] Create test activity: "Test Beach Reception"
- [ ] Create test content page: "Test Our Story"
- [ ] Upload 5+ test photos with captions
- [ ] Ensure all test photos have `moderation_status: 'approved'`

---

## Test Suite 1: PhotoGalleryPreview Functionality

### Test 1.1: Preview Displays Selected Photos
**Objective**: Verify preview shows actual photo images (not placeholders)

**Steps**:
1. Navigate to `/admin/events`
2. Click on test event to edit
3. Click "Manage Sections" button
4. Add a new section with type "Photo Gallery"
5. Click "Add Photos" button
6. Select 3 photos from PhotoPicker modal
7. Click "Save Selection"
8. Expand the preview section

**Expected Results**:
- ✅ Preview section displays 3 actual photo images
- ✅ Photos display in 2-column grid layout
- ✅ Each photo shows its caption
- ✅ No "No photos selected" message
- ✅ No placeholder images or broken image icons

**Pass/Fail**: [ ] PASS  [ ] FAIL

**Notes**: _______________________________________________

---

### Test 1.2: Display Mode Indicator
**Objective**: Verify display mode shows correctly (Gallery/Carousel/Loop)

**Steps**:
1. In section editor with photos selected
2. Set display mode to "Gallery"
3. Check preview section
4. Change display mode to "Carousel"
5. Check preview section again
6. Change display mode to "Loop"
7. Check preview section again

**Expected Results**:
- ✅ Preview shows "Display Mode: Gallery" when set to gallery
- ✅ Preview shows "Display Mode: Carousel" when set to carousel
- ✅ Preview shows "Display Mode: Loop" when set to loop
- ✅ Display mode indicator updates immediately on change
- ✅ Photos remain visible during mode changes

**Pass/Fail**: [ ] PASS  [ ] FAIL

**Notes**: _______________________________________________

---

### Test 1.3: Preview Loading States
**Objective**: Verify loading states display correctly

**Steps**:
1. Clear browser cache
2. Navigate to section editor with photos
3. Observe preview section while photos load
4. Check for skeleton placeholders or loading indicators

**Expected Results**:
- ✅ Loading state displays while fetching photos
- ✅ Skeleton placeholders or spinner shown
- ✅ No flash of "No photos selected" message
- ✅ Smooth transition from loading to loaded state
- ✅ No console errors during loading

**Pass/Fail**: [ ] PASS  [ ] FAIL

**Notes**: _______________________________________________

---
