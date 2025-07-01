import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationBanner } from '../types';

interface NotificationState {
  banners: NotificationBanner[];
  
  // Actions
  addBanner: (banner: Omit<NotificationBanner, 'id' | 'createdAt'>) => void;
  dismissBanner: (bannerId: string) => void;
  clearAllBanners: () => void;
  
  // Getters
  getVisibleBanners: () => NotificationBanner[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      banners: [],

      addBanner: (banner) => {
        const newBanner: NotificationBanner = {
          ...banner,
          id: `banner_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          banners: [...state.banners, newBanner],
        }));
      },

      dismissBanner: (bannerId) =>
        set((state) => ({
          banners: state.banners.map((banner) =>
            banner.id === bannerId ? { ...banner, isVisible: false } : banner
          ),
        })),

      clearAllBanners: () =>
        set((state) => ({
          banners: state.banners.map((banner) => ({ ...banner, isVisible: false })),
        })),

      getVisibleBanners: () => {
        const { banners } = get();
        return banners.filter((banner) => banner.isVisible);
      },
    }),
    {
      name: 'contrib-tracker-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        banners: state.banners,
      }),
    }
  )
);

// Helper function to create common notification types
export const createPaymentDueBanner = (groupId: string, groupName: string, amount: number, daysLeft: number): Omit<NotificationBanner, 'id' | 'createdAt'> => ({
  type: 'payment_due',
  title: 'Payment Due Soon',
  message: `${daysLeft} days left to contribute ₦${amount.toLocaleString()} to ${groupName}`,
  groupId,
  daysLeft,
  amount,
  isVisible: true,
});

export const createCollectionTurnBanner = (groupId: string, groupName: string, amount: number): Omit<NotificationBanner, 'id' | 'createdAt'> => ({
  type: 'collection_turn',
  title: "It's Your Turn!",
  message: `You can collect ₦${amount.toLocaleString()} from ${groupName} this month`,
  groupId,
  amount,
  isVisible: true,
});

export const createNewMemberBanner = (groupId: string, groupName: string, memberName: string): Omit<NotificationBanner, 'id' | 'createdAt'> => ({
  type: 'new_member',
  title: 'New Member Joined',
  message: `${memberName} has joined ${groupName}`,
  groupId,
  isVisible: true,
});