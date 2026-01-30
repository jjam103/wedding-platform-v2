import { render, screen, fireEvent } from '@testing-library/react';
import { TropicalButton, TropicalIconButton } from './TropicalButton';

// Mock TropicalIcon component
jest.mock('./TropicalIcon', () => ({
  TropicalIcon: ({ name, size }: { name: string; size: string }) => (
    <span data-testid={`icon-${name}`} data-size={size}>
      Icon-{name}
    </span>
  ),
}));

describe('TropicalButton', () => {
  // Test rendering with various props
  describe('rendering', () => {
    it('should render with children', () => {
      render(<TropicalButton>Click me</TropicalButton>);
      
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render with default type button', () => {
      render(<TropicalButton>Button</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should render with custom type', () => {
      render(<TropicalButton type="submit">Submit</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should render with primary variant by default', () => {
      render(<TropicalButton>Primary</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveClass('bg-jungle-500');
    });

    it('should render with different variants', () => {
      const { rerender } = render(<TropicalButton variant="secondary">Secondary</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-white', 'border-2');

      rerender(<TropicalButton variant="success">Success</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-ocean-500');

      rerender(<TropicalButton variant="warning">Warning</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-sunset-500');

      rerender(<TropicalButton variant="danger">Danger</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('bg-volcano-500');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<TropicalButton size="sm">Small</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm');

      rerender(<TropicalButton size="md">Medium</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');

      rerender(<TropicalButton size="lg">Large</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-lg');
    });

    it('should render full width when specified', () => {
      render(<TropicalButton fullWidth>Full Width</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('should render with custom className', () => {
      render(<TropicalButton className="custom-class">Custom</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should render with icon on left by default', () => {
      render(<TropicalButton icon="palm">With Icon</TropicalButton>);
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon-palm');
      
      expect(button).toContainElement(icon);
      expect(icon).toHaveAttribute('data-size', 'md');
    });

    it('should render with icon on right', () => {
      render(<TropicalButton icon="wave" iconPosition="right">Icon Right</TropicalButton>);
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon-wave');
      
      expect(button).toContainElement(icon);
    });

    it('should render loading state', () => {
      render(<TropicalButton loading>Loading</TropicalButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Check for loading spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(<TropicalButton disabled>Disabled</TropicalButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<TropicalButton onClick={handleClick}>Click me</TropicalButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<TropicalButton onClick={handleClick} disabled>Disabled</TropicalButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<TropicalButton onClick={handleClick} loading>Loading</TropicalButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Test conditional rendering
  describe('conditional rendering', () => {
    it('should show loading spinner only when loading', () => {
      const { rerender } = render(<TropicalButton>Not Loading</TropicalButton>);
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      rerender(<TropicalButton loading>Loading</TropicalButton>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide icon when loading', () => {
      const { rerender } = render(<TropicalButton icon="palm">With Icon</TropicalButton>);
      expect(screen.getByTestId('icon-palm')).toBeInTheDocument();

      rerender(<TropicalButton icon="palm" loading>Loading</TropicalButton>);
      expect(screen.queryByTestId('icon-palm')).not.toBeInTheDocument();
    });

    it('should apply disabled styles when disabled or loading', () => {
      const { rerender } = render(<TropicalButton disabled>Disabled</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');

      rerender(<TropicalButton loading>Loading</TropicalButton>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');

      rerender(<TropicalButton>Normal</TropicalButton>);
      expect(screen.getByRole('button')).not.toHaveClass('opacity-50');
    });

    it('should use correct icon size based on button size', () => {
      const { rerender } = render(<TropicalButton icon="sun" size="sm">Small</TropicalButton>);
      expect(screen.getByTestId('icon-sun')).toHaveAttribute('data-size', 'sm');

      rerender(<TropicalButton icon="sun" size="md">Medium</TropicalButton>);
      expect(screen.getByTestId('icon-sun')).toHaveAttribute('data-size', 'md');

      rerender(<TropicalButton icon="sun" size="lg">Large</TropicalButton>);
      expect(screen.getByTestId('icon-sun')).toHaveAttribute('data-size', 'md');
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have tap-target class for touch devices', () => {
      render(<TropicalButton>Touch Friendly</TropicalButton>);
      
      expect(screen.getByRole('button')).toHaveClass('tap-target');
    });

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<TropicalButton onClick={handleClick}>Keyboard</TropicalButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});

describe('TropicalIconButton', () => {
  // Test rendering with various props
  describe('rendering', () => {
    it('should render with icon', () => {
      render(<TropicalIconButton icon="palm" ariaLabel="Palm tree" />);
      
      expect(screen.getByTestId('icon-palm')).toBeInTheDocument();
    });

    it('should have proper aria-label', () => {
      render(<TropicalIconButton icon="wave" ariaLabel="Ocean wave" />);
      
      const button = screen.getByRole('button', { name: 'Ocean wave' });
      expect(button).toHaveAttribute('aria-label', 'Ocean wave');
    });

    it('should render with primary variant by default', () => {
      render(<TropicalIconButton icon="sun" ariaLabel="Sun" />);
      
      expect(screen.getByRole('button')).toHaveClass('bg-jungle-500');
    });

    it('should render with different variants', () => {
      const { rerender } = render(
        <TropicalIconButton icon="flower" variant="secondary" ariaLabel="Flower" />
      );
      expect(screen.getByRole('button')).toHaveClass('bg-white', 'border-2');

      rerender(<TropicalIconButton icon="flower" variant="success" ariaLabel="Flower" />);
      expect(screen.getByRole('button')).toHaveClass('bg-ocean-500');

      rerender(<TropicalIconButton icon="flower" variant="warning" ariaLabel="Flower" />);
      expect(screen.getByRole('button')).toHaveClass('bg-sunset-500');

      rerender(<TropicalIconButton icon="flower" variant="danger" ariaLabel="Flower" />);
      expect(screen.getByRole('button')).toHaveClass('bg-volcano-500');
    });

    it('should render with different sizes', () => {
      const { rerender } = render(
        <TropicalIconButton icon="bird" size="sm" ariaLabel="Bird" />
      );
      expect(screen.getByRole('button')).toHaveClass('p-2');
      expect(screen.getByTestId('icon-bird')).toHaveAttribute('data-size', 'sm');

      rerender(<TropicalIconButton icon="bird" size="md" ariaLabel="Bird" />);
      expect(screen.getByRole('button')).toHaveClass('p-3');
      expect(screen.getByTestId('icon-bird')).toHaveAttribute('data-size', 'md');

      rerender(<TropicalIconButton icon="bird" size="lg" ariaLabel="Bird" />);
      expect(screen.getByRole('button')).toHaveClass('p-4');
      expect(screen.getByTestId('icon-bird')).toHaveAttribute('data-size', 'lg');
    });

    it('should render disabled state', () => {
      render(<TropicalIconButton icon="volcano" disabled ariaLabel="Volcano" />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should have rounded-full class', () => {
      render(<TropicalIconButton icon="beach" ariaLabel="Beach" />);
      
      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<TropicalIconButton icon="palm" onClick={handleClick} ariaLabel="Palm" />);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <TropicalIconButton icon="palm" onClick={handleClick} disabled ariaLabel="Palm" />
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have tap-target class for touch devices', () => {
      render(<TropicalIconButton icon="wave" ariaLabel="Wave" />);
      
      expect(screen.getByRole('button')).toHaveClass('tap-target');
    });

    it('should require aria-label', () => {
      render(<TropicalIconButton icon="sun" ariaLabel="Sunshine" />);
      
      expect(screen.getByRole('button', { name: 'Sunshine' })).toBeInTheDocument();
    });
  });
});
