/**
 * Slug generation and management utilities
 * 
 * Provides functions for generating URL-safe slugs from titles,
 * ensuring uniqueness, and validating slug format.
 */

/**
 * Generates a URL-safe slug from a title
 * 
 * Converts title to lowercase, replaces spaces with hyphens,
 * removes special characters, and normalizes multiple hyphens.
 * 
 * @param title - Page title or entity name
 * @returns URL-safe slug
 * 
 * @example
 * generateSlug('Our Story & Photos') // 'our-story-photos'
 * generateSlug('  Hello   World  ') // 'hello-world'
 * generateSlug('Café & Restaurant') // 'cafe-restaurant'
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters (keeps alphanumeric, underscore, space, hyphen)
    .replace(/_/g, '-') // Replace underscores with hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates that a slug is URL-safe and contains at least one alphanumeric character
 * 
 * @param slug - Slug to validate
 * @returns True if slug is valid, false otherwise
 * 
 * @example
 * isValidSlug('hello-world') // true
 * isValidSlug('---') // false
 * isValidSlug('') // false
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.trim() === '') {
    return false;
  }
  
  // Must contain at least one alphanumeric character
  if (!/[a-z0-9]/.test(slug)) {
    return false;
  }
  
  // Must only contain lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }
  
  return true;
}

/**
 * Generates a unique slug by appending a number if the base slug already exists
 * 
 * @param baseSlug - Base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug (e.g., 'slug-2', 'slug-3')
 * 
 * @example
 * makeUniqueSlug('hello', ['hello', 'hello-2']) // 'hello-3'
 * makeUniqueSlug('world', ['hello']) // 'world'
 */
export function makeUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let uniqueSlug = baseSlug;
  let counter = 2;
  
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
}

/**
 * Generates a URL path preview for a slug
 * 
 * @param slug - Slug to preview
 * @param entityType - Type of entity (e.g., 'events', 'activities', 'pages')
 * @returns Full URL path
 * 
 * @example
 * getSlugPreview('ceremony', 'events') // '/events/ceremony'
 * getSlugPreview('our-story', 'pages') // '/pages/our-story'
 */
export function getSlugPreview(slug: string, entityType: string): string {
  return `/${entityType}/${slug}`;
}

/**
 * Normalizes a user-provided slug to ensure it's URL-safe
 * 
 * Similar to generateSlug but preserves intentional structure
 * from user input (e.g., doesn't remove all special chars)
 * 
 * @param slug - User-provided slug
 * @returns Normalized slug
 * 
 * @example
 * normalizeSlug('Hello World') // 'hello-world'
 * normalizeSlug('my_custom_slug') // 'my-custom-slug'
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
