<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { addToCart } from '$lib/utils';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut, cubicOut } from 'svelte/easing';

	// Import Lucide icons
	import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
	import CalendarClock from 'lucide-svelte/icons/calendar-clock';
	import Tag from 'lucide-svelte/icons/tag';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Package from 'lucide-svelte/icons/package';
	import Leaf from 'lucide-svelte/icons/leaf';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';

	export let data: PageProps['data'];

	let product = data.product;
	console.log(data.owner.username ?? data.owner.name);
	console.log(data.user?.user_metadata.name);

	// Format date nicely
	function formatDate(dateString: string): string {
		if (!dateString) return 'Not specified';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	// Animation control
	let visible = false;
	onMount(() => {
		visible = true;
	});

	// Handle add to cart with animation
	let isAddingToCart = false;
	function handleAddToCart() {
		isAddingToCart = true;
		addToCart(product.id);
		setTimeout(() => {
			isAddingToCart = false;
		}, 1000);
	}

	// Parse tags if they're in JSON format
	let tags: string[] = [];
	try {
		if (product.tags && typeof product.tags === 'string') {
			tags = JSON.parse(product.tags);
		}
	} catch (e) {
		// If not valid JSON, try to split by commas
		if (product.tags && typeof product.tags === 'string') {
			tags = product.tags.split(',').map((tag) => tag.trim());
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div class="mb-8 text-center" in:fade={{ duration: 600 }}>
				<h1 class="mb-3 flex items-center justify-center text-3xl font-bold text-gray-800">
					<Leaf class="animate-bounce-slow mr-3 h-8 w-8 text-green-600" />
					Product Details
				</h1>
				<p class="mx-auto max-w-xl text-gray-600">
					Rescue this delicious food item, save money, and help the planet!
				</p>
			</div>

			<div class="mx-auto max-w-4xl">
				<div
					class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:shadow-lg"
					in:fly={{ y: 30, duration: 600, delay: 200 }}
				>
					<!-- Product Header -->
					<div class="border-b border-gray-100 bg-gradient-to-r from-green-50 to-white p-6">
						<div class="mb-2 flex items-center">
							<Badge
								variant="outline"
								class="border-green-200 bg-green-100 text-green-800 hover:bg-green-200"
							>
								<Leaf class="mr-1 h-3 w-3" />
								Food Rescue
							</Badge>
						</div>
						<h1 class="text-2xl font-bold text-gray-800">{product.name}</h1>
						<p class="mt-2 text-gray-600">{product.description}</p>
					</div>

					<!-- Product content in two columns on larger screens -->
					<div class="flex flex-col md:flex-row">
						<!-- Product image column -->
						<div class="p-6 md:w-2/5" in:fly={{ x: -20, duration: 500, delay: 400 }}>
							{#if product.image_url}
								<div
									class="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
								>
									<img
										src={product.image_url}
										alt={product.name}
										class="h-full w-full object-cover"
									/>
								</div>
							{:else}
								<div
									class="flex h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow-md"
								>
									<Package class="h-16 w-16 text-gray-400" />
								</div>
							{/if}

							<!-- Owner info -->
							<div
								class="mt-6 flex items-center rounded-lg bg-gray-50 p-4"
								in:scale={{ duration: 400, delay: 800, start: 0.8 }}
							>
								<Avatar.Root class="h-12 w-12 border-2 border-green-100">
									{#if data.owner.avatar}
										<Avatar.Image
											src={data.owner.avatar}
											alt={data.owner.username ?? data.owner.name}
										/>
									{:else}
										<Avatar.Fallback class="bg-green-100 text-green-800">
											{(data.owner.username ?? data.owner.name).slice(0, 2).toUpperCase()}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>
								<div class="ml-4">
									<p class="text-sm text-gray-500">Offered by</p>
									<p class="font-medium text-gray-800">{data.owner.username ?? data.owner.name}</p>
								</div>
							</div>
						</div>

						<!-- Product details column -->
						<div
							class="border-gray-100 p-6 md:w-3/5 md:border-l"
							in:fly={{ x: 20, duration: 500, delay: 500 }}
						>
							<!-- Price -->
							<div class="mb-6">
								<h2 class="flex items-center text-3xl font-bold text-green-600">
									<DollarSign class="mr-1 h-6 w-6" />
									{product.price}
								</h2>
								<p class="text-sm text-gray-500">Discounted price to prevent food waste</p>
							</div>

							<!-- Product details in a grid -->
							<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="flex items-start">
									<Package class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
									<div>
										<p class="text-sm text-gray-500">Quantity Available</p>
										<p class="font-medium">
											{product.amount} unit{product.amount !== 1 ? 's' : ''}
										</p>
									</div>
								</div>

								<div class="flex items-start">
									<MapPin class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
									<div>
										<p class="text-sm text-gray-500">Pickup Location</p>
										<p class="font-medium">{product.location || 'Contact seller'}</p>
									</div>
								</div>

								<div class="flex items-start">
									<CalendarClock class="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
									<div>
										<p class="text-sm text-gray-500">Expiry Date</p>
										<p class="font-medium">{formatDate(product.expiry)}</p>
									</div>
								</div>
							</div>

							<!-- Tags -->
							{#if tags.length > 0}
								<div class="mb-6">
									<div class="mb-2 flex items-center">
										<Tag class="mr-2 h-4 w-4 text-green-600" />
										<p class="text-sm font-medium text-gray-600">Tags</p>
									</div>
									<div class="flex flex-wrap gap-2">
										{#each tags as tag}
											<Badge
												variant="outline"
												class="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
											>
												{tag}
											</Badge>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Call to action buttons -->
							<div
								class="mt-8 flex flex-col gap-3 sm:flex-row"
								in:scale={{ duration: 500, delay: 900, start: 0.8 }}
							>
								<Button
									on:click={handleAddToCart}
									variant="outline"
									class="flex-1 border border-green-200 bg-white text-green-700 hover:bg-green-50"
									disabled={isAddingToCart}
								>
									{#if isAddingToCart}
										<svg
											class="-ml-1 mr-2 h-4 w-4 animate-spin text-green-600"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Adding...
									{:else}
										<ShoppingCart class="mr-2 h-5 w-5" />
										Add to Cart
									{/if}
								</Button>

								<Button variant="default" class="flex-1 bg-green-600 text-white hover:bg-green-700">
									<ShoppingBag class="mr-2 h-5 w-5" />
									Buy Now
								</Button>
							</div>

							<!-- Environmental impact -->
							<div
								class="mt-8 rounded-lg border border-green-100 bg-green-50 p-4"
								in:fade={{ duration: 400, delay: 1000 }}
							>
								<h3 class="mb-2 flex items-center font-medium text-green-800">
									<Leaf class="mr-2 h-4 w-4" />
									Environmental Impact
								</h3>
								<p class="text-sm text-green-700">
									By purchasing this item, you're helping save approximately
									<span class="font-bold">{Math.round(product.amount * 1.2 * 10) / 10} kg</span>
									of CO₂ emissions and preventing perfectly good food from going to waste.
								</p>
							</div>
						</div>
					</div>

					<!-- Similar products suggestion -->
					<div
						class="border-t border-gray-100 bg-gray-50 p-6"
						in:fly={{ y: 20, duration: 400, delay: 1100 }}
					>
						<div class="mb-3 flex items-center justify-between">
							<h3 class="font-medium text-gray-800">You might also like</h3>
							<a href="/portal" class="text-sm font-medium text-green-600 hover:text-green-700">
								View all deals →
							</a>
						</div>
						<p class="text-sm text-gray-600">
							Explore more food rescue opportunities to maximize your environmental impact.
						</p>
					</div>
				</div>

				<!-- Back button -->
				<div class="mt-6 flex justify-center">
					<a
						href="/portal"
						class="flex items-center text-sm font-medium text-green-600 hover:text-green-700"
					>
						← Back to all products
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Animation for slow bounce */
	@keyframes bounce-slow {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	.animate-bounce-slow {
		animation: bounce-slow 2s infinite ease-in-out;
	}
</style>
