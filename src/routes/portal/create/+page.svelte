<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { TagsInput } from "$lib/components/ui/tags-input";
  import { FileDropZone, MEGABYTE } from "$lib/components/ui/file-drop-zone";
  import { env } from '$env/dynamic/public';
  import { enhance } from '$app/forms';

  const maps_api = env.PUBLIC_MAPS_API;
  
  const frameworks = [
   {
    value: "sveltekit",
    label: "SvelteKit"
   },
   {
    value: "next",
    label: "Next.js"
   },
   {
    value: "astro",
    label: "Astro"
   },
   {
    value: "nuxt",
    label: "Nuxt.js"
   }
  ];
  
  let framework = $state("");
  
  const selectedFramework = $derived(
   frameworks.find((f) => f.value === framework)?.label ?? "Select a framework"
  );

  import { PlaceAutocomplete } from 'places-autocomplete-svelte';

  // Response handler
  let fullResponse = $state('');
  let onResponse = (response: any) => {
    fullResponse = response;
  };

  // Error handler
  let pacError = '';
  let onError = (error: string) => {
    pacError = error;
  };

  const options = {
    classes : {
      section: '',
      container: 'relative z-10 transform rounded-xl mt-4',
      icon_container: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>',
      input: 'border-1 w-full rounded-md border-0 shadow-sm px-4 py-3 pl-10 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 sm:text-sm',
      kbd_container: 'absolute inset-y-0 right-0 flex py-1.5 pr-1.5',
      kbd_escape: 'inline-flex items-center rounded border border-gray-300 px-1 font-sans text-xs text-gray-500 w-8 mr-1',
      kbd_up: 'inline-flex items-center justify-center rounded border border-gray-300 px-1 font-sans text-xs text-gray-500 w-6',
      kbd_down: 'inline-flex items-center rounded border border-gray-400 px-1 font-sans text-xs text-gray-500 justify-center w-6',
      kbd_active: 'bg-indigo-500 text-white',
      ul: 'absolute z-50 -mb-2 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm divide-y divide-gray-100',
      li: 'z-50 cursor-default select-none py-2 px-2 lg:px-4 text-gray-900 hover:bg-indigo-500 hover:text-white',
      li_current: 'bg-indigo-500',
      li_a: 'block w-full flex justify-between',
      li_a_current: 'text-white',
      li_div_container: 'flex min-w-0 gap-x-4',
      li_div_one: 'min-w-0 flex-auto',
      li_div_one_p: 'text-sm/6 font-semibold',
      li_div_two: 'shrink-0 flex flex-col items-end min-w-16',
      li_div_two_p: 'mt-1 text-xs/5'
    }
  }
  
  /**
  * @type object optional
  * AutocompleteRequest properties
  */
  const requestParams = {
    "language": "en-us",
    "region": "US",
    "includedRegionCodes": [
      "US"
    ]
  }

  let name = $state("Test");
  let amount = $state(1);
  let description = $state("one of one");
  let price = $state(2);
  let expiry = $state("");
  let trash = $state("1");
  let tags = $state([]);
  let fileInput= $state();
  $inspect(fileInput);


  let fileDisabled = $state(false);

</script>

<form method="POST" action="?/create"  enctype="multipart/form-data">
 <Card.Root class="w-[350px]">
  <Card.Header>
   <Card.Title>Create product</Card.Title>
   <Card.Description>Deploy your new project in one-click.</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid w-full items-center gap-4">
     <div class="flex flex-col space-y-1.5">
      <Label for="name">Name</Label>
      <Input id="name" name="name" placeholder="Name of your project" required bind:value={name}/>
     </div>
     
     <div class="flex flex-col space-y-1.5">
      <Label for="amount">Quantity</Label>
      <Input id="amount" name="amount" placeholder="Amount" type="number" min="1" required bind:value={amount}/>
     </div>
     
     <div class="flex flex-col space-y-1.5">
      <Label for="description">Description</Label>
      <Textarea id="description" name="description" placeholder="Type your message here." required bind:value={description}/>
     </div>
     
     <div class="flex flex-col space-y-1.5">
      <Label for="location">Pickup location</Label>
      <input hidden id="location" name="location" value={fullResponse?.formattedAddress || ""} required/>
      <PlaceAutocomplete {onResponse} {onError} {options} requestParams={requestParams} PUBLIC_GOOGLE_MAPS_API_KEY={maps_api}/>
      <p>{fullResponse?.formattedAddress || ""}</p>
     </div>

     <div class="flex flex-col space-y-1.5">
      <Label for="price">Price</Label>
      <Input id="price" name="price" placeholder="2" type="number" min="1" prefix="$" step="1" required bind:value={price}/>
     </div>

     <div class="flex flex-col space-y-1.5">
      <Label for="expiry">Expiry</Label>
      <Input id="expiry" name="expiry" placeholder="2" type="date" required bind:value={expiry}/>
     </div>

     <div class="flex flex-col space-y-1.5">
      <Label for="trash">Trash</Label>
      <Input id="trash" name="trash" placeholder="1" type="number" bind:value={trash}/>
     </div>

     <div class="flex flex-col space-y-1.5">
      <Label for="tags">Tags</Label>
      <TagsInput placeholder="Add tags" id="tags" bind:value={tags}/>
      <input id="tags" name="tags" type="hidden" value={JSON.stringify(tags)} />
     </div>

     <div class="flex flex-col space-y-1.5">
      <Label for="image_url">Picture</Label>
      <Input id="picture" name="image" type="file" accept="image/*" placeholder="Upload a picture" required/>
     </div>
    </div>
  </Card.Content>
  <Card.Footer class="flex justify-between">
   <Button variant="outline" type="button">Cancel</Button>
   <Button type="submit">Create</Button>
  </Card.Footer>
 </Card.Root>
</form>