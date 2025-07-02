import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationBanner, Notification } from '../types';

interface NotificationState {
  banners: NotificationBanner[];
  notifications: Notification[];
  unreadCount: number;
  isInitialized: boolean;
  
  // Actions
  addBanner: (banner: Omit<NotificationBanner, 'id' | 'createdAt'>) => void;
  dismissBanner: (bannerId: string) => void;
  clearAllBanners: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Getters
  getVisibleBanners: () => NotificationBanner[];
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: string) => Notification[];
}

// Mock notifications for development
const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    title: 'Payment Reminder',
    message: 'Your contribution of ₦50,000 for Lagos Friends Circle is due in 3 days.',
    type: 'payment_reminder',
    groupId: 'group1',
    groupName: 'Lagos Friends Circle',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    actionType: 'navigate',
    actionData: { screen: 'GroupDetails', params: { groupId: 'group1' } },
    priority: 'high',
    amount: 50000,
  },
  {
    id: 'notif_2',
    title: 'Collection Ready!',
    message: 'Your turn to collect ₦900,000 from Office Colleagues group is coming up next month.',
    type: 'collection_ready',
    groupId: 'group2',
    groupName: 'Office Colleagues',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    actionType: 'navigate',
    actionData: { screen: 'GroupDetails', params: { groupId: 'group2' } },
    priority: 'high',
    amount: 900000,
  },
  {
    id: 'notif_3',
    title: 'Payment Received',
    message: 'Emeka Nwosu has contributed ₦50,000 to Lagos Friends Circle.',
    type: 'payment_received',
    groupId: 'group1',
    groupName: 'Lagos Friends Circle',
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    actionType: 'navigate',
    actionData: { screen: 'Payments' },
    priority: 'medium',
    amount: 50000,
    memberName: 'Emeka Nwosu',
  },
  {
    id: 'notif_4',
    title: 'New Group Invitation',
    message: 'You have been invited to join "University Alumni Circle" by Kemi Adebayo.',
    type: 'group_invite',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    actionType: 'navigate',
    actionData: { screen: 'InviteRequests' },
    priority: 'medium',
    memberName: 'Kemi Adebayo',
  },
  {
    id: 'notif_5',
    title: 'Group Update',
    message: 'Lagos Friends Circle rotation positions have been assigned. Check your position!',
    type: 'group_update',
    groupId: 'group1',
    groupName: 'Lagos Friends Circle',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    actionType: 'navigate',
    actionData: { screen: 'RotationTimeline', params: { groupId: 'group1' } },
    priority: 'medium',
  },
  {
    id: 'notif_6',
    title: 'Welcome to Adashi!',
    message: 'Get started by creating your first savings group or joining an existing one.',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    actionType: 'navigate',
    actionData: { screen: 'Groups' },
    priority: 'low',
  },
  {
    id: 'notif_7',
    title: 'Payment Overdue',
    message: 'Your contribution to Office Colleagues is 2 days overdue. Please pay to avoid penalties.',
    type: 'payment_reminder',
    groupId: 'group2',
    groupName: 'Office Colleagues',
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    actionType: 'navigate',
    actionData: { screen: 'GroupDetails', params: { groupId: 'group2' } },
    priority: 'high',
    amount: 75000,
  },
  {
    id: 'notif_8',
    title: 'New Member Joined',
    message: 'Ibrahim Yakubu has joined Lagos Friends Circle.',
    type: 'member_joined',
    groupId: 'group1',
    groupName: 'Lagos Friends Circle',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    actionType: 'navigate',
    actionData: { screen: 'GroupDetails', params: { groupId: 'group1' } },
    priority: 'low',
    memberName: 'Ibrahim Yakubu',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      banners: [],
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
      isInitialized: true,

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

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          const newNotifications = [newNotification, ...state.notifications];
          return {
            notifications: newNotifications,
            unreadCount: newNotifications.filter(n => !n.isRead).length,
          };
        }),

      markAsRead: (notificationId) =>
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          );
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.isRead).length,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          })),
          unreadCount: 0,
        })),

      deleteNotification: (notificationId) =>
        set((state) => {
          const filteredNotifications = state.notifications.filter(
            (notification) => notification.id !== notificationId
          );
          return {
            notifications: filteredNotifications,
            unreadCount: filteredNotifications.filter(n => !n.isRead).length,
          };
        }),

      clearAllNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),

      getVisibleBanners: () => {
        const { banners } = get();
        return banners.filter((banner) => banner.isVisible);
      },

      getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter((notification) => !notification.isRead);
      },

      getNotificationsByType: (type) => {
        const { notifications } = get();
        return notifications.filter((notification) => notification.type === type);
      },
    }),
    {
      name: 'adashi-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        banners: state.banners,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        isInitialized: state.isInitialized,
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