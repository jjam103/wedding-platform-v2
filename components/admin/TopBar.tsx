'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * TopBar Client Component
 * 
 * Top navigation bar with:
 * - User menu with logout functionality
 * - Notification bell (placeholder for now)
 * - Responsive design
 */
export function TopBar() {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/auth/login');
      } else {
        console.error('Logout failed');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleProfile = useCallback(() => {
    setIsUserMenuOpen(false);
    router.push('/admin/settings');
  }, [router]);

  return (
    <header className="h-16 bg-white border-b border-sage-200 shadow-sm sticky top-0 z-30" role="banner">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left side - Page title or breadcrumbs */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-sage-900 hidden sm:block">
            Wedding Admin
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3" role="toolbar" aria-label="User actions">
          {/* Notification bell (placeholder) */}
          <button
            className="p-2 text-sage-600 hover:text-sage-900 hover:bg-sage-100 rounded-lg transition-colors relative"
            aria-label="Notifications (coming soon)"
            title="Notifications (coming soon)"
          >
            <span className="text-xl" aria-hidden="true">🔔</span>
            {/* Notification badge - placeholder */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-volcano-500 rounded-full"></span> */}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className="flex items-center gap-2 p-2 text-sage-700 hover:text-sage-900 hover:bg-sage-100 rounded-lg transition-colors"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-controls="user-menu-dropdown"
            >
              <div className="w-8 h-8 bg-jungle-500 text-white rounded-full flex items-center justify-center font-medium" aria-hidden="true">
                A
              </div>
              <span className="hidden sm:inline text-sm font-medium">Admin</span>
              <span className="text-xs" aria-hidden="true">{isUserMenuOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div 
                id="user-menu-dropdown"
                className="absolute right-0 mt-2 w-48 bg-white border border-sage-200 rounded-lg shadow-lg py-1 z-50 animate-slide-down"
                role="menu"
                aria-label="User menu options"
              >
                <button
                  onClick={handleProfile}
                  className="w-full px-4 py-2 text-left text-sm text-sage-700 hover:bg-sage-50 transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <span aria-hidden="true">⚙️</span>
                  <span>Settings</span>
                </button>
                <div className="border-t border-sage-200 my-1" role="separator"></div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2 text-left text-sm text-volcano-600 hover:bg-volcano-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  role="menuitem"
                  aria-busy={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <div 
                        className="animate-spin rounded-full h-4 w-4 border-2 border-volcano-600 border-t-transparent"
                        role="status"
                        aria-label="Logging out"
                      ></div>
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">🚪</span>
                      <span>Logout</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
