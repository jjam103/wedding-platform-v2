import type { ReactNode } from 'react';
import { TopNavigation } from '@/components/admin/TopNavigation';
import { TopBar } from '@/components/admin/TopBar';
import { PageErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastProvider } from '@/components/ui/ToastContext';
import { KeyboardNavigationProvider } from '@/components/admin/KeyboardNavigationProvider';
import { SkipNavigation } from '@/components/ui/SkipNavigation';

interface AdminRootLayoutProps {
  children: ReactNode;
}

/**
 * Admin Root Layout
 * 
 * Wraps all admin pages with:
 * - KeyboardNavigationProvider for keyboard shortcuts
 * - SkipNavigation for accessibility
 * - TopNavigation for horizontal navigation with tabs
 * - TopBar for user menu and actions
 * - ToastProvider for notifications
 * - PageErrorBoundary for error handling
 * 
 * Requirements: 1.1, 1.10
 */
export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <PageErrorBoundary pageName="Admin">
      <KeyboardNavigationProvider>
        <SkipNavigation />
        <ToastProvider>
          <div className="min-h-screen bg-cloud-100">
            {/* Top Navigation - Sticky with glassmorphism */}
            <TopNavigation />

            {/* Top Bar - User menu and actions */}
            <TopBar />

            {/* Main content area */}
            <main 
              id="main-content" 
              role="main" 
              tabIndex={-1} 
              className="p-4 sm:p-6 lg:p-8 focus:outline-none"
            >
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </KeyboardNavigationProvider>
    </PageErrorBoundary>
  );
}
