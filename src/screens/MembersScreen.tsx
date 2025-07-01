import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { groups } = useGroupStore();
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const currentGroup = groups.find(g => g.id === selectedGroup);
  const members = currentGroup?.members || [];

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Members</Text>

        {/* Group Selector */}
        {groups.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => setSelectedGroup(group.id)}
                className={cn(
                  'px-4 py-2 rounded-xl mr-3 border',
                  selectedGroup === group.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    selectedGroup === group.id ? 'text-blue-700' : 'text-gray-600'
                  )}
                >
                  {group.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900"
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Group Summary */}
      {currentGroup && (
        <View className="px-6 py-4 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-semibold text-gray-900">{currentGroup.name}</Text>
              <Text className="text-sm text-gray-600 mt-1">
                {currentGroup.memberCount} members • {formatNaira(currentGroup.monthlyAmount)}/month
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-600">Total Saved</Text>
              <Text className="text-lg font-bold text-gray-900">
                {formatCompactNaira(currentGroup.totalSaved)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {filteredMembers.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Members Found</Text>
            <Text className="text-base text-gray-600 text-center">
              {searchQuery ? 'Try adjusting your search terms' : 'No members in this group yet'}
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {filteredMembers.map((member) => (
              <View
                key={member.id}
                className="bg-white rounded-2xl p-5 border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row items-start justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-xl font-bold text-blue-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">{member.name}</Text>
                      <Text className="text-sm text-gray-600 mb-2">Position #{member.rotationPosition}</Text>
                      <View className="flex-row gap-2">
                        <View className={cn('px-3 py-1 rounded-full border', getRoleColor(member.role))}>
                          <Text className="text-xs font-medium capitalize">{member.role}</Text>
                        </View>
                        <View className={cn('px-3 py-1 rounded-full border', getStatusColor(member.paymentStatus))}>
                          <Text className="text-xs font-medium capitalize">{member.paymentStatus}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View className="flex-row items-center justify-between mb-4 py-3 px-4 bg-gray-50 rounded-xl">
                  <View className="items-center">
                    <Text className="text-sm text-gray-600">Total Contributed</Text>
                    <Text className="text-base font-bold text-gray-900">
                      {formatCompactNaira(member.totalContributed)}
                    </Text>
                  </View>
                  <View className="w-px h-8 bg-gray-200" />
                  <View className="items-center">
                    <Text className="text-sm text-gray-600">Member Since</Text>
                    <Text className="text-base font-bold text-gray-900">
                      {formatWATDate(member.joinDate)}
                    </Text>
                  </View>
                  <View className="w-px h-8 bg-gray-200" />
                  <View className="items-center">
                    <Text className="text-sm text-gray-600">Status</Text>
                    <View className="flex-row items-center">
                      <View className={cn(
                        'w-2 h-2 rounded-full mr-2',
                        member.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                      )} />
                      <Text className="text-base font-bold text-gray-900">
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Contact Info */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-900 mb-3">Contact Information</Text>
                  <View className="gap-2">
                    <View className="flex-row items-center">
                      <Ionicons name="call" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-3 flex-1">{member.phone}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="mail" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-3 flex-1">{member.email}</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => handleCall(member.phone)}
                    className="flex-1 bg-emerald-50 border border-emerald-200 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="call" size={16} color="#059669" />
                    <Text className="text-emerald-700 font-medium ml-2">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleMessage(member.phone)}
                    className="flex-1 bg-blue-50 border border-blue-200 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="chatbubble" size={16} color="#3B82F6" />
                    <Text className="text-blue-700 font-medium ml-2">Message</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleEmail(member.email)}
                    className="flex-1 bg-purple-50 border border-purple-200 py-3 rounded-xl flex-row items-center justify-center"
                  >
                    <Ionicons name="mail" size={16} color="#7C3AED" />
                    <Text className="text-purple-700 font-medium ml-2">Email</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}