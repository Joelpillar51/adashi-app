import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingData = [
  {
    id: 1,
    icon: 'people-circle' as const,
    title: 'Join Savings Circles',
    subtitle: 'Connect with trusted friends, family, and colleagues to save money together in traditional rotating savings groups (ROSCA/Tontine).',
    backgroundColor: 'bg-blue-500',
    iconColor: '#3B82F6',
  },
  {
    id: 2,
    icon: 'calendar' as const,
    title: 'Automated Rotation',
    subtitle: 'Track contributions and collections automatically. Know exactly when it\'s your turn to collect and when payments are due.',
    backgroundColor: 'bg-emerald-500',
    iconColor: '#10B981',
  },
  {
    id: 3,
    icon: 'shield-checkmark' as const,
    title: 'Transparent & Secure',
    subtitle: 'Build trust with complete transparency. See all transactions, member activities, and group progress in real-time.',
    backgroundColor: 'bg-purple-500',
    iconColor: '#8B5CF6',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const page = Math.round(x / width);
    setCurrentPage(page);
  };

  return (
    <View 
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-lg font-bold text-blue-600">Adashi</Text>
        <Pressable onPress={handleSkip}>
          <Text className="text-base text-gray-600">Skip</Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} className="items-center justify-center px-8" style={{ width }}>
            {/* Icon */}
            <View className="w-32 h-32 bg-gray-50 rounded-full items-center justify-center mb-8">
              <Ionicons name={item.icon} size={64} color={item.iconColor} />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
              {item.title}
            </Text>

            {/* Subtitle */}
            <Text className="text-lg text-gray-600 text-center leading-7 px-4">
              {item.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-6 pb-6">
        {/* Page Indicators */}
        <View className="flex-row items-center justify-center mb-8">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={cn(
                'w-2 h-2 rounded-full mx-1',
                index === currentPage ? 'bg-blue-500' : 'bg-gray-200'
              )}
            />
          ))}
        </View>

        {/* Buttons */}
        <View className="gap-4">
          <Pressable
            onPress={handleNext}
            className="bg-blue-500 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-base">
              {currentPage === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>

          {currentPage > 0 && (
            <Pressable
              onPress={() => {
                const prevPage = currentPage - 1;
                setCurrentPage(prevPage);
                scrollViewRef.current?.scrollTo({
                  x: prevPage * width,
                  animated: true,
                });
              }}
              className="bg-gray-100 py-4 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Previous</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}