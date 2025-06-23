import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '@/components/safe-area-view';
import { Text } from '@/components/ui/text';
import { H1 } from '@/components/ui/typography';
import { useColorScheme } from '@/lib/useColorScheme';
import { colors } from '@/constants/colors';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const API_KEY = 'AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SUGGESTED_PROMPTS = [
  "What can I make with leftover vegetables?",
  "Give me sustainable cooking tips",
  "How can I reduce food waste?",
  "Plan a zero-waste meal",
  "What are some eco-friendly food storage tips?",
];

export default function SmartPlateAI() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Colors based on theme
  const textColor = colorScheme === 'dark' ? colors.dark.foreground : colors.light.foreground;
  const bgColor = colorScheme === 'dark' ? colors.dark.background : colors.light.background;
  const mutedTextColor = colorScheme === 'dark' ? colors.dark.mutedForeground : colors.light.mutedForeground;
  const borderColor = colorScheme === 'dark' ? colors.dark.border : colors.light.border;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessageToGemini = async (chatMessages: ChatMessage[]): Promise<string> => {
    const geminiMessages = chatMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const messageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    // Add user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    console.log('Adding user message:', userMessage);
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage];
      console.log('Updated messages after user:', newMessages.length);
      return newMessages;
    });

    setIsLoading(true);

    try {
      // Get the current messages including the new user message
      const currentMessages = [...messages, userMessage];
      console.log('Sending to API with messages:', currentMessages.length);
      
      const response = await sendMessageToGemini(currentMessages);
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      console.log('Adding assistant message:', assistantMessage);
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, assistantMessage];
        console.log('Updated messages after assistant:', newMessages.length);
        return newMessages;
      });

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message.',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const clearChat = () => {
    setMessages([]);
    console.log('Chat cleared');
  };

  console.log('Rendering with messages count:', messages.length);
  console.log('Current messages:', messages.map(m => ({ role: m.role, content: m.content.substring(0, 30) })));

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-2">
            <Text className="text-white text-sm font-bold">🧠</Text>
          </View>
          <H1 className="text-lg">SmartPlate AI ({messages.length})</H1>
        </View>

        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="refresh" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="py-4">
            {/* Debug info */}
            <Text style={{ color: 'red', fontSize: 12 }}>
              Debug: {messages.length} messages
            </Text>
            
            {/* Welcome message when no messages */}
            {messages.length === 0 && (
              <>
                <View className="mb-4 mt-2">
                  <View className="flex-row justify-start mb-2">
                    <View className="flex-row max-w-[85%]">
                      <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3 mt-1">
                        <Text className="text-white text-xs">🧠</Text>
                      </View>
                      <View className="bg-secondary/50 px-4 py-3 rounded-2xl rounded-tl-sm flex-1">
                        <Text style={{ color: textColor }}>
                          Hello! I'm SmartPlate AI, your sustainable food assistant. I can help you with recipes, reduce food waste, and give you eco-friendly cooking tips. What would you like to know?
                        </Text>
                        <Text className="text-xs mt-2" style={{ color: mutedTextColor }}>
                          {format(new Date(), 'HH:mm')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Suggested prompts */}
                <View className="mt-6">
                  <Text className="text-sm font-medium mb-3" style={{ color: textColor }}>
                    Try asking about:
                  </Text>
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSuggestedPrompt(prompt)}
                      className="bg-secondary/30 p-3 rounded-xl mb-2 border"
                      style={{ borderColor: borderColor }}
                    >
                      <Text style={{ color: textColor }}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Actual messages */}
            {messages.map((message, index) => {
              console.log('Rendering message:', index, message.role, message.content.substring(0, 30));
              return (
                <View key={message.id} className="mb-4">
                  {message.role === 'user' ? (
                    // User message
                    <View className="flex-row justify-end mb-2">
                      <View className="bg-green-500 max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm">
                        <Text className="text-white">{message.content}</Text>
                      </View>
                    </View>
                  ) : (
                    // Assistant message
                    <View className="flex-row justify-start mb-2">
                      <View className="flex-row max-w-[85%]">
                        <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3 mt-1">
                          <Text className="text-white text-xs">🧠</Text>
                        </View>
                        <View className="bg-secondary/50 px-4 py-3 rounded-2xl rounded-tl-sm flex-1">
                          <Text style={{ color: textColor }}>{message.content}</Text>
                          <Text className="text-xs mt-2" style={{ color: mutedTextColor }}>
                            {format(message.timestamp, 'HH:mm')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <View className="flex-row justify-start mb-4">
                <View className="flex-row max-w-[85%]">
                  <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-white text-xs">🧠</Text>
                  </View>
                  <View className="bg-secondary/50 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <ActivityIndicator size="small" color={textColor} />
                    <Text className="text-xs mt-2" style={{ color: mutedTextColor }}>
                      Thinking...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Input area */}
        <View className="px-4 py-3 border-t" style={{ borderTopColor: borderColor }}>
          <View className="flex-row items-end">
            <View className="flex-1 mr-3">
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask SmartPlate AI anything..."
                placeholderTextColor={mutedTextColor}
                className="border rounded-2xl px-4 py-3 text-base min-h-[48px] max-h-32"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor,
                  backgroundColor: colorScheme === 'dark' ? colors.dark.secondary : colors.light.secondary
                }}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
            </View>
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="w-12 h-12 bg-green-500 rounded-full items-center justify-center"
              style={{ 
                opacity: (!inputText.trim() || isLoading) ? 0.5 : 1 
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}