/**
 * Guest View Navigation Tests for Content Pages
 * 
 * Tests the "View as Guest" functionality for content pages.
 * Requirements: 32.1-32.5
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContentPagesPage from './page';
import { useContentPages } from '@/hooks/useContentPages';
import { useToast } from '@/components/ui/ToastContext';

// Mock hooks
jest.mock('@/hooks/useContentPages');
jest.mock('@/components/ui/ToastContext');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/admin/content-pages',
}));

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

const mockUseContentPages = useContentPages as jest.MockedFunction<typeof useContentPages>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('ContentPagesPage - Guest View Navigation', () => {
  const mockShowToast = jest.fn();
  const mockRefetch = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockRemove = jest.fn();

  const mockPages = [
    {
      id: 'page-1',
      title: 'Our Story',
      slug: 'our-story',
      status: 'published' as const,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'page-2',
      title: 'Travel Info',
      slug: 'travel-info',
      status: 'draft' as const,
      createdAt: '2025-01-02T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
      toasts: [],
      removeToast: jest.fn(),
    });

    mockUseContentPages.mockReturnValue({
      data: mockPages,
      loading: false,
      error: null,
      refetch: mockRefetch,
      create: mockCreate,
      update: mockUpdate,
      remove: mockRemove,
    });
  });

  describe('View Button', () => {
    it('should render View button for each content page', () => {
      render(<ContentPagesPage />);

      // Get all View buttons - DataTable renders them in both header and body
      const viewButtons = screen.getAllByRole('button', { name: /view.*as guest/i });
      // Should have 2 buttons per page (header + body)
      expect(viewButtons.length).toBeGreaterThanOrEqual(mockPages.length);
    });

    it('should navigate to guest-facing page when View button is clicked', () => {
      render(<ContentPagesPage />);

      const viewButtons = screen.getAllByRole('button', { name: /view our story as guest/i });
      fireEvent.click(viewButtons[0]);

      expect(window.location.href).toBe('/our-story');
    });

    it('should generate correct URL for each page slug', () => {
      render(<ContentPagesPage />);

      // Test first page
      const viewButton1 = screen.getAllByRole('button', { name: /view our story as guest/i })[0];
      fireEvent.click(viewButton1);
      expect(window.location.href).toBe('/our-story');

      // Reset location
      window.location.href = '';

      // Test second page
      const viewButton2 = screen.getAllByRole('button', { name: /view travel info as guest/i })[0];
      fireEvent.click(viewButton2);
      expect(window.location.href).toBe('/travel-info');
    });

    it('should have accessible aria-label for View button', () => {
      render(<ContentPagesPage />);

      const viewButton = screen.getAllByRole('button', { name: /view our story as guest/i })[0];
      expect(viewButton).toHaveAttribute('aria-label', 'View Our Story as guest');
    });
  });

  describe('Link Generation', () => {
    it('should generate URL with leading slash', () => {
      render(<ContentPagesPage />);

      const viewButton = screen.getAllByRole('button', { name: /view our story as guest/i })[0];
      fireEvent.click(viewButton);

      expect(window.location.href).toMatch(/^\//);
    });

    it('should use slug directly without additional path segments', () => {
      render(<ContentPagesPage />);

      const viewButton = screen.getAllByRole('button', { name: /view our story as guest/i })[0];
      fireEvent.click(viewButton);

      expect(window.location.href).toBe('/our-story');
      expect(window.location.href).not.toContain('/content-pages/');
      expect(window.location.href).not.toContain('/guest/');
    });

    it('should handle slugs with hyphens correctly', () => {
      render(<ContentPagesPage />);

      const viewButton = screen.getAllByRole('button', { name: /view travel info as guest/i })[0];
      fireEvent.click(viewButton);

      expect(window.location.href).toBe('/travel-info');
    });
  });
});
