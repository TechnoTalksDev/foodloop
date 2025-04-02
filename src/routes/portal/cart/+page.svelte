<script lang="ts">
	import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button/index.js";
import * as Card from "$lib/components/ui/card/index.js";
import * as Avatar from "$lib/components/ui/avatar/index.js";

  let { data }: PageProps = $props();

  $inspect(data.products)
</script>

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


    
    <div class="flex gap-2 items-center justify-items-center">

      <Avatar.Root>
        <Avatar.Image src={data.owner.avatar} alt={data.owner.username ?? data.owner.name} />
        <Avatar.Fallback>CN</Avatar.Fallback>
      </Avatar.Root>
      <p>{data.owner.username ?? data.owner.name}</p>
    </div>
  </Card.Footer>
</Card.Root>
{/each}