import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'PERFORMER';
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isLoading: true,
    login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoading: false });
    },
}));
