
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
        roles: string[];
    };
}

// Keycloak Configuration
const KEYCLOAK_REALM = 'luma-realm';
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

const client = jwksClient({
    jwksUri: JWKS_URI
});

function getKey(header: any, callback: any) {
    client.getSigningKey(header.kid, function (err, key) {
        if (err) {
            callback(err, null);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
        return;
    }

    const token = authHeader.substring(7);

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded: any) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
            return;
        }

        try {
            // Extract user details from token
            // `sub` is the standard OIDC subject identifier; fall back to jti+username if missing
            const keycloakId = decoded?.sub || decoded?.jti;

            if (!keycloakId) {
                console.error('[Auth] Token missing sub and jti claims');
                res.status(401).json({ error: 'Unauthorized', message: 'Invalid token structure' });
                return;
            }



            const username = decoded.preferred_username || decoded.email || 'unknown';
            const email = decoded.email;
            const realmAccess = decoded.realm_access || {};
            const roles = realmAccess.roles || [];

            // Derive local role from Keycloak realm roles
            const localRole = roles.includes('app-admin') ? 'admin' : 'user';

            // JIT Provisioning: Sync user to local DB
            let user = await prisma.user.findUnique({
                where: { keycloakId }
            });

            if (!user) {
                // Check if user exists by username/email to link accounts
                const existingUser = await prisma.user.findFirst({
                    where: { OR: [{ username }, ...(email ? [{ email }] : [])] }
                });

                if (existingUser) {
                    // Link existing user to this Keycloak ID and sync role
                    user = await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { keycloakId, role: localRole }
                    });
                } else {
                    // Create new user via JIT provisioning
                    user = await prisma.user.create({
                        data: {
                            keycloakId,
                            username,
                            email: email || `${username}@placeholder.com`,
                            passwordHash: 'oauth_managed',
                            displayName: decoded.name || username,
                            role: localRole
                        }
                    });
                }
            } else if (user.role !== localRole) {
                // Sync role if it changed in Keycloak
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { role: localRole }
                });
            }

            req.user = {
                userId: user.id,
                username: user.username,
                roles: roles // Use the latest roles from JWT
            };

            next();
        } catch (dbError) {
            console.error('JIT Provisioning failed:', dbError);
            res.status(500).json({ error: 'Internal Server Error', message: 'User synchronization failed' });
        }
    });
};

export const optionalAuthenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.substring(7);

    jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded: any) => {
        if (!err && decoded) {
            try {
                const keycloakId = decoded.sub || decoded.jti;
                if (keycloakId) {
                    const realmAccess = decoded.realm_access || {};
                    const roles = realmAccess.roles || [];
                    const localRole = roles.includes('app-admin') ? 'admin' : 'user';

                    let user = await prisma.user.findUnique({
                        where: { keycloakId }
                    });

                    // JIT provision if user doesn't exist yet
                    if (!user) {
                        const username = decoded.preferred_username || decoded.email || 'unknown';
                        const email = decoded.email;
                        const existingUser = await prisma.user.findFirst({
                            where: { OR: [{ username }, ...(email ? [{ email }] : [])] }
                        });
                        if (existingUser) {
                            user = await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { keycloakId, role: localRole }
                            });
                        } else {
                            user = await prisma.user.create({
                                data: {
                                    keycloakId,
                                    username,
                                    email: email || `${username}@placeholder.com`,
                                    passwordHash: 'oauth_managed',
                                    displayName: decoded.name || username,
                                    role: localRole
                                }
                            });
                        }
                    } else if (user.role !== localRole) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { role: localRole }
                        });
                    }

                    if (user) {
                        req.user = {
                            userId: user.id,
                            username: user.username,
                            roles: roles // Use the latest roles from JWT
                        };
                    }
                }
            } catch (ignore) {
                console.warn('[OptionalAuth] JIT/Lookup failed:', ignore);
            }
        }
        next();
    });
};

// Role-based authorization middleware factory
export const requireRole = (...requiredRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
            return;
        }

        const hasRole = requiredRoles.some(role => req.user!.roles.includes(role));
        if (!hasRole) {
            res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
