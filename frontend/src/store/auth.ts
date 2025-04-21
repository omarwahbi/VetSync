import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ClinicInfo {
  id: string;
  name: string;
  canSendReminders: boolean;
  isActive?: boolean;
  subscriptionEndDate?: string;
}

interface User {
  id?: string;
  email?: string;
  role?: string;
  clinicId?: string;
  firstName?: string;
  lastName?: string;
  clinic?: ClinicInfo | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setAccessToken: (accessToken: string | null) => set(() => ({
        accessToken,
        isAuthenticated: !!accessToken,
      })),
      
      setUser: (user: User | null) => set(() => ({ user })),
      
      logout: () => set(() => ({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      })),
      
      setLoading: (loading: boolean) => set(() => ({ isLoading: loading })),
    }),
    {
      name: 'vet-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
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
          state.isAuthenticated = !!state.accessToken;
          // Set loading to false after rehydration is complete
          state.setLoading(false);
        }
      },
    }
  )
); 