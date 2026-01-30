import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNav, GuestMobileNav, AdminMobileNav } from './MobileNav';
import { usePathname, useRouter } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

describe('MobileNav', () => {
  const mockPush = jest.fn();
  const mockItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      href: '/home',
      activePattern: /^\/home$/,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      href: '/profile',
      activePattern: /^\/profile$/,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      href: '/settings',
      activePattern: /^\/settings$/,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/home');
  });

  // Test rendering with various props
  describe('rendering', () => {
    it('should render all navigation items', () => {
      render(<MobileNav items={mockItems} />);
      
      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should render icons for each item', () => {
      render(<MobileNav items={mockItems} />);
      
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });

    it('should have proper navigation role', () => {
      render(<MobileNav items={mockItems} />);
      
      const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
      expect(nav).toBeInTheDocument();
    });

    it('should highlight active item', () => {
      (usePathname as jest.Mock).mockReturnValue('/home');
      render(<MobileNav items={mockItems} />);
      
      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).toHaveClass('text-jungle-600', 'bg-jungle-50');
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight inactive items', () => {
      (usePathname as jest.Mock).mockReturnValue('/home');
      render(<MobileNav items={mockItems} />);
      
      const profileButton = screen.getByRole('button', { name: 'Profile' });
      expect(profileButton).toHaveClass('text-sage-600');
      expect(profileButton).not.toHaveAttribute('aria-current');
    });
  });

  // Test event handlers
  describe('event handlers', () => {
    it('should navigate when item clicked', () => {
      render(<MobileNav items={mockItems} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('should navigate to correct href for each item', () => {
      render(<MobileNav items={mockItems} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      expect(mockPush).toHaveBeenCalledWith('/home');
      
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      expect(mockPush).toHaveBeenCalledWith('/settings');
    });
  });

  // Test conditional rendering
  describe('conditional rendering', () => {
    it('should update active state when pathname changes', () => {
      const { rerender } = render(<MobileNav items={mockItems} />);
      
      let homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).toHaveClass('text-jungle-600');
      
      (usePathname as jest.Mock).mockReturnValue('/profile');
      rerender(<MobileNav items={mockItems} />);
      
      homeButton = screen.getByRole('button', { name: 'Home' });
      const profileButton = screen.getByRole('button', { name: 'Profile' });
      
      expect(homeButton).toHaveClass('text-sage-600');
      expect(profileButton).toHaveClass('text-jungle-600');
    });

    it('should handle complex active patterns', () => {
      const complexItems = [
        {
          id: 'admin',
          label: 'Admin',
          icon: '⚙️',
          href: '/admin',
          activePattern: /^\/admin/,
        },
      ];
      
      (usePathname as jest.Mock).mockReturnValue('/admin/users');
      render(<MobileNav items={complexItems} />);
      
      const adminButton = screen.getByRole('button', { name: 'Admin' });
      expect(adminButton).toHaveClass('text-jungle-600');
      expect(adminButton).toHaveAttribute('aria-current', 'page');
    });
  });

  // Test accessibility
  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MobileNav items={mockItems} />);
      
      expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-label', 'Home');
      expect(screen.getByRole('button', { name: 'Profile' })).toHaveAttribute('aria-label', 'Profile');
    });

    it('should have aria-current on active item', () => {
      (usePathname as jest.Mock).mockReturnValue('/home');
      render(<MobileNav items={mockItems} />);
      
      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).toHaveAttribute('aria-current', 'page');
    });

    it('should have touch-friendly tap targets', () => {
      render(<MobileNav items={mockItems} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('tap-target');
      });
    });
  });
});

describe('GuestMobileNav', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/guest/dashboard');
  });

  it('should render guest navigation items', () => {
    render(<GuestMobileNav />);
    
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RSVP' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Photos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Family' })).toBeInTheDocument();
  });

  it('should navigate to guest routes', () => {
    render(<GuestMobileNav />);
    
    fireEvent.click(screen.getByRole('button', { name: 'RSVP' }));
    expect(mockPush).toHaveBeenCalledWith('/guest/rsvp');
  });
});

describe('AdminMobileNav', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/admin');
  });

  it('should render admin navigation items', () => {
    render(<AdminMobileNav />);
    
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Photos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
  });

  it('should navigate to admin routes', () => {
    render(<AdminMobileNav />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Guests' }));
    expect(mockPush).toHaveBeenCalledWith('/admin/guests');
  });

  it('should highlight More when on vendor/email/activity/budget pages', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/vendors');
    render(<AdminMobileNav />);
    
    const moreButton = screen.getByRole('button', { name: 'More' });
    expect(moreButton).toHaveClass('text-jungle-600');
    expect(moreButton).toHaveAttribute('aria-current', 'page');
  });
});
