import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useInviteRequestStore } from '../state/inviteRequestStore';
import { useUserStore } from '../state/userStore';
import { useGroupStore } from '../state/groupStore';
import { formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';

interface RequestInviteScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function RequestInviteScreen({ route, navigation }: RequestInviteScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups } = useGroupStore();
  const { profile } = useUserStore();
  const { createRequest, getRequestsForUser, hasApprovedRequest } = useInviteRequestStore();
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const group = groups.find(g => g.id === groupId);
  const userRequests = getRequestsForUser(profile?.id || '');
  const existingRequest = userRequests.find(req => req.groupId === groupId);
  const hasApproval = hasApprovedRequest(groupId, profile?.id || '');

  if (!group || !profile) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  const handleRequestInvite = async () => {
    if (!profile) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      createRequest({
        groupId,
        groupName: group.name,
        requesterId: profile.id,
        requesterName: profile.name,
        requesterEmail: profile.email,
        message: message.trim(),
      });
      
      Alert.alert(
        'Request Sent!',
        'Your invite request has been sent to the group admin. You\'ll be notified when they respond.',
        [{ text: 'OK', onPress: () => navigation?.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'denied':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  // If user has approval, navigate to invite screen
  if (hasApproval) {
    navigation?.replace('InviteMembers', { groupId });
    return null;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Request Invite Access</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">{group.name}</Text>
          <Text className="text-sm text-gray-600 mb-4">{group.description}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">{group.memberCount} members</Text>
            <Text className="text-gray-600">₦{group.monthlyAmount.toLocaleString()}/month</Text>
          </View>
        </View>

        {/* Existing Request Status */}
        {existingRequest && (
          <View className={cn('rounded-2xl p-6 border mb-6', getStatusColor(existingRequest.status))}>
            <View className="flex-row items-center mb-4">
              <Ionicons 
                name={getStatusIcon(existingRequest.status) as any} 
                size={24} 
                className={existingRequest.status === 'approved' ? 'text-emerald-600' : 
                           existingRequest.status === 'denied' ? 'text-red-600' : 'text-amber-600'} 
              />
              <Text className="text-lg font-bold ml-3">
                {existingRequest.status === 'approved' ? 'Request Approved!' :
                 existingRequest.status === 'denied' ? 'Request Denied' :
                 'Request Pending'}
              </Text>
            </View>
            
            <Text className="text-sm mb-2">
              Requested on {formatWATDate(existingRequest.createdAt)}
            </Text>
            
            {existingRequest.status === 'approved' && (
              <Text className="text-emerald-700 text-sm">
                You can now access the invite page to share group invitations with others.
              </Text>
            )}
            
            {existingRequest.status === 'denied' && existingRequest.message && (
              <View className="mt-3 p-3 bg-white rounded-xl">
                <Text className="text-sm font-medium text-gray-900 mb-1">Admin Response:</Text>
                <Text className="text-sm text-gray-700">{existingRequest.message}</Text>
              </View>
            )}
            
            {existingRequest.status === 'pending' && (
              <Text className="text-amber-700 text-sm">
                Your request is being reviewed by the group admin. You'll be notified when they respond.
              </Text>
            )}
          </View>
        )}

        {/* Request Form (only show if no existing request or if denied) */}
        {(!existingRequest || existingRequest.status === 'denied') && (
          <>
            {/* Info Banner */}
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-sm text-blue-800 ml-3 flex-1 leading-5">
                  Only group admins can generate invite codes and links. Request access to help invite new members to this savings circle.
                </Text>
              </View>
            </View>

            {/* Message Field */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                Message to Admin (Optional)
              </Text>
              <TextInput
                className="bg-white border border-gray-200 rounded-xl px-4 py-4 text-base text-gray-900 min-h-[100px]"
                placeholder="Tell the admin why you'd like invite access..."
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
              <Text className="text-gray-600 text-sm mt-2">
                Explain why you need access to invite new members
              </Text>
            </View>

            {/* Request Button */}
            <Pressable
              onPress={handleRequestInvite}
              disabled={isLoading}
              className={cn(
                'py-4 rounded-xl flex-row items-center justify-center mb-6',
                isLoading ? 'bg-gray-300' : 'bg-blue-500'
              )}
            >
              {isLoading && (
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
              )}
              <Text className="text-white font-semibold text-base">
                {isLoading ? 'Sending Request...' : 'Request Invite Access'}
              </Text>
            </Pressable>
          </>
        )}

        {/* How it Works */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">How It Works</Text>
          <View className="gap-4">
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Send Request</Text>
                <Text className="text-sm text-gray-600">
                  Request invite access from the group admin with an optional message
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Admin Reviews</Text>
                <Text className="text-sm text-gray-600">
                  The group admin will review your request and decide whether to approve it
                </Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Get Access</Text>
                <Text className="text-sm text-gray-600">
                  If approved, you'll be able to generate and share invite codes for the group
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}