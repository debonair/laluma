import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Directory from './Directory';
import { renderWithProviders } from '../test/testUtils';
import { directoryService } from '../services/directory.service';

vi.mock('../services/directory.service', () => ({
    directoryService: {
        getListings: vi.fn(),
        createListing: vi.fn(),
        getReviews: vi.fn(),
        addReview: vi.fn()
    }
}));

vi.mock('../components/BottomNav', () => ({
    default: () => <div data-testid="bottom-nav-mock">BottomNav</div>
}));

describe('Directory', () => {
    it('renders listings', async () => {
        vi.mocked(directoryService.getListings).mockResolvedValue({
            listings: [
                { id: '1', name: 'Dr. Smith Pediatrics', category: 'Healthcare', address: '123 Main St', latitude: null, longitude: null, createdAt: new Date() },
                { id: '2', name: 'Happy Kids Daycare', category: 'Childcare', address: '456 Oak Ave', latitude: null, longitude: null, createdAt: new Date() }
            ]
        } as any);

        const { container } = renderWithProviders(<Directory />);

        expect(screen.getByText('Local Directory')).toBeInTheDocument();

        expect(await screen.findByText(/Dr. Smith Pediatrics/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Healthcare/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Childcare/i).length).toBeGreaterThan(0);
    });
});
