import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../state/notificationStore';
import { formatNaira } from '../utils/currency';
import { formatWATDateTime, getRelativeTime } from '../utils/date';
import { cn } from '../utils/cn';

interface NotificationScreenProps {
  navigation?: any;
}

export default function NotificationScreen({ navigation }: NotificationScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const [filterType, setFilterType] = useState<'all' | 'unread' | 'payment' | 'group'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter((notification) => {
    switch (filterType) {
      case 'unread':
        return !notification.isRead;
      case 'payment':
        return ['payment_reminder', 'payment_received', 'collection_ready', 'penalty_applied'].includes(notification.type);
      case 'group':
        return ['group_invite', 'group_update', 'member_joined', 'member_left'].includes(notification.type);
      default:
        return true;
    }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor = priority === 'high' ? '#DC2626' : priority === 'medium' ? '#D97706' : '#6B7280';
    
    switch (type) {
      case 'payment_reminder':
        return { name: 'time', color: iconColor };
      case 'collection_ready':
        return { name: 'wallet', color: '#059669' };
      case 'group_invite':
        return { name: 'person-add', color: '#3B82F6' };
      case 'payment_received':
        return { name: 'checkmark-circle', color: '#059669' };
      case 'system':
        return { name: 'information-circle', color: '#6366F1' };
      case 'group_update':
        return { name: 'refresh', color: '#3B82F6' };
      case 'penalty_applied':
        return { name: 'warning', color: '#DC2626' };
      case 'member_joined':
        return { name: 'person-add', color: '#059669' };
      case 'member_left':
        return { name: 'person-remove', color: '#DC2626' };
      default:
        return { name: 'notifications', color: iconColor };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-amber-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Handle navigation if specified
    if (notification.actionType === 'navigate' && notification.actionData && navigation) {
      const { screen, params } = notification.actionData;
      if (params) {
        navigation.navigate(screen, params);
      } else {
        navigation.navigate(screen);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    
    Alert.alert(
      'Mark All as Read',
      `Are you sure you want to mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: markAllAsRead },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearAllNotifications 
        },
      ]
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(notificationId) 
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Get counts for filter tabs
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const paymentNotifications = notifications.filter(n => 
    ['payment_reminder', 'payment_received', 'collection_ready', 'penalty_applied'].includes(n.type)
  );
  const groupNotifications = notifications.filter(n => 
    ['group_invite', 'group_update', 'member_joined', 'member_left'].includes(n.type)
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Pressable 
              onPress={() => navigation?.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
            >
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </Pressable>
            <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
          </View>
          
          {notifications.length > 0 && (
            <View className="flex-row gap-2">
              {unreadCount > 0 && (
                <Pressable 
                  onPress={handleMarkAllAsRead}
                  className="px-3 py-2 bg-blue-500 rounded-lg"
                >
                  <Text className="text-white text-sm font-medium">Mark All Read</Text>
                </Pressable>
              )}
              <Pressable 
                onPress={handleClearAll}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="trash-outline" size={18} color="#6B7280" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <View className="flex-row bg-gray-50 rounded-xl p-1 gap-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadNotifications.length },
              { key: 'payment', label: 'Payment', count: paymentNotifications.length },
              { key: 'group', label: 'Group', count: groupNotifications.length },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setFilterType(tab.key as any)}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  filterType === tab.key ? 'bg-white shadow-sm' : ''
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    filterType === tab.key ? 'text-gray-900' : 'text-gray-600'
                  )}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons 
                name={filterType === 'unread' ? 'checkmark-done' : 
                      filterType === 'payment' ? 'wallet-outline' :
                      filterType === 'group' ? 'people-outline' : 'notifications-outline'} 
                size={32} 
                color="#9CA3AF" 
              />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              {filterType === 'unread' ? 'All Caught Up!' :
               filterType === 'payment' ? 'No Payment Notifications' :
               filterType === 'group' ? 'No Group Notifications' : 'No Notifications'}
            </Text>
            <Text className="text-base text-gray-600 text-center">
              {filterType === 'unread' ? 'You have no unread notifications' :
               filterType === 'payment' ? 'Payment-related notifications will appear here' :
               filterType === 'group' ? 'Group activity notifications will appear here' : 
               'Your notifications will appear here when you receive them'}
            </Text>
          </View>
        ) : (
          <View className="p-4 gap-3">
            {filteredNotifications.map((notification) => {
              const icon = getNotificationIcon(notification.type, notification.priority);
              
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  className={cn(
                    'bg-white rounded-2xl p-4 border-l-4',
                    getPriorityStyle(notification.priority),
                    !notification.isRead ? 'border border-blue-100' : 'border border-gray-100'
                  )}
                >
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-3 flex-shrink-0">
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 mr-2">
                          <Text className="text-base font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </Text>
                          <Text className="text-sm text-gray-700 leading-5">
                            {notification.message}
                          </Text>
                        </View>
                        
                        <View className="items-end">
                          {!notification.isRead && (
                            <View className="w-3 h-3 bg-blue-500 rounded-full mb-1" />
                          )}
                          <Pressable
                            onPress={() => handleDeleteNotification(notification.id)}
                            className="w-8 h-8 items-center justify-center rounded-full"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="close" size={16} color="#9CA3AF" />
                          </Pressable>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="time" size={14} color="#9CA3AF" />
                          <Text className="text-xs text-gray-500 ml-1">
                            {getRelativeTime(notification.createdAt)}
                          </Text>
                        </View>
                        
                        {notification.groupName && (
                          <View className="flex-row items-center">
                            <Ionicons name="people" size={14} color="#9CA3AF" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {notification.groupName}
                            </Text>
                          </View>
                        )}
                        
                        {notification.amount && (
                          <View className="flex-row items-center">
                            <Ionicons name="wallet" size={14} color="#9CA3AF" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {formatNaira(notification.amount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}