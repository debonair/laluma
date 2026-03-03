import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Marketplace from './Marketplace';
import { renderWithProviders } from '../test/testUtils';
import { marketplaceService } from '../services/marketplace.service';

vi.mock('../services/marketplace.service', () => ({
    marketplaceService: {
        getItems: vi.fn(),
        createItem: vi.fn(),
        updateItemStatus: vi.fn()
    }
}));

vi.mock('../components/BottomNav', () => ({
    default: () => <div data-testid="bottom-nav-mock">BottomNav</div>
}));

describe('Marketplace', () => {
    it('renders marketplace items', async () => {
        vi.mocked(marketplaceService.getItems).mockResolvedValue({
            items: [
                { id: 'm1', title: 'Baby Stroller', description: 'Gently used stroller', price: 50, condition: 'good', category: 'Gear', status: 'available', sellerId: 'user1', latitude: null, longitude: null, createdAt: new Date(), images: [] },
                { id: 'm2', title: 'Free Onesies', description: 'Assorted onesies', price: 0, condition: 'fair', category: 'Clothing', status: 'available', sellerId: 'user2', latitude: null, longitude: null, createdAt: new Date(), images: [] }
            ]
        } as any);

        renderWithProviders(<Marketplace />);

        expect(screen.getByText('Marketplace')).toBeInTheDocument();

        expect(await screen.findByText(/Baby Stroller/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Gear/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Free Onesies/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Free/i).length).toBeGreaterThan(0);
    });
});
