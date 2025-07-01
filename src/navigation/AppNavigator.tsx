import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import RotationTimelineScreen from '../screens/RotationTimelineScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="RotationTimeline" component={RotationTimelineScreen} />
    </Stack.Navigator>
  );
}