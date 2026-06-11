import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../../app/components/Navbar';
import { useAuth } from '../../app/context/AuthContext';
import { useUI } from '../../app/context/UIContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentPathname = '/';

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
    usePathname: () => currentPathname,
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Contexts
jest.mock('../../app/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../../app/context/UIContext', () => ({
    useUI: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseUI = useUI as jest.Mock;

describe('Navbar Component Tests', () => {
    const mockLogout = jest.fn();
    const mockToggleSidebar = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        currentPathname = '/';
        mockUseUI.mockReturnValue({
            toggleSidebar: mockToggleSidebar,
        });
    });

    test('renders logo and public nav links for unauthenticated users', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            logout: mockLogout,
        });

        render(<Navbar />);

        // Logo text is present
        expect(screen.getByText('Smart')).toBeInTheDocument();
        expect(screen.getByText('Gym')).toBeInTheDocument();

        // Menu button is present
        expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();

        // Public links
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Pricing')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();

        // Login & Join Free actions
        expect(screen.getByText('Log In')).toBeInTheDocument();
        expect(screen.getByText('Join Free')).toBeInTheDocument();
    });

    test('renders user profile and menu for logged-in MEMBER', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: '123',
                name: 'Alice Member',
                email: 'alice@member.com',
                role: 'MEMBER',
            },
            logout: mockLogout,
        });

        render(<Navbar />);

        // No public links rendered for logged in users
        expect(screen.queryByText('Features')).not.toBeInTheDocument();
        expect(screen.queryByText('Log In')).not.toBeInTheDocument();

        // User name avatar is rendered (shows first char of name: A)
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('Alice Member')).toBeInTheDocument();
        expect(screen.getByText('MEMBER')).toBeInTheDocument();
    });

    test('opens profile dropdown menu on click and handles profile/signout actions', () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: '123',
                name: 'Alice Member',
                email: 'alice@member.com',
                role: 'MEMBER',
            },
            logout: mockLogout,
        });

        render(<Navbar />);

        // Dropdown menu is closed initially
        expect(screen.queryByText('alice@member.com')).not.toBeInTheDocument();

        // Click on the user button to open the profile dropdown
        const profileBtn = screen.getByText('Alice Member').closest('button');
        expect(profileBtn).toBeInTheDocument();
        fireEvent.click(profileBtn!);

        // Dropdown menu is now open
        expect(screen.getByText('alice@member.com')).toBeInTheDocument();
        
        // Assert Profile and Sign Out items are rendered
        const profileLink = screen.getByText('Profile');
        expect(profileLink.closest('a')).toHaveAttribute('href', '/dashboard/profile');

        const signOutBtn = screen.getByText('Sign Out');
        fireEvent.click(signOutBtn);

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('renders search input when user is on workouts page', () => {
        currentPathname = '/dashboard/member/workouts';
        mockUseAuth.mockReturnValue({
            user: {
                id: '123',
                name: 'Alice Member',
                email: 'alice@member.com',
                role: 'MEMBER',
            },
            logout: mockLogout,
        });

        render(<Navbar />);

        // Search input is rendered with the correct placeholder
        const searchInput = screen.getByPlaceholderText(/search workouts/i);
        expect(searchInput).toBeInTheDocument();
    });

    test('toggles sidebar when menu button is clicked', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            logout: mockLogout,
        });

        render(<Navbar />);

        const menuBtn = screen.getByRole('button', { name: /open menu/i });
        fireEvent.click(menuBtn);

        expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });
});
