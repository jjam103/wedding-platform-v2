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
    
    append(name, value) {
      this._headers[name.toLowerCase()] = value;
    }
    
    delete(name) {
      delete this._headers[name.toLowerCase()];
    }
    
    entries() {
      return Object.entries(this._headers);
    }
    
    keys() {
      return Object.keys(this._headers);
    }
    
    values() {
      return Object.values(this._headers);
    }
  };
}

// Polyfill Response for Node.js test environment (needed for Next.js API routes)
if (typeof global.Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
    
    async text() {
      if (typeof this.body === 'string') {
        return this.body;
      }
      return JSON.stringify(this.body);
    }
    
    async arrayBuffer() {
      const text = await this.text();
      return new TextEncoder().encode(text).buffer;
    }
    
    async blob() {
      return new Blob([await this.text()]);
    }
    
    clone() {
      return new MockResponse(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }
    
    // Static method for creating JSON responses (used by Next.js)
    static json(data, init = {}) {
      return new MockResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });
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
