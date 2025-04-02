<script>
	// Using an image that fits our red theme better
	const imgSrc =
		'https://images.unsplash.com/photo-1463171515643-952cee54d42a?q=80&w=450&h=190&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

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

<div class="flex min-h-[80vh] items-center justify-center">
	<div
		class="card block max-w-md transform overflow-hidden rounded-lg border-[1px] border-gray-700 bg-gray-800 shadow-lg transition-all duration-300 hover:border-red-500"
	>
		<header>
			<img
				src={imgSrc}
				class="aspect-[21/9] w-full brightness-75 contrast-125 saturate-50 filter"
				alt="banner"
			/>
			<!-- Red overlay for the image -->
			<div class="relative">
				<div
					class="absolute inset-0 -mt-[calc(100%)] bg-gradient-to-r from-red-900/60 to-gray-900/60"
				>
					<!-- Tab buttons -->
					<div class="absolute bottom-0 left-0 right-0 mb-1 flex justify-center">
						<div class="flex rounded-t-lg bg-gray-800/70">
							<button
								class="px-6 py-2 {activeTab === 'login'
									? 'border-b-2 border-red-400 text-red-400'
									: 'text-gray-300 hover:text-white'}"
								onclick={() => switchTab('login')}
								aria-labelledby="login-tab-button"
							>
								Login
							</button>
							<button
								class="px-6 py-2 {activeTab === 'signup'
									? 'border-b-2 border-red-400 text-red-400'
									: 'text-gray-300 hover:text-white'}"
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
						<h2 class="text-sm font-semibold uppercase tracking-wider text-red-400">
							Announcements
						</h2>
						<h3 class="mt-2 text-3xl font-bold text-white">Login</h3>
					</div>

					<div class="my-6 space-y-4">
						<div>
							<label for="username" class="mb-1 block text-sm font-medium text-gray-300"
								>Username</label
							>
							<input
								type="text"
								id="username"
								bind:value={username}
								placeholder="Enter your username"
								class="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>

						<div>
							<label for="password" class="mb-1 block text-sm font-medium text-gray-300"
								>Password</label
							>
							<input
								type="password"
								id="password"
								bind:value={password}
								placeholder="Enter your password"
								class="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div class="space-y-4 pt-2">
						<button
							onclick={handleLogin}
							class="flex w-full items-center justify-center rounded-md border border-red-600 bg-red-600 px-6 py-2 text-white transition-colors duration-300 hover:bg-red-700"
							aria-label="Sign in"
						>
							Sign in
						</button>

						<div class="relative">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-t border-gray-700"></div>
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="bg-gray-800 px-2 text-gray-400">Or continue with</span>
							</div>
						</div>

						<div class="grid grid-cols-3 gap-3">
							<a href="/auth/login/github" class="block">
								<button
									class="flex w-full justify-center rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-300 transition-all duration-300 hover:border-red-500 hover:bg-gray-800 hover:text-white"
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
								</button>
							</a>

							<button
								onclick={() => alert('Google login')}
								class="flex justify-center rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-300 transition-all duration-300 hover:border-red-500 hover:bg-gray-800 hover:text-white"
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
							</button>

							<button
								onclick={() => alert('Yahoo login')}
								class="flex justify-center rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-300 transition-all duration-300 hover:border-red-500 hover:bg-gray-800 hover:text-white"
								aria-label="Sign in with Yahoo"
							>
								<svg
									class="h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 512 512"
									fill="currentColor"
								>
									<path
										d="M223.69,141.06,167,284.23,111,141.06H14.93L120.76,390.19,82.19,480h94.17L317.27,141.06Zm105.4,135.79a58.22,58.22,0,1,0,58.22,58.22A58.22,58.22,0,0,0,329.09,276.85ZM394.65,32l-93,223.47H406.44L499.07,32Z"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="signup-form">
					<div>
						<h2 class="text-sm font-semibold uppercase tracking-wider text-red-400">Join Us</h2>
						<h3 class="mt-2 text-3xl font-bold text-white">Sign Up</h3>
					</div>

					<div class="my-6 space-y-4">
						<div>
							<label for="signup-username" class="mb-1 block text-sm font-medium text-gray-300"
								>Username</label
							>
							<input
								type="text"
								id="signup-username"
								bind:value={username}
								placeholder="Choose a username"
								class="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>

						<div>
							<label for="signup-email" class="mb-1 block text-sm font-medium text-gray-300"
								>Email</label
							>
							<input
								type="email"
								id="signup-email"
								bind:value={email}
								placeholder="Enter your email"
								class="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>

						<div>
							<label for="signup-password" class="mb-1 block text-sm font-medium text-gray-300"
								>Password</label
							>
							<input
								type="password"
								id="signup-password"
								bind:value={password}
								placeholder="Create a password"
								class="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-gray-200 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
							/>
						</div>
					</div>

					<div class="pt-2">
						<button
							onclick={handleSignup}
							class="flex w-full items-center justify-center rounded-md border border-red-600 bg-red-600 px-6 py-2 text-white transition-colors duration-300 hover:bg-red-700"
							aria-label="Create account"
						>
							Create Account
						</button>
					</div>
				</div>
			{/if}
		</article>

		<footer
			class="flex items-center justify-between gap-4 border-t border-gray-700 bg-gray-900 bg-opacity-50 p-6"
		>
			<small class="text-gray-400">Ruby</small>
			<small class="text-gray-400">{new Date().toLocaleDateString()}</small>
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
		box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.5);
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
