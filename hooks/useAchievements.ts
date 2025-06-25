import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/supabase-provider';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  target_value: number;
  points: number;
  sort_order: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: number;
  user_id: string;
  achievement_id: number;
  current_progress: number;
  completed_at: string | null;
  is_completed: boolean;
  achievement: Achievement;
}

export interface AchievementStats {
  totalAchievements: number;
  completedCount: number;
  completionPercentage: number;
  totalPoints: number;
  earnedPoints: number;
}

export interface NextMilestone {
  achievement: Achievement;
  current_progress: number;
  progressPercentage: number;
}

export function useAchievements() {
  const { session } = useAuth();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAchievements = async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', session.user.id);

      if (supabaseError) {
        console.error('Error fetching user achievements:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      // Sort the data client-side by achievement sort_order
      const sortedData = (data || []).sort((a, b) => {
        const aOrder = a.achievement?.sort_order || 0;
        const bOrder = b.achievement?.sort_order || 0;
        return aOrder - bOrder;
      });

      setUserAchievements(sortedData);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAchievements();
  }, [session]);

  // Calculate achievement statistics
  const getStats = (): AchievementStats => {
    const totalAchievements = userAchievements.length;
    const completedCount = userAchievements.filter(ua => ua.is_completed).length;
    const completionPercentage = totalAchievements > 0 ? Math.round((completedCount / totalAchievements) * 100) : 0;
    
    const totalPoints = userAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0);
    const earnedPoints = userAchievements
      .filter(ua => ua.is_completed)
      .reduce((sum, ua) => sum + ua.achievement.points, 0);

    return {
      totalAchievements,
      completedCount,
      completionPercentage,
      totalPoints,
      earnedPoints
    };
  };

  // Get the next milestone (closest achievement to completion)
  const getNextMilestone = (): NextMilestone | null => {
    const incompleteAchievements = userAchievements.filter(ua => !ua.is_completed);
    
    if (incompleteAchievements.length === 0) return null;

    // Find the achievement with the highest progress percentage
    const nextAchievement = incompleteAchievements.reduce((closest, current) => {
      const currentProgress = (current.current_progress / current.achievement.target_value) * 100;
      const closestProgress = (closest.current_progress / closest.achievement.target_value) * 100;
      
      return currentProgress > closestProgress ? current : closest;
    });

    const progressPercentage = Math.min(
      (nextAchievement.current_progress / nextAchievement.achievement.target_value) * 100,
      100
    );

    return {
      achievement: nextAchievement.achievement,
      current_progress: nextAchievement.current_progress,
      progressPercentage
    };
  };

  // Group achievements by category for the modal
  const getAchievementsByCategory = () => {
    const categories: { [key: string]: UserAchievement[] } = {};
    
    userAchievements.forEach(ua => {
      const category = ua.achievement.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(ua);
    });

    return categories;
  };

  // Get recently completed achievements (for notifications)
  const getRecentlyCompleted = (days: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return userAchievements.filter(ua => 
      ua.is_completed && 
      ua.completed_at && 
      new Date(ua.completed_at) >= cutoffDate
    );
  };

  return {
    userAchievements,
    loading,
    error,
    getStats,
    getNextMilestone,
    getAchievementsByCategory,
    getRecentlyCompleted,
    refetch: fetchUserAchievements
  };
}
