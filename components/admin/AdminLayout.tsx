'use client';

import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { TopNavigation } from './TopNavigation';
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
 * - Top navigation bar with tabs and sub-navigation
 * - Responsive container with mobile breakpoint handling
 * - Content area for page-specific content
 * - Keyboard shortcuts support
 */
export function AdminLayout({ children, currentSection }: AdminLayoutProps) {
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

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

  return (
    <div className="min-h-screen bg-cloud-100">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Page content */}
      <main id="main-content" role="main" tabIndex={-1} className="p-4 sm:p-6 lg:p-8 focus:outline-none">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Keyboard shortcuts help dialog */}
      <KeyboardShortcutsDialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
