<script lang="ts">
	import type { PageProps } from './$types';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { addToCart } from '$lib/utils';
	import { goto } from '$app/navigation';
	let { data }: PageProps = $props();
</script>

<h1 class="">PORTAL</h1>

{#if data}
	{#each data.products as product, i}
		<Card.Root>
			<Card.Header>
				<Card.Title
					><a href="/portal/product/{product.id}" class="underline">{product.name}</a></Card.Title
				>
				<Card.Description>{product.description}</Card.Description>
			</Card.Header>
			<Card.Content>
				<p>{product.price}</p>
				<img src={product.image_url} alt={product.name} />
				<p>{product.image_url}</p>
				<p>{product.amount}</p>
				<p>{product.location}</p>
				<p>{product.expiry}</p>
				<p>{product.trash}</p>
				<p>{product.tags}</p>
			</Card.Content>
			<Card.Footer>
				<p>{product.owner_id}</p>
				<Button
					variant="outline"
					onclick={() => {
						addToCart(product.id);
						toast.success(`${product.name}`, {
							description: `has been added to cart`,
							action: {
								label: 'Go to Cart',
								onClick: () => goto("/portal/cart")
							}
						});
					}} disabled={product.disabled ?? false}>Add to cart</Button
				>
				<Button>Buy now</Button>
			</Card.Footer>
		</Card.Root>
	{/each}
{:else}
	<p>Loading...</p>
{/if}
