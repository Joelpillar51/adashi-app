import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { useUserStore } from '../state/userStore';
import { Group } from '../types';
import { parseNairaAmount } from '../utils/currency';
import { cn } from '../utils/cn';
import { 
  generateGroupId, 
  generateRotationSchedule, 
  getGroupInviteCode,
  validateGroupName,
  validateMonthlyAmount,
  validateMemberCount 
} from '../utils/groupUtils';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ visible, onClose }: CreateGroupModalProps) {
  const insets = useSafeAreaInsets();
  const { addGroup, updateTimeline } = useGroupStore();
  const { profile } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyAmount: '',
    memberCount: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthlyAmount: '',
      memberCount: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a group description');
      return false;
    }
    if (!formData.monthlyAmount.trim()) {
      Alert.alert('Error', 'Please enter the monthly contribution amount');
      return false;
    }
    if (!formData.memberCount.trim()) {
      Alert.alert('Error', 'Please enter the expected number of members');
      return false;
    }

    const amount = parseNairaAmount(formData.monthlyAmount);
    const count = parseInt(formData.memberCount);

    if (amount <= 0) {
      Alert.alert('Error', 'Monthly amount must be greater than ₦0');
      return false;
    }
    if (count < 2) {
      Alert.alert('Error', 'Group must have at least 2 members');
      return false;
    }
    if (count > 50) {
      Alert.alert('Error', 'Group cannot have more than 50 members');
      return false;
    }

    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateForm() || !profile) return;

    setIsCreating(true);

    try {
      const amount = parseNairaAmount(formData.monthlyAmount);
      const count = parseInt(formData.memberCount);

      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        memberCount: count,
        monthlyAmount: amount,
        currentRecipient: profile.name,
        myPosition: 1,
        nextPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        daysLeft: 30,
        totalSaved: 0,
        cycleProgress: 0,
        role: 'owner',
        status: 'active',
        members: [
          {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: 'owner',
            joinDate: new Date().toISOString(),
            paymentStatus: 'current',
            rotationPosition: 1,
            totalContributed: 0,
            isActive: true,
          }
        ],
        createdAt: new Date().toISOString(),
      };

      addGroup(newGroup);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success!', 
        `"${formData.name}" has been created successfully. You can now invite members to join.`,
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrencyInput = (text: string) => {
    // Remove all non-numeric characters except commas
    const cleaned = text.replace(/[^\d,]/g, '');
    // Add currency symbol
    return cleaned ? `₦${cleaned}` : '';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        className="flex-1 bg-black/50"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1" />
        <View 
          className="bg-white rounded-t-3xl"
          style={{ 
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            maxHeight: '85%'
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 mb-6">
            <Text className="text-2xl font-bold text-gray-900">Create New Group</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView 
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Group Name */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">Group Name *</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="e.g., Office Colleagues Savings"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
              <Text className="text-sm text-gray-500 mt-2">
                Choose a memorable name for your savings group
              </Text>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">Description *</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="Describe the purpose and goals of this group..."
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text className="text-sm text-gray-500 mt-2">
                {formData.description.length}/200 characters
              </Text>
            </View>

            {/* Monthly Amount */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">Monthly Contribution *</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="₦50,000"
                value={formData.monthlyAmount}
                onChangeText={(text) => {
                  const formatted = formatCurrencyInput(text);
                  setFormData(prev => ({ ...prev, monthlyAmount: formatted }));
                }}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
              <Text className="text-sm text-gray-500 mt-2">
                Amount each member contributes monthly
              </Text>
            </View>

            {/* Member Count */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-gray-900 mb-3">Expected Members *</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-4 text-base text-gray-900"
                placeholder="8"
                value={formData.memberCount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^\d]/g, '');
                  setFormData(prev => ({ ...prev, memberCount: cleaned }));
                }}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text className="text-sm text-gray-500 mt-2">
                Total number of members (including yourself)
              </Text>
            </View>

            {/* Summary Preview */}
            {formData.monthlyAmount && formData.memberCount && (
              <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <Text className="text-sm font-semibold text-blue-800 mb-2">Group Summary</Text>
                <View className="gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-blue-700">Monthly Collection:</Text>
                    <Text className="text-sm font-semibold text-blue-900">
                      ₦{(parseNairaAmount(formData.monthlyAmount) * parseInt(formData.memberCount || '0')).toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-blue-700">Cycle Duration:</Text>
                    <Text className="text-sm font-semibold text-blue-900">
                      {formData.memberCount} months
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-blue-700">Your Collection Turn:</Text>
                    <Text className="text-sm font-semibold text-blue-900">
                      Position #1 (First)
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Important Notice */}
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-amber-800 mb-1">Important</Text>
                  <Text className="text-sm text-amber-700 leading-5">
                    As the group owner, you'll be responsible for inviting members, coordinating payments, and managing the rotation schedule.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="px-6 pt-4 border-t border-gray-100">
            <Pressable
              onPress={handleCreateGroup}
              disabled={isCreating}
              className={cn(
                'py-4 rounded-xl flex-row items-center justify-center mb-3',
                isCreating ? 'bg-gray-300' : 'bg-blue-500'
              )}
            >
              {isCreating ? (
                <>
                  <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <Text className="text-white font-semibold">Creating Group...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Create Group</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleClose}
              disabled={isCreating}
              className="py-4 rounded-xl flex-row items-center justify-center bg-gray-100"
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}