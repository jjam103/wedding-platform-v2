/**
 * Test Helper: Mock Supabase Client
 * 
 * Provides properly configured Supabase mock with chainable methods
 * for use in unit and integration tests.
 */

export interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  or: jest.Mock;
  range: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  auth: {
    getSession: jest.Mock;
    signInWithPassword: jest.Mock;
    signOut: jest.Mock;
  };
  storage: {
    from: jest.Mock;
    upload: jest.Mock;
    getPublicUrl: jest.Mock;
    remove: jest.Mock;
  };
}

/**
 * Creates a mock Supabase client with properly chained methods.
 * All query builder methods return `this` to allow chaining.
 * 
 * @returns Mock Supabase client
 * 
 * @example
 * const mockSupabase = createMockSupabaseClient();
 * mockSupabase.from.mockReturnValue(mockSupabase);
 * mockSupabase.select.mockReturnValue(mockSupabase);
 * mockSupabase.eq.mockResolvedValue({ data: [...], error: null });
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const mock: any = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
    },
  };

  // Make all query builder methods chainable by default
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.in.mockReturnValue(mock);
  mock.neq.mockReturnValue(mock);
  mock.gt.mockReturnValue(mock);
  mock.gte.mockReturnValue(mock);
  mock.lt.mockReturnValue(mock);
  mock.lte.mockReturnValue(mock);
  mock.like.mockReturnValue(mock);
  mock.ilike.mockReturnValue(mock);
  mock.or.mockReturnValue(mock);
  mock.range.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  mock.limit.mockReturnValue(mock);
  
  // Storage methods are also chainable
  mock.storage.from.mockReturnValue(mock.storage);

  return mock;
}

/**
 * Configures a mock Supabase client to return specific data for a query.
 * 
 * @param mock - Mock Supabase client
 * @param data - Data to return
 * @param error - Optional error to return
 * 
 * @example
 * const mockSupabase = createMockSupabaseClient();
 * configureMockQuery(mockSupabase, [{ id: '1', name: 'Test' }]);
 * 
 * // Now queries will return the configured data
 * const result = await mockSupabase.from('table').select('*').eq('id', '1');
 * // result = { data: [{ id: '1', name: 'Test' }], error: null }
 */
export function configureMockQuery(
  mock: MockSupabaseClient,
  data: any,
  error: any = null
): void {
  // Configure the final method in the chain to return data
  mock.single.mockResolvedValue({ data, error });
  mock.maybeSingle.mockResolvedValue({ data, error });
  
  // For queries without single/maybeSingle, configure the last chainable method
  mock.eq.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : null });
  mock.in.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : null });
  mock.range.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : null });
  mock.order.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : null });
  mock.limit.mockResolvedValue({ data, error, count: Array.isArray(data) ? data.length : null });
}

/**
 * Resets all mocks on a Supabase client and reconfigures chaining.
 * 
 * @param mock - Mock Supabase client to reset
 */
export function resetMockSupabaseClient(mock: MockSupabaseClient): void {
  jest.clearAllMocks();
  
  // Reconfigure chaining
  mock.from.mockReturnValue(mock);
  mock.select.mockReturnValue(mock);
  mock.insert.mockReturnValue(mock);
  mock.update.mockReturnValue(mock);
  mock.delete.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.in.mockReturnValue(mock);
  mock.neq.mockReturnValue(mock);
  mock.gt.mockReturnValue(mock);
  mock.gte.mockReturnValue(mock);
  mock.lt.mockReturnValue(mock);
  mock.lte.mockReturnValue(mock);
  mock.like.mockReturnValue(mock);
  mock.ilike.mockReturnValue(mock);
  mock.or.mockReturnValue(mock);
  mock.range.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  mock.limit.mockReturnValue(mock);
  mock.storage.from.mockReturnValue(mock.storage);
}
