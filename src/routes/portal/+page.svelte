<script lang="ts">
	import type { PageProps } from "./$types";


  let { data }: PageProps = $props();
</script>

<h1>PORTAL</h1>

{#each data.products as product}
  <p>{product.name}</p>
  <p>{product.price}</p>
  <p>{product.description}</p>
  <p>{product.image_url}</p>
  <p>{product.amount}</p>
  <p>{product.location}</p>
  <p>{product.expiry}</p>
  <p>{product.trash}</p>
  <p>{product.tags}</p>
  <p>{product.owner_id}</p>
{/each}