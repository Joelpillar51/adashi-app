import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';

interface NotificationSettingsScreenProps {
  navigation?: any;
}

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  
  const [settings, setSettings] = useState({
    // Push notifications
    pushNotifications: true,
    
    // Payment notifications
    paymentReminders: true,
    paymentReceived: true,
    paymentOverdue: true,
    
    // Group notifications
    groupInvites: true,
    groupUpdates: true,
    memberActivity: false,
    
    // Collection notifications
    collectionTurn: true,
    collectionReady: true,
    
    // Marketing
    promotions: false,
    tips: true,
    
    // Delivery preferences
    email: true,
    sms: false,
    inApp: true,
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSave = () => {
    // Save notification preferences
    Alert.alert(
      'Settings Saved',
      'Your notification preferences have been updated.',
      [{ text: 'OK' }]
    );
  };

  const handleTestNotification = () => {
    Alert.alert(
      'Test Notification',
      'This is a test notification to verify your settings are working correctly.',
      [{ text: 'OK' }]
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-8">
      <Text className="text-lg font-semibold text-gray-900 mb-4">{title}</Text>
      <View className="bg-white rounded-2xl border border-gray-100">
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onToggle, 
    icon, 
    iconColor = '#6B7280',
    isLast = false 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
    icon: string;
    iconColor?: string;
    isLast?: boolean;
  }) => (
    <View className={cn('flex-row items-center p-4', !isLast && 'border-b border-gray-100')}>
      <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-gray-600 mt-1">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#F3F4F6', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Notifications</Text>
          <Pressable
            onPress={handleSave}
            className="px-4 py-2 bg-blue-500 rounded-lg"
          >
            <Text className="text-white font-semibold text-sm">Save</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Control */}
        <Section title="Master Control">
          <SettingItem
            title="Push Notifications"
            subtitle="Enable all push notifications"
            value={settings.pushNotifications}
            onToggle={() => handleToggle('pushNotifications')}
            icon="notifications"
            iconColor="#3B82F6"
            isLast
          />
        </Section>

        {/* Payment Notifications */}
        <Section title="Payment Notifications">
          <SettingItem
            title="Payment Reminders"
            subtitle="Get notified when payments are due"
            value={settings.paymentReminders}
            onToggle={() => handleToggle('paymentReminders')}
            icon="time"
            iconColor="#D97706"
          />
          <SettingItem
            title="Payment Received"
            subtitle="When someone makes a payment to your group"
            value={settings.paymentReceived}
            onToggle={() => handleToggle('paymentReceived')}
            icon="checkmark-circle"
            iconColor="#059669"
          />
          <SettingItem
            title="Overdue Payments"
            subtitle="Reminders for overdue contributions"
            value={settings.paymentOverdue}
            onToggle={() => handleToggle('paymentOverdue')}
            icon="warning"
            iconColor="#DC2626"
            isLast
          />
        </Section>

        {/* Group Notifications */}
        <Section title="Group Activity">
          <SettingItem
            title="Group Invitations"
            subtitle="When someone invites you to join a group"
            value={settings.groupInvites}
            onToggle={() => handleToggle('groupInvites')}
            icon="person-add"
            iconColor="#3B82F6"
          />
          <SettingItem
            title="Group Updates"
            subtitle="Changes to group settings and schedules"
            value={settings.groupUpdates}
            onToggle={() => handleToggle('groupUpdates')}
            icon="refresh"
            iconColor="#6366F1"
          />
          <SettingItem
            title="Member Activity"
            subtitle="When members join or leave groups"
            value={settings.memberActivity}
            onToggle={() => handleToggle('memberActivity')}
            icon="people"
            iconColor="#8B5CF6"
            isLast
          />
        </Section>

        {/* Collection Notifications */}
        <Section title="Collection Notifications">
          <SettingItem
            title="Your Collection Turn"
            subtitle="When it's your turn to collect funds"
            value={settings.collectionTurn}
            onToggle={() => handleToggle('collectionTurn')}
            icon="wallet"
            iconColor="#059669"
          />
          <SettingItem
            title="Collection Ready"
            subtitle="When your collection is ready for pickup"
            value={settings.collectionReady}
            onToggle={() => handleToggle('collectionReady')}
            icon="card"
            iconColor="#10B981"
            isLast
          />
        </Section>

        {/* Communication Preferences */}
        <Section title="Delivery Preferences">
          <SettingItem
            title="In-App Notifications"
            subtitle="Show notifications within the app"
            value={settings.inApp}
            onToggle={() => handleToggle('inApp')}
            icon="notifications"
            iconColor="#3B82F6"
          />
          <SettingItem
            title="Email Notifications"
            subtitle="Send notifications to your email"
            value={settings.email}
            onToggle={() => handleToggle('email')}
            icon="mail"
            iconColor="#059669"
          />
          <SettingItem
            title="SMS Notifications"
            subtitle="Send notifications via text message"
            value={settings.sms}
            onToggle={() => handleToggle('sms')}
            icon="chatbubble"
            iconColor="#D97706"
            isLast
          />
        </Section>

        {/* Marketing */}
        <Section title="Marketing & Tips">
          <SettingItem
            title="Promotions"
            subtitle="Special offers and promotions"
            value={settings.promotions}
            onToggle={() => handleToggle('promotions')}
            icon="pricetag"
            iconColor="#8B5CF6"
          />
          <SettingItem
            title="Financial Tips"
            subtitle="Helpful tips for managing your savings"
            value={settings.tips}
            onToggle={() => handleToggle('tips')}
            icon="bulb"
            iconColor="#F59E0B"
            isLast
          />
        </Section>

        {/* Test Notification */}
        <View className="mb-6">
          <Pressable
            onPress={handleTestNotification}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-row items-center justify-center"
          >
            <Ionicons name="send" size={20} color="#3B82F6" />
            <Text className="text-blue-600 font-semibold ml-2">Send Test Notification</Text>
          </Pressable>
        </View>

        {/* Info */}
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#D97706" />
            <Text className="text-sm text-amber-800 ml-3 flex-1 leading-5">
              Push notifications must be enabled in your device settings. You can manage system-level notification preferences in your phone's Settings app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}