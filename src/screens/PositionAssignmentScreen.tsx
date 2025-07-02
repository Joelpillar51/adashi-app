import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useGroupStore } from '../state/groupStore';
import { formatNaira } from '../utils/currency';
import { cn } from '../utils/cn';

interface PositionAssignmentScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function PositionAssignmentScreen({ route, navigation }: PositionAssignmentScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups, updateGroup } = useGroupStore();
  
  const group = groups.find(g => g.id === groupId);
  const [assignmentMethod, setAssignmentMethod] = useState<'admin' | 'raffle' | null>(null);
  const [showRaffleModal, setShowRaffleModal] = useState(false);
  const [isRaffling, setIsRaffling] = useState(false);
  const [raffleResults, setRaffleResults] = useState<Array<{member: any, position: number}>>([]);
  
  // Animation values for raffle
  const raffleScale = useSharedValue(1);
  const raffleRotation = useSharedValue(0);

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  const isOwnerOrAdmin = group.role === 'owner' || group.role === 'admin';
  const hasAssignedPositions = group.members.some(member => member.rotationPosition > 0);

  const handleAdminAssignment = () => {
    setAssignmentMethod('admin');
    navigation?.navigate('ManualPositionAssignment', { groupId });
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startRaffle = () => {
    setShowRaffleModal(true);
    setIsRaffling(true);
    
    // Start animation
    raffleScale.value = withSequence(
      withSpring(1.2, { duration: 500 }),
      withSpring(0.8, { duration: 300 }),
      withSpring(1, { duration: 200 })
    );
    
    raffleRotation.value = withSequence(
      withSpring(360, { duration: 1000 }),
      withSpring(720, { duration: 1000 }),
      withSpring(1080, { duration: 1000 }, () => {
        runOnJS(completeRaffle)();
      })
    );
  };

  const completeRaffle = () => {
    // Shuffle members and assign positions
    const shuffledMembers = shuffleArray(group.members);
    const results = shuffledMembers.map((member, index) => ({
      member,
      position: index + 1
    }));
    
    setRaffleResults(results);
    setIsRaffling(false);
  };

  const confirmRaffleResults = () => {
    const updatedMembers = group.members.map(member => {
      const result = raffleResults.find(r => r.member.id === member.id);
      return {
        ...member,
        rotationPosition: result?.position || 0
      };
    });

    updateGroup(groupId, { members: updatedMembers });
    
    Alert.alert(
      'Positions Assigned!',
      'The raffle has assigned positions to all group members.',
      [{ text: 'OK', onPress: () => navigation?.goBack() }]
    );
  };

  const raffleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: raffleScale.value },
      { rotate: `${raffleRotation.value}deg` }
    ],
  }));

  const RaffleModal = () => (
    <Modal
      visible={showRaffleModal}
      transparent
      animationType="fade"
      onRequestClose={() => !isRaffling && setShowRaffleModal(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center">
          {isRaffling ? (
            <>
              <Animated.View style={raffleAnimatedStyle} className="mb-8">
                <View className="w-24 h-24 bg-blue-500 rounded-full items-center justify-center">
                  <Ionicons name="shuffle" size={48} color="white" />
                </View>
              </Animated.View>
              <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Drawing Positions...
              </Text>
              <Text className="text-base text-gray-600 text-center">
                Please wait while we randomly assign collection positions
              </Text>
            </>
          ) : (
            <>
              <View className="w-24 h-24 bg-emerald-500 rounded-full items-center justify-center mb-8">
                <Ionicons name="checkmark" size={48} color="white" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Raffle Complete!
              </Text>
              <Text className="text-base text-gray-600 text-center mb-6">
                Here are the randomly assigned positions:
              </Text>
              
              <ScrollView className="max-h-64 w-full mb-6">
                {raffleResults.map((result, index) => (
                  <View key={result.member.id} className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-xl mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-bold text-sm">#{result.position}</Text>
                      </View>
                      <Text className="text-base font-medium text-gray-900">{result.member.name}</Text>
                    </View>
                    <Text className="text-sm text-gray-600">
                      {result.position === 1 ? 'First' : result.position === 2 ? 'Second' : 
                       result.position === 3 ? 'Third' : `${result.position}th`} to collect
                    </Text>
                  </View>
                ))}
              </ScrollView>
              
              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => setShowRaffleModal(false)}
                  className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                >
                  <Text className="text-gray-700 font-semibold">Redo Raffle</Text>
                </Pressable>
                <Pressable
                  onPress={confirmRaffleResults}
                  className="flex-1 bg-blue-500 py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Assign Positions</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Group Info */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">{group.name}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600">{group.memberCount} members</Text>
            <Text className="text-gray-600">{formatNaira(group.monthlyAmount)}/month</Text>
          </View>
        </View>

        {hasAssignedPositions ? (
          /* Current Positions */
          <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Current Positions</Text>
            <View className="gap-3">
              {group.members
                .sort((a, b) => a.rotationPosition - b.rotationPosition)
                .map((member) => (
                  <View key={member.id} className="flex-row items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-bold text-sm">#{member.rotationPosition}</Text>
                      </View>
                      <Text className="text-base font-medium text-gray-900">{member.name}</Text>
                    </View>
                    <Text className="text-sm text-gray-600">
                      {member.rotationPosition === 1 ? 'First' : 
                       member.rotationPosition === 2 ? 'Second' : 
                       member.rotationPosition === 3 ? 'Third' : `${member.rotationPosition}th`} to collect
                    </Text>
                  </View>
                ))}
            </View>
            
            {isOwnerOrAdmin && (
              <View className="mt-6 pt-6 border-t border-gray-100">
                <Text className="text-sm text-gray-600 mb-4">Want to reassign positions?</Text>
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handleAdminAssignment}
                    className="flex-1 bg-blue-50 border border-blue-200 py-3 rounded-xl items-center"
                  >
                    <Text className="text-blue-700 font-medium">Manual Assignment</Text>
                  </Pressable>
                  <Pressable
                    onPress={startRaffle}
                    className="flex-1 bg-purple-50 border border-purple-200 py-3 rounded-xl items-center"
                  >
                    <Text className="text-purple-700 font-medium">New Raffle</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Assignment Options */
          <>
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="text-sm text-blue-800 ml-3 flex-1 leading-5">
                  Collection positions determine the order in which members receive the pooled funds each month.
                </Text>
              </View>
            </View>

            {isOwnerOrAdmin ? (
              <>
                {/* Admin Assignment Option */}
                <Pressable
                  onPress={handleAdminAssignment}
                  className="bg-white rounded-2xl p-6 border border-gray-100 mb-4"
                >
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-blue-500 rounded-2xl items-center justify-center mr-4">
                      <Ionicons name="person" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">Manual Assignment</Text>
                      <Text className="text-sm text-gray-600">You choose each member's position</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                  <View className="bg-gray-50 rounded-xl p-4">
                    <Text className="text-sm text-gray-700 leading-5">
                      ✓ Full control over assignment{'\n'}
                      ✓ Consider member preferences{'\n'}
                      ✓ Strategic positioning
                    </Text>
                  </View>
                </Pressable>

                {/* Raffle Option */}
                <Pressable
                  onPress={startRaffle}
                  className="bg-white rounded-2xl p-6 border border-gray-100 mb-6"
                >
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-purple-500 rounded-2xl items-center justify-center mr-4">
                      <Ionicons name="shuffle" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900 mb-1">Raffle Draw</Text>
                      <Text className="text-sm text-gray-600">Random fair assignment</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                  <View className="bg-gray-50 rounded-xl p-4">
                    <Text className="text-sm text-gray-700 leading-5">
                      ✓ Completely fair and random{'\n'}
                      ✓ No bias or favoritism{'\n'}
                      ✓ Transparent process
                    </Text>
                  </View>
                </Pressable>
              </>
            ) : (
              /* Member View */
              <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
                <View className="items-center">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="hourglass-outline" size={32} color="#6B7280" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Waiting for Assignment</Text>
                  <Text className="text-base text-gray-600 text-center leading-5">
                    The group admin will assign collection positions soon. You'll be notified once positions are set.
                  </Text>
                </View>
              </View>
            )}

            {/* Members List */}
            <View className="bg-white rounded-2xl p-6 border border-gray-100">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Group Members</Text>
              <View className="gap-3">
                {group.members.map((member, index) => (
                  <View key={member.id} className="flex-row items-center py-3 px-4 bg-gray-50 rounded-xl">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-sm font-bold text-blue-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-900">{member.name}</Text>
                      <Text className="text-sm text-gray-600 capitalize">{member.role}</Text>
                    </View>
                    {member.rotationPosition > 0 && (
                      <View className="bg-blue-500 w-6 h-6 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">#{member.rotationPosition}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <RaffleModal />
    </View>
  );
}