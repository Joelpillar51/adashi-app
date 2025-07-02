import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGroupStore } from '../state/groupStore';
import { formatChatTime } from '../utils/date';
import { cn } from '../utils/cn';

interface GroupChatScreenProps {
  route?: {
    params?: {
      groupId?: string;
    };
  };
  navigation?: any;
}

export default function GroupChatScreen({ route, navigation }: GroupChatScreenProps) {
  const insets = useSafeAreaInsets();
  const groupId = route?.params?.groupId || 'group1';
  const { groups, getGroupMessages, addMessage } = useGroupStore();
  const [newMessage, setNewMessage] = useState('');

  const group = groups.find(g => g.id === groupId);
  const messages = getGroupMessages(groupId);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: `msg_${Date.now()}`,
        sender: 'Me',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isMe: true,
        groupId,
      };
      addMessage(message);
      setNewMessage('');
    }
  };

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-lg font-semibold text-gray-900">Group not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100 flex-row items-center">
        <Pressable 
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{group.name}</Text>
          <Text className="text-sm text-gray-600">{group.memberCount} members</Text>
        </View>
        <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name="information-circle-outline" size={20} color="#374151" />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubble-outline" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No messages yet</Text>
            <Text className="text-base text-gray-600 text-center">
              Start the conversation with your group members
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {messages.map((message) => (
              <View
                key={message.id}
                className={cn(
                  'flex-row',
                  message.isMe ? 'justify-end' : 'justify-start'
                )}
              >
                {!message.isMe && (
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-sm font-bold text-blue-600">
                      {message.sender.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                )}
                <View
                  className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl',
                    message.isMe
                      ? 'bg-blue-500 rounded-br-lg'
                      : 'bg-white border border-gray-100 rounded-bl-lg'
                  )}
                >
                  {!message.isMe && (
                    <Text className="text-sm font-semibold text-gray-900 mb-1">
                      {message.sender}
                    </Text>
                  )}
                  <Text
                    className={cn(
                      'text-base leading-5',
                      message.isMe ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {message.message}
                  </Text>
                  <Text
                    className={cn(
                      'text-xs mt-2',
                      message.isMe ? 'text-blue-100' : 'text-gray-500'
                    )}
                  >
                    {formatChatTime(message.timestamp)}
                  </Text>
                </View>
                {message.isMe && (
                  <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center ml-3 mt-1">
                    <Text className="text-sm font-bold text-gray-600">You</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message Input */}
      <View 
        className="bg-white border-t border-gray-100 px-6 py-4"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="flex-row items-end gap-3">
          <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 min-h-[44px] justify-center">
            <TextInput
              className="text-base text-gray-900 max-h-24"
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Pressable
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            className={cn(
              'w-11 h-11 rounded-full items-center justify-center',
              newMessage.trim() ? 'bg-blue-500' : 'bg-gray-200'
            )}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() ? 'white' : '#9CA3AF'} 
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}