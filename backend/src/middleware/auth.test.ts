import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, AuthRequest } from './auth';
import { Response } from 'express';

describe('Auth Middleware', () => {
    describe('requireRole', () => {
        let mockReq: Partial<AuthRequest>;
        let mockRes: Partial<Response>;
        let mockNext: any;
        let mockJson: any;
        let mockStatus: any;

        beforeEach(() => {
            mockJson = vi.fn();
            mockStatus = vi.fn().mockReturnValue({ json: mockJson });
            mockRes = { status: mockStatus, json: mockJson };
            mockNext = vi.fn();
        });

        it('returns 401 if user is not attached to request', () => {
            mockReq = {};

            const middleware = requireRole('admin');
            middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(401);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Authentication required' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('returns 403 if user does not have the required role', () => {
            mockReq = {
                user: { userId: '123', username: 'test', roles: ['member'] }
            };

            const middleware = requireRole('admin', 'moderator');
            middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Forbidden', message: 'Insufficient permissions' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('calls next() if user has the required role', () => {
            mockReq = {
                user: { userId: '123', username: 'test', roles: ['member', 'admin'] }
            };

            const middleware = requireRole('admin', 'moderator');
            middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

            expect(mockStatus).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });
});
