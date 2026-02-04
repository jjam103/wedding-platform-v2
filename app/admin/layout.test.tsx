/**
 * Admin Layout Tests
 * 
 * Tests for the admin layout with TopNavigation component
 * 
 * Requirements: 1.1, 1.10
 */

import { render, screen } from '@testing-library/react';
import AdminRootLayout from './layout';

// Mock components
jest.mock('@/components/admin/TopNavigation', () => ({
  TopNavigation: () => <div data-testid="top-navigation">TopNavigation</div>,
}));

jest.mock('@/components/admin/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar">TopBar</div>,
}));

jest.mock('@/components/ui/ErrorBoundary', () => ({
  PageErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/admin/KeyboardNavigationProvider', () => ({
  KeyboardNavigationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/SkipNavigation', () => ({
  SkipNavigation: () => <div data-testid="skip-navigation">SkipNavigation</div>,
}));

describe('AdminRootLayout', () => {
  it('should render TopNavigation component', () => {
    render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
  });

  it('should render TopBar component', () => {
    render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    expect(screen.getByTestId('top-bar')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render skip navigation for accessibility', () => {
    render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    expect(screen.getByTestId('skip-navigation')).toBeInTheDocument();
  });

  it('should have main content area with proper ARIA attributes', () => {
    render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabIndex', '-1');
  });

  it('should apply proper layout structure', () => {
    const { container } = render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    // Check for min-h-screen and bg-cloud-100 classes
    const layoutDiv = container.querySelector('.min-h-screen.bg-cloud-100');
    expect(layoutDiv).toBeInTheDocument();
  });

  it('should wrap content in max-width container', () => {
    const { container } = render(
      <AdminRootLayout>
        <div>Test Content</div>
      </AdminRootLayout>
    );

    // Check for max-w-7xl and mx-auto classes
    const contentContainer = container.querySelector('.max-w-7xl.mx-auto');
    expect(contentContainer).toBeInTheDocument();
  });
});
