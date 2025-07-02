import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Group } from '../types';
import { formatNaira } from '../utils/currency';
import { cn } from '../utils/cn';

interface PaymentOverlayProps {
  visible: boolean;
  onClose: () => void;
  group: Group;
  onPaymentComplete?: () => void;
}

export default function PaymentOverlay({ visible, onClose, group, onPaymentComplete }: PaymentOverlayProps) {
  const insets = useSafeAreaInsets();
  const [isMarkedAsPaid, setIsMarkedAsPaid] = useState(false);
  
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.9, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Use group account details or fallback to default
  const accountDetails = group.accountDetails || {
    bankName: 'First Bank of Nigeria',
    accountNumber: '3085467291',
    accountName: group.members.find(m => m.role === 'owner')?.name.toUpperCase() || 'GROUP ADMIN',
  };

  const paymentReference = `ADH${group.id.slice(-4).toUpperCase()}${Date.now().toString().slice(-4)}`;

  const handleCopyAccountNumber = async () => {
    await Clipboard.setStringAsync(accountDetails.accountNumber);
    Alert.alert('Copied!', 'Account number copied to clipboard');
  };

  const handleCopyAccountName = async () => {
    await Clipboard.setStringAsync(accountDetails.accountName);
    Alert.alert('Copied!', 'Account name copied to clipboard');
  };

  const handleCopyReference = async () => {
    await Clipboard.setStringAsync(paymentReference);
    Alert.alert('Copied!', 'Payment reference copied to clipboard');
  };

  const handleShareDetails = async () => {
    try {
      await Share.share({
        message: `Payment Details for ${group.name}:\n\nBank: ${accountDetails.bankName}\nAccount Number: ${accountDetails.accountNumber}\nAccount Name: ${accountDetails.accountName}\nAmount: ${formatNaira(group.monthlyAmount)}\nReference: ${paymentReference}`,
        title: 'Adashi Payment Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Confirm Payment',
      `Have you transferred ${formatNaira(group.monthlyAmount)} to this account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, I\'ve Paid', 
          onPress: () => {
            setIsMarkedAsPaid(true);
            onPaymentComplete?.();
            Alert.alert(
              'Payment Recorded!',
              'Your payment has been marked as completed. The group admin will verify the transaction.',
              [{ text: 'OK', onPress: onClose }]
            );
          }
        },
      ]
    );
  };

  const copyActions = [
    {
      label: 'Account Number',
      value: accountDetails.accountNumber,
      onPress: handleCopyAccountNumber,
      icon: 'card' as const,
    },
    {
      label: 'Account Name',
      value: accountDetails.accountName,
      onPress: handleCopyAccountName,
      icon: 'person' as const,
    },
    {
      label: 'Reference',
      value: paymentReference,
      onPress: handleCopyReference,
      icon: 'receipt' as const,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        
        <Animated.View 
          style={[animatedStyle, { paddingBottom: insets.bottom + 24 }]}
          className="bg-white rounded-t-3xl p-6 max-h-[85%]"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">Make Payment</Text>
              <Text className="text-sm text-gray-600 mt-1">{group.name}</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Amount Section */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <View className="items-center">
              <Text className="text-sm text-blue-600 mb-2">Monthly Contribution</Text>
              <Text className="text-4xl font-bold text-blue-900 mb-2">
                {formatNaira(group.monthlyAmount)}
              </Text>
              <Text className="text-sm text-blue-700">
                Due: {new Date(group.nextPaymentDue).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Account Details */}
          <View className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-emerald-100 rounded-2xl items-center justify-center mr-3">
                <Ionicons name="business" size={24} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Bank Details</Text>
                <Text className="text-sm text-gray-600">Transfer to this account</Text>
              </View>
            </View>

            <View className="gap-4">
              {/* Bank Name */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">Bank Name</Text>
                <Text className="text-base font-semibold text-gray-900">{accountDetails.bankName}</Text>
              </View>

              {/* Account Number */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">Account Number</Text>
                <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
                  <Text className="text-lg font-mono font-bold text-gray-900">
                    {accountDetails.accountNumber}
                  </Text>
                  <Pressable onPress={handleCopyAccountNumber}>
                    <Ionicons name="copy" size={20} color="#3B82F6" />
                  </Pressable>
                </View>
              </View>

              {/* Account Name */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">Account Name</Text>
                <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
                  <Text className="text-base font-semibold text-gray-900">
                    {accountDetails.accountName}
                  </Text>
                  <Pressable onPress={handleCopyAccountName}>
                    <Ionicons name="copy" size={20} color="#3B82F6" />
                  </Pressable>
                </View>
              </View>

              {/* Payment Reference */}
              <View>
                <Text className="text-sm text-gray-600 mb-2">Payment Reference</Text>
                <View className="flex-row items-center justify-between bg-amber-50 rounded-xl p-4">
                  <Text className="text-sm font-mono font-bold text-amber-800">
                    {paymentReference}
                  </Text>
                  <Pressable onPress={handleCopyReference}>
                    <Ionicons name="copy" size={20} color="#D97706" />
                  </Pressable>
                </View>
                <Text className="text-xs text-amber-700 mt-2">
                  ⚠️ Include this reference in your transfer description
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Copy Actions */}
          <View className="flex-row gap-2 mb-6">
            {copyActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                className="flex-1 bg-gray-50 border border-gray-200 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name={action.icon} size={16} color="#6B7280" />
                <Text className="text-gray-700 text-xs font-medium ml-1">Copy {action.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleShareDetails}
              className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Ionicons name="share" size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">Share Payment Details</Text>
            </Pressable>

            <Pressable
              onPress={handleMarkAsPaid}
              disabled={isMarkedAsPaid}
              className={cn(
                'py-4 rounded-xl flex-row items-center justify-center',
                isMarkedAsPaid ? 'bg-emerald-100 border border-emerald-200' : 'bg-emerald-500'
              )}
            >
              <Ionicons 
                name={isMarkedAsPaid ? "checkmark-circle" : "checkmark"} 
                size={20} 
                color={isMarkedAsPaid ? "#059669" : "white"} 
              />
              <Text className={cn(
                'font-semibold text-base ml-2',
                isMarkedAsPaid ? 'text-emerald-700' : 'text-white'
              )}>
                {isMarkedAsPaid ? 'Payment Recorded' : 'Mark as Paid'}
              </Text>
            </Pressable>
          </View>

          {/* Instructions */}
          <View className="mt-6 p-4 bg-gray-50 rounded-xl">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Payment Instructions:</Text>
            <View className="gap-1">
              <Text className="text-sm text-gray-700">1. Use mobile banking or visit your bank</Text>
              <Text className="text-sm text-gray-700">2. Transfer the exact amount shown above</Text>
              <Text className="text-sm text-gray-700">3. Include the payment reference in narration</Text>
              <Text className="text-sm text-gray-700">4. Mark as paid when transfer is complete</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}