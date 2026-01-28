/**
 * Skip Navigation Component
 * 
 * Provides keyboard users with a way to skip repetitive navigation
 * and jump directly to main content. WCAG 2.1 AA requirement.
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-jungle-500 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-jungle-600 focus:ring-offset-2 transition-all"
    >
      Skip to main content
    </a>
  );
}

/**
 * Main Content Wrapper
 * 
 * Wraps main content with proper landmark and ID for skip navigation.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" role="main" tabIndex={-1} className="focus:outline-none">
      {children}
    </main>
  );
}
