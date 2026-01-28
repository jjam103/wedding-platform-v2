'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/ui/KeyboardShortcutsDialog';

interface KeyboardNavigationContextValue {
  registerShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  unregisterShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  showHelp: () => void;
  hideHelp: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextValue | null>(null);

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

/**
 * KeyboardNavigationProvider Component
 * 
 * Provides global keyboard navigation support for admin interface.
 * Manages keyboard shortcuts and displays help dialog.
 * 
 * Features:
 * - Global keyboard shortcuts (Ctrl+S, Esc, ?)
 * - Keyboard shortcuts help dialog
 * - Focus management
 * - Skip to main content link
 */
export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Register shortcuts from child components
  const registerShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    setShortcuts((prev) => [...prev, ...newShortcuts]);
  }, []);

  // Unregister shortcuts when component unmounts
  const unregisterShortcuts = useCallback((oldShortcuts: KeyboardShortcut[]) => {
    setShortcuts((prev) =>
      prev.filter((s) => !oldShortcuts.some((os) => os.key === s.key && os.description === s.description))
    );
  }, []);

  const showHelp = useCallback(() => setShowHelpDialog(true), []);
  const hideHelp = useCallback(() => setShowHelpDialog(false), []);

  // Global shortcuts
  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      category: 'general',
      handler: showHelp,
    },
    {
      key: 'Escape',
      description: 'Close dialogs/modals',
      category: 'general',
      handler: () => {
        // This will be handled by individual components
      },
    },
  ];

  // Combine global and registered shortcuts
  const allShortcuts = [...globalShortcuts, ...shortcuts];

  // Setup global keyboard shortcuts
  useKeyboardShortcuts(allShortcuts);

  const contextValue: KeyboardNavigationContextValue = {
    registerShortcuts,
    unregisterShortcuts,
    showHelp,
    hideHelp,
  };

  return (
    <KeyboardNavigationContext.Provider value={contextValue}>
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {children}

      {/* Keyboard shortcuts help dialog */}
      <KeyboardShortcutsDialog
        isOpen={showHelpDialog}
        onClose={hideHelp}
        shortcuts={allShortcuts}
      />
    </KeyboardNavigationContext.Provider>
  );
}

/**
 * Hook to access keyboard navigation context
 */
export function useKeyboardNavigation(): KeyboardNavigationContextValue {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
}

/**
 * Hook to register keyboard shortcuts for a component
 * Automatically unregisters on unmount
 */
export function useRegisterShortcuts(shortcuts: KeyboardShortcut[]): void {
  const { registerShortcuts, unregisterShortcuts } = useKeyboardNavigation();

  useEffect(() => {
    if (shortcuts.length > 0) {
      registerShortcuts(shortcuts);
    }
    return () => {
      if (shortcuts.length > 0) {
        unregisterShortcuts(shortcuts);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount
}
