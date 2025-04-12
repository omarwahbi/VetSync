import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  email?: string;
  role?: string;
  clinicId?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setToken: (token: string | null) => set(() => ({
        token,
        isAuthenticated: !!token,
      })),
      
      setUser: (user: User | null) => set(() => ({ user })),
      
      logout: () => set(() => ({
        token: null,
        user: null,
        isAuthenticated: false,
      })),
      
      setLoading: (loading: boolean) => set(() => ({ isLoading: loading })),
    }),
    {
      name: 'vet-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating auth state:', error);
          if (state) {
            state.setLoading(false);
            state.isAuthenticated = false;
          }
          return;
        }
        
        if (state) {
          // Explicitly update authentication state based on token presence
          state.isAuthenticated = !!state.token;
          // Set loading to false after rehydration is complete
          state.setLoading(false);
        }
      },
    }
  )
); 