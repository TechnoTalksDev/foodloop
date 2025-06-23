const API_KEY = 'AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[]; // Base64 encoded images
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
      // Convert our chat format to Gemini's expected format
      const geminiMessages = messages.map(msg => {
        const parts: any[] = [{ text: msg.content }];
        
        // Add images if present
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(imageBase64 => {
            // Extract mime type and data from base64 string
            const [mimeInfo, data] = imageBase64.split(',');
            const mimeType = mimeInfo.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
            
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: data
              }
            });
          });
        }
        
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: parts
        };
      });

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
        ],
        systemInstruction: {
          parts: [{
            text: "You are SmartPlate AI, a helpful assistant focused on sustainable food practices, reducing food waste, and eco-friendly cooking. You can also analyze images of plants, food, and ingredients to provide specific advice. When analyzing images, provide detailed observations and practical recommendations. For plant images, check for diseases, pests, or health issues and suggest organic treatments. For food images, assess freshness, suggest recipes, or provide nutritional insights. Always be encouraging and provide actionable advice."
          }]
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
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from AI service');
      }

      if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
        throw new Error('Invalid response structure from AI service');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      return responseText;
    } catch (error) {
      console.error('Error calling AI service:', error);
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

  // Method to analyze plant/food images
  async analyzeImage(imageBase64: string, context?: string): Promise<string> {
    const prompt = context || "Please analyze this image and provide insights about what you see. If it's a plant, check for health issues, diseases, or care recommendations. If it's food, assess freshness and suggest ways to use it sustainably.";
    
    const messages: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: prompt,
        timestamp: new Date(),
        images: [imageBase64]
      }
    ];

    return this.sendMessage(messages);
  }
}