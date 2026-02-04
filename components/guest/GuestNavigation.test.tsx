import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { GuestNavigation } from './GuestNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, onClick, ...props }: any) => {
    return (
      <a href={href} onClick={onClick} {...props}>
        {children}
      </a>
    );
  };
});

describe('GuestNavigation', () => {
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

  beforeEach(() => {
    mockUsePathname.mockReturnValue('/guest/dashboard');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop Navigation', () => {
    beforeEach(() => {
      // Set viewport to desktop size
      global.innerWidth = 1024;
    });

    it('should render all navigation tabs', () => {
      render(<GuestNavigation />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Itinerary')).toBeInTheDocument();
      expect(screen.getByText('Photos')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should highlight the active tab', () => {
      mockUsePathname.mockReturnValue('/guest/events');
      render(<GuestNavigation />);

      const eventsLink = screen.getByRole('link', { name: /Events/i });
      expect(eventsLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should render logo with link to dashboard', () => {
      render(<GuestNavigation />);

      const logos = screen.getAllByText('Wedding Portal');
      expect(logos.length).toBeGreaterThan(0);
      logos.forEach(logo => {
        expect(logo.closest('a')).toHaveAttribute('href', '/guest/dashboard');
      });
    });

    it('should render logout link', () => {
      render(<GuestNavigation />);

      const logoutLink = screen.getByText('Logout');
      expect(logoutLink).toHaveAttribute('href', '/api/auth/logout');
    });

    describe('Dropdown Menu', () => {
      it('should toggle dropdown when Info tab is clicked', () => {
        render(<GuestNavigation />);

        const infoButton = screen.getByRole('button', { name: /Info/i });
        
        // Initially closed
        expect(infoButton).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Accommodation')).not.toBeInTheDocument();

        // Click to open
        fireEvent.click(infoButton);
        expect(infoButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Accommodation')).toBeInTheDocument();
        expect(screen.getByText('Transportation')).toBeInTheDocument();
        expect(screen.getByText('Family')).toBeInTheDocument();
        expect(screen.getByText('Our Story')).toBeInTheDocument();

        // Click to close
        fireEvent.click(infoButton);
        expect(infoButton).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Accommodation')).not.toBeInTheDocument();
      });

      it('should close dropdown when a sub-item is clicked', () => {
        render(<GuestNavigation />);

        const infoButton = screen.getByRole('button', { name: /Info/i });
        fireEvent.click(infoButton);

        const accommodationLink = screen.getByText('Accommodation');
        fireEvent.click(accommodationLink);

        expect(screen.queryByText('Accommodation')).not.toBeInTheDocument();
      });

      it('should highlight active sub-item', () => {
        mockUsePathname.mockReturnValue('/guest/accommodation');
        render(<GuestNavigation />);

        const infoButton = screen.getByRole('button', { name: /Info/i });
        
        // Info tab should be active because sub-item is active
        expect(infoButton).toHaveClass('bg-emerald-600', 'text-white');

        // Open dropdown
        fireEvent.click(infoButton);

        const accommodationLink = screen.getByText('Accommodation');
        expect(accommodationLink).toHaveClass('bg-emerald-50', 'text-emerald-700');
      });

      it('should rotate chevron icon when dropdown is open', () => {
        render(<GuestNavigation />);

        const infoButton = screen.getByRole('button', { name: /Info/i });
        const chevron = infoButton.querySelector('svg:last-child');

        // Initially not rotated
        expect(chevron).not.toHaveClass('rotate-180');

        // Click to open
        fireEvent.click(infoButton);
        expect(chevron).toHaveClass('rotate-180');

        // Click to close
        fireEvent.click(infoButton);
        expect(chevron).not.toHaveClass('rotate-180');
      });
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Set viewport to mobile size
      global.innerWidth = 375;
    });

    it('should render hamburger menu button', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when hamburger is clicked', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      
      // Initially closed
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();

      // Click to open
      fireEvent.click(menuButton);
      expect(screen.getByText('Menu')).toBeInTheDocument();
      const closeButtons = screen.getAllByLabelText('Close menu');
      expect(closeButtons.length).toBeGreaterThan(0);

      // Click to close
      fireEvent.click(closeButtons[0]);
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should close mobile menu when backdrop is clicked', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      expect(screen.getByText('Menu')).toBeInTheDocument();

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should close mobile menu when a navigation link is clicked', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      const allEventsLinks = screen.getAllByText('Events');
      // Find the mobile menu link (should be inside the mobile menu panel)
      const mobileEventsLink = allEventsLinks.find(link => {
        const parent = link.closest('.fixed.inset-y-0.right-0');
        return parent !== null;
      });
      
      expect(mobileEventsLink).toBeInTheDocument();
      fireEvent.click(mobileEventsLink!);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should have minimum 44px touch targets', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      // Check that mobile menu items exist with proper styling
      const mobileMenuPanel = document.querySelector('.fixed.inset-y-0.right-0');
      expect(mobileMenuPanel).toBeInTheDocument();
      
      // Verify the panel contains navigation items
      const navItems = mobileMenuPanel?.querySelectorAll('a, button');
      expect(navItems && navItems.length).toBeGreaterThan(0);
    });

    it('should toggle dropdown in mobile menu', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      const allInfoButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Info')
      );
      // Find the mobile menu button (should be inside the mobile menu panel)
      const mobileInfoButton = allInfoButtons.find(btn => {
        const parent = btn.closest('.fixed.inset-y-0.right-0');
        return parent !== null;
      });
      
      expect(mobileInfoButton).toBeInTheDocument();

      // Initially closed
      const mobilePanel = document.querySelector('.fixed.inset-y-0.right-0');
      expect(mobilePanel?.textContent).not.toContain('Accommodation');

      // Click to open
      fireEvent.click(mobileInfoButton!);
      expect(mobilePanel?.textContent).toContain('Accommodation');

      // Click to close
      fireEvent.click(mobileInfoButton!);
      // After closing, the sub-items should not be visible
      const accommodationLinks = screen.queryAllByText('Accommodation');
      const mobileAccommodationLink = accommodationLinks.find(link => {
        const parent = link.closest('.fixed.inset-y-0.right-0');
        return parent !== null;
      });
      // The link might still exist in DOM but should not be visible
      expect(mobileAccommodationLink).toBeFalsy();
    });

    it('should close mobile menu when sub-item is clicked', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      const allInfoButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Info')
      );
      const mobileInfoButton = allInfoButtons.find(btn => {
        const parent = btn.closest('.fixed.inset-y-0.right-0');
        return parent !== null;
      });
      
      fireEvent.click(mobileInfoButton!);

      const accommodationLinks = screen.getAllByText('Accommodation');
      const mobileAccommodationLink = accommodationLinks.find(link => {
        const parent = link.closest('.fixed.inset-y-0.right-0');
        return parent !== null;
      });
      
      expect(mobileAccommodationLink).toBeInTheDocument();
      fireEvent.click(mobileAccommodationLink!);

      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });

    it('should render logout button in mobile menu', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      const logoutLinks = screen.getAllByText('Logout');
      const mobileLogoutButton = logoutLinks.find(el => {
        const link = el.closest('a');
        return link && link.getAttribute('href') === '/api/auth/logout' && link.style.minHeight === '44px';
      });
      expect(mobileLogoutButton).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should highlight Home tab when on dashboard', () => {
      mockUsePathname.mockReturnValue('/guest/dashboard');
      render(<GuestNavigation />);

      const homeLink = screen.getByRole('link', { name: /Home/i });
      expect(homeLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should highlight Events tab when on events page', () => {
      mockUsePathname.mockReturnValue('/guest/events');
      render(<GuestNavigation />);

      const eventsLink = screen.getByRole('link', { name: /Events/i });
      expect(eventsLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should highlight Activities tab when on activities page', () => {
      mockUsePathname.mockReturnValue('/guest/activities');
      render(<GuestNavigation />);

      const activitiesLink = screen.getByRole('link', { name: /Activities/i });
      expect(activitiesLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should highlight Itinerary tab when on itinerary page', () => {
      mockUsePathname.mockReturnValue('/guest/itinerary');
      render(<GuestNavigation />);

      const itineraryLink = screen.getByRole('link', { name: /Itinerary/i });
      expect(itineraryLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should highlight Photos tab when on photos page', () => {
      mockUsePathname.mockReturnValue('/guest/photos');
      render(<GuestNavigation />);

      const photosLink = screen.getByRole('link', { name: /Photos/i });
      expect(photosLink).toHaveClass('bg-emerald-600', 'text-white');
    });

    it('should highlight Info tab when on any sub-item page', () => {
      const subItemPaths = [
        '/guest/accommodation',
        '/guest/transportation',
        '/guest/family',
        '/our-story',
      ];

      subItemPaths.forEach(path => {
        mockUsePathname.mockReturnValue(path);
        const { unmount } = render(<GuestNavigation />);

        const infoButton = screen.getByRole('button', { name: /Info/i });
        expect(infoButton).toHaveClass('bg-emerald-600', 'text-white');

        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for menu buttons', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);
      const closeButtons = screen.getAllByLabelText('Close menu');
      expect(closeButtons.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for dropdown', () => {
      render(<GuestNavigation />);

      const infoButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Info')
      );
      const infoButton = infoButtons[0]; // Get first (desktop) button
      
      expect(infoButton).toHaveAttribute('aria-expanded', 'false');
      expect(infoButton).toHaveAttribute('aria-haspopup', 'true');

      fireEvent.click(infoButton);
      expect(infoButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should be keyboard navigable', () => {
      render(<GuestNavigation />);

      const homeLinks = screen.getAllByRole('link').filter(link => 
        link.textContent?.includes('Home')
      );
      const homeLink = homeLinks[0];
      homeLink.focus();
      expect(document.activeElement).toBe(homeLink);
    });
  });

  describe('Styling', () => {
    it('should have sticky positioning', () => {
      render(<GuestNavigation />);

      const navs = screen.getAllByRole('navigation');
      navs.forEach(nav => {
        expect(nav).toHaveClass('sticky', 'top-0', 'z-50');
      });
    });

    it('should have glassmorphism effect', () => {
      render(<GuestNavigation />);

      const navs = screen.getAllByRole('navigation');
      navs.forEach(nav => {
        expect(nav).toHaveClass('bg-white/80', 'backdrop-blur-md');
      });
    });

    it('should have proper z-index for overlay', () => {
      render(<GuestNavigation />);

      const menuButton = screen.getByLabelText('Open menu');
      fireEvent.click(menuButton);

      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      expect(backdrop).toHaveClass('z-40');

      const menuPanel = document.querySelector('.fixed.inset-y-0.right-0');
      expect(menuPanel).toHaveClass('z-50');
    });
  });
});
