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

		// If no cart exists yet, nothing to remove
		if (!cart) {
			return json(
				{
					success: true,
					message: 'Cart is empty',
					cartSize: 0
				},
				{ status: 200 }
			);
		}

		let products = cart.products || [];
		const initialLength = products.length;
		console.log(products);
		// Remove the product from the array
		products = products.filter((id) => id !== Number(productId));

		console.log(products);
		// If nothing was removed, product wasn't in cart
		if (products.length === initialLength) {
			return json(
				{
					success: true,
					message: 'Product was not in cart',
					productId,
					cartSize: products.length
				},
				{ status: 200 }
			);
		}

		// Update the cart with modified products array
		const { error: updateError } = await supabase
			.from('cart')
			.update({ products })
			.eq('id', userId);

		if (updateError) {
			console.error('Error updating cart:', updateError);
			throw error(500, { message: 'Failed to update cart' });
		}

		// Return success response
		return json(
			{
				success: true,
				message: 'Product removed from cart',
				productId,
				cartSize: products.length
			},
			{ status: 200 }
		);
	} catch (e) {
		// If it's not already a SvelteKit error, convert it
		if (!e || typeof e !== 'object' || !('status' in e)) {
			console.error('Unexpected error:', e);
			throw error(500, { message: 'Unknown error occurred' });
		}
		throw e; // Re-throw SvelteKit errors
	}
};
