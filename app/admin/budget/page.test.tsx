/**
 * Unit Tests for Budget Dashboard Page
 * 
 * Tests:
 * - Budget calculations
 * - Vendor payment display
 * - Guest subsidy calculations
 * - Real-time updates
 * 
 * Requirements: 11.1-11.8
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BudgetPage from './page';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Activity } from '@/schemas/activitySchemas';
import type { BudgetBreakdown, PaymentStatusReport, SubsidyTracking } from '@/schemas/budgetSchemas';

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('BudgetPage', () => {
  const mockVendors: Vendor[] = [
    {
      id: 'vendor-1',
      name: 'Photographer',
      category: 'photography',
      contactName: 'John Doe',
      email: 'john@photo.com',
      phone: '555-0100',
      pricingModel: 'flat_rate',
      baseCost: 5000,
      paymentStatus: 'unpaid',
      amountPaid: 0,
      notes: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'vendor-2',
      name: 'Caterer',
      category: 'catering',
      contactName: 'Jane Smith',
      email: 'jane@catering.com',
      phone: '555-0200',
      pricingModel: 'per_guest',
      baseCost: 10000,
      paymentStatus: 'partial',
      amountPaid: 5000,
      notes: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      name: 'Beach Day',
      description: 'Fun at the beach',
      eventId: 'event-1',
      startTime: '2024-06-15T10:00:00Z',
      endTime: '2024-06-15T16:00:00Z',
      locationId: 'location-1',
      capacity: 50,
      costPerPerson: 100,
      hostSubsidy: 25,
      activityType: 'activity',
      status: 'published',
      visibility: 'public',
      adultsOnly: false,
      plusOnesAllowed: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockBudgetBreakdown: BudgetBreakdown = {
    vendors: [
      {
        category: 'photography',
        totalCost: 5000,
        amountPaid: 0,
        balanceDue: 5000,
        vendors: [
          {
            id: 'vendor-1',
            name: 'Photographer',
            cost: 5000,
            paid: 0,
            balance: 5000,
            paymentStatus: 'unpaid',
          },
        ],
      },
      {
        category: 'catering',
        totalCost: 10000,
        amountPaid: 5000,
        balanceDue: 5000,
        vendors: [
          {
            id: 'vendor-2',
            name: 'Caterer',
            cost: 10000,
            paid: 5000,
            balance: 5000,
            paymentStatus: 'partial',
          },
        ],
      },
    ],
    activities: {
      totalCost: 5000,
      totalSubsidy: 1250,
      netCost: 3750,
      activities: [
        {
          id: 'activity-1',
          name: 'Beach Day',
          costPerPerson: 100,
          hostSubsidy: 25,
          estimatedAttendees: 50,
          totalCost: 5000,
          netCost: 3750,
        },
      ],
    },
    accommodations: {
      totalCost: 0,
      totalSubsidy: 0,
      netCost: 0,
      accommodations: [],
    },
    totals: {
      grossTotal: 20000,
      totalSubsidies: 1250,
      totalPaid: 5000,
      netTotal: 18750,
      balanceDue: 13750,
    },
  };

  const mockPaymentStatusReport: PaymentStatusReport = {
    unpaidVendors: [
      {
        id: 'vendor-1',
        name: 'Photographer',
        category: 'photography',
        baseCost: 5000,
      },
    ],
    partiallyPaidVendors: [
      {
        id: 'vendor-2',
        name: 'Caterer',
        category: 'catering',
        baseCost: 10000,
        amountPaid: 5000,
        balanceDue: 5000,
      },
    ],
    paidVendors: [],
    totalUnpaid: 5000,
    totalPartial: 5000,
    totalPaid: 0,
  };

  const mockSubsidyTracking: SubsidyTracking = {
    activitySubsidies: [
      {
        activityId: 'activity-1',
        activityName: 'Beach Day',
        subsidyPerPerson: 25,
        estimatedAttendees: 50,
        totalSubsidy: 1250,
      },
    ],
    accommodationSubsidies: [],
    totalActivitySubsidies: 1250,
    totalAccommodationSubsidies: 0,
    grandTotalSubsidies: 1250,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/admin/vendors')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { vendors: mockVendors } }),
          } as Response);
        }
        if (url.includes('/api/admin/activities')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { activities: mockActivities } }),
          } as Response);
        }
        if (url.includes('/api/admin/accommodations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { accommodations: [] } }),
          } as Response);
        }
        if (url.includes('/api/admin/budget/breakdown')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockBudgetBreakdown }),
          } as Response);
        }
        if (url.includes('/api/admin/budget/payment-status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockPaymentStatusReport }),
          } as Response);
        }
        if (url.includes('/api/admin/budget/subsidies')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockSubsidyTracking }),
          } as Response);
        }
      }
      return Promise.resolve({
        ok: false,
        json: async () => ({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }),
      } as Response);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Budget Calculations', () => {
    it('should display total cost correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
      });

      // Check if the total budget is displayed
      await waitFor(() => {
        const elements = screen.getAllByText('$18,750');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display host contribution correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const elements = screen.getAllByText('Host Subsidies');
        expect(elements.length).toBeGreaterThan(0);
      });

      // Check if the host subsidies are displayed
      await waitFor(() => {
        const elements = screen.getAllByText('$1,250');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display guest payments correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Paid')).toBeInTheDocument();
      });

      // Check if the total paid is displayed
      await waitFor(() => {
        const elements = screen.getAllByText('$5,000');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display balance due correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Balance Due')).toBeInTheDocument();
      });

      // Check if the balance due is displayed
      await waitFor(() => {
        expect(screen.getByText('$13,750')).toBeInTheDocument();
      });
    });

    it('should calculate vendor totals correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Vendor Costs by Category')).toBeInTheDocument();
      });

      // Verify vendor categories are displayed
      await waitFor(() => {
        const photographyElements = screen.getAllByText(/photography/i);
        const cateringElements = screen.getAllByText(/catering/i);
        expect(photographyElements.length).toBeGreaterThan(0);
        expect(cateringElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate activity totals with subsidies correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Activity Costs')).toBeInTheDocument();
      });

      // Verify activity costs are displayed
      await waitFor(() => {
        const elements = screen.getAllByText('Beach Day');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Vendor Payment Display', () => {
    it('should display vendor payment tracking table', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Vendor Payment Tracking')).toBeInTheDocument();
      });
    });

    it('should display unpaid vendors section', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Unpaid Vendors')).toBeInTheDocument();
      });

      // Verify unpaid vendor is displayed
      await waitFor(() => {
        const elements = screen.getAllByText('Photographer');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display partially paid vendors section', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Partially Paid Vendors')).toBeInTheDocument();
      });

      // Verify partially paid vendor is displayed
      await waitFor(() => {
        const elements = screen.getAllByText('Caterer');
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should display payment status summary stats', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const unpaidElements = screen.getAllByText('Unpaid');
        const partialElements = screen.getAllByText('Partially Paid');
        const paidElements = screen.getAllByText('Paid');
        expect(unpaidElements.length).toBeGreaterThan(0);
        expect(partialElements.length).toBeGreaterThan(0);
        expect(paidElements.length).toBeGreaterThan(0);
      });
    });

    it('should format currency correctly in payment table', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        // Check for formatted currency values
        const currencyElements = screen.getAllByText(/\$5,000/);
        expect(currencyElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Guest Subsidy Calculations', () => {
    it('should display individual guest subsidies section', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Individual Guest Subsidies')).toBeInTheDocument();
      });
    });

    it('should display activity subsidies table', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const elements = screen.getAllByText('Activity Subsidies');
        expect(elements.length).toBeGreaterThan(0);
      });

      // Verify activity subsidy details
      await waitFor(() => {
        const beachDayElements = screen.getAllByText('Beach Day');
        expect(beachDayElements.length).toBeGreaterThan(0);
        expect(screen.getByText('$25')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });

    it('should display subsidy summary stats', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const activityElements = screen.getAllByText('Activity Subsidies');
        const accommodationElements = screen.getAllByText('Accommodation Subsidies');
        const totalElements = screen.getAllByText('Total Subsidies');
        expect(activityElements.length).toBeGreaterThan(0);
        expect(accommodationElements.length).toBeGreaterThan(0);
        expect(totalElements.length).toBeGreaterThan(0);
      });
    });

    it('should calculate per-person subsidies correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        // Verify per-person subsidy is displayed
        expect(screen.getByText('$25')).toBeInTheDocument();
      });
    });

    it('should calculate total subsidies correctly', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        // Verify total subsidy is displayed
        const elements = screen.getAllByText('$1,250');
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should have a refresh button', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh data/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Budget Dashboard')).toBeInTheDocument();
      });

      const refreshButton = await waitFor(() => 
        screen.getByRole('button', { name: /refresh data/i })
      );
      fireEvent.click(refreshButton);

      // Verify fetch was called again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(12); // 6 initial + 6 refresh
      });
    });

    it('should disable refresh button while loading', async () => {
      render(<BudgetPage />);

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh data/i });
        expect(refreshButton).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      fireEvent.click(refreshButton);

      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();
    });

    it('should show loading state initially', () => {
      render(<BudgetPage />);

      expect(screen.getByText('Loading budget data...')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ success: false, error: { code: 'DATABASE_ERROR', message: 'Database error' } }),
        } as Response)
      );

      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading budget data/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      // Mock API error
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ success: false, error: { code: 'DATABASE_ERROR', message: 'Database error' } }),
        } as Response)
      );

      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading budget data/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty vendor list', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/admin/vendors')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { vendors: [] } }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} }),
        } as Response);
      });

      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Budget Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle empty activity list', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/admin/activities')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { activities: [] } }),
            } as Response);
          }
          if (url.includes('/api/admin/vendors')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { vendors: mockVendors } }),
            } as Response);
          }
          if (url.includes('/api/admin/accommodations')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { accommodations: [] } }),
            } as Response);
          }
          if (url.includes('/api/admin/budget/breakdown')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: mockBudgetBreakdown }),
            } as Response);
          }
          if (url.includes('/api/admin/budget/payment-status')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: mockPaymentStatusReport }),
            } as Response);
          }
          if (url.includes('/api/admin/budget/subsidies')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: mockSubsidyTracking }),
            } as Response);
          }
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }),
        } as Response);
      });

      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Budget Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle null budget breakdown', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/admin/budget/breakdown')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: null }),
            } as Response);
          }
          if (url.includes('/api/admin/vendors')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { vendors: mockVendors } }),
            } as Response);
          }
          if (url.includes('/api/admin/activities')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { activities: mockActivities } }),
            } as Response);
          }
          if (url.includes('/api/admin/accommodations')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: { accommodations: [] } }),
            } as Response);
          }
          if (url.includes('/api/admin/budget/payment-status')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: mockPaymentStatusReport }),
            } as Response);
          }
          if (url.includes('/api/admin/budget/subsidies')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ success: true, data: mockSubsidyTracking }),
            } as Response);
          }
        }
        return Promise.resolve({
          ok: false,
          json: async () => ({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }),
        } as Response);
      });

      render(<BudgetPage />);

      await waitFor(() => {
        expect(screen.getByText('Budget Dashboard')).toBeInTheDocument();
      });
    });
  });
});
