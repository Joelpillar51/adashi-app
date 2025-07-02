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
import { cn } from '../utils/cn';

interface ForgotPasswordScreenProps {
  onGoBack: () => void;
  onResetSent: () => void;
}

export default function ForgotPasswordScreen({ onGoBack, onResetSent }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
      onResetSent();
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View 
        className="flex-1 bg-white items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-8">
          <Ionicons name="mail" size={48} color="#10B981" />
        </View>
        
        <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
          Check Your Email
        </Text>
        
        <Text className="text-base text-gray-600 text-center leading-6 mb-8">
          We've sent a password reset link to{'\n'}
          <Text className="font-semibold text-gray-900">{email}</Text>
        </Text>
        
        <View className="w-full gap-4">
          <Pressable
            onPress={() => {
              // Open email app
              Alert.alert('Email App', 'This would open your email app');
            }}
            className="bg-blue-500 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-base">Open Email App</Text>
          </Pressable>
          
          <Pressable
            onPress={onGoBack}
            className="bg-gray-100 py-4 rounded-xl items-center"
          >
            <Text className="text-gray-700 font-semibold text-base">Back to Sign In</Text>
          </Pressable>
        </View>
        
        <View className="mt-8">
          <Text className="text-sm text-gray-500 text-center mb-4">
            Didn't receive the email? Check your spam folder or
          </Text>
          <Pressable onPress={() => setEmailSent(false)}>
            <Text className="text-blue-600 font-semibold text-center">Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 py-4">
          <Pressable 
            onPress={onGoBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          {/* Icon */}
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-8">
            <Ionicons name="lock-closed" size={48} color="#3B82F6" />
          </View>
          
          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
            Forgot Password?
          </Text>
          
          {/* Subtitle */}
          <Text className="text-base text-gray-600 text-center leading-6 mb-8">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Email Input */}
          <View className="w-full mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Email Address</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
                  error ? 'border-red-300' : 'border-gray-200'
                )}
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text.trim());
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
              />
              <View className="absolute right-4 top-4">
                <Ionicons name="mail" size={20} color="#9CA3AF" />
              </View>
            </View>
            {error && (
              <Text className="text-red-600 text-sm mt-2">{error}</Text>
            )}
          </View>

          {/* Reset Button */}
          <View className="w-full">
            <Pressable
              onPress={handleResetPassword}
              disabled={isLoading}
              className={cn(
                'py-4 rounded-xl flex-row items-center justify-center mb-4',
                isLoading ? 'bg-gray-300' : 'bg-blue-500'
              )}
            >
              {isLoading && (
                <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
              )}
              <Text className="text-white font-semibold text-base">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </Pressable>

            <Pressable onPress={onGoBack}>
              <Text className="text-gray-600 text-center">
                Remember your password?{' '}
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}