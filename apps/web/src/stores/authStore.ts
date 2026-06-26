/**
 * Legora AI — Auth Store (Zustand)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.login({ email, password });
          localStorage.setItem("legora_token", response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
          const response = await api.register({
            email,
            password,
            full_name: fullName,
          });
          localStorage.setItem("legora_token", response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("legora_token");
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("legora_token");
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        try {
          const user = await api.getMe();
          set({ user, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem("legora_token");
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "legora-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
