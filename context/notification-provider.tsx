import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './supabase-provider';
import { supabase } from '@/config/supabase';
import { format, isToday, isTomorrow, addDays, differenceInHours } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification types
export type NotificationType = 
  | 'message' 
  | 'plant_reminder' 
  | 'harvest_ready' 
  | 'weather_alert' 
  | 'marketplace_update' 
  | 'order_update' 
  | 'community_post'
  | 'community_reply'
  | 'community_vote'
  | 'group_join'
  | 'group_update'
  | 'achievement'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  urgent: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  icon: string;
}

export interface NotificationPreferences {
  messages: boolean;
  plant_reminders: boolean;
  harvest_alerts: boolean;
  weather_alerts: boolean;
  marketplace_updates: boolean;
  order_updates: boolean;
  community_updates: boolean;
  community_replies: boolean;
  community_votes: boolean;
  group_updates: boolean;
  achievements: boolean;
  system_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string; // "08:00"
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  loading: boolean;
  addNotification: (notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearExpiredNotifications: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  checkPlantReminders: () => Promise<void>;
  checkWeatherAlerts: () => Promise<void>;
  checkMarketplaceUpdates: () => Promise<void>;
  checkCommunityUpdates: () => Promise<void>;
  isInQuietHours: () => boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  messages: true,
  plant_reminders: true,
  harvest_alerts: true,
  weather_alerts: true,
  marketplace_updates: true,
  order_updates: true,
  community_updates: true,
  community_replies: true,
  community_votes: false, // Off by default to avoid spam
  group_updates: true,
  achievements: true,
  system_notifications: true,
  quiet_hours_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
};

export const NotificationProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Storage keys
  const getNotificationsKey = (userId: string) => `notifications_${userId}`;
  const getPreferencesKey = (userId: string) => `notification_preferences_${userId}`;
  const getLastCheckKey = (userId: string, type: string) => `last_check_${type}_${userId}`;

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const stored = await AsyncStorage.getItem(getNotificationsKey(session.user.id));
      if (stored) {
        const parsedNotifications = JSON.parse(stored) as AppNotification[];
        // Filter out expired notifications
        const validNotifications = parsedNotifications.filter(n => 
          !n.expires_at || new Date(n.expires_at) > new Date()
        );
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [session?.user?.id]);

  // Save notifications to storage
  const saveNotifications = useCallback(async (notifs: AppNotification[]) => {
    if (!session?.user?.id) return;

    try {
      await AsyncStorage.setItem(
        getNotificationsKey(session.user.id),
        JSON.stringify(notifs)
      );
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [session?.user?.id]);

  // Load preferences from storage
  const loadPreferences = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const stored = await AsyncStorage.getItem(getPreferencesKey(session.user.id));
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, [session?.user?.id]);

  // Save preferences to storage
  const savePreferences = useCallback(async (prefs: NotificationPreferences) => {
    if (!session?.user?.id) return;

    try {
      await AsyncStorage.setItem(
        getPreferencesKey(session.user.id),
        JSON.stringify(prefs)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [session?.user?.id]);

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadNotifications(), loadPreferences()]);
      setLoading(false);
    };

    if (session?.user?.id) {
      initialize();
    } else {
      setLoading(false);
      setNotifications([]);
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [session?.user?.id, loadNotifications, loadPreferences]);

  // Check if current time is in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!preferences.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMinute] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences]);

  // Generate unique ID
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Add notification
  const addNotification = useCallback((
    notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>
  ) => {
    // Check if this type of notification is enabled
    const prefKey = notification.type as keyof NotificationPreferences;
    if (prefKey in preferences && !preferences[prefKey]) {
      return; // User has disabled this type of notification
    }

    // Don't send non-urgent notifications during quiet hours
    if (!notification.urgent && isInQuietHours()) {
      return;
    }

    const newNotification: AppNotification = {
      ...notification,
      id: generateId(),
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });

    // Show system alert for urgent notifications
    if (notification.urgent && !isInQuietHours()) {
      Alert.alert(notification.title, notification.message);
    }

    console.log('🔔 [Notification] Added:', notification.title);
  }, [preferences, isInQuietHours, saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Delete notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Clear expired notifications
  const clearExpiredNotifications = useCallback(() => {
    const now = new Date();
    setNotifications(prev => {
      const updated = prev.filter(n => 
        !n.expires_at || new Date(n.expires_at) > now
      );
      if (updated.length !== prev.length) {
        saveNotifications(updated);
      }
      return updated;
    });
  }, [saveNotifications]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    await savePreferences(updatedPreferences);
  }, [preferences, savePreferences]);

  // Check for plant reminders
  const checkPlantReminders = useCallback(async () => {
    if (!session?.user?.id || !preferences.plant_reminders) return;

    try {
      // Check if we've already checked recently (avoid spam)
      const lastCheck = await AsyncStorage.getItem(getLastCheckKey(session.user.id, 'plants'));
      if (lastCheck && differenceInHours(new Date(), new Date(lastCheck)) < 2) {
        return; // Don't check more than once every 2 hours
      }

      // Get user plants that need attention
      const { data: plants, error } = await supabase
        .from('user_plants')
        .select('*')
        .eq('user_id', session.user.id)
        .neq('status', 'harvested');

      if (error || !plants) return;

      const now = new Date();
      let remindersSent = 0;

      for (const plant of plants) {
        // Check if plant needs watering (hasn't been checked in 24+ hours)
        if (!plant.last_checkin || 
            differenceInHours(now, new Date(plant.last_checkin)) >= 24) {
          
          addNotification({
            type: 'plant_reminder',
            title: `${plant.plant_name} needs attention! 🌱`,
            message: `Your ${plant.plant_type} hasn't been checked in over 24 hours. Consider watering and taking a photo.`,
            data: { plant_id: plant.id, plant_name: plant.plant_name },
            urgent: false,
            action_url: `/(protected)/plants/plant-detail/${plant.id}`,
            icon: '🌱',
            expires_at: addDays(now, 1).toISOString(),
          });
          remindersSent++;
        }

        // Check if plant is ready for harvest
        if (plant.status === 'ready_to_harvest') {
          addNotification({
            type: 'harvest_ready',
            title: `Time to harvest! 🍅`,
            message: `Your ${plant.plant_name} is ready for harvest. Consider selling on the marketplace!`,
            data: { plant_id: plant.id, plant_name: plant.plant_name },
            urgent: false,
            action_url: `/(protected)/plants/plant-detail/${plant.id}`,
            icon: '🍅',
            expires_at: addDays(now, 3).toISOString(),
          });
          remindersSent++;
        }
      }

      // Update last check time
      await AsyncStorage.setItem(getLastCheckKey(session.user.id, 'plants'), now.toISOString());
      
      if (remindersSent > 0) {
        console.log(`🌱 [Plant Reminders] Sent ${remindersSent} reminders`);
      }
    } catch (error) {
      console.error('Error checking plant reminders:', error);
    }
  }, [session?.user?.id, preferences.plant_reminders, addNotification]);

  // Check for weather alerts
  const checkWeatherAlerts = useCallback(async () => {
    if (!session?.user?.id || !preferences.weather_alerts) return;

    try {
      // Check if we've already checked recently
      const lastCheck = await AsyncStorage.getItem(getLastCheckKey(session.user.id, 'weather'));
      if (lastCheck && differenceInHours(new Date(), new Date(lastCheck)) < 6) {
        return; // Don't check more than once every 6 hours
      }

      // Simulate weather alerts (you can integrate with your weather service)
      const now = new Date();
      const tomorrow = addDays(now, 1);

      // Example: Random frost warning (in a real app, this would come from weather API)
      if (Math.random() < 0.05) { // 5% chance for demo
        addNotification({
          type: 'weather_alert',
          title: 'Frost Warning! ❄️',
          message: 'Temperatures may drop below freezing tonight. Protect your sensitive plants.',
          data: { alert_type: 'frost_warning' },
          urgent: true,
          action_url: '/(protected)/(tabs)/plants',
          icon: '❄️',
          expires_at: tomorrow.toISOString(),
        });
        console.log('❄️ [Weather Alert] Frost warning sent');
      }

      // Update last check time
      await AsyncStorage.setItem(getLastCheckKey(session.user.id, 'weather'), now.toISOString());
    } catch (error) {
      console.error('Error checking weather alerts:', error);
    }
  }, [session?.user?.id, preferences.weather_alerts, addNotification]);

  // Check for marketplace updates
  const checkMarketplaceUpdates = useCallback(async () => {
    if (!session?.user?.id || !preferences.marketplace_updates) return;

    try {
      // Check if we've already checked recently
      const lastCheck = await AsyncStorage.getItem(getLastCheckKey(session.user.id, 'marketplace'));
      if (lastCheck && differenceInHours(new Date(), new Date(lastCheck)) < 4) {
        return; // Don't check more than once every 4 hours
      }

      // Check for new products in user's area or matching their interests
      const { data: products, error } = await supabase
        .from('product')
        .select('*')
        .gt('amount', 0)
        .gte('created_at', addDays(new Date(), -1).toISOString()) // Products from last 24 hours
        .limit(5);

      if (error || !products || products.length === 0) {
        await AsyncStorage.setItem(getLastCheckKey(session.user.id, 'marketplace'), new Date().toISOString());
        return;
      }

      // Send notification about new items
      const now = new Date();
      addNotification({
        type: 'marketplace_update',
        title: 'New items on FoodLoop! 🛒',
        message: `${products.length} new items available in your area. Check them out!`,
        data: { new_products_count: products.length },
        urgent: false,
        action_url: '/(protected)/(tabs)/marketplace',
        icon: '🛒',
        expires_at: addDays(now, 2).toISOString(),
      });

      await AsyncStorage.setItem(getLastCheckKey(session.user.id, 'marketplace'), now.toISOString());
      console.log(`🛒 [Marketplace] New items notification sent (${products.length} items)`);
    } catch (error) {
      console.log('Error checking marketplace updates:', error);
    }
  }, [session?.user?.id, preferences.marketplace_updates, addNotification]);

  // NEW: Check for community updates
  const checkCommunityUpdates = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // Check if we've already checked recently
      const lastCheck = await AsyncStorage.getItem(getLastCheckKey(session.user.id, 'community'));
      const lastCheckTime = lastCheck ? new Date(lastCheck) : addDays(new Date(), -1);
      
      if (lastCheck && differenceInHours(new Date(), lastCheckTime) < 1) {
        return; // Don't check more than once every hour
      }

      const now = new Date();

      // 1. Check for replies to user's posts
      if (preferences.community_replies) {
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, title')
          .eq('author_id', session.user.id);

        if (userPosts) {
          const postIds = userPosts.map(p => p.id);
          const { data: newReplies } = await supabase
            .from('post_replies')
            .select(`
              *,
              author:users!post_replies_author_id_fkey(name, username),
              post:posts!post_replies_post_id_fkey(title)
            `)
            .in('post_id', postIds)
            .neq('author_id', session.user.id) // Don't notify about own replies
            .gte('created_at', lastCheckTime.toISOString())
            .eq('is_deleted', false);

          if (newReplies && newReplies.length > 0) {
            for (const reply of newReplies) {
              const authorName = reply.author?.name || reply.author?.username || 'Someone';
              
              addNotification({
                type: 'community_reply',
                title: `💬 New reply to your post`,
                message: `${authorName} replied to "${reply.post?.title}": ${reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content}`,
                data: { 
                  post_id: reply.post_id,
                  reply_id: reply.id,
                  author_name: authorName 
                },
                urgent: false,
                action_url: `/(protected)/post/${reply.post_id}`,
                icon: '💬',
                expires_at: addDays(now, 7).toISOString(),
              });
            }
          }
        }
      }

      // 2. Check for votes on user's posts (if enabled)
      if (preferences.community_votes) {
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, title, upvotes, downvotes')
          .eq('author_id', session.user.id);

        if (userPosts) {
          const postIds = userPosts.map(p => p.id);
          const { data: newVotes } = await supabase
            .from('post_votes')
            .select(`
              *,
              voter:users!post_votes_user_id_fkey(name, username),
              post:posts!post_votes_post_id_fkey(title)
            `)
            .in('post_id', postIds)
            .neq('user_id', session.user.id) // Don't notify about own votes
            .gte('created_at', lastCheckTime.toISOString());

          if (newVotes && newVotes.length > 0) {
            // Group votes by post for summary notifications
            const votesByPost = newVotes.reduce((acc: Record<number, { ups: number; downs: number; title: string }>, vote: any) => {
              if (!acc[vote.post_id!]) {
                acc[vote.post_id!] = { ups: 0, downs: 0, title: vote.post?.title || 'Unknown' };
              }
              if (vote.vote_type === 'up') acc[vote.post_id!].ups++;
              else acc[vote.post_id!].downs++;
              return acc;
            }, {});

            for (const [postId, votes] of Object.entries(votesByPost)) {
              if (votes.ups > 0) {
                addNotification({
                  type: 'community_vote',
                  title: `👍 Your post got ${votes.ups} upvote${votes.ups > 1 ? 's' : ''}!`,
                  message: `"${votes.title}" is getting positive feedback from the community.`,
                  data: { post_id: parseInt(postId), upvotes: votes.ups },
                  urgent: false,
                  action_url: `/(protected)/post/${postId}`,
                  icon: '👍',
                  expires_at: addDays(now, 3).toISOString(),
                });
              }
            }
          }
        }
      }

      // 3. Check for new posts in joined groups
      if (preferences.group_updates) {
        const { data: memberGroups } = await supabase
          .from('group_members')
          .select(`
            group:groups!group_members_group_id_fkey(id, name)
          `)
          .eq('user_id', session.user.id)
          .eq('is_active', true);

        if (memberGroups && memberGroups.length > 0) {
          const groupIds = memberGroups.map((mg: any) => mg.group?.id).filter(Boolean);
          
          const { data: newGroupPosts } = await supabase
            .from('posts')
            .select(`
              *,
              author:users!posts_author_id_fkey(name, username),
              group:groups!posts_group_id_fkey(name)
            `)
            .in('group_id', groupIds)
            .neq('author_id', session.user.id) // Don't notify about own posts
            .gte('created_at', lastCheckTime.toISOString())
            .limit(5); // Limit to avoid spam

          if (newGroupPosts && newGroupPosts.length > 0) {
            // Group by group for summary notifications
            const postsByGroup = newGroupPosts.reduce((acc: Record<string, any[]>, post: any) => {
              const groupName = post.group?.name || 'Unknown Group';
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(post);
              return acc;
            }, {});

            for (const [groupName, posts] of Object.entries(postsByGroup)) {
              if (posts.length === 1) {
                const post = posts[0];
                const authorName = post.author?.name || post.author?.username || 'Someone';
                
                addNotification({
                  type: 'group_update',
                  title: `📝 New post in ${groupName}`,
                  message: `${authorName} posted: "${post.title}"`,
                  data: { 
                    post_id: post.id,
                    group_name: groupName,
                    author_name: authorName 
                  },
                  urgent: false,
                  action_url: `/(protected)/post/${post.id}`,
                  icon: '📝',
                  expires_at: addDays(now, 5).toISOString(),
                });
              } else {
                addNotification({
                  type: 'group_update',
                  title: `📝 ${posts.length} new posts in ${groupName}`,
                  message: `Check out the latest discussions in your group.`,
                  data: { 
                    group_name: groupName,
                    post_count: posts.length 
                  },
                  urgent: false,
                  action_url: `/(protected)/(tabs)/community`,
                  icon: '📝',
                  expires_at: addDays(now, 3).toISOString(),
                });
              }
            }
          }
        }
      }

      // 4. Check for new popular posts in user's interests
      if (preferences.community_updates) {
        const { data: popularPosts } = await supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_author_id_fkey(name, username)
          `)
          .neq('author_id', session.user.id)
          .gte('created_at', addDays(lastCheckTime, -1).toISOString()) // Posts from last day since last check
          .gte('upvotes', 5) // At least 5 upvotes
          .order('upvotes', { ascending: false })
          .limit(3);

        if (popularPosts && popularPosts.length > 0) {
          const post = popularPosts[0]; // Just notify about the top one
          const authorName = post.author?.name || post.author?.username || 'Someone';
          
          addNotification({
            type: 'community_post',
            title: `🔥 Trending post: "${post.title}"`,
            message: `${authorName}'s post is getting lots of attention with ${post.upvotes} upvotes!`,
            data: { 
              post_id: post.id,
              author_name: authorName,
              upvotes: post.upvotes 
            },
            urgent: false,
            action_url: `/(protected)/post/${post.id}`,
            icon: '🔥',
            expires_at: addDays(now, 2).toISOString(),
          });
        }
      }

      // Update last check time
      await AsyncStorage.setItem(getLastCheckKey(session.user.id, 'community'), now.toISOString());
      console.log('👥 [Community Updates] Check completed');
    } catch (error) {
      console.error('Error checking community updates:', error);
    }
  }, [session?.user?.id, preferences, addNotification]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    clearExpiredNotifications();
    await Promise.all([
      checkPlantReminders(),
      checkWeatherAlerts(),
      checkMarketplaceUpdates(),
      checkCommunityUpdates(), // NEW: Include community updates
    ]);
  }, [clearExpiredNotifications, checkPlantReminders, checkWeatherAlerts, checkMarketplaceUpdates, checkCommunityUpdates]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('🔔 [Notifications] Setting up realtime subscriptions');

    // Subscribe to new messages for notifications
    const messagesChannel = supabase
      .channel('notifications-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Only notify if message is not from current user
          if (message.sender_id !== session.user.id) {
            // Get conversation details to check if user is involved
            const { data: conversation } = await supabase
              .from('conversations')
              .select(`
                *,
                buyer:users!conversations_buyer_id_fkey(name, username),
                seller:users!conversations_seller_id_fkey(name, username),
                product:product!conversations_product_id_fkey(name)
              `)
              .eq('id', message.conversation_id)
              .single();

            if (conversation && 
                (conversation.buyer_id === session.user.id || conversation.seller_id === session.user.id)) {
              
              const otherUser = conversation.buyer_id === session.user.id 
                ? (conversation as any).seller 
                : (conversation as any).buyer;
              
              const senderName = otherUser?.name || otherUser?.username || 'Someone';
              
              addNotification({
                type: 'message',
                title: `New message from ${senderName}`,
                message: message.content.length > 50 
                  ? message.content.substring(0, 50) + '...'
                  : message.content,
                data: { 
                  conversation_id: message.conversation_id,
                  message_id: message.id,
                  sender_name: senderName 
                },
                urgent: false,
                action_url: `/conversation/${message.conversation_id}`,
                icon: '💬',
                expires_at: addDays(new Date(), 7).toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    // NEW: Subscribe to post replies for real-time notifications
    const repliesChannel = supabase
      .channel('notifications-replies')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_replies',
        },
        async (payload) => {
          const reply = payload.new as any;
          
          // Only notify if reply is not from current user
          if (reply.author_id !== session.user.id && preferences.community_replies) {
            // Get post details to check if current user is the author
            const { data: post } = await supabase
              .from('posts')
              .select(`
                title,
                author_id,
                author:users!posts_author_id_fkey(name, username)
              `)
              .eq('id', reply.post_id)
              .single();

            // If current user is the post author, send notification
            if (post && post.author_id === session.user.id) {
              const { data: replyAuthor } = await supabase
                .from('users')
                .select('name, username')
                .eq('id', reply.author_id)
                .single();

              const authorName = (replyAuthor as any)?.name || (replyAuthor as any)?.username || 'Someone';
              
              addNotification({
                type: 'community_reply',
                title: `💬 New reply to your post`,
                message: `${authorName} replied to "${post.title}": ${reply.content.length > 50 ? reply.content.substring(0, 50) + '...' : reply.content}`,
                data: { 
                  post_id: reply.post_id,
                  reply_id: reply.id,
                  author_name: authorName 
                },
                urgent: false,
                action_url: `/(protected)/post/${reply.post_id}`,
                icon: '💬',
                expires_at: addDays(new Date(), 7).toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    // NEW: Subscribe to post votes for real-time notifications
    const votesChannel = supabase
      .channel('notifications-votes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_votes',
        },
        async (payload) => {
          const vote = payload.new as any;
          
          // Only notify about upvotes and if user has enabled vote notifications
          if (vote.user_id !== session.user.id && 
              vote.vote_type === 'up' && 
              preferences.community_votes &&
              vote.post_id) { // Make sure it's a post vote, not reply vote
            
            // Get post details to check if current user is the author
            const { data: post } = await supabase
              .from('posts')
              .select('title, author_id, upvotes')
              .eq('id', vote.post_id)
              .single();

            // If current user is the post author, send notification
            if (post && post.author_id === session.user.id) {
              const { data: voter } = await supabase
                .from('users')
                .select('name, username')
                .eq('id', vote.user_id)
                .single();

              const voterName = (voter as any)?.name || (voter as any)?.username || 'Someone';
              
              addNotification({
                type: 'community_vote',
                title: `👍 ${voterName} upvoted your post!`,
                message: `"${post.title}" now has ${post.upvotes + 1} upvotes.`,
                data: { 
                  post_id: vote.post_id,
                  voter_name: voterName,
                  upvotes: post.upvotes + 1
                },
                urgent: false,
                action_url: `/(protected)/post/${vote.post_id}`,
                icon: '👍',
                expires_at: addDays(new Date(), 3).toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    // NEW: Subscribe to new group memberships
    const groupMembersChannel = supabase
      .channel('notifications-group-members')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_members',
        },
        async (payload) => {
          const membership = payload.new as any;
          
          // Only notify if someone joined a group created by current user
          if (membership.user_id !== session.user.id && preferences.group_updates) {
            const { data: group } = await supabase
              .from('groups')
              .select(`
                name,
                creator_id,
                member_count
              `)
              .eq('id', membership.group_id)
              .single();

            // If current user is the group creator, send notification
            if (group && group.creator_id === session.user.id) {
              const { data: newMember } = await supabase
                .from('users')
                .select('name, username')
                .eq('id', membership.user_id)
                .single();

              const memberName = (newMember as any)?.name || (newMember as any)?.username || 'Someone';
              
              addNotification({
                type: 'group_join',
                title: `👥 New member joined ${group.name}!`,
                message: `${memberName} just joined your group. You now have ${group.member_count + 1} members.`,
                data: { 
                  group_id: membership.group_id,
                  member_name: memberName,
                  member_count: group.member_count + 1
                },
                urgent: false,
                action_url: `/(protected)/groups/${membership.group_id}`,
                icon: '👥',
                expires_at: addDays(new Date(), 5).toISOString(),
              });
            }
          }
        }
      )
      .subscribe();

    // NEW: Subscribe to new posts in user's groups
    const postsChannel = supabase
      .channel('notifications-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        async (payload) => {
          const post = payload.new as any;
          
          // Only notify if post is not from current user and is in a group
          if (post.author_id !== session.user.id && 
              post.group_id && 
              preferences.group_updates) {
            
            // Check if current user is a member of this group
            const { data: membership } = await supabase
              .from('group_members')
              .select('id')
              .eq('group_id', post.group_id)
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .single();

            if (membership) {
              const { data: groupAndAuthor } = await supabase
                .from('posts')
                .select(`
                  title,
                  group:groups!posts_group_id_fkey(name),
                  author:users!posts_author_id_fkey(name, username)
                `)
                .eq('id', post.id)
                .single();

              if (groupAndAuthor) {
                const authorName = (groupAndAuthor.author as any)?.name || (groupAndAuthor.author as any)?.username || 'Someone';
                const groupName = (groupAndAuthor.group as any)?.name || 'Unknown Group';
                
                addNotification({
                  type: 'group_update',
                  title: `📝 New post in ${groupName}`,
                  message: `${authorName} posted: "${post.title}"`,
                  data: { 
                    post_id: post.id,
                    group_name: groupName,
                    author_name: authorName 
                  },
                  urgent: false,
                  action_url: `/(protected)/post/${post.id}`,
                  icon: '📝',
                  expires_at: addDays(new Date(), 5).toISOString(),
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 [Notifications] Cleaning up realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(repliesChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(groupMembersChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [session?.user?.id, preferences, addNotification]);

  // Periodic checks
  useEffect(() => {
    if (!session?.user?.id) return;

    // Check for reminders every 30 minutes
    const reminderInterval = setInterval(() => {
      refreshNotifications();
    }, 30 * 60 * 1000); // 30 minutes

    // Initial check after 10 seconds
    const initialTimeout = setTimeout(() => {
      refreshNotifications();
    }, 10000);

    return () => {
      clearInterval(reminderInterval);
      clearTimeout(initialTimeout);
    };
  }, [session?.user?.id, refreshNotifications]);

  // Save notifications whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications);
    }
  }, [notifications, saveNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearExpiredNotifications,
    updatePreferences,
    refreshNotifications,
    checkPlantReminders,
    checkWeatherAlerts,
    checkMarketplaceUpdates,
    checkCommunityUpdates,
    isInQuietHours,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};