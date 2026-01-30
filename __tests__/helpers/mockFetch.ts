/**
 * Helper utilities for mocking fetch in tests
 * 
 * This module provides standardized mock implementations for the global fetch API
 * to ensure consistent behavior across all tests.
 */

/**
 * Creates a mock Response object with all required properties
 * 
 * @param data - The data to return from response.json()
 * @param options - Optional response configuration
 * @returns A mock Response object
 */
export function createMockResponse<T = any>(
  data: T,
  options: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    headers = {},
  } = options;

  const headersObj = new Headers(headers);

  return {
    ok,
    status,
    statusText,
    headers: headersObj,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)], { type: 'application/json' })),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(data)).buffer),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createMockResponse(data, options),
  } as Response;
}

/**
 * Creates a mock fetch implementation that returns a success response
 * 
 * @param data - The data to return from the API
 * @returns A mock fetch function
 */
export function mockFetchSuccess<T = any>(data: T) {
  return jest.fn().mockImplementation(() => 
    Promise.resolve(createMockResponse(data))
  );
}

/**
 * Creates a mock fetch implementation that returns an error response
 * 
 * @param error - The error to return
 * @param status - HTTP status code (default: 500)
 * @returns A mock fetch function
 */
export function mockFetchError(error: { code: string; message: string }, status = 500) {
  return jest.fn().mockImplementation(() =>
    Promise.resolve(
      createMockResponse(
        { success: false, error },
        { ok: false, status, statusText: 'Error' }
      )
    )
  );
}

/**
 * Creates a mock fetch implementation that rejects with a network error
 * 
 * @param message - Error message
 * @returns A mock fetch function
 */
export function mockFetchNetworkError(message = 'Network error') {
  return jest.fn().mockImplementation(() =>
    Promise.reject(new Error(message))
  );
}

/**
 * Sets up global.fetch with a mock implementation
 * Call this in beforeEach() to ensure fetch is mocked for all tests
 */
export function setupFetchMock() {
  if (!global.fetch) {
    global.fetch = jest.fn();
  }
}

/**
 * Resets the global.fetch mock
 * Call this in afterEach() to clean up between tests
 */
export function resetFetchMock() {
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockReset();
  }
}

/**
 * Clears all calls to the global.fetch mock
 * Useful when you want to verify fetch calls in a specific test
 */
export function clearFetchMock() {
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  }
}
