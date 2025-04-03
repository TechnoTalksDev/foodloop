<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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
	$: total = data.products
		.reduce((sum, product) => {
			const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ''));
			return sum + price * (product.quantity || 1);
		}, 0)
		.toFixed(2);

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
			<div class="mb-12 text-center" in:fade={{ duration: 600 }}>
				<h1 class="mb-3 flex items-center justify-center text-3xl font-bold text-gray-800">
					<ShoppingCart class="animate-bounce-slow mr-3 h-8 w-8 text-green-600" />
					Your Cart
				</h1>
				<p class="mx-auto max-w-xl text-gray-600">
					Review your selected items before checkout. Rescue delicious food, save money, and help
					the planet!
				</p>
			</div>

			{#if data.products.length === 0}
				<div
					class="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm"
					in:scale={{ duration: 400, delay: 200, start: 0.9 }}
				>
					<ShoppingCart class="mx-auto mb-4 h-16 w-16 text-gray-300" />
					<h2 class="mb-2 text-xl font-medium text-gray-700">Your cart is empty</h2>
					<p class="mb-6 text-gray-500">
						Browse local businesses to find great deals on surplus food
					</p>
					<Button href="/portal" class="bg-green-600 hover:bg-green-700">Find Food Deals</Button>
				</div>
			{:else}
				<div class="mb-8 grid grid-cols-1 gap-6">
					{#each data.products as product, index}
						<div
							in:fly={{ y: 20, duration: 400, delay: 200 + index * 100 }}
							class="transform transition-all duration-300 hover:scale-[1.01]"
						>
							<Card.Root
								class="overflow-hidden border-gray-200 transition-all duration-300 hover:border-green-300 hover:shadow-md"
							>
								<div class="flex flex-col md:flex-row">
									<div class="flex items-center justify-center bg-green-50 p-4 md:w-1/4">
										{#if product.image_url}
											<img
												src={product.image_url}
												alt={product.name}
												class="h-48 w-full rounded-lg object-cover md:h-40 md:w-40"
											/>
										{:else}
											<div
												class="flex h-48 w-full items-center justify-center rounded-lg bg-gray-200 md:h-40 md:w-40"
											>
												<ShoppingCart class="h-12 w-12 text-gray-400" />
											</div>
										{/if}
									</div>
									<div class="p-6 md:w-2/4">
										<Card.Header class="px-0 pt-0">
											<div class="mb-1 flex items-center">
												<Leaf class="mr-2 h-4 w-4 text-green-600" />
												<p class="text-sm font-medium text-green-600">Saved from waste</p>
											</div>
											<Card.Title class="text-xl">
												<a
													href="/portal/product/{product.id}"
													class="text-gray-800 transition-colors hover:text-green-600"
												>
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
														<CalendarClock class="mr-2 h-4 w-4 text-gray-500" />
														<span>Expires: {product.expiry}</span>
													</div>
												{/if}
												{#if product.location}
													<div class="flex items-center text-sm text-gray-700">
														<MapPin class="mr-2 h-4 w-4 text-gray-500" />
														<span>{product.location}</span>
													</div>
												{/if}
												{#if product.tags}
													<div class="col-span-2 flex items-center text-sm text-gray-700">
														<Tag class="mr-2 h-4 w-4 text-gray-500" />
														<span>{product.tags}</span>
													</div>
												{/if}
											</div>

											<div class="mt-4 flex flex-wrap items-center gap-6">
												<div>
													<p class="mb-1 text-sm text-gray-600">Available</p>
													<p class="font-medium">{product.amount}</p>
												</div>

												<div>
													<p class="mb-1 text-sm text-gray-600">Quantity</p>
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

									<div
										class="flex flex-col justify-between border-t border-gray-200 bg-gray-50 p-6 md:w-1/4 md:border-l md:border-t-0 md:bg-white"
									>
										<div>
											<p class="mb-2 text-2xl font-bold text-green-600">
												{product.price}
											</p>
											<div class="mb-4 flex items-center gap-2">
												<Avatar.Root class="h-8 w-8">
													{#if product.owner && product.owner.avatar}
														<Avatar.Image
															src={product.owner.avatar}
															alt={product.owner.username || product.owner.name || 'User'}
														/>
													{:else}
														<Avatar.Fallback>
															{product.owner && (product.owner.username || product.owner.name)
																? (product.owner.username || product.owner.name)
																		.slice(0, 2)
																		.toUpperCase()
																: 'UN'}
														</Avatar.Fallback>
													{/if}
												</Avatar.Root>
												<p class="text-sm text-gray-700">
													{product.owner
														? product.owner.username || product.owner.name
														: 'Unknown Seller'}
												</p>
											</div>
										</div>

										<div>
											<Button
												variant="outline"
												class="w-full border-red-200 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50"
												on:click={() => clearCart(product.id.toString())}
											>
												<Trash2 class="mr-2 h-4 w-4" /> Remove
											</Button>
										</div>
									</div>
								</div>
							</Card.Root>
						</div>
					{/each}
				</div>

				<!-- Cart summary -->
				<div class="mx-auto max-w-3xl" in:fly={{ y: 30, duration: 500, delay: 500 }}>
					<Card.Root class="border-green-200 bg-white">
						<Card.Header>
							<Card.Title class="flex items-center text-xl">
								<ShoppingCart class="mr-2 h-5 w-5 text-green-600" />
								Order Summary
							</Card.Title>
							<Card.Description>
								You're about to rescue {totalItems}
								{totalItems === 1 ? 'item' : 'items'} from going to waste!
							</Card.Description>
						</Card.Header>
						<Card.Content>
							<div class="space-y-3 border-b border-t border-gray-100 py-4">
								{#each data.products as product}
									<div class="flex justify-between text-sm">
										<span class="text-gray-600">
											{product.quantity || 1} × {product.name}
										</span>
										<span class="font-medium">
											{parseFloat(product.price.replace(/[^0-9.-]+/g, '')) *
												(product.quantity || 1)}€
										</span>
									</div>
								{/each}
							</div>

							<div class="mt-4 flex justify-between text-lg font-bold">
								<span>Total</span>
								<span class="text-green-600">{total}€</span>
							</div>
						</Card.Content>
						<Card.Footer class="flex flex-col gap-3 sm:flex-row">
							<Button class="bg-green-600 transition-colors hover:bg-green-700 sm:flex-1">
								<BadgeCheck class="mr-2 h-5 w-5" /> Checkout
							</Button>
							<Button variant="outline" class="sm:flex-1" on:click={() => clearCart()}>
								<Trash2 class="mr-2 h-5 w-5" /> Clear Cart
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
