import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
  // Get the product ID from the URL params
  const productId = params.id;
  
  if (!productId) {
    throw error(400, { message: 'Missing product ID' });
  }

  // Get current session to identify the user using safeGetSession
  const session = await safeGetSession();
  
  if (!session) {
    throw error(401, { message: 'Authentication required' });
  }

  const userId = session.user?.id;

  try {
    // First, get the current cart
    const { data: cart, error: fetchError } = await supabase
      .from('cart')
      .select('products')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching cart:', fetchError);
      throw error(500, { message: 'Failed to fetch cart data' });
    }

    let products = [];
    
    // If cart exists, use its products array, otherwise create new array
    if (cart) {
      products = cart.products || [];
    }

    // Add the new product ID if it's not already in the cart
    if (!products.includes(productId)) {
      products.push(productId);
    }

    // Update or insert the cart
    if (cart) {
      // Update existing cart
      const { error: updateError } = await supabase
        .from('cart')
        .update({ products })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating cart:', updateError);
        throw error(500, { message: 'Failed to update cart' });
      }
    } else {
      // Create new cart
      const { error: insertError } = await supabase
        .from('cart')
        .insert({ 
          id: userId,
          products 
        });

      if (insertError) {
        console.error('Error creating cart:', insertError);
        throw error(500, { message: 'Failed to create cart' });
      }
    }

    // Return success response
    return json({ 
      success: true, 
      message: 'Product added to cart',
      productId,
      cartSize: products.length
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