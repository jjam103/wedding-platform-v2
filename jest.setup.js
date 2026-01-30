import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Polyfill fetch for Node.js test environment
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
    })
  );
}

// Polyfill Request for Node.js test environment
if (typeof global.Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Headers(options.headers);
      this.body = options.body;
    }
    
    async json() {
      return JSON.parse(this.body || '{}');
    }
    
    async text() {
      return this.body || '';
    }
  };
}

// Polyfill Headers for Node.js test environment
if (typeof global.Headers === 'undefined') {
  global.Headers = class MockHeaders {
    constructor(init = {}) {
      this._headers = {};
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
    
    get(name) {
      return this._headers[name.toLowerCase()];
    }
    
    set(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    has(name) {
      return name.toLowerCase() in this._headers;
    }
  };
}

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Mock Next.js environment extensions that cause stack overflow in property tests
jest.mock('next/dist/server/node-environment-extensions/unhandled-rejection', () => ({}), { virtual: true });
jest.mock('next/dist/server/node-environment-extensions/fast-set-immediate.external', () => ({}), { virtual: true });

// Mock browser APIs not implemented in jsdom
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});

// Set up mock environment variables for tests if not already set
// This allows unit tests to run without real Supabase credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-for-testing';
}
