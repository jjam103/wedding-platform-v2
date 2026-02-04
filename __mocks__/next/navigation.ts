// Manual mock for next/navigation
// This provides a default mock that can be overridden in individual tests

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}));

export const usePathname = jest.fn(() => '/');

export const useSearchParams = jest.fn(() => ({
  get: jest.fn(),
  getAll: jest.fn(),
  has: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  entries: jest.fn(),
  forEach: jest.fn(),
  toString: jest.fn(),
}));

export const useParams = jest.fn(() => ({}));

export const notFound = jest.fn();

export const redirect = jest.fn();
