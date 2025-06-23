import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { ChatMessage, GeminiService } from '@/lib/gemini';
import { nanoid } from 'nanoid';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  generateRecipes: (ingredients: string[]) => Promise<void>;
  getSustainabilityTips: () => Promise<void>;
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

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage];
      console.log('Added user message, total messages:', newMessages.length);
      return newMessages;
    });
    
    setIsLoading(true);

    try {
      // Get current messages for API call
      const currentMessages = [...messages, userMessage];
      console.log('Sending to API, message count:', currentMessages.length);
      
      const response = await geminiService.sendMessage(currentMessages);
      console.log('API response received:', response.substring(0, 50) + '...');
      
      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      // Add assistant message
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, assistantMessage];
        console.log('Added assistant message, total messages:', newMessages.length);
        console.log('All messages:', newMessages.map(m => ({ role: m.role, content: m.content.substring(0, 30) })));
        return newMessages;
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, geminiService]); // Removed messages dependency to avoid stale closure

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};