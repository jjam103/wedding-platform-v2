import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge, StatusType } from './StatusBadge';

describe('StatusBadge', () => {
  describe('Badge Rendering', () => {
    it('should render event active status', () => {
      render(<StatusBadge status="event-active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Active');
    });

    it('should render event inactive status', () => {
      render(<StatusBadge status="event-inactive" />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Inactive');
    });

    it('should render page published status', () => {
      render(<StatusBadge status="page-published" />);
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Published');
    });

    it('should render page draft status', () => {
      render(<StatusBadge status="page-draft" />);
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Draft');
    });

    it('should render payment unpaid status', () => {
      render(<StatusBadge status="payment-unpaid" />);
      expect(screen.getByText('UNPAID')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: UNPAID');
    });

    it('should render payment partial status', () => {
      render(<StatusBadge status="payment-partial" />);
      expect(screen.getByText('PARTIAL')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: PARTIAL');
    });

    it('should render payment paid status', () => {
      render(<StatusBadge status="payment-paid" />);
      expect(screen.getByText('PAID')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: PAID');
    });

    it('should render capacity normal status', () => {
      render(<StatusBadge status="capacity-normal" />);
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Available');
    });

    it('should render capacity warning status', () => {
      render(<StatusBadge status="capacity-warning" />);
      expect(screen.getByText('Near Capacity')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: Near Capacity');
    });

    it('should render capacity alert status', () => {
      render(<StatusBadge status="capacity-alert" />);
      expect(screen.getByText('At Capacity')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Status: At Capacity');
    });
  });

  describe('Color Mapping', () => {
    it('should apply green color for active event', () => {
      render(<StatusBadge status="event-active" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should apply gray color for inactive event', () => {
      render(<StatusBadge status="event-inactive" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
    });

    it('should apply green color for published page', () => {
      render(<StatusBadge status="page-published" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should apply yellow color for draft page', () => {
      render(<StatusBadge status="page-draft" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
    });

    it('should apply red color for unpaid payment', () => {
      render(<StatusBadge status="payment-unpaid" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });

    it('should apply orange color for partial payment', () => {
      render(<StatusBadge status="payment-partial" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
    });

    it('should apply green color for paid payment', () => {
      render(<StatusBadge status="payment-paid" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('should apply blue color for normal capacity', () => {
      render(<StatusBadge status="capacity-normal" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
    });

    it('should apply orange color for capacity warning', () => {
      render(<StatusBadge status="capacity-warning" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-200');
    });

    it('should apply red color for capacity alert', () => {
      render(<StatusBadge status="capacity-alert" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
    });
  });

  describe('Status Display', () => {
    it('should display correct label for each status type', () => {
      const statusTests: Array<{ status: StatusType; expectedLabel: string }> = [
        { status: 'event-active', expectedLabel: 'Active' },
        { status: 'event-inactive', expectedLabel: 'Inactive' },
        { status: 'page-published', expectedLabel: 'Published' },
        { status: 'page-draft', expectedLabel: 'Draft' },
        { status: 'payment-unpaid', expectedLabel: 'UNPAID' },
        { status: 'payment-partial', expectedLabel: 'PARTIAL' },
        { status: 'payment-paid', expectedLabel: 'PAID' },
        { status: 'capacity-normal', expectedLabel: 'Available' },
        { status: 'capacity-warning', expectedLabel: 'Near Capacity' },
        { status: 'capacity-alert', expectedLabel: 'At Capacity' },
      ];

      statusTests.forEach(({ status, expectedLabel }) => {
        const { unmount } = render(<StatusBadge status={status} />);
        expect(screen.getByText(expectedLabel)).toBeInTheDocument();
        unmount();
      });
    });

    it('should apply custom className when provided', () => {
      render(<StatusBadge status="event-active" className="ml-2" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('ml-2');
    });

    it('should have proper accessibility attributes', () => {
      render(<StatusBadge status="payment-unpaid" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label');
    });

    it('should have consistent styling structure', () => {
      render(<StatusBadge status="event-active" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'px-2.5', 'py-0.5', 'rounded-full', 'text-xs', 'font-medium', 'border');
    });
  });
});
