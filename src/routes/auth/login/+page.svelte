<script>
	// Green theme image
	const imgSrc =
		'https://images.unsplash.com/photo-1506484381205-f7945653044d?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3';

	// Handle login and signup tabs with proper $state
	let activeTab = $state('login');
	let username = $state('');
	let password = $state('');
	let email = $state('');

	function switchTab(tabName) {
		activeTab = tabName;
	}

	function handleLogin() {
		alert('Login attempted');
	}

	function handleSignup() {
		alert('Signup attempted');
	}
</script>

<div class="flex min-h-[80vh] items-center justify-center bg-green-50">
	<div
		class="card block max-w-md transform overflow-hidden rounded-lg border-[1px] border-gray-200 bg-white shadow-lg transition-all duration-300 hover:border-green-500"
	>
		<header>
			<img
				src={imgSrc}
				class="contrast-105 aspect-[21/9] w-full brightness-95 saturate-100 filter"
				alt="banner"
			/>
			<!-- Green overlay for the image -->
			<div class="relative">
				<div
					class="absolute inset-0 -mt-[calc(100%)] bg-gradient-to-r from-green-900/60 to-green-600/60"
				>
					<!-- Tab buttons -->
					<div class="absolute bottom-0 left-0 right-0 mb-1 flex justify-center">
						<div class="flex rounded-t-lg bg-white/90">
							<button
								class="px-6 py-2 {activeTab === 'login'
									? 'border-b-2 border-green-600 text-green-600'
									: 'text-gray-600 hover:text-green-600'}"
								onclick={() => switchTab('login')}
								aria-labelledby="login-tab-button"
							>
								Login
							</button>
							<button
								class="px-6 py-2 {activeTab === 'signup'
									? 'border-b-2 border-green-600 text-green-600'
									: 'text-gray-600 hover:text-green-600'}"
								onclick={() => switchTab('signup')}
								aria-labelledby="signup-tab-button"
							>
								Sign Up
							</button>
						</div>
					</div>
				</div>
			</div>
		</header>

		<article class="space-y-6 p-6">
			{#if activeTab === 'login'}
				<div class="login-form">
					<div>
						<h2 class="text-sm font-semibold uppercase tracking-wider text-green-600">
							Welcome Back
						</h2>
						<h3 class="mt-2 text-3xl font-bold text-gray-800">Login with</h3>
					</div>

					<div class="my-6 text-center">
						<p class="text-gray-600">Choose one of the following options to sign in</p>
					</div>

					<div class="space-y-4 pt-2">
						<div class="grid grid-cols-2 gap-4">
							<a href="/auth/login/github" class="block">
								<button
									class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-300 hover:border-green-500 hover:text-green-600"
									aria-label="Sign in with GitHub"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
										/>
									</svg>
									<span>GitHub</span>
								</button>
							</a>

							<button
								onclick={() => alert('Google login')}
								class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-300 hover:border-green-500 hover:text-green-600"
								aria-label="Sign in with Google"
							>
								<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								<span>Google</span>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="signup-form">
					<div>
						<h2 class="text-sm font-semibold uppercase tracking-wider text-green-600">Join Us</h2>
						<h3 class="mt-2 text-3xl font-bold text-gray-800">Sign Up with</h3>
					</div>

					<div class="my-6 text-center">
						<p class="text-gray-600">Create a new account using one of these services</p>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<a href="/auth/signup/github" class="block">
							<button
								class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-300 hover:border-green-500 hover:text-green-600"
								aria-label="Sign up with GitHub"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path
										d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
									/>
								</svg>
								<span>GitHub</span>
							</button>
						</a>

						<button
							onclick={() => alert('Google signup')}
							class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-300 hover:border-green-500 hover:text-green-600"
							aria-label="Sign up with Google"
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span>Google</span>
						</button>
					</div>
				</div>
			{/if}
		</article>

		<footer
			class="flex items-center justify-between gap-4 border-t border-gray-200 bg-green-50 bg-opacity-50 p-6"
		>
			<small class="text-gray-600">FoodLoop</small>
			<small class="text-gray-600">{new Date().toLocaleDateString()}</small>
		</footer>
	</div>
</div>

<style>
	/* Subtle animations */
	button {
		transition:
			transform 0.2s ease,
			background 0.3s ease;
	}

	button:hover {
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(1px);
	}

	input:focus {
		box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.5);
	}

	.login-form,
	.signup-form {
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
