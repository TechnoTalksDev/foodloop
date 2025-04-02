<script lang="ts">
  import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import * as Avatar from "$lib/components/ui/avatar";
  import { Badge } from "$lib/components/ui/badge";
  import { addToCart } from "$lib/utils";
  import { onMount } from "svelte";
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut, backOut, cubicOut } from 'svelte/easing';
  
  // Import Lucide icons
  import ShoppingCart from 'lucide-svelte/icons/shopping-cart';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import Tag from 'lucide-svelte/icons/tag';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Package from 'lucide-svelte/icons/package';
  import Leaf from 'lucide-svelte/icons/leaf';
  import DollarSign from 'lucide-svelte/icons/dollar-sign';
  import ShoppingBag from 'lucide-svelte/icons/shopping-bag';
  
  export let data: PageProps["data"];
  
  let product = data.product;
  console.log(data.owner.username ?? data.owner.name);
  console.log(data.user?.user_metadata.name);
  
  // Format date nicely
  function formatDate(dateString: string): string {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  // Animation control
  let visible = false;
  onMount(() => {
    visible = true;
  });
  
  // Handle add to cart with animation
  let isAddingToCart = false;
  function handleAddToCart() {
    isAddingToCart = true;
    addToCart(product.id);
    setTimeout(() => {
      isAddingToCart = false;
    }, 1000);
  }
  
  // Parse tags if they're in JSON format
  let tags: string[] = [];
  try {
    if (product.tags && typeof product.tags === 'string') {
      tags = JSON.parse(product.tags);
    }
  } catch (e) {
    // If not valid JSON, try to split by commas
    if (product.tags && typeof product.tags === 'string') {
      tags = product.tags.split(',').map(tag => tag.trim());
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
  <div class="container mx-auto px-4">
    {#if visible}
      <div 
        class="mb-8 text-center"
        in:fade={{ duration: 600 }}
      >
        <h1 class="text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center">
          <Leaf class="h-8 w-8 text-green-600 mr-3 animate-bounce-slow" />
          Product Details
        </h1>
        <p class="text-gray-600 max-w-xl mx-auto">
          Rescue this delicious food item, save money, and help the planet!
        </p>
      </div>
      
      <div class="max-w-4xl mx-auto">
        <div 
          class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
          in:fly={{ y: 30, duration: 600, delay: 200 }}
        >
          <!-- Product Header -->
          <div class="bg-gradient-to-r from-green-50 to-white p-6 border-b border-gray-100">
            <div class="flex items-center mb-2">
              <Badge variant="outline" class="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                <Leaf class="h-3 w-3 mr-1" />
                Food Rescue
              </Badge>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">{product.name}</h1>
            <p class="text-gray-600 mt-2">{product.description}</p>
          </div>
          
          <!-- Product content in two columns on larger screens -->
          <div class="flex flex-col md:flex-row">
            <!-- Product image column -->
            <div 
              class="md:w-2/5 p-6"
              in:fly={{ x: -20, duration: 500, delay: 400 }}
            >
              {#if product.image_url}
                <div class="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    class="w-full h-full object-cover"
                  />
                </div>
              {:else}
                <div class="rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center h-64 w-full">
                  <Package class="h-16 w-16 text-gray-400" />
                </div>
              {/if}
              
              <!-- Owner info -->
              <div 
                class="mt-6 bg-gray-50 rounded-lg p-4 flex items-center"
                in:scale={{ duration: 400, delay: 800, start: 0.8 }}
              >
                <Avatar.Root class="h-12 w-12 border-2 border-green-100">
                  {#if data.owner.avatar}
                    <Avatar.Image src={data.owner.avatar} alt={data.owner.username ?? data.owner.name} />
                  {:else}
                    <Avatar.Fallback class="bg-green-100 text-green-800">
                      {(data.owner.username ?? data.owner.name).slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  {/if}
                </Avatar.Root>
                <div class="ml-4">
                  <p class="text-sm text-gray-500">Offered by</p>
                  <p class="font-medium text-gray-800">{data.owner.username ?? data.owner.name}</p>
                </div>
              </div>
            </div>
            
            <!-- Product details column -->
            <div 
              class="md:w-3/5 p-6 md:border-l border-gray-100"
              in:fly={{ x: 20, duration: 500, delay: 500 }}
            >
              <!-- Price -->
              <div class="mb-6">
                <h2 class="text-3xl font-bold text-green-600 flex items-center">
                  <DollarSign class="h-6 w-6 mr-1" />
                  {product.price}
                </h2>
                <p class="text-gray-500 text-sm">Discounted price to prevent food waste</p>
              </div>
              
              <!-- Product details in a grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="flex items-start">
                  <Package class="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p class="text-sm text-gray-500">Quantity Available</p>
                    <p class="font-medium">{product.amount} unit{product.amount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <MapPin class="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p class="text-sm text-gray-500">Pickup Location</p>
                    <p class="font-medium">{product.location || "Contact seller"}</p>
                  </div>
                </div>
                
                <div class="flex items-start">
                  <CalendarClock class="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p class="text-sm text-gray-500">Expiry Date</p>
                    <p class="font-medium">{formatDate(product.expiry)}</p>
                  </div>
                </div>
              </div>
              
              <!-- Tags -->
              {#if tags.length > 0}
                <div class="mb-6">
                  <div class="flex items-center mb-2">
                    <Tag class="h-4 w-4 text-green-600 mr-2" />
                    <p class="text-sm text-gray-600 font-medium">Tags</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {#each tags as tag}
                      <Badge variant="outline" class="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                        {tag}
                      </Badge>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Call to action buttons -->
              <div 
                class="flex flex-col sm:flex-row gap-3 mt-8"
                in:scale={{ duration: 500, delay: 900, start: 0.8 }}
              >
                <Button 
                  on:click={handleAddToCart}
                  variant="outline" 
                  class="bg-white border border-green-200 text-green-700 hover:bg-green-50 flex-1"
                  disabled={isAddingToCart}
                >
                  {#if isAddingToCart}
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  {:else}
                    <ShoppingCart class="mr-2 h-5 w-5" />
                    Add to Cart
                  {/if}
                </Button>
                
                <Button variant="default" class="bg-green-600 hover:bg-green-700 text-white flex-1">
                  <ShoppingBag class="mr-2 h-5 w-5" />
                  Buy Now
                </Button>
              </div>
              
              <!-- Environmental impact -->
              <div 
                class="mt-8 bg-green-50 rounded-lg p-4 border border-green-100"
                in:fade={{ duration: 400, delay: 1000 }}
              >
                <h3 class="text-green-800 font-medium flex items-center mb-2">
                  <Leaf class="h-4 w-4 mr-2" />
                  Environmental Impact
                </h3>
                <p class="text-green-700 text-sm">
                  By purchasing this item, you're helping save approximately 
                  <span class="font-bold">{Math.round(product.amount * 1.2 * 10) / 10} kg</span> 
                  of CO₂ emissions and preventing perfectly good food from going to waste.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Similar products suggestion -->
          <div 
            class="p-6 border-t border-gray-100 bg-gray-50"
            in:fly={{ y: 20, duration: 400, delay: 1100 }}
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-medium text-gray-800">You might also like</h3>
              <a href="/portal" class="text-green-600 hover:text-green-700 text-sm font-medium">
                View all deals →
              </a>
            </div>
            <p class="text-gray-600 text-sm">
              Explore more food rescue opportunities to maximize your environmental impact.
            </p>
          </div>
        </div>
        
        <!-- Back button -->
        <div class="mt-6 flex justify-center">
          <a 
            href="/portal" 
            class="text-green-600 hover:text-green-700 flex items-center text-sm font-medium"
          >
            ← Back to all products
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Animation for slow bounce */
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite ease-in-out;
  }
</style>