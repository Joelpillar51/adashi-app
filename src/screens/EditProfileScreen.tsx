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
import { useUserStore } from '../state/userStore';
import { cn } from '../utils/cn';

interface EditProfileScreenProps {
  navigation?: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?234[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Nigerian phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (text: string) => {
    // Format Nigerian phone number
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('234')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.slice(1);
    } else if (!cleaned.startsWith('+234')) {
      cleaned = '+234' + cleaned;
    }
    
    // Format as +234 XXX XXX XXXX
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4) + ' ' + cleaned.slice(4);
    }
    if (cleaned.length > 8) {
      cleaned = cleaned.slice(0, 8) + ' ' + cleaned.slice(8);
    }
    if (cleaned.length > 12) {
      cleaned = cleaned.slice(0, 12) + ' ' + cleaned.slice(12);
    }
    
    setFormData(prev => ({ ...prev, phone: cleaned }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation?.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.name !== (profile?.name || '') ||
      formData.email !== (profile?.email || '') ||
      formData.phone !== (profile?.phone || '')
    );
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
          <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges() || isLoading}
            className={cn(
              'px-4 py-2 rounded-lg',
              hasChanges() && !isLoading ? 'bg-blue-500' : 'bg-gray-300'
            )}
          >
            <Text className={cn(
              'font-semibold text-sm',
              hasChanges() && !isLoading ? 'text-white' : 'text-gray-500'
            )}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center mb-4">
            <Text className="text-2xl font-bold text-white">
              {formData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </Text>
          </View>
          <Pressable className="flex-row items-center bg-gray-100 px-4 py-2 rounded-lg">
            <Ionicons name="camera" size={16} color="#6B7280" />
            <Text className="text-gray-700 font-medium ml-2">Change Photo</Text>
          </Pressable>
          <Text className="text-gray-500 text-sm mt-2">Coming soon</Text>
        </View>

        {/* Personal Information */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Personal Information</Text>
          
          {/* Name */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Full Name *</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.name ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholderTextColor="#9CA3AF"
            />
            {errors.name && (
              <Text className="text-red-600 text-sm mt-2">{errors.name}</Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Email Address *</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.email ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="Enter your email address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            {errors.email && (
              <Text className="text-red-600 text-sm mt-2">{errors.email}</Text>
            )}
          </View>

          {/* Phone */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Phone Number *</Text>
            <TextInput
              className={cn(
                'bg-white border rounded-xl px-4 py-4 text-base text-gray-900 font-mono',
                errors.phone ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="+234 XXX XXX XXXX"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            {errors.phone && (
              <Text className="text-red-600 text-sm mt-2">{errors.phone}</Text>
            )}
            <Text className="text-gray-600 text-sm mt-2">
              We'll use this for payment confirmations and group notifications
            </Text>
          </View>
        </View>

        {/* Security Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Security</Text>
          
          <Pressable className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={20} color="#6B7280" />
              </View>
              <View>
                <Text className="text-base font-semibold text-gray-900">Change Password</Text>
                <Text className="text-sm text-gray-600 mt-1">Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Account</Text>
          
          <Pressable className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="trash" size={20} color="#DC2626" />
              </View>
              <View>
                <Text className="text-base font-semibold text-red-600">Delete Account</Text>
                <Text className="text-sm text-red-500 mt-1">Permanently delete your account and data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#DC2626" />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}