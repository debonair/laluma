import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import ContentDetail from './ContentDetail';
import { renderWithProviders } from '../test/testUtils';
import { getMockContent } from '../test/factories';
import apiClient from '../services/api';

// Mock dependencies
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn()
    },
    SERVER_URL: 'http://localhost:3000'
}));

// We must mock fetch for trackView
globalThis.fetch = vi.fn();

describe('ContentDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis.fetch as any).mockResolvedValue({
            ok: true
        });
    });

    const renderComponent = () => {
        return renderWithProviders(
            <Routes>
                <Route path="/content/:id" element={<ContentDetail />} />
            </Routes>,
            { route: '/content/123' }
        );
    };

    it('should show loading skeleton initially', () => {
        // Delay the mock response to see loading state
        vi.mocked(apiClient.get).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        const { container } = renderComponent();
        expect(container.querySelector('.skeleton-base')).toBeDefined();
    });

    it('should gracefully handle content with missing optional fields (like body and publishedAt)', async () => {
        // Use factory to generate content, but explicitly remove fields to test missing constraints
        const mockContentWithoutOptionalFields = getMockContent({
            id: '123',
            title: 'Test Event that crashed before',
            category: 'Event',
        });

        // Simulating the exact payload from the DB without these fields
        delete mockContentWithoutOptionalFields.body;
        delete mockContentWithoutOptionalFields.publishedAt;
        delete mockContentWithoutOptionalFields.excerpt;

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockContentWithoutOptionalFields } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Test Event that crashed before')).toBeInTheDocument();
            // It shouldn't crash trying to format an undefined date or render an undefined body
        });
    });

    it('should render full content when all fields are present', async () => {
        const mockFullContent = getMockContent({
            id: '123',
            title: 'Complete Article',
            body: '<p>This is the full rich text body</p>',
            excerpt: 'Short excerpt',
        });

        vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockFullContent } as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Complete Article')).toBeInTheDocument();
        });
    });
});
