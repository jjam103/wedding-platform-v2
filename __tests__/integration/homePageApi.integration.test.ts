// Polyfill Web APIs for Next.js server components
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill Request for tests
if (typeof Request === 'undefined') {
  global.Request = class Request {
    method: string;
    url: string;
    headers: Map<string, string>;
    body: string | null;

    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      if (init?.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string);
        });
      }
      this.body = init?.body || null;
    }

    async json() {
      return JSON.parse(this.body || '{}');
    }
  } as any;
}

// Mock Next.js server module
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

import { GET as getHomePage, PUT as updateHomePage } from '@/app/api/admin/home-page/route';
import { GET as getHomePageSections } from '@/app/api/admin/home-page/sections/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock services
jest.mock('@/services/settingsService', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

jest.mock('@/services/sectionsService', () => ({
  listSections: jest.fn(),
}));

jest.mock('@/utils/sanitization', () => ({
  sanitizeRichText: jest.fn((html) => html),
}));

import { getSettings, updateSettings } from '@/services/settingsService';
import { listSections } from '@/services/sectionsService';

describe('Home Page API Integration Tests', () => {
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('GET /api/admin/home-page', () => {
    it('should return home page config when authenticated', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock settings service
      (getSettings as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          home_page_title: 'Test Wedding',
          home_page_subtitle: 'June 2025',
          home_page_welcome_message: '<p>Welcome!</p>',
          home_page_hero_image_url: 'https://example.com/hero.jpg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });

      const response = await getHomePage();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        title: 'Test Wedding',
        subtitle: 'June 2025',
        welcomeMessage: '<p>Welcome!</p>',
        heroImageUrl: 'https://example.com/hero.jpg',
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await getHomePage();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 when settings service fails', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock settings service error
      (getSettings as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch settings',
        },
      });

      const response = await getHomePage();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /api/admin/home-page', () => {
    it('should update home page config when authenticated with valid data', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock settings service
      (updateSettings as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          home_page_title: 'Updated Wedding',
          home_page_subtitle: 'July 2025',
          home_page_welcome_message: '<p>Updated welcome!</p>',
          home_page_hero_image_url: 'https://example.com/new-hero.jpg',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Wedding',
          subtitle: 'July 2025',
          welcomeMessage: '<p>Updated welcome!</p>',
          heroImageUrl: 'https://example.com/new-hero.jpg',
        }),
      });

      const response = await updateHomePage(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        title: 'Updated Wedding',
        subtitle: 'July 2025',
        welcomeMessage: '<p>Updated welcome!</p>',
        heroImageUrl: 'https://example.com/new-hero.jpg',
      });

      expect(updateSettings).toHaveBeenCalledWith({
        home_page_title: 'Updated Wedding',
        home_page_subtitle: 'July 2025',
        home_page_welcome_message: '<p>Updated welcome!</p>',
        home_page_hero_image_url: 'https://example.com/new-hero.jpg',
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const request = new Request('http://localhost:3000/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Wedding',
        }),
      });

      const response = await updateHomePage(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when validation fails', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock validation error
      (updateSettings as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ path: ['home_page_hero_image_url'], message: 'Invalid URL' }],
        },
      });

      const request = new Request('http://localhost:3000/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Wedding',
          heroImageUrl: 'invalid-url',
        }),
      });

      const response = await updateHomePage(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 when settings service fails', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock database error
      (updateSettings as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update settings',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Wedding',
        }),
      });

      const response = await updateHomePage(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });

    it('should sanitize rich text content', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock settings service
      (updateSettings as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'settings-1',
          home_page_title: 'Test Wedding',
          home_page_subtitle: 'June 2025',
          home_page_welcome_message: '<p>Sanitized content</p>',
          home_page_hero_image_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      });

      const request = new Request('http://localhost:3000/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Wedding',
          subtitle: 'June 2025',
          welcomeMessage: '<script>alert("xss")</script><p>Content</p>',
          heroImageUrl: null,
        }),
      });

      const response = await updateHomePage(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/admin/home-page/sections', () => {
    it('should return home page sections when authenticated', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock sections service
      (listSections as jest.Mock).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'section-1',
            pageType: 'home',
            pageId: 'home',
            displayOrder: 1,
            layout: 'two-column',
            columns: [],
          },
          {
            id: 'section-2',
            pageType: 'home',
            pageId: 'home',
            displayOrder: 2,
            layout: 'one-column',
            columns: [],
          },
        ],
      });

      const response = await getHomePageSections();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].pageType).toBe('home');
      expect(data.data[0].pageId).toBe('home');

      expect(listSections).toHaveBeenCalledWith('home', 'home');
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const response = await getHomePageSections();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 when sections service fails', async () => {
      // Mock authenticated session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      // Mock sections service error
      (listSections as jest.Mock).mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch sections',
        },
      });

      const response = await getHomePageSections();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DATABASE_ERROR');
    });
  });
});
