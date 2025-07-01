import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, User, Payment, TimelineItem, Message } from '../types';

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  payments: Payment[];
  timeline: TimelineItem[];
  messages: Message[];
  
  // Actions
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  setActiveGroup: (groupId: string | null) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => void;
  addMessage: (message: Message) => void;
  updateTimeline: (groupId: string, timeline: TimelineItem[]) => void;
  
  // Getters
  getActiveGroup: () => Group | null;
  getGroupPayments: (groupId: string) => Payment[];
  getGroupTimeline: (groupId: string) => TimelineItem[];
  getGroupMessages: (groupId: string) => Message[];
  getTotalSaved: () => number;
  getUpcomingPayments: () => Payment[];
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      activeGroupId: null,
      payments: [],
      timeline: [],
      messages: [],

      addGroup: (group) =>
        set((state) => ({
          groups: [...state.groups, group],
        })),

      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          ),
        })),

      setActiveGroup: (groupId) =>
        set({ activeGroupId: groupId }),

      addPayment: (payment) =>
        set((state) => ({
          payments: [...state.payments, payment],
        })),

      updatePayment: (paymentId, updates) =>
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === paymentId ? { ...payment, ...updates } : payment
          ),
        })),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateTimeline: (groupId, newTimeline) =>
        set((state) => ({
          timeline: [
            ...state.timeline.filter((item) => item.groupId !== groupId),
            ...newTimeline,
          ],
        })),

      // Getters
      getActiveGroup: () => {
        const { groups, activeGroupId } = get();
        return groups.find((group) => group.id === activeGroupId) || null;
      },

      getGroupPayments: (groupId) => {
        const { payments } = get();
        return payments.filter((payment) => payment.groupId === groupId);
      },

      getGroupTimeline: (groupId) => {
        const { timeline } = get();
        return timeline.filter((item) => item.groupId === groupId);
      },

      getGroupMessages: (groupId) => {
        const { messages } = get();
        return messages.filter((message) => message.groupId === groupId);
      },

      getTotalSaved: () => {
        const { groups } = get();
        return groups.reduce((total, group) => total + group.totalSaved, 0);
      },

      getUpcomingPayments: () => {
        const { payments } = get();
        const now = new Date();
        return payments.filter((payment) => {
          const paymentDate = new Date(payment.date);
          return paymentDate > now && payment.status === 'pending';
        }).slice(0, 3);
      },
    }),
    {
      name: 'contrib-tracker-groups',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
        payments: state.payments,
        timeline: state.timeline,
        messages: state.messages,
      }),
    }
  )
);