/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { userService, type UserProfile } from '../services/user.service';
import { authService, tokenStorage, type AuthTokens } from '../services/auth.service';
import { handleAPIError } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    aboutMe?: string;
    motherhoodStage?: string;
    lookingFor?: string[];
    hasCompletedOnboarding?: boolean;
    location?: {
        radius: number;
        anywhere: boolean;
        city?: string;
        country?: string;
    };
    roles?: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    signIn: (username: string, password: string) => Promise<void>;
    signUp: (username: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    clearError: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapAPIUserToUser = (apiUser: UserProfile): User => ({
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    displayName: apiUser.display_name,
    aboutMe: apiUser.about_me,
    motherhoodStage: apiUser.motherhood_stage,
    hasCompletedOnboarding: apiUser.has_completed_onboarding,
    lookingFor: apiUser.looking_for,
    location: apiUser.location ? {
        radius: apiUser.location.radius,
        anywhere: apiUser.location.anywhere,
        city: apiUser.location.city,
        country: apiUser.location.country,
    } : undefined,
    roles: [],
});

/** Decode JWT payload without a library */
function parseJwtPayload(token: string): Record<string, unknown> {
    if (!token || token === 'undefined' || token === 'null') return {};
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return {};
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return {};
    }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAndSetUser = useCallback(async () => {
        const userProfile = await userService.getCurrentUser();
        const token = tokenStorage.getAccessToken();
        const parsed = (token ? parseJwtPayload(token) : {}) as { realm_access?: { roles?: string[] } };
        const mapped = mapAPIUserToUser(userProfile);
        mapped.roles = parsed.realm_access?.roles || [];
        setUser(mapped);
    }, []);

    // On mount — check if we have valid tokens in localStorage
    useEffect(() => {
        const restoreSession = async () => {
            const token = tokenStorage.getAccessToken();
            const refreshToken = tokenStorage.getRefreshToken();

            if (!token && !refreshToken) {
                setIsLoading(false);
                return;
            }

            try {
                // Refresh if expired (or close to expiring)
                if (tokenStorage.isExpired() && refreshToken) {
                    const newTokens = await authService.refresh(refreshToken);
                    tokenStorage.save(newTokens);
                }

                await fetchAndSetUser();
                setIsAuthenticated(true);
            } catch {
                // Session invalid — clear and show sign-in
                tokenStorage.clear();
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, [fetchAndSetUser]);

    const saveTokensAndLogin = async (tokens: AuthTokens) => {
        tokenStorage.save(tokens);
        await fetchAndSetUser();
        setIsAuthenticated(true);
        setError(null);
    };

    const signIn = async (username: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const tokens = await authService.signIn({ username, password });
            await saveTokensAndLogin(tokens);
        } catch (err) {
            const msg = handleAPIError(err);
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (username: string, email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const tokens = await authService.signUp({ username, email, password });
            await saveTokensAndLogin(tokens);
        } catch (err) {
            const msg = handleAPIError(err);
            setError(msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        const refreshToken = tokenStorage.getRefreshToken();
        try {
            await authService.signOut(refreshToken || undefined);
        } catch {
            // Best-effort
        }
        tokenStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            setError(null);
            setIsLoading(true);
            const apiData = {
                display_name: data.displayName,
                about_me: data.aboutMe,
                motherhood_stage: data.motherhoodStage,
                looking_for: data.lookingFor,
                location: data.location ? {
                    radius: data.location.radius,
                    anywhere: data.location.anywhere,
                    city: data.location.city,
                    country: data.location.country,
                } : undefined,
            };
            const updatedUser = await userService.updateCurrentUser(apiData);
            setUser(prev => prev ? { ...prev, ...mapAPIUserToUser(updatedUser) } : null);
        } catch (err) {
            const errorMessage = handleAPIError(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            error,
            signIn,
            signUp,
            signOut,
            updateProfile,
            clearError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
