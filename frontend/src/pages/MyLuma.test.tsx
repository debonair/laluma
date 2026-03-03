import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyLuma from './MyLuma';
import { renderWithProviders } from '../test/testUtils';
import { getMockContent } from '../test/factories';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// We must mock fetch for the API calls in MyLuma
globalThis.fetch = vi.fn();

describe('MyLuma', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return renderWithProviders(<MyLuma />, { route: '/my-luma' });
    };

    it('renders loading state initially', () => {
        // Delay the mock response to see loading state
        (globalThis.fetch as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        renderComponent();

        expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('renders empty state if no content is returned', async () => {
        (globalThis.fetch as any).mockResolvedValue({
            json: async () => ({ content: [] })
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('No content available in this category')).toBeInTheDocument();
        });
    });

    it('renders featured and regular content correctly', async () => {
        const mockFeatured = getMockContent({
            id: 'featured-1',
            title: 'Featured Post',
            isFeatured: true,
        });

        const mockRegular = getMockContent({
            id: 'regular-1',
            title: 'Regular Post'
        });

        (globalThis.fetch as any).mockImplementation((url: string) => {
            if (url.includes('isFeatured=true')) {
                return Promise.resolve({
                    json: async () => ({ content: [mockFeatured] })
                });
            } else {
                return Promise.resolve({
                    json: async () => ({ content: [mockRegular] })
                });
            }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Featured Articles')).toBeInTheDocument();
            expect(screen.getByText('Featured Post')).toBeInTheDocument();
            expect(screen.getByText('Regular Post')).toBeInTheDocument();
        });
    });

    it('filters content by category when category buttons are clicked', async () => {
        const mockRegular = getMockContent({
            id: 'regular-1',
            title: 'All Content Post'
        });

        (globalThis.fetch as any).mockImplementation((url: string) => {
            if (url.includes('isFeatured=true')) {
                return Promise.resolve({
                    json: async () => ({ content: [] })
                });
            } else {
                return Promise.resolve({
                    json: async () => ({ content: [mockRegular] })
                });
            }
        });

        const user = userEvent.setup();
        renderComponent();

        // Ensure initially fetched
        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('status=approved'));
            // Initially should not have category param
            expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining('category='));
        });

        // Click a category filter
        const wellnessBtn = screen.getByRole('button', { name: 'Wellness' });
        await user.click(wellnessBtn);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('category=Wellness'));
        });
    });

    it('navigates to content detail when a card is clicked', async () => {
        const mockRegular = getMockContent({
            id: 'content-123',
            title: 'Clickable Post'
        });

        (globalThis.fetch as any).mockImplementation((url: string | URL | globalThis.Request) => {
            const urlStr = url.toString();
            if (urlStr.includes('isFeatured=true')) {
                return Promise.resolve({
                    json: async () => ({ content: [] })
                });
            } else {
                return Promise.resolve({
                    json: async () => ({ content: [mockRegular] })
                });
            }
        });

        const user = userEvent.setup();
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Clickable Post')).toBeInTheDocument();
        });

        const contentCard = screen.getByText('Clickable Post');
        await user.click(contentCard);

        expect(mockNavigate).toHaveBeenCalledWith('/my-luma/content-123');
    });
});
