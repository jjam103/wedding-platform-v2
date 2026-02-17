'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SubItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
  subItems: SubItem[];
}

interface TopNavigationProps {
  className?: string;
}

const NAVIGATION_TABS: Tab[] = [
  {
    id: 'content',
    label: 'Content',
    icon: '📝',
    subItems: [
      { id: 'home-page', label: 'Home Page', href: '/admin/home-page' },
      { id: 'activities', label: 'Activities', href: '/admin/activities' },
      { id: 'events', label: 'Events', href: '/admin/events' },
      { id: 'content-pages', label: 'Content Pages', href: '/admin/content-pages' },
      { id: 'locations', label: 'Locations', href: '/admin/locations' },
      { id: 'photos', label: 'Photos', href: '/admin/photos' },
    ],
  },
  {
    id: 'guests',
    label: 'Guests',
    icon: '👥',
    subItems: [
      { id: 'guest-list', label: 'Guest List', href: '/admin/guests' },
      { id: 'guest-groups', label: 'Guest Groups', href: '/admin/guest-groups' },
      { id: 'import-export', label: 'Import/Export', href: '/admin/guests/import-export' },
    ],
  },
  {
    id: 'rsvps',
    label: 'RSVPs',
    icon: '✓',
    subItems: [
      { id: 'rsvp-analytics', label: 'RSVP Analytics', href: '/admin/rsvp-analytics' },
      { id: 'activity-rsvps', label: 'Activity RSVPs', href: '/admin/activities/rsvps' },
      { id: 'event-rsvps', label: 'Event RSVPs', href: '/admin/events/rsvps' },
      { id: 'deadlines', label: 'Deadlines', href: '/admin/rsvps/deadlines' },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: '🚗',
    subItems: [
      { id: 'accommodations', label: 'Accommodations', href: '/admin/accommodations' },
      { id: 'transportation', label: 'Transportation', href: '/admin/transportation' },
      { id: 'budget', label: 'Budget', href: '/admin/budget' },
      { id: 'vendors', label: 'Vendors', href: '/admin/vendors' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: '⚙️',
    subItems: [
      { id: 'admin-users', label: 'Admin Users', href: '/admin/admin-users' },
      { id: 'settings', label: 'Settings', href: '/admin/settings' },
      { id: 'email-templates', label: 'Email Templates', href: '/admin/emails/templates' },
      { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs' },
    ],
  },
];

/**
 * TopNavigation Component
 * 
 * Horizontal navigation bar for admin dashboard with:
 * - 5 main tabs (Content, Guests, RSVPs, Logistics, Admin)
 * - Sub-navigation dropdown for each tab
 * - Active state highlighting
 * - Mobile responsive hamburger menu
 * - Navigation state persistence in sessionStorage
 * - Glassmorphism effect with backdrop-filter
 * 
 * Requirements: 1.1, 1.2, 1.8, 1.9, 1.10, 20.1, 20.2, 20.3
 */
export function TopNavigation({ className = '' }: TopNavigationProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>('');
  const [activeSubItem, setActiveSubItem] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize based on window width if available (SSR-safe)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine active tab and sub-item from pathname
  useEffect(() => {
    // Find matching tab and sub-item based on current pathname
    for (const tab of NAVIGATION_TABS) {
      for (const subItem of tab.subItems) {
        if (pathname === subItem.href || pathname.startsWith(subItem.href + '/')) {
          setActiveTab(tab.id);
          setActiveSubItem(subItem.id);
          
          // Persist to sessionStorage
          sessionStorage.setItem('activeTab', tab.id);
          sessionStorage.setItem('activeSubItem', subItem.id);
          return;
        }
      }
    }

    // If no match found, try to restore from sessionStorage
    const storedTab = sessionStorage.getItem('activeTab');
    const storedSubItem = sessionStorage.getItem('activeSubItem');
    
    if (storedTab) {
      setActiveTab(storedTab);
    }
    if (storedSubItem) {
      setActiveSubItem(storedSubItem);
    }
  }, [pathname]);

  // Handle tab click
  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
    sessionStorage.setItem('activeTab', tabId);
    
    // On mobile, don't close menu when clicking tab (show sub-items)
    // On desktop, clicking tab shows sub-items automatically
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, tabId: string, index: number) => {
    const tabs = NAVIGATION_TABS;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          const prevTab = tabs[index - 1];
          handleTabClick(prevTab.id);
          // Focus previous tab button
          const prevButton = document.querySelector(`button[data-tab-id="${prevTab.id}"]`) as HTMLButtonElement;
          prevButton?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < tabs.length - 1) {
          const nextTab = tabs[index + 1];
          handleTabClick(nextTab.id);
          // Focus next tab button
          const nextButton = document.querySelector(`button[data-tab-id="${nextTab.id}"]`) as HTMLButtonElement;
          nextButton?.focus();
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstTab = tabs[0];
        handleTabClick(firstTab.id);
        const firstButton = document.querySelector(`button[data-tab-id="${firstTab.id}"]`) as HTMLButtonElement;
        firstButton?.focus();
        break;
      case 'End':
        e.preventDefault();
        const lastTab = tabs[tabs.length - 1];
        handleTabClick(lastTab.id);
        const lastButton = document.querySelector(`button[data-tab-id="${lastTab.id}"]`) as HTMLButtonElement;
        lastButton?.focus();
        break;
    }
  }, [handleTabClick]);

  // Handle sub-item click
  const handleSubItemClick = useCallback((tabId: string, subItemId: string) => {
    setActiveTab(tabId);
    setActiveSubItem(subItemId);
    sessionStorage.setItem('activeTab', tabId);
    sessionStorage.setItem('activeSubItem', subItemId);
    
    // Close mobile menu after navigation
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Get active tab object
  const activeTabObj = NAVIGATION_TABS.find(tab => tab.id === activeTab);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sage-200 shadow-sm overflow-x-hidden ${className}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-full px-4 w-full">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🌴</span>
                <span className="font-bold text-lg text-jungle-600">Admin</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-sage-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <span className="text-2xl" aria-hidden="true">
                  {isMobileMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>
          )}

          {/* Desktop Tabs */}
          {!isMobile && (
            <div className="flex items-center h-16 gap-1">
              {/* Logo */}
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 hover:bg-sage-50 rounded-lg transition-colors mr-4"
              >
                <span className="text-2xl" aria-hidden="true">🌴</span>
                <span className="font-bold text-lg text-jungle-600">Admin</span>
              </Link>

              {/* Tabs */}
              {NAVIGATION_TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id, index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-600 font-medium'
                      : 'text-sage-700 hover:bg-sage-50 hover:text-sage-900 border-transparent'
                  }`}
                  role="button"
                  aria-label={tab.label}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  aria-expanded={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  tabIndex={0}
                >
                  <span className="text-lg" aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Desktop Sub-Navigation */}
          {activeTabObj && (
            <div 
              className={`items-center gap-2 py-3 border-t border-sage-100 ${isMobile ? 'hidden' : 'flex'}`}
              role="tabpanel"
              id={`${activeTabObj.id}-panel`}
              aria-labelledby={`${activeTabObj.id}-tab`}
              hidden={isMobile}
            >
              {activeTabObj.subItems.map((subItem) => (
                <Link
                  key={subItem.id}
                  href={subItem.href}
                  onClick={() => handleSubItemClick(activeTabObj.id, subItem.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                    activeSubItem === subItem.id
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'text-sage-700 hover:bg-sage-100 hover:text-sage-900'
                  }`}
                  aria-current={activeSubItem === subItem.id ? 'page' : undefined}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={toggleMobileMenu}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            className="fixed inset-y-0 left-0 w-[min(100vw,24rem)] bg-white z-50 overflow-y-auto shadow-2xl"
            role="dialog"
            aria-label="Mobile navigation menu"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-sage-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🌴</span>
                <span className="font-bold text-lg text-jungle-600">Admin Menu</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 hover:bg-sage-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <span className="text-2xl" aria-hidden="true">✕</span>
              </button>
            </div>

            {/* Dashboard Link */}
            <div className="p-4 border-b border-sage-200">
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sage-50 hover:bg-sage-100 transition-colors min-h-[44px]"
              >
                <span className="text-xl" aria-hidden="true">🏠</span>
                <span className="font-medium">Dashboard</span>
              </Link>
            </div>

            {/* Menu Sections */}
            <div className="p-4 space-y-6">
              {NAVIGATION_TABS.map((tab) => (
                <div key={tab.id}>
                  {/* Tab Header */}
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] ${
                      activeTab === tab.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-sage-700 hover:bg-sage-50'
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">{tab.icon}</span>
                    <span className="flex-1 text-left">{tab.label}</span>
                    <span className="text-sm" aria-hidden="true">
                      {activeTab === tab.id ? '▼' : '▶'}
                    </span>
                  </button>

                  {/* Sub-Items (shown when tab is active) */}
                  {activeTab === tab.id && (
                    <div className="mt-2 ml-4 space-y-1">
                      {tab.subItems.map((subItem) => (
                        <Link
                          key={subItem.id}
                          href={subItem.href}
                          onClick={() => handleSubItemClick(tab.id, subItem.id)}
                          className={`block px-4 py-2.5 rounded-lg text-sm transition-all duration-200 min-h-[44px] flex items-center ${
                            activeSubItem === subItem.id
                              ? 'bg-emerald-600 text-white font-medium'
                              : 'text-sage-700 hover:bg-sage-100'
                          }`}
                          aria-current={activeSubItem === subItem.id ? 'page' : undefined}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-sage-200 bg-sage-50">
              <p className="text-xs text-sage-600 text-center">
                Pura Vida! ☀️
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
