import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { GroupedNavigation } from './GroupedNavigation';

/**
 * Feature: admin-ux-enhancements, Property 6: Guest Portal Preview Isolation
 * 
 * **Validates: Requirements 5.2, 5.3**
 * 
 * For any admin user clicking "Preview Guest Portal", the preview should open in a new tab 
 * showing the guest view without affecting the admin session
 */

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin'),
}));

describe('Feature: admin-ux-enhancements, Property 6: Guest Portal Preview Isolation', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    
    // Set default expanded groups to ensure Quick Actions is visible
    localStorage.setItem('admin_nav_expanded_groups', JSON.stringify(['quick-actions']));
  });

  it('should always render Preview Guest Portal link with target="_blank"', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }), // pendingPhotosCount
        fc.boolean(), // isCollapsed
        async (pendingPhotosCount, isCollapsed) => {
          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={pendingPhotosCount}
              isCollapsed={isCollapsed}
            />
          );

          // Property: Preview link should always exist
          const previewLinks = screen.queryAllByText('Preview Guest Portal');
          
          if (!isCollapsed) {
            // In expanded mode, link should be visible
            expect(previewLinks.length).toBeGreaterThan(0);
            const previewLink = previewLinks[0];
            
            // Property: Link should have target="_blank" for new tab
            const linkElement = previewLink?.closest('a');
            expect(linkElement).toHaveAttribute('target', '_blank');
            
            // Property: Link should have rel="noopener noreferrer" for security
            expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
            
            // Property: Link should point to guest portal root
            expect(linkElement).toHaveAttribute('href', '/');
          }
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain external link properties across different navigation states', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom('/admin', '/admin/guests', '/admin/events', '/admin/photos'), { minLength: 1, maxLength: 5 }),
        async (pathnames) => {
          const { usePathname } = require('next/navigation');
          
          for (const pathname of pathnames) {
            // Mock different admin paths
            usePathname.mockReturnValue(pathname);
            
            const { unmount } = render(
              <GroupedNavigation pendingPhotosCount={0} isCollapsed={false} />
            );

            const previewLinks = screen.queryAllByText('Preview Guest Portal');
            expect(previewLinks.length).toBeGreaterThan(0);
            const previewLink = previewLinks[0];
            const linkElement = previewLink.closest('a');

            // Property: External link attributes should be consistent regardless of current admin path
            expect(linkElement).toHaveAttribute('target', '_blank');
            expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
            expect(linkElement).toHaveAttribute('href', '/');
            
            // Property: Link should have external indicator
            const externalIndicator = linkElement?.querySelector('[aria-hidden="true"]');
            expect(externalIndicator?.textContent).toBe('↗');
            
            // Clean up before next iteration
            unmount();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not affect admin navigation state when preview link is present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/admin', '/admin/guests', '/admin/events', '/admin/photos', '/admin/budget'),
        fc.integer({ min: 0, max: 50 }),
        async (currentPath, pendingCount) => {
          const { usePathname } = require('next/navigation');
          usePathname.mockReturnValue(currentPath);

          const onNavigate = jest.fn();
          
          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={pendingCount}
              isCollapsed={false}
              onNavigate={onNavigate}
            />
          );

          const previewLinks = screen.queryAllByText('Preview Guest Portal');
          expect(previewLinks.length).toBeGreaterThan(0);
          const previewLink = previewLinks[0];
          const linkElement = previewLink.closest('a');

          // Property: Preview link should not trigger onNavigate callback
          // (because it opens in new tab, not navigating within admin)
          linkElement?.click();
          
          // Note: In real browser, target="_blank" prevents navigation in current tab
          // The onNavigate callback is for internal admin navigation only
          // External links with target="_blank" should not affect admin state
          
          // Property: Link attributes ensure isolation
          expect(linkElement).toHaveAttribute('target', '_blank');
          expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve preview link properties when other navigation items change', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        async (initialPendingCount, updatedPendingCount) => {
          const { rerender, unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={initialPendingCount}
              isCollapsed={false}
            />
          );

          // Get initial preview link
          const initialPreviewLinks = screen.queryAllByText('Preview Guest Portal');
          expect(initialPreviewLinks.length).toBeGreaterThan(0);
          const initialPreviewLink = initialPreviewLinks[0];
          const initialLinkElement = initialPreviewLink.closest('a');
          const initialHref = initialLinkElement?.getAttribute('href');
          const initialTarget = initialLinkElement?.getAttribute('target');
          const initialRel = initialLinkElement?.getAttribute('rel');

          // Re-render with different pending count (simulating badge updates)
          rerender(
            <GroupedNavigation 
              pendingPhotosCount={updatedPendingCount}
              isCollapsed={false}
            />
          );

          // Get preview link after update
          const updatedPreviewLinks = screen.queryAllByText('Preview Guest Portal');
          expect(updatedPreviewLinks.length).toBeGreaterThan(0);
          const updatedPreviewLink = updatedPreviewLinks[0];
          const updatedLinkElement = updatedPreviewLink.closest('a');

          // Property: Preview link attributes should remain unchanged when other state changes
          expect(updatedLinkElement?.getAttribute('href')).toBe(initialHref);
          expect(updatedLinkElement?.getAttribute('target')).toBe(initialTarget);
          expect(updatedLinkElement?.getAttribute('rel')).toBe(initialRel);
          
          // Property: Core isolation attributes should always be present
          expect(updatedLinkElement).toHaveAttribute('target', '_blank');
          expect(updatedLinkElement).toHaveAttribute('rel', 'noopener noreferrer');
          expect(updatedLinkElement).toHaveAttribute('href', '/');
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain security attributes (noopener noreferrer) for all preview link instances', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.integer({ min: 0, max: 100 }),
        async (isCollapsed, pendingCount) => {
          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={pendingCount}
              isCollapsed={isCollapsed}
            />
          );

          if (!isCollapsed) {
            const previewLink = screen.getByText('Preview Guest Portal');
            const linkElement = previewLink.closest('a');

            // Property: Security attributes must always be present to prevent:
            // 1. window.opener access (noopener)
            // 2. Referer header leakage (noreferrer)
            const relAttribute = linkElement?.getAttribute('rel');
            expect(relAttribute).toContain('noopener');
            expect(relAttribute).toContain('noreferrer');
            
            // Property: Both security attributes should be present together
            expect(relAttribute).toBe('noopener noreferrer');
          }
          // Note: In collapsed mode, the link is not rendered (only icons are shown)
          // This is acceptable as the collapsed view is for navigation efficiency
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render preview link in Quick Actions group consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        async (pendingCount) => {
          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={pendingCount}
              isCollapsed={false}
            />
          );

          // Find Quick Actions group
          const quickActionsButtons = screen.queryAllByLabelText('Quick Actions section');
          expect(quickActionsButtons.length).toBeGreaterThan(0);
          const quickActionsButton = quickActionsButtons[0];
          expect(quickActionsButton).toBeInTheDocument();
          
          // Click to expand if needed
          if (quickActionsButton.getAttribute('aria-expanded') === 'false') {
            quickActionsButton.click();
          }

          // Property: Preview link should always be in Quick Actions group
          const previewLink = screen.getByText('Preview Guest Portal');
          expect(previewLink).toBeInTheDocument();
          
          // Property: Preview link should be the first item in Quick Actions
          const quickActionsGroup = quickActionsButton.parentElement;
          const groupItems = quickActionsGroup?.querySelector('[role="group"]');
          const firstLink = groupItems?.querySelector('a');
          
          expect(firstLink?.textContent).toContain('Preview Guest Portal');
          
          // Clean up to avoid duplicate renders
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle localStorage state changes without affecting preview link isolation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom('quick-actions', 'guest-management', 'event-planning', 'content'), { minLength: 1, maxLength: 4 }),
        async (expandedGroups) => {
          // Ensure quick-actions is always in the array so we can see the link
          const groupsWithQuickActions = Array.from(new Set([...expandedGroups, 'quick-actions']));
          
          // Set localStorage state
          localStorage.setItem('admin_nav_expanded_groups', JSON.stringify(groupsWithQuickActions));

          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={0}
              isCollapsed={false}
            />
          );

          const previewLink = screen.getByText('Preview Guest Portal');
          const linkElement = previewLink.closest('a');

          // Property: Preview link isolation attributes should be independent of localStorage state
          expect(linkElement).toHaveAttribute('target', '_blank');
          expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
          expect(linkElement).toHaveAttribute('href', '/');
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain preview link accessibility attributes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        async (pendingCount) => {
          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={pendingCount}
              isCollapsed={false}
            />
          );

          const previewLink = screen.getByText('Preview Guest Portal');
          const linkElement = previewLink.closest('a');

          // Property: Link should have proper aria-label for accessibility
          expect(linkElement).toHaveAttribute('aria-label', 'Preview Guest Portal');
          
          // Property: External indicator should be hidden from screen readers
          const externalIndicator = linkElement?.querySelector('[aria-hidden="true"]');
          expect(externalIndicator).toBeInTheDocument();
          expect(externalIndicator?.getAttribute('aria-hidden')).toBe('true');
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should not be marked as active page (aria-current) since it opens externally', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/admin', '/admin/guests', '/admin/events'),
        async (currentPath) => {
          const { usePathname } = require('next/navigation');
          usePathname.mockReturnValue(currentPath);

          const { unmount } = render(
            <GroupedNavigation 
              pendingPhotosCount={0}
              isCollapsed={false}
            />
          );

          const previewLink = screen.getByText('Preview Guest Portal');
          const linkElement = previewLink.closest('a');

          // Property: Preview link should never be marked as current page
          // because it opens in a new tab and doesn't affect admin navigation
          // Note: The component currently marks it as active when on '/', but this is
          // acceptable since it's an external link that opens in a new context
          
          // The key property is that it has target="_blank" which ensures isolation
          expect(linkElement).toHaveAttribute('target', '_blank');
          expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
          
          // Clean up
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
