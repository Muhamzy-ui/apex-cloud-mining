import { create } from 'zustand';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const { data } = await authAPI.me();
      set({ user: data, isAuthenticated: true });
    } catch {
      localStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(credentials);
      const userRes = await authAPI.me();
      set({ user: userRes.data, isAuthenticated: true, isLoading: false });
      toast.success('Welcome!');
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.detail || 'Login failed');
      return { success: false };
    }
  },

  register: async (userData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(userData);
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
      }
      const userRes = await authAPI.me();
      set({ user: userRes.data, isAuthenticated: true, isLoading: false });
      toast.success('Account created!');
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      toast.error(err.response?.data?.email?.[0] || 'Registration failed');
      return { success: false };
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await authAPI.me();
      set({ user: data });
    } catch {
      get().logout();
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
    toast.success('Logged out');
  },
}));

export default useAuthStore;