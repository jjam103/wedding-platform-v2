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

/**
 * Builder for common Supabase query patterns.
 * Reduces boilerplate in property-based tests.
 */
export class SupabaseMockBuilder {
  private mock: MockSupabaseClient;

  constructor(mock: MockSupabaseClient) {
    this.mock = mock;
  }

  /**
   * Mock a successful SELECT query returning multiple rows.
   * 
   * @example
   * builder.mockSelect('guests', [{ id: '1', name: 'John' }]);
   * // Mocks: from('guests').select('*') -> { data: [...], error: null }
   */
  mockSelect(table: string, data: any[], error: any = null): this {
    this.mock.from.mockReturnValue(this.mock);
    this.mock.select.mockReturnValue(this.mock);
    this.mock.eq.mockResolvedValue({ data, error, count: data.length });
    return this;
  }

  /**
   * Mock a successful SELECT query returning a single row.
   * 
   * @example
   * builder.mockSelectSingle('guests', { id: '1', name: 'John' });
   * // Mocks: from('guests').select('*').eq('id', '1').single() -> { data: {...}, error: null }
   */
  mockSelectSingle(table: string, data: any, error: any = null): this {
    this.mock.from.mockReturnValue(this.mock);
    this.mock.select.mockReturnValue(this.mock);
    this.mock.eq.mockReturnValue(this.mock);
    this.mock.single.mockResolvedValue({ data, error });
    return this;
  }

  /**
   * Mock a successful INSERT query.
   * 
   * @example
   * builder.mockInsert('guests', { id: '1', name: 'John' });
   * // Mocks: from('guests').insert({...}).select().single() -> { data: {...}, error: null }
   */
  mockInsert(table: string, data: any, error: any = null): this {
    this.mock.from.mockReturnValue(this.mock);
    this.mock.insert.mockReturnValue(this.mock);
    this.mock.select.mockReturnValue(this.mock);
    this.mock.single.mockResolvedValue({ data, error });
    return this;
  }

  /**
   * Mock a successful UPDATE query.
   * 
   * @example
   * builder.mockUpdate('guests', { id: '1', name: 'Jane' });
   * // Mocks: from('guests').update({...}).eq('id', '1').select().single() -> { data: {...}, error: null }
   */
  mockUpdate(table: string, data: any, error: any = null): this {
    this.mock.from.mockReturnValue(this.mock);
    this.mock.update.mockReturnValue(this.mock);
    this.mock.eq.mockReturnValue(this.mock);
    this.mock.select.mockReturnValue(this.mock);
    this.mock.single.mockResolvedValue({ data, error });
    return this;
  }

  /**
   * Mock a successful DELETE query.
   * 
   * @example
   * builder.mockDelete('guests');
   * // Mocks: from('guests').delete().eq('id', '1') -> { data: null, error: null }
   */
  mockDelete(table: string, error: any = null): this {
    this.mock.from.mockReturnValue(this.mock);
    this.mock.delete.mockReturnValue(this.mock);
    this.mock.eq.mockResolvedValue({ data: null, error });
    return this;
  }

  /**
   * Mock a database error for any query.
   * 
   * @example
   * builder.mockDatabaseError('Connection failed');
   * // All queries will return { data: null, error: { message: 'Connection failed' } }
   */
  mockDatabaseError(message: string): this {
    const error = { message, code: 'DATABASE_ERROR' };
    this.mock.single.mockResolvedValue({ data: null, error });
    this.mock.eq.mockResolvedValue({ data: null, error });
    this.mock.insert.mockReturnValue(this.mock);
    this.mock.update.mockReturnValue(this.mock);
    this.mock.delete.mockReturnValue(this.mock);
    this.mock.select.mockReturnValue(this.mock);
    return this;
  }

  /**
   * Mock authentication session.
   * 
   * @example
   * builder.mockAuthSession({ user: { id: 'user-1', email: 'test@example.com' } });
   */
  mockAuthSession(session: any, error: any = null): this {
    this.mock.auth.getSession.mockResolvedValue({ data: { session }, error });
    return this;
  }

  /**
   * Mock storage upload.
   * 
   * @example
   * builder.mockStorageUpload('photos', 'photo.jpg', 'https://cdn.example.com/photo.jpg');
   */
  mockStorageUpload(bucket: string, path: string, publicUrl: string, error: any = null): this {
    this.mock.storage.from.mockReturnValue(this.mock.storage);
    this.mock.storage.upload.mockResolvedValue({ data: { path }, error });
    this.mock.storage.getPublicUrl.mockReturnValue({ data: { publicUrl } });
    return this;
  }

  /**
   * Reset all mocks and reconfigure chaining.
   */
  reset(): this {
    resetMockSupabaseClient(this.mock);
    return this;
  }
}

/**
 * Creates a builder for configuring Supabase mocks with less boilerplate.
 * 
 * @param mock - Mock Supabase client
 * @returns Builder instance
 * 
 * @example
 * const mockSupabase = createMockSupabaseClient();
 * const builder = createMockBuilder(mockSupabase);
 * 
 * // Clean, readable mock setup
 * builder
 *   .mockSelectSingle('guests', { id: '1', name: 'John' })
 *   .mockInsert('rsvps', { id: '1', guestId: '1', status: 'attending' });
 */
export function createMockBuilder(mock: MockSupabaseClient): SupabaseMockBuilder {
  return new SupabaseMockBuilder(mock);
}
