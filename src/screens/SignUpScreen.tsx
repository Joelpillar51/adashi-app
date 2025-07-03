import React, { useState, useCallback, useEffect } from 'react';
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
import { supabase } from '../config/supabase';
import { cn } from '../utils/cn';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
  onNavigateToOTPVerification?: (email: string) => void;
}

export default function SignUpScreen({ onNavigateToSignIn, onNavigateToOTPVerification }: SignUpScreenProps) {
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
  const [serverError, setServerError] = useState<string>('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Debounced email validation
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return; // Don't check invalid emails
    }

    setIsCheckingEmail(true);
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (existingProfile) {
        setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
      } else {
        // Clear email error if it was about uniqueness
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.email === 'An account with this email already exists') {
            delete newErrors.email;
          }
          return newErrors;
        });
      }
    } catch (error) {
      // Error means no user found (which is good) or network error
      // We'll handle network errors during actual signup
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounce email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.email.trim()) {
        checkEmailAvailability(formData.email.trim());
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.email, checkEmailAvailability]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Clear server error when validating
    setServerError('');
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 50) {
      newErrors.fullName = 'Full name must be less than 50 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > 255) {
      newErrors.email = 'Email must be less than 255 characters';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      if (!/^\+234\d{10}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid Nigerian phone number (+234...)';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password must be less than 128 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    } else if (/(.)\1{2,}/.test(formData.password)) {
      newErrors.password = 'Password cannot contain repeated characters';
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
    
    // Clear any previous server errors
    setServerError('');
    
    try {
      const { error, needsVerification, errorCode } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.phone.trim()
      );
      
      if (error) {
        // Handle specific error cases
        if (errorCode === 'email_already_exists') {
          setErrors(prev => ({ ...prev, email: error.message }));
        } else if (error.message.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: error.message }));
        } else if (error.message.toLowerCase().includes('password')) {
          setErrors(prev => ({ ...prev, password: error.message }));
        } else if (error.message.toLowerCase().includes('phone')) {
          setErrors(prev => ({ ...prev, phone: error.message }));
        } else {
          // General server error
          setServerError(error.message);
        }
      } else if (needsVerification) {
        // Success - navigate to OTP verification
        if (onNavigateToOTPVerification) {
          onNavigateToOTPVerification(formData.email.trim());
        } else {
          Alert.alert(
            'Verification Required',
            `We've sent a 6-digit verification code to ${formData.email.trim()}. Please check your email and enter the code to activate your account.`,
            [{ 
              text: 'OK', 
              onPress: () => {
                // Clear form on successful submission
                setFormData({
                  fullName: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                });
                setAgreedToTerms(false);
                onNavigateToSignIn();
              }
            }]
          );
        }
      } else {
        // User is immediately signed in (shouldn't happen with email confirmation)
        Alert.alert(
          'Account Created Successfully!',
          'Welcome to Adashi! Your account has been created and you are now signed in.',
          [{ text: 'Get Started' }]
        );
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setServerError('An unexpected error occurred. Please check your internet connection and try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    setServerError('');
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setServerError(error.message || 'Unable to sign up with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      setServerError('An unexpected error occurred with Google sign up. Please try again.');
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

        {/* Server Error Display */}
        {serverError && (
          <View className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#DC2626" className="mt-0.5 mr-3" />
              <Text className="text-red-700 text-sm flex-1">{serverError}</Text>
            </View>
          </View>
        )}

        {/* Form */}
        <View className="px-6">
          {/* Full Name */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Full Name</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
                  errors.fullName ? 'border-red-300' : 'border-gray-200'
                )}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, fullName: text }));
                  // Clear error when user starts typing
                  if (errors.fullName) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.fullName;
                      return newErrors;
                    });
                  }
                }}
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
              {/* Name validation indicator */}
              <View className="absolute right-4 top-4">
                {formData.fullName.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(formData.fullName.trim()) ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : errors.fullName ? (
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                ) : null}
              </View>
            </View>
            {errors.fullName && (
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.fullName}</Text>
              </Text>
            )}
          </View>

          {/* Email */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Email Address</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900',
                  errors.email ? 'border-red-300 pr-12' : 'border-gray-200 pr-12'
                )}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text.trim() }));
                  // Clear email error when user starts typing
                  if (errors.email) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.email;
                      return newErrors;
                    });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
              />
              {/* Email status indicator */}
              <View className="absolute right-4 top-4">
                {isCheckingEmail ? (
                  <View className="w-5 h-5">
                    <View className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  </View>
                ) : formData.email && !errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : errors.email ? (
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                ) : null}
              </View>
            </View>
            {errors.email && (
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.email}</Text>
              </Text>
            )}
            {isCheckingEmail && (
              <Text className="text-gray-500 text-sm mt-2">Checking email availability...</Text>
            )}
          </View>

          {/* Phone */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">Phone Number</Text>
            <View className="relative">
              <TextInput
                className={cn(
                  'bg-gray-50 border rounded-xl px-4 py-4 text-base text-gray-900 pr-12',
                  errors.phone ? 'border-red-300' : 'border-gray-200'
                )}
                placeholder="+234 801 234 5678"
                value={formData.phone}
                onChangeText={(text) => {
                  handlePhoneChange(text);
                  // Clear error when user starts typing
                  if (errors.phone) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.phone;
                      return newErrors;
                    });
                  }
                }}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
              {/* Phone validation indicator */}
              <View className="absolute right-4 top-4">
                {/^\+234\s\d{3}\s\d{3}\s\d{4}$/.test(formData.phone) ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : errors.phone ? (
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                ) : null}
              </View>
            </View>
            {errors.phone && (
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.phone}</Text>
              </Text>
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
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, password: text }));
                  // Clear password error when user starts typing
                  if (errors.password) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.password;
                      return newErrors;
                    });
                  }
                }}
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
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.password}</Text>
              </Text>
            )}
            {/* Password strength indicator */}
            {formData.password && !errors.password && (
              <View className="mt-2">
                <Text className="text-xs text-gray-600 mb-1">Password strength:</Text>
                <View className="flex-row gap-1">
                  <View className={cn(
                    'flex-1 h-1 rounded',
                    formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                  <View className={cn(
                    'flex-1 h-1 rounded',
                    /(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                  <View className={cn(
                    'flex-1 h-1 rounded',
                    /(?=.*\d)/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                  <View className={cn(
                    'flex-1 h-1 rounded',
                    /(?=.*[!@#$%^&*])/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  Use 8+ characters with upper/lowercase, numbers, and symbols
                </Text>
              </View>
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
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, confirmPassword: text }));
                  // Clear confirm password error when user starts typing
                  if (errors.confirmPassword) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                }}
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
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.confirmPassword}</Text>
              </Text>
            )}
            {/* Password match indicator */}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-green-600 text-sm ml-1">Passwords match</Text>
              </View>
            )}
          </View>

          {/* Terms Agreement */}
          <View className="mb-8">
            <Pressable 
              onPress={() => {
                setAgreedToTerms(!agreedToTerms);
                // Clear terms error when user agrees
                if (errors.terms && !agreedToTerms) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.terms;
                    return newErrors;
                  });
                }
              }}
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
              <Text className="text-red-600 text-sm mt-2 flex-row items-center">
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text className="ml-1">{errors.terms}</Text>
              </Text>
            )}
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={isLoading || isCheckingEmail}
            className={cn(
              'py-4 rounded-xl flex-row items-center justify-center mb-6',
              (isLoading || isCheckingEmail) ? 'bg-gray-300' : 'bg-blue-500'
            )}
          >
            {(isLoading || isCheckingEmail) && (
              <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
            )}
            <Text className="text-white font-semibold text-base">
              {isLoading ? 'Creating Account...' : 
               isCheckingEmail ? 'Validating...' : 
               'Create Account'}
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