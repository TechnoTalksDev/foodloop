import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function addToCart(productId: string) {
	console.log(`Adding ${productId} to cart`)
	await fetch(`/portal/cart/add/${productId}`, {
		method: 'POST',
	});
}