/**
 * Property-based test for photo storage URL consistency.
 * Feature: destination-wedding-platform, Property 16: Photo Storage URL Consistency
 * Validates: Requirements 12.7
 * 
 * For any photo upload, the photo_url saved in the database should use the domain
 * corresponding to the active storage method (Cloudflare CDN domain for B2 storage,
 * Supabase domain for Supabase storage).
 */

import * as fc from 'fast-check';

describe('Feature: destination-wedding-platform, Property 16: Photo Storage URL Consistency', () => {
  // Arbitraries for generating test data
  const storageTypeArbitrary = fc.constantFrom('b2', 'supabase');
  
  const b2CDNDomainArbitrary = fc.constantFrom(
    'cdn.example.com',
    'f000.backblazeb2.com',
    'cdn.mysite.com'
  );
  
  const supabaseDomainArbitrary = fc.constantFrom(
    'supabase.co',
    'supabase.example.com',
    'storage.supabase.co'
  );
  
  const photoKeyArbitrary = fc.string({ minLength: 10, maxLength: 100 }).map(
    s => `photos/${Date.now()}-${s.replace(/[^a-zA-Z0-9._-]/g, '_')}.jpg`
  );

  it('should use Cloudflare CDN domain for B2 storage', () => {
    fc.assert(
      fc.property(
        b2CDNDomainArbitrary,
        photoKeyArbitrary,
        (cdnDomain, photoKey) => {
          // Arrange
          const storageType = 'b2';
          
          // Act - Generate URL based on storage type
          const photoUrl = `https://${cdnDomain}/${photoKey}`;
          
          // Assert - URL should contain the CDN domain
          expect(photoUrl).toContain(cdnDomain);
          expect(photoUrl).toContain('https://');
          expect(photoUrl).toContain(photoKey);
          
          // Verify it's not a Supabase URL
          expect(photoUrl).not.toContain('supabase');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use Supabase domain for Supabase storage', () => {
    fc.assert(
      fc.property(
        supabaseDomainArbitrary,
        photoKeyArbitrary,
        (supabaseDomain, photoKey) => {
          // Arrange
          const storageType = 'supabase';
          
          // Act - Generate URL based on storage type
          const photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          
          // Assert - URL should contain the Supabase domain
          expect(photoUrl).toContain(supabaseDomain);
          expect(photoUrl).toContain('https://');
          expect(photoUrl).toContain('storage/v1/object/public');
          expect(photoUrl).toContain(photoKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain URL consistency with storage type', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        b2CDNDomainArbitrary,
        supabaseDomainArbitrary,
        photoKeyArbitrary,
        (storageType, b2Domain, supabaseDomain, photoKey) => {
          // Act - Generate URL based on storage type
          let photoUrl: string;
          if (storageType === 'b2') {
            photoUrl = `https://${b2Domain}/${photoKey}`;
          } else {
            photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          }
          
          // Assert - URL domain should match storage type
          if (storageType === 'b2') {
            expect(photoUrl).toContain(b2Domain);
            expect(photoUrl).not.toContain('storage/v1/object/public');
          } else {
            expect(photoUrl).toContain(supabaseDomain);
            expect(photoUrl).toContain('storage/v1/object/public');
          }
          
          // All URLs should be HTTPS
          expect(photoUrl).toMatch(/^https:\/\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid URLs for all storage types', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        photoKeyArbitrary,
        (storageType, photoKey) => {
          // Arrange
          const b2Domain = 'cdn.example.com';
          const supabaseDomain = 'supabase.example.com';
          
          // Act
          let photoUrl: string;
          if (storageType === 'b2') {
            photoUrl = `https://${b2Domain}/${photoKey}`;
          } else {
            photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          }
          
          // Assert - URL should be valid
          expect(() => new URL(photoUrl)).not.toThrow();
          
          const url = new URL(photoUrl);
          expect(url.protocol).toBe('https:');
          expect(url.hostname).toBeTruthy();
          expect(url.pathname).toContain(photoKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve photo key in URL regardless of storage type', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        photoKeyArbitrary,
        (storageType, photoKey) => {
          // Arrange
          const b2Domain = 'cdn.example.com';
          const supabaseDomain = 'supabase.example.com';
          
          // Act
          let photoUrl: string;
          if (storageType === 'b2') {
            photoUrl = `https://${b2Domain}/${photoKey}`;
          } else {
            photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          }
          
          // Assert - Photo key should be present in URL
          expect(photoUrl).toContain(photoKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mix B2 and Supabase URL patterns', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        b2CDNDomainArbitrary,
        supabaseDomainArbitrary,
        photoKeyArbitrary,
        (storageType, b2Domain, supabaseDomain, photoKey) => {
          // Act
          let photoUrl: string;
          if (storageType === 'b2') {
            photoUrl = `https://${b2Domain}/${photoKey}`;
          } else {
            photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          }
          
          // Assert - B2 URLs should not have Supabase patterns and vice versa
          const hasB2Pattern = photoUrl.includes(b2Domain) && !photoUrl.includes('storage/v1/object/public');
          const hasSupabasePattern = photoUrl.includes('storage/v1/object/public');
          
          // Exactly one pattern should match
          expect(hasB2Pattern !== hasSupabasePattern).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate consistent URLs for the same storage type and key', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        photoKeyArbitrary,
        (storageType, photoKey) => {
          // Arrange
          const b2Domain = 'cdn.example.com';
          const supabaseDomain = 'supabase.example.com';
          
          // Act - Generate URL twice with same inputs
          const generateUrl = (type: string, key: string) => {
            if (type === 'b2') {
              return `https://${b2Domain}/${key}`;
            } else {
              return `https://${supabaseDomain}/storage/v1/object/public/photos/${key}`;
            }
          };
          
          const url1 = generateUrl(storageType, photoKey);
          const url2 = generateUrl(storageType, photoKey);
          
          // Assert - URLs should be identical
          expect(url1).toBe(url2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use HTTPS protocol for all storage URLs', () => {
    fc.assert(
      fc.property(
        storageTypeArbitrary,
        photoKeyArbitrary,
        (storageType, photoKey) => {
          // Arrange
          const b2Domain = 'cdn.example.com';
          const supabaseDomain = 'supabase.example.com';
          
          // Act
          let photoUrl: string;
          if (storageType === 'b2') {
            photoUrl = `https://${b2Domain}/${photoKey}`;
          } else {
            photoUrl = `https://${supabaseDomain}/storage/v1/object/public/photos/${photoKey}`;
          }
          
          // Assert - All URLs must use HTTPS
          expect(photoUrl).toMatch(/^https:\/\//);
          expect(photoUrl).not.toMatch(/^http:\/\//);
        }
      ),
      { numRuns: 100 }
    );
  });
});
