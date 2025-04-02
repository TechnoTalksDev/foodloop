<script>
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { ShoppingBasket, Leaf, Menu, X } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import '../app.css';

	// Navigation links
	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/how-it-works', label: 'How It Works' },
		{ href: '/for-businesses', label: 'For Businesses' },
		{ href: '/for-consumers', label: 'For Consumers' },
		{ href: '/about', label: 'About Us' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/contact', label: 'Contact' }
	];

	let isOpen = $state(false);
</script>

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="container flex h-16 items-center justify-between">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 text-xl font-bold">
				<ShoppingBasket class="h-6 w-6 text-green-600" />
				<span class="hidden md:inline">FoodLoop</span>
				<span class="ml-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
					<Leaf class="mr-1 inline h-4 w-4" />
					Save Food
				</span>
			</a>

			<!-- Desktop navigation -->
			<nav class="hidden gap-6 md:flex">
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

			<!-- CTA buttons -->
			<div class="hidden items-center gap-2 md:flex">
				<a href="/auth/login"><Button variant="outline" size="sm">Get Started</Button></a>
			</div>

			<!-- Mobile navigation -->
			<Sheet bind:open={isOpen}>
				<SheetTrigger asChild>
					<Button variant="ghost" size="icon" class="md:hidden">
						<Menu class="h-5 w-5" />
						<span class="sr-only">Toggle menu</span>
					</Button>
				</SheetTrigger>
				<SheetContent side="right" class="w-[250px] sm:w-[300px]">
					<div class="flex flex-col gap-6 py-4">
						<a href="/" class="flex items-center gap-2 text-xl font-bold">
							<ShoppingBasket class="h-6 w-6 text-green-600" />
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
									onclick={() => (isOpen = false)}
								>
									{link.label}
								</a>
							{/each}
						</nav>
						<div class="mt-auto flex flex-col gap-2">
							<Button variant="outline" size="sm" href="/auth/login">Get Started</Button>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	</header>

	<main class="flex-1">
		<slot></slot>
	</main>

	<footer class="border-t bg-muted py-8">
		<div class="container flex flex-col gap-6">
			<div class="flex flex-col justify-between gap-4 md:flex-row">
				<div class="space-y-2">
					<a href="/" class="flex items-center gap-2 text-xl font-bold">
						<ShoppingBasket class="h-6 w-6 text-green-600" />
						<span>FoodLoop</span>
					</a>
					<p class="text-sm text-muted-foreground">Saving Food. Saving Money. Saving the Planet.</p>
				</div>

				<div class="grid grid-cols-2 gap-8 md:grid-cols-3">
					<div class="space-y-2">
						<h4 class="font-medium">Platform</h4>
						<ul class="space-y-1">
							<li><a href="/" class="text-sm text-muted-foreground hover:text-primary">Home</a></li>
							<li>
								<a href="/how-it-works" class="text-sm text-muted-foreground hover:text-primary"
									>How It Works</a
								>
							</li>
							<li>
								<a href="/faq" class="text-sm text-muted-foreground hover:text-primary">FAQ</a>
							</li>
						</ul>
					</div>
					<div class="space-y-2">
						<h4 class="font-medium">For Users</h4>
						<ul class="space-y-1">
							<li>
								<a href="/for-businesses" class="text-sm text-muted-foreground hover:text-primary"
									>Businesses</a
								>
							</li>
							<li>
								<a href="/for-consumers" class="text-sm text-muted-foreground hover:text-primary"
									>Consumers</a
								>
							</li>
							<li>
								<a href="/blog" class="text-sm text-muted-foreground hover:text-primary">Blog</a>
							</li>
						</ul>
					</div>
					<div class="space-y-2">
						<h4 class="font-medium">Company</h4>
						<ul class="space-y-1">
							<li>
								<a href="/about" class="text-sm text-muted-foreground hover:text-primary"
									>About Us</a
								>
							</li>
							<li>
								<a href="/contact" class="text-sm text-muted-foreground hover:text-primary"
									>Contact</a
								>
							</li>
							<li>
								<a href="/terms" class="text-sm text-muted-foreground hover:text-primary"
									>Terms & Privacy</a
								>
							</li>
						</ul>
					</div>
				</div>
			</div>
			<div class="flex flex-col justify-between gap-4 border-t pt-4 md:flex-row">
				<p class="text-xs text-muted-foreground">
					© {new Date().getFullYear()} FoodLoop. All rights reserved.
				</p>
				<p class="text-xs text-muted-foreground">Made with ❤️ for a better planet</p>
			</div>
		</div>
	</footer>
</div>
