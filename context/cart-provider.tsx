import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from './supabase-provider';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  // Product details (joined)
  product?: {
    id: string;
    name: string;
    price: number;
    original_price?: string;
    image_url: string[] | string;
    location: string;
    amount: number;
    user_id: string;
    shop?: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  refreshing: boolean;
  addToCart: (productId: string, quantity: number) => Promise<boolean>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  removeMultipleFromCart: (cartItemIds: string[]) => Promise<boolean>;
  getCartItemByProductId: (productId: string) => CartItem | null;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export function CartProvider({ children }: PropsWithChildren) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useAuth();

  const fetchCartItems = async () => {
    if (!session?.user?.id) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product (
            id,
            name,
            price,
            original_price,
            image_url,
            location,
            amount,
            user_id
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart items:', error);
        return;
      }

      if (data) {
        // Process cart items and fetch business names
        const processedItems = await Promise.all(
          data.map(async (item) => {
            let shop = 'Local Business';
            
            if (item.product?.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('username, name')
                .eq('id', item.product.user_id)
                .single();
              
              if (userData) {
                shop = userData.username || userData.name || shop;
              }
            }

            return {
              ...item,
              product: item.product ? {
                ...item.product,
                shop
              } : undefined
            };
          })
        );

        setCartItems(processedItems);
      }
    } catch (error) {
      console.error('Error in fetchCartItems:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    setRefreshing(true);
    await fetchCartItems();
    setRefreshing(false);
  };

  const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Update existing item
        return await updateCartItem(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: session.user.id,
            product_id: productId,
            quantity: quantity
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding to cart:', error);
          return false;
        }

        if (data) {
          await refreshCart();
          return true;
        }
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
    }
    
    return false;
  };

  const updateCartItem = async (cartItemId: string, quantity: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) {
        console.error('Error updating cart item:', error);
        return false;
      }

      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) {
        console.error('Error removing from cart:', error);
        return false;
      }

      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error in removeFromCart:', error);
      return false;
    }
  };

  const removeMultipleFromCart = async (cartItemIds: string[]): Promise<boolean> => {
    if (cartItemIds.length === 0) return true;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .in('id', cartItemIds);

      if (error) {
        console.error('Error removing multiple items from cart:', error);
        return false;
      }

      await refreshCart();
      return true;
    } catch (error) {
      console.error('Error in removeMultipleFromCart:', error);
      return false;
    }
  };

  const getCartItemByProductId = (productId: string): CartItem | null => {
    return cartItems.find(item => item.product_id === productId) || null;
  };

  const getTotalItems = (): number => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  useEffect(() => {
    fetchCartItems();
  }, [session?.user?.id]);

  const value: CartContextType = {
    cartItems,
    loading,
    refreshing,
    addToCart,
    updateCartItem,
    removeFromCart,
    removeMultipleFromCart,
    getCartItemByProductId,
    getTotalItems,
    getTotalPrice,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
