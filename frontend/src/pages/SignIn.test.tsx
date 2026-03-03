import { screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SignIn from './SignIn';
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

describe('SignIn', () => {
    it('renders the sign-in form', () => {
        mockUseAuth.mockReturnValue({
            signIn: vi.fn(),
            isAuthenticated: false,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            user: null,
            tokenRefreshed: false
        });

        renderWithProviders(<SignIn />);
        expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Your password/i)).toBeInTheDocument();
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
            user: null,
            tokenRefreshed: false
        });

        const { container } = renderWithProviders(<SignIn />);

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        expect(screen.getByText('Please enter your username and password.')).toBeInTheDocument();
    });

    it('calls signIn when form is submitted with valid data', async () => {
        const signInMock = vi.fn().mockResolvedValue(undefined);
        mockUseAuth.mockReturnValue({
            signIn: signInMock,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            clearError: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            user: null,
            tokenRefreshed: false
        });

        const { container } = renderWithProviders(<SignIn />);

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByPlaceholderText(/Your password/i), { target: { value: 'password123' } });

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(signInMock).toHaveBeenCalledWith('testuser', 'password123');
        });
    });
});
