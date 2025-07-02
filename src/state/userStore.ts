import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
  totalContributions: number;
  activeGroups: number;
  completedCycles: number;
}

interface UserState {
  profile: UserProfile | null;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  
  // Getters
  getDisplayName: () => string;
  getInitials: () => string;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      clearProfile: () => set({ profile: null }),

      getDisplayName: () => {
        const { profile } = get();
        if (!profile) return 'Guest User';
        const firstName = profile.name.split(' ')[0];
        return firstName;
      },

      getInitials: () => {
        const { profile } = get();
        if (!profile) return 'GU';
        return profile.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },
    }),
    {
      name: 'adashi-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

// Mock user data
export const mockUserProfile: UserProfile = {
  id: 'user_me',
  name: 'Adunni Okafor',
  email: 'adunni.okafor@email.com',
  phone: '+234 801 234 5678',
  joinDate: '2024-03-15T00:00:00Z',
  totalContributions: 650000,
  activeGroups: 2,
  completedCycles: 3,
};