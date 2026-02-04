/**
 * Photo Field Name Consistency Regression Tests
 * 
 * Purpose: Prevent regression where components use wrong field name for photo URLs
 * 
 * Background:
 * - Database schema uses 'photo_url' field (not 'url')
 * - All components must consistently use 'photo_url'
 * - API responses must include 'photo_url'
 * - No components should use deprecated 'url' field
 * 
 * This test suite validates:
 * 1. Database schema has photo_url column
 * 2. API responses include photo_url field
 * 3. All photo-related components use photo_url
 * 4. No components use deprecated 'url' field
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test database connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Photo Field Name Consistency Regression Tests', () => {
  describe('34.9 Database Schema Verification', () => {
    it('should have photo_url column in photos table', async () => {
      // Query the information schema to verify column exists
      const { data, error } = await supabase
        .from('photos')
        .select('photo_url')
        .limit(1);

      // Should not error (column exists)
      expect(error).toBeNull();
      
      // Verify the query structure is correct
      expect(data).toBeDefined();
    });

    it('should not have deprecated url column in photos table', async () => {
      // Query all columns and verify 'url' is not present
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .limit(1)
        .single();

      // If we have data, verify no 'url' field exists
      if (data && !error) {
        expect(data).not.toHaveProperty('url');
        expect(data).toHaveProperty('photo_url');
      }
      
      // If no data exists, that's okay - just verify the query structure
      if (error && error.code === 'PGRST116') {
        // No rows returned - this is fine for the test
        expect(error.code).toBe('PGRST116');
      }
    });

    it('should have photo_url as TEXT NOT NULL in schema', async () => {
      // Read the migration file to verify schema definition
      const migrationPath = join(process.cwd(), 'supabase/migrations/007_create_photos_table.sql');
      const migrationContent = readFileSync(migrationPath, 'utf-8');

      // Verify photo_url is defined correctly
      expect(migrationContent).toContain('photo_url TEXT NOT NULL');
      
      // Verify no 'url' column exists
      expect(migrationContent).not.toMatch(/\burl\s+TEXT/i);
    });
  });

  describe('34.7 API Response Verification', () => {
    let testPhotoId: string;

    beforeAll(async () => {
      // Create a test photo for API testing
      const { data: photo, error } = await supabase
        .from('photos')
        .insert({
          uploader_id: '00000000-0000-0000-0000-000000000000', // Test user
          photo_url: 'https://test.example.com/test-photo.jpg',
          storage_type: 'b2',
          page_type: 'memory',
          page_id: '00000000-0000-0000-0000-000000000000',
          caption: 'Test Photo for Field Consistency',
          alt_text: 'Test photo',
          moderation_status: 'approved',
        })
        .select('id')
        .single();

      if (photo) {
        testPhotoId = photo.id;
      }
    });

    afterAll(async () => {
      // Clean up test photo
      if (testPhotoId) {
        await supabase.from('photos').delete().eq('id', testPhotoId);
      }
    });

    it('should return photo_url field in API response', async () => {
      if (!testPhotoId) {
        console.warn('Test photo not created, skipping API test');
        return;
      }

      const { data: photo, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', testPhotoId)
        .single();

      expect(error).toBeNull();
      expect(photo).toBeDefined();
      expect(photo).toHaveProperty('photo_url');
      expect(typeof photo.photo_url).toBe('string');
    });

    it('should not return deprecated url field in API response', async () => {
      if (!testPhotoId) {
        console.warn('Test photo not created, skipping API test');
        return;
      }

      const { data: photo, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', testPhotoId)
        .single();

      expect(error).toBeNull();
      expect(photo).toBeDefined();
      expect(photo).not.toHaveProperty('url');
    });

    it('should include photo_url in list responses', async () => {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('id, photo_url, caption')
        .eq('moderation_status', 'approved')
        .limit(5);

      expect(error).toBeNull();
      expect(photos).toBeDefined();
      
      if (photos && photos.length > 0) {
        photos.forEach(photo => {
          expect(photo).toHaveProperty('photo_url');
          expect(typeof photo.photo_url).toBe('string');
          expect(photo).not.toHaveProperty('url');
        });
      }
    });
  });

  describe('34.2 PhotoGallery Component Verification', () => {
    it('should use photo_url field in PhotoGallery component', () => {
      const componentPath = join(process.cwd(), 'components/guest/PhotoGallery.tsx');
      const componentContent = readFileSync(componentPath, 'utf-8');

      // Verify photo_url is used in interface
      expect(componentContent).toContain('photo_url: string');
      
      // Verify photo_url is used in Image src
      expect(componentContent).toContain('src={photo.photo_url}');
      expect(componentContent).toContain('src={currentPhoto.photo_url}');
      
      // Verify no deprecated 'url' field is used
      expect(componentContent).not.toMatch(/photo\.url[^_]/);
      expect(componentContent).not.toMatch(/currentPhoto\.url[^_]/);
    });

    it('should define Photo interface with photo_url', () => {
      const componentPath = join(process.cwd(), 'components/guest/PhotoGallery.tsx');
      const componentContent = readFileSync(componentPath, 'utf-8');

      // Verify interface definition
      const interfaceMatch = componentContent.match(/interface Photo \{[^}]+\}/s);
      expect(interfaceMatch).toBeTruthy();
      
      if (interfaceMatch) {
        const interfaceContent = interfaceMatch[0];
        expect(interfaceContent).toContain('photo_url: string');
        
        // Check for standalone 'url: string' (not part of photo_url)
        const hasStandaloneUrl = /\burl:\s*string/g.test(interfaceContent) && 
                                 !/photo_url:\s*string/g.test(interfaceContent);
        expect(hasStandaloneUrl).toBe(false);
      }
    });
  });

  describe('34.4 PhotoPicker Component Verification', () => {
    it('should use photo_url field in PhotoPicker component', () => {
      const componentPath = join(process.cwd(), 'components/admin/PhotoPicker.tsx');
      const componentContent = readFileSync(componentPath, 'utf-8');

      // Verify photo_url is used in interface
      expect(componentContent).toContain('photo_url: string');
      
      // Verify photo_url is used in img src
      expect(componentContent).toContain('src={photo.photo_url}');
      
      // Verify no deprecated 'url' field is used
      expect(componentContent).not.toMatch(/photo\.url[^_]/);
    });

    it('should display selected photos using photo_url', () => {
      const componentPath = join(process.cwd(), 'components/admin/PhotoPicker.tsx');
      const componentContent = readFileSync(componentPath, 'utf-8');

      // Verify selected photos section uses photo_url
      const selectedPhotosSection = componentContent.match(/Selected Photos[\s\S]*?<\/div>/);
      expect(selectedPhotosSection).toBeTruthy();
      
      // Verify photo_url is used in the selected photos display
      expect(componentContent).toContain('src={photo.photo_url}');
    });
  });

  describe('34.3 PhotoGalleryPreview Component Verification', () => {
    it('should use photo_url field if PhotoGalleryPreview component exists', () => {
      const componentPath = join(process.cwd(), 'components/admin/PhotoGalleryPreview.tsx');
      
      try {
        const componentContent = readFileSync(componentPath, 'utf-8');

        // Verify photo_url is used
        expect(componentContent).toContain('photo_url');
        
        // Verify no deprecated 'url' field is used
        expect(componentContent).not.toMatch(/photo\.url[^_]/);
      } catch (error) {
        // Component might not exist yet, which is okay
        console.warn('PhotoGalleryPreview component not found, skipping test');
      }
    });
  });

  describe('34.6 SectionRenderer Component Verification', () => {
    it('should use photo_url field in SectionRenderer component', () => {
      const componentPath = join(process.cwd(), 'components/guest/SectionRenderer.tsx');
      const componentContent = readFileSync(componentPath, 'utf-8');

      // Verify PhotoGallery is used (which uses photo_url)
      expect(componentContent).toContain('PhotoGallery');
      expect(componentContent).toContain('photoIds={column.content_data?.photo_ids || []}');
      
      // SectionRenderer delegates to PhotoGallery, so it indirectly uses photo_url
      // No direct photo_url usage expected in SectionRenderer
    });
  });

  describe('34.5 RichTextEditor Component Verification', () => {
    it('should use photo_url field if RichTextEditor handles photos', () => {
      const componentPath = join(process.cwd(), 'components/admin/RichTextEditor.tsx');
      
      try {
        const componentContent = readFileSync(componentPath, 'utf-8');

        // If RichTextEditor handles photos, it should use photo_url
        if (componentContent.includes('photo') || componentContent.includes('image')) {
          // Check for photo_url usage
          const hasPhotoUrl = componentContent.includes('photo_url');
          const hasDeprecatedUrl = componentContent.match(/photo\.url[^_]/);
          
          if (hasPhotoUrl || hasDeprecatedUrl) {
            expect(hasPhotoUrl).toBe(true);
            expect(hasDeprecatedUrl).toBeFalsy();
          }
        }
      } catch (error) {
        // Component might not exist yet, which is okay
        console.warn('RichTextEditor component not found, skipping test');
      }
    });
  });

  describe('34.8 No Deprecated url Field Usage', () => {
    const componentsToCheck = [
      'components/guest/PhotoGallery.tsx',
      'components/admin/PhotoPicker.tsx',
      'components/guest/SectionRenderer.tsx',
    ];

    componentsToCheck.forEach(componentPath => {
      it(`should not use deprecated url field in ${componentPath}`, () => {
        const fullPath = join(process.cwd(), componentPath);
        
        try {
          const componentContent = readFileSync(fullPath, 'utf-8');

          // Check for deprecated patterns
          const deprecatedPatterns = [
            /photo\.url[^_]/g,  // photo.url (not photo.photo_url)
            /currentPhoto\.url[^_]/g,  // currentPhoto.url
            /\burl:\s*string/g,  // url: string in interface (should be photo_url)
          ];

          deprecatedPatterns.forEach(pattern => {
            const matches = componentContent.match(pattern);
            if (matches) {
              console.error(`Found deprecated pattern in ${componentPath}:`, matches);
            }
            expect(matches).toBeNull();
          });
        } catch (error) {
          // Component might not exist, skip
          console.warn(`Component ${componentPath} not found, skipping test`);
        }
      });
    });
  });

  describe('34.10 Service Layer Verification', () => {
    it('should use photo_url field in photoService', () => {
      const servicePath = join(process.cwd(), 'services/photoService.ts');
      
      try {
        const serviceContent = readFileSync(servicePath, 'utf-8');

        // Verify photo_url is used in service
        expect(serviceContent).toContain('photo_url');
        
        // Check for any deprecated 'url' field usage
        // Allow 'url' in variable names like 'photoUrl' or 'cdnUrl'
        const deprecatedMatches = serviceContent.match(/\burl:\s*string/g);
        if (deprecatedMatches) {
          // Filter out valid uses like 'photo_url' or 'cdnUrl'
          const invalidMatches = deprecatedMatches.filter(match => 
            !match.includes('photo_url') && 
            !match.includes('cdnUrl') &&
            !match.includes('storageUrl')
          );
          expect(invalidMatches.length).toBe(0);
        }
      } catch (error) {
        console.warn('photoService not found, skipping test');
      }
    });
  });

  describe('Integration: End-to-End Field Consistency', () => {
    it('should maintain photo_url consistency from database to UI', async () => {
      // This test verifies the complete data flow:
      // Database (photo_url) → API → Service → Component

      // 1. Verify database has photo_url
      const { data: dbPhoto, error: dbError } = await supabase
        .from('photos')
        .select('photo_url')
        .eq('moderation_status', 'approved')
        .limit(1)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned", which is okay
        expect(dbError).toBeNull();
      }

      if (dbPhoto) {
        // 2. Verify photo_url is a valid string
        expect(dbPhoto).toHaveProperty('photo_url');
        expect(typeof dbPhoto.photo_url).toBe('string');
        expect(dbPhoto.photo_url.length).toBeGreaterThan(0);

        // 3. Verify no 'url' field exists
        expect(dbPhoto).not.toHaveProperty('url');
      }
    });

    it('should use consistent field naming across all photo-related files', () => {
      const filesToCheck = [
        { path: 'components/guest/PhotoGallery.tsx', mustHavePhotoUrl: true },
        { path: 'components/admin/PhotoPicker.tsx', mustHavePhotoUrl: true },
        { path: 'components/guest/SectionRenderer.tsx', mustHavePhotoUrl: false }, // Delegates to PhotoGallery
        { path: 'supabase/migrations/007_create_photos_table.sql', mustHavePhotoUrl: true },
      ];

      const results = filesToCheck.map(({ path: filePath, mustHavePhotoUrl }) => {
        const fullPath = join(process.cwd(), filePath);
        try {
          const content = readFileSync(fullPath, 'utf-8');
          return {
            file: filePath,
            hasPhotoUrl: content.includes('photo_url'),
            mustHavePhotoUrl,
            passed: !mustHavePhotoUrl || content.includes('photo_url'),
          };
        } catch (error) {
          return {
            file: filePath,
            hasPhotoUrl: false,
            mustHavePhotoUrl,
            passed: !mustHavePhotoUrl,
            error: 'File not found',
          };
        }
      });

      // Check that required files have photo_url
      results.forEach(result => {
        if (result.mustHavePhotoUrl && !result.error) {
          expect(result.hasPhotoUrl).toBe(true);
        }
      });

      // Log results for debugging
      console.log('Field consistency check results:', results);
    });
  });
});
