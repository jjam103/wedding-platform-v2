# Test Fixtures

This directory contains test fixtures used by E2E and integration tests.

## Image Fixtures

For photo upload tests, you'll need to provide the following image files:

- `test-image.jpg` - Standard test image (< 5MB)
- `test-image-1.jpg` - First image for batch upload tests
- `test-image-2.jpg` - Second image for batch upload tests
- `large-image.jpg` - Large image for size validation tests (> 10MB)

## Text Fixtures

- `test-file.txt` - Non-image file for file type validation tests

## Creating Fixtures

You can create simple test images using ImageMagick:

```bash
# Create standard test image
convert -size 800x600 xc:blue test-image.jpg

# Create batch upload images
convert -size 800x600 xc:red test-image-1.jpg
convert -size 800x600 xc:green test-image-2.jpg

# Create large image
convert -size 4000x3000 xc:yellow large-image.jpg
```

Or create a simple text file:

```bash
echo "This is a test file" > test-file.txt
```

## Note

These fixtures are not committed to the repository. You'll need to create them locally before running E2E tests that depend on file uploads.
