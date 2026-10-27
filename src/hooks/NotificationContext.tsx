/**
 * FairWork Setu - React Notification Context & Hook
 * Provides reactive access to in-app notification list, unread badge counter,
 * preference controls, test trigger actions, and drawer visibility.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  InAppNotification,
  NotificationCategory,
  NotificationPreferences,
  NotificationTone,
} from '../types/notification';
import {
  getStoredNotifications,
  saveNotifications,
  getStoredPreferences,
  savePreferences,
  syncNotificationPreferencesWithCloud,
  getBrowserPermissionStatus,
  requestBrowserPermission as reqBrowserPerm,
  registerServiceWorker,
  createAndDispatchNotification,
  isAndroidNative,
  isBrowserPushSupported,
} from '../services/notificationService';
import { selectNotificationTemplate } from '../services/notificationTemplates';
import { notificationScheduler } from '../services/notificationScheduler';

interface NotificationContextValue {
  notifications: InAppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  browserPermission: NotificationPermission | 'unsupported';
  isNativeAndroid: boolean;
  isPushSupported: boolean;
  isCenterOpen: boolean;
  openCenter: () => void;
  closeCenter: () => void;
  updatePreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  triggerTestNotification: (
    category?: NotificationCategory,
    tone?: NotificationTone
  ) => Promise<InAppNotification | null>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>(() =>
    getStoredNotifications()
  );
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    getStoredPreferences()
  );
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(
    () => getBrowserPermissionStatus()
  );
  const [isCenterOpen, setIsCenterOpen] = useState(false);

  // Initialize Service Worker, background scheduler, and permission checks
  useEffect(() => {
    // 1. Register Service Worker on client mount
    registerServiceWorker();

    // 2. Start Smart Notification Scheduler
    notificationScheduler.start();

    // 3. Sync preferences with cloud if authenticated
    syncNotificationPreferencesWithCloud().then((synced) => {
      setPreferences(synced);
    }).catch(() => {});

    // 4. Update permission state
    setBrowserPermission(getBrowserPermissionStatus());

    // 4. Listen for real-time notification dispatch events
    const handleNotificationReceived = (e: Event) => {
      const customEvent = e as CustomEvent<InAppNotification>;
      if (customEvent.detail) {
        setNotifications((prev) => [customEvent.detail, ...prev.filter((n) => n.id !== customEvent.detail.id)]);
      }
    };

    window.addEventListener('setu:notification-received', handleNotificationReceived);

    return () => {
      notificationScheduler.stop();
      window.removeEventListener('setu:notification-received', handleNotificationReceived);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read && !n.dismissed).length;
  }, [notifications]);

  const openCenter = useCallback(() => setIsCenterOpen(true), []);
  const closeCenter = useCallback(() => setIsCenterOpen(false), []);

  const updatePreferences = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      setPreferences((prev) => {
        const next: NotificationPreferences = {
          ...prev,
          ...patch,
          categories: {
            ...prev.categories,
            ...(patch.categories || {}),
          },
          quietHours: {
            ...prev.quietHours,
            ...(patch.quietHours || {}),
          },
          schedules: {
            ...prev.schedules,
            ...(patch.schedules || {}),
          },
          channels: {
            ...prev.channels,
            ...(patch.channels || {}),
          },
        };
        savePreferences(next);
        return next;
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(next);
      return next;
    });
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveNotifications(next);
      return next;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  const requestPermission = useCallback(async () => {
    const res = await reqBrowserPerm();
    setBrowserPermission(res);
    return res;
  }, []);

  /**
   * Generates an instant test notification for testing & user demo across any category and tone.
   */
  const triggerTestNotification = useCallback(
    async (
      category: NotificationCategory = 'money',
      tone?: NotificationTone
    ): Promise<InAppNotification | null> => {
      const activeTone = tone || preferences.preferredTone;
      const lang = preferences.preferredLanguage || 'en';

      let userName = 'Ramesh';
      try {
        const pRaw = localStorage.getItem('@setu/profile');
        if (pRaw) userName = JSON.parse(pRaw).name || 'Ramesh';
      } catch {
        // ignore
      }

      const template = selectNotificationTemplate(category, activeTone, lang, {
        name: userName,
        trade: 'Delivery Partner',
        amount: '250',
        skillName: 'Electrical Repair',
        locality: 'Pune Station',
      });

      const notif = await createAndDispatchNotification({
        category,
        title: template.title,
        body: template.body,
        deepLink: template.deepLink,
        tone: activeTone,
        actionLabel: template.actionLabel,
        priority: 'high',
        skipCooldown: true, // Always allow user-initiated test trigger
        metadata: {
          sourceEvent: 'manual_test_trigger',
          dedupKey: `test_${category}_${Date.now()}`,
        },
      });

      return notif;
    },
    [preferences]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      preferences,
      browserPermission,
      isNativeAndroid: isAndroidNative(),
      isPushSupported: isBrowserPushSupported(),
      isCenterOpen,
      openCenter,
      closeCenter,
      updatePreferences,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAllNotifications,
      requestPermission,
      triggerTestNotification,
    }),
    [
      notifications,
      unreadCount,
      preferences,
      browserPermission,
      isCenterOpen,
      openCenter,
      closeCenter,
      updatePreferences,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAllNotifications,
      requestPermission,
      triggerTestNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
