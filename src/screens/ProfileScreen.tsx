import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../state/userStore';
import { useGroupStore } from '../state/groupStore';
import { useAuthStore } from '../state/authStore';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';

interface ProfileScreenProps {
  visible: boolean;
  onClose: () => void;
  navigation?: any;
}

export default function ProfileScreen({ visible, onClose, navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { profile, getInitials } = useUserStore();
  const { groups, payments } = useGroupStore();
  const { signOut } = useAuthStore();

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
      onPress: () => {
        onClose();
        navigation?.navigate('EditProfile');
      },
    },
    {
      title: 'Notification Settings',
      subtitle: 'Manage your alerts and reminders',
      icon: 'notifications-outline' as const,
      onPress: () => {
        onClose();
        navigation?.navigate('NotificationSettings');
      },
    },
    {
      title: 'Privacy & Security',
      subtitle: 'Control your account security',
      icon: 'shield-outline' as const,
      onPress: () => {
        Alert.alert(
          'Privacy & Security',
          'Your account is protected with industry-standard security measures. Two-factor authentication and additional security features will be available soon.',
          [{ text: 'OK' }]
        );
      },
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help with Adashi',
      icon: 'help-circle-outline' as const,
      onPress: () => {
        Alert.alert(
          'Help & Support',
          'Need help? Contact our support team:\n\nEmail: support@adashi.ng\nPhone: +234 1 234 5678\nWhatsApp: +234 809 123 4567\n\nWe typically respond within 24 hours.',
          [{ text: 'OK' }]
        );
      },
    },
    {
      title: 'About',
      subtitle: 'App version and terms',
      icon: 'information-circle-outline' as const,
      onPress: () => {
        Alert.alert(
          'About Adashi',
          'Version 1.0.0\n\nAdashi helps Nigerian communities manage their rotating savings and credit associations (ROSCAs) digitally.\n\n© 2025 Adashi. All rights reserved.',
          [
            { text: 'Terms of Service', onPress: () => {} },
            { text: 'Privacy Policy', onPress: () => {} },
            { text: 'OK' }
          ]
        );
      },
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Adashi account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            signOut();
            onClose();
          }
        },
      ]
    );
  };

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

            {/* Sign Out */}
            <View className="px-6 mb-6">
              <Pressable
                onPress={handleSignOut}
                className="bg-red-50 border border-red-200 py-4 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text className="text-red-600 font-semibold ml-2">Sign Out</Text>
              </Pressable>
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