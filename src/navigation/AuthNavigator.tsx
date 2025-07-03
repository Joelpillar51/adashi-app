import React, { useState } from 'react';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'SignIn' | 'SignUp' | 'ForgotPassword' | 'OTPVerification'>('SignIn');
  const [verificationEmail, setVerificationEmail] = useState('');

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
            onNavigateToOTPVerification={(email: string) => {
              setVerificationEmail(email);
              setCurrentScreen('OTPVerification');
            }}
          />
        );
      case 'ForgotPassword':
        return (
          <ForgotPasswordScreen
            onGoBack={() => setCurrentScreen('SignIn')}
            onResetSent={() => setCurrentScreen('SignIn')}
          />
        );
      case 'OTPVerification':
        return (
          <OTPVerificationScreen
            email={verificationEmail}
            onVerificationComplete={() => setCurrentScreen('SignIn')}
            onGoBack={() => setCurrentScreen('SignUp')}
          />
        );
      default:
        return null;
    }
  };

  return renderScreen();
}