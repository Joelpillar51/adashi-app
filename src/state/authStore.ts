import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  hasSeenSplash: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
  } | null;
  
  // Actions
  signIn: (user: any) => void;
  signOut: () => void;
  markOnboardingComplete: () => void;
  markSplashComplete: () => void;
  
  // Navigation state
  getInitialRoute: () => 'Splash' | 'Onboarding' | 'Auth' | 'Main';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      hasSeenOnboarding: false,
      hasSeenSplash: false,
      user: null,

      signIn: (user) => set({ 
        isAuthenticated: true, 
        user,
        hasSeenOnboarding: true 
      }),

      signOut: () => set({ 
        isAuthenticated: false, 
        user: null 
      }),

      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),
      
      markSplashComplete: () => set({ hasSeenSplash: true }),

      getInitialRoute: () => {
        const { isAuthenticated, hasSeenOnboarding, hasSeenSplash } = get();
        
        if (!hasSeenSplash) return 'Splash';
        if (!hasSeenOnboarding) return 'Onboarding';
        if (!isAuthenticated) return 'Auth';
        return 'Main';
      },
    }),
    {
      name: 'adashi-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasSeenOnboarding: state.hasSeenOnboarding,
        hasSeenSplash: state.hasSeenSplash,
        user: state.user,
      }),
    }
  )
);