import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { ChatMessage, GeminiService } from '@/lib/gemini';
import { nanoid } from 'nanoid';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  clearChat: () => void;
  generateRecipes: (ingredients: string[]) => Promise<void>;
  getSustainabilityTips: () => Promise<void>;
  analyzeImage: (imageBase64: string, context?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const geminiService = GeminiService.getInstance();

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    if ((!content.trim() && (!images || images.length === 0)) || isLoading) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: content.trim() || '📸 Image shared',
      timestamp: new Date(),
      images: images
    };

    // Add user message immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // Get current messages for API call
      const currentMessages = [...messages, userMessage];
      const response = await geminiService.sendMessage(currentMessages);
      
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      // Add assistant message
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, geminiService]);

  const generateRecipes = useCallback(async (ingredients: string[]) => {
    if (ingredients.length === 0 || isLoading) return;

    setIsLoading(true);

    try {
      const response = await geminiService.generateRecipes(ingredients);
      
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating recipes:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating recipes. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, geminiService]);

  const getSustainabilityTips = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await geminiService.getSustainabilityTips();
      
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting sustainability tips:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while getting sustainability tips. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, geminiService]);

  const analyzeImage = useCallback(async (imageBase64: string, context?: string) => {
    if (isLoading) return;

    setIsLoading(true);

    // Add user message with image
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: context || '📸 Please analyze this image',
      timestamp: new Date(),
      images: [imageBase64]
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await geminiService.analyzeImage(imageBase64, context);
      
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while analyzing the image. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, geminiService]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        sendMessage,
        clearChat,
        generateRecipes,
        getSustainabilityTips,
        analyzeImage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};