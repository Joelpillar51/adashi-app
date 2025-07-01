import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { NIGERIAN_BANKS } from '../types';
import { formatNaira } from '../utils/currency';
import { formatWATDateTime, formatWATDate } from '../utils/date';
import { cn } from '../utils/cn';

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { payments, groups } = useGroupStore();
  const [filterType, setFilterType] = useState<'all' | 'contribution' | 'collection'>('all');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showBankModal, setShowBankModal] = useState(false);

  const filteredPayments = payments.filter((payment) => {
    if (filterType === 'all') return true;
    return payment.type === filterType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return 'arrow-up-circle';
      case 'collection':
        return 'arrow-down-circle';
      case 'penalty':
        return 'warning';
      default:
        return 'card';
    }
  };

  const mockBankAccount = {
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0123456789',
    accountName: 'ADUNNI OKAFOR',
  };

  const BankDetailsModal = () => (
    <Modal
      visible={showBankModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBankModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 24 }}>
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-900">Bank Transfer Details</Text>
            <Pressable onPress={() => setShowBankModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-blue-500 rounded-2xl items-center justify-center mr-3">
                <Ionicons name="card" size={24} color="white" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">{mockBankAccount.bankName}</Text>
                <Text className="text-sm text-gray-600">Current Collection Account</Text>
              </View>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Account Number</Text>
                <Text className="text-base font-mono font-semibold text-gray-900">
                  {mockBankAccount.accountNumber}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Account Name</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {mockBankAccount.accountName}
                </Text>
              </View>
            </View>
          </View>

          <View className="gap-3">
            <Pressable className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center">
              <Ionicons name="copy" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Copy Account Details</Text>
            </Pressable>
            <Pressable className="bg-gray-100 py-4 rounded-xl flex-row items-center justify-center">
              <Ionicons name="share" size={20} color="#6B7280" />
              <Text className="text-gray-700 font-semibold ml-2">Share Details</Text>
            </Pressable>
          </View>

          <View className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#D97706" />
              <Text className="text-sm text-amber-800 ml-2 flex-1">
                Always include your name and group reference when making transfers to ensure proper tracking.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Payments</Text>

        {/* Filter Tabs */}
        <View className="flex-row bg-gray-50 rounded-xl p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'contribution', label: 'Contributions' },
            { key: 'collection', label: 'Collections' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setFilterType(tab.key as any)}
              className={cn(
                'flex-1 py-2 rounded-lg items-center',
                filterType === tab.key ? 'bg-white shadow-sm' : ''
              )}
            >
              <Text
                className={cn(
                  'text-sm font-medium',
                  filterType === tab.key ? 'text-gray-900' : 'text-gray-600'
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bank Transfer Button */}
      <View className="px-6 py-4">
        <Pressable
          onPress={() => setShowBankModal(true)}
          className="bg-blue-500 py-4 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="card" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">View Bank Details</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingTop: 0 }}
      >
        {filteredPayments.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="card-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Payments Found</Text>
            <Text className="text-base text-gray-600 text-center">
              Your payment history will appear here once you start making contributions
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {filteredPayments.map((payment) => {
              const group = groups.find(g => g.id === payment.groupId);
              return (
                <Pressable
                  key={payment.id}
                  onPress={() => setSelectedPayment(payment)}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mr-3">
                        <Ionicons 
                          name={getTypeIcon(payment.type) as any} 
                          size={24} 
                          color="#3B82F6" 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900 mb-1">
                          {payment.groupName}
                        </Text>
                        <Text className="text-sm text-gray-600 capitalize">
                          {payment.type.replace('_', ' ')}
                          {payment.recipient && ` • ${payment.recipient}`}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-gray-900 mb-1">
                        {formatNaira(payment.amount)}
                      </Text>
                      <View className={cn('px-3 py-1 rounded-full border', getStatusColor(payment.status))}>
                        <Text className="text-xs font-medium capitalize">{payment.status}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={16} color="#6B7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        {formatWATDate(payment.date)}
                      </Text>
                    </View>
                    {payment.reference && (
                      <View className="flex-row items-center">
                        <Ionicons name="receipt" size={16} color="#6B7280" />
                        <Text className="text-sm text-gray-600 ml-2 font-mono">
                          {payment.reference}
                        </Text>
                      </View>
                    )}
                  </View>

                  {payment.status === 'failed' && (
                    <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <Ionicons name="warning" size={16} color="#DC2626" />
                        <Text className="text-sm text-red-800 ml-2">Payment failed</Text>
                      </View>
                      <Pressable className="bg-red-600 px-3 py-1 rounded-lg">
                        <Text className="text-white text-sm font-medium">Retry</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BankDetailsModal />
    </View>
  );
}