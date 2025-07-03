import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { syncUserProfile, checkDatabaseSetup, manualProfileRefresh } from '../utils/profileSync';
import { cn } from '../utils/cn';

interface DebugScreenProps {
  navigation: any;
}

export default function ProfileDebugScreen({ navigation }: DebugScreenProps) {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);

  useEffect(() => {
    checkDatabase();
    loadDebugInfo();
  }, []);

  const checkDatabase = async () => {
    const status = await checkDatabaseSetup();
    setDatabaseStatus(status);
  };

  const loadDebugInfo = () => {
    setDebugInfo({
      isAuthenticated: isAuthenticated(),
      userId: user?.id,
      userEmail: user?.email,
      userMetadata: user?.user_metadata,
      profileExists: !!profile,
      profileData: profile,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSyncProfile = async () => {
    if (!user) {
      Alert.alert('Error', 'No authenticated user found');
      return;
    }

    setIsLoading(true);
    try {
      const result = await syncUserProfile(user.id, user.email!, user.user_metadata);
      
      Alert.alert(
        'Profile Sync Result',
        `Success: ${result.success}
Action: ${result.action || 'none'}
Error: ${result.error || 'none'}`,
        [{ text: 'OK', onPress: loadDebugInfo }]
      );

      // Refresh the auth store profile
      await refreshProfile();
      loadDebugInfo();

    } catch (error) {
      Alert.alert('Error', `Sync failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!user) {
      Alert.alert('Error', 'No authenticated user found');
      return;
    }

    setIsLoading(true);
    try {
      const result = await manualProfileRefresh(user.id);
      
      Alert.alert(
        'Manual Refresh Result',
        `Success: ${result.success}
Profile Found: ${!!result.profile}
Error: ${result.error || 'none'}`,
        [{ text: 'OK' }]
      );

      // Refresh the auth store profile
      await refreshProfile();
      loadDebugInfo();

    } catch (error) {
      Alert.alert('Error', `Refresh failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthRefresh = async () => {
    setIsLoading(true);
    try {
      const { error } = await refreshProfile();
      if (error) {
        Alert.alert('Error', `Auth refresh failed: ${error.message}`);
      } else {
        Alert.alert('Success', 'Profile refreshed from auth store');
      }
      loadDebugInfo();
    } catch (error) {
      Alert.alert('Error', `Auth refresh failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const InfoCard = ({ title, children, status }: { title: string; children: React.ReactNode; status?: 'success' | 'warning' | 'error' }) => (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      <View className="flex-row items-center mb-3">
        <Text className="font-semibold text-gray-900 flex-1">{title}</Text>
        {status && (
          <Ionicons 
            name={status === 'success' ? 'checkmark-circle' : status === 'warning' ? 'warning' : 'close-circle'} 
            size={20} 
            color={status === 'success' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'} 
          />
        )}
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Profile Debug</Text>
        </View>
      </View>

      <View className="px-6 py-6">
        {/* Database Status */}
        <InfoCard 
          title="Database Setup" 
          status={databaseStatus?.success ? 'success' : 'error'}
        >
          {databaseStatus ? (
            <View>
              <Text className="text-sm text-gray-600 mb-2">
                Status: {databaseStatus.success ? '✅ All functions available' : '❌ Missing components'}
              </Text>
              {databaseStatus.missing?.length > 0 && (
                <Text className="text-sm text-red-600">
                  Missing: {databaseStatus.missing.join(', ')}
                </Text>
              )}
            </View>
          ) : (
            <ActivityIndicator size="small" />
          )}
        </InfoCard>

        {/* Authentication Status */}
        <InfoCard 
          title="Authentication" 
          status={debugInfo?.isAuthenticated ? 'success' : 'error'}
        >
          {debugInfo ? (
            <View className="space-y-2">
              <Text className="text-sm text-gray-600">
                Authenticated: {debugInfo.isAuthenticated ? '✅ Yes' : '❌ No'}
              </Text>
              <Text className="text-sm text-gray-600">
                User ID: {debugInfo.userId || 'None'}
              </Text>
              <Text className="text-sm text-gray-600">
                Email: {debugInfo.userEmail || 'None'}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="small" />
          )}
        </InfoCard>

        {/* Profile Status */}
        <InfoCard 
          title="Profile Data" 
          status={debugInfo?.profileExists ? 'success' : 'warning'}
        >
          {debugInfo ? (
            <View className="space-y-2">
              <Text className="text-sm text-gray-600">
                Profile Exists: {debugInfo.profileExists ? '✅ Yes' : '❌ No'}
              </Text>
              {debugInfo.profileData && (
                <>
                  <Text className="text-sm text-gray-600">
                    Name: {debugInfo.profileData.full_name || 'Not set'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Phone: {debugInfo.profileData.phone || 'Not set'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Contributions: ₦{debugInfo.profileData.total_contributions ? (debugInfo.profileData.total_contributions / 100).toLocaleString() : '0'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Active Groups: {debugInfo.profileData.active_groups || 0}
                  </Text>
                </>
              )}
            </View>
          ) : (
            <ActivityIndicator size="small" />
          )}
        </InfoCard>

        {/* User Metadata */}
        {debugInfo?.userMetadata && (
          <InfoCard title="User Metadata">
            <Text className="text-sm text-gray-600 font-mono">
              {JSON.stringify(debugInfo.userMetadata, null, 2)}
            </Text>
          </InfoCard>
        )}

        {/* Action Buttons */}
        <View className="space-y-3">
          <Pressable
            onPress={handleSyncProfile}
            disabled={isLoading || !debugInfo?.isAuthenticated}
            className={cn(
              'bg-blue-500 py-4 rounded-xl flex-row items-center justify-center',
              (isLoading || !debugInfo?.isAuthenticated) && 'bg-gray-300'
            )}
          >
            {isLoading && <ActivityIndicator size="small" color="white" className="mr-2" />}
            <Text className="text-white font-semibold">Sync Profile</Text>
          </Pressable>

          <Pressable
            onPress={handleManualRefresh}
            disabled={isLoading || !debugInfo?.isAuthenticated}
            className={cn(
              'bg-green-500 py-4 rounded-xl flex-row items-center justify-center',
              (isLoading || !debugInfo?.isAuthenticated) && 'bg-gray-300'
            )}
          >
            {isLoading && <ActivityIndicator size="small" color="white" className="mr-2" />}
            <Text className="text-white font-semibold">Manual Refresh</Text>
          </Pressable>

          <Pressable
            onPress={handleAuthRefresh}
            disabled={isLoading || !debugInfo?.isAuthenticated}
            className={cn(
              'bg-purple-500 py-4 rounded-xl flex-row items-center justify-center',
              (isLoading || !debugInfo?.isAuthenticated) && 'bg-gray-300'
            )}
          >
            {isLoading && <ActivityIndicator size="small" color="white" className="mr-2" />}
            <Text className="text-white font-semibold">Auth Store Refresh</Text>
          </Pressable>

          <Pressable
            onPress={loadDebugInfo}
            disabled={isLoading}
            className="bg-gray-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-white font-semibold">Reload Debug Info</Text>
          </Pressable>
        </View>

        {/* Instructions */}
        <View className="mt-6 p-4 bg-blue-50 rounded-xl">
          <Text className="font-semibold text-blue-900 mb-2">Troubleshooting Steps:</Text>
          <Text className="text-sm text-blue-800 mb-1">1. Check if database setup is complete</Text>
          <Text className="text-sm text-blue-800 mb-1">2. Ensure you're authenticated</Text>
          <Text className="text-sm text-blue-800 mb-1">3. Try "Sync Profile" to create missing profile</Text>
          <Text className="text-sm text-blue-800 mb-1">4. Use "Manual Refresh" to fetch latest data</Text>
          <Text className="text-sm text-blue-800">5. Contact support if issues persist</Text>
        </View>

        <Text className="text-xs text-gray-400 text-center mt-4">
          Debug info updated: {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'Never'}
        </Text>
      </View>
    </ScrollView>
  );
}