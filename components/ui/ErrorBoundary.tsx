'use client';

import { Component, type ReactNode } from 'react';
import { Button } from './Button';
import { TropicalIcon } from './TropicalIcon';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Features:
 * - User-friendly error messages
 * - Retry button for network errors
 * - Error logging to console
 * - Custom fallback UI support
 * 
 * Requirements: 12.1, 12.4, 12.5
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 * 
 * Displays a user-friendly error message with retry option.
 */
interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  // Determine if this is a network error
  const isNetworkError = 
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to load') ||
    error.message.includes('timeout');

  // Get user-friendly error message
  const getUserFriendlyMessage = (error: Error): string => {
    if (isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'You do not have permission to access this resource.';
    }

    if (error.message.includes('not found')) {
      return 'The requested resource could not be found.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-volcano-200 p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <TropicalIcon name="volcano" size="xl" className="text-volcano-500 mx-auto" />
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-sage-900 mb-3">
          Oops! Something went wrong
        </h2>

        {/* User-friendly error message */}
        <p className="text-sage-600 mb-6">
          {getUserFriendlyMessage(error)}
        </p>

        {/* Technical details (collapsed by default) */}
        <details className="mb-6 text-left">
          <summary className="cursor-pointer text-sm text-sage-500 hover:text-sage-700 mb-2">
            Technical details
          </summary>
          <div className="bg-sage-50 rounded-lg p-4 text-xs font-mono text-sage-700 overflow-auto max-h-32">
            {error.message}
          </div>
        </details>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isNetworkError && (
            <Button
              onClick={onReset}
              variant="primary"
              size="md"
            >
              Retry
            </Button>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant={isNetworkError ? 'secondary' : 'primary'}
            size="md"
          >
            Reload Page
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            size="md"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Page Error Boundary
 * 
 * Specialized error boundary for page-level errors.
 * Provides a full-page error display with navigation options.
 */
interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="min-h-screen bg-cloud-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-xl border border-volcano-200 p-8 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-volcano-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">⚠️</span>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-sage-900 mb-3">
              {pageName ? `Error loading ${pageName}` : 'Page Error'}
            </h1>

            {/* Error message */}
            <p className="text-sage-600 mb-6">
              We encountered an error while loading this page. This has been logged and we'll look into it.
            </p>

            {/* Technical details */}
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-sage-500 hover:text-sage-700 mb-2">
                Error details
              </summary>
              <div className="bg-sage-50 rounded-lg p-4 text-xs font-mono text-sage-700 overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} variant="primary" size="md">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/admin'} variant="secondary" size="md">
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        // Log to console for debugging
        console.error(`Error in ${pageName || 'page'}:`, error, errorInfo);
        
        // In production, you would send this to an error tracking service
        // e.g., Sentry, LogRocket, etc.
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component Error Boundary
 * 
 * Specialized error boundary for component-level errors.
 * Provides an inline error display that doesn't break the entire page.
 */
interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
}

export function ComponentErrorBoundary({ children, componentName }: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-volcano-900 mb-2">
                {componentName ? `Error in ${componentName}` : 'Component Error'}
              </h3>
              <p className="text-sm text-volcano-700 mb-3">
                This component encountered an error and couldn't be displayed.
              </p>
              <details className="mb-3">
                <summary className="cursor-pointer text-xs text-volcano-600 hover:text-volcano-800">
                  Show details
                </summary>
                <div className="mt-2 bg-white rounded p-2 text-xs font-mono text-sage-700">
                  {error.message}
                </div>
              </details>
              <Button onClick={reset} variant="secondary" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error(`Error in ${componentName || 'component'}:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
