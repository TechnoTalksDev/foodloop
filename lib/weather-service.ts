import * as Location from "expo-location";

// Weather data interfaces
export interface WeatherData {
	temperature: number;
	temperatureUnit: "fahrenheit" | "celsius";
	condition: string;
	weatherCode: number;
	isDay: boolean;
	icon: string;
	location: {
		name: string;
		latitude: number;
		longitude: number;
	};
	forecast: ForecastDay[];
	humidity?: number;
	windSpeed?: number;
	uvIndex?: number;
	feelsLike?: number;
}

export interface ForecastDay {
	date: string;
	day: string;
	weatherCode: number;
	icon: string;
	temperatureMax: number;
	temperatureMin: number;
	condition: string;
	precipitationProbability?: number;
}

export interface WeatherOptions {
	temperatureUnit?: "fahrenheit" | "celsius";
	forecastDays?: number;
	includeHourly?: boolean;
	includeDetails?: boolean;
}

// Weather code to emoji mapping
const weatherIconMap: { [key: number]: { day: string; night: string } } = {
	0: { day: "☀️", night: "🌙" }, // Clear sky
	1: { day: "🌤️", night: "🌙" }, // Mainly clear
	2: { day: "⛅", night: "☁️" }, // Partly cloudy
	3: { day: "☁️", night: "☁️" }, // Overcast
	45: { day: "🌫️", night: "🌫️" }, // Fog
	48: { day: "🌫️", night: "🌫️" }, // Depositing rime fog
	51: { day: "🌦️", night: "🌧️" }, // Light drizzle
	53: { day: "🌦️", night: "🌧️" }, // Moderate drizzle
	55: { day: "🌧️", night: "🌧️" }, // Dense drizzle
	61: { day: "🌦️", night: "🌧️" }, // Slight rain
	63: { day: "🌧️", night: "🌧️" }, // Moderate rain
	65: { day: "🌧️", night: "🌧️" }, // Heavy rain
	71: { day: "🌨️", night: "🌨️" }, // Slight snow
	73: { day: "❄️", night: "❄️" }, // Moderate snow
	75: { day: "❄️", night: "❄️" }, // Heavy snow
	77: { day: "❄️", night: "❄️" }, // Snow grains
	80: { day: "🌦️", night: "🌧️" }, // Slight rain showers
	81: { day: "🌧️", night: "🌧️" }, // Moderate rain showers
	82: { day: "⛈️", night: "⛈️" }, // Violent rain showers
	85: { day: "🌨️", night: "🌨️" }, // Slight snow showers
	86: { day: "❄️", night: "❄️" }, // Heavy snow showers
	95: { day: "⛈️", night: "⛈️" }, // Thunderstorm
	96: { day: "⛈️", night: "⛈️" }, // Thunderstorm with slight hail
	99: { day: "⛈️", night: "⛈️" }, // Thunderstorm with heavy hail
};

// Weather code to condition mapping
const weatherConditionMap: { [key: number]: string } = {
	0: "Clear sky",
	1: "Mainly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Foggy",
	48: "Foggy",
	51: "Light drizzle",
	53: "Drizzle",
	55: "Heavy drizzle",
	61: "Light rain",
	63: "Rain",
	65: "Heavy rain",
	71: "Light snow",
	73: "Snow",
	75: "Heavy snow",
	77: "Snow grains",
	80: "Rain showers",
	81: "Rain showers",
	82: "Heavy rain",
	85: "Snow showers",
	86: "Heavy snow",
	95: "Thunderstorm",
	96: "Thunderstorm",
	99: "Thunderstorm",
};

export class WeatherService {
	private static instance: WeatherService;
	private lastLocationFetch: number = 0;
	private cachedLocation: {
		latitude: number;
		longitude: number;
		name: string;
	} | null = null;
	private readonly LOCATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

	static getInstance(): WeatherService {
		if (!WeatherService.instance) {
			WeatherService.instance = new WeatherService();
		}
		return WeatherService.instance;
	}

	/**
	 * Get weather icon emoji based on weather code and time of day
	 */
	public getWeatherIcon(weatherCode: number, isDay: boolean = true): string {
		const iconSet = weatherIconMap[weatherCode] || { day: "🌤️", night: "☁️" };
		return isDay ? iconSet.day : iconSet.night;
	}

	/**
	 * Get weather condition description from weather code
	 */
	public getWeatherCondition(weatherCode: number): string {
		return weatherConditionMap[weatherCode] || "Unknown";
	}

	/**
	 * Get user's current location with caching
	 */
	private async getCurrentLocation(): Promise<{
		latitude: number;
		longitude: number;
		name: string;
	}> {
		const now = Date.now();

		// Return cached location if it's fresh
		if (
			this.cachedLocation &&
			now - this.lastLocationFetch < this.LOCATION_CACHE_DURATION
		) {
			return this.cachedLocation;
		}

		try {
			// Request location permission
			const { status } = await Location.requestForegroundPermissionsAsync();

			if (status !== "granted") {
				// Return default location if permission denied
				const defaultLocation = {
					latitude: 47.6062, // Seattle
					longitude: -122.3321,
					name: "Seattle, WA",
				};
				this.cachedLocation = defaultLocation;
				this.lastLocationFetch = now;
				return defaultLocation;
			}

			// Get current position
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			// Reverse geocode to get location name
			let locationName = "Unknown Location";
			try {
				const reverseGeocode = await Location.reverseGeocodeAsync({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});

				if (reverseGeocode.length > 0) {
					const place = reverseGeocode[0];
					locationName = `${place.city || place.subregion || "Unknown"}, ${place.region || place.country || ""}`;
				}
			} catch (geocodeError) {
				console.warn("Failed to reverse geocode location");
			}

			const userLocation = {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				name: locationName,
			};

			// Cache the location
			this.cachedLocation = userLocation;
			this.lastLocationFetch = now;

			return userLocation;
		} catch (error) {
			console.error("Error getting location:", error);

			// Return default location on error
			const defaultLocation = {
				latitude: 47.6062, // Seattle
				longitude: -122.3321,
				name: "Seattle, WA (Default)",
			};
			this.cachedLocation = defaultLocation;
			this.lastLocationFetch = now;
			return defaultLocation;
		}
	}

	/**
	 * Fetch weather data from Open-Meteo API
	 */
	public async getWeatherData(
		options: WeatherOptions = {},
	): Promise<WeatherData> {
		const {
			temperatureUnit = "fahrenheit",
			forecastDays = 4,
			includeDetails = false,
		} = options;

		try {
			// Get user location
			const location = await this.getCurrentLocation();

			// Build API URL
			const baseUrl = "https://api.open-meteo.com/v1/forecast";
			const params = new URLSearchParams({
				latitude: location.latitude.toString(),
				longitude: location.longitude.toString(),
				current: [
					"temperature_2m",
					"weather_code",
					"is_day",
					...(includeDetails
						? [
								"relative_humidity_2m",
								"wind_speed_10m",
								"uv_index",
								"apparent_temperature",
							]
						: []),
				].join(","),
				daily: [
					"weather_code",
					"temperature_2m_max",
					"temperature_2m_min",
					...(includeDetails ? ["precipitation_probability_max"] : []),
				].join(","),
				temperature_unit: temperatureUnit,
				timezone: "auto",
				forecast_days: forecastDays.toString(),
			});

			const response = await fetch(`${baseUrl}?${params.toString()}`);

			if (!response.ok) {
				throw new Error(
					`Weather API request failed: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			// Process current weather
			const current = data.current;
			const currentTemp = Math.round(current.temperature_2m);
			const currentWeatherCode = current.weather_code;
			const isDay = current.is_day === 1;

			// Process forecast
			const forecastDays_labels = this.generateForecastLabels(forecastDays);
			const forecast: ForecastDay[] = data.daily.weather_code.map(
				(code: number, index: number) => ({
					date: data.daily.time[index],
					day: forecastDays_labels[index],
					weatherCode: code,
					icon: this.getWeatherIcon(code, true),
					temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
					temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
					condition: this.getWeatherCondition(code),
					...(includeDetails && data.daily.precipitation_probability_max
						? {
								precipitationProbability:
									data.daily.precipitation_probability_max[index],
							}
						: {}),
				}),
			);

			// Build weather data object
			const weatherData: WeatherData = {
				temperature: currentTemp,
				temperatureUnit,
				condition: this.getWeatherCondition(currentWeatherCode),
				weatherCode: currentWeatherCode,
				isDay,
				icon: this.getWeatherIcon(currentWeatherCode, isDay),
				location: {
					name: location.name,
					latitude: location.latitude,
					longitude: location.longitude,
				},
				forecast,
				...(includeDetails
					? {
							humidity: current.relative_humidity_2m,
							windSpeed: current.wind_speed_10m,
							uvIndex: current.uv_index,
							feelsLike: Math.round(current.apparent_temperature),
						}
					: {}),
			};

			return weatherData;
		} catch (error) {
			console.error("Error fetching weather data:", error);
			throw new Error(
				`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Get weather for a specific location
	 */
	public async getWeatherForLocation(
		latitude: number,
		longitude: number,
		locationName?: string,
		options: WeatherOptions = {},
	): Promise<WeatherData> {
		const {
			temperatureUnit = "fahrenheit",
			forecastDays = 4,
			includeDetails = false,
		} = options;

		try {
			// Build API URL
			const baseUrl = "https://api.open-meteo.com/v1/forecast";
			const params = new URLSearchParams({
				latitude: latitude.toString(),
				longitude: longitude.toString(),
				current: [
					"temperature_2m",
					"weather_code",
					"is_day",
					...(includeDetails
						? [
								"relative_humidity_2m",
								"wind_speed_10m",
								"uv_index",
								"apparent_temperature",
							]
						: []),
				].join(","),
				daily: [
					"weather_code",
					"temperature_2m_max",
					"temperature_2m_min",
					...(includeDetails ? ["precipitation_probability_max"] : []),
				].join(","),
				temperature_unit: temperatureUnit,
				timezone: "auto",
				forecast_days: forecastDays.toString(),
			});

			const response = await fetch(`${baseUrl}?${params.toString()}`);

			if (!response.ok) {
				throw new Error(
					`Weather API request failed: ${response.status} ${response.statusText}`,
				);
			}

			const data = await response.json();

			// Process current weather
			const current = data.current;
			const currentTemp = Math.round(current.temperature_2m);
			const currentWeatherCode = current.weather_code;
			const isDay = current.is_day === 1;

			// Process forecast
			const forecastDays_labels = this.generateForecastLabels(forecastDays);
			const forecast: ForecastDay[] = data.daily.weather_code.map(
				(code: number, index: number) => ({
					date: data.daily.time[index],
					day: forecastDays_labels[index],
					weatherCode: code,
					icon: this.getWeatherIcon(code, true),
					temperatureMax: Math.round(data.daily.temperature_2m_max[index]),
					temperatureMin: Math.round(data.daily.temperature_2m_min[index]),
					condition: this.getWeatherCondition(code),
					...(includeDetails && data.daily.precipitation_probability_max
						? {
								precipitationProbability:
									data.daily.precipitation_probability_max[index],
							}
						: {}),
				}),
			);

			// Build weather data object
			const weatherData: WeatherData = {
				temperature: currentTemp,
				temperatureUnit,
				condition: this.getWeatherCondition(currentWeatherCode),
				weatherCode: currentWeatherCode,
				isDay,
				icon: this.getWeatherIcon(currentWeatherCode, isDay),
				location: {
					name:
						locationName || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
					latitude,
					longitude,
				},
				forecast,
				...(includeDetails
					? {
							humidity: current.relative_humidity_2m,
							windSpeed: current.wind_speed_10m,
							uvIndex: current.uv_index,
							feelsLike: Math.round(current.apparent_temperature),
						}
					: {}),
			};

			return weatherData;
		} catch (error) {
			console.error("Error fetching weather data for location:", error);
			throw new Error(
				`Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	/**
	 * Generate forecast day labels
	 */
	private generateForecastLabels(days: number): string[] {
		const labels = ["Today"];
		const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

		for (let i = 1; i < days; i++) {
			const date = new Date();
			date.setDate(date.getDate() + i);
			labels.push(dayNames[date.getDay()]);
		}

		return labels;
	}

	/**
	 * Check if weather conditions are good for outdoor activities
	 */
	public isGoodWeatherForActivity(
		weatherCode: number,
		activityType: "gardening" | "harvesting" | "outdoor" = "outdoor",
	): boolean {
		// Good weather codes (clear, partly cloudy)
		const goodWeatherCodes = [0, 1, 2];

		// Acceptable weather codes depending on activity
		const acceptableForGardening = [0, 1, 2, 3, 51]; // Include overcast and light drizzle
		const acceptableForHarvesting = [0, 1, 2, 3]; // Avoid any precipitation

		switch (activityType) {
			case "gardening":
				return acceptableForGardening.includes(weatherCode);
			case "harvesting":
				return acceptableForHarvesting.includes(weatherCode);
			case "outdoor":
			default:
				return goodWeatherCodes.includes(weatherCode);
		}
	}

	/**
	 * Get weather advice for farming activities
	 */
	public getFarmingAdvice(weatherData: WeatherData): string {
		const code = weatherData.weatherCode;
		const temp = weatherData.temperature;

		// Temperature-based advice
		if (temp < 32) {
			return "❄️ Frost warning! Protect sensitive plants and harvest what you can.";
		} else if (temp > 85) {
			return "🌡️ Very hot! Water plants early morning or evening. Provide shade if needed.";
		}

		// Weather-based advice
		if ([61, 63, 65, 80, 81, 82].includes(code)) {
			return "🌧️ Good day for indoor tasks. Rain provides natural watering!";
		} else if ([95, 96, 99].includes(code)) {
			return "⛈️ Storm warning! Secure plants and avoid outdoor work.";
		} else if ([0, 1].includes(code)) {
			return "☀️ Perfect weather for harvesting and outdoor garden work!";
		} else if ([71, 73, 75, 85, 86].includes(code)) {
			return "🌨️ Snow day! Time for planning and indoor seed starting.";
		} else if ([45, 48].includes(code)) {
			return "🌫️ Foggy conditions. Wait for visibility to improve before working outside.";
		}

		return "🌤️ Good conditions for most outdoor activities.";
	}

	/**
	 * Clear cached location (useful for testing or when user changes location)
	 */
	public clearLocationCache(): void {
		this.cachedLocation = null;
		this.lastLocationFetch = 0;
	}
}

// Export singleton instance
export const weatherService = WeatherService.getInstance();
