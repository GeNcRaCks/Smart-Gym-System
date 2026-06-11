import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../app/register/page';
import { useAuth } from '../../app/context/AuthContext';

// Mock useAuth hook
jest.mock('../../app/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('Register Component Tests', () => {
    let mockRegister: jest.Mock;

    beforeEach(() => {
        mockRegister = jest.fn();
        mockUseAuth.mockReturnValue({
            register: mockRegister,
            loading: false,
            user: null,
        });
    });

    test('renders step 1 fields initially', () => {
        render(<Register />);
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument();

        // Step 2 fields should not be present
        expect(screen.queryByPlaceholderText('180')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('75')).not.toBeInTheDocument();
    });

    test('navigates to step 2 on "Next Step" click and shows step 2 fields', () => {
        render(<Register />);

        // Move to step 2
        fireEvent.click(screen.getByRole('button', { name: /next step/i }));

        // Now step 2 fields are present
        expect(screen.getByPlaceholderText('180')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('75')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();

        // Step 1 fields are hidden
        expect(screen.queryByPlaceholderText('John Doe')).not.toBeInTheDocument();
    });

    test('can navigate back to step 1 from step 2', () => {
        render(<Register />);

        // Go to step 2
        fireEvent.click(screen.getByRole('button', { name: /next step/i }));
        expect(screen.getByPlaceholderText('180')).toBeInTheDocument();

        // Go back
        fireEvent.click(screen.getByRole('button', { name: /back/i }));

        // Now step 1 is visible again
        expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('180')).not.toBeInTheDocument();
    });

    test('submits form with all data from both steps', async () => {
        mockRegister.mockResolvedValue(undefined);
        const { container } = render(<Register />);

        // Step 1 input
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Alice Smith' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'alice@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'securepassword' } });

        // Go to step 2
        fireEvent.click(screen.getByRole('button', { name: /next step/i }));

        // Step 2 input
        fireEvent.change(screen.getByPlaceholderText('180'), { target: { value: '172' } });
        fireEvent.change(screen.getByPlaceholderText('75'), { target: { value: '68' } });
        
        // Select Experience level and role by name attributes
        const levelSelect = container.querySelector('select[name="level"]') as HTMLSelectElement;
        const roleSelect = container.querySelector('select[name="role"]') as HTMLSelectElement;
        
        expect(levelSelect).toBeInTheDocument();
        expect(roleSelect).toBeInTheDocument();

        fireEvent.change(levelSelect, { target: { value: 'Intermediate' } });
        fireEvent.change(roleSelect, { target: { value: 'MEMBER' } });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                name: 'Alice Smith',
                email: 'alice@example.com',
                password: 'securepassword',
                phone: '',
                role: 'MEMBER',
                profileData: {
                    height: 172,
                    weight: 68,
                    membershipType: 'BASIC',
                    level: 'Intermediate',
                },
            });
        });
    });

    test('displays error message if registration fails', async () => {
        mockRegister.mockRejectedValue(new Error('Email already exists'));
        render(<Register />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Alice Smith' } });
        fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'alice@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'securepassword' } });
        fireEvent.click(screen.getByRole('button', { name: /next step/i }));

        // Step 2
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        // Wait for submit button to enable or error message to appear
        const errorDiv = await screen.findByText('Email already exists');
        expect(errorDiv).toBeInTheDocument();
    });
});
