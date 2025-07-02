import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import RotationTimelineScreen from '../screens/RotationTimelineScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import InviteMembersScreen from '../screens/InviteMembersScreen';
import RequestInviteScreen from '../screens/RequestInviteScreen';
import InviteRequestsScreen from '../screens/InviteRequestsScreen';
import PositionAssignmentScreen from '../screens/PositionAssignmentScreen';
import ManualPositionAssignmentScreen from '../screens/ManualPositionAssignmentScreen';
import NotificationScreen from '../screens/NotificationScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

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
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <Stack.Screen name="InviteMembers" component={InviteMembersScreen} />
      <Stack.Screen name="RequestInvite" component={RequestInviteScreen} />
      <Stack.Screen name="InviteRequests" component={InviteRequestsScreen} />
      <Stack.Screen name="PositionAssignment" component={PositionAssignmentScreen} />
      <Stack.Screen name="ManualPositionAssignment" component={ManualPositionAssignmentScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </Stack.Navigator>
  );
}