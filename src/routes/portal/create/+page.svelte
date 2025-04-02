<script>
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  
  // Import icons from @lucide/svelte
  import { 
    Leaf, 
    ImagePlus, 
    Tag, 
    Building, 
    Clock, 
    ArrowRight 
  } from "@lucide/svelte";
  
  // Form state
  let formVisible = false;
  let formFieldsVisible = false;
  let location = '';
  
  // Tags for food categories
  let foodTags = [
    { name: 'Bakery', selected: false },
    { name: 'Produce', selected: false },
    { name: 'Prepared Meals', selected: false },
    { name: 'Seafood', selected: false },
    { name: 'Cafe Items', selected: false },
    { name: 'Grocery', selected: false }
  ];
  
  // Toggle a tag's selection
  function toggleTag(index) {
    const updatedTags = [...foodTags];
    updatedTags[index].selected = !updatedTags[index].selected;
    foodTags = updatedTags;
  }
  
  // Handle form submission
  function handleSubmit(event) {
    event.preventDefault();
    // Process form submission here
    console.log('Form submitted');
  }
  
  // Make the form visible with animation when component mounts
  onMount(() => {
    setTimeout(() => {
      formVisible = true;
      setTimeout(() => {
        formFieldsVisible = true;
      }, 300);
    }, 200);
  });
  
  // Define fields for easier rendering
  const formFields = [
    { id: 'name', label: 'Item Name', type: 'text', placeholder: 'E.g., Artisan Sourdough Bread', icon: null },
    { id: 'amount', label: 'Quantity Available', type: 'number', placeholder: '5', icon: null },
    { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe your food item, its quality, and why it would otherwise go to waste', icon: null },
    { id: 'location', label: 'Pickup Location', type: 'text', placeholder: 'Enter pickup address', icon: Building },
    { id: 'price', label: 'Discounted Price (€)', type: 'number', placeholder: '2.50', icon: null },
    { id: 'expiry', label: 'Best Before / Expiry Date', type: 'date', placeholder: '', icon: Clock },
    { id: 'tags', label: 'Food Category', type: 'tags', placeholder: '', icon: Tag },
    { id: 'image', label: 'Upload Image', type: 'file', placeholder: 'Browse...', icon: ImagePlus }
  ];
</script>

<svelte:head>
  <title>FoodLoop | Add Surplus Food</title>
  <meta
    name="description"
    content="Add your surplus food to FoodLoop to reduce waste and connect with customers."
  />
</svelte:head>

<!-- Hero section -->
<section class="relative bg-green-50 pb-16">
  <div class="container mx-auto flex flex-col items-center px-4 py-12 md:py-16">
    <div class="mb-8 space-y-4 text-center">
      <div
        class="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
      >
        <Leaf class="mr-1 h-4 w-4" />
        List Your Surplus Food
      </div>

      <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
        Share Your <span class="text-green-600">Extra Food</span>, Fight Waste
      </h1>

      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        Help reduce food waste by listing your surplus items. Connect with customers who value
        sustainability and great deals.
      </p>
    </div>
  </div>

  <!-- Curved separator -->
  <div class="absolute bottom-0 left-0 right-0 h-16 bg-green-50">
    <svg class="absolute bottom-0 h-16 w-full" preserveAspectRatio="none" viewBox="0 0 1440 48">
      <path fill="white" d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"></path>
    </svg>
  </div>
</section>

<!-- Main form section -->
<section class="py-8 md:py-12">
  <div class="container mx-auto px-4">
    <div 
      class="mx-auto max-w-2xl transition-all duration-500 ease-in-out {formVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}"
    >
      <Card.Root class="overflow-hidden border-green-100 shadow-lg">
        <Card.Header class="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <Card.Title class="text-2xl">Add New Food Item</Card.Title>
          <Card.Description class="text-green-50">
            List your surplus food for customers to discover and purchase
          </Card.Description>
        </Card.Header>
        
        <Card.Content class="p-6">
          <form method="POST" action="?create" on:submit={handleSubmit}>
            <div class="grid w-full items-center gap-6">
              <!-- Form fields with animation -->
              {#each formFields as field, i}
                <div 
                  class="flex flex-col space-y-1.5 transition-all duration-500 ease-in-out"
                  style={'transition-delay: ' + (100 + i * 50) + 'ms'}
                  class:translate-y-0={formFieldsVisible}
                  class:opacity-100={formFieldsVisible}
                  class:translate-y-5={!formFieldsVisible}
                  class:opacity-0={!formFieldsVisible}
                >
                  <div class="flex items-center gap-2">
                    {#if field.icon === Building}
                      <Building class="h-4 w-4 text-green-600" />
                    {:else if field.icon === Clock}
                      <Clock class="h-4 w-4 text-green-600" />
                    {:else if field.icon === Tag}
                      <Tag class="h-4 w-4 text-green-600" />
                    {:else if field.icon === ImagePlus}
                      <ImagePlus class="h-4 w-4 text-green-600" />
                    {/if}
                    <Label for={field.id} class="font-medium text-gray-700">{field.label}</Label>
                  </div>
                  
                  {#if field.type === 'textarea'}
                    <Textarea 
                      id={field.id} 
                      name={field.id} 
                      placeholder={field.placeholder}
                      class="min-h-24 border-gray-200 focus-visible:ring-green-500"
                    />
                  
                  {:else if field.type === 'tags'}
                    <div class="flex flex-wrap gap-2 pt-1">
                      {#each foodTags as tag, tagIndex}
                        <button
                          type="button"
                          class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
                          class:bg-green-600={tag.selected}
                          class:text-white={tag.selected}
                          class:bg-green-100={!tag.selected}
                          class:text-green-800={!tag.selected}
                          on:click={() => toggleTag(tagIndex)}
                        >
                          {tag.name}
                        </button>
                      {/each}
                    </div>
                  
                  {:else if field.type === 'file'}
                    <div class="mt-1 flex items-center gap-3">
                      <Button variant="outline" type="button" class="border-dashed text-gray-500">
                        <ImagePlus class="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                      <span class="text-sm text-gray-500">JPEG, PNG or GIF, max 5MB</span>
                    </div>
                  
                  {:else}
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      placeholder={field.placeholder}
                      min={field.type === 'number' ? '0.01' : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                      class="border-gray-200 focus-visible:ring-green-500"
                    />
                  {/if}
                </div>
              {/each}
            </div>
            
            <div 
              class="mt-8 flex justify-between transition-all duration-500 ease-in-out"
              style="transition-delay: 700ms"
              class:translate-y-0={formFieldsVisible}
              class:opacity-100={formFieldsVisible}
              class:translate-y-5={!formFieldsVisible}
              class:opacity-0={!formFieldsVisible}
            >
              <Button variant="outline" type="button" class="border-gray-200 text-gray-700">
                Cancel
              </Button>
              <Button type="submit" class="bg-green-600 hover:bg-green-700">
                List Food Item
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
      
      <!-- Tips box -->
      <div 
        class="mt-6 rounded-lg border border-green-100 bg-green-50 p-4 shadow-sm transition-all duration-500 ease-in-out"
        style="transition-delay: 800ms"
        class:translate-y-0={formFieldsVisible}
        class:opacity-100={formFieldsVisible}
        class:translate-y-5={!formFieldsVisible}
        class:opacity-0={!formFieldsVisible}
      >
        <h3 class="mb-2 flex items-center text-lg font-semibold text-green-800">
          <Leaf class="mr-2 h-5 w-5" />
          Tips for Success
        </h3>
        <ul class="ml-7 list-disc space-y-1 text-sm text-green-700">
          <li>Be honest about the quality and condition of your food</li>
          <li>Add a clear photo to increase interest from customers</li>
          <li>Set a fair price that reflects the discount</li>
          <li>Be specific about pickup times and location</li>
          <li>Respond quickly to customer inquiries</li>
        </ul>
      </div>
    </div>
  </div>
</section>