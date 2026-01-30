/**
 * Unit Tests for BudgetDashboard Component
 * 
 * Tests:
 * - Budget calculations and display
 * - Vendor categorization
 * - Payment progress visualization
 * - Data loading states
 * - Error handling
 * 
 * Requirements: Budget dashboard functionality
 */

import { render, screen, cleanup } from '@testing-library/react';
import BudgetDashboard from './BudgetDashboard';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Activity } from '@/schemas/activitySchemas';
import type { Accommodation } from '@/schemas/accommodationSchemas';
import type { BudgetBreakdown, PaymentStatusReport, SubsidyTracking } from '@/schemas/budgetSchemas';

// Mock data
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Photographer',
    category: 'photography',
    baseCost: 2000,
    amountPaid: 1000,
    balanceDue: 1000,
    paymentStatus: 'partial',
    contactInfo: { email: 'photo@example.com' },
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Caterer',
    category: 'catering',
    baseCost: 5000,
    amountPaid: 5000,
    balanceDue: 0,
    paymentStatus: 'paid',
    contactInfo: { email: 'catering@example.com' },
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'DJ',
    category: 'music',
    baseCost: 1500,
    amountPaid: 0,
    balanceDue: 1500,
    paymentStatus: 'unpaid',
    contactInfo: { email: 'dj@example.com' },
    notes: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Welcome Dinner',
    description: 'Welcome dinner for all guests',
    date: '2024-06-01',
    startTime: '19:00',
    endTime: '22:00',
    locationId: 'loc1',
    capacity: 50,
    costPerPerson: 75,
    hostSubsidy: 25,
    adultsOnly: false,
    allowPlusOnes: true,
    activityType: 'meal',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Beach Excursion',
    description: 'Day trip to the beach',
    date: '2024-06-02',
    startTime: '09:00',
    endTime: '17:00',
    locationId: 'loc2',
    capacity: 30,
    costPerPerson: 100,
    hostSubsidy: 0,
    adultsOnly: false,
    allowPlusOnes: true,
    activityType: 'activity',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockAccommodations: Accommodation[] = [];

const mockPaymentStatusReport: PaymentStatusReport = {
  totalUnpaid: 1500,
  totalPartial: 1000,
  totalPaid: 5000,
  unpaidVendors: [mockVendors[2]],
  partiallyPaidVendors: [mockVendors[0]],
  paidVendors: [mockVendors[1]],
};

const mockSubsidyTracking: SubsidyTracking = {
  totalActivitySubsidies: 1250,
  totalAccommodationSubsidies: 0,
  grandTotalSubsidies: 1250,
  activitySubsidies: [
    {
      activityId: '1',
      activityName: 'Welcome Dinner',
      subsidyPerPerson: 25,
      estimatedAttendees: 50,
      totalSubsidy: 1250,
    },
  ],
  accommodationSubsidies: [],
};

describe('BudgetDashboard', () => {
  afterEach(() => {
    cleanup();
  });

  describe('Summary Cards', () => {
    it('should display total budget correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Total budget should be vendor costs + activity net costs
      // Vendors: 8500, Activities: (50*75 + 30*100) - (50*25) = 6500 - 1250 = 5250
      // Total: 8500 + 5250 = 13750
      expect(screen.getByText('$13,750')).toBeInTheDocument();
    });

    it('should display total paid correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Only vendor payments count as "paid"
      expect(screen.getByText('$6,000')).toBeInTheDocument();
    });

    it('should display balance due correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Balance due = Total budget - Total paid
      // 13750 - 6000 = 7750
      expect(screen.getByText('$7,750')).toBeInTheDocument();
    });

    it('should display host subsidies correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Host subsidies from activities: 50 * 25 = 1250
      expect(screen.getByText('$1,250')).toBeInTheDocument();
    });

    it('should calculate percentages correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Payment percentage: 6000/13750 = 44%
      expect(screen.getByText('44% of budget')).toBeInTheDocument();
      
      // Balance percentage: 7750/13750 = 56%
      expect(screen.getByText('56% remaining')).toBeInTheDocument();
    });
  });

  describe('Vendor Categories', () => {
    it('should group vendors by category', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('Catering')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('should display vendor counts per category', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('1 vendor')).toBeInTheDocument();
    });

    it('should show category totals', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Photography: $2,000
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      // Catering: $5,000
      expect(screen.getByText('$5,000')).toBeInTheDocument();
      // Music: $1,500
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });

    it('should display balance due for unpaid categories', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Should show balance for photography (partial) and music (unpaid)
      expect(screen.getByText('Balance: $1,000')).toBeInTheDocument();
      expect(screen.getByText('Balance: $1,500')).toBeInTheDocument();
    });
  });

  describe('Activity Costs', () => {
    it('should display activity cost breakdown', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Total cost: (50*75) + (30*100) = 3750 + 3000 = 6750
      expect(screen.getByText('$6,750')).toBeInTheDocument();
      
      // Host subsidy: 50*25 = 1250
      expect(screen.getByText('$1,250')).toBeInTheDocument();
      
      // Guest cost: 6750 - 1250 = 5500
      expect(screen.getByText('$5,500')).toBeInTheDocument();
    });

    it('should list individual activities with costs', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      expect(screen.getByText('Beach Excursion')).toBeInTheDocument();
      
      // Activity details
      expect(screen.getByText('$75/person × 50 guests')).toBeInTheDocument();
      expect(screen.getByText('$100/person × 30 guests')).toBeInTheDocument();
    });

    it('should show subsidies for activities that have them', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Welcome Dinner has subsidy
      expect(screen.getByText('Subsidy: $1,250')).toBeInTheDocument();
    });

    it('should handle activities without costs', () => {
      const activitiesWithoutCosts = [
        {
          ...mockActivities[0],
          costPerPerson: undefined,
        },
      ];

      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={activitiesWithoutCosts}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('No paid activities yet')).toBeInTheDocument();
    });
  });

  describe('Payment Status Report', () => {
    it('should display payment status summary when provided', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          paymentStatusReport={mockPaymentStatusReport}
        />
      );

      expect(screen.getByText('Vendor Payment Tracking')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument(); // Unpaid
      expect(screen.getByText('$1,000')).toBeInTheDocument(); // Partial
      expect(screen.getByText('$5,000')).toBeInTheDocument(); // Paid
    });

    it('should display unpaid vendors table', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          paymentStatusReport={mockPaymentStatusReport}
        />
      );

      expect(screen.getByText('Unpaid Vendors')).toBeInTheDocument();
      expect(screen.getByText('DJ')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });

    it('should display partially paid vendors table', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          paymentStatusReport={mockPaymentStatusReport}
        />
      );

      expect(screen.getByText('Partially Paid Vendors')).toBeInTheDocument();
      expect(screen.getByText('Photographer')).toBeInTheDocument();
    });

    it('should display paid vendors table', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          paymentStatusReport={mockPaymentStatusReport}
        />
      );

      expect(screen.getByText('Paid Vendors')).toBeInTheDocument();
      expect(screen.getByText('Caterer')).toBeInTheDocument();
    });
  });

  describe('Subsidy Tracking', () => {
    it('should display subsidy tracking when provided', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          subsidyTracking={mockSubsidyTracking}
        />
      );

      expect(screen.getByText('Individual Guest Subsidies')).toBeInTheDocument();
      expect(screen.getByText('$1,250')).toBeInTheDocument(); // Activity subsidies
    });

    it('should display activity subsidies table', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          subsidyTracking={mockSubsidyTracking}
        />
      );

      expect(screen.getByText('Activity Subsidies')).toBeInTheDocument();
      expect(screen.getByText('Welcome Dinner')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument(); // Per person
      expect(screen.getByText('50')).toBeInTheDocument(); // Attendees
    });

    it('should show message when no subsidies configured', () => {
      const emptySubsidyTracking: SubsidyTracking = {
        totalActivitySubsidies: 0,
        totalAccommodationSubsidies: 0,
        grandTotalSubsidies: 0,
        activitySubsidies: [],
        accommodationSubsidies: [],
      };

      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
          subsidyTracking={emptySubsidyTracking}
        />
      );

      expect(screen.getByText('No subsidies configured yet')).toBeInTheDocument();
    });
  });

  describe('Over Budget Warning', () => {
    it('should display over budget warning for vendors exceeding budget', () => {
      const overBudgetVendors = [
        {
          ...mockVendors[0],
          amountPaid: 2500, // More than baseCost of 2000
          balanceDue: -500,
        },
      ];

      render(
        <BudgetDashboard
          vendors={overBudgetVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('⚠️ Items Exceeding Budget')).toBeInTheDocument();
      expect(screen.getByText('Over by: $500')).toBeInTheDocument();
    });

    it('should not display over budget section when no vendors exceed budget', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.queryByText('⚠️ Items Exceeding Budget')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should handle empty vendors array', () => {
      render(
        <BudgetDashboard
          vendors={[]}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('No vendors added yet')).toBeInTheDocument();
      expect(screen.getByText('No budget data available')).toBeInTheDocument();
    });

    it('should handle null vendors', () => {
      render(
        <BudgetDashboard
          vendors={null as any}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument(); // Total budget should show 0
    });

    it('should handle empty activities array', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={[]}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('No paid activities yet')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Should format as USD without cents
      expect(screen.getByText('$2,000')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });

    it('should handle zero amounts', () => {
      const zeroVendors = [
        {
          ...mockVendors[0],
          baseCost: 0,
          amountPaid: 0,
          balanceDue: 0,
        },
      ];

      render(
        <BudgetDashboard
          vendors={zeroVendors}
          activities={[]}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('should display payment progress bar', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      expect(screen.getByText('Payment Progress')).toBeInTheDocument();
      
      // Should show paid and remaining amounts
      expect(screen.getByText(/Paid: \$6,000/)).toBeInTheDocument();
      expect(screen.getByText(/Remaining: \$7,750/)).toBeInTheDocument();
    });

    it('should display category progress bars', () => {
      render(
        <BudgetDashboard
          vendors={mockVendors}
          activities={mockActivities}
          accommodations={mockAccommodations}
          budgetBreakdown={null}
        />
      );

      // Each category should have a progress bar (visual elements)
      const progressBars = document.querySelectorAll('.bg-jungle-500, .bg-sunset-500');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });
});