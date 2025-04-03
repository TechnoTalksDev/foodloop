import type { RequestEvent } from '@sveltejs/kit';

const API_KEY = 'AIzaSyBPXcUCXyneITF0HMUChpULX_W173dK-lQ';
const GEMINI_API_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface Recipe {
	name: string;
	ingredients: string[];
	instructions: string[];
	cookingTime: string;
	recommendedItems: string[];
}

export const actions = {
	default: async ({ request }: RequestEvent) => {
		try {
			const formData = await request.formData();
			const ingredients = formData.get('ingredients')?.toString() || '';

			if (!ingredients) {
				return {
					success: false,
					error: 'Please provide some ingredients'
				};
			}

			// Prepare the prompt for Gemini API
			const prompt = `
        You are SmartPlate, a helpful AI assistant focused exclusively on creating recipes based on combinations of ingredients.
        You only respond to food and cooking related inquiries.
        
        Please create a recipe using these ingredients: ${ingredients}
        
        Format your response in JSON with these keys:
        1. "name": A creative, unique name for the recipe
        2. "ingredients": An array of strings listing all ingredients with measurements
        3. "instructions": An array of strings with step-by-step cooking instructions
        4. "cookingTime": A string with estimated preparation and cooking time
        5. "recommendedItems": An array of strings listing 3-5 complementary ingredients that could be ordered from FoodLoop

        Keep your JSON structure simple and ensure all values are string or array of strings only.
        
        Example format:
        {
          "name": "Recipe Name",
          "ingredients": ["1 cup ingredient 1", "2 tbsp ingredient 2"],
          "instructions": ["Step 1: Do this", "Step 2: Do that"],
          "cookingTime": "30 minutes",
          "recommendedItems": ["item 1", "item 2", "item 3"]
        }
      `;

			console.log('Sending request to Gemini API with ingredients:', ingredients);

			// Call Gemini API
			const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt
								}
							]
						}
					],
					generationConfig: {
						temperature: 0.7,
						topK: 40,
						topP: 0.95,
						maxOutputTokens: 1024
					},
					safetySettings: [
						{
							category: 'HARM_CATEGORY_HARASSMENT',
							threshold: 'BLOCK_MEDIUM_AND_ABOVE'
						},
						{
							category: 'HARM_CATEGORY_HATE_SPEECH',
							threshold: 'BLOCK_MEDIUM_AND_ABOVE'
						},
						{
							category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
							threshold: 'BLOCK_MEDIUM_AND_ABOVE'
						},
						{
							category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
							threshold: 'BLOCK_MEDIUM_AND_ABOVE'
						}
					]
				})
			});

			if (!geminiResponse.ok) {
				const errorData = await geminiResponse.json();
				console.error('Gemini API error:', errorData);
				return {
					success: false,
					error: `Failed to generate recipe (${geminiResponse.status})`,
					details: JSON.stringify(errorData)
				};
			}

			const geminiData = await geminiResponse.json();
			console.log('Received response from Gemini API');

			// Parse the response from Gemini
			let recipeText = '';

			try {
				recipeText = geminiData.candidates[0].content.parts[0].text;
				// Clean up the response to ensure it's valid JSON
				recipeText = recipeText.replace(/```json|```/g, '').trim();
				console.log('Cleaned response text');
			} catch (error) {
				console.error('Failed to extract text from Gemini response:', error);
				return {
					success: false,
					error: 'Failed to process AI response',
					details: 'The response format from the AI was unexpected'
				};
			}

			let parsedRecipe: any;
			let recipe: Recipe;

			try {
				// Attempt to parse the JSON response
				parsedRecipe = JSON.parse(recipeText);
				console.log('Parsed recipe object');

				// Validate and sanitize the recipe
				recipe = {
					name: typeof parsedRecipe.name === 'string' ? parsedRecipe.name : 'Custom Recipe',
					ingredients: Array.isArray(parsedRecipe.ingredients)
						? parsedRecipe.ingredients
						: [ingredients],
					instructions: Array.isArray(parsedRecipe.instructions)
						? parsedRecipe.instructions
						: ['No detailed instructions provided'],
					cookingTime:
						typeof parsedRecipe.cookingTime === 'string' ? parsedRecipe.cookingTime : 'Varies',
					recommendedItems: Array.isArray(parsedRecipe.recommendedItems)
						? parsedRecipe.recommendedItems
						: ['Try our other fresh ingredients!']
				};

				console.log('Sanitized recipe object');
			} catch (error) {
				console.error('Failed to parse Gemini response as JSON:', error);

				// Fallback: Create a structured response if JSON parsing fails
				recipe = {
					name: 'Quick Recipe with ' + ingredients.split(',')[0],
					ingredients: ingredients.split(',').map((item) => item.trim()),
					instructions: ['Combine all ingredients', 'Cook until done', 'Serve and enjoy!'],
					cookingTime: 'Approximately 30 minutes',
					recommendedItems: ['Fresh herbs', 'Olive oil', 'Sea salt', 'Black pepper', 'Lemon']
				};
			}

			// Return the recipe response
			return {
				success: true,
				recipe
			};
		} catch (error: unknown) {
			console.error('Error generating recipe:', error);

			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

			return {
				success: false,
				error: 'Failed to generate recipe',
				details: errorMessage
			};
		}
	}
};
