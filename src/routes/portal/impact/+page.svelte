<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut, backOut, cubicOut } from 'svelte/easing';

	// Import UI components
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	// Import Lucide icons
	import Leaf from 'lucide-svelte/icons/leaf';
	import BarChart from 'lucide-svelte/icons/bar-chart';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import UserCircle from 'lucide-svelte/icons/user-circle';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Building from 'lucide-svelte/icons/building';
	import Globe from 'lucide-svelte/icons/globe';
	import Trees from 'lucide-svelte/icons/trees';
	import Apple from 'lucide-svelte/icons/apple';
	import Gauge from 'lucide-svelte/icons/gauge';

	// Animation control
	let visible = false;
	onMount(() => {
		visible = true;
	});

	// Time period selection
	const timePeriods = [
		{ value: 'day', label: 'Today' },
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' },
		{ value: 'allTime', label: 'All Time' }
	];

	let selectedTimePeriod = 'week';

	// Location selection
	const locations = [
		{ value: 'user', label: 'Your Impact' },
		{ value: 'city', label: 'City Impact' },
		{ value: 'state', label: 'State Impact' },
		{ value: 'country', label: 'Country Impact' }
	];

	let selectedLocation = 'user';

	// Define proper interfaces for the data structure
	interface ImpactMetrics {
		foodPounds: number;
		meals: number;
		emissions: number;
	}

	interface LocationData {
		user: ImpactMetrics;
		city: ImpactMetrics;
		state: ImpactMetrics;
		country: ImpactMetrics;
	}

	interface ImpactData {
		day: LocationData;
		week: LocationData;
		month: LocationData;
		allTime: LocationData;
	}

	// Sample Data
	const impactData: ImpactData = {
		day: {
			user: { foodPounds: 2.5, meals: 2, emissions: 4.8 },
			city: { foodPounds: 1250, meals: 1000, emissions: 2400 },
			state: { foodPounds: 12500, meals: 10000, emissions: 24000 },
			country: { foodPounds: 125000, meals: 100000, emissions: 240000 }
		},
		week: {
			user: { foodPounds: 14.3, meals: 11, emissions: 27.4 },
			city: { foodPounds: 7850, meals: 6280, emissions: 15040 },
			state: { foodPounds: 87500, meals: 70000, emissions: 168000 },
			country: { foodPounds: 875000, meals: 700000, emissions: 1680000 }
		},
		month: {
			user: { foodPounds: 58.6, meals: 47, emissions: 112.3 },
			city: { foodPounds: 32500, meals: 26000, emissions: 62400 },
			state: { foodPounds: 325000, meals: 260000, emissions: 624000 },
			country: { foodPounds: 3250000, meals: 2600000, emissions: 6240000 }
		},
		allTime: {
			user: { foodPounds: 187.2, meals: 150, emissions: 358.6 },
			city: { foodPounds: 125000, meals: 100000, emissions: 240000 },
			state: { foodPounds: 1250000, meals: 1000000, emissions: 2400000 },
			country: { foodPounds: 12500000, meals: 10000000, emissions: 24000000 }
		}
	};

	// Derived values based on selections
	$: currentData =
		impactData[selectedTimePeriod as keyof ImpactData][selectedLocation as keyof LocationData];

	// Format numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
	}

	// Get descriptive text for the time period
	$: timeText = timePeriods.find((t) => t.value === selectedTimePeriod)?.label || 'This Week';

	// Get descriptive text for the location
	$: locationText = locations.find((l) => l.value === selectedLocation)?.label || 'Your Impact';

	// Calculate environmental equivalents
	$: carMiles = (currentData.emissions * 2.32).toFixed(1); // CO2 emissions per mile driven
	$: showerMinutes = (currentData.emissions * 3.5).toFixed(0); // Water saved equivalent
	$: phoneCharges = (currentData.emissions * 60).toFixed(0); // Energy equivalent
</script>

<svelte:head>
	<title>Your Environmental Impact | FoodLoop</title>
	<meta
		name="description"
		content="Track your positive environmental impact by saving food with FoodLoop."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div class="mb-12 text-center" in:fade={{ duration: 600 }}>
				<h1 class="mb-4 flex items-center justify-center text-4xl font-bold text-gray-800">
					<Leaf class="animate-bounce-slow mr-3 h-9 w-9 text-green-600" />
					Your Environmental Impact
				</h1>
				<p class="mx-auto max-w-2xl text-gray-600">
					Every time you save food with FoodLoop, you're making a measurable difference to the
					planet. Track your contribution to reducing food waste and greenhouse gas emissions.
				</p>
			</div>

			<!-- Filter controls -->
			<div
				class="mx-auto mb-10 flex max-w-3xl flex-col justify-center space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:space-x-4 sm:space-y-0"
				in:fly={{ y: 20, duration: 500, delay: 300 }}
			>
				<div class="flex-1">
					<label class="mb-2 block flex items-center text-sm font-medium text-gray-700">
						<Calendar class="mr-2 h-4 w-4 text-green-600" />
						Time Period
					</label>
					<select
						bind:value={selectedTimePeriod}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
					>
						{#each timePeriods as period}
							<option value={period.value}>{period.label}</option>
						{/each}
					</select>
				</div>

				<div class="flex-1">
					<label class="mb-2 block flex items-center text-sm font-medium text-gray-700">
						<MapPin class="mr-2 h-4 w-4 text-green-600" />
						Location Scope
					</label>
					<select
						bind:value={selectedLocation}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
					>
						{#each locations as location}
							<option value={location.value}>{location.label}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Impact metrics -->
			<div class="mx-auto mb-10 max-w-5xl">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<!-- Food saved metric -->
					<div
						in:fly={{ x: -20, y: 0, duration: 500, delay: 400 }}
						class="transform transition-all duration-300 hover:scale-105"
					>
						<Card.Root class="h-full overflow-hidden border-green-100">
							<div
								class="flex items-center bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white"
							>
								<Apple class="mr-2 h-6 w-6" />
								<h3 class="text-lg font-semibold">Food Saved</h3>
							</div>
							<Card.Content class="flex flex-col items-center justify-center p-6">
								<div class="mb-1 text-4xl font-bold text-gray-800">
									{formatNumber(currentData.foodPounds)} lbs
								</div>
								<p class="text-center text-gray-600">of food rescued from waste</p>

								<div class="mt-4 w-full rounded-lg bg-green-50 p-3 text-center">
									<p class="text-sm font-medium text-green-800">
										{selectedLocation === 'user' ? 'You have' : `${locationText} has`} saved
										{formatNumber(currentData.foodPounds)} pounds of food {timeText.toLowerCase()}.
									</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>

					<!-- Meals saved metric -->
					<div
						in:fly={{ y: -20, duration: 500, delay: 500 }}
						class="transform transition-all duration-300 hover:scale-105"
					>
						<Card.Root class="h-full overflow-hidden border-blue-100">
							<div
								class="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white"
							>
								<UserCircle class="mr-2 h-6 w-6" />
								<h3 class="text-lg font-semibold">Meals Provided</h3>
							</div>
							<Card.Content class="flex flex-col items-center justify-center p-6">
								<div class="mb-1 text-4xl font-bold text-gray-800">
									{formatNumber(currentData.meals)}
								</div>
								<p class="text-center text-gray-600">meals saved from going to waste</p>

								<div class="mt-4 w-full rounded-lg bg-blue-50 p-3 text-center">
									<p class="text-sm font-medium text-blue-800">
										That's enough to feed {formatNumber(currentData.meals / 3)} people for a full day!
									</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>

					<!-- Emissions saved metric -->
					<div
						in:fly={{ x: 20, y: 0, duration: 500, delay: 600 }}
						class="transform transition-all duration-300 hover:scale-105"
					>
						<Card.Root class="h-full overflow-hidden border-amber-100">
							<div
								class="flex items-center bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white"
							>
								<Gauge class="mr-2 h-6 w-6" />
								<h3 class="text-lg font-semibold">Emissions Prevented</h3>
							</div>
							<Card.Content class="flex flex-col items-center justify-center p-6">
								<div class="mb-1 text-4xl font-bold text-gray-800">
									{formatNumber(currentData.emissions)} kg
								</div>
								<p class="text-center text-gray-600">of CO₂ equivalent emissions avoided</p>

								<div class="mt-4 w-full rounded-lg bg-amber-50 p-3 text-center">
									<p class="text-sm font-medium text-amber-800">
										Equivalent to not driving {carMiles} miles in an average car
									</p>
								</div>
							</Card.Content>
						</Card.Root>
					</div>
				</div>
			</div>

			<!-- Environmental equivalents -->
			<div class="mx-auto mb-10 max-w-4xl" in:fly={{ y: 30, duration: 500, delay: 700 }}>
				<Card.Root class="overflow-hidden border-green-100">
					<Card.Header class="bg-gradient-to-r from-green-50 to-white">
						<Card.Title class="flex items-center">
							<Trees class="mr-2 h-5 w-5 text-green-600" />
							Environmental Impact Equivalents
						</Card.Title>
						<Card.Description>
							Your food waste reduction translates to these environmental benefits:
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="p-4">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
								<div class="rounded-lg bg-green-50 p-4 text-center">
									<div class="mb-2 text-2xl font-bold text-green-700">{carMiles}</div>
									<p class="text-green-800">miles not driven</p>
								</div>

								<div class="rounded-lg bg-blue-50 p-4 text-center">
									<div class="mb-2 text-2xl font-bold text-blue-700">{showerMinutes}</div>
									<p class="text-blue-800">minutes of shower water saved</p>
								</div>

								<div class="rounded-lg bg-amber-50 p-4 text-center">
									<div class="mb-2 text-2xl font-bold text-amber-700">{phoneCharges}</div>
									<p class="text-amber-800">smartphone charges</p>
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Scope comparison -->
			<div class="mx-auto max-w-5xl" in:fly={{ y: 30, duration: 500, delay: 800 }}>
				<Card.Root class="overflow-hidden border-green-100">
					<Card.Header class="bg-gradient-to-r from-green-50 to-white">
						<Card.Title class="flex items-center">
							<Globe class="mr-2 h-5 w-5 text-green-600" />
							Your Impact in Context
						</Card.Title>
						<Card.Description>
							See how your individual impact compares with your community and beyond
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="p-4">
							<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
								<div
									class="rounded-lg border border-gray-100 p-4 text-center transition-shadow hover:shadow-md"
									class:bg-green-50={selectedLocation === 'user'}
								>
									<UserCircle class="mx-auto mb-2 h-8 w-8 text-green-600" />
									<p class="mb-1 font-medium">Your Impact</p>
									<p class="text-sm text-gray-600">
										{formatNumber(
											impactData[selectedTimePeriod as keyof ImpactData].user.foodPounds
										)} lbs saved
									</p>
									<Button
										class={selectedLocation === 'user'
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'}
										on:click={() => (selectedLocation = 'user')}
									>
										{selectedLocation === 'user' ? 'Selected' : 'Select'}
									</Button>
								</div>

								<div
									class="rounded-lg border border-gray-100 p-4 text-center transition-shadow hover:shadow-md"
									class:bg-green-50={selectedLocation === 'city'}
								>
									<Building class="mx-auto mb-2 h-8 w-8 text-blue-600" />
									<p class="mb-1 font-medium">City Impact</p>
									<p class="text-sm text-gray-600">
										{formatNumber(
											impactData[selectedTimePeriod as keyof ImpactData].city.foodPounds
										)} lbs saved
									</p>
									<Button
										class={selectedLocation === 'city'
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'}
										on:click={() => (selectedLocation = 'city')}
									>
										{selectedLocation === 'city' ? 'Selected' : 'Select'}
									</Button>
								</div>

								<div
									class="rounded-lg border border-gray-100 p-4 text-center transition-shadow hover:shadow-md"
									class:bg-green-50={selectedLocation === 'state'}
								>
									<MapPin class="mx-auto mb-2 h-8 w-8 text-amber-600" />
									<p class="mb-1 font-medium">State Impact</p>
									<p class="text-sm text-gray-600">
										{formatNumber(
											impactData[selectedTimePeriod as keyof ImpactData].state.foodPounds
										)} lbs saved
									</p>
									<Button
										class={selectedLocation === 'state'
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'}
										on:click={() => (selectedLocation = 'state')}
									>
										{selectedLocation === 'state' ? 'Selected' : 'Select'}
									</Button>
								</div>

								<div
									class="rounded-lg border border-gray-100 p-4 text-center transition-shadow hover:shadow-md"
									class:bg-green-50={selectedLocation === 'country'}
								>
									<Globe class="mx-auto mb-2 h-8 w-8 text-purple-600" />
									<p class="mb-1 font-medium">Country Impact</p>
									<p class="text-sm text-gray-600">
										{formatNumber(
											impactData[selectedTimePeriod as keyof ImpactData].country.foodPounds
										)} lbs saved
									</p>
									<Button
										class={selectedLocation === 'country'
											? 'bg-green-600 text-white hover:bg-green-700'
											: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'}
										on:click={() => (selectedLocation = 'country')}
									>
										{selectedLocation === 'country' ? 'Selected' : 'Select'}
									</Button>
								</div>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Call to action -->
			<div
				class="mx-auto mt-12 max-w-3xl text-center"
				in:scale={{ duration: 600, delay: 1000, start: 0.8 }}
			>
				<h2 class="mb-4 text-2xl font-bold text-gray-800">Ready to Make an Even Bigger Impact?</h2>
				<p class="mb-6 text-gray-600">
					Continue rescuing food from waste or invite friends to join the movement. Together, we can
					make a significant difference for our planet.
				</p>
				<div class="flex flex-col justify-center gap-4 sm:flex-row">
					<Button class="bg-green-600 text-white hover:bg-green-700">Find More Deals</Button>
					<Button class="border border-green-200 bg-white text-green-700 hover:bg-green-50">
						Share Your Impact
					</Button>
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
