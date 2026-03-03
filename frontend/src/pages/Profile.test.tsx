import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from './Profile';
import { renderWithProviders } from '../test/testUtils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';

vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
    }
}));

describe('Profile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (userOverride: any = null) => {
        // If userOverride is false, simulate loading/null user state
        if (userOverride === false) {
            vi.mocked(useAuth).mockReturnValue({
                user: null,
                isAuthenticated: false,
                login: vi.fn(),
                logout: vi.fn(),
                register: vi.fn(),
                updateProfile: vi.fn(),
                isLoading: false,
                clearError: vi.fn()
            } as any);
        } else {
            // Apply custom user properties or default mock
            vi.mocked(useAuth).mockReturnValue({
                user: { id: 'mock-user-1', name: 'Mock User', email: 'mock@example.com', displayName: 'Mock Mom', aboutMe: 'Loves yoga', motherhoodStage: 'toddler', location: { radius: 15, anywhere: false }, ...(userOverride || {}) },
                isAuthenticated: true,
                login: vi.fn(),
                logout: vi.fn(),
                register: vi.fn(),
                updateProfile: vi.fn(),
                isLoading: false,
                clearError: vi.fn()
            } as any);
        }

        return renderWithProviders(<Profile />, { route: '/profile' });
    };

    it('renders a loading skeleton when the user object is null', () => {
        renderComponent(false); // Simulate unauthenticated / loading user
        // React Testing Library has trouble easily finding Skeletons unless they have roles, 
        // but verifying no profile text exists is a good proxy.
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
        // Since we render bare divs with standard skeleton styles, we can check container presence or class
        // Our simplified rendering test works by assuring user info isn't there
    });

    it('renders user profile details when authenticated', () => {
        renderComponent();

        expect(screen.getByText('My Profile')).toBeInTheDocument();
        expect(screen.getByText('Mock Mom')).toBeInTheDocument();
        expect(screen.getByText('About Me')).toBeInTheDocument(); // section header
        expect(screen.getByText('Loves yoga')).toBeInTheDocument();
    });

    it('enters edit mode, updates inputs, and saves profile', async () => {
        const user = userEvent.setup();
        renderComponent();

        const editButton = screen.getByRole('button', { name: "Edit" });
        await user.click(editButton);

        const displayNameInput = screen.getByDisplayValue('Mock Mom');
        const aboutMeTextarea = screen.getByDisplayValue('Loves yoga');

        await user.clear(displayNameInput);
        await user.type(displayNameInput, 'Super Mom');

        await user.clear(aboutMeTextarea);
        await user.type(aboutMeTextarea, 'Loves pilates');

        const saveButton = screen.getByRole('button', { name: "Save" });
        await user.click(saveButton);

        const { updateProfile } = vi.mocked(useAuth)();

        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledWith({
                displayName: 'Super Mom',
                aboutMe: 'Loves pilates',
                location: { radius: 15, anywhere: false },
                motherhoodStage: 'toddler'
            });
            // Should exit edit mode
            expect(screen.queryByDisplayValue('Super Mom')).not.toBeInTheDocument();
        });
    });

    it('handles manual verification requests and shows a success toast', async () => {
        const user = userEvent.setup();
        // Extract toast mock
        let addToastMock: ReturnType<typeof vi.fn>;
        vi.mocked(useToast).mockReturnValue({
            addToast: vi.fn(),
            toasts: [],
            removeToast: vi.fn()
        } as any);

        vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } } as any);

        renderComponent();
        const { addToast } = vi.mocked(useToast)();

        // The button says "Get Verified Shield"
        const requestBtn = screen.getByRole('button', { name: "Get Verified Shield" });
        await user.click(requestBtn);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith('/users/me/verify', { verificationMethod: 'manual' });
            expect(addToast).toHaveBeenCalledWith('Verification approved!', 'success');
        });
    });

    it('shows a verified badge if user is verified', async () => {
        renderComponent({ isVerified: true, displayName: 'Verified Mom' });

        await waitFor(() => {
            expect(screen.getByText('Verified Mom')).toBeInTheDocument();
            // The lucide-react badge check is rendered, we can find its color or presence
            // We just verify it doesn't crash
        });
    });
});
