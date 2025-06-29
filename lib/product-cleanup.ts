// lib/product-cleanup.ts
import { supabase } from '@/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, subDays } from 'date-fns';

const CLEANUP_STORAGE_KEY = 'product_cleanup_last_run';
const CLEANUP_INTERVAL_HOURS = 6; // Run cleanup every 6 hours
const SOLD_OUT_RETENTION_DAYS = 2; // Keep sold-out products for 2 days

export interface CleanupResult {
  success: boolean;
  removedCount: number;
  error?: string;
}

/**
 * Automatically removes products that have been sold out (amount = 0) for more than 2 days
 * This prevents cluttering the database with old sold-out products
 */
export const cleanupSoldOutProducts = async (): Promise<CleanupResult> => {
  try {
    console.log('🧹 [Product Cleanup] Starting automatic cleanup of sold-out products...');

    // Check if we need to run cleanup (avoid running too frequently)
    const lastCleanup = await AsyncStorage.getItem(CLEANUP_STORAGE_KEY);
    if (lastCleanup) {
      const lastCleanupDate = new Date(lastCleanup);
      const now = new Date();
      const hoursSinceLastCleanup = (now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCleanup < CLEANUP_INTERVAL_HOURS) {
        console.log(`🧹 [Product Cleanup] Skipping cleanup - last run was ${hoursSinceLastCleanup.toFixed(1)} hours ago`);
        return { success: true, removedCount: 0 };
      }
    }

    // Calculate cutoff date (2 days ago)
    const cutoffDate = subDays(new Date(), SOLD_OUT_RETENTION_DAYS);

    // Find products that are sold out and have been created more than 2 days ago
    // Since the product table doesn't have updated_at, we use created_at as fallback
    const { data: soldOutProducts, error: fetchError } = await supabase
      .from('product')
      .select('id, name, user_id, created_at')
      .eq('amount', 0)
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      console.error('🧹 [Product Cleanup] Error fetching sold-out products:', fetchError);
      return { success: false, removedCount: 0, error: fetchError.message };
    }

    if (!soldOutProducts || soldOutProducts.length === 0) {
      console.log('🧹 [Product Cleanup] No sold-out products found for cleanup');
      await AsyncStorage.setItem(CLEANUP_STORAGE_KEY, new Date().toISOString());
      return { success: true, removedCount: 0 };
    }

    console.log(`🧹 [Product Cleanup] Found ${soldOutProducts.length} sold-out products to remove`);

    // Get product IDs for deletion
    const productIds = soldOutProducts.map(p => p.id);

    // Remove related cart items first (cascade delete)
    const { error: cartCleanupError } = await supabase
      .from('cart_items')
      .delete()
      .in('product_id', productIds);

    if (cartCleanupError) {
      console.error('🧹 [Product Cleanup] Error cleaning up cart items:', cartCleanupError);
      // Continue with product deletion even if cart cleanup fails
    }

    // Delete the sold-out products
    const { error: deleteError } = await supabase
      .from('product')
      .delete()
      .in('id', productIds);

    if (deleteError) {
      console.error('🧹 [Product Cleanup] Error deleting sold-out products:', deleteError);
      return { success: false, removedCount: 0, error: deleteError.message };
    }

    // Update last cleanup timestamp
    await AsyncStorage.setItem(CLEANUP_STORAGE_KEY, new Date().toISOString());

    console.log(`🧹 [Product Cleanup] Successfully removed ${soldOutProducts.length} sold-out products`);
    
    return { 
      success: true, 
      removedCount: soldOutProducts.length 
    };

  } catch (error) {
    console.error('🧹 [Product Cleanup] Unexpected error during cleanup:', error);
    return { 
      success: false, 
      removedCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Manually trigger product cleanup (for testing or admin purposes)
 */
export const forceCleanupSoldOutProducts = async (): Promise<CleanupResult> => {
  // Clear the last cleanup timestamp to force immediate cleanup
  await AsyncStorage.removeItem(CLEANUP_STORAGE_KEY);
  return await cleanupSoldOutProducts();
};

/**
 * Check if a specific product should be marked as "sold out" in the UI
 */
export const isProductSoldOut = (product: { amount: number }): boolean => {
  return product.amount <= 0;
};

/**
 * Get a user-friendly sold out message
 */
export const getSoldOutMessage = (daysOld?: number): string => {
  if (daysOld && daysOld >= 1) {
    return `⚠️ Sold out ${Math.floor(daysOld)} day${Math.floor(daysOld) !== 1 ? 's' : ''} ago`;
  }
  return '⚠️ This product is now sold out';
};
