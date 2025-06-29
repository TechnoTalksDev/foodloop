import { renderHook, waitFor } from '@testing-library/react-native';
import { useAchievements } from '@/hooks/useAchievements';

// Mock the auth context
const mockSession = {
  user: { id: 'test-user-id' }
};

jest.mock('@/context/supabase-provider', () => ({
  useAuth: () => ({ session: mockSession })
}));

// Mock supabase with comprehensive response
const mockUserAchievements = [
  {
    id: 1,
    user_id: 'test-user-id',
    achievement_id: 1,
    current_progress: 10,
    completed_at: new Date().toISOString(),
    is_completed: true,
    achievement: {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first plant check-in',
      icon: '🌱',
      category: 'getting_started',
      target_value: 1,
      points: 10,
      sort_order: 1,
      is_active: true
    }
  },
  {
    id: 2,
    user_id: 'test-user-id',
    achievement_id: 2,
    current_progress: 7,
    completed_at: null,
    is_completed: false,
    achievement: {
      id: 2,
      name: 'Green Thumb',
      description: 'Check in on plants 10 times',
      icon: '👍',
      category: 'plant_care',
      target_value: 10,
      points: 25,
      sort_order: 2,
      is_active: true
    }
  },
  {
    id: 3,
    user_id: 'test-user-id',
    achievement_id: 3,
    current_progress: 2,
    completed_at: null,
    is_completed: false,
    achievement: {
      id: 3,
      name: 'Marketplace Explorer',
      description: 'Purchase 5 items from the marketplace',
      icon: '🛒',
      category: 'marketplace',
      target_value: 5,
      points: 20,
      sort_order: 3,
      is_active: true
    }
  }
];

jest.mock('@/config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      mockResolvedValue: jest.fn().mockResolvedValue({
        data: mockUserAchievements,
        error: null
      })
    }))
  }
}));

describe('useAchievements Hook', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock successful supabase response
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: mockUserAchievements,
      error: null
    });
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAchievements());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.userAchievements).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should fetch user achievements successfully', async () => {
    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userAchievements).toHaveLength(3);
    expect(result.current.error).toBe(null);
    expect(result.current.userAchievements[0].achievement.name).toBe('First Steps');
  });

  it('should calculate achievement stats correctly', async () => {
    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const stats = result.current.getStats();
    
    expect(stats.totalAchievements).toBe(3);
    expect(stats.completedCount).toBe(1);
    expect(stats.completionPercentage).toBe(33); // 1/3 * 100, rounded
    expect(stats.totalPoints).toBe(55); // 10 + 25 + 20
    expect(stats.earnedPoints).toBe(10); // Only completed achievement
  });

  it('should identify next milestone correctly', async () => {
    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const nextMilestone = result.current.getNextMilestone();
    
    expect(nextMilestone).not.toBe(null);
    expect(nextMilestone?.achievement.name).toBe('Green Thumb');
    expect(nextMilestone?.current_progress).toBe(7);
    expect(nextMilestone?.progressPercentage).toBe(70); // 7/10 * 100
  });

  it('should group achievements by category', async () => {
    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const categories = result.current.getAchievementsByCategory();
    
    expect(categories).toHaveProperty('getting_started');
    expect(categories).toHaveProperty('plant_care');
    expect(categories).toHaveProperty('marketplace');
    expect(categories.getting_started).toHaveLength(1);
    expect(categories.plant_care).toHaveLength(1);
    expect(categories.marketplace).toHaveLength(1);
  });

  it('should return recently completed achievements', async () => {
    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const recentlyCompleted = result.current.getRecentlyCompleted(7);
    
    expect(recentlyCompleted).toHaveLength(1);
    expect(recentlyCompleted[0].achievement.name).toBe('First Steps');
  });

  it('should handle empty achievements list', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null
    });

    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const stats = result.current.getStats();
    const nextMilestone = result.current.getNextMilestone();
    
    expect(result.current.userAchievements).toHaveLength(0);
    expect(stats.totalAchievements).toBe(0);
    expect(stats.completionPercentage).toBe(0);
    expect(nextMilestone).toBe(null);
  });

  it('should handle API errors gracefully', async () => {
    const { supabase } = require('@/config/supabase');
    supabase.from().select().eq().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    });

    const { result } = renderHook(() => useAchievements());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database connection failed');
    expect(result.current.userAchievements).toHaveLength(0);
  });
});
