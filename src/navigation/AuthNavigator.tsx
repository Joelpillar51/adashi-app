import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { useAuthStore } from '../state/authStore';
import { useUserStore, mockUserProfile } from '../state/userStore';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const { signIn } = useAuthStore();
  const { setProfile } = useUserStore();
  const [currentScreen, setCurrentScreen] = useState<'SignIn' | 'SignUp' | 'ForgotPassword'>('SignIn');

  const handleSignIn = () => {
    // Mock user authentication
    const mockUser = {
      id: 'user_123',
      email: 'adunni.okafor@email.com',
      name: 'Adunni Okafor',
      phone: '+234 801 234 5678',
    };
    
    signIn(mockUser);
    setProfile(mockUserProfile);
  };

  const handleSignUp = () => {
    // Mock user registration
    const mockUser = {
      id: 'user_123',
      email: 'adunni.okafor@email.com', 
      name: 'Adunni Okafor',
      phone: '+234 801 234 5678',
    };
    
    signIn(mockUser);
    setProfile(mockUserProfile);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SignIn':
        return (
          <SignInScreen
            onSignIn={handleSignIn}
            onNavigateToSignUp={() => setCurrentScreen('SignUp')}
            onNavigateToForgotPassword={() => setCurrentScreen('ForgotPassword')}
          />
        );
      case 'SignUp':
        return (
          <SignUpScreen
            onSignUp={handleSignUp}
            onNavigateToSignIn={() => setCurrentScreen('SignIn')}
          />
        );
      case 'ForgotPassword':
        return (
          <ForgotPasswordScreen
            onGoBack={() => setCurrentScreen('SignIn')}
            onResetSent={() => setCurrentScreen('SignIn')}
          />
        );
      default:
        return null;
    }
  };

  return renderScreen();
}