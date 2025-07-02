import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatNaira } from '../utils/currency';
import { cn } from '../utils/cn';

interface ManualPositionAssignmentScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function ManualPositionAssignmentScreen({ route, navigation }: ManualPositionAssignmentScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups, updateGroup } = useGroupStore();
  
  const group = groups.find(g => g.id === groupId);
  const [memberPositions, setMemberPositions] = useState<Record<string, number>>({});
  const [draggedMember, setDraggedMember] = useState<string | null>(null);

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  // Initialize positions from existing data or empty
  React.useEffect(() => {
    const positions: Record<string, number> = {};
    group.members.forEach(member => {
      positions[member.id] = member.rotationPosition || 0;
    });
    setMemberPositions(positions);
  }, [group.members]);

  const availablePositions = Array.from({ length: group.memberCount }, (_, i) => i + 1);
  const usedPositions = Object.values(memberPositions).filter(pos => pos > 0);
  const unassignedMembers = group.members.filter(member => !memberPositions[member.id] || memberPositions[member.id] === 0);

  const assignPosition = (memberId: string, position: number) => {
    // Check if position is already taken
    const currentHolder = Object.entries(memberPositions).find(([id, pos]) => pos === position && id !== memberId);
    
    if (currentHolder) {
      // Swap positions
      setMemberPositions(prev => ({
        ...prev,
        [memberId]: position,
        [currentHolder[0]]: prev[memberId] || 0
      }));
    } else {
      // Assign new position
      setMemberPositions(prev => ({
        ...prev,
        [memberId]: position
      }));
    }
  };

  const removePosition = (memberId: string) => {
    setMemberPositions(prev => ({
      ...prev,
      [memberId]: 0
    }));
  };

  const autoAssignRemaining = () => {
    const newPositions = { ...memberPositions };
    const availableSlots = availablePositions.filter(pos => !usedPositions.includes(pos));
    
    unassignedMembers.forEach((member, index) => {
      if (availableSlots[index]) {
        newPositions[member.id] = availableSlots[index];
      }
    });
    
    setMemberPositions(newPositions);
  };

  const validateAndSave = () => {
    const allAssigned = group.members.every(member => memberPositions[member.id] > 0);
    const allPositionsUnique = new Set(Object.values(memberPositions)).size === group.memberCount;
    
    if (!allAssigned) {
      Alert.alert('Incomplete Assignment', 'Please assign positions to all members before saving.');
      return;
    }
    
    if (!allPositionsUnique) {
      Alert.alert('Duplicate Positions', 'Each member must have a unique position.');
      return;
    }

    // Update group with new positions
    const updatedMembers = group.members.map(member => ({
      ...member,
      rotationPosition: memberPositions[member.id]
    }));

    updateGroup(groupId, { members: updatedMembers });
    
    Alert.alert(
      'Positions Saved!',
      'Member positions have been successfully assigned.',
      [{ text: 'OK', onPress: () => navigation?.goBack() }]
    );
  };

  const getMemberAtPosition = (position: number) => {
    const memberId = Object.entries(memberPositions).find(([id, pos]) => pos === position)?.[0];
    return memberId ? group.members.find(m => m.id === memberId) : null;
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable 
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
          >
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Manual Assignment</Text>
          <Pressable onPress={validateAndSave}>
            <Text className="text-blue-600 font-semibold">Save</Text>
          </Pressable>
        </View>
        
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-gray-600">{group.name}</Text>
          <Text className="text-sm text-gray-600">
            {usedPositions.length}/{group.memberCount} assigned
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {/* Quick Actions */}
        {unassignedMembers.length > 0 && (
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-800 mb-1">
                  {unassignedMembers.length} members unassigned
                </Text>
                <Text className="text-xs text-blue-600">
                  Auto-assign remaining members to available positions
                </Text>
              </View>
              <Pressable
                onPress={autoAssignRemaining}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium text-sm">Auto-assign</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Position Timeline */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Collection Timeline</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-4">
              {availablePositions.map((position) => {
                const member = getMemberAtPosition(position);
                return (
                  <View key={position} className="items-center" style={{ width: 80 }}>
                    <View className={cn(
                      'w-16 h-16 rounded-2xl items-center justify-center mb-2',
                      member ? 'bg-blue-500' : 'bg-gray-100 border-2 border-dashed border-gray-300'
                    )}>
                      {member ? (
                        <Text className="text-white font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      ) : (
                        <Text className="text-gray-400 font-bold">#{position}</Text>
                      )}
                    </View>
                    <Text className="text-xs text-gray-600 text-center">
                      Position {position}
                    </Text>
                    {member && (
                      <Text className="text-xs text-gray-900 font-medium text-center mt-1">
                        {member.name.split(' ')[0]}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Unassigned Members */}
        {unassignedMembers.length > 0 && (
          <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Unassigned Members</Text>
            <View className="gap-3">
              {unassignedMembers.map((member) => (
                <View key={member.id} className="flex-row items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-sm font-bold text-amber-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-medium text-gray-900">{member.name}</Text>
                      <Text className="text-sm text-gray-600 capitalize">{member.role}</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    {availablePositions.filter(pos => !usedPositions.includes(pos)).slice(0, 3).map(position => (
                      <Pressable
                        key={position}
                        onPress={() => assignPosition(member.id, position)}
                        className="w-8 h-8 bg-blue-500 rounded-lg items-center justify-center"
                      >
                        <Text className="text-white font-bold text-sm">#{position}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Assigned Members */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Assigned Positions</Text>
          <View className="gap-3">
            {group.members
              .filter(member => memberPositions[member.id] > 0)
              .sort((a, b) => memberPositions[a.id] - memberPositions[b.id])
              .map((member) => {
                const position = memberPositions[member.id];
                return (
                  <View key={member.id} className="flex-row items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-emerald-500 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-bold text-sm">#{position}</Text>
                      </View>
                      <View>
                        <Text className="text-base font-medium text-gray-900">{member.name}</Text>
                        <Text className="text-sm text-emerald-600">
                          {position === 1 ? 'First' : position === 2 ? 'Second' : 
                           position === 3 ? 'Third' : `${position}th`} to collect
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      {/* Change Position Options */}
                      {availablePositions.filter(pos => pos !== position && !usedPositions.includes(pos)).slice(0, 2).map(newPos => (
                        <Pressable
                          key={newPos}
                          onPress={() => assignPosition(member.id, newPos)}
                          className="w-8 h-8 bg-blue-100 border border-blue-300 rounded-lg items-center justify-center"
                        >
                          <Text className="text-blue-600 font-bold text-sm">#{newPos}</Text>
                        </Pressable>
                      ))}
                      {/* Remove Position */}
                      <Pressable
                        onPress={() => removePosition(member.id)}
                        className="w-8 h-8 bg-red-100 border border-red-300 rounded-lg items-center justify-center"
                      >
                        <Ionicons name="close" size={16} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>

        {/* Collection Order Preview */}
        {usedPositions.length === group.memberCount && (
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
            <Text className="text-lg font-semibold text-blue-900 mb-4">Collection Order Preview</Text>
            <View className="gap-2">
              {availablePositions.map(position => {
                const member = getMemberAtPosition(position);
                if (!member) return null;
                
                return (
                  <View key={position} className="flex-row items-center justify-between">
                    <Text className="text-blue-800 font-medium">
                      {position === 1 ? '1st' : position === 2 ? '2nd' : 
                       position === 3 ? '3rd' : `${position}th`} Month
                    </Text>
                    <Text className="text-blue-900 font-semibold">
                      {member.name} collects {formatNaira(group.monthlyAmount * group.memberCount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}