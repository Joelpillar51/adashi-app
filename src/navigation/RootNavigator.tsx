import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../state/authStore';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const { 
    session,
    hasSeenOnboarding, 
    hasSeenSplash,
    isInitialized,
    initialize,
    markOnboardingComplete, 
    markSplashComplete,
    getInitialRoute,
    isAuthenticated
  } = useAuthStore();
  
  const [currentRoute, setCurrentRoute] = useState<'Splash' | 'Onboarding' | 'Auth' | 'Main'>('Splash');

  useEffect(() => {
    // Initialize Supabase auth
    initialize();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const route = getInitialRoute();
      setCurrentRoute(route);
    }
  }, [session, hasSeenOnboarding, hasSeenSplash, isInitialized, getInitialRoute]);

  const handleSplashComplete = () => {
    markSplashComplete();
    if (hasSeenOnboarding) {
      setCurrentRoute(isAuthenticated() ? 'Main' : 'Auth');
    } else {
      setCurrentRoute('Onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    setCurrentRoute(isAuthenticated() ? 'Main' : 'Auth');
  };

  if (!isInitialized) {
    // Return a minimal view while initializing
    return <View className="flex-1 bg-blue-500" />;
  }

  switch (currentRoute) {
    case 'Splash':
      return <SplashScreen onFinish={handleSplashComplete} />;
    
    case 'Onboarding':
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    
    case 'Auth':
      return <AuthNavigator />;
    
    case 'Main':
      return <AppNavigator />;
    
    default:
      return <SplashScreen onFinish={handleSplashComplete} />;
  }
}