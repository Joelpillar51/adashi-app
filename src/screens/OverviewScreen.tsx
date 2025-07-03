import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { useUserStore, mockUserProfile } from '../state/userStore';
import { useAuthStore } from '../state/authStore';
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
    profile: oldProfile,
    setProfile,
    getDisplayName: getOldDisplayName,
    getInitials: getOldInitials
  } = useUserStore();
  
  const {
    profile: authProfile,
    user,
    getDisplayName,
    getInitials,
    refreshProfile,
    isAuthenticated
  } = useAuthStore();
  
  const { 
    getVisibleBanners, 
    dismissBanner, 
    addBanner,
    unreadCount 
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
    
    // Initialize user profile if not set (fallback to mock for unauthenticated users)
    if (!oldProfile && !isAuthenticated()) {
      setProfile(mockUserProfile);
    }
  }, []);

  // Debug effect to track profile changes
  useEffect(() => {
    console.log('OverviewScreen Profile Debug:', {
      isAuthenticated: isAuthenticated(),
      user: user?.email,
      authProfile,
      oldProfile,
      mockProfile: mockUserProfile
    });
    
    // If authenticated user but no profile, try to refresh
    if (isAuthenticated() && user && !authProfile) {
      console.log('Authenticated user without profile, attempting refresh...');
      refreshProfile().then(({ error }) => {
        if (error) {
          console.error('Failed to refresh profile:', error);
        }
      });
    }
  }, [authProfile, user, isAuthenticated]);

  const upcomingPayments = getUpcomingPayments();
  const activeGroups = groups.filter((group) => group.status === 'active');
  const visibleBanners = getVisibleBanners();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Calculate user-specific statistics
  const myContributions = payments.filter(p => p.type === 'contribution');
  const myCollections = payments.filter(p => p.type === 'collection' && (p.recipient?.includes('Me') || p.recipient?.includes('Adunni')));
  const completedContributions = myContributions.filter(p => p.status === 'completed');
  const completedCollections = myCollections.filter(p => p.status === 'completed');
  
  // Use auth profile if available, otherwise fall back to old profile or mock
  const currentProfile = authProfile || oldProfile || mockUserProfile;
  const currentDisplayName = isAuthenticated() ? getDisplayName() : getOldDisplayName();
  const currentInitials = isAuthenticated() ? getInitials() : getOldInitials();

  const userStats = {
    // Use profile data if available from auth
    totalContributed: authProfile?.total_contributions ? authProfile.total_contributions / 100 : myContributions.reduce((sum, p) => sum + p.amount, 0),
    totalCollected: myCollections.reduce((sum, p) => sum + p.amount, 0),
    totalGroups: authProfile?.active_groups || groups.length,
    activeGroups: authProfile?.active_groups || activeGroups.length,
    completedCycles: authProfile?.completed_cycles || completedCollections.length,
    contributionCount: completedContributions.length,
    pendingContributions: myContributions.filter(p => p.status === 'pending').length,
    successRate: myContributions.length > 0 ? Math.round((completedContributions.length / myContributions.length) * 100) : 100,
  };

  const nextPayment = groups.reduce((earliest, group) => {
    const groupDays = getDaysUntil(group.nextPaymentDue);
    return !earliest || groupDays < getDaysUntil(earliest.nextPaymentDue) ? group : earliest;
  }, null as typeof groups[0] | null);

  const stats = [
    {
      label: 'Total Contributed',
      value: formatCompactNaira(userStats.totalContributed),
      subtitle: 'All-time contributions',
      icon: 'arrow-up-circle' as const,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700',
    },
    {
      label: 'Total Collected',
      value: formatCompactNaira(userStats.totalCollected),
      subtitle: 'Money received from groups',
      icon: 'arrow-down-circle' as const,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-700',
    },
    {
      label: 'My Groups',
      value: userStats.totalGroups.toString(),
      subtitle: `${userStats.activeGroups} active groups`,
      icon: 'people' as const,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-700',
    },
    {
      label: 'Completed Cycles',
      value: userStats.completedCycles.toString(),
      subtitle: 'Times I collected funds',
      icon: 'checkmark-circle' as const,
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
      textColor: 'text-amber-700',
    },
    {
      label: 'Success Rate',
      value: `${userStats.successRate}%`,
      subtitle: `${userStats.contributionCount} successful payments`,
      icon: 'trophy' as const,
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
      onPress: () => {
        if (activeGroups.length === 1) {
          // Only one active group, go directly to it
          navigation.navigate('GroupDetails', { groupId: activeGroups[0].id });
        } else if (activeGroups.length > 1) {
          // Multiple active groups, let user choose
          Alert.alert(
            'Select Group',
            'Choose which group you want to make a payment to:',
            [
              { text: 'Cancel', style: 'cancel' },
              ...activeGroups.slice(0, 3).map(group => ({
                text: group.name,
                onPress: () => navigation.navigate('GroupDetails', { groupId: group.id })
              })),
              ...(activeGroups.length > 3 ? [{
                text: 'View All Groups',
                onPress: () => navigation.navigate('Groups')
              }] : [])
            ]
          );
        } else if (groups.length > 0) {
          // Groups exist but none are active
          Alert.alert(
            'No Active Groups',
            'You have groups but none are currently active. Would you like to view your groups?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'View Groups', onPress: () => navigation.navigate('Groups') }
            ]
          );
        } else {
          // No groups at all
          Alert.alert(
            'No Groups Found',
            'You need to create or join a group before you can make payments.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Create Group', onPress: () => navigation.navigate('CreateGroup') },
              { text: 'Join Group', onPress: () => navigation.navigate('Groups') }
            ]
          );
        }
      },
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
            <Text className="text-2xl font-bold text-gray-900">{currentDisplayName}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable 
              onPress={() => navigation.navigate('Notifications')}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center relative"
            >
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable 
              onPress={() => setShowProfile(true)}
              className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
            >
              <Text className="text-base font-bold text-white">
                {currentInitials}
              </Text>
            </Pressable>
          </View>
        </View>
        <Text className="text-sm text-gray-500 mt-1">Your digital savings circle</Text>
        
        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View className="flex-row gap-2 mt-2">
            <Pressable 
              onPress={() => {
                Alert.alert(
                  'Profile Debug Info',
                  `Authenticated: ${isAuthenticated()}
User Email: ${user?.email || 'None'}
Auth Profile: ${authProfile ? 'Exists' : 'None'}
Profile Email: ${authProfile?.email || 'None'}
Profile Name: ${authProfile?.full_name || 'None'}
Display Name: ${currentDisplayName}`,
                  [
                    { text: 'Refresh Profile', onPress: () => refreshProfile() },
                    { text: 'OK' }
                  ]
                );
              }}
              className="px-3 py-1 bg-yellow-100 rounded-md"
            >
              <Text className="text-xs text-yellow-800">Quick Debug</Text>
            </Pressable>
            <Pressable 
              onPress={() => navigation.navigate('ProfileDebug')}
              className="px-3 py-1 bg-blue-100 rounded-md"
            >
              <Text className="text-xs text-blue-800">Full Debug</Text>
            </Pressable>
          </View>
        )}
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

      {/* My Groups */}
      <View className="px-6 mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-gray-900">My Groups</Text>
          <Pressable onPress={() => navigation.navigate('Groups')}>
            <Text className="text-blue-600 font-medium">View All</Text>
          </Pressable>
        </View>
        <View className="gap-3">
          {activeGroups.slice(0, 2).map((group) => {
            const myNextPayment = getDaysUntil(group.nextPaymentDue);
            const isPaymentDue = myNextPayment <= 3;
            
            return (
              <Pressable
                key={group.id}
                onPress={() => navigation.navigate('GroupDetails', { groupId: group.id })}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{group.name}</Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      My Position: #{group.myPosition} • {formatNaira(group.monthlyAmount)}/month
                    </Text>
                  </View>
                  <View className={cn(
                    'px-3 py-1 rounded-full',
                    isPaymentDue ? 'bg-amber-50' : 'bg-emerald-50'
                  )}>
                    <Text className={cn(
                      'text-sm font-medium',
                      isPaymentDue ? 'text-amber-700' : 'text-emerald-700'
                    )}>
                      {group.role}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className={cn(
                    'text-sm',
                    isPaymentDue ? 'text-amber-600 font-medium' : 'text-gray-600'
                  )}>
                    Next payment: {myNextPayment > 0 ? `${myNextPayment} days` : 'Today'}
                  </Text>
                  <Text className="text-sm font-medium text-gray-900">
                    Progress: {Math.round(group.cycleProgress)}%
                  </Text>
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent Pressable
                      // Navigate to payment flow for this specific group
                      Alert.alert(
                        'Make Payment',
                        `Contribute ${formatNaira(group.monthlyAmount)} to ${group.name}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'View Bank Details', onPress: () => {
                            Alert.alert(
                              'Bank Transfer Details',
                              `Bank: ${group.accountDetails?.bankName || 'Not available'}\nAccount: ${group.accountDetails?.accountNumber || 'Not available'}\nName: ${group.accountDetails?.accountName || 'Not available'}\n\nAmount: ${formatNaira(group.monthlyAmount)}`,
                              [{ text: 'OK' }]
                            );
                          }},
                          { text: 'Go to Group', onPress: () => navigation.navigate('GroupDetails', { groupId: group.id }) }
                        ]
                      );
                    }}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg flex-row items-center justify-center',
                      isPaymentDue ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                  >
                    <Ionicons name="card" size={16} color="white" />
                    <Text className="text-white font-medium text-sm ml-2">
                      {isPaymentDue ? 'Pay Now' : 'Make Payment'}
                    </Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent Pressable
                      navigation.navigate('GroupDetails', { groupId: group.id });
                    }}
                    className="px-3 py-2 rounded-lg bg-gray-100 flex-row items-center justify-center"
                  >
                    <Ionicons name="eye" size={16} color="#6B7280" />
                    <Text className="text-gray-700 font-medium text-sm ml-1">View</Text>
                  </Pressable>
                </View>
                
                {isPaymentDue && (
                  <View className="mt-2 p-2 bg-amber-50 rounded-lg">
                    <Text className="text-xs text-amber-700">💰 Payment due soon!</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        
        {activeGroups.length === 0 && (
          <View className="bg-gray-50 rounded-2xl p-6 items-center">
            <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center mb-4">
              <Ionicons name="people-outline" size={24} color="#9CA3AF" />
            </View>
            <Text className="text-base font-semibold text-gray-900 mb-2">No Active Groups</Text>
            <Text className="text-sm text-gray-600 text-center mb-4">
              Join or create a savings circle to start building wealth together
            </Text>
            <Pressable 
              onPress={() => navigation.navigate('Groups')}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Get Started</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Profile Modal */}
      <ProfileScreen 
        visible={showProfile} 
        onClose={() => setShowProfile(false)}
        navigation={navigation}
      />
    </ScrollView>
  );
}