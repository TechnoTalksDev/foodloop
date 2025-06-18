<script>
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Leaf, ShoppingBasket, CreditCard, ExternalLink } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Separator from '$lib/components/ui/separator';

	// Sample cart items
	const cartItems = [
		{
			id: 1,
			name: 'Fresh Bread Bundle',
			business: 'Fresh Harvest Bakery',
			image: '',
			price: 4.5,
			originalPrice: 9.0,
			quantity: 1
		},
		{
			id: 2,
			name: 'Seasonal Produce Box',
			business: 'Green Garden Market',
			image: '',
			price: 7.25,
			originalPrice: 12.0,
			quantity: 1
		}
	];

	// Calculate cart totals - fixed by using regular let variables instead of $derived
	let subtotal = 0;
	let discount = 0;
	let serviceFee = 0.99;
	let total = 0;

	// Calculate totals
	$: {
		subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
		discount = cartItems.reduce(
			(sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
			0
		);
		total = subtotal + serviceFee;
	}

	// Payment gateway URLs
	const paymentGateways = [
		{
			name: 'PayPal',
			icon: '/paypal-logo.svg',
			url: 'https://www.paypal.com/signin',
			description: 'Pay securely using your PayPal account'
		},
		{
			name: 'Stripe',
			icon: '/stripe-logo.svg',
			url: 'https://dashboard.stripe.com/login',
			description: 'Fast and secure credit card processing'
		},
		{
			name: 'Venmo',
			icon: '/venmo-logo.svg',
			url: 'https://id.venmo.com/signin?country.x=US&locale.x=en&ctxId=AAGsbXo4GBNisuXoUw7d-L6LRjPaOFqdncgJDfJfT6MWW4WqYL-aC-AHV2vPy-hSkGEcQFBxehzVGzCRXpHNKsg=#/lgn',
			description: 'Split payments easily with friends'
		}
	];
</script>

<svelte:head>
	<title>Checkout | FoodLoop</title>
	<meta
		name="description"
		content="Complete your FoodLoop order and rescue delicious food from waste."
	/>
</svelte:head>

<div class="bg-white py-12 md:py-16">
	<div class="container mx-auto px-4">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold tracking-tight md:text-4xl">Checkout</h1>
			<p class="mt-2 text-gray-600">Complete your order and get ready to rescue food</p>
		</div>

		<div class="mx-auto max-w-3xl">
			<!-- Payment Options -->
			<Card.Root class="overflow-hidden rounded-xl border-0 shadow-lg">
				<Card.Header class="border-b border-green-100 bg-green-50">
					<Card.Title class="flex items-center text-xl font-bold text-gray-900">
						<CreditCard class="mr-2 h-5 w-5 text-green-600" />
						Select Payment Method
					</Card.Title>
					<Card.Description class="text-green-800">
						Choose how you'd like to pay for your order
					</Card.Description>
				</Card.Header>
				<Card.Content class="p-6">
					<div class="space-y-4">
						{#each paymentGateways as gateway}
							<a href={gateway.url} target="_blank" rel="noopener noreferrer" class="block">
								<div
									class="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:border-green-300 hover:bg-green-50"
								>
									<div class="flex items-center">
										<div class="flex h-12 w-12 items-center justify-center rounded-md">
											{#if gateway.icon}
												<img src={gateway.icon} alt={gateway.name} class="h-8 w-8" />
											{:else}
												<div class="rounded-full bg-green-100 p-2">
													<CreditCard class="h-5 w-5 text-green-600" />
												</div>
											{/if}
										</div>
										<div class="ml-4">
											<h3 class="text-base font-medium">{gateway.name}</h3>
											<p class="text-sm text-gray-500">{gateway.description}</p>
										</div>
									</div>
									<div>
										<ExternalLink class="h-5 w-5 text-gray-400" />
									</div>
								</div>
							</a>
						{/each}
					</div>

					<!-- Impact Message -->
					<div class="mt-8 rounded-lg bg-green-50 p-4">
						<div class="flex items-start">
							<div class="mr-3 mt-0.5 rounded-full bg-green-100 p-1">
								<Leaf class="h-4 w-4 text-green-600" />
							</div>
							<div>
								<h4 class="text-sm font-medium text-green-800">Your Impact</h4>
								<p class="text-sm text-green-700">
									By rescuing these items, you're preventing approximately 2.5kg of CO₂ emissions
								</p>
							</div>
						</div>
					</div>

					<!-- Return to Cart Button -->
					<div class="mt-6">
						<a
							href="/portal/cart"
							class="inline-flex items-center text-green-600 hover:text-green-700"
						>
							<span class="rotate-180 transform">
								<ExternalLink class="mr-1 h-4 w-4" />
							</span>
							Return to cart
						</a>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
