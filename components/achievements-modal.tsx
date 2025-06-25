import React from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Pressable
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/safe-area-view';
import { useAchievements, UserAchievement } from '@/hooks/useAchievements';
import { useColorScheme } from '@/lib/useColorScheme';

interface AchievementsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Category display names and colors
const CATEGORY_CONFIG = {
  listing: { name: 'Marketplace', color: '#10b981', icon: '📦' },
  purchasing: { name: 'Shopping', color: '#3b82f6', icon: '🛒' },
  plant_listing: { name: 'Plant Sales', color: '#22c55e', icon: '🌱' },
  forum: { name: 'Community', color: '#8b5cf6', icon: '💬' },
  plant_care: { name: 'Plant Care', color: '#059669', icon: '🌿' },
  ai: { name: 'AI Features', color: '#f59e0b', icon: '🤖' },
} as const;

// Helper function to get category config with fallback
const getCategoryConfig = (category: string) => {
  return CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] || {
    name: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: '#6b7280',
    icon: '🏆'
  };
};

function AchievementCard({ userAchievement }: { userAchievement: UserAchievement }) {
  const { achievement, current_progress, is_completed } = userAchievement;
  const progressPercentage = Math.min((current_progress / achievement.target_value) * 100, 100);
  
  const categoryConfig = getCategoryConfig(achievement.category);

  return (
    <View 
      className={`p-4 rounded-xl border-2 mb-3 ${
        is_completed 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-card border-border'
      }`}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: is_completed ? categoryConfig.color + '20' : '#f3f4f6' }}
          >
            <Text className="text-2xl">{achievement.icon}</Text>
          </View>
          
          <View className="flex-1">
            <Text className={`font-bold text-base ${is_completed ? 'text-green-700 dark:text-green-300' : 'text-foreground'}`}>
              {achievement.name}
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              {achievement.description}
            </Text>
          </View>
        </View>
        
        <View className="items-end">
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: categoryConfig.color + '20' }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ color: categoryConfig.color }}
            >
              +{achievement.points}
            </Text>
          </View>
          {is_completed && (
            <Text className="text-green-600 dark:text-green-400 text-xs font-medium mt-1">
              ✓ Completed
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-muted-foreground">
            Progress: {current_progress} / {achievement.target_value}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        
        <View className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <View 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: is_completed ? categoryConfig.color : '#d1d5db'
            }}
          />
        </View>
      </View>
    </View>
  );
}

function CategorySection({ 
  categoryKey, 
  achievements 
}: { 
  categoryKey: string; 
  achievements: UserAchievement[] 
}) {
  const categoryConfig = getCategoryConfig(categoryKey);
  
  const completedCount = achievements.filter(ua => ua.is_completed).length;
  
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-2xl mr-2">{categoryConfig.icon}</Text>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {categoryConfig.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {completedCount} of {achievements.length} completed
          </Text>
        </View>
        <View 
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: categoryConfig.color + '20' }}
        >
          <Text 
            className="text-sm font-medium"
            style={{ color: categoryConfig.color }}
          >
            {completedCount}/{achievements.length}
          </Text>
        </View>
      </View>
      
      {achievements.map(ua => (
        <AchievementCard key={ua.id} userAchievement={ua} />
      ))}
    </View>
  );
}

export function AchievementsModal({ visible, onClose }: AchievementsModalProps) {
  const { userAchievements, loading, getStats, getAchievementsByCategory } = useAchievements();
  const { colorScheme } = useColorScheme();
  
  const stats = getStats();
  const achievementsByCategory = getAchievementsByCategory();
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">🏆</Text>
            <Text className="text-xl font-bold text-foreground">Achievements</Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-muted-foreground text-lg">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Achievement Categories - Full Height ScrollView */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Spacer to push content behind the stats view initially */}
          <View style={{ height: 111 }} />
          
          <View className="p-4">
            {loading ? (
              <View className="items-center py-8">
                <Text className="text-muted-foreground">Loading achievements...</Text>
              </View>
            ) : Object.keys(achievementsByCategory).length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-4xl mb-4">🏆</Text>
                <Text className="text-xl font-bold text-center mb-2">No Achievements Yet</Text>
                <Text className="text-muted-foreground text-center">
                  Start using FoodLoop to unlock your first achievements!
                </Text>
              </View>
            ) : (
              Object.entries(achievementsByCategory).map(([categoryKey, achievements]) => (
                <CategorySection 
                  key={categoryKey} 
                  categoryKey={categoryKey} 
                  achievements={achievements} 
                />
              ))
            )}
          </View>
          
          {/* Bottom padding to ensure content can scroll past the footer */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Stats Overview - Positioned absolutely on top */}
        <BlurView
          intensity={80}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={{ 
            position: 'absolute',
            top: 56, // Adjusted to sit flush with header
            left: 0,
            right: 0,
            overflow: 'hidden'
          }}
        >
          <View className="px-4 py-4 border-b border-border">
            <View className="flex-row justify-between items-center">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedCount}
                </Text>
                <Text className="text-xs text-muted-foreground">Completed</Text>
              </View>
              
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalAchievements}
                </Text>
                <Text className="text-xs text-muted-foreground">Total</Text>
              </View>
              
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.earnedPoints}
                </Text>
                <Text className="text-xs text-muted-foreground">Points</Text>
              </View>
              
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.completionPercentage}%
                </Text>
                <Text className="text-xs text-muted-foreground">Progress</Text>
              </View>
            </View>
            
            {/* Overall Progress Bar */}
            <View className="mt-4">
              <View className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <View 
                  className="h-3 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionPercentage}%` }}
                />
              </View>
            </View>
          </View>
        </BlurView>

        {/* Footer */}
        <View className="px-4 py-3 border-t border-border">
          <Button
            variant="default"
            onPress={onClose}
            className="w-full"
          >
            <Text className="text-primary-foreground font-medium">Close</Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
