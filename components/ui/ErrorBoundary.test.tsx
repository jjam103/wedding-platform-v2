import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, PageErrorBoundary, ComponentErrorBoundary } from './ErrorBoundary';

// Mock Button component
jest.mock('./Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock TropicalIcon component
jest.mock('./TropicalIcon', () => ({
  TropicalIcon: ({ name, ...props }: any) => <div data-testid={`icon-${name}`} {...props} />,
}));

// Component that throws an error
function ThrowError({ shouldThrow, error }: { shouldThrow: boolean; error?: Error }) {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should not show error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });

    it('should display error message in fallback UI', () => {
      const errorMessage = 'Custom error message';
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error(errorMessage)} />
        </ErrorBoundary>
      );

      // Open technical details
      const details = screen.getByText('Technical details');
      fireEvent.click(details);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe('Test error');
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = (error: Error, reset: () => void) => (
        <div>
          <p>Custom error: {error.message}</p>
          <button onClick={reset}>Custom Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} error={new Error('Custom error message')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error: Custom error message')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('should call reset function from custom fallback', () => {
      let shouldThrow = true;
      const customFallback = (error: Error, reset: () => void) => (
        <button onClick={reset}>Reset</button>
      );

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>No error</div>;
      };

      const { rerender } = render(
        <ErrorBoundary fallback={customFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      const resetButton = screen.getByText('Reset');
      
      // Change the condition before clicking reset
      shouldThrow = false;
      fireEvent.click(resetButton);

      // After reset, component should render without error
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Default Fallback UI', () => {
    it('should show retry button for network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Failed to fetch data')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show reload page button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should show go back button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('should display user-friendly message for network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('network timeout')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for permission errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('permission denied')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    });

    it('should display user-friendly message for not found errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('resource not found')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    });

    it('should display generic message for unknown errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Unknown error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset error state when retry button clicked', () => {
      let shouldThrow = true;
      
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('network error');
        }
        return <div>No error</div>;
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      const retryButton = screen.getByText('Retry');
      
      // Change the condition before clicking retry
      shouldThrow = false;
      fireEvent.click(retryButton);

      // After retry, component should render without error
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Technical Details', () => {
    it('should show technical details when expanded', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Detailed error message')} />
        </ErrorBoundary>
      );

      const detailsToggle = screen.getByText('Technical details');
      fireEvent.click(detailsToggle);

      expect(screen.getByText('Detailed error message')).toBeInTheDocument();
    });

    it('should hide technical details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} error={new Error('Hidden error')} />
        </ErrorBoundary>
      );

      // Details should not be visible initially
      const errorText = screen.queryByText('Hidden error');
      expect(errorText).not.toBeVisible();
    });
  });
});

describe('PageErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <PageErrorBoundary>
        <div>Page content</div>
      </PageErrorBoundary>
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('should show page-specific error UI when error occurs', () => {
    render(
      <PageErrorBoundary pageName="Dashboard">
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    expect(screen.getByText(/Error loading Dashboard/i)).toBeInTheDocument();
  });

  it('should show generic page error when no page name provided', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Page Error')).toBeInTheDocument();
  });

  it('should show try again button', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should show go to dashboard button', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
  });

  it('should display error details when expanded', () => {
    render(
      <PageErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Page error details')} />
      </PageErrorBoundary>
    );

    const detailsToggle = screen.getByText('Error details');
    fireEvent.click(detailsToggle);

    // Use getAllByText since the error message appears in multiple places (message and stack)
    const errorMessages = screen.getAllByText(/Page error details/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });
});

describe('ComponentErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <ComponentErrorBoundary>
        <div>Component content</div>
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Component content')).toBeInTheDocument();
  });

  it('should show component-specific error UI when error occurs', () => {
    render(
      <ComponentErrorBoundary componentName="UserProfile">
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText(/Error in UserProfile/i)).toBeInTheDocument();
  });

  it('should show generic component error when no component name provided', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('should show inline error message', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText(/couldn't be displayed/i)).toBeInTheDocument();
  });

  it('should show retry button', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display error details when expanded', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} error={new Error('Component error details')} />
      </ComponentErrorBoundary>
    );

    const detailsToggle = screen.getByText('Show details');
    fireEvent.click(detailsToggle);

    expect(screen.getByText('Component error details')).toBeInTheDocument();
  });

  it('should have inline styling appropriate for component errors', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    // Find the parent container with the bg-volcano-50 class
    const errorContainer = screen.getByText(/couldn't be displayed/i).closest('.bg-volcano-50');
    expect(errorContainer).toBeInTheDocument();
  });
});
