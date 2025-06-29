import { supabase } from "@/config/supabase";

const API_KEY = "AIzaSyCB5BR0-zGxedYP3yH6V7P88_mA6oe8f0s";
const GEMINI_API_URL =
	"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	images?: string[];
	productSuggestions?: ProductSuggestion[];
}

export interface ProductSuggestion {
	id: string;
	name: string;
	price: number;
	business: string;
	location: string;
	image_url?: string;
	relevance_reason: string;
}

export interface MarketplaceProduct {
	id: string;
	name: string;
	price: number;
	description: string;
	location: string;
	image_url: string[] | string;
	user_id: string;
	tags: any[];
	amount: number;
	original_price?: string | number;
	business?: string;
}

export interface GeminiResponse {
	candidates: {
		content: {
			parts: {
				text: string;
			}[];
		};
	}[];
}

// AI Mode system prompts
const AI_MODE_PROMPTS = {
	smartplate: `You are SmartPlate AI, a recipe and cooking assistant specialized in the FoodLoop marketplace. Your expertise includes:

CORE FUNCTIONS:
- Create recipes from available ingredients and FoodLoop marketplace items
- Suggest creative ways to use surplus/discounted foods
- Provide cooking techniques that minimize food waste
- Recommend meal planning strategies using marketplace items

APPROACH:
- Always prioritize reducing food waste in your recommendations
- Suggest sustainable cooking methods and storage techniques
- When users mention ingredients, check if similar items are available on FoodLoop
- Provide step-by-step recipes with prep time, cook time, and difficulty level
- Offer substitution suggestions using marketplace alternatives

MARKETPLACE INTEGRATION:
- Actively suggest relevant products from FoodLoop when appropriate
- Help users discover new ingredients from local businesses
- Explain how surplus food can be just as nutritious and delicious
- Promote supporting local food businesses through the marketplace`,

	smartdoctor: `You are SmartDoctor AI, a plant health and agricultural specialist. Your expertise includes:

DIAGNOSTIC CAPABILITIES:
- Identify plant diseases, pests, and nutrient deficiencies from photos
- Recognize symptoms of over/under-watering, light issues, and environmental stress
- Analyze soil conditions, leaf discoloration, growth patterns, and structural issues
- Assess plant maturity and optimal harvest timing

TREATMENT RECOMMENDATIONS:
- Provide organic and sustainable treatment options
- Suggest preventive care measures and integrated pest management
- Recommend proper pruning, fertilization, and watering schedules
- Offer companion planting suggestions for natural pest control

GROWING GUIDANCE:
- Advise on optimal growing conditions for different crops
- Help with crop rotation and seasonal planning
- Provide guidance on seed starting, transplanting, and plant care
- Suggest varieties suitable for local growing conditions`,

	harvesthelper: `You are HarvestHelper AI, an agricultural optimization specialist focused on harvest timing and post-harvest management. Your expertise includes:

HARVEST OPTIMIZATION:
- Determine optimal harvest timing for maximum quality and yield
- Identify ripeness indicators for various crops and varieties
- Suggest harvest scheduling to extend growing seasons
- Advise on succession planting for continuous harvests

STORAGE & PRESERVATION:
- Recommend proper storage conditions for different crops
- Suggest preservation methods to extend shelf life
- Provide guidance on root cellars, cold storage, and controlled atmosphere storage
- Offer techniques for minimizing post-harvest losses

MARKET READINESS:
- Help prepare crops for sale on FoodLoop marketplace
- Suggest packaging and presentation techniques
- Advise on pricing strategies for surplus produce
- Recommend timing for listing items to maximize sales`,

	soilsage: `You are SoilSage AI, a soil health and fertility expert specializing in sustainable agriculture. Your expertise includes:

SOIL ANALYSIS:
- Interpret soil test results and recommend amendments
- Identify soil structure, drainage, and compaction issues
- Assess soil pH, nutrient levels, and organic matter content
- Recognize signs of soil degradation or contamination

SOIL IMPROVEMENT:
- Design composting systems for different scales and needs
- Recommend organic fertilizers and natural amendments
- Suggest cover cropping and green manure strategies
- Provide guidance on building soil biology and microbial health

SUSTAINABLE PRACTICES:
- Promote no-till and reduced tillage methods
- Advise on crop rotation for soil health improvement
- Suggest ways to increase carbon sequestration in soil
- Help design permaculture and regenerative agriculture systems`,

	weatherwise: `You are WeatherWise AI, a climate and weather specialist for agricultural planning. Your expertise includes:

WEATHER ADAPTATION:
- Help farmers adapt to changing weather patterns and climate conditions
- Suggest crop varieties suited to local climate challenges
- Provide guidance on season extension techniques
- Advise on drought, flood, and extreme weather preparedness

SEASONAL PLANNING:
- Create planting schedules based on local weather patterns
- Recommend protection methods for crops during weather events
- Suggest timing for field operations and harvest activities
- Help plan for seasonal labor and resource needs

CLIMATE RESILIENCE:
- Promote climate-smart agriculture practices
- Suggest water conservation and irrigation strategies
- Advise on building resilience against climate variability
- Recommend diversification strategies to reduce weather-related risks`,

	wastewarrior: `You are WasteWarrior AI, a food waste reduction and resource optimization expert. Your expertise includes:

WASTE PREVENTION:
- Suggest proper food storage techniques to extend freshness
- Provide meal planning strategies to minimize waste
- Recommend portion control and inventory management
- Offer creative ways to use food scraps and byproducts

RESCUE & REPURPOSE:
- Help transform surplus ingredients into valuable products
- Suggest preservation methods like pickling, fermenting, and dehydrating
- Provide recipes for using overripe or imperfect produce
- Connect users with FoodLoop opportunities to rescue surplus food

CIRCULAR ECONOMY:
- Promote composting and nutrient recycling
- Suggest ways to turn food waste into valuable resources
- Help businesses optimize their waste streams
- Advise on donation programs and surplus food redistribution`,
};

export class GeminiService {
	private static instance: GeminiService;
	private marketplaceProducts: MarketplaceProduct[] = [];
	private lastProductsFetch: number = 0;
	private readonly PRODUCTS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	static getInstance(): GeminiService {
		if (!GeminiService.instance) {
			GeminiService.instance = new GeminiService();
		}
		return GeminiService.instance;
	}

	private detectAIMode(content: string): string {
		const contentLower = content.toLowerCase();

		// Check for mode indicators in the message
		if (content.includes("[SmartPlate Mode]")) return "smartplate";
		if (content.includes("[SmartDoctor Mode]")) return "smartdoctor";
		if (content.includes("[HarvestHelper Mode]")) return "harvesthelper";
		if (content.includes("[SoilSage Mode]")) return "soilsage";
		if (content.includes("[WeatherWise Mode]")) return "weatherwise";
		if (content.includes("[WasteWarrior Mode]")) return "wastewarrior";

		// Fallback keyword detection
		if (
			contentLower.includes("recipe") ||
			contentLower.includes("cook") ||
			contentLower.includes("ingredient")
		) {
			return "smartplate";
		}
		if (
			contentLower.includes("plant") ||
			contentLower.includes("disease") ||
			contentLower.includes("pest")
		) {
			return "smartdoctor";
		}
		if (
			contentLower.includes("harvest") ||
			contentLower.includes("storage") ||
			contentLower.includes("preserve")
		) {
			return "harvesthelper";
		}
		if (
			contentLower.includes("soil") ||
			contentLower.includes("compost") ||
			contentLower.includes("fertilizer")
		) {
			return "soilsage";
		}
		if (
			contentLower.includes("weather") ||
			contentLower.includes("climate") ||
			contentLower.includes("season")
		) {
			return "weatherwise";
		}
		if (
			contentLower.includes("waste") ||
			contentLower.includes("surplus") ||
			contentLower.includes("leftover")
		) {
			return "wastewarrior";
		}

		return "smartplate"; // Default mode
	}

	private async fetchMarketplaceProducts(): Promise<void> {
		const now = Date.now();

		// Return cached products if they're fresh
		if (
			this.marketplaceProducts.length > 0 &&
			now - this.lastProductsFetch < this.PRODUCTS_CACHE_DURATION
		) {
			return;
		}

		try {
			const { data: products, error } = await supabase
				.from("product")
				.select(
					`
          id,
          name,
          price,
          description,
          location,
          image_url,
          user_id,
          tags,
          amount,
          original_price
        `,
				)
				.gt("amount", 0) // Only available products
				.order("created_at", { ascending: false })
				.limit(50);

			if (error) {
				console.error("Error fetching marketplace products:", error);
				return;
			}

			if (products) {
				// Get business names for products
				const userIds = [...new Set(products.map((p) => p.user_id))];
				const { data: users } = await supabase
					.from("users")
					.select("id, username, name")
					.in("id", userIds);

				const userMap = new Map();
				users?.forEach((user) => {
					userMap.set(user.id, user.username || user.name || "Local Business");
				});

				this.marketplaceProducts = products.map((product) => ({
					...product,
					business: userMap.get(product.user_id) || "Local Business",
				}));

				this.lastProductsFetch = now;
			}
		} catch (error) {
			console.error("Error in fetchMarketplaceProducts:", error);
		}
	}

	private findRelevantProducts(
		content: string,
		mode: string,
		maxProducts: number = 3,
	): ProductSuggestion[] {
		if (this.marketplaceProducts.length === 0) {
			return [];
		}

		const contentLower = content.toLowerCase();
		const suggestions: ProductSuggestion[] = [];

		// Mode-specific product filtering
		const shouldIncludeProduct = (product: MarketplaceProduct): boolean => {
			const name = product.name.toLowerCase();
			const desc = product.description?.toLowerCase() || "";
			const tags =
				product.tags?.map((t) => t.label?.toLowerCase()).join(" ") || "";
			const productText = `${name} ${desc} ${tags}`;

			switch (mode) {
				case "smartplate":
					return true; // All food products are relevant for recipes
				case "smartdoctor":
					return (
						productText.includes("seed") ||
						productText.includes("plant") ||
						productText.includes("herb") ||
						productText.includes("organic")
					);
				case "harvesthelper":
					return (
						productText.includes("fresh") ||
						productText.includes("harvest") ||
						productText.includes("produce") ||
						productText.includes("vegetable") ||
						productText.includes("fruit")
					);
				case "soilsage":
					return (
						productText.includes("compost") ||
						productText.includes("fertilizer") ||
						productText.includes("organic") ||
						productText.includes("soil")
					);
				case "weatherwise":
					return (
						productText.includes("seasonal") ||
						productText.includes("winter") ||
						productText.includes("summer") ||
						productText.includes("greenhouse")
					);
				case "wastewarrior":
					const originalPrice =
						typeof product.original_price === "string"
							? parseFloat(product.original_price || "0")
							: product.original_price || 0;
					return originalPrice > 0 && product.price < originalPrice * 0.7; // Discounted items
				default:
					return true;
			}
		};

		for (const product of this.marketplaceProducts) {
			if (!shouldIncludeProduct(product)) continue;

			let relevanceScore = 0;
			let reason = "";

			// Check name match
			const nameWords = product.name.toLowerCase().split(" ");
			const nameMatches = nameWords.filter((word) =>
				contentLower.includes(word),
			);
			if (nameMatches.length > 0) {
				relevanceScore += nameMatches.length * 3;
				reason = `Contains ${nameMatches.join(", ")}`;
			}

			// Check description match
			if (product.description) {
				const descWords = product.description.toLowerCase().split(" ");
				const descMatches = descWords.filter(
					(word) => word.length > 3 && contentLower.includes(word),
				);
				if (descMatches.length > 0) {
					relevanceScore += descMatches.length;
					reason = reason || `Related to ${descMatches.slice(0, 2).join(", ")}`;
				}
			}

			// Check tags match
			if (product.tags && Array.isArray(product.tags)) {
				const tagMatches = product.tags.filter((tag) =>
					contentLower.includes(tag.label?.toLowerCase() || ""),
				);
				if (tagMatches.length > 0) {
					relevanceScore += tagMatches.length * 2;
					reason =
						reason ||
						`Matches ${tagMatches.map((t) => t.label).join(", ")} categories`;
				}
			}

			// Mode-specific scoring boosts
			if (mode === "wastewarrior" && product.original_price) {
				const originalPrice =
					typeof product.original_price === "string"
						? parseFloat(product.original_price)
						: product.original_price;
				const discount = (originalPrice - product.price) / originalPrice;
				if (discount > 0.3) {
					relevanceScore += 5;
					reason =
						reason ||
						`${Math.round(discount * 100)}% off - rescue surplus food`;
				}
			}

			if (relevanceScore > 0) {
				suggestions.push({
					id: product.id,
					name: product.name,
					price: product.price,
					business: product.business || "Local Business",
					location: product.location,
					image_url: Array.isArray(product.image_url)
						? product.image_url[0]
						: product.image_url,
					relevance_reason:
						reason ||
						`Perfect for ${mode.replace("smart", "").replace("wise", "").replace("warrior", "").replace("helper", "").replace("sage", "")}`,
				});
			}
		}

		// Sort by relevance score and return top products
		return suggestions
			.sort((a, b) => b.relevance_reason.length - a.relevance_reason.length)
			.slice(0, maxProducts);
	}

	private isTaskAppropriateForMode(
		content: string,
		currentMode: string,
	): { appropriate: boolean; suggestedMode?: string; reason?: string } {
		const contentLower = content.toLowerCase();

		// Define task keywords for each mode
		const taskKeywords = {
			smartplate: [
				"recipe",
				"cook",
				"ingredient",
				"meal",
				"food preparation",
				"kitchen",
				"dish",
				"cuisine",
				"cooking",
				"bake",
				"fry",
				"grill",
			],
			smartdoctor: [
				"plant",
				"disease",
				"pest",
				"leaf",
				"root",
				"stem",
				"diagnose",
				"sick",
				"dying",
				"brown spots",
				"yellow",
				"wilting",
				"bug",
				"insect",
			],
			harvesthelper: [
				"harvest",
				"pick",
				"ripe",
				"storage",
				"preserve",
				"when to harvest",
				"ready",
				"mature",
				"store",
				"shelf life",
			],
			soilsage: [
				"soil",
				"compost",
				"fertilizer",
				"amendment",
				"ph",
				"nutrient",
				"dirt",
				"earth",
				"organic matter",
				"nitrogen",
				"phosphorus",
			],
			weatherwise: [
				"weather",
				"climate",
				"season",
				"temperature",
				"rain",
				"drought",
				"frost",
				"winter",
				"summer",
				"protection",
			],
			wastewarrior: [
				"waste",
				"surplus",
				"leftover",
				"expired",
				"spoiled",
				"reduce waste",
				"food waste",
				"scraps",
				"disposal",
			],
		};

		// Check if the current mode has relevant keywords
		const currentModeKeywords =
			taskKeywords[currentMode as keyof typeof taskKeywords] || [];
		const hasRelevantKeywords = currentModeKeywords.some((keyword) =>
			contentLower.includes(keyword),
		);

		// If current mode is appropriate, return true
		if (hasRelevantKeywords) {
			return { appropriate: true };
		}

		// Check which mode would be more appropriate
		for (const [mode, keywords] of Object.entries(taskKeywords)) {
			if (
				mode !== currentMode &&
				keywords.some((keyword) => contentLower.includes(keyword))
			) {
				const modeNames = {
					smartplate: "SmartPlate",
					smartdoctor: "SmartDoctor",
					harvesthelper: "HarvestHelper",
					soilsage: "SoilSage",
					weatherwise: "WeatherWise",
					wastewarrior: "WasteWarrior",
				};

				const modeDescriptions = {
					smartplate: "recipe creation and cooking advice",
					smartdoctor: "plant health diagnosis and care",
					harvesthelper: "harvest timing and storage guidance",
					soilsage: "soil health and fertility advice",
					weatherwise: "weather-based farming guidance",
					wastewarrior: "food waste reduction strategies",
				};

				return {
					appropriate: false,
					suggestedMode: mode,
					reason: `Your question is about ${modeDescriptions[mode as keyof typeof modeDescriptions]}. Please switch to ${modeNames[mode as keyof typeof modeNames]} for specialized help with this topic.`,
				};
			}
		}

		// If no specific mode detected, allow current mode to handle it
		return { appropriate: true };
	}

	async sendMessage(
		messages: ChatMessage[],
	): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
		try {
			// Fetch latest marketplace products
			await this.fetchMarketplaceProducts();

			// Detect AI mode from the latest message
			const lastMessage = messages[messages.length - 1];
			const requestedMode = this.detectAIMode(lastMessage.content);

			// Extract current mode from the message prefix
			let currentMode = "smartplate"; // default
			const modeMatch = lastMessage.content.match(/^\[(.*?)\sMode\]/);
			if (modeMatch) {
				const modeName = modeMatch[1].toLowerCase().replace(/\s/g, "");
				currentMode = modeName;
			}

			// Check if the task is appropriate for the current mode
			const appropriateness = this.isTaskAppropriateForMode(
				lastMessage.content,
				currentMode,
			);

			if (!appropriateness.appropriate && appropriateness.suggestedMode) {
				return {
					response: `I'm specialized in my specific area and can't help with that request. ${appropriateness.reason}\n\nUse the dropdown at the top of the screen to switch AI assistants and get the best help for your question! 🤖`,
					productSuggestions: [],
				};
			}

			// Convert our chat format to Gemini's expected format
			const geminiMessages = messages.map((msg) => {
				const parts: any[] = [
					{ text: msg.content.replace(/^\[.*?\sMode\]\s/, "") },
				];

				// Add images if present
				if (msg.images && msg.images.length > 0) {
					msg.images.forEach((imageBase64) => {
						const [mimeInfo, data] = imageBase64.split(",");
						const mimeType =
							mimeInfo.match(/data:([^;]+)/)?.[1] || "image/jpeg";

						parts.push({
							inline_data: {
								mime_type: mimeType,
								data: data,
							},
						});
					});
				}

				return {
					role: msg.role === "assistant" ? "model" : "user",
					parts: parts,
				};
			});

			// Add marketplace context to system instruction
			const productContext =
				this.marketplaceProducts.length > 0
					? `\n\nCURRENT FOODLOOP MARKETPLACE: ${this.marketplaceProducts.length} available products including: ${this.marketplaceProducts
							.slice(0, 10)
							.map((p) => `${p.name} ($${p.price})`)
							.join(
								", ",
							)}. When relevant, suggest these marketplace items to users.`
					: "";

			const systemPrompt =
				AI_MODE_PROMPTS[currentMode as keyof typeof AI_MODE_PROMPTS] +
				productContext;

			const requestBody = {
				contents: geminiMessages,
				generationConfig: {
					temperature: 0.7,
					topK: 40,
					topP: 0.95,
					maxOutputTokens: 2048,
				},
				safetySettings: [
					{
						category: "HARM_CATEGORY_HARASSMENT",
						threshold: "BLOCK_MEDIUM_AND_ABOVE",
					},
					{
						category: "HARM_CATEGORY_HATE_SPEECH",
						threshold: "BLOCK_MEDIUM_AND_ABOVE",
					},
					{
						category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
						threshold: "BLOCK_MEDIUM_AND_ABOVE",
					},
					{
						category: "HARM_CATEGORY_DANGEROUS_CONTENT",
						threshold: "BLOCK_MEDIUM_AND_ABOVE",
					},
				],
				systemInstruction: {
					parts: [
						{
							text: systemPrompt,
						},
					],
				},
			};

			const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				throw new Error(`API Error: ${response.status} ${response.statusText}`);
			}

			const data: GeminiResponse = await response.json();

			if (!data.candidates || data.candidates.length === 0) {
				throw new Error("No response from AI service");
			}

			const responseText = data.candidates[0].content.parts[0].text;

			// Find relevant products based on the conversation and AI mode
			const conversationContext = lastMessage?.content + " " + responseText;
			const productSuggestions = this.findRelevantProducts(
				conversationContext,
				currentMode,
			);

			return {
				response: responseText,
				productSuggestions,
			};
		} catch (error) {
			console.error("Error calling AI service:", error);
			throw error;
		}
	}

	// Method to generate recipe suggestions based on ingredients
	async generateRecipes(
		ingredients: string[],
	): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
		await this.fetchMarketplaceProducts();

		const prompt = `[SmartPlate Mode] I have these ingredients: ${ingredients.join(", ")}. Please suggest 3 creative recipes I can make with these ingredients to reduce food waste. Include cooking time and difficulty level for each recipe.`;

		const messages: ChatMessage[] = [
			{
				id: "1",
				role: "user",
				content: prompt,
				timestamp: new Date(),
			},
		];

		return this.sendMessage(messages);
	}

	// Method to get sustainability tips
	async getSustainabilityTips(): Promise<{
		response: string;
		productSuggestions: ProductSuggestion[];
	}> {
		const prompt =
			"[WasteWarrior Mode] Give me 5 practical tips for reducing food waste and living more sustainably in my daily life.";

		const messages: ChatMessage[] = [
			{
				id: "1",
				role: "user",
				content: prompt,
				timestamp: new Date(),
			},
		];

		return this.sendMessage(messages);
	}

	// Method to analyze plant/food images
	async analyzeImage(
		imageBase64: string,
		context?: string,
	): Promise<{ response: string; productSuggestions: ProductSuggestion[] }> {
		const prompt =
			context ||
			"[SmartDoctor Mode] Please analyze this image and provide insights about what you see. If it's a plant, check for health issues, diseases, or care recommendations. If it's food, assess freshness and suggest ways to use it sustainably.";

		const messages: ChatMessage[] = [
			{
				id: "1",
				role: "user",
				content: prompt,
				timestamp: new Date(),
				images: [imageBase64],
			},
		];

		return this.sendMessage(messages);
	}

	// Get specific product by ID
	async getProductById(productId: string): Promise<MarketplaceProduct | null> {
		await this.fetchMarketplaceProducts();
		return this.marketplaceProducts.find((p) => p.id === productId) || null;
	}

	// Search products by query
	async searchProducts(
		query: string,
		limit: number = 10,
	): Promise<ProductSuggestion[]> {
		await this.fetchMarketplaceProducts();
		const mode = this.detectAIMode(query);
		return this.findRelevantProducts(query, mode, limit);
	}
}
