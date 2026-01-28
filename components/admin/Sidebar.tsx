'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GroupedNavigation } from './GroupedNavigation';

interface SidebarProps {
  currentSection: string;
  pendingPhotosCount?: number;
}

/**
 * Sidebar Client Component
 * 
 * Persistent navigation menu with:
 * - Grouped navigation with logical sections
 * - Active section highlighting based on current route
 * - Collapse/expand functionality for mobile
 * - Badge support for pending counts (e.g., pending photos)
 * - Real-time updates for pending photo count
 * - Dashboard quick access
 */
export function Sidebar({ currentSection, pendingPhotosCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint for mobile
      setIsMobile(mobile);
      // On mobile, start collapsed. On tablet/desktop, start expanded
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNavigate = () => {
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const isDashboardActive = pathname === '/admin';

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-sage-200 shadow-lg z-50 transition-all duration-300 ${
          isCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sage-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌴</span>
              <span className="font-bold text-lg text-jungle-600">Admin</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-sage-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Dashboard Link */}
        <div className="p-2 border-b border-sage-200">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg transition-all duration-200 min-h-[44px] ${
              isDashboardActive
                ? 'bg-jungle-50 text-jungle-700 font-medium'
                : 'text-sage-700 hover:bg-sage-50 hover:text-sage-900'
            }`}
            aria-label="Dashboard"
            aria-current={isDashboardActive ? 'page' : undefined}
            onClick={handleNavigate}
          >
            <span className="text-xl flex-shrink-0" aria-hidden="true">🏠</span>
            {!isCollapsed && <span className="flex-1">Dashboard</span>}
          </Link>
        </div>

        {/* Grouped Navigation */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 8rem)' }}>
          <GroupedNavigation
            pendingPhotosCount={pendingPhotosCount}
            isCollapsed={isCollapsed}
            onNavigate={handleNavigate}
          />
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sage-200 bg-sage-50">
            <p className="text-xs text-sage-600 text-center">
              Pura Vida! ☀️
            </p>
          </div>
        )}
      </aside>

      {/* Mobile toggle button (when sidebar is collapsed) */}
      {isMobile && isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-40 p-3 bg-white border border-sage-200 rounded-lg shadow-md md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <span className="text-xl">☰</span>
        </button>
      )}
    </>
  );
}
