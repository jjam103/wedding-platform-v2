/**
 * Unit Tests for Vendor Management Page
 * 
 * Tests specific functionality and user interactions for vendor management.
 * Focuses on testing the collapsible form integration, payment status display,
 * and category filtering.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VendorsPage from './page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

// Mock toast context
const mockAddToast = jest.fn();
jest.mock('@/components/ui/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

/**
 * Helper to create mock vendor
 */
function createMockVendor(overrides: any = {}) {
  return {
    id: overrides.id || 'vendor-1',
    name: overrides.name || 'Test Vendor',
    category: overrides.category || 'photography',
    contactName: overrides.contactName || null,
    email: overrides.email || null,
    phone: overrides.phone || null,
    pricingModel: overrides.pricingModel || 'flat_rate',
    baseCost: overrides.baseCost !== undefined ? overrides.baseCost : 1000,
    amountPaid: overrides.amountPaid !== undefined ? overrides.amountPaid : 0,
    paymentStatus: overrides.paymentStatus || 'unpaid',
    notes: overrides.notes || null,
    createdAt: overrides.createdAt || '2025-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt || '2025-01-01T00:00:00Z',
  };
}

/**
 * Helper to setup fetch mocks
 */
function setupFetchMocks(vendors: any[] = []) {
  (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
    if (url.includes('/api/admin/vendors') && !options?.method) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { vendors },
        }),
      });
    }
    if (url.includes('/api/admin/vendors') && options?.method === 'POST') {
      const body = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: createMockVendor({ ...body, id: 'new-vendor-id' }),
        }),
      });
    }
    if (url.includes('/api/admin/vendors') && options?.method === 'PUT') {
      const body = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: createMockVendor({ ...vendors[0], ...body }),
        }),
      });
    }
    if (url.includes('/api/admin/vendors') && options?.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: undefined,
        }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { message: 'Not found' } }),
    });
  });
}

describe('VendorsPage - Basic Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMocks([]);
  });

  it('should render the vendors page with title and description', async () => {
    render(<VendorsPage />);

    expect(screen.getByText('Vendor Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your wedding vendors and track payments')).toBeInTheDocument();
  });

  it('should render collapsible form component', async () => {
    render(<VendorsPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Form toggle button should be present
    expect(screen.getByText('Add Vendor')).toBeInTheDocument();
  });
});

describe('VendorsPage - Payment Status Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display payment status badges correctly', async () => {
    const vendors = [
      createMockVendor({ id: '1', name: 'Unpaid Vendor', paymentStatus: 'unpaid' }),
      createMockVendor({ id: '2', name: 'Partial Vendor', paymentStatus: 'partial', amountPaid: 500 }),
      createMockVendor({ id: '3', name: 'Paid Vendor', paymentStatus: 'paid', amountPaid: 1000 }),
    ];

    setupFetchMocks(vendors);

    render(<VendorsPage />);

    // Wait for vendors to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check for payment status badges
    await waitFor(() => {
      expect(screen.getByText('UNPAID')).toBeInTheDocument();
      expect(screen.getByText('PARTIAL')).toBeInTheDocument();
      expect(screen.getByText('PAID')).toBeInTheDocument();
    });
  });

  it('should display vendor categories correctly', async () => {
    const vendors = [
      createMockVendor({ id: '1', name: 'Photographer', category: 'photography' }),
      createMockVendor({ id: '2', name: 'Caterer', category: 'catering' }),
      createMockVendor({ id: '3', name: 'Florist', category: 'flowers' }),
    ];

    setupFetchMocks(vendors);

    render(<VendorsPage />);

    // Wait for vendors to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that all vendors are displayed
    await waitFor(() => {
      expect(screen.getByText('Photographer')).toBeInTheDocument();
      expect(screen.getByText('Caterer')).toBeInTheDocument();
      expect(screen.getByText('Florist')).toBeInTheDocument();
    });

    // Check that category labels are displayed
    expect(screen.getByText('Photography')).toBeInTheDocument();
    expect(screen.getByText('Catering')).toBeInTheDocument();
    expect(screen.getByText('Flowers')).toBeInTheDocument();
  });
});

describe('VendorsPage - Collapsible Form Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMocks([]);
  });

  it('should toggle form visibility when clicking add vendor button', async () => {
    render(<VendorsPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Initially form fields should not be visible
    expect(screen.queryByLabelText(/Vendor Name/i)).not.toBeInTheDocument();

    // Click the toggle to open form
    const addButton = screen.getByText('Add Vendor');
    fireEvent.click(addButton);

    // Form should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/Vendor Name/i)).toBeInTheDocument();
    });
  });

  it('should display form fields for vendor creation', async () => {
    render(<VendorsPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open the form
    const addButton = screen.getByText('Add Vendor');
    fireEvent.click(addButton);

    // Wait for form to open
    await waitFor(() => {
      expect(screen.getByLabelText(/Vendor Name/i)).toBeInTheDocument();
    });

    // Check that all required fields are present
    expect(screen.getByLabelText(/Vendor Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pricing Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Base Cost/i)).toBeInTheDocument();
  });
});

describe('VendorsPage - Vendor Data Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display vendor list with correct data', async () => {
    const vendors = [
      createMockVendor({
        id: '1',
        name: 'Test Photographer',
        category: 'photography',
        baseCost: 2500,
        amountPaid: 1000,
        paymentStatus: 'partial',
      }),
    ];

    setupFetchMocks(vendors);

    render(<VendorsPage />);

    // Wait for vendors to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check vendor data is displayed
    await waitFor(() => {
      expect(screen.getByText('Test Photographer')).toBeInTheDocument();
      expect(screen.getByText('Photography')).toBeInTheDocument();
      expect(screen.getByText('PARTIAL')).toBeInTheDocument();
    });
  });

  it('should calculate and display balance correctly', async () => {
    const vendor = createMockVendor({
      id: '1',
      name: 'Test Vendor',
      baseCost: 2000,
      amountPaid: 500,
    });

    setupFetchMocks([vendor]);

    const { container } = render(<VendorsPage />);

    // Wait for vendors to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that balance is calculated correctly (2000 - 500 = 1500)
    await waitFor(() => {
      const tableContent = container.textContent;
      expect(tableContent).toContain('1500.00');
    });
  });
});

describe('VendorsPage - Payment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMocks([]);
  });

  it('should validate that amount paid does not exceed base cost', async () => {
    render(<VendorsPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open the form
    const addButton = screen.getByText('Add Vendor');
    fireEvent.click(addButton);

    // Wait for form to open
    await waitFor(() => {
      expect(screen.getByLabelText(/Vendor Name/i)).toBeInTheDocument();
    });

    // Fill in form with amount paid > base cost using getElementById
    const nameInput = document.getElementById('field-name') as HTMLInputElement;
    const categorySelect = document.getElementById('field-category') as HTMLSelectElement;
    const pricingModelSelect = document.getElementById('field-pricingModel') as HTMLSelectElement;
    const baseCostInput = document.getElementById('field-baseCost') as HTMLInputElement;
    const amountPaidInput = document.getElementById('field-amountPaid') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test Vendor' } });
    fireEvent.change(categorySelect, { target: { value: 'photography' } });
    fireEvent.change(pricingModelSelect, { target: { value: 'flat_rate' } });
    fireEvent.change(baseCostInput, { target: { value: '1000' } });
    fireEvent.change(amountPaidInput, { target: { value: '1500' } });

    // Submit the form
    const submitButton = screen.getByText('Create Vendor');
    fireEvent.click(submitButton);

    // Should show error toast
    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Amount paid cannot exceed base cost'),
        })
      );
    });
  });
});
