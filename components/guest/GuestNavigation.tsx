'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Calendar, 
  Activity, 
  MapPin, 
  Camera, 
  Info,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: NavSubItem[];
}

interface NavSubItem {
  label: string;
  href: string;
}

const NAV_TABS: NavTab[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/guest/dashboard',
    icon: Home,
  },
  {
    id: 'events',
    label: 'Events',
    href: '/guest/events',
    icon: Calendar,
  },
  {
    id: 'activities',
    label: 'Activities',
    href: '/guest/activities',
    icon: Activity,
  },
  {
    id: 'itinerary',
    label: 'Itinerary',
    href: '/guest/itinerary',
    icon: MapPin,
  },
  {
    id: 'photos',
    label: 'Photos',
    href: '/guest/photos',
    icon: Camera,
  },
  {
    id: 'info',
    label: 'Info',
    href: '/guest/info',
    icon: Info,
    subItems: [
      { label: 'Accommodation', href: '/guest/accommodation' },
      { label: 'Transportation', href: '/guest/transportation' },
      { label: 'Family', href: '/guest/family' },
      { label: 'Our Story', href: '/our-story' },
    ],
  },
];

export function GuestNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const isActive = useCallback((href: string, subItems?: NavSubItem[]) => {
    if (pathname === href) return true;
    if (subItems) {
      return subItems.some(item => pathname === item.href);
    }
    return false;
  }, [pathname]);

  const toggleDropdown = useCallback((tabId: string) => {
    setActiveDropdown(prev => prev === tabId ? null : tabId);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, []);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <Link 
                href="/guest/dashboard"
                className="text-xl font-bold text-jungle-700 hover:text-jungle-800 transition-colors"
              >
                Wedding Portal
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href, tab.subItems);

                if (tab.subItems) {
                  return (
                    <div key={tab.id} className="relative">
                      <button
                        onClick={() => toggleDropdown(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'text-sage-700 hover:bg-sage-100'
                        }`}
                        aria-expanded={activeDropdown === tab.id}
                        aria-haspopup="true"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            activeDropdown === tab.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === tab.id && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-sage-200 py-1 z-50">
                          {tab.subItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setActiveDropdown(null)}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                pathname === subItem.href
                                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                                  : 'text-sage-700 hover:bg-sage-50'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-sage-700 hover:bg-sage-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Link
                href="/api/auth/logout"
                className="text-sm text-sage-600 hover:text-sage-900 font-medium"
              >
                Logout
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <Link 
              href="/guest/dashboard"
              className="text-lg font-bold text-jungle-700"
            >
              Wedding Portal
            </Link>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-sage-700 hover:bg-sage-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 shadow-xl overflow-y-auto">
              <div className="p-4">
                {/* Close Button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-jungle-700">Menu</h2>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 rounded-lg text-sage-700 hover:bg-sage-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation Items */}
                <div className="space-y-2">
                  {NAV_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = isActive(tab.href, tab.subItems);

                    if (tab.subItems) {
                      return (
                        <div key={tab.id}>
                          <button
                            onClick={() => toggleDropdown(tab.id)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                              active
                                ? 'bg-emerald-600 text-white'
                                : 'text-sage-700 hover:bg-sage-100'
                            }`}
                            style={{ minHeight: '44px' }} // Touch target size
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5" />
                              <span>{tab.label}</span>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 transition-transform ${
                                activeDropdown === tab.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Sub Items */}
                          {activeDropdown === tab.id && (
                            <div className="mt-1 ml-4 space-y-1">
                              {tab.subItems.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={closeMobileMenu}
                                  className={`block px-4 py-3 rounded-lg text-sm transition-colors ${
                                    pathname === subItem.href
                                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                                      : 'text-sage-700 hover:bg-sage-50'
                                  }`}
                                  style={{ minHeight: '44px' }} // Touch target size
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'text-sage-700 hover:bg-sage-100'
                        }`}
                        style={{ minHeight: '44px' }} // Touch target size
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-sage-200">
                  <Link
                    href="/api/auth/logout"
                    onClick={closeMobileMenu}
                    className="block w-full px-4 py-3 text-center rounded-lg text-base font-medium text-sage-700 hover:bg-sage-100 transition-colors"
                    style={{ minHeight: '44px' }} // Touch target size
                  >
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
