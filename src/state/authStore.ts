import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../config/supabase';

interface AuthState {
  // Session state
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // App navigation state
  hasSeenSplash: boolean;
  hasSeenOnboarding: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: AuthError | null; needsVerification?: boolean; errorCode?: string }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  resendOTP: (email: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<{ error: Error | null }>;
  
  // Navigation actions
  markSplashComplete: () => void;
  markOnboardingComplete: () => void;
  
  // Getters
  isAuthenticated: () => boolean;
  getDisplayName: () => string;
  getInitials: () => string;
  getInitialRoute: () => 'Splash' | 'Onboarding' | 'Auth' | 'Main';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
      hasSeenSplash: false,
      hasSeenOnboarding: false,

      // Initialize authentication state
      initialize: async () => {
        try {
          set({ isLoading: true });
          
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('Initializing with user:', session.user.email);
            
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile during initialization:', profileError);
              
              // If profile doesn't exist, create it
              if (profileError.code === 'PGRST116') {
                console.log('Profile not found during init, creating...');
                const { full_name, phone } = session.user.user_metadata || {};
                
                const { error: createError } = await supabase.rpc('upsert_profile', {
                  user_id: session.user.id,
                  user_email: session.user.email!,
                  user_full_name: full_name || null,
                  user_phone: phone || null,
                });
                
                if (!createError) {
                  // Fetch the newly created profile
                  const { data: newProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                  
                  console.log('Profile created during init:', newProfile);
                  
                  set({ 
                    session, 
                    user: session.user, 
                    profile: newProfile || null,
                    isInitialized: true 
                  });
                  return;
                }
              }
            } else {
              console.log('Profile found during initialization:', profile);
            }
            
            set({ 
              session, 
              user: session.user, 
              profile: profile || null,
              isInitialized: true 
            });
          } else {
            set({ 
              session: null, 
              user: null, 
              profile: null,
              isInitialized: true 
            });
          }

          // Set up auth state change listener
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (session?.user) {
              // Fetch updated profile with error handling
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profileError) {
                console.error('Error fetching profile on auth change:', profileError);
                
                // If profile doesn't exist, try to create it from user metadata
                if (profileError.code === 'PGRST116') { // No rows returned
                  console.log('Profile not found, attempting to create from user metadata');
                  const { full_name, phone } = session.user.user_metadata || {};
                  
                  const { error: createError } = await supabase.rpc('upsert_profile', {
                    user_id: session.user.id,
                    user_email: session.user.email!,
                    user_full_name: full_name || null,
                    user_phone: phone || null,
                  });
                  
                  if (createError) {
                    console.error('Failed to create profile from metadata:', createError);
                  } else {
                    // Fetch the newly created profile
                    const { data: newProfile } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', session.user.id)
                      .single();
                    
                    set({ 
                      session, 
                      user: session.user, 
                      profile: newProfile || null 
                    });
                    return;
                  }
                }
              }
              
              console.log('Profile fetched:', profile);
              set({ 
                session, 
                user: session.user, 
                profile: profile || null 
              });
            } else {
              set({ 
                session: null, 
                user: null, 
                profile: null 
              });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isInitialized: true });
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign up with email and password
      signUp: async (email: string, password: string, fullName: string, phone?: string) => {
        try {
          set({ isLoading: true });
          
          // First check if email already exists in profiles table
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email.toLowerCase())
            .single();
          
          if (existingProfile) {
            const customError: AuthError = {
              name: 'AuthError',
              message: 'An account with this email already exists. Please sign in instead.',
              status: 400,
            };
            return { error: customError, errorCode: 'email_already_exists' };
          }
          
          const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
              data: {
                full_name: fullName,
                phone: phone || null,
              }
            }
          });

          if (error) {
            // Map common Supabase errors to user-friendly messages
            const mappedError = mapAuthError(error);
            return { error: mappedError, errorCode: error.message };
          }

          // Check if user needs email verification
          if (data.user && !data.session) {
            return { error: null, needsVerification: true };
          }

          // If user is immediately signed in (shouldn't happen with email confirmation enabled)
          if (data.user && data.session) {
            // Create profile record using upsert function
            const { error: profileError } = await supabase.rpc('upsert_profile', {
              user_id: data.user.id,
              user_email: data.user.email!,
              user_full_name: fullName,
              user_phone: phone || null,
            });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Don't fail signup for profile creation errors, just log them
            }
          }

          return { error: null, needsVerification: !data.session };
        } catch (error) {
          console.error('Sign up error:', error);
          const mappedError = mapAuthError(error as AuthError);
          return { error: mappedError };
        } finally {
          set({ isLoading: false });
        }
      },

      // Verify OTP for email confirmation
      verifyOTP: async (email: string, token: string) => {
        try {
          set({ isLoading: true });

          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup'
          });

          if (error) {
            return { error };
          }

          // Create profile record after successful verification using upsert function
          if (data.user) {
            const { full_name, phone } = data.user.user_metadata;
            
            console.log('Creating profile for user:', {
              user_id: data.user.id,
              email: data.user.email,
              full_name,
              phone
            });
            
            const { error: profileError } = await supabase.rpc('upsert_profile', {
              user_id: data.user.id,
              user_email: data.user.email!,
              user_full_name: full_name || null,
              user_phone: phone || null,
            });

            if (profileError) {
              console.error('Profile creation error:', profileError);
              // Still return success but log the error for debugging
            } else {
              console.log('Profile created successfully');
              
              // Fetch the created profile to update state
              const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
              
              if (fetchError) {
                console.error('Error fetching created profile:', fetchError);
              } else {
                console.log('Profile fetched successfully:', profile);
                set({ profile });
              }
            }
          }

          return { error: null };
        } catch (error) {
          console.error('OTP verification error:', error);
          return { error: error as AuthError };
        } finally {
          set({ isLoading: false });
        }
      },

      // Resend OTP
      resendOTP: async (email: string) => {
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
          });

          return { error };
        } catch (error) {
          console.error('Resend OTP error:', error);
          return { error: error as AuthError };
        }
      },

      // Sign in with email and password
      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          return { error };
        } catch (error) {
          console.error('Sign in error:', error);
          return { error: error as AuthError };
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign in with Google
      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: 'com.adashi.app://auth',
            }
          });

          return { error };
        } catch (error) {
          console.error('Google sign in error:', error);
          return { error: error as AuthError };
        } finally {
          set({ isLoading: false });
        }
      },

      // Sign out
      signOut: async () => {
        try {
          set({ isLoading: true });
          await supabase.auth.signOut();
          set({ 
            session: null, 
            user: null, 
            profile: null
          });
        } catch (error) {
          console.error('Sign out error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Reset password
      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'com.adashi.app://reset-password',
          });
          return { error };
        } catch (error) {
          console.error('Reset password error:', error);
          return { error: error as AuthError };
        }
      },

      // Update password
      updatePassword: async (password: string) => {
        try {
          const { error } = await supabase.auth.updateUser({ password });
          return { error };
        } catch (error) {
          console.error('Update password error:', error);
          return { error: error as AuthError };
        }
      },

      // Update profile
      updateProfile: async (updates: Partial<Profile>) => {
        try {
          const { user } = get();
          if (!user) {
            return { error: new Error('No authenticated user') };
          }

          const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id);

          if (!error) {
            // Update local profile state
            const { profile } = get();
            if (profile) {
              set({ profile: { ...profile, ...updates } });
            }
          }

          return { error };
        } catch (error) {
          console.error('Update profile error:', error);
          return { error: error as Error };
        }
      },

      // Refresh session
      refreshSession: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('Session refresh error:', error);
          }
        } catch (error) {
          console.error('Session refresh error:', error);
        }
      },

      // Refresh profile data
      refreshProfile: async () => {
        try {
          const { user } = get();
          if (!user) {
            return { error: new Error('No authenticated user') };
          }

          console.log('Refreshing profile for user:', user.id);
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Profile refresh error:', error);
            
            // If profile doesn't exist, try to create it
            if (error.code === 'PGRST116') {
              console.log('Profile not found, creating new profile');
              const { full_name, phone } = user.user_metadata || {};
              
              const { error: createError } = await supabase.rpc('upsert_profile', {
                user_id: user.id,
                user_email: user.email!,
                user_full_name: full_name || null,
                user_phone: phone || null,
              });
              
              if (createError) {
                console.error('Failed to create profile during refresh:', createError);
                return { error: createError };
              }
              
              // Fetch the newly created profile
              const { data: newProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              
              if (fetchError) {
                return { error: fetchError };
              }
              
              set({ profile: newProfile });
              console.log('New profile created and set:', newProfile);
              return { error: null };
            }
            
            return { error };
          }

          set({ profile });
          console.log('Profile refreshed successfully:', profile);
          return { error: null };
        } catch (error) {
          console.error('Profile refresh error:', error);
          return { error: error as Error };
        }
      },

      // Navigation actions
      markSplashComplete: () => set({ hasSeenSplash: true }),
      markOnboardingComplete: () => set({ hasSeenOnboarding: true }),

      // Getters
      isAuthenticated: () => {
        const { session } = get();
        return !!session;
      },

      getDisplayName: () => {
        const { profile, user } = get();
        return profile?.full_name || user?.email?.split('@')[0] || 'User';
      },

      getInitials: () => {
        const { profile, user } = get();
        const name = profile?.full_name || user?.email || 'User';
        return name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },

      getInitialRoute: () => {
        const { hasSeenOnboarding, hasSeenSplash, isInitialized, session } = get();
        
        if (!isInitialized) return 'Splash'; // Show loading while initializing
        if (!hasSeenSplash) return 'Splash';
        if (!hasSeenOnboarding) return 'Onboarding';
        if (!session) return 'Auth';
        return 'Main';
      },
    }),
    {
      name: 'adashi-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenSplash: state.hasSeenSplash,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);

// Helper function to map Supabase auth errors to user-friendly messages
function mapAuthError(error: AuthError): AuthError {
  const userFriendlyMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
    'Email not confirmed': 'Please verify your email address before signing in.',
    'User already registered': 'An account with this email already exists. Please sign in instead.',
    'Signup disabled': 'New account registration is currently disabled. Please contact support.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Invalid email': 'Please enter a valid email address.',
    'Weak password': 'Password is too weak. Please use a stronger password with letters, numbers, and special characters.',
    'Email rate limit exceeded': 'Too many emails sent. Please wait a few minutes before trying again.',
    'SMS rate limit exceeded': 'Too many SMS messages sent. Please wait a few minutes before trying again.',
    'Invalid phone number': 'Please enter a valid phone number.',
    'Phone number already registered': 'An account with this phone number already exists.',
    'Email already registered': 'An account with this email already exists. Please sign in instead.',
    'Token has expired or is invalid': 'Verification code has expired or is invalid. Please request a new one.',
    'Invalid verification code': 'Invalid verification code. Please check and try again.',
    'Network request failed': 'Network connection failed. Please check your internet connection and try again.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  };

  const message = userFriendlyMessages[error.message] || error.message || 'An unexpected error occurred. Please try again.';
  
  return {
    ...error,
    message,
  };
}