import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../app/login/page';
import { useAuth } from '../../app/context/AuthContext';

// Mock the useAuth hook
jest.mock('../../app/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('Login Component Tests', () => {
    const mockLogin = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            loading: false,
            user: null,
        });
    });

    test('renders email and password inputs and submit button', () => {
        render(<Login />);
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByText(/join free/i)).toBeInTheDocument();
    });

    test('submits form with user inputs and handles success', async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
    });

    test('shows error message on failed login', async () => {
        mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(submitButton);

        const errorDiv = await screen.findByText('Invalid credentials');
        expect(errorDiv).toBeInTheDocument();
    });

    test('disables button while submitting', async () => {
        let resolveLogin: (value: any) => void = () => {};
        const loginPromise = new Promise((resolve) => {
            resolveLogin = resolve;
        });
        mockLogin.mockReturnValueOnce(loginPromise);

        render(<Login />);

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        // Verify button changes text and is disabled
        expect(screen.getByRole('button', { name: /signing in.../i })).toBeInTheDocument();
        expect(submitButton).toBeDisabled();

        resolveLogin(undefined);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
    });

    test('has a link to the registration page', () => {
        render(<Login />);
        const registerLink = screen.getByText(/join free/i);
        expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
    });
});
