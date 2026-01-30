/**
 * Regression Test Suite: Dynamic Route Resolution
 * 
 * Tests dynamic route resolution to prevent regressions in:
 * - Slug generation
 * - URL formatting
 * 
 * Requirements: 21.7
 */

import { generateSlug } from '@/utils/slugs';

describe('Regression: Dynamic Route Resolution', () => {
  describe('Slug Generation', () => {
    it('should generate valid slug from title', () => {
      const title = 'Our Wedding Story';
      const slug = generateSlug(title);

      expect(slug).toBe('our-wedding-story');
    });

    it('should handle special characters in slug', () => {
      const title = "Costa Rica's Best Beaches!";
      const slug = generateSlug(title);

      expect(slug).toBe('costa-ricas-best-beaches');
    });

    it('should handle multiple spaces', () => {
      const title = 'Travel   Tips   and   Advice';
      const slug = generateSlug(title);

      expect(slug).toBe('travel-tips-and-advice');
    });

    it('should handle unicode characters', () => {
      const title = 'Café & Piña Coladas';
      const slug = generateSlug(title);

      // The function removes special characters but doesn't normalize unicode
      expect(slug).toBe('caf-pia-coladas');
    });


    it('should handle empty string', () => {
      const title = '';
      const slug = generateSlug(title);

      expect(slug).toBe('');
    });

    it('should handle numbers in title', () => {
      const title = 'Top 10 Things to Do';
      const slug = generateSlug(title);

      expect(slug).toBe('top-10-things-to-do');
    });

    it('should handle leading and trailing spaces', () => {
      const title = '  Travel Tips  ';
      const slug = generateSlug(title);

      expect(slug).toBe('travel-tips');
    });

    it('should handle consecutive hyphens', () => {
      const title = 'Costa Rica - - Travel Guide';
      const slug = generateSlug(title);

      expect(slug).toBe('costa-rica-travel-guide');
    });

    it('should handle special punctuation', () => {
      const title = 'What to Pack? A Complete Guide!';
      const slug = generateSlug(title);

      expect(slug).toBe('what-to-pack-a-complete-guide');
    });

    it('should handle mixed case', () => {
      const title = 'CoStA RiCa TrAvEl TiPs';
      const slug = generateSlug(title);

      expect(slug).toBe('costa-rica-travel-tips');
    });

    it('should handle accented characters', () => {
      const title = 'Playa Hermosa & Montañas';
      const slug = generateSlug(title);

      // The function removes special characters but doesn't normalize unicode
      expect(slug).toBe('playa-hermosa-montaas');
    });


    it('should handle parentheses and brackets', () => {
      const title = 'Travel Tips (Updated 2024) [Essential]';
      const slug = generateSlug(title);

      expect(slug).toBe('travel-tips-updated-2024-essential');
    });

    it('should handle quotes', () => {
      const title = '"Best" Travel \'Tips\'';
      const slug = generateSlug(title);

      expect(slug).toBe('best-travel-tips');
    });

    it('should handle ampersands', () => {
      const title = 'Food & Drinks & Entertainment';
      const slug = generateSlug(title);

      expect(slug).toBe('food-drinks-entertainment');
    });

    it('should handle slashes', () => {
      const title = 'Before/After Wedding Events';
      const slug = generateSlug(title);

      // Slashes are removed as special characters
      expect(slug).toBe('beforeafter-wedding-events');
    });

    it('should handle underscores', () => {
      const title = 'Travel_Tips_2024';
      const slug = generateSlug(title);

      expect(slug).toBe('travel-tips-2024');
    });

    it('should handle very long titles', () => {
      const title = 'This is a very long title that contains many words and should be converted to a slug properly without any issues';
      const slug = generateSlug(title);

      expect(slug).toBe('this-is-a-very-long-title-that-contains-many-words-and-should-be-converted-to-a-slug-properly-without-any-issues');
    });

    it('should handle titles with only special characters', () => {
      const title = '!@#$%^&*()';
      const slug = generateSlug(title);

      expect(slug).toBe('');
    });

    it('should handle titles with emojis', () => {
      const title = 'Costa Rica 🌴 Travel Tips 🌊';
      const slug = generateSlug(title);

      expect(slug).toBe('costa-rica-travel-tips');
    });

    it('should handle titles with HTML entities', () => {
      const title = 'Costa Rica &amp; Travel Tips';
      const slug = generateSlug(title);

      expect(slug).toBe('costa-rica-amp-travel-tips');
    });
  });

  describe('URL Formatting', () => {
    it('should create valid URL paths from slugs', () => {
      const slug = generateSlug('Our Wedding Story');
      const url = `/content/${slug}`;

      expect(url).toBe('/content/our-wedding-story');
    });

    it('should handle nested paths', () => {
      const categorySlug = generateSlug('Travel Tips');
      const pageSlug = generateSlug('What to Pack');
      const url = `/${categorySlug}/${pageSlug}`;

      expect(url).toBe('/travel-tips/what-to-pack');
    });

    it('should handle query parameters', () => {
      const slug = generateSlug('Our Story');
      const url = `/content/${slug}?preview=true`;

      expect(url).toBe('/content/our-story?preview=true');
    });
  });
});
