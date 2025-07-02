import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { useUserStore } from '../state/userStore';
import { formatNaira, parseNairaAmount } from '../utils/currency';
import { cn } from '../utils/cn';

interface CreateGroupScreenProps {
  navigation?: any;
}

export default function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const insets = useSafeAreaInsets();
  const { addGroup } = useGroupStore();
  const { profile } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyAmount: '',
    memberCount: '8',
    startDate: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    const amount = parseNairaAmount(formData.monthlyAmount);
    if (!formData.monthlyAmount.trim()) {
      newErrors.monthlyAmount = 'Monthly amount is required';
    } else if (amount < 1000) {
      newErrors.monthlyAmount = 'Minimum amount is ₦1,000';
    }
    
    const memberCount = parseInt(formData.memberCount);
    if (!formData.memberCount.trim()) {
      newErrors.memberCount = 'Number of members is required';
    } else if (memberCount < 3) {
      newErrors.memberCount = 'Minimum 3 members required';
    } else if (memberCount > 20) {
      newErrors.memberCount = 'Maximum 20 members allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except commas
    const cleaned = text.replace(/[^\d,]/g, '');
    // Format with commas
    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setFormData(prev => ({ ...prev, monthlyAmount: formatted }));
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const newGroup = {
        id: `group_${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        memberCount: parseInt(formData.memberCount),
        monthlyAmount: parseNairaAmount(formData.monthlyAmount),
        currentRecipient: 'TBD',
        myPosition: 1, // Creator gets position 1
        nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        daysLeft: 30,
        totalSaved: 0,
        cycleProgress: 0,
        role: 'owner' as const,
        status: 'active' as const,
        members: profile ? [{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: 'owner' as const,
          joinDate: new Date().toISOString(),
          paymentStatus: 'current' as const,
          rotationPosition: 1,
          totalContributed: 0,
          isActive: true,
        }] : [],
        createdAt: new Date().toISOString(),
      };
      
      addGroup(newGroup);
      
      Alert.alert(
        'Group Created Successfully!',
        `${formData.name} has been created. You can now invite members to join.`,
        [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
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
          <Text className="text-xl font-bold text-gray-900">Create Group</Text>
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
              Create a new savings circle (ROSCA/Tontine). Members will contribute monthly and take turns collecting the pooled funds.
            </Text>
          </View>
        </View>

        {/* Group Name */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Group Name *</Text>
          <TextInput
            className={cn(
              'bg-white border rounded-xl px-4 py-4 text-base text-gray-900',
              errors.name ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="Enter group name (e.g., Lagos Friends Circle)"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholderTextColor="#9CA3AF"
          />
          {errors.name && (
            <Text className="text-red-600 text-sm mt-2">{errors.name}</Text>
          )}
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Description *</Text>
          <TextInput
            className={cn(
              'bg-white border rounded-xl px-4 py-4 text-base text-gray-900 min-h-[100px]',
              errors.description ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="Describe the purpose of this savings group..."
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
          {errors.description && (
            <Text className="text-red-600 text-sm mt-2">{errors.description}</Text>
          )}
        </View>

        {/* Monthly Amount */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Monthly Contribution *</Text>
          <View className="relative">
            <Text className="absolute left-4 top-4 text-base text-gray-600 z-10">₦</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl pl-8 pr-4 py-4 text-base text-gray-900',
                errors.monthlyAmount ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="50,000"
              value={formData.monthlyAmount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.monthlyAmount && (
            <Text className="text-red-600 text-sm mt-2">{errors.monthlyAmount}</Text>
          )}
          <Text className="text-gray-600 text-sm mt-2">
            Each member contributes this amount monthly
          </Text>
        </View>

        {/* Number of Members */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Number of Members *</Text>
          <TextInput
            className={cn(
              'bg-white border rounded-xl px-4 py-4 text-base text-gray-900',
              errors.memberCount ? 'border-red-300' : 'border-gray-200'
            )}
            placeholder="8"
            value={formData.memberCount}
            onChangeText={(text) => setFormData(prev => ({ ...prev, memberCount: text.replace(/[^\d]/g, '') }))}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          {errors.memberCount && (
            <Text className="text-red-600 text-sm mt-2">{errors.memberCount}</Text>
          )}
          <Text className="text-gray-600 text-sm mt-2">
            Including yourself (3-20 members)
          </Text>
        </View>

        {/* Summary Card */}
        {formData.name && formData.monthlyAmount && formData.memberCount && (
          <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Group Summary</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Pool Amount</Text>
                <Text className="font-semibold text-gray-900">
                  {formatNaira(parseNairaAmount(formData.monthlyAmount) * parseInt(formData.memberCount || '0'))}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Cycle Duration</Text>
                <Text className="font-semibold text-gray-900">
                  {formData.memberCount} months
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Your Position</Text>
                <Text className="font-semibold text-gray-900">#1 (First to collect)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Create Button */}
        <Pressable
          onPress={handleCreateGroup}
          disabled={isLoading}
          className={cn(
            'py-4 rounded-xl flex-row items-center justify-center',
            isLoading ? 'bg-gray-300' : 'bg-blue-500'
          )}
        >
          {isLoading && (
            <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
          )}
          <Text className="text-white font-semibold text-base">
            {isLoading ? 'Creating Group...' : 'Create Group'}
          </Text>
        </Pressable>

        <Text className="text-gray-500 text-sm text-center mt-4 leading-5">
          After creating the group, you can invite members by sharing the group code or sending invitations.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}