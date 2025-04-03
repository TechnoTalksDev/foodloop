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
		kbd_active: 'bg-green-500 text-white',
		ul: 'absolute z-50 -mb-2 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm divide-y divide-gray-100',
		li: 'z-50 cursor-default select-none py-2 px-2 lg:px-4 text-gray-900 hover:bg-green-500 hover:text-white',
		li_current: 'bg-green-500',
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
  
  <div class="bg-white py-12 md:py-16">
	<div class="container mx-auto px-4">
	  <div class="mx-auto max-w-md">
		<form method="POST" action="?/create" enctype="multipart/form-data">
		  <Card.Root class="w-full border-0 shadow-lg rounded-xl overflow-hidden">
			<Card.Header class="bg-green-50 border-b border-green-100">
			  <Card.Title class="text-2xl font-bold text-gray-900">Create product</Card.Title>
			  <Card.Description class="text-green-800">List your surplus food item for others to rescue.</Card.Description>
			</Card.Header>
			<Card.Content class="p-6 space-y-6">
			  <div class="grid w-full items-center gap-5">
				<div class="flex flex-col space-y-2">
				  <Label for="name" class="font-medium text-gray-700">Name</Label>
				  <Input id="name" name="name" placeholder="Name of your food item" required bind:value={name} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				</div>
				
				<div class="flex flex-col space-y-2">
				  <Label for="amount" class="font-medium text-gray-700">Quantity</Label>
				  <Input id="amount" name="amount" placeholder="Amount" type="number" min="1" required bind:value={amount} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				</div>
				
				<div class="flex flex-col space-y-2">
				  <Label for="description" class="font-medium text-gray-700">Description</Label>
				  <Textarea id="description" name="description" placeholder="Describe your food item" required bind:value={description} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50 min-h-24"/>
				</div>
				
				<div class="flex flex-col space-y-2">
				  <Label for="location" class="font-medium text-gray-700">Pickup location</Label>
				  <input hidden id="location" name="location" value={fullResponse?.formattedAddress || ""} required/>
				  <PlaceAutocomplete {onResponse} {onError} {options} requestParams={requestParams} PUBLIC_GOOGLE_MAPS_API_KEY={maps_api}/>
				  <p class="text-sm text-green-600 mt-1">{fullResponse?.formattedAddress || ""}</p>
				</div>
  
				<div class="flex flex-col space-y-2">
				  <Label for="price" class="font-medium text-gray-700">Price</Label>
				  <Input id="price" name="price" placeholder="2" type="number" min="1" prefix="$" step="1" required bind:value={price} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				</div>
  
				<div class="flex flex-col space-y-2">
				  <Label for="expiry" class="font-medium text-gray-700">Expiry</Label>
				  <Input id="expiry" name="expiry" placeholder="2" type="date" required bind:value={expiry} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				</div>
  
				<div class="flex flex-col space-y-2">
				  <Label for="trash" class="font-medium text-gray-700">Trash</Label>
				  <Input id="trash" name="trash" placeholder="1" type="number" bind:value={trash} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				</div>
  
				<div class="flex flex-col space-y-2">
				  <Label for="tags" class="font-medium text-gray-700">Tags</Label>
				  <TagsInput placeholder="Add tags" id="tags" bind:value={tags} class="rounded-lg border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"/>
				  <input id="tags" name="tags" type="hidden" value={JSON.stringify(tags)} />
				</div>
  
				<div class="flex flex-col space-y-2">
				  <Label for="image_url" class="font-medium text-gray-700">Picture</Label>
				  <div class="border-2 border-dashed border-green-200 rounded-lg p-4 bg-green-50 flex items-center">
					<label for="picture" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded cursor-pointer mr-3">Choose File</label>
					<span id="file-chosen" class="text-gray-500">No file chosen</span>
					<input id="picture" name="image" type="file" accept="image/*" required class="hidden" />
				  </div>
				</div>
			  </div>
			</Card.Content>
			<Card.Footer class="flex justify-between p-6 bg-gray-50 border-t border-gray-100">
			  <Button variant="outline" type="button" class="border-gray-300 hover:bg-gray-100 text-gray-700">Cancel</Button>
			  <Button type="submit" class="bg-green-600 hover:bg-green-700 text-white">Create Listing</Button>
			</Card.Footer>
		  </Card.Root>
		</form>
	  </div>
	</div>
  </div>