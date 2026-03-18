import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import prisma from '../utils/prisma';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'luma-realm';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'luma-web';
const KEYCLOAK_ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

const signUpSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: z.string().email(),
    password: z.string().min(8)
});

const signInSchema = z.object({
    username: z.string(),
    password: z.string()
});

const refreshSchema = z.object({
    refreshToken: z.string()
});

/** Get a Keycloak admin token (master realm) */
async function getAdminToken(): Promise<string> {
    const form = new URLSearchParams({
        client_id: 'admin-cli',
        grant_type: 'password',
        username: KEYCLOAK_ADMIN_USER,
        password: KEYCLOAK_ADMIN_PASSWORD
    });
    const response = await axios.post(
        `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
        form.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
}

/** Get tokens from Keycloak via ROPC (Direct Access Grant) */
async function getKeycloakTokens(username: string, password: string) {
    const form = new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        grant_type: 'password',
        username,
        password
    });
    const response = await axios.post(
        `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
        form.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
        expiresIn: response.data.expires_in,
    };
}

export const signUp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = signUpSchema.parse(req.body);

        // 1. Get admin token
        let adminToken: string;
        try {
            adminToken = await getAdminToken();
        } catch {
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Authentication service is unavailable. Please try again shortly.',
                code: 'AUTH_SERVICE_DOWN'
            });
            return;
        }

        // 2. Check if user already exists in Keycloak
        const checkResponse = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (checkResponse.data && checkResponse.data.length > 0) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Username already exists',
                code: 'DUPLICATE_USERNAME'
            });
            return;
        }

        // Check email uniqueness
        const emailCheck = await axios.get(
            `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (emailCheck.data && emailCheck.data.length > 0) {
            res.status(409).json({
                error: 'Conflict',
                message: 'Email already exists',
                code: 'DUPLICATE_EMAIL'
            });
            return;
        }

        // 3. Create user in Keycloak
        const createResponse = await axios.post(
            `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
            {
                username,
                email,
                firstName: username,
                lastName: username,
                enabled: true,
                emailVerified: true,
                requiredActions: [],
                credentials: [{
                    type: 'password',
                    value: password,
                    temporary: false
                }]
            },
            { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
        );

        // Get the new user's ID from Location header
        const locationHeader = createResponse.headers.location || '';
        const keycloakUserId = locationHeader.split('/').pop();

        if (keycloakUserId) {
            // Explicitly clear any realm-level default required actions and assign roles
            try {
                await axios.put(
                    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}`,
                    { requiredActions: [], emailVerified: true, enabled: true },
                    { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
                );

                console.log(`[Auth] Assigning roles to user ${keycloakUserId}`);
                const rolesResponse = await axios.get(
                    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles`,
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );
                console.log(`[Auth] Available roles: ${rolesResponse.data.map((r: any) => r.name).join(', ')}`);

                const appUserRole = rolesResponse.data.find((r: any) => r.name === 'app-user');
                if (appUserRole) {
                    await axios.post(
                        `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`,
                        [appUserRole],
                        { headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' } }
                    );
                    console.log(`[Auth] Role 'app-user' assigned successfully`);
                } else {
                    throw new Error('app-user role not found in Keycloak realm');
                }
            } catch (setupErr: any) {
                console.error('Critical: Account created but role/action assignment failed:', setupErr.response?.data || setupErr.message);
                if (setupErr.response) console.error('Full Keycloak Error:', JSON.stringify(setupErr.response.data));
                // Even though the user is created in Keycloak, we must fail the request here so the 
                // client knows it didn't complete successfully. The JIT sync will not happen.
                res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Account created but initialization failed. Please contact support.',
                    code: 'ACCOUNT_INIT_FAILED'
                });
                return;
            }
        }

        // Note: The local database record is created via JIT provisioning in the 
        // authenticate middleware during the very first request after sign-in.
        // This ensures the local role is always in sync with Keycloak.

        // 4. Sign in immediately to get tokens
        let tokens;
        try {
            tokens = await getKeycloakTokens(username, password);
        } catch (tokenErr: any) {
            const kcError = tokenErr.response?.data;
            console.error('[Auth] Auto-signin after signup failed:', JSON.stringify(kcError));
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Account created but could not sign in automatically. Please sign in.',
                code: 'AUTO_SIGNIN_FAILED'
            });
            return;
        }

        res.status(201).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            idToken: tokens.idToken,
            expiresIn: tokens.expiresIn,
            user: { username, email }
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: 'Bad Request',
                message: error.errors[0]?.message || 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: error.errors
            });
            return;
        }

        // Keycloak Admin API error
        const kcStatus = error.response?.status;
        const kcMsg = error.response?.data?.errorMessage || error.response?.data?.error;

        if (kcStatus === 409) {
            res.status(409).json({ error: 'Conflict', message: 'Username or email already exists', code: 'DUPLICATE_USER' });
            return;
        }

        console.error('Sign up error:', kcMsg || error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during sign up',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = signInSchema.parse(req.body);

        let tokens;
        try {
            tokens = await getKeycloakTokens(username, password);
        } catch (err: any) {
            const kcError = err.response?.data?.error;
            if (kcError === 'invalid_grant') {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid username or password',
                    code: 'INVALID_CREDENTIALS'
                });
                return;
            }
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Authentication service unavailable. Please try again.',
                code: 'AUTH_SERVICE_DOWN'
            });
            return;
        }

        res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            idToken: tokens.idToken,
            expiresIn: tokens.expiresIn
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: error.errors
            });
            return;
        }
        console.error('Sign in error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during sign in',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken: token } = refreshSchema.parse(req.body);

        const form = new URLSearchParams({
            client_id: KEYCLOAK_CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: token
        });

        const response = await axios.post(
            `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
            form.toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        res.json({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Bad Request', message: 'refreshToken is required', code: 'VALIDATION_ERROR' });
            return;
        }
        res.status(401).json({ error: 'Unauthorized', message: 'Refresh token expired or invalid', code: 'TOKEN_EXPIRED' });
    }
};

export const signOut = async (req: Request, res: Response): Promise<void> => {
    // Optionally revoke the refresh token in Keycloak
    const { refreshToken: token } = req.body;
    if (token) {
        try {
            const form = new URLSearchParams({
                client_id: KEYCLOAK_CLIENT_ID,
                refresh_token: token
            });
            await axios.post(
                `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
                form.toString(),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
        } catch {
            // Best-effort — continue even if revocation fails
        }
    }
    res.status(204).send();
};

export const oauthRedirect = async (req: Request, res: Response): Promise<void> => {
    const { provider } = req.params;

    // In a real application, you would generate the Keycloak Authorization URL
    // specifically for the requested provider (google, apple).
    // The redirect_uri would correspond to your Capacitor app deep link.

    // For now, this is a placeholder acknowledging the architecture design
    // that Social Logins happen at the Keycloak realm level using PKCE.
    const keycloakAuthUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth` +
        `?client_id=${KEYCLOAK_CLIENT_ID}` +
        `&redirect_uri=lumaapp://oauth/callback` +
        `&response_type=code` +
        `&scope=openid email profile` +
        `&kc_idp_hint=${provider}`;

    res.json({
        redirectUrl: keycloakAuthUrl,
        message: `Redirecting to Keycloak identity provider: ${provider}`
    });
};
