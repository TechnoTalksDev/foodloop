<script>
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { ShoppingBasket, Leaf, ArrowRight, Building, User, Earth, Clock } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';

	// Featured businesses
	const featuredBusinesses = [
		{
			name: 'Fresh Harvest Bakery',
			image: '',
			description: 'Artisan breads and pastries at reduced prices at the end of each day',
			discount: 'Up to 50% off'
		},
		{
			name: 'Green Garden Market',
			image: '',
			description: 'Fresh produce bundles with items that need to move quickly',
			discount: '25-40% off'
		},
		{
			name: 'Coastal Seafood Co.',
			image: '',
			description: 'Daily catches at special prices near closing time',
			discount: 'Up to 35% off'
		},
		{
			name: 'Sunrise Cafe',
			image: '',
			description: 'Unsold breakfast items packaged for takeaway in the afternoon',
			discount: '60% off'
		}
	];

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

	// Testimonials
	const testimonials = [
		{
			quote:
				"FoodLoop has transformed how we handle end-of-day surplus. We've reduced waste by 78% and connected with new customers.",
			author: 'Maria Gonzalez',
			role: 'Owner, Fresh Harvest Bakery'
		},
		{
			quote:
				'I save about €60 per week while trying amazing food from local businesses I might never have discovered otherwise.',
			author: 'Thomas Weber',
			role: 'Regular FoodLoop User'
		},
		{
			quote:
				'As a small restaurant, every bit of revenue matters. FoodLoop helps us recover costs on food that would otherwise be thrown away.',
			author: 'Ahmed Patel',
			role: 'Manager, Spice & Rice Restaurant'
		}
	];

	// News mentions
	const newsMentions = [
		'The Guardian',
		'TechCrunch',
		'Food & Wine',
		'Sustainability Today',
		'Forbes'
	];

	let statsVisible = false;
	let howItWorksVisible = false;
</script>

<svelte:head>
	<title>FoodLoop | Save Food. Save Money. Save the Planet.</title>
	<meta
		name="description"
		content="FoodLoop connects consumers with local businesses to purchase surplus food at discounted prices, reducing food waste and helping the environment."
	/>
</svelte:head>

<!-- Hero section -->
<section class="relative bg-green-50">
	<div
		class="container mx-auto flex flex-col items-center gap-8 px-4 py-12 md:flex-row md:gap-12 md:py-24"
	>
		<div class="flex-1 space-y-6 text-center md:text-left">
			<div
				class="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
			>
				<Leaf class="mr-1 h-4 w-4" />
				Fighting Food Waste Together
			</div>

			<h1 class="text-4xl font-bold tracking-tight md:text-5xl">
				Rescue Delicious Food, <span class="text-green-600">Save Money</span> & Our Planet
			</h1>

			<p class="max-w-2xl text-lg text-muted-foreground">
				Connect with local businesses offering surplus food at great discounts. Enjoy quality meals
				while reducing food waste and your environmental footprint.
			</p>

			<div class="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
				<Button size="lg" class="bg-green-600 hover:bg-green-700">
					Find Food Deals Near You
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button size="lg" variant="outline">For Businesses</Button>
			</div>
		</div>

		<div class="relative flex-1">
			<img
				src="/"
				alt="Assortment of discounted fresh food available through FoodLoop"
				class="w-full rounded-lg shadow-xl"
			/>
			<div class="absolute -bottom-4 -right-4 hidden rounded-lg bg-white p-4 shadow-lg md:block">
				<div class="flex items-center gap-2">
					<div class="rounded-full bg-green-50 p-2">
						<Leaf class="h-5 w-5 text-green-600" />
					</div>
					<div>
						<p class="font-medium">Today's Impact</p>
						<p class="text-sm text-muted-foreground">3,490 meals saved so far</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Curved separator -->
	<div class="absolute bottom-0 left-0 right-0 h-16 bg-green-50">
		<svg class="absolute bottom-0 h-16 w-full" preserveAspectRatio="none" viewBox="0 0 1440 48">
			<path fill="white" d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"></path>
		</svg>
	</div>
</section>

<!-- Featured businesses -->
<section class="py-12 md:py-24">
	<div class="container mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold">Today's Top Deals</h2>
			<p class="mx-auto max-w-2xl text-muted-foreground">
				Explore these amazing offers from local businesses. All items are high-quality and would
				otherwise go to waste.
			</p>
		</div>

		<div class="mx-auto w-full max-w-5xl">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each featuredBusinesses as business}
					<div
						class="h-full overflow-hidden rounded-lg border shadow-md transition-shadow hover:shadow-lg"
					>
						<div class="relative h-48 w-full overflow-hidden">
							<img
								src={business.image}
								alt={business.name}
								class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
							/>
							<div
								class="absolute right-3 top-3 rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
							>
								{business.discount}
							</div>
						</div>
						<div class="p-4">
							<h3 class="mb-1 text-lg font-semibold">{business.name}</h3>
							<p class="mb-4 text-sm text-muted-foreground">{business.description}</p>
							<Button variant="outline" size="sm" class="w-full">View Offers</Button>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-8 flex justify-center gap-2">
				<Button variant="outline" size="icon" class="rounded-full">
					<ArrowRight class="h-4 w-4 rotate-180" />
				</Button>
				<Button variant="outline" size="icon" class="rounded-full">
					<ArrowRight class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<div class="mt-8 text-center">
			<Button variant="ghost" class="text-green-600 hover:bg-green-50 hover:text-green-700">
				View All Nearby Deals
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
		</div>
	</div>
</section>

<!-- Stats -->
<section class="bg-green-600 py-12 text-white md:py-20">
	<div id="stats-section" class="container mx-auto px-4">
		<div class="mb-10 text-center">
			<h2 class="text-3xl font-bold">Our Impact Together</h2>
			<p class="mx-auto mt-2 max-w-2xl text-green-100">
				Every meal saved makes a difference. Here's what we've accomplished so far.
			</p>
		</div>

		<div class="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
			{#each metrics as metric, i}
				<div
					class="text-center"
					class:opacity-0={!statsVisible}
					style="transition: opacity 0.5s ease-in-out {i * 0.2}s; {statsVisible
						? 'opacity: 1'
						: ''}"
				>
					<p class="text-4xl font-bold">{metric.value}</p>
					<p class="text-green-100">{metric.label}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<section class="py-12 md:py-24">
	<div id="how-it-works-section" class="container mx-auto px-4">
		<div class="mb-12 text-center">
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
					class:opacity-0={!howItWorksVisible}
					style="transition: opacity 0.5s ease-in-out {i * 0.2}s; {howItWorksVisible
						? 'opacity: 1'
						: ''}"
				>
					<div class="mb-4 rounded-full bg-green-100 p-4">
						{#if step.icon === Building}
							<Building class="h-6 w-6 text-green-600" />
						{:else if step.icon === User}
							<User class="h-6 w-6 text-green-600" />
						{:else if step.icon === Clock}
							<Clock class="h-6 w-6 text-green-600" />
						{:else if step.icon === Earth}
							<Earth class="h-6 w-6 text-green-600" />
						{/if}
					</div>
					<h3 class="mb-2 text-lg font-semibold">{step.title}</h3>
					<p class="text-muted-foreground">{step.description}</p>
				</div>
			{/each}
		</div>

		<div class="mt-10 text-center">
			<Button variant="default" class="bg-green-600 hover:bg-green-700">
				Learn More About How It Works
			</Button>
		</div>
	</div>
</section>

<!-- Testimonials -->
<section class="relative overflow-hidden bg-gray-50 py-12 md:py-24">
	<div class="container relative z-10 mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold">What Our Community Says</h2>
			<p class="mx-auto max-w-2xl text-muted-foreground">
				Join thousands of businesses and consumers already making a difference.
			</p>
		</div>

		<div class="mx-auto w-full max-w-5xl">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each testimonials as testimonial}
					<div class="rounded-lg border bg-white shadow-md">
						<div class="p-8">
							<p class="mb-6 text-lg italic">" {testimonial.quote} "</p>
							<div class="flex items-center gap-4">
								<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
									<span class="font-semibold text-green-600">{testimonial.author.charAt(0)}</span>
								</div>
								<div>
									<p class="font-semibold">{testimonial.author}</p>
									<p class="text-sm text-muted-foreground">{testimonial.role}</p>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="mt-8 flex justify-center gap-2">
				<Button variant="outline" size="icon" class="rounded-full">
					<ArrowRight class="h-4 w-4 rotate-180" />
				</Button>
				<Button variant="outline" size="icon" class="rounded-full">
					<ArrowRight class="h-4 w-4" />
				</Button>
			</div>
		</div>

		<!-- Background decorations -->
		<div class="absolute left-0 top-0 h-full w-full">
			<div class="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-green-100 opacity-30"></div>
			<div
				class="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-green-100 opacity-30"
			></div>
		</div>
	</div>
</section>

<!-- CTA -->
<section class="py-12 md:py-24">
	<div class="container mx-auto px-4">
		<div
			class="overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-xl"
		>
			<div class="flex flex-col items-center md:flex-row">
				<div class="p-8 text-white md:w-2/3 md:p-12">
					<h2 class="mb-4 text-3xl font-bold">Ready to Join the Movement?</h2>
					<p class="mb-6 max-w-2xl text-green-50">
						Whether you're a business with surplus food or a consumer looking to save money while
						reducing waste, FoodLoop makes it easy to make a difference. Sign up today and be part
						of the solution.
					</p>
					<div class="flex flex-col gap-4 sm:flex-row">
						<Button size="lg" class="bg-white text-green-600 hover:bg-gray-100">Sign Up Now</Button>
						<Button size="lg" variant="outline" class="border-white text-white hover:bg-green-700">
							Learn More
						</Button>
					</div>

					<div class="mt-8">
						<p class="mb-2 text-sm text-green-50">As featured in:</p>
						<div class="flex flex-wrap items-center gap-4">
							{#each newsMentions as publication}
								<span class="text-sm font-medium text-white">{publication}</span>
								{#if publication !== newsMentions[newsMentions.length - 1]}
									<span class="h-1 w-1 rounded-full bg-green-50"></span>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<div class="hidden md:block md:w-1/3">
					<img
						src=""
						alt="Box of fresh food rescued from waste"
						class="h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</div>
</section>
