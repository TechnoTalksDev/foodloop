import { WeatherService } from '@/lib/weather-service';

describe('WeatherService', () => {
  let weatherService: WeatherService;

  beforeEach(() => {
    weatherService = WeatherService.getInstance();
    // Clear any cached data
    (weatherService as any).cachedLocation = null;
    (weatherService as any).lastLocationFetch = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = WeatherService.getInstance();
      const instance2 = WeatherService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getWeatherIcon', () => {
    it('should return day icon for clear sky during day', () => {
      const icon = weatherService.getWeatherIcon(0, true);
      expect(icon).toBe('☀️');
    });

    it('should return night icon for clear sky during night', () => {
      const icon = weatherService.getWeatherIcon(0, false);
      expect(icon).toBe('🌙');
    });

    it('should return rain icon for rainy weather', () => {
      const icon = weatherService.getWeatherIcon(61, true);
      expect(icon).toBe('🌦️');
    });

    it('should return default icon for unknown weather code', () => {
      const icon = weatherService.getWeatherIcon(999, true);
      expect(icon).toBe('🌤️');
    });

    it('should return thunderstorm icon for stormy weather', () => {
      const icon = weatherService.getWeatherIcon(95, true);
      expect(icon).toBe('⛈️');
    });
  });

  describe('getWeatherCondition', () => {
    it('should return clear sky for weather code 0', () => {
      const condition = weatherService.getWeatherCondition(0);
      expect(condition).toBe('Clear sky');
    });

    it('should return rain for weather code 63', () => {
      const condition = weatherService.getWeatherCondition(63);
      expect(condition).toBe('Rain');
    });

    it('should return thunderstorm for weather code 95', () => {
      const condition = weatherService.getWeatherCondition(95);
      expect(condition).toBe('Thunderstorm');
    });

    it('should return unknown for invalid weather code', () => {
      const condition = weatherService.getWeatherCondition(999);
      expect(condition).toBe('Unknown');
    });
  });

  describe('getWeatherData', () => {
    beforeEach(() => {
      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 72.5,
            weather_code: 0,
            is_day: 1,
            relative_humidity_2m: 65,
            wind_speed_10m: 8.5,
            uv_index: 4,
            apparent_temperature: 75.2
          },
          daily: {
            weather_code: [0, 2, 61, 3],
            temperature_2m_max: [75, 73, 68, 70],
            temperature_2m_min: [60, 58, 55, 57],
            precipitation_probability_max: [0, 20, 80, 10]
          }
        })
      });
    });

    it('should fetch weather data successfully', async () => {
      const weatherData = await weatherService.getWeatherData();
      
      expect(weatherData).toBeDefined();
      expect(weatherData.temperature).toBe(73); // Rounded from 72.5
      expect(weatherData.temperatureUnit).toBe('fahrenheit');
      expect(weatherData.condition).toBe('Clear sky');
      expect(weatherData.icon).toBe('☀️');
      expect(weatherData.location.name).toBeTruthy();
      expect(weatherData.forecast).toHaveLength(4);
    });

    it('should handle celsius temperature unit', async () => {
      const weatherData = await weatherService.getWeatherData({ 
        temperatureUnit: 'celsius' 
      });
      
      expect(weatherData.temperatureUnit).toBe('celsius');
    });

    it('should include detailed weather information when requested', async () => {
      const weatherData = await weatherService.getWeatherData({ 
        includeDetails: true 
      });
      
      expect(weatherData.humidity).toBe(65);
      expect(weatherData.windSpeed).toBe(8.5);
      expect(weatherData.uvIndex).toBe(4);
      expect(weatherData.feelsLike).toBe(75);
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(weatherService.getWeatherData()).rejects.toThrow('Network error');
    });

    it('should handle API response errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      await expect(weatherService.getWeatherData()).rejects.toThrow('Weather API request failed: 500 Internal Server Error');
    });
  });
});
