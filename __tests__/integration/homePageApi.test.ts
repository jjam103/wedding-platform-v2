import { GET, PUT } from '@/app/api/admin/home-page/route';
import * as settingsService from '@/services/settingsService';

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
  })),
}));

// Mock settings service
jest.mock('@/services/settingsService');

// Mock sanitization
jest.mock('@/utils/sanitization', () => ({
  sanitizeRichText: jest.fn((text) => text),
}));

describe('GET /api/admin/home-page', () => {
  let mockGetSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createServerClient } = require('@supabase/ssr');
    mockGetSession = jest.fn();
    createServerClient.mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return home page configuration when authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    (settingsService.getSetting as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: 'Welcome to Our Wedding' })
      .mockResolvedValueOnce({ success: true, data: 'Join us in Costa Rica' })
      .mockResolvedValueOnce({ success: true, data: '<p>We are excited!</p>' })
      .mockResolvedValueOnce({ success: true, data: 'https://example.com/hero.jpg' });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('Welcome to Our Wedding');
    expect(data.data.subtitle).toBe('Join us in Costa Rica');
    expect(data.data.welcomeMessage).toBe('<p>We are excited!</p>');
    expect(data.data.heroImageUrl).toBe('https://example.com/hero.jpg');
  });

  it('should handle missing settings gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    (settingsService.getSetting as jest.Mock)
      .mockResolvedValueOnce({ success: false, error: { code: 'NOT_FOUND', message: 'Setting not found' } })
      .mockResolvedValueOnce({ success: false, error: { code: 'NOT_FOUND', message: 'Setting not found' } })
      .mockResolvedValueOnce({ success: false, error: { code: 'NOT_FOUND', message: 'Setting not found' } })
      .mockResolvedValueOnce({ success: false, error: { code: 'NOT_FOUND', message: 'Setting not found' } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBeNull();
    expect(data.data.subtitle).toBeNull();
    expect(data.data.welcomeMessage).toBeNull();
    expect(data.data.heroImageUrl).toBeNull();
  });
});

describe('PUT /api/admin/home-page', () => {
  let mockGetSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { createServerClient } = require('@supabase/ssr');
    mockGetSession = jest.fn();
    createServerClient.mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    });
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should successfully update home page configuration', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const config = {
      title: 'Welcome to Our Wedding',
      subtitle: 'Join us in Costa Rica',
      welcomeMessage: '<p>We are excited to celebrate with you!</p>',
      heroImageUrl: 'https://example.com/hero.jpg',
    };

    (settingsService.upsertHomePageConfig as jest.Mock).mockResolvedValue({
      success: true,
      data: config,
    });

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe(config.title);
    expect(data.data.subtitle).toBe(config.subtitle);
    expect(settingsService.upsertHomePageConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        title: config.title,
        subtitle: config.subtitle,
      })
    );
  });

  it('should return 400 for invalid configuration', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const invalidConfig = {
      title: '', // Empty string should fail validation
      heroImageUrl: 'not-a-valid-url',
    };

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidConfig),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 500 when service fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    (settingsService.upsertHomePageConfig as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to update settings',
      },
    });

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DATABASE_ERROR');
  });

  it('should sanitize rich text content', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const { sanitizeRichText } = require('@/utils/sanitization');
    sanitizeRichText.mockReturnValue('<p>Sanitized content</p>');

    (settingsService.upsertHomePageConfig as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        welcomeMessage: '<p>Sanitized content</p>',
      },
    });

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        welcomeMessage: '<p>Original content</p>',
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(sanitizeRichText).toHaveBeenCalledWith('<p>Original content</p>');
    expect(settingsService.upsertHomePageConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        welcomeMessage: '<p>Sanitized content</p>',
      })
    );
  });

  it('should handle partial updates', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    const partialConfig = {
      title: 'New Title Only',
    };

    (settingsService.upsertHomePageConfig as jest.Mock).mockResolvedValue({
      success: true,
      data: partialConfig,
    });

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialConfig),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('New Title Only');
  });

  it('should handle unexpected errors gracefully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    });

    (settingsService.upsertHomePageConfig as jest.Mock).mockRejectedValue(
      new Error('Unexpected error')
    );

    const request = new Request('http://localhost:3000/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INTERNAL_ERROR');
    expect(data.error.message).toBe('An unexpected error occurred');
  });
});
