import { describe, it, expect } from 'vitest';
import { handleAPIError } from './api';

describe('API Utils', () => {
    describe('handleAPIError', () => {
        it('returns message from AxiosError', () => {
            const mockAxiosError = {
                isAxiosError: true,
                response: {
                    data: {
                        message: 'Custom backend error'
                    }
                }
            };
            const msg = handleAPIError(mockAxiosError);
            expect(msg).toBe('Custom backend error');
        });

        it('returns generic error when AxiosError has no message payload', () => {
            const mockAxiosError = {
                isAxiosError: true,
                response: {
                    data: {}
                }
            };
            const msg = handleAPIError(mockAxiosError);
            expect(msg).toBe('An error occurred');
        });

        it('returns unexpected error for non-axios errors', () => {
            const genericError = new Error('Generic failure');
            const msg = handleAPIError(genericError);
            expect(msg).toBe('An unexpected error occurred');
        });
    });
});
