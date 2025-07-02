import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { useUserStore, mockUserProfile } from '../state/userStore';
import { useNotificationStore, createPaymentDueBanner } from '../state/notificationStore';
import { mockGroups, mockPayments, mockTimeline, mockMessages } from '../state/mockData';
import { formatNaira, formatCompactNaira } from '../utils/currency';
import { getDaysUntil, formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';
import NotificationBanner from '../components/NotificationBanner';
import ProfileScreen from './ProfileScreen';

export default function OverviewScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showProfile, setShowProfile] = useState(false);
  
  const {
    groups,
    payments,
    addGroup,
    addPayment,
    updateTimeline,
    addMessage,
    getTotalSaved,
    getUpcomingPayments,
  } = useGroupStore();
  
  const { 
    profile,
    setProfile,
    getDisplayName,
    getInitials 
  } = useUserStore();
  
  const { 
    getVisibleBanners, 
    dismissBanner, 
    addBanner 
  } = useNotificationStore();

  // Initialize with mock data if no groups exist
  useEffect(() => {
    if (groups.length === 0) {
      mockGroups.forEach(addGroup);
      mockPayments.forEach(addPayment);
      mockTimeline.forEach((item) => updateTimeline(item.groupId, [item]));
      mockMessages.forEach(addMessage);
      
      // Add sample notification banners
      addBanner(createPaymentDueBanner('group1', 'Lagos Friends Circle', 50000, 14));
    }
    
    // Initialize user profile if not set
    if (!profile) {
      setProfile(mockUserProfile);
    }
  }, []);

  const totalSaved = getTotalSaved();
  const upcomingPayments = getUpcomingPayments();
  const activeGroups = groups.filter((group) => group.status === 'active');
  const visibleBanners = getVisibleBanners();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const nextPayment = groups.reduce((earliest, group) => {
    const groupDays = getDaysUntil(group.nextPaymentDue);
    return !earliest || groupDays < getDaysUntil(earliest.nextPaymentDue) ? group : earliest;
  }, null as typeof groups[0] | null);

  const stats = [
    {
      label: 'Total Saved',
      value: formatCompactNaira(totalSaved),
      subtitle: 'Across all groups',
      icon: 'wallet' as const,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Active Groups',
      value: activeGroups.length.toString(),
      subtitle: `${groups.length} total groups`,
      icon: 'people' as const,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      label: 'Next Payment',
      value: nextPayment ? `${getDaysUntil(nextPayment.nextPaymentDue)} days` : 'None',
      subtitle: nextPayment ? nextPayment.name : 'No pending payments',
      icon: 'time' as const,
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
    },
    {
      label: 'My Position',
      value: nextPayment ? `#${nextPayment.myPosition}` : 'N/A',
      subtitle: 'Current rotation order',
      icon: 'medal' as const,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
    {
      label: 'Contributions',
      value: payments.filter(p => p.type === 'contribution').length.toString(),
      subtitle: 'Total payments made',
      icon: 'card' as const,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      textColor: 'text-indigo-700',
    },
  ];

  const quickActions = [
    {
      title: 'View Groups',
      subtitle: 'Manage your saving circles',
      icon: 'people-circle' as const,
      color: 'bg-blue-500',
      onPress: () => navigation.navigate('Groups'),
    },
    {
      title: 'Create Group',
      subtitle: 'Start a new savings circle',
      icon: 'add-circle' as const,
      color: 'bg-indigo-500',
      onPress: () => navigation.navigate('CreateGroup'),
    },
    {
      title: 'Make Payment',
      subtitle: 'Contribute to your groups',
      icon: 'card' as const,
      color: 'bg-emerald-500',
      onPress: () => navigation.navigate('Payments'),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white px-6 pb-6 pt-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg text-gray-600 mb-1">Good {getTimeOfDay()}</Text>
            <Text className="text-2xl font-bold text-gray-900">{getDisplayName()}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
            </Pressable>
            <Pressable 
              onPress={() => setShowProfile(true)}
              className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
            >
              <Text className="text-base font-bold text-white">
                {getInitials()}
              </Text>
            </Pressable>
          </View>
        </View>
        <Text className="text-sm text-gray-500 mt-1">Your digital savings circle</Text>
      </View>

      {/* Stats Cards */}
      <View className="mb-6">
        <View className="px-6 mb-4">
          <Text className="text-lg font-semibold text-gray-900">Overview</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          className="flex-row"
        >
          {stats.map((stat, index) => (
            <View
              key={index}
              className={cn(
                'bg-white rounded-2xl p-5 border border-gray-100 mr-4',
                index === stats.length - 1 ? 'mr-6' : ''
              )}
              style={{ width: 160 }}
            >
              <View className={cn('w-12 h-12 rounded-xl items-center justify-center mb-4', stat.color)}>
                <Ionicons name={stat.icon} size={24} className={stat.iconColor} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</Text>
              <Text className="text-sm font-medium text-gray-900 mb-1">{stat.label}</Text>
              <Text className={cn('text-xs', stat.textColor)}>{stat.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Notification Banners */}
      {visibleBanners.map((banner) => (
        <NotificationBanner
          key={banner.id}
          banner={banner}
          onDismiss={dismissBanner}
          onPress={() => {
            if (banner.groupId) {
              navigation.navigate('GroupDetails', { groupId: banner.groupId });
            }
          }}
        />
      ))}

      {/* Next Payment Alert */}
      {nextPayment && getDaysUntil(nextPayment.nextPaymentDue) <= 7 && (
        <View className="px-6 mb-6">
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="warning" size={20} color="#D97706" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-amber-800">Payment Due Soon</Text>
                <Text className="text-sm text-amber-700 mt-1">
                  {formatNaira(nextPayment.monthlyAmount)} due for {nextPayment.name} in {getDaysUntil(nextPayment.nextPaymentDue)} days
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-6 mb-6">
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

      {/* Recent Groups */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">Your Groups</Text>
          <Pressable onPress={() => navigation.navigate('Groups')}>
            <Text className="text-blue-600 font-medium">View All</Text>
          </Pressable>
        </View>
        <View className="gap-3">
          {activeGroups.slice(0, 2).map((group) => (
            <Pressable
              key={group.id}
              onPress={() => navigation.navigate('Groups')}
              className="bg-white rounded-2xl p-4 border border-gray-100"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">{group.name}</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {group.memberCount} members • {formatNaira(group.monthlyAmount)}/month
                  </Text>
                </View>
                <View className="bg-emerald-50 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-emerald-700">
                    {Math.round(group.cycleProgress)}% complete
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">
                  Next: {formatWATDate(group.nextPaymentDue)}
                </Text>
                <Text className="text-sm font-medium text-gray-900">
                  Total: {formatCompactNaira(group.totalSaved)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Profile Modal */}
      <ProfileScreen 
        visible={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </ScrollView>
  );
}