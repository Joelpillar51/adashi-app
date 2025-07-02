import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatNaira } from '../utils/currency';
import { formatWATDate, getDaysUntil } from '../utils/date';
import { cn } from '../utils/cn';

interface RotationTimelineScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function RotationTimelineScreen({ route, navigation }: RotationTimelineScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups, getGroupTimeline } = useGroupStore();

  const group = groups.find(g => g.id === groupId);
  const timeline = getGroupTimeline(groupId).sort((a, b) => a.position - b.position);

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'current':
        return 'bg-blue-500';
      case 'upcoming':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700';
      case 'current':
        return 'text-blue-700';
      case 'upcoming':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'current':
        return 'time';
      case 'upcoming':
        return 'hourglass-outline';
      default:
        return 'hourglass-outline';
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center mb-4">
          <Pressable 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Rotation Timeline</Text>
            <Text className="text-base text-gray-600 mt-1">{group.name}</Text>
          </View>
        </View>

        {/* Group Stats */}
        <View className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <View className="items-center">
            <Text className="text-sm text-gray-600">Monthly Amount</Text>
            <Text className="text-base font-bold text-gray-900">{formatNaira(group.monthlyAmount)}</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center">
            <Text className="text-sm text-gray-600">Cycle Progress</Text>
            <Text className="text-base font-bold text-gray-900">{Math.round(group.cycleProgress)}%</Text>
          </View>
          <View className="w-px h-8 bg-gray-200" />
          <View className="items-center">
            <Text className="text-sm text-gray-600">Members</Text>
            <Text className="text-base font-bold text-gray-900">{group.memberCount}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {timeline.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="time-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Timeline Available</Text>
            <Text className="text-base text-gray-600 text-center">
              The rotation timeline will be generated once the group cycle begins
            </Text>
          </View>
        ) : (
          <View className="relative">
            {/* Timeline Line */}
            <View className="absolute left-8 top-6 bottom-6 w-0.5 bg-gray-200" />
            
            <View className="gap-6">
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1;
                const daysUntil = getDaysUntil(item.dueDate);
                
                return (
                  <View key={item.id} className="flex-row items-start">
                    {/* Timeline Dot */}
                    <View className="relative z-10 mr-6">
                      <View className={cn('w-4 h-4 rounded-full', getStatusColor(item.status))} />
                      {item.status === 'current' && (
                        <View className="absolute -inset-2 border-2 border-blue-200 rounded-full animate-pulse" />
                      )}
                    </View>

                    {/* Content Card */}
                    <View className="flex-1 bg-white rounded-2xl p-5 border border-gray-100">
                      {/* Header */}
                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-900 mb-1">
                            Position #{item.position}
                          </Text>
                          <Text className="text-base text-gray-700">{item.memberName}</Text>
                        </View>
                        <View className="items-end">
                          <View className="flex-row items-center mb-2">
                            <Ionicons 
                              name={getStatusIcon(item.status) as any} 
                              size={16} 
                              className={getStatusTextColor(item.status)} 
                            />
                            <Text className={cn('text-sm font-medium ml-2 capitalize', getStatusTextColor(item.status))}>
                              {item.status}
                            </Text>
                          </View>
                          <Text className="text-lg font-bold text-gray-900">
                            {formatNaira(item.amount)}
                          </Text>
                        </View>
                      </View>

                      {/* Due Date */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View>
                          <Text className="text-sm text-gray-600">Due Date</Text>
                          <Text className="text-base font-semibold text-gray-900">
                            {formatWATDate(item.dueDate)}
                          </Text>
                        </View>
                        {item.status !== 'completed' && (
                          <View className="items-end">
                            <Text className="text-sm text-gray-600">
                              {daysUntil > 0 ? `In ${daysUntil} days` : 
                               daysUntil === 0 ? 'Today' : `${Math.abs(daysUntil)} days ago`}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Collection Date (if completed) */}
                      {item.collectionDate && (
                        <View className="flex-row items-center pt-3 border-t border-gray-100">
                          <Ionicons name="checkmark-circle" size={16} color="#059669" />
                          <Text className="text-sm text-emerald-700 ml-2">
                            Collected on {formatWATDate(item.collectionDate)}
                          </Text>
                        </View>
                      )}

                      {/* Action Buttons for Current */}
                      {item.status === 'current' && (
                        <View className="flex-row gap-3 mt-4">
                          <Pressable className="flex-1 bg-blue-50 border border-blue-200 py-3 rounded-xl flex-row items-center justify-center">
                            <Ionicons name="card" size={16} color="#3B82F6" />
                            <Text className="text-blue-700 font-medium ml-2">Make Payment</Text>
                          </Pressable>
                          <Pressable className="flex-1 bg-emerald-50 border border-emerald-200 py-3 rounded-xl flex-row items-center justify-center">
                            <Ionicons name="chatbubble" size={16} color="#059669" />
                            <Text className="text-emerald-700 font-medium ml-2">Message Group</Text>
                          </Pressable>
                        </View>
                      )}

                      {/* Overdue Warning */}
                      {item.status === 'current' && daysUntil < 0 && (
                        <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <View className="flex-row items-center">
                            <Ionicons name="warning" size={16} color="#DC2626" />
                            <Text className="text-sm text-red-800 ml-2 flex-1">
                              Payment is {Math.abs(daysUntil)} days overdue
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}