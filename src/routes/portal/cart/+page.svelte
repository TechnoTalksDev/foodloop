<script lang="ts">
	import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button/index.js";
import * as Card from "$lib/components/ui/card/index.js";
import * as Avatar from "$lib/components/ui/avatar/index.js";

  let { data }: PageProps = $props();

  $inspect(data.products)


  async function clearCart(id: string = "") {
    console.log(data.products)
    
    if (id != "") {
      data = { ...data, products: data.products.filter(product => product.id !== Number(id)) };
    }else {
      data = {...data, products: []}
    }
    console.log(data.products)

    console.log("ran clear cart")
    
    await fetch(`/portal/cart/clear/${id}`, {
      method: 'POST',
    });
    
  }
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
        <Avatar.Image src={product.owner.avatar} alt={product.owner.username ?? product.owner.name} />
        <Avatar.Fallback>CN</Avatar.Fallback>
      </Avatar.Root>
      <p>{product.owner.username ?? product.owner.name}</p>
      <Button onclick={async () => {await clearCart(product.id)}}>Remove</Button>
    </div>
  </Card.Footer>
</Card.Root>
{/each}


<Button>Checkout</Button>

<Button onclick={async () => {await clearCart()}}>Clear all</Button>