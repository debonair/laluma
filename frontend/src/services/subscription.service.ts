import apiClient from './api';

export interface Subscription {
    id: string;
    userId: string;
    tier: 'free' | 'premium' | 'premium_plus';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
}

export const subscriptionService = {
    subscribe: async (tier: 'free' | 'premium' | 'premium_plus', period: 'monthly' | 'yearly' = 'monthly'): Promise<Subscription> => {
        const response = await apiClient.post<Subscription>('/subscriptions/subscribe', { tier, period });
        return response.data;
    },

    cancel: async (): Promise<Subscription> => {
        const response = await apiClient.post<Subscription>('/subscriptions/cancel');
        return response.data;
    },

    getStatus: async (): Promise<Subscription> => {
        const response = await apiClient.get<Subscription>('/subscriptions/status');
        return response.data;
    }
};
