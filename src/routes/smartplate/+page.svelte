<script lang="ts">
    import { fade, fly, scale } from 'svelte/transition';
    import { backOut, elasticOut, cubicOut } from 'svelte/easing';
    import { enhance } from '$app/forms';
    import type { ActionData } from './$types';
    import { onMount } from 'svelte';
    import ChefHat from 'lucide-svelte/icons/chef-hat';
    import ShoppingBasket from 'lucide-svelte/icons/shopping-basket';
    import Clock from 'lucide-svelte/icons/clock';
    import Utensils from 'lucide-svelte/icons/utensils';
    import ListChecks from 'lucide-svelte/icons/list-checks';
    import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
    
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
  
  <div class="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50 py-12 relative overflow-hidden">
    <!-- Background animated elements -->
    <div class="absolute inset-0 overflow-hidden -z-10">
      <div class="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-green-600/10 blur-3xl animate-pulse-slow"></div>
      <div class="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-green-800/10 blur-3xl animate-float"></div>
    </div>
  
    <div class="container mx-auto px-4">
      {#if visible}
        <div>
          <h1 
            class="text-4xl md:text-5xl font-bold text-gray-800 mb-4 text-center"
            in:fly={{ y: -30, duration: 800, easing: elasticOut }}
          >
            <span 
              class="text-green-600 inline-block transform hover:scale-110 transition-transform duration-300"
              in:scale={{ duration: 600, delay: 400, easing: backOut, start: 0.5 }}
            >Smart</span>Plate
          </h1>
          
          <p 
            class="text-gray-600 text-center mb-12 max-w-2xl mx-auto"
            in:fade={{ duration: 800, delay: 600 }}
          >
            Turn your available ingredients into delicious recipes instantly!
            Get creative meal ideas using what you already have in your kitchen.
          </p>
          
          <div 
            class="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transform transition-all duration-500"
            in:scale={{ duration: 800, delay: 800, easing: cubicOut, start: 0.95 }}
          >
            <!-- Form -->
            <div class="p-6">
              <form method="POST" use:enhance={() => {
                isGenerating = true;
                
                return async ({ update }) => {
                  isGenerating = false;
                  await update();
                };
              }} class="space-y-6">
                <div>
                  <label for="ingredients" class="block text-gray-700 font-medium mb-2 flex items-center">
                    <ChefHat class="h-5 w-5 mr-2 text-green-600" />
                    What ingredients do you have?
                  </label>
                  
                  <textarea
                    id="ingredients"
                    name="ingredients"
                    bind:value={inputValue}
                    rows="3"
                    class="w-full bg-gray-50 text-gray-800 rounded-md border border-gray-300 p-4 focus:border-green-500 focus:ring focus:ring-green-500/30 focus:outline-none textarea-glow"
                    placeholder="e.g., chicken, broccoli, garlic, olive oil..."
                    required
                  ></textarea>
                </div>
                
                <div class="bg-green-50 p-4 rounded-md">
                  <p class="text-sm text-gray-600 mb-2">Try one of these combinations:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each examples as example, i}
                      <button 
                        type="button"
                        class="px-3 py-1 bg-white hover:bg-green-100 text-gray-700 text-xs border border-green-200 rounded-full transition-colors"
                        on:click={() => useExample(example)}
                        in:fade={{ delay: 900 + (i * 100), duration: 400 }}
                      >
                        {example}
                      </button>
                    {/each}
                  </div>
                </div>
                
                {#if form?.error}
                  <div 
                    class="bg-red-50 text-red-600 p-4 rounded-md"
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
                    class="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-lg shadow-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 button-glow"
                  >
                    {#if isGenerating}
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                class="border-t border-gray-200 p-6 bg-green-50/50"
                in:fly={{ y: 30, duration: 600, delay: 300 }}
              >
                <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Utensils class="h-6 w-6 mr-2 text-green-600 animate-bounce-gentle" />
                  {form.recipe.name}
                </h2>
                
                <div class="mb-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
                  <Clock class="h-4 w-4 mr-2" />
                  <span class="text-sm">{form.recipe.cookingTime}</span>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6 mt-6">
                  <!-- Ingredients -->
                  <div 
                    class="bg-white rounded-md p-4 shadow-sm border border-gray-200 hover:border-green-300 transition-colors duration-300"
                    in:fly={{ x: -20, y: 0, duration: 400, delay: 400 }}
                  >
                    <h3 class="font-semibold text-green-700 mb-2 border-b border-green-100 pb-2">Ingredients</h3>
                    <ul class="space-y-1">
                      {#each form.recipe.ingredients as ingredient, i}
                        <li 
                          class="text-gray-700 flex items-start"
                          in:fly={{ y: 10, duration: 300, delay: 600 + (i * 50) }}
                        >
                          <span class="text-green-500 mr-2">•</span>
                          {ingredient}
                        </li>
                      {/each}
                    </ul>
                  </div>
                  
                  <!-- Instructions -->
                  <div 
                    class="bg-white rounded-md p-4 shadow-sm border border-gray-200 hover:border-green-300 transition-colors duration-300"
                    in:fly={{ x: 20, y: 0, duration: 400, delay: 600 }}
                  >
                    <h3 class="font-semibold text-green-700 mb-2 border-b border-green-100 pb-2">Instructions</h3>
                    <ol class="space-y-3 list-decimal pl-5">
                      {#each form.recipe.instructions as instruction, i}
                        <li 
                          class="text-gray-700"
                          in:fly={{ y: 10, duration: 300, delay: 800 + (i * 100) }}
                        >
                          {instruction}
                        </li>
                      {/each}
                    </ol>
                  </div>
                </div>
                
                <!-- Recommended Items -->
                <div 
                  class="mt-6 bg-white rounded-md p-4 shadow-sm border border-gray-200 hover:border-green-300 transition-colors duration-300"
                  in:fly={{ y: 20, duration: 400, delay: 1000 }}
                >
                  <h3 class="font-semibold text-green-700 mb-3 flex items-center">
                    <ShoppingBasket class="h-5 w-5 mr-2" />
                    Complete Your Recipe With These Items
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    {#each form.recipe.recommendedItems as item, i}
                      <div 
                        class="inline-flex items-center px-3 py-2 bg-green-50 text-green-800 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
                        in:scale={{ duration: 400, delay: 1100 + (i * 100), start: 0.8 }}
                      >
                        <span>{item}</span>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="mt-4 flex justify-end">
                    <a 
                      href="/" 
                      class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                      in:scale={{ duration: 400, delay: 1500, start: 0.8 }}
                    >
                      <ShoppingCart class="h-4 w-4 mr-2" />
                      Find Ingredients on FoodLoop
                    </a>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Additional Information -->
          <div 
            class="mt-12 max-w-3xl mx-auto"
            in:fly={{ y: 50, duration: 600, delay: 1200 }}
          >
            <div class="grid md:grid-cols-2 gap-6">
              <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-green-300 transition-all duration-300">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                  <ChefHat class="h-5 w-5 mr-2 text-green-600" />
                  How SmartPlate Works
                </h3>
                <p class="text-gray-600">
                  Our AI analyzes your available ingredients and creates custom recipes tailored to what you have.
                  Get creative meal ideas in seconds without needing to search through cookbooks or websites.
                </p>
              </div>
              
              <div class="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:border-green-300 transition-all duration-300">
                <h3 class="text-xl font-bold text-gray-800 mb-3 flex items-center">
                  <ListChecks class="h-5 w-5 mr-2 text-green-600" />
                  Reduce Food Waste
                </h3>
                <p class="text-gray-600">
                  Use ingredients you already have to create delicious meals. SmartPlate helps
                  reduce food waste by inspiring you to use what's in your kitchen before it expires.
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
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }
    
    /* Animation for floating */
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    /* Animation for gentle bounce */
    @keyframes bounce-gentle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
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