import { create } from 'zustand';

interface UserProfile {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
  profile_photo_url?: string;
  bio?: string;
  home_city?: string;
  travel_preferences: string[];
  followers_count: number;
  following_count: number;
  posts_count: number;
  trips_count: number;
  badges: string[];
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  isAuthModalOpen: boolean;
  authModalTitle: string;
  authModalSubtitle: string;
  authModalOnSuccess: (() => void) | null;
  openAuthModal: (options?: { title?: string; subtitle?: string; onSuccess?: () => void }) => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Read initial states from local storage
  const savedToken = localStorage.getItem('ww_token');
  const savedUser = localStorage.getItem('ww_user');

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,
    isAuthenticated: !!savedToken,
    isAuthModalOpen: false,
    authModalTitle: 'Save Your Travel Plan',
    authModalSubtitle: 'Sign in to save, edit, and access your itinerary anywhere.',
    authModalOnSuccess: null,
    openAuthModal: (options) => set({
      isAuthModalOpen: true,
      authModalTitle: options?.title || 'Save Your Travel Plan',
      authModalSubtitle: options?.subtitle || 'Sign in to save, edit, and access your itinerary anywhere.',
      authModalOnSuccess: options?.onSuccess || null
    }),
    closeAuthModal: () => set({
      isAuthModalOpen: false,
      authModalOnSuccess: null
    }),
    login: (token, user) => {
      localStorage.setItem('ww_token', token);
      localStorage.setItem('ww_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('ww_token');
      localStorage.removeItem('ww_user');
      localStorage.removeItem('ww_cart'); // Clear cached cart info
      set({ token: null, user: null, isAuthenticated: false });
    },
    updateUser: (user) => {
      localStorage.setItem('ww_user', JSON.stringify(user));
      set({ user });
    }
  };
});
