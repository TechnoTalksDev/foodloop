<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { 
		ShoppingBasket, 
		ShoppingCart, 
		Tag, 
		Calendar, 
		MapPin, 
		Clock, 
		Plus, 
		BarChart, 
		User,
		History 
	} from 'lucide-svelte';
	import { addToCart } from '$lib/utils';
	import type { PageProps } from './$types';

	// Sample data
	/*
	let data = {
		products: [
			{
				id: '1',
				name: 'Organic Bread Bundle',
				description: 'Pack of 2 fresh sourdough loaves from local bakery',
				image_url: '/images/bread.jpg',
				price: '$3.99',
				location: 'Downtown Bakery',
				expiry: 'Apr 4, 2025',
				tags: 'Bakery, Organic',
				amount: '2 loaves',
				owner_id: 'BK102',
				trash: true
			},
			{
				id: '2',
				name: 'Fresh Produce Box',
				description: 'Mixed vegetables and fruits, slightly bruised but perfect for cooking',
				image_url: '/images/produce.jpg',
				price: '$5.50',
				location: 'Green Market',
				expiry: 'Apr 5, 2025',
				tags: 'Produce, Vegetables',
				amount: '3kg box',
				owner_id: 'GM205',
				trash: false
			},
			{
				id: '3',
				name: 'Dairy Collection',
				description: 'Assorted yogurts and cheese approaching best-by date',
				image_url: '/images/dairy.jpg',
				price: '$4.25',
				location: 'Creamery Co-op',
				expiry: 'Apr 3, 2025',
				tags: 'Dairy, Refrigerated',
				amount: '5 items',
				owner_id: 'CC089',
				trash: true
			}
		]
	};
	*/
	let { data }: PageProps = $props();
	$inspect(data);
	let visible = true;
	let loaded = false;

	// Cart state
	let cartCount = 0;
	
	// Simple add to cart function
	function handleAddToCart(productId: any) {
		console.log(`Added product ${productId} to cart`);
		// Show toast notification
		addToCart(productId);
		cartCount++;
		console.log("Trying to toast");
	}

	// Handle buy now action
	function handleBuyNow() {
		window.location.href = '/portal/checkout';
	}

	// Navigation functions
	function navigateTo(path: string) {
		goto(path);
	}

</script>

<svelte:head>
	<title>FoodLoop | Product Portal</title>
	<meta
		name="description"
		content="Browse available food deals on FoodLoop. Save food, save money, and help the environment."
	/>
</svelte:head>

<!-- Cart Indicator -->
{#if cartCount > 0}
<div class="fixed top-4 right-4 z-50 flex items-center gap-2" transition:fly={{ y: -20, duration: 300 }}>
	<div class="rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">
		<span class="flex items-center">
			<ShoppingCart class="mr-1 h-4 w-4" />
			{cartCount}
		</span>
	</div>
</div>
{/if}

<!-- Header section -->
<section class="relative bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div class="mx-auto mb-8 max-w-3xl space-y-6 text-center">
				<h1
					class="text-4xl font-bold tracking-tight md:text-5xl"
					in:fly={{ y: -30, duration: 800, easing: elasticOut }}
				>
					Available <span class="text-green-600">Food Deals</span>
				</h1>

				<p class="mx-auto text-lg text-muted-foreground" in:fade={{ duration: 800, delay: 400 }}>
					Browse through our selection of surplus food items from local businesses at discounted
					prices.
				</p>
			</div>
		{/if}
	</div>
</section>

<!-- Products Grid -->
<section class="mb-20 py-8">
	<div class="container mx-auto px-4">
		{#if data}
			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each data.products as product, i}
					{#if visible}
						<div in:fly={{ y: 40, duration: 600, delay: 200 + i * 100 }}>
							<Card.Root
								class="hover:scale-102 overflow-hidden border border-green-100 shadow-md transition-all duration-300 hover:shadow-xl"
							>
								<div class="relative">
									<img
										src={product.image_url}
										alt={product.name}
										class="h-48 w-full bg-gray-100 object-cover"
									/>
									<div
										class="absolute right-3 top-3 rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white"
									>
										${product.price}
									</div>
								</div>

								<Card.Header>
									<Card.Title class="text-xl">
										<a
											href="/portal/product/{product.id}"
											class="text-gray-800 transition-colors duration-200 hover:text-green-600"
										>
											{product.name}
										</a>
									</Card.Title>
									<Card.Description class="text-muted-foreground">
										{product.description}
									</Card.Description>
								</Card.Header>

								<Card.Content>
									<div class="space-y-3 text-sm">
										
										<div class="flex items-center text-gray-600">
											<MapPin class="mr-2 h-4 w-4 text-green-600" />
											<span>{product.location}</span>
										</div>

										<div class="flex items-center text-gray-600">
											<Calendar class="mr-2 h-4 w-4 text-green-600" />
											<span>Expires: {Date(product.expiry)}</span>
										</div>

										<div class="flex items-center text-gray-600">
											<Tag class="mr-2 h-4 w-4 text-green-600" />
											<span>{product.tags}</span>
										</div>

										<div class="flex items-center text-gray-600">
											<Clock class="mr-2 h-4 w-4 text-green-600" />
											<span>Amount: {product.amount}</span>
										</div>
									</div>
								</Card.Content>

								<Card.Footer class="flex items-center justify-between">
									<div class="flex space-x-2">
										<button
											class="flex items-center rounded-md border border-green-200 px-4 py-2 text-sm hover:border-green-300 hover:bg-green-50"
											onclick={() => {
												handleAddToCart(product.id)
												toast.success(`${product.name} added to cart`, {
													description: `$${product.price}`,
													action: {
														label: 'Go to Cart',
														onClick: () => {
															goto('/portal/cart');
														}
													}
												})
											}}
										>
											<ShoppingCart class="mr-2 h-4 w-4" />
											Add to cart
										</button>
										<button
											class="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
											onclick={() => handleBuyNow()}
										>
											Buy now
										</button>
									</div>
								</Card.Footer>
							</Card.Root>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-20" in:fade={{ duration: 500 }}>
				<ShoppingBasket class="animate-bounce-slow mb-4 h-16 w-16 text-green-600" />
				<p class="text-xl text-muted-foreground">Loading products...</p>
			</div>
		{/if}
	</div>
</section>

<!-- Action Buttons Grid (Replacement for CTA section) -->
<section class="mb-20 px-4">
	<div class="container mx-auto">
		{#if visible}
			<div 
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
				in:scale={{ duration: 800, delay: 200, start: 0.9 }}
			>
				<!-- Create Food Listing Button -->
				<div 
					class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
					onclick={() => navigateTo('/portal/create')}
				>
					<div class="p-8 text-center text-white flex flex-col items-center">
						<div class="rounded-full bg-white/20 p-4 mb-4">
							<Plus class="h-8 w-8" />
						</div>
						<h3 class="text-xl font-bold mb-2">Create Listing</h3>
						<p class="text-green-50 text-sm">Add your surplus food items</p>
					</div>
				</div>

				<!-- Impact Button -->
				<div 
					class="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
					onclick={() => navigateTo('/portal/impact')}
				>
					<div class="p-8 text-center text-white flex flex-col items-center">
						<div class="rounded-full bg-white/20 p-4 mb-4">
							<BarChart class="h-8 w-8" />
						</div>
						<h3 class="text-xl font-bold mb-2">Impact</h3>
						<p class="text-blue-50 text-sm">See your environmental impact</p>
					</div>
				</div>

				<!-- Cart Button -->
				<div 
					class="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
					onclick={() => navigateTo('/portal/cart')}
				>
					<div class="p-8 text-center text-white flex flex-col items-center">
						<div class="rounded-full bg-white/20 p-4 mb-4">
							<ShoppingCart class="h-8 w-8" />
						</div>
						<h3 class="text-xl font-bold mb-2">My Cart</h3>
						<p class="text-amber-50 text-sm">View your selected items</p>
					</div>
				</div>

				<!-- Profile Button -->
				<div 
					class="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
					onclick={() => navigateTo('/portal/profile')}
				>
					<div class="p-8 text-center text-white flex flex-col items-center">
						<div class="rounded-full bg-white/20 p-4 mb-4">
							<User class="h-8 w-8" />
						</div>
						<h3 class="text-xl font-bold mb-2">Profile</h3>
						<p class="text-purple-50 text-sm">Manage your account</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	/* Animation for slow bounce */
	@keyframes bounce-slow {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.animate-bounce-slow {
		animation: bounce-slow 3s infinite ease-in-out;
	}

	/* Subtle hover scale */
	.hover\:scale-102:hover {
		transform: scale(1.02);
	}
</style>