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

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
}

export default function SignInScreen({ 
  onNavigateToSignUp, 
  onNavigateToForgotPassword 
}: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    try {
      const { error } = await signIn(formData.email.trim(), formData.password);
      
      if (error) {
        Alert.alert(
          'Sign In Failed',
          error.message || 'Please check your email and password and try again.',
          [{ text: 'OK' }]
        );
      }
      // If successful, the auth state will update automatically
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        Alert.alert(
          'Google Sign In Failed',
          error.message || 'Unable to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred with Google sign in.');
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
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center px-6 py-8">
          <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
            <Ionicons name="people" size={40} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-base text-gray-600 text-center">
            Sign in to your Adashi account and continue saving with your circles
          </Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6">
          {/* Email */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Email Address</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
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
              <View className="absolute right-4 top-4">
                <Ionicons name="mail" size={20} color="#9CA3AF" />
              </View>
            </View>
            {errors.email && (
              <Text className="text-red-600 text-sm mt-2">{errors.email}</Text>
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
                placeholder="Enter your password"
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

          {/* Forgot Password */}
          <Pressable onPress={onNavigateToForgotPassword} className="mb-8">
            <Text className="text-blue-600 font-medium text-right">Forgot Password?</Text>
          </Pressable>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>

          {/* Social Sign In */}
          <View className="mb-8">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-gray-500 text-sm mx-4">Or continue with</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <View className="flex-row gap-4">
              <Pressable 
                onPress={handleGoogleSignIn}
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

        {/* Sign Up Link */}
        <View className="px-6 py-6 border-t border-gray-100">
          <View className="flex-row items-center justify-center">
            <Text className="text-gray-600">Don't have an account? </Text>
            <Pressable onPress={onNavigateToSignUp}>
              <Text className="text-blue-600 font-semibold">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}