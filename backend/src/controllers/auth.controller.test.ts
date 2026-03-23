import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, refreshToken, signOut } from './auth.controller';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Auth Controller', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
            send: vi.fn()
        };
        vi.clearAllMocks();
    });

    describe('signUp', () => {
        it('validates input schema', async () => {
            mockReq.body = { username: 'a' }; // Invalid, too short username, missing email/password

            await signUp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR'
            }));
        });

        it('successfully creates a user and returns tokens', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // Mock getAdminToken
            (mockedAxios.post as any).mockResolvedValueOnce({ data: { access_token: 'admin-token' } });

            // Mock Keycloak user check (doesn't exist)
            (mockedAxios.get as any).mockResolvedValueOnce({ data: [] }); // Check username
            (mockedAxios.get as any).mockResolvedValueOnce({ data: [] }); // Check email

            // Mock Keycloak user creation
            (mockedAxios.post as any).mockResolvedValueOnce({ headers: { location: 'http://localhost/users/kc-id-123' } });

            // Mock role assignment and actions patch
            (mockedAxios.put as any).mockResolvedValueOnce({});
            (mockedAxios.get as any).mockResolvedValueOnce({ data: [{ name: 'app-user' }] });
            (mockedAxios.post as any).mockResolvedValueOnce({});

            // Mock user sign-in token retrieval
            (mockedAxios.post as any).mockResolvedValueOnce({
                data: {
                    access_token: 'test-access',
                    refresh_token: 'test-refresh',
                    id_token: 'test-id',
                    expires_in: 3600
                }
            });

            await signUp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                accessToken: 'test-access',
                refreshToken: 'test-refresh',
                idToken: 'test-id',
                expiresIn: 3600,
                user: { username: 'testuser', email: 'test@example.com' }
            });
        });

        it('returns 409 if username already exists', async () => {
            mockReq.body = {
                username: 'existinguser',
                email: 'test@example.com',
                password: 'password123'
            };

            (mockedAxios.post as any).mockResolvedValueOnce({ data: { access_token: 'admin-token' } });
            // Mock user check returns existing user
            (mockedAxios.get as any).mockResolvedValueOnce({ data: [{ id: 'some-id' }] });

            await signUp(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'DUPLICATE_USERNAME'
            }));
        });
    });

    describe('signIn', () => {
        it('validates input schema', async () => {
            mockReq.body = {};

            await signIn(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR'
            }));
        });

        it('returns tokens on successful auth', async () => {
            mockReq.body = { username: 'testuser', password: 'password123' };

            (mockedAxios.post as any).mockResolvedValueOnce({
                data: {
                    access_token: 'test-access',
                    refresh_token: 'test-refresh',
                    id_token: 'test-id',
                    expires_in: 3600
                }
            });

            await signIn(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                accessToken: 'test-access',
                refreshToken: 'test-refresh',
                idToken: 'test-id',
                expiresIn: 3600
            });
        });

        it('handles invalid credentials', async () => {
            mockReq.body = { username: 'testuser', password: 'wrong' };

            const error = new Error('Request failed') as any;
            error.response = { data: { error: 'invalid_grant' } };
            (mockedAxios.post as any).mockRejectedValueOnce(error);

            await signIn(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'INVALID_CREDENTIALS'
            }));
        });
    });

    describe('refreshToken', () => {
        it('validates missing refresh token', async () => {
            mockReq.body = {};
            await refreshToken(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR'
            }));
        });

        it('returns new tokens on successful refresh', async () => {
            mockReq.body = { refreshToken: 'valid-refresh-token' };

            (mockedAxios.post as any).mockResolvedValueOnce({
                data: {
                    access_token: 'new-access',
                    refresh_token: 'new-refresh',
                    expires_in: 3600
                }
            });

            await refreshToken(mockReq, mockRes);
            expect(mockRes.json).toHaveBeenCalledWith({
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
                expiresIn: 3600
            });
        });

        it('handles expired/invalid refresh token', async () => {
            mockReq.body = { refreshToken: 'invalid-token' };
            const error = new Error('Request failed') as any;
            error.response = { data: { error: 'invalid_grant' } };
            (mockedAxios.post as any).mockRejectedValueOnce(error);

            await refreshToken(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'TOKEN_EXPIRED'
            }));
        });
    });
});

