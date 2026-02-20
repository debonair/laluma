import apiClient from './api';

export interface SignUpData {
    username: string;
    email: string;
    password: string;
}

export interface SignInData {
    username: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    expiresIn: number;
}

export const authService = {
    signUp: async (data: SignUpData): Promise<AuthTokens> => {
        const response = await apiClient.post<AuthTokens>('/auth/signup', data);
        return response.data;
    },

    signIn: async (data: SignInData): Promise<AuthTokens> => {
        const response = await apiClient.post<AuthTokens>('/auth/signin', data);
        return response.data;
    },

    refresh: async (refreshToken: string): Promise<AuthTokens> => {
        const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
        return response.data;
    },

    signOut: async (refreshToken?: string): Promise<void> => {
        await apiClient.post('/auth/signout', { refreshToken });
    },
};

// localStorage token helpers
const ACCESS_TOKEN_KEY = 'luma_access_token';
const REFRESH_TOKEN_KEY = 'luma_refresh_token';
const TOKEN_EXPIRY_KEY = 'luma_token_expiry';

export const tokenStorage = {
    save: (tokens: AuthTokens) => {
        console.log('[Auth] Saving tokens:', tokens);
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        const expiry = Date.now() + (tokens.expiresIn || 0) * 1000;
        console.log('[Auth] Calculated expiry:', expiry);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
    },
    getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
    isExpired: (): boolean => {
        const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        console.log('[Auth] isExpired check. Value in storage:', expiry);
        if (!expiry || isNaN(parseInt(expiry))) return true;
        return Date.now() > parseInt(expiry) - 30000; // 30s buffer
    },
    clear: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
};
