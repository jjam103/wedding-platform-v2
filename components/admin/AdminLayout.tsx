'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { KeyboardShortcutsDialog } from '@/components/ui/KeyboardShortcutsDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface AdminLayoutProps {
  children: ReactNode;
  currentSection: string;
}

/**
 * AdminLayout Client Component
 * 
 * Provides consistent layout structure for all admin pages with:
 * - Persistent sidebar navigation with pending photo count
 * - Top bar with user menu
 * - Responsive container with mobile breakpoint handling
 * - Content area for page-specific content
 */
export function AdminLayout({ children, currentSection }: AdminLayoutProps) {
  const [pendingPhotosCount, setPendingPhotosCount] = useState(0);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  const fetchPendingCount = async () => {
    try {
      const response = await fetch('/api/admin/photos/pending-count');
      const result = await response.json();
      if (result.success) {
        setPendingPhotosCount(result.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch pending photos count:', error);
    }
  };

  // Focus search input handler
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  // Open new entity form handler
  const openNewForm = useCallback(() => {
    const addButton = document.querySelector('[data-action="add-new"]') as HTMLButtonElement;
    if (addButton) {
      addButton.click();
    }
  }, []);

  // Show keyboard shortcuts help
  const showHelp = useCallback(() => {
    setShowShortcutsDialog(true);
  }, []);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Focus search input',
      category: 'navigation',
      handler: focusSearch,
    },
    {
      key: 'n',
      description: 'Open new entity form',
      category: 'actions',
      handler: openNewForm,
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      category: 'general',
      handler: showHelp,
    },
    {
      key: 'Escape',
      description: 'Close open modals',
      category: 'general',
      handler: () => {
        // Escape is handled by individual modal components
      },
    },
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts, !showShortcutsDialog);

  useEffect(() => {
    // Initial fetch
    fetchPendingCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);

    // Listen for photo moderation events
    const handlePhotoModerated = () => {
      fetchPendingCount();
    };
    window.addEventListener('photoModerated', handlePhotoModerated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('photoModerated', handlePhotoModerated);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cloud-100">
      {/* Sidebar - Fixed on desktop, collapsible on mobile */}
      <Sidebar currentSection={currentSection} pendingPhotosCount={pendingPhotosCount} />

      {/* Main content area with top bar */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main id="main-content" role="main" tabIndex={-1} className="p-4 sm:p-6 lg:p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Keyboard shortcuts help dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
