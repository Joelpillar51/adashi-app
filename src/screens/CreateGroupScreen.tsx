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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useGroupStore } from '../state/groupStore';
import { useUserStore } from '../state/userStore';
import { NIGERIAN_BANKS } from '../types';
import { formatNaira, parseNairaAmount } from '../utils/currency';
import { formatWATDate } from '../utils/date';
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
    bankName: '',
    accountNumber: '',
    accountName: '',
  });
  
  const [startDate, setStartDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
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
    
    // Start date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    // Account details validation
    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Please select a bank';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length !== 10) {
      newErrors.accountNumber = 'Account number must be 10 digits';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    } else if (formData.accountName.trim().length < 3) {
      newErrors.accountName = 'Account name must be at least 3 characters';
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
        nextPaymentDue: startDate.toISOString(),
        daysLeft: Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        startDate: startDate.toISOString(),
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
        accountDetails: {
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          accountName: formData.accountName.trim().toUpperCase(),
        },
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

        {/* Start Date */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-3">Contribution Start Date *</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className={cn(
              'bg-white border rounded-xl px-4 py-4 flex-row items-center justify-between',
              errors.startDate ? 'border-red-300' : 'border-gray-200'
            )}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#6B7280" />
              <Text className="text-base text-gray-900 ml-3">
                {formatWATDate(startDate)}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </Pressable>
          {errors.startDate && (
            <Text className="text-red-600 text-sm mt-2">{errors.startDate}</Text>
          )}
          <Text className="text-gray-600 text-sm mt-2">
            When members should start making monthly contributions
          </Text>
        </View>

        {/* Account Details Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Collection Account Details</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Members will transfer their contributions to this account
          </Text>

          {/* Bank Name */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Bank Name *</Text>
            <View className="relative">
              <Pressable
                className={cn(
                  'bg-white border rounded-xl px-4 py-4 flex-row items-center justify-between',
                  errors.bankName ? 'border-red-300' : 'border-gray-200'
                )}
                onPress={() => setShowBankPicker(true)}
              >
                <Text className={cn(
                  'text-base',
                  formData.bankName ? 'text-gray-900' : 'text-gray-400'
                )}>
                  {formData.bankName || 'Select your bank'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
            {errors.bankName && (
              <Text className="text-red-600 text-sm mt-2">{errors.bankName}</Text>
            )}
          </View>

          {/* Account Number */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Account Number *</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl px-4 py-4 text-base text-gray-900 font-mono',
                errors.accountNumber ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="1234567890"
              value={formData.accountNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountNumber: text.replace(/\D/g, '').slice(0, 10) }))}
              keyboardType="number-pad"
              maxLength={10}
              placeholderTextColor="#9CA3AF"
            />
            {errors.accountNumber && (
              <Text className="text-red-600 text-sm mt-2">{errors.accountNumber}</Text>
            )}
          </View>

          {/* Account Name */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Account Name *</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.accountName ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="Account holder's full name"
              value={formData.accountName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, accountName: text.toUpperCase() }))}
              autoCapitalize="characters"
              placeholderTextColor="#9CA3AF"
            />
            {errors.accountName && (
              <Text className="text-red-600 text-sm mt-2">{errors.accountName}</Text>
            )}
            <Text className="text-gray-600 text-sm mt-2">
              This should match your bank account name exactly
            </Text>
          </View>
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
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Start Date</Text>
                <Text className="font-semibold text-gray-900">{formatWATDate(startDate)}</Text>
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

      {/* Date Picker - Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (event.type === 'set' && selectedDate) {
              setStartDate(selectedDate);
              setErrors(prev => ({ ...prev, startDate: '' }));
            }
          }}
        />
      )}

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom }}>
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text className="text-blue-600 font-semibold">Cancel</Text>
                </Pressable>
                <Text className="text-lg font-semibold text-gray-900">Select Start Date</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text className="text-blue-600 font-semibold">Done</Text>
                </Pressable>
              </View>
              <View className="p-4">
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      setErrors(prev => ({ ...prev, startDate: '' }));
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bank Picker Modal */}
      <Modal transparent animationType="slide" visible={showBankPicker}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom }}>
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Pressable onPress={() => setShowBankPicker(false)}>
                <Text className="text-blue-600 font-semibold">Cancel</Text>
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">Select Bank</Text>
              <View className="w-12" />
            </View>
            <ScrollView className="max-h-96">
              {NIGERIAN_BANKS.map((bank, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, bankName: bank }));
                    setErrors(prev => ({ ...prev, bankName: '' }));
                    setShowBankPicker(false);
                  }}
                  className={cn(
                    'p-4 border-b border-gray-100 flex-row items-center',
                    formData.bankName === bank ? 'bg-blue-50' : ''
                  )}
                >
                  <Text className={cn(
                    'text-base flex-1',
                    formData.bankName === bank ? 'text-blue-600 font-medium' : 'text-gray-900'
                  )}>
                    {bank}
                  </Text>
                  {formData.bankName === bank && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}