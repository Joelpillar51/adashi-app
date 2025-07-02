import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(50);

  useEffect(() => {
    // Start animations
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    translateY.value = withSequence(
      withTiming(0, { duration: 600 }),
      withTiming(-10, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    // Auto-advance after 2.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value + 20 },
    ],
  }));

  return (
    <View 
      className="flex-1 bg-blue-500 items-center justify-center"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Animated.View style={logoStyle} className="items-center mb-8">
        {/* Logo Icon */}
        <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6 shadow-lg">
          <Ionicons name="people" size={48} color="#3B82F6" />
        </View>
        
        {/* App Name */}
        <Text className="text-4xl font-bold text-white mb-2">Adashi</Text>
        <Text className="text-lg text-blue-100 text-center leading-6">
          Your Digital Savings Circle
        </Text>
      </Animated.View>

      <Animated.View style={textStyle} className="absolute bottom-20 items-center px-8">
        <Text className="text-sm text-blue-100 text-center leading-5">
          Trusted by Nigerian communities for rotating savings and credit
        </Text>
      </Animated.View>

      {/* Loading indicator */}
      <View className="absolute bottom-8">
        <View className="w-8 h-1 bg-white/30 rounded-full">
          <Animated.View 
            style={logoStyle}
            className="h-1 bg-white rounded-full w-full" 
          />
        </View>
      </View>
    </View>
  );
}