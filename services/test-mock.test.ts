import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Supabase before importing services
const mockFrom = jest.fn();
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Import after mocking
import { listSections } from './sectionsService';

describe('Test mocking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work with mocked supabase', async () => {
    // Mock sections query
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });

    // Mock columns query
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    });

    const result = await listSections('activity', 'test-id');
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});
