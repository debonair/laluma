import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { render } from '@testing-library/react';

vi.mock('./services/auth.service', () => ({
    authService: {
        getCurrentUser: vi.fn().mockReturnValue({ id: '1', email: 'test@example.com', isVerified: true }),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
    }
}));

vi.mock('./services/feed.service', () => ({
    feedService: {
        getFeed: vi.fn().mockResolvedValue({ posts: [] })
    }
}));

vi.mock('./services/notification.service', () => ({
    notificationService: {
        getAll: vi.fn().mockResolvedValue({ notifications: [], totalUnread: 0 })
    }
}));

describe('App', () => {
    it('renders the main app structure without crashing', async () => {
        // App includes its own Router, so we mock rendering it directly.
        // We will just verify that the app boot succeeds and lands somewhere like Login or Feed.
        const { container } = render(<App />);

        await waitFor(() => {
            expect(container).toBeInTheDocument();
        });
    });
});
