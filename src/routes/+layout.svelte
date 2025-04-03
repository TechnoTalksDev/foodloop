<script>
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Menu, X } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import logoImage from './logo.png';
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	// Simplified navigation links
	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/smartplate', label: 'SmartPlate' },
		{ href: '/auth/login', label: 'Login' }
	];

	// State for mobile menu
	let isOpen = $state(false);


	let { data, children } = $props()
  let { session, supabase } = $derived(data)
  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== session?.expires_at) {
        invalidate('supabase:auth')
      }
    })
    return () => data.subscription.unsubscribe()
  })

	
</script>

<Toaster />

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="container flex h-16 items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 text-xl font-bold">
				<img src="{logoImage}" alt="FoodLoop Logo" class="h-6 w-auto" />
				<span class="hidden md:inline">FoodLoop</span>
			</a>

			<!-- Spacer to push nav to the right -->
			<div class="flex-grow"></div>

			<!-- Desktop navigation - now on far right -->
			<nav class="hidden gap-4 md:flex">
				{#each links as link}
					<a
						href={link.href}
						class={cn(
							'text-sm font-medium transition-colors hover:text-primary',
							$page.url.pathname === link.href
								? 'border-b-2 border-primary font-semibold text-primary'
								: 'text-muted-foreground'
						)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Mobile navigation -->
			<Sheet bind:open={isOpen}>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon" class="ml-4 md:hidden">
						<Menu class="h-5 w-5" />
						<span class="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="right" class="w-[250px] sm:w-[300px]">
					<div class="flex flex-col gap-6 py-4">
						<a href="/" class="flex items-center gap-2 text-xl font-bold">
							<img src="/assets/logo.png" alt="FoodLoop Logo" class="h-6 w-auto" />
							<span>FoodLoop</span>
						</a>
						<nav class="flex flex-col gap-4">
							{#each links as link}
								<a
									href={link.href}
									class={cn(
										'text-sm font-medium transition-colors hover:text-primary',
										$page.url.pathname === link.href
											? 'font-semibold text-primary'
											: 'text-muted-foreground'
									)}
									on:click={() => (isOpen = false)}
								>
									{link.label}
								</a>
							{/each}
						</nav>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	</header>

	<main class="flex-1">
		<slot></slot>
	</main>

	<footer class="border-t bg-muted py-4">
		<div class="container">
			<p class="text-center text-xs text-muted-foreground">
				© {new Date().getFullYear()} FoodLoop. MIT License.
			</p>
		</div>
	</footer>
</div>