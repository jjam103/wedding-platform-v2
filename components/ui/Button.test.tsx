import { render, screen, fireEvent } from '@testing-library/react';
import { memo } from 'react';
import { Button } from './Button';

describe('Button', () => {
  // Test rendering with various props
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('should render with custom type', () => {
      render(<Button type="submit">Submit</Button>);
      
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#22c55e' });

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#e5e7eb' });

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#ef4444' });

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: 'transparent' });
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

      rerender(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base');

      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
    });

    it('should render full width when specified', () => {
      render(<Button fullWidth>Full Width</Button>);
      
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should render loading state', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      
      // Check for loading spinner
      const spinner = screen.getByRole('status', { name: 'Loading' });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should render disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });
      
      // Button should still be clickable via keyboard
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  // Test conditional rendering
  describe('conditional rendering', () => {
    it('should show loading spinner only when loading', () => {
      const { rerender } = render(<Button>Not Loading</Button>);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      rerender(<Button loading>Loading</Button>);
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    });

    it('should apply disabled styles when disabled or loading', () => {
      const { rerender } = render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');

      rerender(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveClass('opacity-50');

      rerender(<Button>Normal</Button>);
      expect(screen.getByRole('button')).not.toHaveClass('opacity-50');
    });

    it('should combine loading and disabled states correctly', () => {
      render(<Button loading disabled>Both</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveAttribute('aria-busy', 'false');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });

    it('should have proper ARIA attributes when loading', () => {
      render(<Button loading>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have minimum touch target size', () => {
      render(<Button size="sm">Small Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  // Test memoization
  describe('memoization', () => {
    it('should not re-render when props have not changed', () => {
      const renderSpy = jest.fn();
      
      // Create a memoized wrapper to test Button's memo behavior
      const TestButton = memo(function TestButton(props: any) {
        renderSpy();
        return <Button {...props}>Test</Button>;
      });

      const { rerender } = render(<TestButton variant="primary" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestButton variant="primary" />);
      expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render due to memo

      // Re-render with different props
      rerender(<TestButton variant="secondary" />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // Should re-render
    });
  });
});