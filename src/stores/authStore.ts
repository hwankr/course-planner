/**
 * Auth Store (Client-side state)
 * NextAuth 세션과 함께 사용하는 클라이언트 상태
 */

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role?: 'student' | 'admin';
  departmentId?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));
