<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { backOut, elasticOut, cubicOut } from 'svelte/easing';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { onMount } from 'svelte';
	import ChefHat from 'lucide-svelte/icons/chef-hat';
	import ShoppingBasket from 'lucide-svelte/icons/shopping-basket';
	import Clock from 'lucide-svelte/icons/clock';
	import Utensils from 'lucide-svelte/icons/utensils';
	import ListChecks from 'lucide-svelte/icons/list-checks';
	import ShoppingCart from 'lucide-svelte/icons/shopping-cart';


	export let data: PageData;
	// RYAN FEED THIS TO THE AI, IT IS A ARRAY OF EVERY PRODUCT. 
	$: console.log(data.products);

	JSON.stringify(data.products);
	export let form: ActionData;

	// Define the recipe interface
	interface Recipe {
		name: string;
		ingredients: string[];
		instructions: string[];
		cookingTime: string;
		recommendedItems: string[];
	}

	// Animation control
	let visible = false;
	let isGenerating: boolean = false;

	// Example ingredient combinations
	const examples = [
		'chicken, tomatoes, basil, garlic',
		'salmon, lemon, dill, potatoes',
		'tofu, broccoli, soy sauce, ginger',
		'eggs, spinach, feta cheese, onions',
		'rice, beans, corn, bell peppers'
	];

	// For binding input value
	let inputValue = '';

	function useExample(example: string) {
		inputValue = example;
	}

	// Load animations when mounted
	onMount(() => {
		visible = true;
	});
</script>

<div
	class="relative min-h-screen overflow-hidden bg-gradient-to-b from-green-50 via-white to-green-50 py-12"
>
	<!-- Background animated elements -->
	<div class="absolute inset-0 -z-10 overflow-hidden">
		<div
			class="animate-pulse-slow absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-green-600/10 blur-3xl"
		></div>
		<div
			class="animate-float absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-green-800/10 blur-3xl"
		></div>
	</div>

	<div class="container mx-auto px-4">
		{#if visible}
			<div>
				<h1
					class="mb-4 text-center text-4xl font-bold text-gray-800 md:text-5xl"
					in:fly={{ y: -30, duration: 800, easing: elasticOut }}
				>
					<span
						class="inline-block transform text-green-600 transition-transform duration-300 hover:scale-110"
						in:scale={{ duration: 600, delay: 400, easing: backOut, start: 0.5 }}>Smart</span
					>Plate
				</h1>

				<p
					class="mx-auto mb-12 max-w-2xl text-center text-gray-600"
					in:fade={{ duration: 800, delay: 600 }}
				>
					Turn your available ingredients into delicious recipes instantly! Get creative meal ideas
					using what you already have in your kitchen.
				</p>

				<div
					class="mx-auto max-w-3xl transform overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg transition-all duration-500"
					in:scale={{ duration: 800, delay: 800, easing: cubicOut, start: 0.95 }}
				>
					<!-- Form -->
					<div class="p-6">
						<form
							method="POST"
							use:enhance={() => {
								isGenerating = true;

								return async ({ update }) => {
									isGenerating = false;
									await update();
								};
							}}
							class="space-y-6"
						>
							<div>
								<label
									for="ingredients"
									class="mb-2 block flex items-center font-medium text-gray-700"
								>
									<ChefHat class="mr-2 h-5 w-5 text-green-600" />
									What ingredients do you have?
								</label>

								<textarea
									id="ingredients"
									name="ingredients"
									bind:value={inputValue}
									rows="3"
									class="textarea-glow w-full rounded-md border border-gray-300 bg-gray-50 p-4 text-gray-800 focus:border-green-500 focus:outline-none focus:ring focus:ring-green-500/30"
									placeholder="e.g., chicken, broccoli, garlic, olive oil..."
									required
								></textarea>
							</div>

							<div class="rounded-md bg-green-50 p-4">
								<p class="mb-2 text-sm text-gray-600">Try one of these combinations:</p>
								<div class="flex flex-wrap gap-2">
									{#each examples as example, i}
										<button
											type="button"
											class="rounded-full border border-green-200 bg-white px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-green-100"
											on:click={() => useExample(example)}
											in:fade={{ delay: 900 + i * 100, duration: 400 }}
										>
											{example}
										</button>
									{/each}
								</div>
							</div>

							{#if form?.error}
								<div
									class="rounded-md bg-red-50 p-4 text-red-600"
									in:fly={{ y: 20, duration: 400 }}
								>
									{form.error}
									{#if form.details}
										<div class="mt-2 text-sm opacity-80">{form.details}</div>
									{/if}
								</div>
							{/if}

							<div class="flex justify-center">
								<button
									type="submit"
									disabled={isGenerating}
									class="button-glow flex items-center gap-2 rounded-md bg-green-600 px-8 py-3 font-medium text-white shadow-lg shadow-green-900/20 transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if isGenerating}
										<svg
											class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
										<span class="animate-pulse">Creating Recipe...</span>
									{:else}
										<ChefHat class="h-5 w-5" />
										Generate Recipe
									{/if}
								</button>
							</div>
						</form>
					</div>

					<!-- Recipe Section (shown after generation) -->
					{#if form?.success && form.recipe}
						<div
							class="border-t border-gray-200 bg-green-50/50 p-6"
							in:fly={{ y: 30, duration: 600, delay: 300 }}
						>
							<h2 class="mb-4 flex items-center text-2xl font-bold text-gray-800">
								<Utensils class="animate-bounce-gentle mr-2 h-6 w-6 text-green-600" />
								{form.recipe.name}
							</h2>

							<div
								class="mb-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-green-800"
							>
								<Clock class="mr-2 h-4 w-4" />
								<span class="text-sm">{form.recipe.cookingTime}</span>
							</div>

							<div class="mt-6 grid gap-6 md:grid-cols-2">
								<!-- Ingredients -->
								<div
									class="rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 hover:border-green-300"
									in:fly={{ x: -20, y: 0, duration: 400, delay: 400 }}
								>
									<h3 class="mb-2 border-b border-green-100 pb-2 font-semibold text-green-700">
										Ingredients
									</h3>
									<ul class="space-y-1">
										{#each form.recipe.ingredients as ingredient, i}
											<li
												class="flex items-start text-gray-700"
												in:fly={{ y: 10, duration: 300, delay: 600 + i * 50 }}
											>
												<span class="mr-2 text-green-500">•</span>
												{ingredient}
											</li>
										{/each}
									</ul>
								</div>

								<!-- Instructions -->
								<div
									class="rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 hover:border-green-300"
									in:fly={{ x: 20, y: 0, duration: 400, delay: 600 }}
								>
									<h3 class="mb-2 border-b border-green-100 pb-2 font-semibold text-green-700">
										Instructions
									</h3>
									<ol class="list-decimal space-y-3 pl-5">
										{#each form.recipe.instructions as instruction, i}
											<li
												class="text-gray-700"
												in:fly={{ y: 10, duration: 300, delay: 800 + i * 100 }}
											>
												{instruction}
											</li>
										{/each}
									</ol>
								</div>
							</div>

							<!-- Recommended Items -->
							<div
								class="mt-6 rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 hover:border-green-300"
								in:fly={{ y: 20, duration: 400, delay: 1000 }}
							>
								<h3 class="mb-3 flex items-center font-semibold text-green-700">
									<ShoppingBasket class="mr-2 h-5 w-5" />
									Complete Your Recipe With These Items
								</h3>
								<div class="flex flex-wrap gap-2">
									{#each form.recipe.recommendedItems as item, i}
										<div
											class="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-3 py-2 text-green-800 transition-colors hover:bg-green-100"
											in:scale={{ duration: 400, delay: 1100 + i * 100, start: 0.8 }}
										>
											<span>{item}</span>
										</div>
									{/each}
								</div>

								<div class="mt-4 flex justify-end">
									<a
										href="/"
										class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
										in:scale={{ duration: 400, delay: 1500, start: 0.8 }}
									>
										<ShoppingCart class="mr-2 h-4 w-4" />
										Find Ingredients on FoodLoop
									</a>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Additional Information -->
				<div class="mx-auto mt-12 max-w-3xl" in:fly={{ y: 50, duration: 600, delay: 1200 }}>
					<div class="grid gap-6 md:grid-cols-2">
						<div
							class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-green-300"
						>
							<h3 class="mb-3 flex items-center text-xl font-bold text-gray-800">
								<ChefHat class="mr-2 h-5 w-5 text-green-600" />
								How SmartPlate Works
							</h3>
							<p class="text-gray-600">
								Our AI analyzes your available ingredients and creates custom recipes tailored to
								what you have. Get creative meal ideas in seconds without needing to search through
								cookbooks or websites.
							</p>
						</div>

						<div
							class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-green-300"
						>
							<h3 class="mb-3 flex items-center text-xl font-bold text-gray-800">
								<ListChecks class="mr-2 h-5 w-5 text-green-600" />
								Reduce Food Waste
							</h3>
							<p class="text-gray-600">
								Use ingredients you already have to create delicious meals. SmartPlate helps reduce
								food waste by inspiring you to use what's in your kitchen before it expires.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Animation for slow pulse */
	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* Animation for floating */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}

	/* Animation for gentle bounce */
	@keyframes bounce-gentle {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-5px);
		}
	}

	.animate-pulse-slow {
		animation: pulse-slow 8s infinite ease-in-out;
	}

	.animate-float {
		animation: float 12s infinite ease-in-out;
	}

	.animate-bounce-gentle {
		animation: bounce-gentle 2s infinite ease-in-out;
	}

	/* Glowing effect for textarea on focus */
	.textarea-glow:focus {
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
	}

	/* Glowing effect for button on hover */
	.button-glow:hover {
		box-shadow: 0 0 25px rgba(34, 197, 94, 0.4);
	}
</style>
