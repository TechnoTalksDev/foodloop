<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from "$lib/components/ui/input/index.js";
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut, cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import BadgeCheck from 'lucide-svelte/icons/badge-check';
	import CalendarClock from 'lucide-svelte/icons/calendar-clock';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Tag from 'lucide-svelte/icons/tag';
	import Leaf from 'lucide-svelte/icons/leaf';
	
	// Define proper interfaces for the data types
	interface Owner {
		avatar: string;
		username?: string;
		name: string;
	}
	
	interface Product {
		id: number;
		name: string;
		description: string;
		price: string;
		image_url: string;
		amount: number;
		location: string;
		expiry: string;
		trash: string;
		tags: string;
		owner: Owner;
		quantity: number;
	}
	
	interface PageData {
		products: Product[];
	}
	
	// Use export let data to properly receive the data as a prop
	export let data: PageData;
	
	// Animation control
	let visible = false;
	onMount(() => {
		visible = true;
	});
	
	// Ensure total calculation has proper type handling
	$: total = data.products.reduce((sum, product) => {
		const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
		return sum + (price * (product.quantity || 1));
	}, 0).toFixed(2);
	
	$: totalItems = data.products.reduce((sum, product) => sum + (product.quantity || 1), 0);

	async function clearCart(id: string = '') {
		if (id !== '') {
			data = { 
				...data, 
				products: data.products.filter((product) => product.id !== Number(id)) 
			};
		} else {
			data = { ...data, products: [] };
		}

		await fetch(`/portal/cart/clear/${id}`, {
			method: 'POST'
		});
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div 
				class="mb-12 text-center"
				in:fade={{ duration: 600 }}
			>
				<h1 class="text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center">
					<ShoppingCart class="h-8 w-8 text-green-600 mr-3 animate-bounce-slow" />
					Your Cart
				</h1>
				<p class="text-gray-600 max-w-xl mx-auto">
					Review your selected items before checkout. Rescue delicious food, save money, and help the planet!
				</p>
			</div>
			
			{#if data.products.length === 0}
				<div 
					class="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto"
					in:scale={{ duration: 400, delay: 200, start: 0.9 }}
				>
					<ShoppingCart class="h-16 w-16 text-gray-300 mx-auto mb-4" />
					<h2 class="text-xl font-medium text-gray-700 mb-2">Your cart is empty</h2>
					<p class="text-gray-500 mb-6">Browse local businesses to find great deals on surplus food</p>
					<Button href="/portal" class="bg-green-600 hover:bg-green-700">Find Food Deals</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-6 mb-8">
					{#each data.products as product, index}
						<div 
							in:fly={{ y: 20, duration: 400, delay: 200 + index * 100 }}
							class="transform transition-all duration-300 hover:scale-[1.01]"
						>
							<Card.Root class="overflow-hidden border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300">
								<div class="flex flex-col md:flex-row">
									<div class="md:w-1/4 p-4 flex items-center justify-center bg-green-50">
										{#if product.image_url}
											<img 
												src={product.image_url} 
												alt={product.name} 
												class="rounded-lg h-48 w-full object-cover md:h-40 md:w-40"
											/>
										{:else}
											<div class="rounded-lg h-48 w-full bg-gray-200 md:h-40 md:w-40 flex items-center justify-center">
												<ShoppingCart class="h-12 w-12 text-gray-400" />
											</div>
										{/if}
									</div>
									<div class="md:w-2/4 p-6">
										<Card.Header class="px-0 pt-0">
											<div class="flex items-center mb-1">
												<Leaf class="h-4 w-4 text-green-600 mr-2" />
												<p class="text-sm text-green-600 font-medium">Saved from waste</p>
											</div>
											<Card.Title class="text-xl">
												<a href="/portal/product/{product.id}" class="text-gray-800 hover:text-green-600 transition-colors">
													{product.name}
												</a>
											</Card.Title>
											<Card.Description class="text-gray-600">
												{product.description}
											</Card.Description>
										</Card.Header>
										<Card.Content class="px-0 py-4">
											<div class="grid grid-cols-2 gap-3">
												{#if product.expiry}
													<div class="flex items-center text-sm text-gray-700">
														<CalendarClock class="h-4 w-4 text-gray-500 mr-2" />
														<span>Expires: {product.expiry}</span>
													</div>
												{/if}
												{#if product.location}
													<div class="flex items-center text-sm text-gray-700">
														<MapPin class="h-4 w-4 text-gray-500 mr-2" />
														<span>{product.location}</span>
													</div>
												{/if}
												{#if product.tags}
													<div class="col-span-2 flex items-center text-sm text-gray-700">
														<Tag class="h-4 w-4 text-gray-500 mr-2" />
														<span>{product.tags}</span>
													</div>
												{/if}
											</div>
											
											<div class="mt-4 flex flex-wrap items-center gap-6">
												<div>
													<p class="text-sm text-gray-600 mb-1">Available</p>
													<p class="font-medium">{product.amount}</p>
												</div>
												
												<div>
													<p class="text-sm text-gray-600 mb-1">Quantity</p>
													<div class="flex items-center">
														<Input 
															type="number" 
															bind:value={product.quantity} 
															min="1" 
															max={product.amount}
															class="w-20 border-gray-300 focus:border-green-500" 
														/>
													</div>
												</div>
											</div>
										</Card.Content>
									</div>
									
									<div class="md:w-1/4 p-6 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col justify-between bg-gray-50 md:bg-white">
										<div>
											<p class="text-2xl font-bold text-green-600 mb-2">
												{product.price}
											</p>
											<div class="flex items-center gap-2 mb-4">
												<Avatar.Root class="h-8 w-8">
													{#if product.owner && product.owner.avatar}
														<Avatar.Image
															src={product.owner.avatar}
															alt={(product.owner.username || product.owner.name) || "User"}
														/>
													{:else}
														<Avatar.Fallback>
															{product.owner && (product.owner.username || product.owner.name) 
																? (product.owner.username || product.owner.name).slice(0, 2).toUpperCase() 
																: "UN"}
														</Avatar.Fallback>
													{/if}
												</Avatar.Root>
												<p class="text-sm text-gray-700">
													{product.owner ? (product.owner.username || product.owner.name) : "Unknown Seller"}
												</p>
											</div>
										</div>
										
										<div>
											<Button
												variant="outline"
												class="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
												on:click={() => clearCart(product.id.toString())}
											>
												<Trash2 class="h-4 w-4 mr-2" /> Remove
											</Button>
										</div>
									</div>
								</div>
							</Card.Root>
						</div>
					{/each}
				</div>
				
				<!-- Cart summary -->
				<div 
					class="max-w-3xl mx-auto"
					in:fly={{ y: 30, duration: 500, delay: 500 }}
				>
					<Card.Root class="border-green-200 bg-white">
						<Card.Header>
							<Card.Title class="text-xl flex items-center">
								<ShoppingCart class="h-5 w-5 text-green-600 mr-2" />
								Order Summary
							</Card.Title>
							<Card.Description>
								You're about to rescue {totalItems} {totalItems === 1 ? 'item' : 'items'} from going to waste!
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="border-t border-b border-gray-100 py-4 space-y-3">
								{#each data.products as product}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">
											{product.quantity || 1} × {product.name}
										</span>
										<span class="font-medium">
											{parseFloat(product.price.replace(/[^0-9.-]+/g, '')) * (product.quantity || 1)}€
										</span>
									</div>
								{/each}
							</div>
							
							<div class="flex justify-between mt-4 text-lg font-bold">
								<span>Total</span>
								<span class="text-green-600">{total}€</span>
							</div>
						</Card.Content>
						<Card.Footer class="flex flex-col sm:flex-row gap-3">
							<Button class="sm:flex-1 bg-green-600 hover:bg-green-700 transition-colors">
								<BadgeCheck class="h-5 w-5 mr-2" /> Checkout
							</Button>
							<Button 
								variant="outline" 
								class="sm:flex-1"
								on:click={() => clearCart()}
							>
								<Trash2 class="h-5 w-5 mr-2" /> Clear Cart
							</Button>
						</Card.Footer>
					</Card.Root>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	/* Animation for slow bounce */
	@keyframes bounce-slow {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
	}
	
	.animate-bounce-slow {
		animation: bounce-slow 2s infinite ease-in-out;
	}
</style>