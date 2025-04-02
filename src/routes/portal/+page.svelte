<script lang="ts">
	import type { PageProps } from "./$types";

  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
	import { addToCart } from "$lib/utils";
  let { data }: PageProps = $props();
</script>

<h1 class="">PORTAL</h1>

{#if data}
{#each data.products as product}

 

<Card.Root>
  <Card.Header>
    <Card.Title><a href="/portal/product/{product.id}" class="underline">{product.name}</a></Card.Title>
    <Card.Description>{product.description}</Card.Description>
  </Card.Header>
  <Card.Content>  
    <p>{product.price}</p>
    <img src="{product.image_url}" alt={product.name}/>
    <p>{product.image_url}</p>
    <p>{product.amount}</p>
    <p>{product.location}</p>
    <p>{product.expiry}</p>
    <p>{product.trash}</p>
    <p>{product.tags}</p>
    
  </Card.Content>
  <Card.Footer>
    <p>{product.owner_id}</p>
    <Button variant="outline" onclick={() => {addToCart(product.id)}}>Add to cart</Button>
    <Button >Buy now</Button>

  </Card.Footer>
</Card.Root>


{/each}

{:else}
<p>Loading...</p>
{/if}