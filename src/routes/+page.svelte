<script>
    import { page } from '$app/stores';
    import { cn } from '$lib/utils';
    import { ShoppingBasket, Leaf, ArrowRight, Building, User, Earth, Clock } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import { Card } from '$lib/components/ui/card';
  
    // Featured businesses
    const featuredBusinesses = [
      {
        name: "Fresh Harvest Bakery",
        image: "/images/bakery.jpg",
        description: "Artisan breads and pastries at reduced prices at the end of each day",
        discount: "Up to 50% off"
      },
      {
        name: "Green Garden Market",
        image: "/images/market.jpg",
        description: "Fresh produce bundles with items that need to move quickly",
        discount: "25-40% off"
      },
      {
        name: "Coastal Seafood Co.",
        image: "/images/seafood.jpg",
        description: "Daily catches at special prices near closing time",
        discount: "Up to 35% off"
      },
      {
        name: "Sunrise Cafe",
        image: "/images/cafe.jpg",
        description: "Unsold breakfast items packaged for takeaway in the afternoon",
        discount: "60% off"
      }
    ];
  
    // Success metrics
    const metrics = [
      { value: "2.5M+", label: "Meals Saved" },
      { value: "€4.8M", label: "Consumer Savings" },
      { value: "1,200+", label: "Partner Businesses" },
      { value: "8,500+", label: "Tonnes CO₂ Prevented" }
    ];
  
    // How it works steps
    const howItWorks = [
      {
        icon: Building,
        title: "Businesses list surplus",
        description: "Local businesses post available surplus food at discounted prices"
      },
      {
        icon: User,
        title: "Consumers browse & reserve",
        description: "Find deals nearby, pay through the app, and schedule pickup"
      },
      {
        icon: Clock,
        title: "Pick up your order",
        description: "Visit during the designated time window to collect your food"
      },
      {
        icon: Earth,
        title: "Reduce food waste",
        description: "Enjoy delicious food while helping the environment"
      }
    ];
  
    // Testimonials
    const testimonials = [
      {
        quote: "FoodLoop has transformed how we handle end-of-day surplus. We've reduced waste by 78% and connected with new customers.",
        author: "Maria Gonzalez",
        role: "Owner, Fresh Harvest Bakery"
      },
      {
        quote: "I save about €60 per week while trying amazing food from local businesses I might never have discovered otherwise.",
        author: "Thomas Weber",
        role: "Regular FoodLoop User"
      },
      {
        quote: "As a small restaurant, every bit of revenue matters. FoodLoop helps us recover costs on food that would otherwise be thrown away.",
        author: "Ahmed Patel",
        role: "Manager, Spice & Rice Restaurant"
      }
    ];
  
    // News mentions
    const newsMentions = [
      "The Guardian", "TechCrunch", "Food & Wine", "Sustainability Today", "Forbes"
    ];
  
    let statsVisible = false;
    let howItWorksVisible = false;
  </script>
  
  <svelte:head>
    <title>FoodLoop | Save Food. Save Money. Save the Planet.</title>
    <meta name="description" content="FoodLoop connects consumers with local businesses to purchase surplus food at discounted prices, reducing food waste and helping the environment.">
  </svelte:head>
  
  <!-- Hero section -->
  <section class="relative bg-green-50">
    <div class="container px-4 py-12 md:py-24 mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
      <div class="flex-1 space-y-6 text-center md:text-left">
        <div class="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          <Leaf class="h-4 w-4 mr-1" />
          Fighting Food Waste Together
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight">
          Rescue Delicious Food, <span class="text-green-600">Save Money</span> & Our Planet
        </h1>
        
        <p class="text-lg text-muted-foreground max-w-2xl">
          Connect with local businesses offering surplus food at great discounts. 
          Enjoy quality meals while reducing food waste and your environmental footprint.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <Button size="lg" class="bg-green-600 hover:bg-green-700">
            Find Food Deals Near You
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            For Businesses
          </Button>
        </div>
      </div>
      
      <div class="flex-1 relative">
        <img 
          src="/images/hero-food.jpg" 
          alt="Assortment of discounted fresh food available through FoodLoop" 
          class="rounded-lg shadow-xl w-full"
        />
        <div class="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 hidden md:block">
          <div class="flex items-center gap-2">
            <div class="bg-green-50 rounded-full p-2">
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
      <svg class="absolute bottom-0 w-full h-16" preserveAspectRatio="none" viewBox="0 0 1440 48">
        <path 
          fill="white" 
          d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"
        ></path>
      </svg>
    </div>
  </section>
  
  <!-- Featured businesses -->
  <section class="py-12 md:py-24">
    <div class="container px-4 mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold mb-4">Today's Top Deals</h2>
        <p class="text-muted-foreground max-w-2xl mx-auto">
          Explore these amazing offers from local businesses. All items are high-quality and would otherwise go to waste.
        </p>
      </div>
      
      <div class="w-full max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each featuredBusinesses as business}
            <div class="h-full overflow-hidden border rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div class="relative h-48 w-full overflow-hidden">
                <img 
                  src={business.image} 
                  alt={business.name}
                  class="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                />
                <div 
                  class="absolute top-3 right-3 rounded-full bg-green-600 hover:bg-green-700 px-2 py-1 text-xs font-semibold text-white"
                >
                  {business.discount}
                </div>
              </div>
              <div class="p-4">
                <h3 class="font-semibold text-lg mb-1">{business.name}</h3>
                <p class="text-sm text-muted-foreground mb-4">{business.description}</p>
                <Button variant="outline" size="sm" class="w-full">View Offers</Button>
              </div>
            </div>
          {/each}
        </div>
        <div class="flex justify-center mt-8 gap-2">
          <Button variant="outline" size="icon" class="rounded-full">
            <ArrowRight class="h-4 w-4 rotate-180" />
          </Button>
          <Button variant="outline" size="icon" class="rounded-full">
            <ArrowRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div class="text-center mt-8">
        <Button variant="ghost" class="text-green-600 hover:text-green-700 hover:bg-green-50">
          View All Nearby Deals
          <ArrowRight class="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  </section>
  
  <!-- Stats -->
  <section class="bg-green-600 py-12 md:py-20 text-white">
    <div id="stats-section" class="container px-4 mx-auto">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-bold">Our Impact Together</h2>
        <p class="mt-2 max-w-2xl mx-auto text-green-100">
          Every meal saved makes a difference. Here's what we've accomplished so far.
        </p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {#each metrics as metric, i}
          <div class="text-center" class:opacity-0={!statsVisible} style="transition: opacity 0.5s ease-in-out {i * 0.2}s; {statsVisible ? 'opacity: 1' : ''}">
            <p class="text-4xl font-bold">{metric.value}</p>
            <p class="text-green-100">{metric.label}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>
  
  <!-- How it works -->
  <section class="py-12 md:py-24">
    <div id="how-it-works-section" class="container px-4 mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold mb-4">How FoodLoop Works</h2>
        <p class="text-muted-foreground max-w-2xl mx-auto">
          Our platform makes it easy to find, purchase, and pick up surplus food from local businesses.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {#each howItWorks as step, i}
          <div class="text-center flex flex-col items-center" class:opacity-0={!howItWorksVisible} style="transition: opacity 0.5s ease-in-out {i * 0.2}s; {howItWorksVisible ? 'opacity: 1' : ''}">
            <div class="bg-green-100 rounded-full p-4 mb-4">
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
            <h3 class="font-semibold text-lg mb-2">{step.title}</h3>
            <p class="text-muted-foreground">{step.description}</p>
          </div>
        {/each}
      </div>
      
      <div class="text-center mt-10">
        <Button variant="default" class="bg-green-600 hover:bg-green-700">
          Learn More About How It Works
        </Button>
      </div>
    </div>
  </section>
  
  <!-- Testimonials -->
  <section class="bg-gray-50 py-12 md:py-24 relative overflow-hidden">
    <div class="container px-4 mx-auto relative z-10">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold mb-4">What Our Community Says</h2>
        <p class="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of businesses and consumers already making a difference.
        </p>
      </div>
      
      <div class="w-full max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each testimonials as testimonial}
            <div class="border rounded-lg shadow-md bg-white">
              <div class="p-8">
                <p class="text-lg italic mb-6">" {testimonial.quote} "</p>
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 font-semibold">{testimonial.author.charAt(0)}</span>
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
        <div class="flex justify-center mt-8 gap-2">
          <Button variant="outline" size="icon" class="rounded-full">
            <ArrowRight class="h-4 w-4 rotate-180" />
          </Button>
          <Button variant="outline" size="icon" class="rounded-full">
            <ArrowRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <!-- Background decorations -->
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="absolute -left-24 -top-24 w-64 h-64 rounded-full bg-green-100 opacity-30"></div>
        <div class="absolute -right-24 -bottom-24 w-64 h-64 rounded-full bg-green-100 opacity-30"></div>
      </div>
    </div>
  </section>
  
  <!-- CTA -->
  <section class="py-12 md:py-24">
    <div class="container px-4 mx-auto">
      <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl overflow-hidden shadow-xl">
        <div class="flex flex-col md:flex-row items-center">
          <div class="p-8 md:p-12 text-white md:w-2/3">
            <h2 class="text-3xl font-bold mb-4">Ready to Join the Movement?</h2>
            <p class="text-green-50 mb-6 max-w-2xl">
              Whether you're a business with surplus food or a consumer looking to save money while reducing waste,
              FoodLoop makes it easy to make a difference. Sign up today and be part of the solution.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <Button size="lg" class="bg-white text-green-600 hover:bg-gray-100">
                Sign Up Now
              </Button>
              <Button size="lg" variant="outline" class="text-white border-white hover:bg-green-700">
                Learn More
              </Button>
            </div>
            
            <div class="mt-8">
              <p class="text-sm text-green-50 mb-2">As featured in:</p>
              <div class="flex flex-wrap gap-4 items-center">
                {#each newsMentions as publication}
                  <span class="text-white font-medium text-sm">{publication}</span>
                  {#if publication !== newsMentions[newsMentions.length - 1]}
                  <span class="w-1 h-1 rounded-full bg-green-50"></span>
                  {/if}
                {/each}
              </div>
            </div>
          </div>
          
          <div class="hidden md:block md:w-1/3">
            <img 
              src="/images/food-box.jpg" 
              alt="Box of fresh food rescued from waste"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  </section>