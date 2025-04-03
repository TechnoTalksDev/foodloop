<script>
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import {
		ShoppingBasket,
		Leaf,
		ArrowRight,
		Building,
		User,
		Earth,
		Clock,
		ChefHat
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut } from 'svelte/easing';


	// Success metrics
	const metrics = [
		{ value: '2.5M+', label: 'Meals Saved' },
		{ value: '€4.8M', label: 'Consumer Savings' },
		{ value: '1,200+', label: 'Partner Businesses' },
		{ value: '8,500+', label: 'Tonnes CO₂ Prevented' }
	];

	// How it works steps
	const howItWorks = [
		{
			icon: Building,
			title: 'Businesses list surplus',
			description: 'Local businesses post available surplus food at discounted prices'
		},
		{
			icon: User,
			title: 'Consumers browse & reserve',
			description: 'Find deals nearby, pay through the app, and schedule pickup'
		},
		{
			icon: Clock,
			title: 'Pick up your order',
			description: 'Visit during the designated time window to collect your food'
		},
		{
			icon: Earth,
			title: 'Reduce food waste',
			description: 'Enjoy delicious food while helping the environment'
		}
	];

	// Animation controls
	let visible = false;

	// Animation on mount
	onMount(() => {
		visible = true;
	});
</script>

<svelte:head>
	<title>FoodLoop | Save Food. Save Money. Save the Planet.</title>
	<meta
		name="description"
		content="FoodLoop connects consumers with local businesses to purchase surplus food at discounted prices, reducing food waste and helping the environment."
	/>
</svelte:head>

<!-- Hero section -->
<section class="relative bg-gradient-to-b from-green-50 to-white py-24">
	<div class="container mx-auto flex flex-col items-center text-center">
		{#if visible}
			<div class="max-w-3xl space-y-6">
				<div
					class="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
					in:fade={{ duration: 500, delay: 200 }}
				>
					<Leaf class="mr-1 h-4 w-4" />
					Fighting Food Waste Together
				</div>

				<h1
					class="text-4xl font-bold tracking-tight md:text-5xl"
					in:fly={{ y: -30, duration: 800, easing: elasticOut }}
				>
					Rescue Delicious Food, <span class="text-green-600">Save Money</span> & Our Planet
				</h1>

				<p class="mx-auto text-lg text-muted-foreground" in:fade={{ duration: 800, delay: 400 }}>
					Connect with local businesses offering surplus food at great discounts. Enjoy quality
					meals while reducing food waste and your environmental footprint.
				</p>

				<div
					class="flex flex-col justify-center gap-4 sm:flex-row"
					in:fade={{ duration: 800, delay: 600 }}
				>
					<Button size="lg" class="bg-green-600 hover:bg-green-700">
						Find Food Deals Near You
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</div>

				<div
					in:scale={{ duration: 700, delay: 800, start: 0.5, easing: backOut }}
					class="mt-5 flex flex-col justify-center gap-4 sm:flex-row"
				>
					<a
						href="/auth/login"
						class="inline-flex items-center font-medium text-green-600 hover:text-green-700"
					>
						<User class="mr-2 h-5 w-5" />
						Log In
					</a>
					<a
						href="/smartplate"
						class="inline-flex items-center font-medium text-green-600 hover:text-green-700"
					>
						<ChefHat class="mr-2 h-5 w-5" />
						SmartPlate AI Recipes
					</a>
				</div>
			</div>
		{/if}
	</div>
</section>

<!-- SmartPlate Promo -->
<section class="py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div
				class="mx-auto max-w-5xl rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-sm"
				in:fly={{ y: 40, duration: 800, delay: 400 }}
			>
				<div class="flex flex-col items-center gap-6 md:flex-row">
					<div class="flex-1 space-y-4">
						<div class="flex items-center">
							<ChefHat class="animate-bounce-slow mr-3 h-8 w-8 text-green-600" />
							<h2 class="text-2xl font-bold text-gray-800">SmartPlate AI</h2>
						</div>
						<p class="text-muted-foreground">
							Don't know what to cook? Let our AI create custom recipes from ingredients you already
							have at home. Reduce food waste and discover delicious new meals!
						</p>
						<Button href="/smartplate" class="bg-green-600 hover:bg-green-700">
							Try SmartPlate
							<ArrowRight class="ml-2 h-4 w-4" />
						</Button>
					</div>
					<div class="flex flex-1 justify-center">
						<div
							class="max-w-xs rotate-2 transform rounded-xl border border-green-100 bg-white p-5 shadow-md transition-transform duration-300 hover:rotate-0"
						>
							<div class="space-y-2 text-center">
								<div class="font-semibold">Ingredients:</div>
								<div class="text-sm text-gray-600">Chicken, Spinach, Feta, Lemon</div>
								<div class="mt-4 font-semibold">SmartPlate Suggests:</div>
								<div class="font-medium text-green-600">Greek-Style Stuffed Chicken Breast</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>


<!-- Stats -->
<section class="bg-gradient-to-r from-green-600 to-emerald-600 py-16 text-white">
	<div id="stats-section" class="container mx-auto px-4">
		{#if visible}
			<div class="mb-12 text-center" in:fade={{ duration: 800 }}>
				<h2 class="text-3xl font-bold">Our Impact Together</h2>
				<p class="mx-auto mt-3 max-w-2xl text-green-50">
					Every meal saved makes a difference. Here's what we've accomplished so far.
				</p>
			</div>

			<div class="mx-auto grid max-w-4xl grid-cols-2 gap-10 md:grid-cols-4">
				{#each metrics as metric, i}
					<div
						class="flex flex-col items-center text-center"
						in:scale={{ duration: 600, delay: 200 + i * 150, start: 0.5 }}
					>
						<p class="text-4xl font-bold">{metric.value}</p>
						<p class="text-green-50">{metric.label}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- How it works -->
<section class="py-16">
	<div id="how-it-works-section" class="container mx-auto px-4">
		{#if visible}
			<div class="mb-12 text-center" in:fade={{ duration: 800 }}>
				<h2 class="mb-4 text-3xl font-bold">How FoodLoop Works</h2>
				<p class="mx-auto max-w-2xl text-muted-foreground">
					Our platform makes it easy to find, purchase, and pick up surplus food from local
					businesses.
				</p>
			</div>

			<div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
				{#each howItWorks as step, i}
					<div
						class="flex flex-col items-center text-center"
						in:fly={{ y: 30, duration: 600, delay: 300 + i * 150 }}
					>
						<div class="mb-4 rounded-full bg-green-100 p-5">
							{#if step.icon === Building}
								<Building class="h-7 w-7 text-green-600" />
							{:else if step.icon === User}
								<User class="h-7 w-7 text-green-600" />
							{:else if step.icon === Clock}
								<Clock class="h-7 w-7 text-green-600" />
							{:else if step.icon === Earth}
								<Earth class="h-7 w-7 text-green-600" />
							{/if}
						</div>
						<h3 class="mb-2 text-xl font-semibold">{step.title}</h3>
						<p class="text-muted-foreground">{step.description}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<section class="py-12 bg-green-50">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-3xl text-center">
			<div class="flex items-center justify-center mb-4">
				<Leaf class="mr-2 h-5 w-5 text-green-600" />
				<h2 class="text-3xl font-bold">Feedback</h2>
			</div>
			<p class="text-muted-foreground mb-8">
				Your thoughts help us grow! Share your experience with FoodLoop and help us improve our service.
			</p>
			<a 
				href="https://tally.so/r/npzMVWZ" 
				target="_blank" 
				rel="noopener noreferrer" 
				class="inline-flex items-center px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors">
				Share Your Feedback
				<ArrowRight class="ml-2 h-4 w-4" />
			</a>
		</div>
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
					<h2 class="mb-4 text-3xl font-bold">Ready to Join the Movement?</h2>
					<p class="mx-auto mb-8 max-w-2xl text-green-50">
						Whether you're a business with surplus food or a consumer looking to save money while
						reducing waste, FoodLoop makes it easy to make a difference.
					</p>
					<div class="flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" class="bg-white text-green-600 hover:bg-gray-100">Sign Up Now</Button>
						<Button size="lg" class="bg-white text-green-600 hover:bg-gray-100">Sign Up Now</Button>
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
</style>
