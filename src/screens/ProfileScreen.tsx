import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/userStore';
import { useGroupStore } from '../state/groupStore';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileScreen({ visible, onClose }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { profile, getInitials } = useUserStore();
  const { groups, payments } = useGroupStore();

  if (!profile) return null;

  const userPayments = payments.filter(p => p.type === 'contribution');
  const totalContributed = userPayments.reduce((sum, p) => sum + p.amount, 0);
  const activeGroups = groups.filter(g => g.status === 'active').length;

  const stats = [
    {
      label: 'Total Contributed',
      value: formatCompactNaira(totalContributed),
      icon: 'wallet' as const,
      color: 'text-emerald-600',
    },
    {
      label: 'Active Groups',
      value: activeGroups.toString(),
      icon: 'people' as const,
      color: 'text-blue-600',
    },
    {
      label: 'Completed Cycles',
      value: profile.completedCycles.toString(),
      icon: 'checkmark-circle' as const,
      color: 'text-purple-600',
    },
  ];

  const menuItems = [
    {
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Notification Settings',
      subtitle: 'Manage your alerts and reminders',
      icon: 'notifications-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Privacy & Security',
      subtitle: 'Control your account security',
      icon: 'shield-outline' as const,
      onPress: () => {},
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help with ContribTracker',
      icon: 'help-circle-outline' as const,
      onPress: () => {},
    },
    {
      title: 'About',
      subtitle: 'App version and terms',
      icon: 'information-circle-outline' as const,
      onPress: () => {},
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View 
          className="bg-white rounded-t-3xl"
          style={{ 
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            maxHeight: '90%'
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 mb-6">
            <Text className="text-2xl font-bold text-gray-900">Profile</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile Info */}
            <View className="px-6 mb-8">
              <View className="items-center mb-6">
                <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4">
                  <Text className="text-2xl font-bold text-white">
                    {getInitials()}
                  </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-1">{profile.name}</Text>
                <Text className="text-base text-gray-600 mb-2">{profile.email}</Text>
                <Text className="text-sm text-gray-500">{profile.phone}</Text>
              </View>

              {/* Stats */}
              <View className="bg-gray-50 rounded-2xl p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Your Stats</Text>
                <View className="gap-4">
                  {stats.map((stat, index) => (
                    <View key={index} className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Ionicons name={stat.icon} size={20} className={stat.color} />
                        <Text className="text-base text-gray-700 ml-3">{stat.label}</Text>
                      </View>
                      <Text className="text-lg font-bold text-gray-900">{stat.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View className="px-6 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Settings</Text>
              <View className="gap-1">
                {menuItems.map((item, index) => (
                  <Pressable
                    key={index}
                    onPress={item.onPress}
                    className="flex-row items-center py-4 px-4 rounded-xl active:bg-gray-50"
                  >
                    <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                      <Ionicons name={item.icon} size={20} color="#6B7280" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
                      <Text className="text-sm text-gray-600 mt-1">{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Member Since */}
            <View className="px-6 py-4 border-t border-gray-100">
              <View className="flex-row items-center justify-center">
                <Ionicons name="calendar" size={16} color="#9CA3AF" />
                <Text className="text-sm text-gray-500 ml-2">
                  Member since {formatWATDate(profile.joinDate)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}