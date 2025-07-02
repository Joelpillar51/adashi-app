import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { useUserStore } from '../state/userStore';
import { formatNaira } from '../utils/currency';
import { cn } from '../utils/cn';

interface JoinGroupScreenProps {
  navigation?: any;
}

export default function JoinGroupScreen({ navigation }: JoinGroupScreenProps) {
  const insets = useSafeAreaInsets();
  const { groups, addGroup } = useGroupStore();
  const { profile } = useUserStore();
  
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundGroup, setFoundGroup] = useState<any>(null);
  const [error, setError] = useState('');

  // Mock groups database for demo (in real app, this would be an API call)
  const mockAvailableGroups = [
    {
      id: 'group_invite_1',
      name: 'Abuja Professionals Circle',
      description: 'Monthly savings group for working professionals in Abuja',
      memberCount: 6,
      maxMembers: 10,
      monthlyAmount: 75000,
      inviteCode: 'ADHPRO123',
      createdBy: 'Kemi Adebayo',
      currentMembers: ['John Doe', 'Jane Smith', 'Ahmed Ibrahim'],
      status: 'recruiting',
    },
    {
      id: 'group_invite_2', 
      name: 'Lagos University Alumni',
      description: 'Savings circle for Lagos University graduates',
      memberCount: 4,
      maxMembers: 8,
      monthlyAmount: 50000,
      inviteCode: 'ADHUNI456',
      createdBy: 'Emeka Nwosu',
      currentMembers: ['Mary Johnson', 'Peter Okafor'],
      status: 'recruiting',
    },
  ];

  const validateInviteCode = (code: string) => {
    if (!code.trim()) {
      setError('Please enter an invite code');
      return false;
    }
    if (code.length < 6) {
      setError('Invite code must be at least 6 characters');
      return false;
    }
    setError('');
    return true;
  };

  const searchGroup = async () => {
    if (!validateInviteCode(inviteCode)) return;
    
    setIsLoading(true);
    setFoundGroup(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const group = mockAvailableGroups.find(g => 
        g.inviteCode.toLowerCase() === inviteCode.toUpperCase()
      );
      
      if (group) {
        setFoundGroup(group);
        setError('');
      } else {
        setError('Invalid invite code. Please check and try again.');
      }
    } catch (error) {
      setError('Failed to search for group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!foundGroup || !profile) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newGroup = {
        id: foundGroup.id,
        name: foundGroup.name,
        description: foundGroup.description,
        memberCount: foundGroup.memberCount + 1,
        monthlyAmount: foundGroup.monthlyAmount,
        currentRecipient: 'TBD',
        myPosition: 0, // Will be assigned later
        nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        daysLeft: 30,
        totalSaved: 0,
        cycleProgress: 0,
        role: 'member' as const,
        status: 'active' as const,
        members: [
          {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: 'member' as const,
            joinDate: new Date().toISOString(),
            paymentStatus: 'current' as const,
            rotationPosition: 0,
            totalContributed: 0,
            isActive: true,
          }
        ],
        createdAt: new Date().toISOString(),
      };
      
      addGroup(newGroup);
      
      Alert.alert(
        'Successfully Joined!',
        `Welcome to ${foundGroup.name}! You can now participate in the savings circle.`,
        [
          {
            text: 'View Group',
            onPress: () => {
              navigation?.navigate('GroupDetails', { groupId: foundGroup.id });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Join Group</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text className="text-sm text-blue-800 ml-3 flex-1 leading-5">
              Enter the 6-digit invite code shared by a group admin to join their Adashi savings circle.
            </Text>
          </View>
        </View>

        {/* Invite Code Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Invite Code</Text>
          <View className="flex-row gap-3">
            <TextInput
              className={cn(
                'flex-1 bg-white border rounded-xl px-4 py-4 text-lg font-mono text-gray-900 text-center tracking-wider',
                error ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="ADHXXX123"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setError('');
                setFoundGroup(null);
              }}
              autoCapitalize="characters"
              maxLength={9}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable
              onPress={searchGroup}
              disabled={isLoading}
              className={cn(
                'bg-blue-500 px-6 py-4 rounded-xl items-center justify-center',
                isLoading ? 'opacity-50' : ''
              )}
            >
              {isLoading ? (
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Ionicons name="search" size={20} color="white" />
              )}
            </Pressable>
          </View>
          {error && (
            <Text className="text-red-600 text-sm mt-2">{error}</Text>
          )}
        </View>

        {/* Found Group */}
        {foundGroup && (
          <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-emerald-500 rounded-2xl items-center justify-center mr-4">
                <Ionicons name="checkmark" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 mb-1">Group Found!</Text>
                <Text className="text-sm text-emerald-600">Ready to join this savings circle</Text>
              </View>
            </View>

            {/* Group Details */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-2">{foundGroup.name}</Text>
              <Text className="text-sm text-gray-600 mb-4 leading-5">{foundGroup.description}</Text>
              
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Monthly Contribution</Text>
                  <Text className="font-semibold text-gray-900">{formatNaira(foundGroup.monthlyAmount)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Current Members</Text>
                  <Text className="font-semibold text-gray-900">{foundGroup.memberCount}/{foundGroup.maxMembers}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-600">Created by</Text>
                  <Text className="font-semibold text-gray-900">{foundGroup.createdBy}</Text>
                </View>
              </View>
            </View>

            {/* Current Members Preview */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">Some Current Members</Text>
              <View className="flex-row gap-2">
                {foundGroup.currentMembers.slice(0, 3).map((member: string, index: number) => (
                  <View key={index} className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-xs font-medium">{member}</Text>
                  </View>
                ))}
                {foundGroup.currentMembers.length > 3 && (
                  <View className="bg-gray-100 px-3 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs font-medium">+{foundGroup.currentMembers.length - 3} more</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Join Button */}
            <Pressable
              onPress={joinGroup}
              disabled={isLoading}
              className={cn(
                'bg-emerald-500 py-4 rounded-xl flex-row items-center justify-center',
                isLoading ? 'opacity-50' : ''
              )}
            >
              {isLoading && (
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
              )}
              <Text className="text-white font-semibold text-base">
                {isLoading ? 'Joining...' : 'Join This Group'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* How it Works */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">How Joining Works</Text>
          <View className="gap-4">
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Enter Invite Code</Text>
                <Text className="text-sm text-gray-600">Get the code from a group admin or member</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Review Group Details</Text>
                <Text className="text-sm text-gray-600">Check contribution amount and member list</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                <Text className="text-blue-600 font-bold text-sm">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900 mb-1">Join & Start Saving</Text>
                <Text className="text-sm text-gray-600">Begin participating in the rotation cycle</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}