import React, { useState } from 'react';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'SignIn' | 'SignUp' | 'ForgotPassword'>('SignIn');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SignIn':
        return (
          <SignInScreen
            onNavigateToSignUp={() => setCurrentScreen('SignUp')}
            onNavigateToForgotPassword={() => setCurrentScreen('ForgotPassword')}
          />
        );
      case 'SignUp':
        return (
          <SignUpScreen
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