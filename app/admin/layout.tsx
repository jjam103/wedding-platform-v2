import type { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin';
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
 * - AdminLayout for sidebar and navigation
 * - ToastProvider for notifications
 * - PageErrorBoundary for error handling
 */
export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  // Determine current section from pathname (will be enhanced with actual pathname detection)
  const currentSection = 'dashboard';

  return (
    <PageErrorBoundary pageName="Admin">
      <KeyboardNavigationProvider>
        <SkipNavigation />
        <ToastProvider>
          <AdminLayout currentSection={currentSection}>
            {children}
          </AdminLayout>
        </ToastProvider>
      </KeyboardNavigationProvider>
    </PageErrorBoundary>
  );
}
