import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
	const session = await safeGetSession();

	// Fetch the cart based on the user id
	const { data: cartData, error: cartError } = await supabase
		.from('cart')
		.select('*')
		.eq('id', session.user?.id)
		.single();

	if (!cartData || !cartData.products || !Array.isArray(cartData.products)) {
		// Return empty products array if cart is empty or products aren't in expected format
		return { products: [] };
	}

	// Count occurrences of each product ID to determine quantity
	const productQuantities = cartData.products.reduce((acc, productId) => {
		acc[productId] = (acc[productId] || 0) + 1;
		return acc;
	}, {});

	// Fetch all products that match the IDs in the cart
	const { data: productsData, error: productsError } = await supabase
		.from('product')
		.select('*')
		.in('id', Object.keys(productQuantities));

	if (productsError) {
		throw error(500, 'Error fetching product data');
	}

	// If no products found, return empty array
	if (!productsData || productsData.length === 0) {
		return { products: [] };
	}

	// Extract all unique user IDs from products
	const userIds = [...new Set(productsData.map((product) => product.user_id))];

	// Fetch user data for all product owners in a single query
	const { data: usersData, error: usersError } = await supabase
		.from('users')
		.select('*')
		.in('id', userIds);

	if (usersError) {
		throw error(500, 'Error fetching user data');
	}

	// Create a map of user IDs to user data for quick lookup
	const userMap = (usersData || []).reduce((map, user) => {
		map[user.id] = user;
		return map;
	}, {});

	// Add owner data and quantity to each product
	const productsWithOwners = productsData.map((product) => ({
		...product,
		owner: userMap[product.user_id] || null,
		quantity: productQuantities[product.id] || 1
	}));

	return { products: productsWithOwners };
};
