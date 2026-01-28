'use client';

import { useEffect } from 'react';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { getShortcutsByCategory, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

/**
 * KeyboardShortcutsDialog Component
 * 
 * Displays all available keyboard shortcuts grouped by category.
 * Opens when user presses "?" key.
 */
export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsByCategory(shortcuts);
  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    general: 'General',
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sage-200 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-sage-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-sage-500 hover:text-sage-700 transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-sage-900 mb-3">
                {categoryLabels[category] || category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-sage-50 transition-colors"
                  >
                    <span className="text-sage-700">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold text-sage-900 bg-sage-100 border border-sage-300 rounded-lg shadow-sm">
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sage-200 bg-sage-50 rounded-b-xl">
          <p className="text-sm text-sage-600 text-center">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-sage-900 bg-white border border-sage-300 rounded">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
