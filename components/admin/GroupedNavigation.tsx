'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { safeGetJSON, safeSetJSON } from '@/utils/storage';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  badge?: number;
  external?: boolean;
}

interface NavigationGroup {
  id: string;
  label: string;
  icon: string;
  items: NavigationItem[];
  badge?: number;
}

interface GroupedNavigationProps {
  pendingPhotosCount?: number;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

const STORAGE_KEY = 'admin_nav_expanded_groups';

/**
 * GroupedNavigation Component
 * 
 * Organized navigation with logical grouping:
 * - Quick Actions, Guest Management, Event Planning, Logistics, Content, Communication, Financial, System
 * - Expand/collapse functionality with localStorage persistence
 * - Badge support for pending items
 * - Keyboard navigation support
 * - Mobile responsive
 * - External link support with target="_blank"
 */
export function GroupedNavigation({ 
  pendingPhotosCount = 0, 
  isCollapsed = false,
  onNavigate 
}: GroupedNavigationProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [pendingCount, setPendingCount] = useState(pendingPhotosCount);

  // Load expanded groups from localStorage
  useEffect(() => {
    try {
      const parsed = safeGetJSON<string[]>(STORAGE_KEY, []);
      if (parsed.length > 0) {
        setExpandedGroups(new Set(parsed));
      } else {
        // Default: expand all groups
        setExpandedGroups(new Set([
          'quick-actions',
          'guest-management',
          'event-planning',
          'logistics',
          'content',
          'communication',
          'financial',
          'system'
        ]));
      }
    } catch (error) {
      console.error('Failed to load expanded groups:', error);
    }
  }, []);

  // Save expanded groups to localStorage
  useEffect(() => {
    try {
      safeSetJSON(STORAGE_KEY, Array.from(expandedGroups));
    } catch (error) {
      console.error('Failed to save expanded groups:', error);
    }
  }, [expandedGroups]);

  // Update pending count when prop changes
  useEffect(() => {
    setPendingCount(pendingPhotosCount);
  }, [pendingPhotosCount]);

  // Listen for photo moderation events
  useEffect(() => {
    const handlePhotoModerated = async () => {
      try {
        const response = await fetch('/api/admin/photos/pending-count');
        const result = await response.json();
        if (result.success) {
          setPendingCount(result.data.count);
        }
      } catch (error) {
        console.error('Failed to fetch pending photo count:', error);
      }
    };

    window.addEventListener('photoModerated', handlePhotoModerated);
    return () => window.removeEventListener('photoModerated', handlePhotoModerated);
  }, []);

  // Listen for storage events (sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = safeGetJSON<string[]>(STORAGE_KEY, []);
          if (parsed.length > 0) {
            setExpandedGroups(new Set(parsed));
          }
        } catch (error) {
          console.error('Failed to sync expanded groups:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navigationGroups: NavigationGroup[] = [
    {
      id: 'quick-actions',
      label: 'Quick Actions',
      icon: '⚡',
      items: [
        { id: 'preview-portal', label: 'Preview Guest Portal', href: '/', external: true },
      ],
    },
    {
      id: 'guest-management',
      label: 'Guest Management',
      icon: '👥',
      items: [
        { id: 'guests', label: 'Guests & Groups', href: '/admin/guests' },
        { id: 'rsvps', label: 'RSVPs', href: '/admin/rsvps' },
      ],
    },
    {
      id: 'event-planning',
      label: 'Event Planning',
      icon: '📅',
      items: [
        { id: 'events', label: 'Events', href: '/admin/events' },
        { id: 'activities', label: 'Activities', href: '/admin/activities' },
        // Locations will be added in future tasks
      ],
    },
    {
      id: 'logistics',
      label: 'Logistics',
      icon: '🚗',
      items: [
        { id: 'accommodations', label: 'Accommodations', href: '/admin/accommodations' },
        { id: 'transportation', label: 'Transportation', href: '/admin/transportation' },
        { id: 'vendors', label: 'Vendors', href: '/admin/vendors' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      icon: '📝',
      items: [
        { id: 'home-page', label: 'Home Page', href: '/admin/home-page' },
        { id: 'content-pages', label: 'Content Pages', href: '/admin/content-pages' },
        { id: 'locations', label: 'Locations', href: '/admin/locations' },
        { id: 'photos', label: 'Photos', href: '/admin/photos', badge: pendingCount },
      ],
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: '✉️',
      items: [
        { id: 'emails', label: 'Emails', href: '/admin/emails' },
        { id: 'rsvp-analytics', label: 'RSVP Analytics', href: '/admin/rsvp-analytics' },
      ],
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: '💰',
      items: [
        { id: 'budget', label: 'Budget', href: '/admin/budget' },
        // Vendor Payments will be added in future tasks
      ],
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      items: [
        { id: 'settings', label: 'Settings', href: '/admin/settings' },
        { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs' },
        { id: 'deleted-items', label: 'Deleted Items', href: '/admin/deleted-items' },
        // User Management will be added in future tasks
      ],
    },
  ];

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  const isGroupActive = (group: NavigationGroup) => {
    return group.items.some((item) => isActive(item.href));
  };

  const handleKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleGroup(groupId);
    }
  };

  if (isCollapsed) {
    // Collapsed view: show only icons
    return (
      <nav className="p-2 space-y-1" aria-label="Admin sections">
        {navigationGroups.map((group) => {
          const active = isGroupActive(group);
          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 min-h-[44px] ${
                  active
                    ? 'bg-jungle-50 text-jungle-700'
                    : 'text-sage-700 hover:bg-sage-50 hover:text-sage-900'
                }`}
                aria-label={group.label}
                title={group.label}
              >
                <span className="text-xl" aria-hidden="true">{group.icon}</span>
                {group.badge !== undefined && group.badge > 0 && (
                  <span 
                    className="absolute top-1 right-1 w-2 h-2 bg-volcano-500 rounded-full"
                    aria-label={`${group.badge} pending`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="p-2 space-y-2" aria-label="Admin sections">
      {navigationGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const active = isGroupActive(group);

        return (
          <div key={group.id} className="space-y-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              onKeyDown={(e) => handleKeyDown(e, group.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] ${
                active
                  ? 'bg-jungle-50 text-jungle-700 font-medium'
                  : 'text-sage-700 hover:bg-sage-50 hover:text-sage-900'
              }`}
              aria-expanded={isExpanded}
              aria-label={`${group.label} section`}
            >
              <span className="text-xl flex-shrink-0" aria-hidden="true">{group.icon}</span>
              <span className="flex-1 text-left">{group.label}</span>
              {group.badge !== undefined && group.badge > 0 && (
                <span 
                  className="px-2 py-0.5 bg-volcano-500 text-white text-xs font-medium rounded-full min-w-[24px] text-center"
                  aria-label={`${group.badge} pending`}
                >
                  {group.badge}
                </span>
              )}
              <span 
                className={`text-sm transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                aria-hidden="true"
              >
                ▶
              </span>
            </button>

            {/* Group Items */}
            {isExpanded && (
              <div className="ml-6 space-y-1" role="group" aria-label={`${group.label} items`}>
                {group.items.map((item) => {
                  const itemActive = isActive(item.href);
                  const linkProps = item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {};
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      {...linkProps}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 min-h-[44px] ${
                        itemActive
                          ? 'bg-jungle-100 text-jungle-800 font-medium'
                          : 'text-sage-600 hover:bg-sage-50 hover:text-sage-900'
                      }`}
                      aria-label={item.label}
                      aria-current={itemActive ? 'page' : undefined}
                      onClick={onNavigate}
                    >
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span 
                          className="px-2 py-0.5 bg-volcano-500 text-white text-xs font-medium rounded-full min-w-[24px] text-center"
                          aria-label={`${item.badge} pending`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.external && (
                        <span className="text-xs" aria-hidden="true">↗</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
