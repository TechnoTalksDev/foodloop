import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
  // Get current session to identify the user using safeGetSession
  const session = await safeGetSession();
  
  if (!session) {
    throw error(401, { message: 'Authentication required' });
  }

  const userId = session.user?.id;

  try {
    // Check if the cart exists
    const { data: cart, error: fetchError } = await supabase
      .from('cart')
      .select('id')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching cart:', fetchError);
      throw error(500, { message: 'Failed to fetch cart data' });
    }
    
    // If no cart exists yet, nothing to clear
    if (!cart) {
      return json({ 
        success: true, 
        message: 'Cart is already empty',
        cartSize: 0
      }, { status: 200 });
    }

    // Option 1: Update cart with empty products array
    const { error: updateError } = await supabase
      .from('cart')
      .update({ products: [] })
      .eq('id', userId);

    if (updateError) {
      console.error('Error clearing cart:', updateError);
      throw error(500, { message: 'Failed to clear cart' });
    }

    // Alternative Option 2: Delete the entire cart record
    // Uncomment this and comment out the update above if you prefer to delete the record
    /*
    const { error: deleteError } = await supabase
      .from('cart')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting cart:', deleteError);
      throw error(500, { message: 'Failed to delete cart' });
    }
    */

    // Return success response
    return json({ 
      success: true, 
      message: 'Cart cleared successfully',
      cartSize: 0
    }, { status: 200 });
    
  } catch (e) {
    // If it's not already a SvelteKit error, convert it
    if (!e || typeof e !== 'object' || !('status' in e)) {
      console.error('Unexpected error:', e);
      throw error(500, { message: 'Unknown error occurred' });
    }
    throw e; // Re-throw SvelteKit errors
  }
};