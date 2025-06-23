import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@/components/safe-area-view';
import { Text } from '@/components/ui/text';
import { H1, H3 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/supabase-provider';
import { supabase } from '@/config/supabase';
import { useColorScheme } from '@/lib/useColorScheme';
import { colors } from '@/constants/colors';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface ImpactData {
  totalCO2Saved: number;
  totalMoneySaved: number;
  totalFoodRescued: number; // in pounds
  totalMealsEquivalent: number;
  totalWaterSaved: number; // in gallons
  totalTreesEquivalent: number;
  streakDays: number;
  impactRank: number;
  monthlyProgress: MonthlyProgress[];
  categoryBreakdown: CategoryImpact[];
  comparisonData: ComparisonData;
}

interface MonthlyProgress {
  month: string;
  co2Saved: number;
  moneySaved: number;
  foodRescued: number;
}

interface CategoryImpact {
  category: string;
  percentage: number;
  co2Saved: number;
  color: string;
  icon: string;
}

interface ComparisonData {
  vsAverage: {
    co2Percentage: number;
    moneyPercentage: number;
    foodPercentage: number;
  };
  ranking: {
    percentile: number;
    totalUsers: number;
  };
}

// Database types that match Supabase schema
interface DatabaseProduct {
  price: number;
  original_price: string | null;
  trash: number | null;
  name: string | null;
  tags: Array<{ label: string }> | null;
}

interface DatabaseCartItem {
  quantity: number;
  created_at: string;
  product: DatabaseProduct | null;
}

const screenWidth = Dimensions.get('window').width;

export default function ImpactDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const { colorScheme } = useColorScheme();
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const textColor = colorScheme === 'dark' ? colors.dark.foreground : colors.light.foreground;
  const mutedTextColor = colorScheme === 'dark' ? colors.dark.mutedForeground : colors.light.mutedForeground;
  const borderColor = colorScheme === 'dark' ? colors.dark.border : colors.light.border;
  const secondaryBg = colorScheme === 'dark' ? colors.dark.secondary : colors.light.secondary;
  const bgColor = colorScheme === 'dark' ? colors.dark.background : colors.light.background;

  useEffect(() => {
    fetchImpactData();
  }, [session?.user?.id, timeRange]);

  const fetchImpactData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = new Date(2024, 0, 1); // Beginning of platform
      }

      // Fetch user transactions from cart_items (assuming completed purchases)
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          created_at,
          product:product(price, original_price, trash, name, tags)
        `)
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString());

      if (cartError) {
        console.error('Error fetching cart items:', cartError);
        return;
      }

      // Type assertion with proper error handling
      const transactions = (cartItems as any[]) || [];

      // Calculate impact metrics
      let totalCO2Saved = 0;
      let totalMoneySaved = 0;
      let totalFoodRescued = 0;
      const monthlyData: { [key: string]: MonthlyProgress } = {};
      const categoryData: { [key: string]: CategoryImpact } = {};

      transactions.forEach((transaction: any) => {
        const product = transaction.product;
        if (!product) return;

        const quantity = transaction.quantity;
        
        // CO2 savings (assuming each pound of food saves ~2.5kg CO2)
        const trashAmount = product.trash ?? 1;
        const co2Saved = trashAmount * quantity * 2.5;
        totalCO2Saved += co2Saved;
        
        // Money savings
        const originalPrice = product.original_price ? parseFloat(product.original_price) : 0;
        const moneySaved = Math.max(0, (originalPrice - product.price) * quantity);
        totalMoneySaved += moneySaved;
        
        // Food rescued
        const foodRescued = trashAmount * quantity;
        totalFoodRescued += foodRescued;
        
        // Monthly breakdown
        const month = format(new Date(transaction.created_at), 'MMM yyyy');
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            co2Saved: 0,
            moneySaved: 0,
            foodRescued: 0
          };
        }
        monthlyData[month].co2Saved += co2Saved;
        monthlyData[month].moneySaved += moneySaved;
        monthlyData[month].foodRescued += foodRescued;
        
        // Category breakdown
        const category = getCategoryFromProduct(product);
        if (!categoryData[category.name]) {
          categoryData[category.name] = {
            category: category.name,
            percentage: 0,
            co2Saved: 0,
            color: category.color,
            icon: category.icon
          };
        }
        categoryData[category.name].co2Saved += co2Saved;
      });

      // Calculate category percentages
      Object.values(categoryData).forEach(category => {
        category.percentage = totalCO2Saved > 0 ? (category.co2Saved / totalCO2Saved) * 100 : 0;
      });

      // Calculate derived metrics
      const totalMealsEquivalent = Math.floor(totalFoodRescued / 1.2); // ~1.2 lbs per meal
      const totalWaterSaved = Math.round(totalFoodRescued * 25); // ~25 gallons per pound
      const totalTreesEquivalent = Math.round((totalCO2Saved / 48) * 100) / 100; // ~48lbs CO2 per tree per year

      // Mock comparison data (in real app, this would come from aggregated user data)
      const comparisonData: ComparisonData = {
        vsAverage: {
          co2Percentage: totalCO2Saved > 10 ? 150 : 80, // 50% above or 20% below average
          moneyPercentage: totalMoneySaved > 20 ? 120 : 90,
          foodPercentage: totalFoodRescued > 5 ? 180 : 75
        },
        ranking: {
          percentile: Math.min(85, Math.max(15, Math.round((totalCO2Saved / 50) * 85))),
          totalUsers: 10000
        }
      };

      const processedImpactData: ImpactData = {
        totalCO2Saved: Math.round(totalCO2Saved * 100) / 100,
        totalMoneySaved: Math.round(totalMoneySaved * 100) / 100,
        totalFoodRescued: Math.round(totalFoodRescued * 100) / 100,
        totalMealsEquivalent,
        totalWaterSaved,
        totalTreesEquivalent,
        streakDays: Math.floor(Math.random() * 30) + 1, // Mock streak
        impactRank: Math.floor(Math.random() * 1000) + 1,
        monthlyProgress: Object.values(monthlyData).slice(-6),
        categoryBreakdown: Object.values(categoryData).filter(cat => cat.percentage > 0),
        comparisonData
      };

      setImpactData(processedImpactData);

    } catch (error) {
      console.error('Error fetching impact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchImpactData();
    setRefreshing(false);
  };

  const getCategoryFromProduct = (product: any): { name: string; color: string; icon: string } => {
    const name = product.name?.toLowerCase() || '';
    const tags = product.tags?.map((t: any) => t.label?.toLowerCase()).join(' ') || '';
    const content = `${name} ${tags}`;

    if (content.includes('fruit') || content.includes('apple')) {
      return { name: 'Fruits', color: '#f59e0b', icon: '🍎' };
    }
    if (content.includes('vegetable') || content.includes('veggie')) {
      return { name: 'Vegetables', color: '#10b981', icon: '🥦' };
    }
    if (content.includes('bread') || content.includes('bakery')) {
      return { name: 'Bakery', color: '#d97706', icon: '🍞' };
    }
    if (content.includes('dairy') || content.includes('milk')) {
      return { name: 'Dairy', color: '#3b82f6', icon: '🥛' };
    }
    return { name: 'Other', color: '#6b7280', icon: '🍽️' };
  };

  const renderImpactCard = (title: string, value: string, subtitle: string, icon: string, color: string) => (
    <View 
      className="p-4 rounded-xl border border-border flex-1 mx-1 mb-4"
      style={{ backgroundColor: secondaryBg + '40' }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-2xl">{icon}</Text>
        <View className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }} />
      </View>
      <Text className="text-2xl font-bold mb-1" style={{ color: textColor }}>
        {value}
      </Text>
      <Text className="text-sm font-medium" style={{ color: textColor }}>
        {title}
      </Text>
      <Text className="text-xs mt-1" style={{ color: mutedTextColor }}>
        {subtitle}
      </Text>
    </View>
  );

  const renderProgressChart = () => {
    if (!impactData?.monthlyProgress.length) return null;

    const maxValue = Math.max(...impactData.monthlyProgress.map(p => p.co2Saved), 1);
    const chartHeight = 120;
    const chartWidth = screenWidth - 64;
    const barWidth = Math.max((chartWidth - 60) / impactData.monthlyProgress.length, 40);

    return (
      <View 
        className="p-4 rounded-xl border border-border mb-6"
        style={{ backgroundColor: secondaryBg + '40' }}
      >
        <H3 className="mb-4">Monthly Progress</H3>
        <View style={{ width: chartWidth, height: chartHeight }}>
          {impactData.monthlyProgress.map((data, index) => {
            const barHeight = Math.max((data.co2Saved / maxValue) * (chartHeight - 40), 5);
            const x = index * barWidth + 30;
            const y = chartHeight - barHeight - 20;
            
            return (
              <View key={index} style={{ position: 'absolute', left: x, top: y }}>
                <View
                  style={{
                    width: barWidth - 10,
                    height: barHeight,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    opacity: 0.8
                  }}
                />
                <Text
                  style={{
                    position: 'absolute',
                    top: barHeight + 5,
                    left: (barWidth - 10) / 2,
                    fontSize: 10,
                    color: mutedTextColor,
                    textAlign: 'center',
                    width: barWidth - 10
                  }}
                >
                  {data.month.split(' ')[0]}
                </Text>
                {data.co2Saved > 0 && (
                  <Text
                    style={{
                      position: 'absolute',
                      top: -15,
                      left: (barWidth - 10) / 2,
                      fontSize: 9,
                      color: textColor,
                      textAlign: 'center',
                      width: barWidth - 10
                    }}
                  >
                    {data.co2Saved.toFixed(1)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <Text className="text-xs text-center mt-2" style={{ color: mutedTextColor }}>
          CO₂ Saved (kg) per month
        </Text>
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    if (!impactData?.categoryBreakdown.length) return null;

    const radius = 60;
    let accumulatedPercentage = 0;

    return (
      <View 
        className="p-4 rounded-xl border border-border mb-6"
        style={{ backgroundColor: secondaryBg + '40' }}
      >
        <H3 className="mb-4">Impact by Category</H3>
        <View className="flex-row items-center">
          <View className="mr-6">
            <View style={{ width: 140, height: 140, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              {/* Background circle */}
              <View
                style={{
                  position: 'absolute',
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  borderWidth: 20,
                  borderColor: secondaryBg,
                }}
              />
              
              {/* Category circles - simplified visualization */}
              {impactData.categoryBreakdown.map((category, index) => {
                const startAngle = (accumulatedPercentage / 100) * 360;
                accumulatedPercentage += category.percentage;
                
                return (
                  <View
                    key={index}
                    style={{
                      position: 'absolute',
                      width: 4,
                      height: radius,
                      backgroundColor: category.color,
                      left: 70 - 2,
                      top: 70 - radius,
                      transformOrigin: '50% 100%',
                      transform: [{ rotate: `${startAngle}deg` }]
                    }}
                  />
                );
              })}
              
              {/* Center text */}
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: textColor }}>
                  {impactData.totalCO2Saved.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 10, color: mutedTextColor }}>
                  kg CO₂
                </Text>
              </View>
            </View>
          </View>
          
          <View className="flex-1">
            {impactData.categoryBreakdown.map((category, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Text className="text-sm mr-2">{category.icon}</Text>
                <View 
                  className="w-3 h-3 rounded-full mr-3" 
                  style={{ backgroundColor: category.color }}
                />
                <Text className="text-sm flex-1" style={{ color: textColor }}>
                  {category.category}
                </Text>
                <Text className="text-sm font-medium" style={{ color: textColor }}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderComparisonSection = () => {
    if (!impactData) return null;

    return (
      <View 
        className="p-4 rounded-xl border border-border mb-6"
        style={{ backgroundColor: secondaryBg + '40' }}
      >
        <H3 className="mb-4">How You Compare</H3>
        
        <View className="mb-4">
          <Text className="text-center text-2xl font-bold mb-2" style={{ color: '#10b981' }}>
            Top {100 - impactData.comparisonData.ranking.percentile}%
          </Text>
          <Text className="text-center" style={{ color: mutedTextColor }}>
            You're doing better than {impactData.comparisonData.ranking.percentile}% of FoodLoop users
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm" style={{ color: textColor }}>
              CO₂ Impact vs Average
            </Text>
            <View className="flex-row items-center">
              <Text className="font-medium mr-2" style={{ color: '#10b981' }}>
                {impactData.comparisonData.vsAverage.co2Percentage >= 100 ? '+' : ''}
                {impactData.comparisonData.vsAverage.co2Percentage - 100}%
              </Text>
              <Ionicons 
                name={impactData.comparisonData.vsAverage.co2Percentage >= 100 ? "trending-up" : "trending-down"} 
                size={16} 
                color={impactData.comparisonData.vsAverage.co2Percentage >= 100 ? "#10b981" : "#ef4444"} 
              />
            </View>
          </View>
          
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm" style={{ color: textColor }}>
              Money Saved vs Average
            </Text>
            <View className="flex-row items-center">
              <Text className="font-medium mr-2" style={{ color: '#10b981' }}>
                {impactData.comparisonData.vsAverage.moneyPercentage >= 100 ? '+' : ''}
                {impactData.comparisonData.vsAverage.moneyPercentage - 100}%
              </Text>
              <Ionicons 
                name={impactData.comparisonData.vsAverage.moneyPercentage >= 100 ? "trending-up" : "trending-down"} 
                size={16} 
                color={impactData.comparisonData.vsAverage.moneyPercentage >= 100 ? "#10b981" : "#ef4444"} 
              />
            </View>
          </View>
          
          <View className="flex-row items-center justify-between py-2">
            <Text className="text-sm" style={{ color: textColor }}>
              Food Rescued vs Average
            </Text>
            <View className="flex-row items-center">
              <Text className="font-medium mr-2" style={{ color: '#10b981' }}>
                {impactData.comparisonData.vsAverage.foodPercentage >= 100 ? '+' : ''}
                {impactData.comparisonData.vsAverage.foodPercentage - 100}%
              </Text>
              <Ionicons 
                name={impactData.comparisonData.vsAverage.foodPercentage >= 100 ? "trending-up" : "trending-down"} 
                size={16} 
                color={impactData.comparisonData.vsAverage.foodPercentage >= 100 ? "#10b981" : "#ef4444"} 
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="mt-4" style={{ color: mutedTextColor }}>
          Loading your impact data...
        </Text>
      </SafeAreaView>
    );
  }

  if (!impactData || (impactData.totalCO2Saved === 0 && impactData.totalMoneySaved === 0)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <View className="items-center">
          <Text className="text-6xl mb-4">🌱</Text>
          <Text className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
            Start Your Impact Journey
          </Text>
          <Text className="text-center mb-6" style={{ color: mutedTextColor }}>
            Make your first purchase to see your environmental impact!
          </Text>
          <Button
            onPress={() => router.push('/(protected)/(tabs)/marketplace')}
            className="px-6"
          >
            <Text>Explore Marketplace</Text>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <H1 className="text-center">Your Impact</H1>
        <View className="w-6" />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10b981"]}
            tintColor="#10b981"
          />
        }
      >
        {/* Subtitle */}
        <View className="px-4 py-4">
          <Text className="text-center" style={{ color: mutedTextColor }}>
            See how you're making a difference with FoodLoop
          </Text>
        </View>

        {/* Time Range Selector */}
        <View className="px-4 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['week', 'month', 'year', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                className={`mr-3 px-4 py-2 rounded-full`}
                style={{
                  backgroundColor: timeRange === range ? '#10b981' : secondaryBg
                }}
              >
                <Text 
                  className="capitalize"
                  style={{ 
                    color: timeRange === range ? '#ffffff' : textColor
                  }}
                >
                  {range === 'all' ? 'All Time' : `This ${range}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Impact Cards */}
        <View className="px-4 mb-6">
          <View className="flex-row mb-4">
            {renderImpactCard(
              'CO₂ Saved',
              `${impactData.totalCO2Saved} kg`,
              `= ${impactData.totalTreesEquivalent} trees`,
              '🌍',
              '#10b981'
            )}
            {renderImpactCard(
              'Money Saved',
              `$${impactData.totalMoneySaved}`,
              'vs. regular prices',
              '💰',
              '#f59e0b'
            )}
          </View>
          <View className="flex-row">
            {renderImpactCard(
              'Food Rescued',
              `${impactData.totalFoodRescued} lbs`,
              `= ${impactData.totalMealsEquivalent} meals`,
              '🍽️',
              '#3b82f6'
            )}
            {renderImpactCard(
              'Water Saved',
              `${impactData.totalWaterSaved} gal`,
              'water conservation',
              '💧',
              '#06b6d4'
            )}
          </View>
        </View>

        {/* Streak Counter */}
        <View className="px-4 mb-6">
          <View 
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: colorScheme === 'dark' ? '#f59e0b20' : '#fef3c7'
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl mr-3">🔥</Text>
              <View>
                <Text 
                  className="text-2xl font-bold"
                  style={{ color: colorScheme === 'dark' ? '#f59e0b' : '#d97706' }}
                >
                  {impactData.streakDays} Day Streak
                </Text>
                <Text style={{ color: colorScheme === 'dark' ? '#fbbf24' : '#92400e' }}>
                  Keep up the sustainable habits!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress Chart */}
        <View className="px-4">
          {renderProgressChart()}
        </View>

        {/* Category Breakdown */}
        <View className="px-4">
          {renderCategoryBreakdown()}
        </View>

        {/* Comparison Section */}
        <View className="px-4">
          {renderComparisonSection()}
        </View>

        {/* Call to Action */}
        <View className="px-4 mb-6">
          <View 
            className="p-4 rounded-xl"
            style={{ backgroundColor: secondaryBg + '40' }}
          >
            <Text className="text-center text-lg font-semibold mb-2" style={{ color: textColor }}>
              Keep Making an Impact!
            </Text>
            <Text className="text-center mb-4" style={{ color: mutedTextColor }}>
              Continue shopping sustainably to increase your positive impact
            </Text>
            <Button
              onPress={() => router.push('/(protected)/(tabs)/marketplace')}
              className="w-full"
            >
              <Text>Shop More Products</Text>
            </Button>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}