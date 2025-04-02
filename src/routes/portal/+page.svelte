<script lang="ts">
	import type { PageProps } from './$types';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { addToCart } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { ShoppingBasket, ShoppingCart, Tag, Calendar, MapPin, Clock } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut } from 'svelte/easing';
	
	let { data }: PageProps = $props();
	let visible = false;
	
	// Animation on mount
	onMount(() => {
		visible = true;
	});
</script>

<svelte:head>
	<title>FoodLoop | Product Portal</title>
	<meta
		name="description"
		content="Browse available food deals on FoodLoop. Save food, save money, and help the environment."
	/>
</svelte:head>

<!-- Header section -->
<section class="relative bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div class="max-w-3xl mx-auto space-y-6 text-center mb-8">
				<h1 
					class="text-4xl font-bold tracking-tight md:text-5xl"
					in:fly={{ y: -30, duration: 800, easing: elasticOut }}
				>
					Available <span class="text-green-600">Food Deals</span>
				</h1>

				<p 
					class="mx-auto text-lg text-muted-foreground"
					in:fade={{ duration: 800, delay: 400 }}
				>
					Browse through our selection of surplus food items from local businesses at discounted prices.
				</p>
			</div>
		{/if}
	</div>
</section>

<!-- Products Grid -->
<section class="py-8 mb-20">
	<div class="container mx-auto px-4">
		{#if data}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{#each data.products as product, i}
					{#if visible}
						<div 
							in:fly={{ y: 40, duration: 600, delay: 200 + i * 100 }}
						>
							<Card.Root 
							class="overflow-hidden border border-green-100 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-102"
						>
							<div class="relative">
								<img 
									src={product.image_url} 
									alt={product.name} 
									class="w-full h-48 object-cover"
								/>
								<div class="absolute top-3 right-3 bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
									{product.price}
								</div>
							</div>
							
							<Card.Header>
								<Card.Title class="text-xl">
									<a 
										href="/portal/product/{product.id}" 
										class="text-gray-800 hover:text-green-600 transition-colors duration-200"
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
										<MapPin class="h-4 w-4 mr-2 text-green-600" />
										<span>{product.location}</span>
									</div>
									
									<div class="flex items-center text-gray-600">
										<Calendar class="h-4 w-4 mr-2 text-green-600" />
										<span>Expires: {product.expiry}</span>
									</div>
									
									<div class="flex items-center text-gray-600">
										<Tag class="h-4 w-4 mr-2 text-green-600" />
										<span>{product.tags}</span>
									</div>
									
									<div class="flex items-center text-gray-600">
										<Clock class="h-4 w-4 mr-2 text-green-600" />
										<span>Amount: {product.amount}</span>
									</div>
								</div>
							</Card.Content>
							
							<Card.Footer class="flex justify-between items-center">
								<div class="flex flex-col">
									<span class="text-xs text-gray-500">Seller ID: {product.owner_id}</span>
									{#if product.trash}
										<span class="text-xs text-green-600">Rescued from waste!</span>
									{/if}
								</div>
								<div class="flex space-x-2">
									<Button
										variant="outline"
										class="border-green-200 hover:bg-green-50 hover:border-green-300"
										on:click={() => {
											addToCart(product.id);
											toast.success(`${product.name}`, {
												description: `has been added to cart`,
												action: {
													label: 'Go to Cart',
													onClick: () => goto("/portal/cart")
												}
											});
										}} 
										disabled={product.disabled ?? false}
									>
										<ShoppingCart class="h-4 w-4 mr-2" />
										Add to cart
									</Button>
									<Button class="bg-green-600 hover:bg-green-700">Buy now</Button>
								</div>
							</Card.Footer>
						</Card.Root>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div 
				class="flex flex-col items-center justify-center py-20"
				in:fade={{ duration: 500 }}
			>
				<ShoppingBasket class="h-16 w-16 text-green-600 mb-4 animate-bounce-slow" />
				<p class="text-xl text-muted-foreground">Loading products...</p>
			</div>
		{/if}
	</div>
</section>

<!-- CTA -->
<section class="mb-20 px-4">
	<div class="container mx-auto">
		{#if visible}
			<div
				class="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-2xl"
				in:scale={{ duration: 800, delay: 200, start: 0.9 }}
			>
				<div class="p-12 text-center text-white">
					<h2 class="mb-4 text-3xl font-bold">Can't find what you're looking for?</h2>
					<p class="mx-auto mb-8 max-w-2xl text-green-50">
						New items are added throughout the day as businesses list their surplus food. Check back later or set up notifications for your favorite sellers.
					</p>
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" class="bg-white text-green-600 hover:bg-gray-100">Set Up Alerts</Button>
						<Button size="lg" variant="outline" class="border-white text-white hover:bg-green-700">
							Browse By Category
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	/* Animation for slow bounce */
	@keyframes bounce-slow {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}
	
	.animate-bounce-slow {
		animation: bounce-slow 3s infinite ease-in-out;
	}
	
	/* Subtle hover scale */
	.hover\:scale-102:hover {
		transform: scale(1.02);
	}
</style>