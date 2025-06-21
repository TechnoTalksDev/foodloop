import React, { useState, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image, ScrollView, TouchableOpacity, View, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing
} from "react-native-reanimated";
import { supabase } from "@/config/supabase";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ui/product-card";

// Define the product interface based on our database schema
interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: string;
  description?: string;
  image_url?: string[];
  created_at: string;
  expiry?: string;
  trash?: number;
  tags?: { label: string; icon: string }[];
  user_id: string;
  // Fields for UI display
  business?: string;
  discount?: string;
  eco?: string;
}

export default function Discover() {  // Get search params to check if we should focus the search input
  const { focusSearch, timestamp } = useLocalSearchParams();
  // Reference to the input element
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  
  // State for products from Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Move fetchProducts outside useEffect for reuse
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch the 4 most recently created products
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }
      
      if (data) {
        // Create a map to store user details for each user_id
        const userIds = data
          .map(product => product.user_id)
          .filter(id => id !== null && id !== undefined);
        
        // Fetch user information for all products in one query
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, name')
          .in('id', userIds);
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
        }
        
        // Create a lookup map for quick user data access
        const userMap = new Map();
        if (users) {
          users.forEach(user => {
            userMap.set(user.id, user);
          });
        }
        
        // Process the data to format it for UI
        const formattedProducts: Product[] = await Promise.all(data.map(async (product) => {
          // Calculate discount percentage
          let discountPercentage = '';
          if (product.original_price && product.price) {
            const originalPrice = parseFloat(product.original_price);
            const savings = originalPrice - product.price;
            const percentage = Math.round((savings / originalPrice) * 100);
            discountPercentage = `${percentage}% off`;
          }
          
          // Format eco-friendly info based on trash saved
          const eco = product.trash ? `Saves ${product.trash}kg CO₂` : undefined;
          
          // Get business name from user data
          let business = "Local Business"; // Default
          
          if (product.user_id) {
            const user = userMap.get(product.user_id);
            
            if (user) {
              // Use username or name, whichever is available
              business = user.username || user.name || business;
            }
          }
          
          return {
            ...product,
            discount: discountPercentage,
            eco,
            business
          };
        }));
        
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handler for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProducts();
    } finally {
      setRefreshing(false);
    }
  };

  // Animation values for the search bar - always start with initial values
  const searchBgColor = useSharedValue(0);
  const searchScale = useSharedValue(0.9);
  
  // Animated styles for the search bar
  const animatedSearchStyle = useAnimatedStyle(() => {
    const backgroundColor = `rgba(144, 202, 249, ${searchBgColor.value})`;
    return {
      backgroundColor,
      transform: [{ scale: searchScale.value }],
    };
  });
  // Run animation whenever component mounts or when timestamp changes
  useEffect(() => {
    // Check if we should animate (coming from home page search)
    if (focusSearch === "true" && timestamp) {
      // Reset values to initial state explicitly
      searchScale.value = 0.9;
      searchBgColor.value = 0;
      
      // Small delay to ensure values are reset before animating
      setTimeout(() => {
        // Run scale animation
        searchScale.value = withSequence(
          withTiming(1.05, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 150 })
        );
        
        // Run background color animation
        searchBgColor.value = withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(0, { duration: 700 })
        );
        
        // Focus the input after animation starts
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 250);
      }, 50);
    }
  }, [focusSearch, timestamp]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10b981"]}
            tintColor="#10b981"
          />
        }
      >
        <View className="p-4">
          <H1 className="mb-4">Discover</H1>
          <Muted className="mb-6">
            Explore local businesses and find new surplus food deals
          </Muted>
          
          {/* Search bar with improved animation */}
          <Animated.View 
            style={[{ borderRadius: 28 }, animatedSearchStyle]}
            className="mb-6"
          >
            <View className="flex-row items-center bg-secondary rounded-full px-4 py-2">
              <Text className="text-foreground/60 mr-2">🔍</Text>
              <Input 
                ref={searchInputRef}
                placeholder="Search businesses or items" 
                className="flex-1 bg-transparent border-0 p-0 text-foreground text-base"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </Animated.View>
            {/* Businesses section */}
          <View className="mb-6">
            <H3 className="mb-4">Local Businesses</H3>
            
            {/* Business cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {loading ? (
                <View className="items-center justify-center p-4 w-full">
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              ) : products.length === 0 ? (
                <View className="p-4">
                  <Text className="text-muted-foreground">No businesses available</Text>
                </View>
              ) : (
                // Use unique business names from products
                Array.from(new Set(products.map(p => p.business)))
                  .filter(Boolean)
                  .map((business, index) => (
                    <TouchableOpacity 
                      key={index} 
                      className="mr-4 bg-card rounded-xl overflow-hidden shadow-sm" 
                      style={{ width: 150, elevation: 2 }}
                    >
                      <View className="h-20 bg-primary/20 items-center justify-center">
                        <Text className="text-2xl">🏪</Text>
                      </View>
                      <View className="p-3">
                        <Text className="font-medium">{business}</Text>
                        <Text className="text-xs text-muted-foreground">Local business</Text>
                      </View>
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
              {/* Product grid - display products from Supabase */}
            <H3 className="mb-4">Available Today</H3>
            <View className="flex-row flex-wrap justify-between">
              {loading ? (
                // Loading state
                <View className="w-full items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text className="mt-4 text-muted-foreground">Loading products...</Text>
                </View>
              ) : products.length === 0 ? (
                // No products found
                <View className="w-full items-center justify-center py-8">
                  <Text className="text-muted-foreground">No products available at the moment</Text>
                </View>
              ) : (                // Map through products from Supabase
                products.map((product) => (
                  <ProductCard
                    key={product.id}                    image={product.image_url && product.image_url.length > 0 
                      ? { uri: product.image_url[0] } 
                      : require("@/assets/foodloop.png")}
                    name={product.name}
                    business={product.business || "Local Business"}
                    price={product.price}
                    originalPrice={product.original_price ? parseFloat(product.original_price) : 0}
                    discount={product.discount || ""}
                    eco={product.eco || "Eco-friendly"}
                    onPress={() => router.push({
                      pathname: "/(protected)/product/[id]",
                      params: { id: product.id }
                    })}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
