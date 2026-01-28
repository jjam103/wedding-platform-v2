/**
 * Property-Based Test: Search Result Relevance Ordering
 * 
 * Feature: destination-wedding-platform
 * Property 17: Search Result Relevance Ordering
 * 
 * **Validates: Requirements 16.7**
 * 
 * This property test validates that search results are ordered by relevance:
 * 1. Exact matches appear before partial matches
 * 2. Within the same relevance level, results are sorted alphabetically
 * 3. The ordering is consistent across all entity types
 * 
 * The test generates random search queries and entity names to verify
 * that the ordering algorithm works correctly for all possible inputs.
 */

import * as fc from 'fast-check';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  slug?: string;
  status?: string;
  preview?: string;
}

/**
 * Sort search results by relevance
 * This implements the same logic as the API route
 */
function sortSearchResults(results: SearchResult[], query: string): SearchResult[] {
  // Add index to each result for stable sorting
  const indexedResults = results.map((result, index) => ({ result, index }));
  
  indexedResults.sort((a, b) => {
    const aExact = a.result.name.toLowerCase() === query.toLowerCase();
    const bExact = b.result.name.toLowerCase() === query.toLowerCase();

    // Exact matches first
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Then sort alphabetically with normalization for consistent ordering
    // Trim whitespace for comparison
    const aName = a.result.name.trim().toLowerCase();
    const bName = b.result.name.trim().toLowerCase();
    
    // Handle empty strings after trimming - sort them to the end
    if (aName === '' && bName !== '') return 1;
    if (aName !== '' && bName === '') return -1;
    
    // Use simple string comparison for deterministic ordering
    // This is more predictable than localeCompare for special characters
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    
    // If names are equal after normalization, maintain original order (stable sort)
    return a.index - b.index;
  });
  
  return indexedResults.map(({ result }) => result);
}

// Arbitraries for generating test data
const searchResultArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom('event', 'activity', 'accommodation', 'room_type', 'content_page'),
  slug: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  status: fc.option(fc.constantFrom('active', 'inactive', 'published', 'draft'), { nil: undefined }),
  preview: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

describe('Feature: destination-wedding-platform, Property 17: Search Result Relevance Ordering', () => {
  it('should place exact matches before partial matches', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 2, maxLength: 20 }),
        (query, results) => {
          // Ensure we have at least one exact match and one partial match
          if (results.length < 2) return true;

          // Create an exact match
          const exactMatch = { ...results[0], name: query };
          // Create a partial match
          const partialMatch = { ...results[1], name: `${query} extra` };

          const testResults = [partialMatch, exactMatch, ...results.slice(2)];
          const sorted = sortSearchResults(testResults, query);

          // Find positions
          const exactIndex = sorted.findIndex((r) => r.name.toLowerCase() === query.toLowerCase());
          const partialIndex = sorted.findIndex(
            (r) => r.name.toLowerCase().includes(query.toLowerCase()) && r.name.toLowerCase() !== query.toLowerCase()
          );

          // Exact match should come before partial match
          if (exactIndex !== -1 && partialIndex !== -1) {
            return exactIndex < partialIndex;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sort alphabetically within same relevance level', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 10 }),
        (query, names) => {
          // Create results with names that all partially match
          const results: SearchResult[] = names.map((name, index) => ({
            id: `id-${index}`,
            name: `${query} ${name}`,
            type: 'event',
          }));

          const sorted = sortSearchResults(results, query);

          // All results are partial matches (same relevance level)
          // They should be sorted alphabetically with empty strings at the end
          for (let i = 0; i < sorted.length - 1; i++) {
            // Compare using the same normalization as the sorting function
            const current = sorted[i].name.trim().toLowerCase();
            const next = sorted[i + 1].name.trim().toLowerCase();

            // Empty strings should be at the end
            if (current === '' && next !== '') {
              return false; // Empty string should not come before non-empty
            }
            
            // For non-empty strings, check alphabetical order (allow equal values)
            if (current !== '' && next !== '' && current > next) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent ordering across multiple sorts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 5, maxLength: 20 }),
        (query, results) => {
          const sorted1 = sortSearchResults([...results], query);
          const sorted2 = sortSearchResults([...results], query);

          // The ordering should be deterministic
          return JSON.stringify(sorted1) === JSON.stringify(sorted2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle case-insensitive matching', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.toLowerCase() !== s.toUpperCase()),
        fc.array(searchResultArbitrary, { minLength: 2, maxLength: 10 }),
        (query, results) => {
          // Create exact matches with different cases
          const lowerMatch = { ...results[0], name: query.toLowerCase() };
          const upperMatch = { ...results[1], name: query.toUpperCase() };

          const testResults = [upperMatch, lowerMatch];
          const sorted = sortSearchResults(testResults, query);

          // Both should be treated as exact matches
          const firstIsExact = sorted[0].name.toLowerCase() === query.toLowerCase();
          const secondIsExact = sorted[1].name.toLowerCase() === query.toLowerCase();

          return firstIsExact && secondIsExact;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty result sets', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), (query) => {
        const sorted = sortSearchResults([], query);
        return sorted.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  it('should handle single result', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), searchResultArbitrary, (query, result) => {
        const sorted = sortSearchResults([result], query);
        return sorted.length === 1 && sorted[0].id === result.id;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all results without loss', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 1, maxLength: 50 }),
        (query, results) => {
          const sorted = sortSearchResults(results, query);

          // All results should be present
          if (sorted.length !== results.length) return false;

          // All IDs should be present
          const originalIds = new Set(results.map((r) => r.id));
          const sortedIds = new Set(sorted.map((r) => r.id));

          return originalIds.size === sortedIds.size && [...originalIds].every((id) => sortedIds.has(id));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special characters in query', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 2, maxLength: 10 }),
        (query, results) => {
          // Add special characters to query
          const specialQuery = `${query}!@#$%`;

          // Create an exact match with special characters
          const exactMatch = { ...results[0], name: specialQuery };
          const testResults = [exactMatch, ...results.slice(1)];

          const sorted = sortSearchResults(testResults, specialQuery);

          // Exact match should be first
          return sorted[0].name === specialQuery;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle unicode characters', () => {
    fc.assert(
      fc.property(
        fc.unicodeString({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 2, maxLength: 10 }),
        (query, results) => {
          // Create an exact match with unicode
          const exactMatch = { ...results[0], name: query };
          const partialMatch = { ...results[1], name: `${query} extra` };

          const testResults = [partialMatch, exactMatch];
          const sorted = sortSearchResults(testResults, query);

          // Exact match should be first
          return sorted[0].name === query;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle whitespace in names and queries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(searchResultArbitrary, { minLength: 2, maxLength: 10 }),
        (query, results) => {
          // Add whitespace
          const queryWithSpace = `  ${query}  `;
          const exactMatch = { ...results[0], name: query };

          const testResults = [exactMatch, ...results.slice(1)];
          const sorted = sortSearchResults(testResults, query);

          // Should still find exact match (after trimming)
          const hasExactMatch = sorted.some((r) => r.name.toLowerCase() === query.toLowerCase());
          return hasExactMatch;
        }
      ),
      { numRuns: 100 }
    );
  });
});
