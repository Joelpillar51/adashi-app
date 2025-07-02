import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { cn } from '../utils/cn';

interface InviteMembersScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function InviteMembersScreen({ route, navigation }: InviteMembersScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups } = useGroupStore();
  
  const group = groups.find(g => g.id === groupId);
  const [inviteCode] = useState(() => {
    // Generate a unique 6-digit invite code for the group
    return `ADH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  });
  
  const [inviteLink] = useState(() => {
    return `https://adashi.app/join/${inviteCode}`;
  });

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  const handleCopyCode = async () => {
    await Clipboard.setString(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleCopyLink = async () => {
    await Clipboard.setString(inviteLink);
    Alert.alert('Copied!', 'Invite link copied to clipboard');
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my Adashi savings group "${group.name}"!\n\nUse invite code: ${inviteCode}\n\nOr tap this link: ${inviteLink}`,
        title: `Join ${group.name} on Adashi`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join my Adashi savings group "${group.name}"!\n\nTap this link to join: ${inviteLink}`,
        title: `Join ${group.name} on Adashi`,
        url: inviteLink,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const inviteMethods = [
    {
      title: 'Invite Code',
      subtitle: 'Share a 6-digit code',
      icon: 'keypad' as const,
      value: inviteCode,
      onCopy: handleCopyCode,
      onShare: handleShareCode,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
    },
    {
      title: 'Invite Link',
      subtitle: 'Share a direct link',
      icon: 'link' as const,
      value: inviteLink,
      onCopy: handleCopyLink,
      onShare: handleShareLink,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-900',
    },
  ];

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
          <Text className="text-xl font-bold text-gray-900">Invite Members</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Group Info */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">{group.name}</Text>
          <Text className="text-sm text-gray-600 mb-4">{group.description}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">{group.memberCount} members</Text>
            <Text className="text-gray-600">₦{group.monthlyAmount.toLocaleString()}/month</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text className="text-sm text-blue-800 ml-3 flex-1 leading-5">
              Share your group's invite code or link with trusted friends and family. They can use either method to join your savings circle.
            </Text>
          </View>
        </View>

        {/* Invite Methods */}
        <View className="gap-4 mb-6">
          {inviteMethods.map((method, index) => (
            <View key={index} className={cn('rounded-2xl p-6 border', method.color)}>
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 bg-white rounded-2xl items-center justify-center mr-4">
                  <Ionicons name={method.icon} size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className={cn('text-lg font-bold mb-1', method.textColor)}>
                    {method.title}
                  </Text>
                  <Text className="text-sm text-gray-600">{method.subtitle}</Text>
                </View>
              </View>

              {/* Code/Link Display */}
              <View className="bg-white rounded-xl p-4 mb-4">
                <Text className="text-lg font-mono font-bold text-gray-900 text-center">
                  {method.value}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={method.onCopy}
                  className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="copy" size={16} color="#6B7280" />
                  <Text className="text-gray-700 font-medium ml-2">Copy</Text>
                </Pressable>
                <Pressable
                  onPress={method.onShare}
                  className="flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="share" size={16} color="white" />
                  <Text className="text-white font-medium ml-2">Share</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Current Members */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Current Members</Text>
          <View className="gap-3">
            {group.members.map((member) => (
              <View key={member.id} className="flex-row items-center py-3 px-4 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-sm font-bold text-blue-600">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">{member.name}</Text>
                  <Text className="text-sm text-gray-600 capitalize">{member.role}</Text>
                </View>
                {member.rotationPosition > 0 && (
                  <View className="bg-blue-500 w-6 h-6 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">#{member.rotationPosition}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <Text className="text-base font-semibold text-amber-800 mb-3">💡 Invitation Tips</Text>
          <View className="gap-2">
            <Text className="text-sm text-amber-700">• Only invite people you trust completely</Text>
            <Text className="text-sm text-amber-700">• Explain the ROSCA concept before they join</Text>
            <Text className="text-sm text-amber-700">• Set clear expectations about monthly contributions</Text>
            <Text className="text-sm text-amber-700">• Invite codes never expire but can be deactivated</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}