'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  activePattern: RegExp;
}

interface MobileNavProps {
  items: NavItem[];
}

/**
 * Mobile Navigation Component
 * 
 * Bottom navigation bar optimized for mobile devices with:
 * - Touch-friendly tap targets
 * - Active state indication
 * - Safe area insets for notched devices
 * - Smooth transitions
 */
export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = useCallback((href: string) => {
    router.push(href);
  }, [router]);

  const isActive = useCallback((pattern: RegExp) => {
    return pattern.test(pathname);
  }, [pathname]);

  return (
    <nav className="nav-mobile md:hidden" role="navigation" aria-label="Mobile navigation">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = isActive(item.activePattern);
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              className={`flex flex-col items-center justify-center tap-target px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'text-jungle-600 bg-jungle-50'
                  : 'text-sage-600 hover:text-sage-900 hover:bg-sage-50'
              }`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Guest Portal Mobile Navigation
 */
export function GuestMobileNav() {
  const items: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: '🏠',
      href: '/guest/dashboard',
      activePattern: /^\/guest\/dashboard$/,
    },
    {
      id: 'rsvp',
      label: 'RSVP',
      icon: '✉️',
      href: '/guest/rsvp',
      activePattern: /^\/guest\/rsvp/,
    },
    {
      id: 'itinerary',
      label: 'Schedule',
      icon: '📅',
      href: '/guest/itinerary',
      activePattern: /^\/guest\/itinerary/,
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: '📸',
      href: '/guest/photos',
      activePattern: /^\/guest\/photos/,
    },
    {
      id: 'family',
      label: 'Family',
      icon: '👨‍👩‍👧‍👦',
      href: '/guest/family',
      activePattern: /^\/guest\/family/,
    },
  ];

  return <MobileNav items={items} />;
}

/**
 * Admin Portal Mobile Navigation
 */
export function AdminMobileNav() {
  const items: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: '🏠',
      href: '/admin',
      activePattern: /^\/admin$/,
    },
    {
      id: 'guests',
      label: 'Guests',
      icon: '👥',
      href: '/admin/guests',
      activePattern: /^\/admin\/guests/,
    },
    {
      id: 'events',
      label: 'Events',
      icon: '📅',
      href: '/admin/events',
      activePattern: /^\/admin\/events/,
    },
    {
      id: 'photos',
      label: 'Photos',
      icon: '📸',
      href: '/admin/photos',
      activePattern: /^\/admin\/photos/,
    },
    {
      id: 'more',
      label: 'More',
      icon: '⋯',
      href: '/admin/menu',
      activePattern: /^\/admin\/(vendors|emails|activities|budget)/,
    },
  ];

  return <MobileNav items={items} />;
}
