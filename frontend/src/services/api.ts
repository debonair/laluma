import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { tokenStorage, authService } from './auth.service';

import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // In Android emulator, localhost points to the emulator itself. We need to use 10.0.2.2 to reach the host machine.
    if (Capacitor.getPlatform() === 'android') {
        return 'http://10.0.2.2:3000';
    }

    return 'http://localhost:3000';
};

export const SERVER_URL = getBaseUrl();
const API_BASE_URL = `${SERVER_URL}/api`;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor — attach token from localStorage (with silent refresh if needed)
apiClient.interceptors.request.use(
    async (config) => {
        // Don't add auth header for auth endpoints themselves
        const isAuthEndpoint = config.url?.startsWith('/auth/');
        if (isAuthEndpoint) return config;

        let token = tokenStorage.getAccessToken();

        if (token && tokenStorage.isExpired()) {
            // Silently refresh the token
            const refreshToken = tokenStorage.getRefreshToken();
            if (refreshToken) {
                try {
                    const newTokens = await authService.refresh(refreshToken);
                    tokenStorage.save(newTokens);
                    token = newTokens.accessToken;
                } catch {
                    // Refresh failed — clear tokens and redirect to sign in
                    tokenStorage.clear();
                    window.location.href = '/signin';
                    return config;
                }
            } else {
                tokenStorage.clear();
                window.location.href = '/signin';
                return config;
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            const isAuthEndpoint = error.config?.url?.startsWith('/auth/');
            if (!isAuthEndpoint) {
                tokenStorage.clear();
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export interface APIError {
    error: string;
    message: string;
    code: string;
    details?: unknown;
}

export const handleAPIError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as APIError;
        return apiError?.message || 'An error occurred';
    }
    return 'An unexpected error occurred';
};

export default apiClient;
