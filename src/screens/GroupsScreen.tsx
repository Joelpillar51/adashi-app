import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { getDaysUntil, formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';
import GroupActionOverlay from '../components/GroupActionOverlay';
import CreateGroupModal from '../components/CreateGroupModal';

export default function GroupsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { groups, setActiveGroup } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionOverlay, setShowActionOverlay] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-700';
      case 'admin':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const handleGroupPress = (group: any) => {
    setActiveGroup(group.id);
    navigation.navigate('GroupDetails', { groupId: group.id });
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">My Groups</Text>
          <Pressable 
            onPress={() => setShowActionOverlay(true)}
            className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900"
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {filteredGroups.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Groups Found</Text>
            <Text className="text-base text-gray-600 text-center mb-6">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first saving circle to get started'}
            </Text>
            {!searchQuery && (
              <Pressable 
                onPress={() => setShowActionOverlay(true)}
                className="bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Create or Join Group</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View className="gap-4">
            {filteredGroups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => handleGroupPress(group)}
                className="bg-white rounded-2xl p-6 border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-1 mr-4">
                    <Text className="text-lg font-bold text-gray-900 mb-1">{group.name}</Text>
                    <Text className="text-sm text-gray-600 leading-5">{group.description}</Text>
                  </View>
                  <View className="items-end gap-2">
                    <View className={cn('px-3 py-1 rounded-full border', getStatusColor(group.status))}>
                      <Text className="text-xs font-medium capitalize">{group.status}</Text>
                    </View>
                    <View className={cn('px-3 py-1 rounded-full', getRoleColor(group.role))}>
                      <Text className="text-xs font-medium capitalize">{group.role}</Text>
                    </View>
                  </View>
                </View>

                {/* Stats Row */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2">{group.memberCount} members</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2">{formatNaira(group.monthlyAmount)}/month</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="wallet" size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2">{formatCompactNaira(group.totalSaved)}</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-900">Cycle Progress</Text>
                    <Text className="text-sm text-gray-600">{Math.round(group.cycleProgress)}%</Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full">
                    <View 
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${group.cycleProgress}%` }}
                    />
                  </View>
                </View>

                {/* Current Status */}
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm text-gray-600">Current Recipient</Text>
                    <Text className="text-sm font-semibold text-gray-900">{group.currentRecipient}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm text-gray-600">Next Payment</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {getDaysUntil(group.nextPaymentDue)} days
                    </Text>
                  </View>
                </View>

                {/* Payment Due Warning */}
                {getDaysUntil(group.nextPaymentDue) <= 3 && group.status === 'active' && (
                  <View className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={16} color="#D97706" />
                      <Text className="text-sm text-amber-800 ml-2 flex-1">
                        Payment due {formatWATDate(group.nextPaymentDue)}
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Group Action Overlay */}
      <GroupActionOverlay
        visible={showActionOverlay}
        onClose={() => setShowActionOverlay(false)}
        onCreateGroup={() => navigation.navigate('CreateGroup')}
        onJoinGroup={() => navigation.navigate('JoinGroup')}
      />
    </View>
  );
}