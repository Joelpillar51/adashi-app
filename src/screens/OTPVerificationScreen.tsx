import React, { useState, useRef, useEffect } from 'react';
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

interface OTPVerificationScreenProps {
  email: string;
  onVerificationComplete: () => void;
  onGoBack: () => void;
}

export default function OTPVerificationScreen({ 
  email, 
  onVerificationComplete, 
  onGoBack 
}: OTPVerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup'
      });

      if (error) {
        Alert.alert(
          'Verification Failed',
          error.message || 'Invalid verification code. Please try again.',
          [{ text: 'OK' }]
        );
      } else if (data.user) {
        Alert.alert(
          'Email Verified!',
          'Your account has been successfully verified. You can now sign in.',
          [{ 
            text: 'Continue', 
            onPress: onVerificationComplete 
          }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        Alert.alert(
          'Resend Failed',
          error.message || 'Unable to resend verification code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Code Sent',
          'A new verification code has been sent to your email.',
          [{ text: 'OK' }]
        );
        setCountdown(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 3) return email;
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
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
        <View className="flex-row items-center px-6 py-4">
          <Pressable 
            onPress={onGoBack}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
        </View>

        {/* Content */}
        <View className="flex-1 px-6">
          {/* Icon and Title */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-blue-500 rounded-3xl items-center justify-center mb-6">
              <Ionicons name="mail" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</Text>
            <Text className="text-base text-gray-600 text-center leading-6">
              We've sent a 6-digit verification code to{'\n'}
              <Text className="font-semibold text-gray-900">{formatEmail(email)}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">Enter verification code</Text>
            <View className="flex-row justify-between mb-4">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className={cn(
                    'w-12 h-14 border-2 rounded-xl text-center text-xl font-bold',
                    digit ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                  )}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>

          {/* Verify Button */}
          <Pressable
            onPress={handleVerifyOTP}
            disabled={isLoading || otp.join('').length !== 6}
            className={cn(
              'py-4 rounded-xl flex-row items-center justify-center mb-6',
              isLoading || otp.join('').length !== 6 ? 'bg-gray-300' : 'bg-blue-500'
            )}
          >
            {isLoading && (
              <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
            )}
            <Text className="text-white font-semibold text-base">
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Text>
          </Pressable>

          {/* Resend Code */}
          <View className="items-center mb-8">
            <Text className="text-gray-600 mb-4">Didn't receive the code?</Text>
            
            {canResend ? (
              <Pressable
                onPress={handleResendOTP}
                disabled={resendLoading}
                className="flex-row items-center"
              >
                {resendLoading && (
                  <View className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2 animate-spin" />
                )}
                <Text className="text-blue-600 font-semibold">
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-gray-500">
                Resend code in {countdown}s
              </Text>
            )}
          </View>

          {/* Help Text */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="text-sm text-blue-800 leading-5">
                  Check your email inbox and spam folder. The verification code will expire in 10 minutes.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}