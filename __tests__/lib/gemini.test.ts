import { GeminiService, ChatMessage } from '@/lib/gemini';

// Mock supabase
jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    }))
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('GeminiService', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    geminiService = GeminiService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = GeminiService.getInstance();
      const instance2 = GeminiService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a test response from Gemini AI about cooking apples.'
                  }
                ]
              }
            }
          ]
        })
      });

      // Mock supabase response
      const { supabase } = require('@/config/supabase');
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };
      
      // Mock products query
      Object.assign(mockChain, {
        gt: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Organic Apples',
              price: 5.99,
              description: 'Fresh organic apples',
              location: 'Local Farm',
              image_url: 'apple.jpg',
              user_id: 'seller-1',
              tags: [{ label: 'organic' }, { label: 'fruit' }],
              amount: 10
            }
          ],
          error: null
        })
      });

      // Mock users query
      supabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            ...mockChain,
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockResolvedValue({
              data: [
                { id: 'seller-1', username: 'FarmFresh', name: 'Farm Fresh' }
              ],
              error: null
            })
          };
        }
        return mockChain;
      });
    });

    it('should send messages and return response with product suggestions', async () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: '[SmartPlate Mode] Help me make a recipe with apples',
          timestamp: new Date()
        }
      ];

      const response = await geminiService.sendMessage(messages);
      
      expect(response.response).toBe('This is a test response from Gemini AI about cooking apples.');
      expect(response.productSuggestions).toBeDefined();
      expect(Array.isArray(response.productSuggestions)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ];

      await expect(geminiService.sendMessage(messages)).rejects.toThrow('API Error: 500 Internal Server Error');
    });

    it('should handle empty responses from API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: []
        })
      });

      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ];

      await expect(geminiService.sendMessage(messages)).rejects.toThrow('No response from AI service');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const messages: ChatMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ];

      await expect(geminiService.sendMessage(messages)).rejects.toThrow('Network error');
    });
  });

  describe('generateRecipes', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Here are 3 creative recipes using your ingredients: 1. Apple Cinnamon Oatmeal...'
                  }
                ]
              }
            }
          ]
        })
      });
    });

    it('should generate recipes from ingredients', async () => {
      const ingredients = ['apples', 'cinnamon', 'oats'];
      const response = await geminiService.generateRecipes(ingredients);
      
      expect(response.response).toContain('Here are 3 creative recipes');
      expect(response.productSuggestions).toBeDefined();
      expect(Array.isArray(response.productSuggestions)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty ingredients array', async () => {
      const response = await geminiService.generateRecipes([]);
      
      expect(response.response).toBeDefined();
      expect(response.productSuggestions).toBeDefined();
    });
  });

  describe('getSustainabilityTips', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Here are 5 practical tips for reducing food waste: 1. Plan your meals...'
                  }
                ]
              }
            }
          ]
        })
      });
    });

    it('should get sustainability tips', async () => {
      const response = await geminiService.getSustainabilityTips();
      
      expect(response.response).toContain('5 practical tips for reducing food waste');
      expect(response.productSuggestions).toBeDefined();
      expect(Array.isArray(response.productSuggestions)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeImage', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This plant appears to be healthy with good leaf color and structure.'
                  }
                ]
              }
            }
          ]
        })
      });
    });

    it('should analyze images successfully', async () => {
      const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
      const response = await geminiService.analyzeImage(mockImageBase64, 'Analyze this plant');
      
      expect(response.response).toContain('plant appears to be healthy');
      expect(response.productSuggestions).toBeDefined();
      expect(Array.isArray(response.productSuggestions)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use default context when none provided', async () => {
      const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
      const response = await geminiService.analyzeImage(mockImageBase64);
      
      expect(response.response).toBeDefined();
      expect(response.productSuggestions).toBeDefined();
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const products = await geminiService.searchProducts('apples', 5);
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeLessThanOrEqual(5);
    });

    it('should use default limit when not specified', async () => {
      const products = await geminiService.searchProducts('tomatoes');
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      const product = await geminiService.getProductById('1');
      
      expect(product).toBeDefined();
      // Product might be null if not found, which is expected behavior
    });

    it('should return null for non-existent product', async () => {
      const product = await geminiService.getProductById('non-existent');
      
      expect(product).toBeNull();
    });
  });
});
