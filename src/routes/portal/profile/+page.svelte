<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import User from 'lucide-svelte/icons/user';
	import Star from 'lucide-svelte/icons/star';
	import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
	import Truck from 'lucide-svelte/icons/truck';
	import Heart from 'lucide-svelte/icons/heart';
	import Mail from 'lucide-svelte/icons/mail';
	import Phone from 'lucide-svelte/icons/phone';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Leaf from 'lucide-svelte/icons/leaf';
	import Edit from 'lucide-svelte/icons/edit';
	import Save from 'lucide-svelte/icons/save';
	import { goto } from '$app/navigation';

	// Define types for the profile data
	interface UserProfile {
		id: string;
		name: string;
		email: string;
		phone: string;
		address: string;
		avatar: string;
		joined: string;
		bio: string;
		savedItems: number;
		impactScore: number;
		purchaseCount: number;
		sellerRating: number;
	}

	interface PageData {
		profile: UserProfile;
	}

	// Define sample data for the profile
	const defaultProfile = {
		id: 'user-123',
		name: 'Jamie Smith',
		email: 'jamie@example.com',
		phone: '(555) 123-4567',
		address: '123 Green Street, Portland, OR',
		avatar: '/images/avatars/default.jpg',
		joined: 'April 2023',
		bio: 'Food enthusiast committed to reducing waste and supporting local businesses.',
		savedItems: 42,
		impactScore: 87,
		purchaseCount: 15,
		sellerRating: 4.8
	};

	// Use props syntax for Svelte runes mode
	const props = $props<{ data?: { profile: UserProfile } }>();
	const profile = props.data?.profile || defaultProfile;

	// Animation control
	let visible = $state(false);
	let editMode = $state(false);
	
	// Form data (for edit mode)
	let formData = $state({
		name: profile.name,
		email: profile.email,
		phone: profile.phone,
		address: profile.address,
		bio: profile.bio
	});

	// Mount animation
	onMount(() => {
		visible = true;
	});

	// Toggle edit mode
	function toggleEditMode() {
		if (editMode) {
			profile.name = formData.name;
			profile.email = formData.email;
			profile.phone = formData.phone;
			profile.address = formData.address;
			profile.bio = formData.bio;
		}
		editMode = !editMode;
	}

	// Navigation functions
	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		{#if visible}
			<div class="mb-12 text-center" in:fade={{ duration: 600 }}>
				<h1 class="mb-3 flex items-center justify-center text-3xl font-bold text-gray-800">
					<User class="animate-bounce-slow mr-3 h-8 w-8 text-green-600" />
					Your Profile
				</h1>
				<p class="mx-auto max-w-xl text-gray-600">
					Manage your account information and track your impact on reducing food waste.
				</p>
			</div>

			<div class="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Left Column - User Profile Card -->
				<div class="lg:col-span-1" in:fly={{ x: -20, duration: 400 }}>
					<Card.Root class="border-green-200 overflow-hidden">
						<div class="relative bg-gradient-to-r from-green-500 to-green-600 h-32">
							<div class="absolute bottom-0 left-0 w-full flex justify-center transform translate-y-1/2">
								<Avatar.Root class="h-24 w-24 border-4 border-white">
									{#if profile.avatar}
										<Avatar.Image
											src={profile.avatar}
											alt={profile.name}
										/>
									{:else}
										<Avatar.Fallback class="bg-green-100 text-green-800 text-xl">
											{profile.name
												.split(' ')
												.map(n => n[0])
												.join('')
												.toUpperCase()}
										</Avatar.Fallback>
									{/if}
								</Avatar.Root>
							</div>
						</div>
						
						<Card.Header class="flex flex-col items-center mt-12 pt-0 text-center">
							<Card.Title class="text-xl">{profile.name}</Card.Title>
							<Card.Description class="text-gray-500">
								Member since {profile.joined}
							</Card.Description>
						</Card.Header>
						
						<Card.Content class="text-center">
							<p class="text-gray-600 mb-4">{profile.bio}</p>
							
							<div class="grid grid-cols-3 gap-2 border-t border-b border-gray-100 py-4">
								<div class="flex flex-col items-center">
									<Leaf class="h-5 w-5 mb-1 text-green-600" />
									<span class="text-lg font-semibold">{profile.impactScore}</span>
									<span class="text-xs text-gray-500">Impact Score</span>
								</div>
								<div class="flex flex-col items-center">
									<ShoppingBag class="h-5 w-5 mb-1 text-green-600" />
									<span class="text-lg font-semibold">{profile.purchaseCount}</span>
									<span class="text-xs text-gray-500">Purchases</span>
								</div>
								<div class="flex flex-col items-center">
									<Star class="h-5 w-5 mb-1 text-green-600" />
									<span class="text-lg font-semibold">{profile.sellerRating}</span>
									<span class="text-xs text-gray-500">Rating</span>
								</div>
							</div>
						</Card.Content>
						
						<Card.Footer class="flex justify-center">
							<Button 
								variant="outline" 
								class="border-green-200 text-green-600 hover:border-green-300"
								onclick={() => toggleEditMode()}
							>
								{#if editMode}
									<Save class="mr-2 h-4 w-4" />
									Save Changes
								{:else}
									<Edit class="mr-2 h-4 w-4" />
									Edit Profile
								{/if}
							</Button>
						</Card.Footer>
					</Card.Root>
				</div>
				
				<!-- Right Column - Profile Details and Actions -->
				<div class="lg:col-span-2" in:fly={{ x: 20, duration: 400 }}>
					<Card.Root class="border-green-200 mb-6">
						<Card.Header>
							<Card.Title class="text-xl">Personal Information</Card.Title>
							<Card.Description>
								Your contact details and preferences
							</Card.Description>
						</Card.Header>
						
						<Card.Content>
							<div class="space-y-4">
								{#if editMode}
									<!-- Edit Mode -->
									<div class="grid gap-4">
										<div>
											<Label for="name">Full Name</Label>
											<Input id="name" type="text" bind:value={formData.name} />
										</div>
										<div>
											<Label for="email">Email Address</Label>
											<Input id="email" type="email" bind:value={formData.email} />
										</div>
										<div>
											<Label for="phone">Phone Number</Label>
											<Input id="phone" type="tel" bind:value={formData.phone} />
										</div>
										<div>
											<Label for="address">Address</Label>
											<Input id="address" type="text" bind:value={formData.address} />
										</div>
										<div>
											<Label for="bio">Bio</Label>
											<Input id="bio" type="text" bind:value={formData.bio} />
										</div>
									</div>
								{:else}
									<!-- View Mode -->
									<div class="grid md:grid-cols-2 gap-y-4">
										<div class="flex items-start space-x-3">
											<Mail class="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
											<div>
												<p class="text-sm font-medium text-gray-700">Email</p>
												<p class="text-sm text-gray-600">{profile.email}</p>
											</div>
										</div>
										<div class="flex items-start space-x-3">
											<Phone class="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
											<div>
												<p class="text-sm font-medium text-gray-700">Phone</p>
												<p class="text-sm text-gray-600">{profile.phone}</p>
											</div>
										</div>
										<div class="flex items-start space-x-3 md:col-span-2">
											<MapPin class="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
											<div>
												<p class="text-sm font-medium text-gray-700">Address</p>
												<p class="text-sm text-gray-600">{profile.address}</p>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
					
					<!-- Action Cards -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4" in:fly={{ y: 20, duration: 400, delay: 200 }}>
						<div 
							class="rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
							onclick={() => navigateTo('/portal')}
							role="button"
							tabindex="0"
							onkeydown={(e) => {if (e.key === 'Enter' || e.key === ' ') navigateTo('/portal')}}
						>
							<div class="p-6 text-center text-white flex flex-col items-center">
								<div class="rounded-full bg-white/20 p-3 mb-3">
									<ShoppingBag class="h-6 w-6" />
								</div>
								<h3 class="text-lg font-bold mb-1">Browse Deals</h3>
								<p class="text-green-50 text-xs">Find food near you</p>
							</div>
						</div>
						
						<div 
							class="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105"
							onclick={() => navigateTo('/portal/impact')}
							role="button"
							tabindex="0"
							onkeydown={(e) => {if (e.key === 'Enter' || e.key === ' ') navigateTo('/portal/impact')}}
						>
							<div class="p-6 text-center text-white flex flex-col items-center">
								<div class="rounded-full bg-white/20 p-3 mb-3">
									<Leaf class="h-6 w-6" />
								</div>
								<h3 class="text-lg font-bold mb-1">Your Impact</h3>
								<p class="text-blue-50 text-xs">See your environmental contribution</p>
							</div>
						</div>
						
						<div 
							class="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 md:col-span-2"
							onclick={() => navigateTo('/portal/create')}
							role="button"
							tabindex="0"
							onkeydown={(e) => {if (e.key === 'Enter' || e.key === ' ') navigateTo('/portal/create')}}
						>
							<div class="p-6 text-center text-white flex flex-col items-center">
								<div class="rounded-full bg-white/20 p-3 mb-3">
									<Truck class="h-6 w-6" />
								</div>
								<h3 class="text-lg font-bold mb-1">Create Food Listing</h3>
								<p class="text-amber-50 text-xs">Sell surplus food items to the community</p>
							</div>
						</div>
					</div>
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