import React, { useRef, useEffect } from 'react';
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
import Markdown from 'react-native-markdown-display';
import { useChatContext } from '@/context/chat-provider';

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
  const { messages, isLoading, sendMessage, clearChat } = useChatContext();
  const [inputText, setInputText] = React.useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Colors based on theme
  const textColor = colorScheme === 'dark' ? colors.dark.foreground : colors.light.foreground;
  const bgColor = colorScheme === 'dark' ? colors.dark.background : colors.light.background;
  const mutedTextColor = colorScheme === 'dark' ? colors.dark.mutedForeground : colors.light.mutedForeground;
  const borderColor = colorScheme === 'dark' ? colors.dark.border : colors.light.border;
  const secondaryBg = colorScheme === 'dark' ? colors.dark.secondary : colors.light.secondary;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const messageText = inputText.trim();
    setInputText('');
    Keyboard.dismiss();

    await sendMessage(messageText);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
    inputRef.current?.focus();
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    const isLastMessage = index === messages.length - 1;
    
    return (
      <View 
        key={message.id || index}
        className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <View className={`flex-row max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <View className={`w-8 h-8 rounded-full items-center justify-center ${isUser ? 'ml-3' : 'mr-3'} mt-1`}>
            {isUser ? (
              <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                <Text className="text-primary-foreground text-xs font-bold">You</Text>
              </View>
            ) : (
              <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                <Text className="text-white text-xs">🧠</Text>
              </View>
            )}
          </View>
          
          {/* Message bubble */}
          <View 
            className={`px-4 py-3 rounded-2xl flex-1 ${
              isUser 
                ? 'bg-primary rounded-tr-sm' 
                : 'rounded-tl-sm'
            }`}
            style={{
              backgroundColor: isUser 
                ? colorScheme === 'dark' ? colors.dark.primary : colors.light.primary
                : colorScheme === 'dark' ? colors.dark.secondary + '80' : colors.light.secondary
            }}
          >
            <Text 
              className={`text-base leading-6 ${
                isUser 
                  ? 'text-primary-foreground' 
                  : ''
              }`}
              style={{ 
                color: isUser 
                  ? colorScheme === 'dark' ? colors.dark.primaryForeground : colors.light.primaryForeground
                  : textColor 
              }}
            >
              {isUser ? (
                message.content
              ) : (
                <Markdown
                  style={{
                    body: {
                      color: textColor,
                      fontSize: 16,
                      lineHeight: 24,
                    },
                    paragraph: {
                      marginTop: 0,
                      marginBottom: 8,
                    },
                    strong: {
                      fontWeight: 'bold',
                    },
                    em: {
                      fontStyle: 'italic',
                    },
                    code_inline: {
                      backgroundColor: colorScheme === 'dark' ? colors.dark.muted : colors.light.muted,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 4,
                      fontSize: 14,
                    },
                    code_block: {
                      backgroundColor: colorScheme === 'dark' ? colors.dark.muted : colors.light.muted,
                      padding: 12,
                      borderRadius: 8,
                      fontSize: 14,
                    },
                    bullet_list: {
                      marginVertical: 4,
                    },
                    ordered_list: {
                      marginVertical: 4,
                    },
                    list_item: {
                      marginVertical: 2,
                    },
                  }}
                >
                  {message.content}
                </Markdown>
              )}
            </Text>
            
            {/* Timestamp */}
            <Text 
              className={`text-xs mt-2 ${
                isUser ? 'text-primary-foreground/70' : ''
              }`}
              style={{
                color: isUser
                  ? colorScheme === 'dark' ? colors.dark.primaryForeground + '80' : colors.light.primaryForeground + '80'
                  : mutedTextColor
              }}
            >
              {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : format(new Date(), 'h:mm a')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
          <H1 className="text-lg">SmartPlate AI</H1>
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
            {/* Welcome message when no messages */}
            {messages.length === 0 && (
              <>
                <View className="mb-4 mt-2 items-start">
                  <View className="flex-row max-w-[85%]">
                    <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3 mt-1">
                      <Text className="text-white text-xs">🧠</Text>
                    </View>
                    <View 
                      className="px-4 py-3 rounded-2xl rounded-tl-sm flex-1"
                      style={{ backgroundColor: secondaryBg + '80' }}
                    >
                      <Text style={{ color: textColor }}>
                        Hello! I'm SmartPlate AI, your sustainable food assistant. I can help you with recipes, reduce food waste, and give you eco-friendly cooking tips. What would you like to know?
                      </Text>
                      <Text className="text-xs mt-2" style={{ color: mutedTextColor }}>
                        {format(new Date(), 'h:mm a')}
                      </Text>
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
                      className="p-3 rounded-xl mb-2 border"
                      style={{ 
                        backgroundColor: secondaryBg + '30',
                        borderColor: borderColor 
                      }}
                    >
                      <Text style={{ color: textColor }}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Chat messages */}
            {messages.map((message, index) => renderMessage(message, index))}

            {/* Loading indicator */}
            {isLoading && (
              <View className="items-start mb-4">
                <View className="flex-row max-w-[85%]">
                  <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-white text-xs">🧠</Text>
                  </View>
                  <View 
                    className="px-4 py-3 rounded-2xl rounded-tl-sm"
                    style={{ backgroundColor: secondaryBg + '80' }}
                  >
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color={textColor} />
                      <Text className="ml-2" style={{ color: textColor }}>Thinking...</Text>
                    </View>
                    <Text className="text-xs mt-2" style={{ color: mutedTextColor }}>
                      {format(new Date(), 'h:mm a')}
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
                  backgroundColor: secondaryBg
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