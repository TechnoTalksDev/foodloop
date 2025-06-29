import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import { CartProvider, useCart } from '@/context/cart-provider';

// Mock the auth context
const mockSession = {
  user: { id: 'test-user-id' }
};

jest.mock('@/context/supabase-provider', () => ({
  useAuth: () => ({ session: mockSession })
}));

// Mock cart items data
const mockCartItems = [
  {
    id: '1',
    user_id: 'test-user-id',
    product_id: 'product-1',
    quantity: 2,
    created_at: '2024-01-01T00:00:00Z',
    product: {
      id: 'product-1',
      name: 'Organic Apples',
      price: 5.99,
      original_price: '7.99',
      image_url: ['apple.jpg'],
      location: 'Farm Stand',
      amount: 10,
      user_id: 'seller-1',
      shop: 'Green Farm'
    }
  },
  {
    id: '2',
    user_id: 'test-user-id',
    product_id: 'product-2',
    quantity: 1,
    created_at: '2024-01-01T01:00:00Z',
    product: {
      id: 'product-2',
      name: 'Fresh Bread',
      price: 3.50,
      image_url: 'bread.jpg',
      location: 'Bakery',
      amount: 5,
      user_id: 'seller-2',
      shop: 'Local Bakery'
    }
  }
];

// Test component that uses the cart context
const TestCartComponent = () => {
  const { 
    cartItems, 
    loading, 
    addToCart, 
    updateCartItem, 
    removeFromCart,
    getTotalItems,
    getTotalPrice,
    getCartItemByProductId
  } = useCart();
  
  return (
    <>
      <Text testID="loading">{loading ? 'loading' : 'loaded'}</Text>
      <Text testID="cart-count">{cartItems.length}</Text>
      <Text testID="total-items">{getTotalItems()}</Text>
      <Text testID="total-price">{getTotalPrice().toFixed(2)}</Text>
      <Text testID="first-item-name">{cartItems[0]?.product?.name || 'none'}</Text>
      <Button 
        title="Add Item" 
        onPress={() => addToCart('product-3', 1)}
        testID="add-button"
      />
      <Button 
        title="Update Item" 
        onPress={() => updateCartItem('1', 3)}
        testID="update-button"
      />
      <Button 
        title="Remove Item" 
        onPress={() => removeFromCart('1')}
        testID="remove-button"
      />
    </>
  );
};

describe('CartProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful supabase responses
    const { supabase } = require('@/config/supabase');
    
    // Mock cart fetch
    supabase.from.mockImplementation((table: string) => {
      if (table === 'cart_items') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          mockResolvedValue: jest.fn().mockResolvedValue({
            data: mockCartItems,
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { username: 'TestSeller' },
          error: null
        })
      };
    });
  });

  it('should provide initial cart state', async () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    // Initially should be loading
    expect(getByTestId('loading').children[0]).toBe('loading');
    expect(getByTestId('cart-count').children[0]).toBe('0');

    // Wait for loading to complete
    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });
  });

  it('should fetch and display cart items', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: mockCartItems,
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    expect(getByTestId('cart-count').children[0]).toBe('2');
    expect(getByTestId('first-item-name').children[0]).toBe('Organic Apples');
  });

  it('should calculate total items correctly', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: mockCartItems,
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Total items: 2 + 1 = 3
    expect(getByTestId('total-items').children[0]).toBe('3');
  });

  it('should calculate total price correctly', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: mockCartItems,
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Total price: (5.99 * 2) + (3.50 * 1) = 15.48
    expect(getByTestId('total-price').children[0]).toBe('15.48');
  });

  it('should handle add to cart', async () => {
    const { supabase } = require('@/config/supabase');
    
    // Mock initial fetch
    supabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null
    });

    // Mock add to cart
    supabase.from().insert().select().mockResolvedValue({
      data: [{ id: 'new-item', product_id: 'product-3', quantity: 1 }],
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Simulate add to cart
    act(() => {
      getByTestId('add-button').props.onPress();
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('cart_items');
    });
  });

  it('should handle update cart item', async () => {
    const { supabase } = require('@/config/supabase');
    
    supabase.from().select().eq().mockResolvedValue({
      data: mockCartItems,
      error: null
    });

    // Mock update
    supabase.from().update().eq().select().mockResolvedValue({
      data: [{ ...mockCartItems[0], quantity: 3 }],
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Simulate update
    act(() => {
      getByTestId('update-button').props.onPress();
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('cart_items');
    });
  });

  it('should handle remove from cart', async () => {
    const { supabase } = require('@/config/supabase');
    
    supabase.from().select().eq().mockResolvedValue({
      data: mockCartItems,
      error: null
    });

    // Mock delete
    supabase.from().delete().eq().mockResolvedValue({
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Simulate remove
    act(() => {
      getByTestId('remove-button').props.onPress();
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('cart_items');
    });
  });

  it('should handle empty cart', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    expect(getByTestId('cart-count').children[0]).toBe('0');
    expect(getByTestId('total-items').children[0]).toBe('0');
    expect(getByTestId('total-price').children[0]).toBe('0.00');
    expect(getByTestId('first-item-name').children[0]).toBe('none');
  });

  it('should handle API errors gracefully', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    const { getByTestId } = render(
      <CartProvider>
        <TestCartComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').children[0]).toBe('loaded');
    });

    // Should handle error gracefully and show empty cart
    expect(getByTestId('cart-count').children[0]).toBe('0');
  });

  it('should throw error when useCart is used outside provider', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      require('@testing-library/react-hooks').renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');

    consoleSpy.mockRestore();
  });
});
