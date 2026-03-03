import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SignUp from './SignUp';
import { renderWithProviders } from '../test/testUtils';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

const mockUseAuth = vi.mocked(AuthContextModule.useAuth);

describe('SignUp', () => {
    it('renders the sign-up form', () => {
        mockUseAuth.mockReturnValue({
            signIn: vi.fn(),
            isAuthenticated: false,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateProfile: vi.fn(),
            user: null
        });

        renderWithProviders(<SignUp />);
        expect(screen.getByRole('heading', { name: /Join Luma/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Min. 8 characters/i)).toBeInTheDocument();
    });

    it('displays error when form is submitted empty', () => {
        mockUseAuth.mockReturnValue({
            signIn: vi.fn(),
            isAuthenticated: false,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateProfile: vi.fn(),
            user: null
        });

        const { container } = renderWithProviders(<SignUp />);

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
    });

    it('calls signUp when form is submitted with valid data', async () => {
        const signUpMock = vi.fn().mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({
            signIn: vi.fn(),
            isAuthenticated: false,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signUp: signUpMock,
            signOut: vi.fn(),
            updateProfile: vi.fn(),
            user: null
        });

        const { container } = renderWithProviders(<SignUp />);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'newuser' } });
        fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'newuser@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Min. 8 characters/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText(/Repeat your password/i), { target: { value: 'password123' } });

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(signUpMock).toHaveBeenCalledWith('newuser', 'newuser@example.com', 'password123');
        });
    });
});
