import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInviteRequestStore } from '../state/inviteRequestStore';
import { useUserStore } from '../state/userStore';
import { useGroupStore } from '../state/groupStore';
import { formatWATDate, formatTimeAgo } from '../utils/date';
import { cn } from '../utils/cn';

interface InviteRequestsScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function InviteRequestsScreen({ route, navigation }: InviteRequestsScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId;
  const { groups } = useGroupStore();
  const { profile } = useUserStore();
  const { 
    getRequestsForGroup, 
    getPendingRequestsForAdmin, 
    approveRequest, 
    denyRequest 
  } = useInviteRequestStore();
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState(false);

  // Get admin groups (where user is owner or admin)
  const adminGroups = groups
    .filter(g => g.role === 'owner' || g.role === 'admin')
    .map(g => g.id);

  // Get requests based on context
  const requests = groupId 
    ? getRequestsForGroup(groupId)
    : getPendingRequestsForAdmin(adminGroups);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const handleApprove = (requestId: string) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this invite request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            approveRequest(requestId, profile?.id || '');
            Alert.alert('Approved!', 'The user can now access invite features for this group.');
          },
        },
      ]
    );
  };

  const handleDeny = (request: any) => {
    setSelectedRequest(request);
    setShowDenyModal(true);
  };

  const confirmDeny = () => {
    if (selectedRequest) {
      denyRequest(selectedRequest.id, profile?.id || '', denyReason.trim());
      setShowDenyModal(false);
      setDenyReason('');
      setSelectedRequest(null);
      Alert.alert('Request Denied', 'The user has been notified of your decision.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'denied':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const DenyModal = () => (
    <Modal
      visible={showDenyModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDenyModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-900">Deny Request</Text>
            <Pressable onPress={() => setShowDenyModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <Text className="text-base text-gray-900 mb-4">
            Denying request from <Text className="font-semibold">{selectedRequest?.requesterName}</Text>
          </Text>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Reason (Optional)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 min-h-[100px]"
              placeholder="Explain why you're denying this request..."
              value={denyReason}
              onChangeText={setDenyReason}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => setShowDenyModal(false)}
              className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirmDeny}
              className="flex-1 bg-red-500 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Deny Request</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">
            {groupId ? 'Group Invite Requests' : 'All Invite Requests'}
          </Text>
          <View className="w-10" />
        </View>
        
        {pendingCount > 0 && (
          <View className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Text className="text-amber-800 text-sm">
              {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your review
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {requests.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="mail-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Requests</Text>
            <Text className="text-base text-gray-600 text-center">
              No invite requests have been submitted yet
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {requests.map((request) => (
              <View
                key={request.id}
                className="bg-white rounded-2xl p-5 border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {request.requesterName}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2">
                      {request.requesterEmail}
                    </Text>
                    {!groupId && (
                      <Text className="text-sm text-blue-600 font-medium">
                        {request.groupName}
                      </Text>
                    )}
                  </View>
                  <View className={cn('px-3 py-1 rounded-full border', getStatusColor(request.status))}>
                    <Text className="text-xs font-medium capitalize">{request.status}</Text>
                  </View>
                </View>

                {/* Message */}
                {request.message && (
                  <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <Text className="text-sm font-medium text-gray-900 mb-2">Message:</Text>
                    <Text className="text-sm text-gray-700 leading-5">{request.message}</Text>
                  </View>
                )}

                {/* Timestamps */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xs text-gray-500">
                    Requested {formatTimeAgo(request.createdAt)}
                  </Text>
                  {request.respondedAt && (
                    <Text className="text-xs text-gray-500">
                      Responded {formatTimeAgo(request.respondedAt)}
                    </Text>
                  )}
                </View>

                {/* Admin Response */}
                {request.status === 'denied' && request.message && (
                  <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <Text className="text-sm font-medium text-red-800 mb-2">Denial Reason:</Text>
                    <Text className="text-sm text-red-700">{request.message}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => handleDeny(request)}
                      className="flex-1 bg-red-50 border border-red-200 py-3 rounded-xl flex-row items-center justify-center"
                    >
                      <Ionicons name="close" size={16} color="#DC2626" />
                      <Text className="text-red-600 font-medium ml-2">Deny</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleApprove(request.id)}
                      className="flex-1 bg-emerald-50 border border-emerald-200 py-3 rounded-xl flex-row items-center justify-center"
                    >
                      <Ionicons name="checkmark" size={16} color="#059669" />
                      <Text className="text-emerald-600 font-medium ml-2">Approve</Text>
                    </Pressable>
                  </View>
                )}

                {request.status === 'approved' && (
                  <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text className="text-emerald-700 text-sm ml-2">
                      User can now access invite features
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DenyModal />
    </View>
  );
}