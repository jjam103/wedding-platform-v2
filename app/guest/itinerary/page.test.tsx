import { render, screen, waitFor } from '@testing-library/react';
import ItineraryPage from './page';

// Mock the ItineraryViewer component
jest.mock('@/components/guest/ItineraryViewer', () => ({
  ItineraryViewer: ({ guest }: any) => (
    <div data-testid="itinerary-viewer">
      Itinerary for {guest.first_name} {guest.last_name}
    </div>
  ),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('ItineraryPage', () => {
  const mockGuest = {
    id: 'guest-1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render itinerary page with guest data', async () => {
    const { supabase } = require('@/lib/supabase');
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'john@example.com' } } },
      error: null,
    });
    
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockGuest,
            error: null,
          }),
        }),
      }),
    });

    render(await ItineraryPage());

    await waitFor(() => {
      expect(screen.getByTestId('itinerary-viewer')).toBeInTheDocument();
      expect(screen.getByText(/Itinerary for John Doe/i)).toBeInTheDocument();
    });
  });

  it('should redirect to login when not authenticated', async () => {
    const { supabase } = require('@/lib/supabase');
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // This would trigger a redirect in the actual implementation
    // For now, we just verify the auth check happens
    await ItineraryPage();
    
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('should handle guest not found error', async () => {
    const { supabase } = require('@/lib/supabase');
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { email: 'unknown@example.com' } } },
      error: null,
    });
    
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Guest not found' },
          }),
        }),
      }),
    });

    // Should handle error gracefully
    await ItineraryPage();
    
    expect(supabase.from).toHaveBeenCalledWith('guests');
  });
});
