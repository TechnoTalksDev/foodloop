// app/(protected)/smartplate-ai.tsx - WITH EPIC INTRO ANIMATION

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  withRepeat,
} from 'react-native-reanimated';
import { SafeAreaView } from '@/components/safe-area-view';
import { Text } from '@/components/ui/text';
import { H1 } from '@/components/ui/typography';
import { useColorScheme } from '@/lib/useColorScheme';
import { colors } from '@/constants/colors';
import { format } from 'date-fns';
import Markdown from 'react-native-markdown-display';
import { useChatContext } from '@/context/chat-provider';
import { ProductSuggestion } from '@/lib/gemini';
import { weatherService, WeatherData } from '@/lib/weather-service';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// AI Mode definitions
const AI_MODES = [
  {
    id: 'smartplate',
    name: 'SmartPlate',
    icon: '🍽️',
    description: 'Build recipes from foods on FoodLoop marketplace',
    color: '#10b981',
    placeholder: 'What ingredients do you have? I\'ll suggest recipes and find items on FoodLoop...',
    systemPrompt: 'You are SmartPlate AI, a recipe and cooking assistant. Help users create recipes from ingredients they have or want to buy from FoodLoop marketplace. Focus on reducing food waste, sustainable cooking, and creative recipe ideas. Always suggest relevant products from the FoodLoop marketplace when appropriate.'
  },
  {
    id: 'smartdoctor',
    name: 'SmartDoctor',
    icon: '🌱',
    description: 'Diagnose your plants with photo analysis',
    color: '#059669',
    placeholder: 'Take a photo of your plant for health diagnosis and care recommendations...',
    systemPrompt: 'You are SmartDoctor AI, a plant health and gardening expert. Analyze plant photos to diagnose diseases, pests, nutrient deficiencies, and health issues. Provide detailed care recommendations, organic treatment options, and preventive measures. Focus on sustainable and eco-friendly gardening practices.'
  },
  {
    id: 'harvesthelper',
    name: 'HarvestHelper',
    icon: '🚜',
    description: 'Optimize your harvest timing and storage',
    color: '#dc2626',
    placeholder: 'Ask about harvest timing, storage methods, or crop planning...',
    systemPrompt: 'You are HarvestHelper AI, an agricultural specialist focused on harvest optimization, crop storage, and farming efficiency. Help users determine optimal harvest times, proper storage techniques, and crop planning strategies. Emphasize reducing post-harvest losses and maximizing yield quality.'
  },
  {
    id: 'soilsage',
    name: 'SoilSage',
    icon: '🌾',
    description: 'Soil health analysis and improvement advice',
    color: '#92400e',
    placeholder: 'Upload soil photos or ask about soil health, composting, and fertility...',
    systemPrompt: 'You are SoilSage AI, a soil health and fertility expert. Analyze soil conditions, provide composting advice, recommend organic amendments, and help users improve their soil health naturally. Focus on sustainable farming practices and building healthy soil ecosystems.'
  },
  {
    id: 'weatherwise',
    name: 'WeatherWise',
    icon: '🌤️',
    description: 'Weather-based farming and growing advice',
    color: '#1d4ed8',
    placeholder: 'Ask about weather patterns, seasonal planning, or climate adaptation...',
    systemPrompt: 'You are WeatherWise AI, a climate and weather specialist for agriculture. You have access to real-time weather data including current conditions, 5-day forecasts, and location-specific information. Use this data to provide specific, actionable advice for farming, gardening, and agricultural activities. Help users adapt their practices to current weather conditions, plan for seasonal changes, and build resilience against climate challenges. Always reference the actual weather data provided and give location-appropriate advice for sustainable agriculture. Focus on practical tips like optimal planting times, watering schedules, crop protection, and harvest timing based on the real weather conditions.'
  },
  {
    id: 'wastewarrior',
    name: 'WasteWarrior',
    icon: '♻️',
    description: 'Reduce food waste and maximize resource use',
    color: '#059669',
    placeholder: 'Ask how to reduce waste, preserve food, or repurpose ingredients...',
    systemPrompt: 'You are WasteWarrior AI, a food waste reduction and sustainability expert. Help users minimize food waste through proper storage, preservation techniques, creative repurposing, and efficient meal planning. Connect users with FoodLoop marketplace opportunities to rescue surplus food.'
  }
];

export default function SmartPlateAI() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { messages, isLoading, sendMessage, clearChat } = useChatContext();
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState(AI_MODES[0]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animation values for the epic intro
  const faceScale = useSharedValue(0);
  const faceRotation = useSharedValue(-360);
  const faceOpacity = useSharedValue(0);
  const showWink = useSharedValue(0);
  const textScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textRotation = useSharedValue(180);
  const introOpacity = useSharedValue(1);
  const backgroundGlow = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const aiScale = useSharedValue(0);
  const aiOpacity = useSharedValue(0);

  // Colors based on theme
  const textColor = colorScheme === 'dark' ? colors.dark.foreground : colors.light.foreground;
  const bgColor = colorScheme === 'dark' ? colors.dark.background : colors.light.background;
  const mutedTextColor = colorScheme === 'dark' ? colors.dark.mutedForeground : colors.light.mutedForeground;
  const borderColor = colorScheme === 'dark' ? colors.dark.border : colors.light.border;
  const secondaryBg = colorScheme === 'dark' ? colors.dark.secondary : colors.light.secondary;

  // Epic intro animation sequence
  useEffect(() => {
    if (showIntro) {
      const startAnimation = () => {
        // Particle effects
        particleOpacity.value = withTiming(1, { duration: 250 }); // was 500
        
        // Background glow effect
        backgroundGlow.value = withRepeat(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }), // was 2000
          -1,
          true
        );

        // Face entrance - dramatic spin and scale
        faceScale.value = withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(150, withSpring(1.3, { 
            damping: 8, 
            stiffness: 100,
            mass: 1.2 
          })),
          withSpring(1, { damping: 12, stiffness: 150 })
        );

        faceRotation.value = withSequence(
          withTiming(-360, { duration: 0 }),
          withDelay(150, withTiming(0, { 
            duration: 400, // was 800
            easing: Easing.out(Easing.back(1.7)) 
          }))
        );

        faceOpacity.value = withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(150, withTiming(1, { duration: 300 })) // was 600
        );

        // Blink sequence - happens after face settles
        setTimeout(() => {
          // First blink
          showWink.value = withSequence(
            withTiming(1, { duration: 40 }), // was 80
            withTiming(0, { duration: 40 }),
            // Second blink after delay
            withDelay(200, withTiming(1, { duration: 40 })), // was 400/80
            withTiming(0, { duration: 40 }),
            // Third blink
            withDelay(300, withTiming(1, { duration: 40 })), // was 600/80
            withTiming(0, { duration: 60 }) // was 120
          );
        }, 600); // was 1200

        // Text entrance - epic slide and rotate
        setTimeout(() => {
          textOpacity.value = withTiming(1, { duration: 400 }); // was 800
          textScale.value = withSequence(
            withTiming(0, { duration: 0 }),
            withSpring(1.2, { damping: 6, stiffness: 120 }),
            withSpring(1, { damping: 8, stiffness: 150 })
          );
          textRotation.value = withTiming(0, { 
            duration: 500, // was 1000
            easing: Easing.out(Easing.back(1.5)) 
          });

          // AI badge animation
          aiScale.value = withDelay(
            200, // was 400
            withSequence(
              withSpring(1.3, { damping: 4, stiffness: 150 }),
              withSpring(1, { damping: 8, stiffness: 120 })
            )
          );
          aiOpacity.value = withDelay(200, withTiming(1, { duration: 400 })); // was 800
        }, 900); // was 1800

        // Fade out intro and show main app
        setTimeout(() => {
          introOpacity.value = withTiming(0, { 
            duration: 500, // was 1000
            easing: Easing.inOut(Easing.quad) 
          }, () => {
            runOnJS(setShowIntro)(false);
          });
        }, 2250); // was 4500
      };

      startAnimation();
    }
  }, [showIntro]);

  // Animated styles
  const faceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: faceScale.value },
        { rotate: `${faceRotation.value}deg` }
      ],
      opacity: faceOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: textScale.value },
        { rotate: `${textRotation.value}deg` }
      ],
      opacity: textOpacity.value,
    };
  });

  const introAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: introOpacity.value,
    };
  });

  const backgroundGlowStyle = useAnimatedStyle(() => {
    const glowIntensity = interpolate(backgroundGlow.value, [0, 1], [0.3, 0.8]);
    return {
      opacity: glowIntensity,
    };
  });

  const particleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: particleOpacity.value,
    };
  });

  const aiAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: aiScale.value }],
      opacity: aiOpacity.value,
    };
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0 && !showIntro) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, showIntro]);

  // Clear chat when mode changes
  useEffect(() => {
    if (!showIntro) {
      clearChat();
    }
  }, [currentMode.id, showIntro]);

  // Fetch weather data when WeatherWise mode is selected
  useEffect(() => {
    if (currentMode.id === 'weatherwise' && !showIntro && !weatherData) {
      fetchWeatherData();
    }
  }, [currentMode.id, showIntro]);

  const fetchWeatherData = async () => {
    try {
      setLoadingWeather(true);
      const weather = await weatherService.getWeatherData({
        temperatureUnit: 'fahrenheit',
        forecastDays: 5,
        includeDetails: true
      });
      setWeatherData(weather);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh weather data if in weather mode
      if (currentMode.id === 'weatherwise') {
        await fetchWeatherData();
      }
      // Chat context is managed by the chat provider and doesn't need refreshing
    } catch (error) {
      console.error('Error refreshing AI data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && selectedImages.length === 0) || isLoading) return;
    
    const messageText = inputText.trim();
    const images = [...selectedImages];
    
    setInputText('');
    setSelectedImages([]);
    Keyboard.dismiss();

    // For WeatherWise mode, fetch current weather data
    let weatherContext = '';
    if (currentMode.id === 'weatherwise') {
      try {
        setLoadingWeather(true);
        const weather = await weatherService.getWeatherData({
          temperatureUnit: 'fahrenheit',
          forecastDays: 5,
          includeDetails: true
        });
        setWeatherData(weather);
        
        // Build weather context for AI
        const farmingAdvice = weatherService.getFarmingAdvice(weather);
        weatherContext = `\n\nCURRENT WEATHER DATA for ${weather.location.name}:
📍 Location: ${weather.location.name}
🌡️ Current: ${weather.temperature}°${weather.temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
${weather.icon} Condition: ${weather.condition}
💧 Humidity: ${weather.humidity || 'N/A'}%
💨 Wind: ${weather.windSpeed || 'N/A'} mph
☀️ UV Index: ${weather.uvIndex || 'N/A'}
🌡️ Feels like: ${weather.feelsLike || weather.temperature}°${weather.temperatureUnit === 'fahrenheit' ? 'F' : 'C'}

5-DAY FORECAST:
${weather.forecast.map(day => 
  `${day.day}: ${day.icon} ${day.temperatureMax}°/${day.temperatureMin}° - ${day.condition}${day.precipitationProbability ? ` (${day.precipitationProbability}% rain)` : ''}`
).join('\n')}

FARMING ADVICE: ${farmingAdvice}

Please provide specific advice based on these current weather conditions and forecast.`;
      } catch (error) {
        console.error('Error fetching weather data:', error);
        weatherContext = '\n\n⚠️ Unable to fetch current weather data. Please provide general weather-based farming advice.';
      } finally {
        setLoadingWeather(false);
      }
    }

    // Add mode context to the message with weather data if applicable
    const contextualMessage = `[${currentMode.name} Mode] ${messageText}${weatherContext}`;
    await sendMessage(contextualMessage, images.length > 0 ? images : undefined);
  };

  const handleModeSelect = (mode: typeof AI_MODES[0]) => {
    setCurrentMode(mode);
    setShowModeSelector(false);
    
    // Clear weather data when switching away from WeatherWise
    if (mode.id !== 'weatherwise') {
      setWeatherData(null);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;
        setSelectedImages(prev => [...prev, base64Image]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:${result.assets[0].mimeType || 'image/jpeg'};base64,${result.assets[0].base64}`;
        setSelectedImages(prev => [...prev, base64Image]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: "/(protected)/product/[id]",
      params: { id: productId },
    });
  };

  const renderProductSuggestions = (productSuggestions: ProductSuggestion[]) => {
    if (!productSuggestions || productSuggestions.length === 0) return null;

    return (
      <View className="mt-4">
        <View className="flex-row items-center mb-3">
          <Ionicons name="storefront" size={16} color="#10b981" />
          <Text className="ml-2 font-semibold text-green-600 text-sm">
            Available on FoodLoop
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {productSuggestions.map((product, index) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => handleProductPress(product.id)}
              className="mr-3 w-40 bg-card rounded-lg border border-border overflow-hidden"
              style={{ backgroundColor: secondaryBg + '40' }}
            >
              {product.image_url && (
                <Image
                  source={{ uri: product.image_url }}
                  className="w-full h-24"
                  resizeMode="cover"
                />
              )}
              <View className="p-3">
                <Text className="font-medium text-sm" style={{ color: textColor }} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text className="text-xs mt-1" style={{ color: mutedTextColor }}>
                  {product.business}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="font-bold text-green-600">
                    ${product.price.toFixed(2)}
                  </Text>
                  <View className="bg-green-100 px-2 py-1 rounded">
                    <Text className="text-green-700 text-xs font-medium">Buy</Text>
                  </View>
                </View>
                <Text className="text-xs mt-1" style={{ color: mutedTextColor }} numberOfLines={2}>
                  {product.relevance_reason}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    
    // Remove mode prefix from display if present
    const displayContent = message.content.replace(/^\[.*?\sMode\]\s/, '');
    
    return (
      <View 
        key={message.id || index}
        className={`mb-6 ${isUser ? 'items-end' : 'items-start'}`}
      >
        {isUser ? (
          // User message - keep in bubble format
          <View className="max-w-[85%] flex-row-reverse">
            <View className="w-8 h-8 rounded-full items-center justify-center ml-3 mt-1">
              <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                <Text className="text-primary-foreground text-xs font-bold">You</Text>
              </View>
            </View>
            
            <View 
              className="px-4 py-3 rounded-2xl flex-1 bg-primary rounded-tr-sm"
              style={{
                backgroundColor: colorScheme === 'dark' ? colors.dark.primary : colors.light.primary
              }}
            >
              {message.images && message.images.length > 0 && (
                <View className="mb-3">
                  {message.images.map((imageUri: string, imgIndex: number) => (
                    <Image
                      key={imgIndex}
                      source={{ uri: imageUri }}
                      style={{
                        width: 200,
                        height: 150,
                        borderRadius: 8,
                        marginBottom: imgIndex < message.images.length - 1 ? 8 : 0
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
              
              <Text 
                className="text-base leading-6 text-primary-foreground"
                style={{ 
                  color: colorScheme === 'dark' ? colors.dark.primaryForeground : colors.light.primaryForeground
                }}
              >
                {displayContent}
              </Text>
              
              <Text 
                className="text-xs mt-2 text-primary-foreground/70"
                style={{
                  color: colorScheme === 'dark' ? colors.dark.primaryForeground + '80' : colors.light.primaryForeground + '80'
                }}
              >
                {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : format(new Date(), 'h:mm a')}
              </Text>
            </View>
          </View>
        ) : (
          // AI message - full width with avatar on side
          <View className="w-full">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4 mt-2" style={{ backgroundColor: currentMode.color }}>
                <Text className="text-white text-lg">{currentMode.icon}</Text>
              </View>
              
              <View className="flex-1">
                <View className="mb-2">
                  <Text className="font-semibold text-lg" style={{ color: currentMode.color }}>
                    {currentMode.name}
                  </Text>
                </View>
                
                <View 
                  className="p-4 rounded-2xl rounded-tl-sm"
                  style={{ backgroundColor: secondaryBg + '40' }}
                >
                  <Markdown
                    style={{
                      body: {
                        color: textColor,
                        fontSize: 16,
                        lineHeight: 24,
                      },
                      paragraph: {
                        marginTop: 0,
                        marginBottom: 8,
                      },
                      strong: {
                        fontWeight: 'bold',
                      },
                      em: {
                        fontStyle: 'italic',
                      },
                      code_inline: {
                        backgroundColor: colorScheme === 'dark' ? colors.dark.muted : colors.light.muted,
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                        borderRadius: 4,
                        fontSize: 14,
                      },
                      code_block: {
                        backgroundColor: colorScheme === 'dark' ? colors.dark.muted : colors.light.muted,
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 14,
                      },
                      bullet_list: {
                        marginVertical: 4,
                      },
                      ordered_list: {
                        marginVertical: 4,
                      },
                      list_item: {
                        marginVertical: 2,
                      },
                    }}
                  >
                    {displayContent}
                  </Markdown>

                  {message.productSuggestions && renderProductSuggestions(message.productSuggestions)}
                  
                  <Text 
                    className="text-xs mt-3"
                    style={{ color: mutedTextColor }}
                  >
                    {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : format(new Date(), 'h:mm a')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderModeSelector = () => (
    <Modal
      visible={showModeSelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModeSelector(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View 
          className="rounded-t-3xl p-6 max-h-[80%]"
          style={{ backgroundColor: bgColor }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold" style={{ color: textColor }}>
              Choose AI Assistant
            </Text>
            <TouchableOpacity onPress={() => setShowModeSelector(false)}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={AI_MODES}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleModeSelect(item)}
                className="p-4 rounded-xl mb-3 border"
                style={{ 
                  backgroundColor: item.id === currentMode.id ? item.color + '20' : secondaryBg + '30',
                  borderColor: item.id === currentMode.id ? item.color : borderColor
                }}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: item.color }}
                  >
                    <Text className="text-white text-2xl">{item.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text 
                      className="font-semibold text-base mb-1"
                      style={{ 
                        color: item.id === currentMode.id ? item.color : textColor 
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-sm" style={{ color: mutedTextColor }}>
                      {item.description}
                    </Text>
                  </View>
                  {item.id === currentMode.id && (
                    <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: item.color }}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // Render epic intro animation
  if (showIntro) {
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#10b981',
            },
            backgroundGlowStyle
          ]}
        />
        
        {/* Particle effects background */}
        <Animated.View 
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            particleAnimatedStyle
          ]}
        >
          {/* Animated particles */}
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: Math.random() * SCREEN_WIDTH,
                top: Math.random() * SCREEN_HEIGHT,
                width: 4,
                height: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 2,
                transform: [
                  { scale: Math.random() * 2 + 0.5 }
                ]
              }}
            />
          ))}
        </Animated.View>

        <Animated.View 
          style={[
            {
              flex: 1,
              justifyContent: 'space-around', // Better distribution for different screen sizes
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: Math.max(60, SCREEN_HEIGHT * 0.08), // Responsive top padding
              paddingBottom: Math.max(120, SCREEN_HEIGHT * 0.15), // Responsive bottom padding
            },
            introAnimatedStyle
          ]}
        >
          {/* Epic Face Animation */}
          <Animated.View style={[faceAnimatedStyle, { marginBottom: 50 }]}>
            <View style={{ position: 'relative' }}>
              {/* Normal face (1.png) */}
              <Animated.View
                style={{
                  opacity: showWink.value === 0 ? 1 : 0,
                }}
              >
                <Image
                  source={require('@/assets/2.png')}
                  style={{
                    width: Math.min(180, SCREEN_WIDTH * 0.45), // Responsive size
                    height: Math.min(180, SCREEN_WIDTH * 0.45), // Responsive size
                    resizeMode: 'contain',
                  }}
                />
              </Animated.View>
              
              {/* Winking face (2.png) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: showWink.value,
                }}
              >
                <Image
                  source={require('@/assets/1.png')}
                  style={{
                    width: Math.min(180, SCREEN_WIDTH * 0.45), // Responsive size
                    height: Math.min(180, SCREEN_WIDTH * 0.45), // Responsive size
                    resizeMode: 'contain',
                  }}
                />
              </Animated.View>
            </View>
          </Animated.View>

          {/* Amazing Animated Text */}
          <Animated.View style={[textAnimatedStyle, { alignItems: 'center' }]}>
            {/* SmartPlant text with glow effect */}
            <Animated.View style={aiAnimatedStyle}>
              <View style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 20,
                elevation: 10,
              }}>
                <Text
                  style={{
                    fontSize: Math.min(24, SCREEN_WIDTH * 0.06),
                    fontWeight: 'bold',
                    color: '#ffffff',
                    textAlign: 'center',
                    textShadowColor: 'rgba(16, 185, 129, 0.8)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                    letterSpacing: 2,
                  }}
                >
                  SmartPlant
                </Text>
              </View>
            </Animated.View>

            {/* Floating particles around text */}
            <Animated.View style={particleAnimatedStyle}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                    left: Math.random() * 300 - 150,
                    top: Math.random() * 100 - 50,
                  }}
                />
              ))}
            </Animated.View>
          </Animated.View>

          {/* Loading indicator */}
          <View style={{ 
            alignItems: 'center',
            marginTop: 20, // Use margin instead of absolute positioning
          }}>
            <ActivityIndicator size="large" color="white" />
            <Text style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: Math.min(14, SCREEN_WIDTH * 0.035), // Responsive font size
              marginTop: 8,
              textAlign: 'center',
            }}>
              Loading AI...
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Regular chat interface (shown after intro)
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setShowModeSelector(true)}
          className="flex-row items-center flex-1 justify-center"
        >
          <View 
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: currentMode.color }}
          >
            <Text className="text-white text-sm">{currentMode.icon}</Text>
          </View>
          <View className="flex-1">
            <H1 className="text-lg">{currentMode.name}</H1>
            <Text className="text-xs" style={{ color: mutedTextColor }}>
              {currentMode.description}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={textColor} />
        </TouchableOpacity>

        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="refresh" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      {/* Weather Widget for WeatherWise Mode */}
      {currentMode.id === 'weatherwise' && (
        <View className="px-4 py-3 border-b" style={{ borderBottomColor: borderColor, backgroundColor: secondaryBg }}>
          {loadingWeather ? (
            <View className="flex-row items-center justify-center py-2">
              <ActivityIndicator size="small" color={currentMode.color} />
              <Text className="ml-2" style={{ color: mutedTextColor }}>Loading weather data...</Text>
            </View>
          ) : weatherData ? (
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">{weatherData.icon}</Text>
                  <View>
                    <Text className="font-semibold" style={{ color: textColor }}>
                      {weatherData.location.name}
                    </Text>
                    <Text className="text-xs" style={{ color: mutedTextColor }}>
                      {weatherData.condition} • {weatherData.temperature}°{weatherData.temperatureUnit === 'fahrenheit' ? 'F' : 'C'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={fetchWeatherData}>
                  <Ionicons name="refresh" size={20} color={mutedTextColor} />
                </TouchableOpacity>
              </View>
              
              {/* Quick forecast */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
                {weatherData.forecast.slice(0, 4).map((day, index) => (
                  <View key={index} className="items-center mr-4 p-2 rounded-lg" style={{ backgroundColor: bgColor, minWidth: 60 }}>
                    <Text className="text-xs mb-1" style={{ color: mutedTextColor }}>{day.day}</Text>
                    <Text className="text-lg mb-1">{day.icon}</Text>
                    <Text className="text-xs" style={{ color: textColor }}>
                      {day.temperatureMax}°/{day.temperatureMin}°
                    </Text>
                  </View>
                ))}
              </ScrollView>
              
              {/* Farming advice */}
              <View className="mt-2 p-2 rounded-lg" style={{ backgroundColor: bgColor }}>
                <Text className="text-xs font-medium mb-1" style={{ color: textColor }}>
                  🌱 Today's Farming Tip:
                </Text>
                <Text className="text-xs" style={{ color: mutedTextColor }}>
                  {weatherService.getFarmingAdvice(weatherData)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={fetchWeatherData} className="flex-row items-center justify-center py-2">
              <Ionicons name="cloud-download" size={20} color={currentMode.color} />
              <Text className="ml-2" style={{ color: textColor }}>Tap to load weather data</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#10b981"
              colors={["#10b981"]}
            />
          }
        >
          <View className="py-4">
            {/* Welcome message when no messages */}
            {messages.length === 0 && (
              <View className="mb-4 mt-2 w-full">
                <View className="flex-row items-start">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-4 mt-2"
                    style={{ backgroundColor: currentMode.color }}
                  >
                    <Text className="text-white text-lg">{currentMode.icon}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <View className="mb-2">
                      <Text className="font-semibold text-lg" style={{ color: currentMode.color }}>
                        {currentMode.name}
                      </Text>
                    </View>
                    
                    <View 
                      className="p-4 rounded-2xl rounded-tl-sm"
                      style={{ backgroundColor: secondaryBg + '40' }}
                    >
                      <Text style={{ color: textColor }} className="text-base leading-6">
                        Hello! I'm your {currentMode.name} assistant. {currentMode.description}. How can I help you today?
                      </Text>
                      <Text className="text-xs mt-3" style={{ color: mutedTextColor }}>
                        {format(new Date(), 'h:mm a')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Chat messages */}
            {messages.map((message, index) => renderMessage(message, index))}

            {/* Loading indicator */}
            {isLoading && (
              <View className="w-full mb-4">
                <View className="flex-row items-start">
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center mr-4 mt-2"
                    style={{ backgroundColor: currentMode.color }}
                  >
                    <Text className="text-white text-lg">{currentMode.icon}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <View className="mb-2">
                      <Text className="font-semibold text-lg" style={{ color: currentMode.color }}>
                        {currentMode.name}
                      </Text>
                    </View>
                    
                    <View 
                      className="p-4 rounded-2xl rounded-tl-sm"
                      style={{ backgroundColor: secondaryBg + '40' }}
                    >
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color={textColor} />
                        <Text className="ml-2" style={{ color: textColor }}>Analyzing...</Text>
                      </View>
                      <Text className="text-xs mt-3" style={{ color: mutedTextColor }}>
                        {format(new Date(), 'h:mm a')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Image preview area */}
        {selectedImages.length > 0 && (
          <View className="px-4 py-2 border-t" style={{ borderTopColor: borderColor }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((imageUri, index) => (
                <View key={index} className="mr-2 relative">
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input area */}
        <View className="px-4 py-3 border-t" style={{ borderTopColor: borderColor }}>
          <View className="flex-row items-end">
            <TouchableOpacity
              onPress={showImagePickerOptions}
              className="w-10 h-10 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: secondaryBg }}
            >
              <Ionicons name="camera" size={20} color={textColor} />
            </TouchableOpacity>

            <View className="flex-1 mr-3">
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder={currentMode.placeholder}
                placeholderTextColor={mutedTextColor}
                className="border rounded-2xl px-4 py-3 text-base min-h-[48px] max-h-32"
                style={{ 
                  color: textColor, 
                  borderColor: borderColor,
                  backgroundColor: secondaryBg
                }}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
                blurOnSubmit={false}
              />
            </View>
            
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={(!inputText.trim() && selectedImages.length === 0) || isLoading}
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ 
                backgroundColor: currentMode.color,
                opacity: ((!inputText.trim() && selectedImages.length === 0) || isLoading) ? 0.5 : 1 
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Mode Selector Modal */}
      {renderModeSelector()}
    </SafeAreaView>
  );
}