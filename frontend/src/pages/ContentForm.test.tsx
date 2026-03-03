import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContentForm from './ContentForm';
import { renderWithProviders } from '../test/testUtils';
import { useParams } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => vi.fn()
    };
});

// Mock BottomNav since it dynamically imports services that cause interference
vi.mock('../components/BottomNav', () => ({
    default: () => <div data-testid="bottom-nav-mock">BottomNav</div>
}));

describe('ContentForm', () => {
    let mockFetch: any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useParams).mockReturnValue({});

        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders the form in create mode with default values', () => {
        const { container } = renderWithProviders(<ContentForm />);

        expect(screen.getByText('Create Content')).toBeInTheDocument();
        expect(container.querySelector('input[type="text"]')).toHaveValue('');
        expect(screen.getByRole('button', { name: /Create Content/i })).toBeInTheDocument();
    });

    it('fetches existing content and populates the form in edit mode', async () => {
        vi.mocked(useParams).mockReturnValue({ id: 'content-123' });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                title: 'Test Article',
                body: 'Article body content',
                category: 'Parenting',
                contentType: 'article',
                status: 'published'
            })
        });

        const { container } = renderWithProviders(<ContentForm />);

        // Loading state initially
        expect(container.querySelector('.skeleton-base')).toBeInTheDocument();

        await waitFor(() => {
            expect(container.querySelector('#title')).toHaveValue('Test Article');
            expect(container.querySelector('#body')).toHaveValue('Article body content');
            expect(container.querySelector('#category')).toHaveValue('Parenting');
        });
    });

    it('submits form to create new content', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        const { container } = renderWithProviders(<ContentForm />);

        const titleInput = container.querySelector('input[type="text"]')!;
        fireEvent.change(titleInput, { target: { value: 'New Test Content' } });

        const bodyInput = container.querySelector('textarea')!;
        fireEvent.change(bodyInput, { target: { value: 'New Test Body' } });

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        console.log('MOCK CALLS:', mockFetch.mock.calls);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    it('submits form to update existing content', async () => {
        vi.mocked(useParams).mockReturnValue({ id: 'content-123' });

        // Initial fetch resolving
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                title: 'Existing Title',
                category: 'Parenting'
            })
        });

        const { container } = renderWithProviders(<ContentForm />);

        await waitFor(() => {
            expect(container.querySelector('input[type="text"]')).toHaveValue('Existing Title');
        });

        // Setup mock for the PUT request
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({})
        });

        const titleInput = container.querySelector('input[type="text"]')!;
        fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

        const bodyInput = container.querySelector('textarea')!;
        fireEvent.change(bodyInput, { target: { value: 'Updated Body' } });

        const form = container.querySelector('form')!;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/content/content-123'), expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('Updated Title')
            }));
        });
    });

    it('displays error message on submission failure', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Validation failed' })
        });

        const { container } = renderWithProviders(<ContentForm />);

        const titleInput = container.querySelector('input[type="text"]')!;
        fireEvent.change(titleInput, { target: { value: 'New Test Content' } });

        const bodyInput = container.querySelector('textarea')!;
        fireEvent.change(bodyInput, { target: { value: 'New Test Body' } });

        const form = container.querySelector('form')!;
        form.noValidate = true;
        fireEvent.submit(form);

        await waitFor(() => {
            expect(screen.getByText('Validation failed')).toBeInTheDocument();
        });
    });
});
