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
import { useAuthStore } from '../state/authStore';
import { cn } from '../utils/cn';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
}

export default function SignUpScreen({ onNavigateToSignIn }: SignUpScreenProps) {
  const insets = useSafeAreaInsets();
  const { signUp, signInWithGoogle, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+234\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Nigerian phone number (+234...)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!agreedToTerms) {
      newErrors.terms = 'Please agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (text: string) => {
    // Auto-format Nigerian phone number
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('234')) {
      cleaned = '+234 ' + cleaned.slice(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = '+234 ' + cleaned.slice(1);
    } else if (!cleaned.startsWith('+234')) {
      cleaned = '+234 ' + cleaned;
    }
    
    // Format with spaces: +234 xxx xxx xxxx
    const formatted = cleaned.replace(/(\+234)\s?(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    try {
      const { error } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.phone.trim()
      );
      
      if (error) {
        Alert.alert(
          'Sign Up Failed',
          error.message || 'Unable to create account. Please try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Account Created!',
          'Please check your email to verify your account before signing in.',
          [
            { 
              text: 'Go to Sign In', 
              onPress: onNavigateToSignIn 
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        Alert.alert(
          'Google Sign Up Failed',
          error.message || 'Unable to sign up with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred with Google sign up.');
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center px-6 py-8">
          <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
            <Ionicons name="people" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Join Adashi</Text>
          <Text className="text-base text-gray-600 text-center">
            Create your account and start building wealth with trusted savings circles
          </Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Full Name */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Full Name</Text>
            <TextInput
              className={cn(
                'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.fullName ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              autoCapitalize="words"
              placeholderTextColor="#9CA3AF"
            />
            {errors.fullName && (
              <Text className="text-red-600 text-sm mt-2">{errors.fullName}</Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Email Address</Text>
            <TextInput
              className={cn(
                'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.email ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text.trim() }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9CA3AF"
            />
            {errors.email && (
              <Text className="text-red-600 text-sm mt-2">{errors.email}</Text>
            )}
          </View>

          {/* Phone */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Phone Number</Text>
            <TextInput
              className={cn(
                'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900',
                errors.phone ? 'border-red-300' : 'border-gray-200'
              )}
              placeholder="+234 801 234 5678"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            {errors.phone && (
              <Text className="text-red-600 text-sm mt-2">{errors.phone}</Text>
            )}
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Password</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
                  errors.password ? 'border-red-300' : 'border-gray-200'
                )}
                placeholder="Create a strong password"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <Pressable 
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text className="text-red-600 text-sm mt-2">{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Confirm Password</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                )}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9CA3AF"
              />
              <Pressable 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </Pressable>
            </View>
            {errors.confirmPassword && (
              <Text className="text-red-600 text-sm mt-2">{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Terms Agreement */}
          <View className="mb-8">
            <Pressable 
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              className="flex-row items-start"
            >
              <View className={cn(
                'w-5 h-5 border-2 rounded mr-3 mt-1 items-center justify-center',
                agreedToTerms ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              )}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </View>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                I agree to the{' '}
                <Text className="text-blue-600 font-medium">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-blue-600 font-medium">Privacy Policy</Text>
              </Text>
            </Pressable>
            {errors.terms && (
              <Text className="text-red-600 text-sm mt-2">{errors.terms}</Text>
            )}
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={isLoading}
            className={cn(
              'py-4 rounded-xl flex-row items-center justify-center mb-6',
              isLoading ? 'bg-gray-300' : 'bg-blue-500'
            )}
          >
            {isLoading && (
              <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
            )}
            <Text className="text-white font-semibold text-base">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>

          {/* Social Sign Up */}
          <View className="mb-8">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-gray-500 text-sm mx-4">Or sign up with</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <View className="flex-row gap-4">
              <Pressable 
                onPress={handleGoogleSignUp}
                disabled={isLoading}
                className={cn(
                  'flex-1 border py-4 rounded-xl flex-row items-center justify-center',
                  isLoading ? 'bg-gray-100 border-gray-200' : 'bg-gray-50 border-gray-200'
                )}
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-gray-700 font-medium ml-2">Google</Text>
              </Pressable>
              <Pressable 
                disabled={true}
                className="flex-1 bg-gray-100 border border-gray-200 py-4 rounded-xl flex-row items-center justify-center opacity-50"
              >
                <Ionicons name="logo-apple" size={20} color="#000000" />
                <Text className="text-gray-500 font-medium ml-2">Apple</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Sign In Link */}
        <View className="px-6 py-6 border-t border-gray-100">
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <Pressable onPress={onNavigateToSignIn}>
              <Text className="text-blue-600 font-semibold">Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}