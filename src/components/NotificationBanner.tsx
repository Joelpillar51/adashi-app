import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBanner as NotificationBannerType } from '../types';
import { cn } from '../utils/cn';

interface NotificationBannerProps {
  banner: NotificationBannerType;
  onDismiss: (bannerId: string) => void;
  onPress?: () => void;
}

export default function NotificationBanner({ banner, onDismiss, onPress }: NotificationBannerProps) {
  const getBannerStyle = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'bg-amber-50 border-amber-200';
      case 'collection_turn':
        return 'bg-emerald-50 border-emerald-200';
      case 'new_member':
        return 'bg-blue-50 border-blue-200';
      case 'reminder':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'text-amber-600';
      case 'collection_turn':
        return 'text-emerald-600';
      case 'new_member':
        return 'text-blue-600';
      case 'reminder':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'warning';
      case 'collection_turn':
        return 'gift';
      case 'new_member':
        return 'person-add';
      case 'reminder':
        return 'notifications';
      default:
        return 'information-circle';
    }
  };

  const getTextStyle = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'text-amber-800';
      case 'collection_turn':
        return 'text-emerald-800';
      case 'new_member':
        return 'text-blue-800';
      case 'reminder':
        return 'text-purple-800';
      default:
        return 'text-gray-800';
    }
  };

  if (!banner.isVisible) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      className={cn('mx-6 mb-4 p-4 rounded-2xl border flex-row items-start', getBannerStyle(banner.type))}
    >
      <View className="mr-3 mt-0.5">
        <Ionicons 
          name={getIcon(banner.type) as any} 
          size={20} 
          className={getIconStyle(banner.type)} 
        />
      </View>
      <View className="flex-1">
        <Text className={cn('font-semibold mb-1', getTextStyle(banner.type))}>
          {banner.title}
        </Text>
        <Text className={cn('text-sm leading-5', getTextStyle(banner.type))}>
          {banner.message}
        </Text>
      </View>
      <Pressable
        onPress={() => onDismiss(banner.id)}
        className="ml-2 w-6 h-6 items-center justify-center"
      >
        <Ionicons name="close" size={16} color="#6B7280" />
      </Pressable>
    </Pressable>
  );
}