const API_KEY = 'AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export class GeminiService {
  private static instance: GeminiService;

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    try {
      console.log('🚀 Sending message to Gemini API...');
      console.log('📝 Input messages:', messages);

      // Convert our chat format to Gemini's expected format
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      console.log('🔄 Converted to Gemini format:', geminiMessages);

      const requestBody = {
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('🔗 API URL:', `${GEMINI_API_URL}?key=${API_KEY.substring(0, 10)}...`);

      const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Gemini API Error Response:', errorData);
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const data: GeminiResponse = await response.json();
      console.log('📦 Gemini API Response:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || data.candidates.length === 0) {
        console.error('❌ No candidates in response:', data);
        throw new Error('No response from Gemini API');
      }

      if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
        console.error('❌ Invalid response structure:', data.candidates[0]);
        throw new Error('Invalid response structure from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log('✅ Successfully extracted response text:', responseText);
      return responseText;
    } catch (error) {
      console.error('🔥 Error calling Gemini API:', error);
      throw error;
    }
  }

  // Method to generate recipe suggestions based on ingredients
  async generateRecipes(ingredients: string[]): Promise<string> {
    const prompt = `I have these ingredients: ${ingredients.join(', ')}. Please suggest 3 creative recipes I can make with these ingredients to reduce food waste. Include cooking time and difficulty level for each recipe.`;
    
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }
    ];

    return this.sendMessage(messages);
  }

  // Method to get sustainability tips
  async getSustainabilityTips(): Promise<string> {
    const prompt = "Give me 5 practical tips for reducing food waste and living more sustainably in my daily life.";
    
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date()
      }
    ];

    return this.sendMessage(messages);
  }
}