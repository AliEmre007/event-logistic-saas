import { create } from 'zustand';
import { apiUrl } from '@/lib/api';

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
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
    hydrate: async () => {
        const token = get().token;
        if (!token) {
            set({ isLoading: false });
            return;
        }
        try {
            const res = await fetch(apiUrl('/auth/me'), {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ user: data.data.user, isLoading: false });
            } else {
                // Token invalid/expired
                localStorage.removeItem('token');
                set({ user: null, token: null, isLoading: false });
            }
        } catch {
            set({ isLoading: false });
        }
    },
}));