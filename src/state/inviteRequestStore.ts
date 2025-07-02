import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InviteRequest {
  id: string;
  groupId: string;
  groupName: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: 'pending' | 'approved' | 'denied';
  message?: string;
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

interface InviteRequestState {
  requests: InviteRequest[];
  
  // Actions
  createRequest: (request: Omit<InviteRequest, 'id' | 'createdAt' | 'status'>) => void;
  approveRequest: (requestId: string, adminId: string) => void;
  denyRequest: (requestId: string, adminId: string, reason?: string) => void;
  
  // Getters
  getRequestsForGroup: (groupId: string) => InviteRequest[];
  getRequestsForUser: (userId: string) => InviteRequest[];
  getPendingRequestsForAdmin: (adminGroups: string[]) => InviteRequest[];
  hasApprovedRequest: (groupId: string, userId: string) => boolean;
}

export const useInviteRequestStore = create<InviteRequestState>()(
  persist(
    (set, get) => ({
      requests: [],

      createRequest: (requestData) => {
        const newRequest: InviteRequest = {
          ...requestData,
          id: `req_${Date.now()}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          requests: [...state.requests, newRequest],
        }));
      },

      approveRequest: (requestId, adminId) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'approved' as const,
                  respondedAt: new Date().toISOString(),
                  respondedBy: adminId,
                }
              : request
          ),
        }));
      },

      denyRequest: (requestId, adminId, reason) => {
        set((state) => ({
          requests: state.requests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'denied' as const,
                  respondedAt: new Date().toISOString(),
                  respondedBy: adminId,
                  message: reason,
                }
              : request
          ),
        }));
      },

      getRequestsForGroup: (groupId) => {
        const { requests } = get();
        return requests.filter((request) => request.groupId === groupId);
      },

      getRequestsForUser: (userId) => {
        const { requests } = get();
        return requests.filter((request) => request.requesterId === userId);
      },

      getPendingRequestsForAdmin: (adminGroups) => {
        const { requests } = get();
        return requests.filter(
          (request) =>
            request.status === 'pending' && adminGroups.includes(request.groupId)
        );
      },

      hasApprovedRequest: (groupId, userId) => {
        const { requests } = get();
        return requests.some(
          (request) =>
            request.groupId === groupId &&
            request.requesterId === userId &&
            request.status === 'approved'
        );
      },
    }),
    {
      name: 'adashi-invite-requests',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        requests: state.requests,
      }),
    }
  )
);