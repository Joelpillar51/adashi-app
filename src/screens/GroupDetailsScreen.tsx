import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { getDaysUntil, formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';
import PaymentOverlay from '../components/PaymentOverlay';

interface GroupDetailsScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function GroupDetailsScreen({ route, navigation }: GroupDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups, getGroupTimeline, getGroupMessages } = useGroupStore();
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  const group = groups.find(g => g.id === groupId);
  const timeline = getGroupTimeline(groupId);
  const messages = getGroupMessages(groupId);

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  const currentTimelineItem = timeline.find(item => item.status === 'current');
  const nextTimelineItem = timeline.find(item => item.status === 'upcoming');
  const completedItems = timeline.filter(item => item.status === 'completed').length;

  const isOwnerOrAdmin = group.role === 'owner' || group.role === 'admin';
  const hasAssignedPositions = group.members.some(member => member.rotationPosition > 0);

  const quickActions = [
    {
      title: 'Group Chat',
      subtitle: `${messages.length} messages`,
      icon: 'chatbubble' as const,
      color: 'bg-blue-500',
      onPress: () => navigation.navigate('GroupChat', { groupId }),
    },
    {
      title: 'Timeline',
      subtitle: `${completedItems}/${timeline.length} completed`,
      icon: 'time' as const,
      color: 'bg-purple-500',
      onPress: () => navigation.navigate('RotationTimeline', { groupId }),
    },
    ...(isOwnerOrAdmin ? [{
      title: hasAssignedPositions ? 'Manage Positions' : 'Assign Positions',
      subtitle: hasAssignedPositions ? 'View or reassign' : 'Set collection order',
      icon: 'shuffle' as const,
      color: 'bg-indigo-500',
      onPress: () => navigation.navigate('PositionAssignment', { groupId }),
    }] : []),
    {
      title: 'Invite Members',
      subtitle: 'Share invite code or link',
      icon: 'person-add' as const,
      color: 'bg-purple-500',
      onPress: () => navigation.navigate('InviteMembers', { groupId }),
    },
    {
      title: 'Make Payment',
      subtitle: 'Transfer funds',
      icon: 'card' as const,
      color: 'bg-emerald-500',
      onPress: () => setShowPaymentOverlay(true),
    },
  ];

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900 flex-1 text-center">{group.name}</Text>
          <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="ellipsis-horizontal" size={20} color="#374151" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Group Overview Card */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-sm text-gray-600">Your Role</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize">{group.role}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-600">Status</Text>
              <View className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <Text className="text-sm font-medium text-emerald-700 capitalize">{group.status}</Text>
              </View>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mb-4 leading-5">{group.description}</Text>

          {/* Stats Grid */}
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 mb-1">Monthly Amount</Text>
              <Text className="text-lg font-bold text-gray-900">{formatNaira(group.monthlyAmount)}</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 mb-1">Total Saved</Text>
              <Text className="text-lg font-bold text-gray-900">{formatCompactNaira(group.totalSaved)}</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 mb-1">Members</Text>
              <Text className="text-lg font-bold text-gray-900">{group.memberCount}</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-sm text-gray-600 mb-1">Your Position</Text>
              <Text className="text-lg font-bold text-gray-900">#{group.myPosition}</Text>
            </View>
          </View>
        </View>

        {/* Current Status */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Current Status</Text>
          
          {currentTimelineItem ? (
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-blue-800">Current Recipient</Text>
                <Text className="text-sm text-blue-600">{formatWATDate(currentTimelineItem.dueDate)}</Text>
              </View>
              <Text className="text-lg font-bold text-blue-900">{currentTimelineItem.memberName}</Text>
              <Text className="text-sm text-blue-700 mt-1">Position #{currentTimelineItem.position}</Text>
            </View>
          ) : (
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-sm text-gray-600">No active collection period</Text>
            </View>
          )}

          {nextTimelineItem && (
            <View>
              <Text className="text-sm text-gray-600 mb-2">Next Collection</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">{nextTimelineItem.memberName}</Text>
                <Text className="text-sm text-gray-600">{formatWATDate(nextTimelineItem.dueDate)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Progress */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Cycle Progress</Text>
            <Text className="text-sm text-gray-600">{Math.round(group.cycleProgress)}%</Text>
          </View>
          <View className="h-3 bg-gray-100 rounded-full mb-4">
            <View 
              className="h-3 bg-blue-500 rounded-full"
              style={{ width: `${group.cycleProgress}%` }}
            />
          </View>
          <Text className="text-sm text-gray-600">
            {completedItems} of {timeline.length} collections completed
          </Text>
        </View>

        {/* Position Status */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">Position Status</Text>
            {isOwnerOrAdmin && (
              <Pressable 
                onPress={() => navigation.navigate('PositionAssignment', { groupId })}
                className="bg-blue-50 px-3 py-1 rounded-lg"
              >
                <Text className="text-blue-600 text-sm font-medium">
                  {hasAssignedPositions ? 'Manage' : 'Assign'}
                </Text>
              </Pressable>
            )}
          </View>
          
          {hasAssignedPositions ? (
            <View className="gap-3">
              {group.members
                .sort((a, b) => a.rotationPosition - b.rotationPosition)
                .slice(0, 3)
                .map((member) => (
                  <View key={member.id} className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold text-sm">#{member.rotationPosition}</Text>
                    </View>
                    <Text className="text-base text-gray-900 flex-1">{member.name}</Text>
                    <Text className="text-sm text-gray-600">
                      {member.rotationPosition === 1 ? 'First' : 
                       member.rotationPosition === 2 ? 'Second' : 
                       member.rotationPosition === 3 ? 'Third' : `${member.rotationPosition}th`}
                    </Text>
                  </View>
                ))}
              {group.members.length > 3 && (
                <Text className="text-sm text-gray-500 text-center mt-2">
                  +{group.members.length - 3} more members
                </Text>
              )}
              <Pressable 
                onPress={() => navigation.navigate('InviteMembers', { groupId })}
                className="mt-4 pt-4 border-t border-gray-100 flex-row items-center justify-center"
              >
                <Ionicons name="person-add" size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Invite More Members</Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center py-4">
              <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="shuffle-outline" size={24} color="#6B7280" />
              </View>
              <Text className="text-base font-medium text-gray-900 mb-1">Positions Not Assigned</Text>
              <Text className="text-sm text-gray-600 text-center">
                {isOwnerOrAdmin 
                  ? 'Assign collection positions to start the rotation cycle'
                  : 'Waiting for admin to assign collection positions'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Payment Alert */}
        {getDaysUntil(group.nextPaymentDue) <= 7 && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center">
              <Ionicons name="warning" size={20} color="#D97706" />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-amber-800">Payment Due Soon</Text>
                <Text className="text-sm text-amber-700 mt-1">
                  {formatNaira(group.monthlyAmount)} due in {getDaysUntil(group.nextPaymentDue)} days
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="gap-3">
            {quickActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center"
              >
                <View className={cn('w-12 h-12 rounded-2xl items-center justify-center mr-4', action.color)}>
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{action.title}</Text>
                  <Text className="text-sm text-gray-600 mt-1">{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</Text>
          {messages.slice(-3).map((message) => (
            <View key={message.id} className="bg-white rounded-xl p-4 border border-gray-100 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-900">{message.sender}</Text>
                <Text className="text-xs text-gray-500">{formatWATDate(message.timestamp)}</Text>
              </View>
              <Text className="text-sm text-gray-700 leading-5">{message.message}</Text>
            </View>
          ))}
          {messages.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
              <Text className="text-sm text-gray-600 mt-2">No messages yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Overlay */}
      <PaymentOverlay
        visible={showPaymentOverlay}
        onClose={() => setShowPaymentOverlay(false)}
        group={group}
        onPaymentComplete={() => {
          // Could update payment status or refresh data here
          console.log('Payment completed for group:', group.name);
        }}
      />
    </View>
  );
}