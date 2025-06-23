import { supabase } from '@/config/supabase';

const API_KEY = 'AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
  productSuggestions?: ProductSuggestion[];
}

export interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  business: string;
  location: string;
  image_url?: string;
  relevance_reason: string;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  location: string;
  image_url: string[];
  user_id: string;
  tags: any[];
  amount: number;
  business?: string;
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
  private marketplaceProducts: MarketplaceProduct[] = [];
  private lastProductsFetch: number = 0;
  private readonly PRODUCTS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private async fetchMarketplaceProducts(): Promise<void> {
    const now = Date.now();
    
    // Return cached products if they're fresh
    if (this.marketplaceProducts.length > 0 && 
        (now - this.lastProductsFetch) < this.PRODUCTS_CACHE_DURATION) {
      return;
    }

    try {
      const { data: products, error } = await supabase
        .from('product')
        .select(`
          id,
          name,
          price,
          description,
          location,
          image_url,
          user_id,
          tags,
          amount
        `)
        .gt('amount', 0) // Only available products
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching marketplace products:', error);
        return;
      }

      if (products) {
        // Get business names for products
        const userIds = [...new Set(products.map(p => p.user_id))];
        const { data: users } = await supabase
          .from('users')
          .select('id, username, name')
          .in('id', userIds);

        const userMap = new Map();
        users?.forEach(user => {
          userMap.set(user.id, user.username || user.name || 'Local Business');
        });

        this.marketplaceProducts = products.map(product => ({
          ...product,
          business: userMap.get(product.user_id) || 'Local Business'
        }));
        
        this.lastProductsFetch = now;
      }
    } catch (error) {
      console.error('Error in fetchMarketplaceProducts:', error);
    }
  }

  private findRelevantProducts(content: string, maxProducts: number = 3): ProductSuggestion[] {
    if (this.marketplaceProducts.length === 0) {
      return [];
    }

    const contentLower = content.toLowerCase();
    const suggestions: ProductSuggestion[] = [];

    for (const product of this.marketplaceProducts) {
      let relevanceScore = 0;
      let reason = '';

      // Check name match
      const nameWords = product.name.toLowerCase().split(' ');
      const nameMatches = nameWords.filter(word => contentLower.includes(word));
      if (nameMatches.length > 0) {
        relevanceScore += nameMatches.length * 3;
        reason = `Contains ${nameMatches.join(', ')}`;
      }

      // Check description match
      if (product.description) {
        const descWords = product.description.toLowerCase().split(' ');
        const descMatches = descWords.filter(word => 
          word.length > 3 && contentLower.includes(word)
        );
        if (descMatches.length > 0) {
          relevanceScore += descMatches.length;
          reason = reason || `Related to ${descMatches.slice(0, 2).join(', ')}`;
        }
      }

      // Check tags match
      if (product.tags && Array.isArray(product.tags)) {
        const tagMatches = product.tags.filter(tag => 
          contentLower.includes(tag.label?.toLowerCase() || '')
        );
        if (tagMatches.length > 0) {
          relevanceScore += tagMatches.length * 2;
          reason = reason || `Matches ${tagMatches.map(t => t.label).join(', ')} categories`;
        }
      }

      // Food-related keywords boost
      const foodKeywords = ['recipe', 'cook', 'meal', 'ingredient', 'fresh', 'organic', 'vegetable', 'fruit'];
      const keywordMatches = foodKeywords.filter(keyword => contentLower.includes(keyword));
      if (keywordMatches.length > 0) {
        relevanceScore += keywordMatches.length;
      }

      if (relevanceScore > 0) {
        suggestions.push({
          id: product.id,
          name: product.name,
          price: product.price,
          business: product.business || 'Local Business',
          location: product.location,
          image_url: Array.isArray(product.image_url) ? product.image_url[0] : product.image_url,
          relevance_reason: reason || 'Available on FoodLoop'
        });
      }
    }

    // Sort by relevance score and return top products
    return suggestions
      .sort((a, b) => b.relevance_reason.length - a.relevance_reason.length)
      .slice(0, maxProducts);
  }

  async sendMessage(messages: ChatMessage[]): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
    try {
      // Fetch latest marketplace products
      await this.fetchMarketplaceProducts();

      // Convert our chat format to Gemini's expected format
      const geminiMessages = messages.map(msg => {
        const parts: any[] = [{ text: msg.content }];
        
        // Add images if present
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(imageBase64 => {
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

      // Add marketplace context to system instruction
      const productContext = this.marketplaceProducts.length > 0 
        ? `\n\nCurrent FoodLoop marketplace has ${this.marketplaceProducts.length} available products including: ${this.marketplaceProducts.slice(0, 10).map(p => p.name).join(', ')}. When relevant to user queries, mention that these items are available on FoodLoop marketplace.`
        : '';

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
            text: `You are SmartPlate AI, a helpful assistant focused on sustainable food practices, reducing food waste, and eco-friendly cooking. You can also analyze images of plants, food, and ingredients to provide specific advice. When analyzing images, provide detailed observations and practical recommendations. For plant images, check for diseases, pests, or health issues and suggest organic treatments. For food images, assess freshness, suggest recipes, or provide nutritional insights. Always be encouraging and provide actionable advice.${productContext}`
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
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from AI service');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Find relevant products based on the conversation
      const lastUserMessage = messages[messages.length - 1];
      const conversationContext = lastUserMessage?.content + ' ' + responseText;
      const productSuggestions = this.findRelevantProducts(conversationContext);

      return {
        response: responseText,
        productSuggestions
      };
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  }

  // Method to generate recipe suggestions based on ingredients
  async generateRecipes(ingredients: string[]): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
    await this.fetchMarketplaceProducts();
    
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
  async getSustainabilityTips(): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
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
  async analyzeImage(imageBase64: string, context?: string): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
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

  // Get specific product by ID
  async getProductById(productId: string): Promise<MarketplaceProduct | null> {
    await this.fetchMarketplaceProducts();
    return this.marketplaceProducts.find(p => p.id === productId) || null;
  }

  // Search products by query
  async searchProducts(query: string, limit: number = 10): Promise<ProductSuggestion[]> {
    await this.fetchMarketplaceProducts();
    return this.findRelevantProducts(query, limit);
  }
}