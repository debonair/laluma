import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import React from 'react';
import { resetProviderMocks } from './testUtils';

beforeEach(() => {
    resetProviderMocks();
});

const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock all internal contexts dynamically
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

vi.mock('../context/ToastContext', () => ({
    useToast: vi.fn(),
    ToastProvider: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

vi.mock('../context/GroupContext', () => ({
    useGroup: vi.fn(),
    GroupProvider: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

vi.mock('../context/SocketContext', () => ({
    useSocket: vi.fn(),
    SocketProvider: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));
