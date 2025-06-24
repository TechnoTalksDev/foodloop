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
  community_updates: false,
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
      console.error('Error checking marketplace updates:', error);
    }
  }, [session?.user?.id, preferences.marketplace_updates, addNotification]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    clearExpiredNotifications();
    await Promise.all([
      checkPlantReminders(),
      checkWeatherAlerts(),
      checkMarketplaceUpdates(),
    ]);
  }, [clearExpiredNotifications, checkPlantReminders, checkWeatherAlerts, checkMarketplaceUpdates]);

  // Set up realtime subscriptions for messages
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
                buyer:buyer_id(name, username),
                seller:seller_id(name, username),
                product:product_id(name)
              `)
              .eq('id', message.conversation_id)
              .single();

            if (conversation && 
                (conversation.buyer_id === session.user.id || conversation.seller_id === session.user.id)) {
              
              const otherUser = conversation.buyer_id === session.user.id 
                ? conversation.seller 
                : conversation.buyer;
              
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

    return () => {
      console.log('🧹 [Notifications] Cleaning up realtime subscriptions');
      supabase.removeChannel(messagesChannel);
    };
  }, [session?.user?.id, addNotification]);

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
    isInQuietHours,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};