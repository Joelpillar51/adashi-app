import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface GroupActionOverlayProps {
  visible: boolean;
  onClose: () => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

export default function GroupActionOverlay({ 
  visible, 
  onClose, 
  onCreateGroup, 
  onJoinGroup 
}: GroupActionOverlayProps) {
  const insets = useSafeAreaInsets();
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

  const actions = [
    {
      title: 'Create Group',
      subtitle: 'Start a new savings circle',
      icon: 'add-circle' as const,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: '#3B82F6',
      onPress: () => {
        onClose();
        onCreateGroup();
      },
    },
    {
      title: 'Join Group',
      subtitle: 'Use an invite code to join',
      icon: 'enter' as const,
      color: 'bg-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: '#10B981',
      onPress: () => {
        onClose();
        onJoinGroup();
      },
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
          className="bg-white rounded-t-3xl p-6"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-gray-900">What would you like to do?</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Action Cards */}
          <View className="gap-4 mb-4">
            {actions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex-row items-center active:bg-gray-50"
              >
                <View className={`w-14 h-14 ${action.iconBg} rounded-2xl items-center justify-center mr-4`}>
                  <Ionicons name={action.icon} size={24} color={action.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-1">{action.title}</Text>
                  <Text className="text-sm text-gray-600">{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>

          {/* Info Text */}
          <Text className="text-sm text-gray-500 text-center">
            Create your own savings circle or join an existing one with an invite code
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}