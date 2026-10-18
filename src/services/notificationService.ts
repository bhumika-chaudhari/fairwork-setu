/**
 * FairWork Setu - Cross-Platform Smart Notification Engine
 * Manages in-app notifications, browser Web Push / Notification API,
 * Android APK native bridge dispatch, quiet hours, cooldowns, and deduplication.
 */

import type {
  InAppNotification,
  NotificationCategory,
  NotificationPreferences,
  NotificationPriority,
} from '../types/notification';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';

const STORAGE_NOTIFICATIONS_KEY = '@setu/notifications_v1';
const STORAGE_PREFERENCES_KEY = '@setu/notification_prefs_v1';
const STORAGE_DEDUP_LOG_KEY = '@setu/notification_dedup_log_v1';
const MAX_STORED_NOTIFICATIONS = 50;

// Type definition for optional native Android JavaScriptInterface bridge
interface AndroidNotificationBridge {
  showNotification?: (
    title: string,
    body: string,
    channelId: string,
    deepLinkUrl: string
  ) => void;
  scheduleReminder?: (
    id: string,
    title: string,
    body: string,
    triggerEpochMs: number,
    channelId: string,
    deepLinkUrl: string
  ) => void;
  cancelReminder?: (id: string) => void;
  isPermissionGranted?: () => boolean;
}

// ---------------------------------------------------------------------------
// 1. PREFERENCES & CONFIGURATION
// ---------------------------------------------------------------------------

export function getStoredPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      categories: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
        ...(parsed.categories || {}),
      },
      quietHours: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
        ...(parsed.quietHours || {}),
      },
      schedules: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.schedules,
        ...(parsed.schedules || {}),
      },
      channels: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.channels,
        ...(parsed.channels || {}),
      },
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save notification preferences', err);
  }
}

// ---------------------------------------------------------------------------
// 2. IN-APP NOTIFICATIONS STORAGE
// ---------------------------------------------------------------------------

export function getStoredNotifications(): InAppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNotifications(list: InAppNotification[]): void {
  try {
    const trimmed = list.slice(0, MAX_STORED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Failed to save notifications', err);
  }
}

// ---------------------------------------------------------------------------
// 3. QUIET HOURS & MASTER SNOOZE LOGIC
// ---------------------------------------------------------------------------

export function isMasterPaused(prefs?: NotificationPreferences): boolean {
  const p = prefs || getStoredPreferences();
  if (!p.masterPauseUntil) return false;
  try {
    const pauseExpiry = new Date(p.masterPauseUntil).getTime();
    return Date.now() < pauseExpiry;
  } catch {
    return false;
  }
}

export function isQuietHoursActive(prefs?: NotificationPreferences): boolean {
  const p = prefs || getStoredPreferences();
  if (!p.quietHours?.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = p.quietHours.start.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = p.quietHours.end.split(':').map((v) => parseInt(v, 10) || 0);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Normal window: e.g. 13:00 to 15:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight window: e.g. 22:00 to 07:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// ---------------------------------------------------------------------------
// 4. DEDUPLICATION & COOLDOWN CONTROLS
// ---------------------------------------------------------------------------

function getDedupLog(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_DEDUP_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordTriggerTimestamp(dedupKey: string): void {
  try {
    const log = getDedupLog();
    log[dedupKey] = Date.now();
    localStorage.setItem(STORAGE_DEDUP_LOG_KEY, JSON.stringify(log));
  } catch {
    // ignore
  }
}

export function getLastTriggerTimestamp(dedupKey: string): number | null {
  const log = getDedupLog();
  return log[dedupKey] || null;
}

export function canDeliverNotification(
  category: NotificationCategory,
  dedupKey: string,
  cooldownHours = 12
): { allowed: boolean; reason?: string } {
  const prefs = getStoredPreferences();

  // 1. Master toggle check
  if (!prefs.enabled) {
    return { allowed: false, reason: 'Notifications globally disabled by worker.' };
  }

  // 2. Master pause/snooze check
  if (isMasterPaused(prefs)) {
    return { allowed: false, reason: 'Notifications currently snoozed/paused.' };
  }

  // 3. Category preference check
  if (!prefs.categories[category]) {
    return { allowed: false, reason: `Category '${category}' disabled in preferences.` };
  }

  // 4. Deduplication cooldown check
  const lastTriggered = getLastTriggerTimestamp(dedupKey);
  if (lastTriggered) {
    const elapsedHours = (Date.now() - lastTriggered) / (1000 * 60 * 60);
    if (elapsedHours < cooldownHours) {
      return {
        allowed: false,
        reason: `Suppressed by cooldown (${elapsedHours.toFixed(1)}h < ${cooldownHours}h).`,
      };
    }
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// 5. CROSS-PLATFORM DISPATCH (WEB, PWA, ANDROID APK)
// ---------------------------------------------------------------------------

export function isAndroidNative(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    AndroidNotificationBridge?: AndroidNotificationBridge;
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return Boolean(
    win.AndroidNotificationBridge ||
    (win.Capacitor && typeof win.Capacitor.isNativePlatform === 'function' && win.Capacitor.isNativePlatform())
  );
}

export function isBrowserPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getBrowserPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowserPushSupported()) return 'unsupported';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.error('Error requesting notification permission', err);
    return 'denied';
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.info('Service Worker registration skipped or failed', err);
    return null;
  }
}

/**
 * Creates and registers a new notification.
 * 1. Checks category preference, quiet hours, and dedup cooldown.
 * 2. Saves to In-App Notification Center.
 * 3. Dispatches to Android Native Bridge or Web Notification API.
 */
export async function createAndDispatchNotification(payload: {
  category: NotificationCategory;
  title: string;
  body: string;
  deepLink: string;
  tone?: InAppNotification['tone'];
  actionLabel?: string;
  priority?: NotificationPriority;
  metadata?: InAppNotification['metadata'];
  cooldownHours?: number;
  skipCooldown?: boolean;
}): Promise<InAppNotification | null> {
  const prefs = getStoredPreferences();
  const dedupKey = payload.metadata?.dedupKey || `${payload.category}_${Date.now()}`;

  // Cooldown & preference filter
  if (!payload.skipCooldown) {
    const check = canDeliverNotification(payload.category, dedupKey, payload.cooldownHours ?? 12);
    if (!check.allowed) {
      console.info(`[Setu Notifications] Filtered: ${check.reason}`);
      return null;
    }
  }

  const notification: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    category: payload.category,
    tone: payload.tone || prefs.preferredTone,
    title: payload.title,
    body: payload.body,
    timestamp: new Date().toISOString(),
    read: false,
    dismissed: false,
    deepLink: payload.deepLink,
    actionLabel: payload.actionLabel,
    priority: payload.priority || 'normal',
    metadata: {
      ...payload.metadata,
      sourceEvent: payload.metadata?.sourceEvent || 'local_event',
      dedupKey,
    },
  };

  // 1. Save to in-app notification store
  const existing = getStoredNotifications();
  const updated = [notification, ...existing];
  saveNotifications(updated);
  recordTriggerTimestamp(dedupKey);

  // 2. Check Quiet Hours
  const quietActive = isQuietHoursActive(prefs);

  // 3. Dispatch to Operating System (Android APK or Browser) unless quiet hours active
  if (!quietActive && prefs.channels.browserPush) {
    try {
      await dispatchSystemNotification(notification);
    } catch (err) {
      console.warn('System notification delivery failed (in-app fallback preserved):', err);
    }
  }

  // 4. Emit custom DOM event so React components can update immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('setu:notification-received', { detail: notification }));
  }

  return notification;
}

/**
 * Dispatches notification to Android Native Bridge or Web Notification API
 */
async function dispatchSystemNotification(notif: InAppNotification): Promise<void> {
  if (typeof window === 'undefined') return;

  const win = window as unknown as {
    AndroidNotificationBridge?: AndroidNotificationBridge;
  };

  // A. Native Android APK Bridge
  if (win.AndroidNotificationBridge?.showNotification) {
    win.AndroidNotificationBridge.showNotification(
      notif.title,
      notif.body,
      `channel_${notif.category}`,
      notif.deepLink
    );
    return;
  }

  // B. Web Notification API via Service Worker or Desktop Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).showNotification(notif.title, {
          body: notif.body,
          icon: '/android-chrome-192x192.png',
          badge: '/notification-badge-72x72.png',
          tag: notif.metadata?.dedupKey || notif.id,
          data: { url: notif.deepLink },
          vibrate: [100, 50, 100],
        });
        return;
      } catch {
        // fallback to standard Notification constructor
      }
    }

    try {
      const n = new Notification(notif.title, {
        body: notif.body,
        icon: '/android-chrome-192x192.png',
        tag: notif.metadata?.dedupKey || notif.id,
        data: { url: notif.deepLink },
      });
      n.onclick = () => {
        window.focus();
        window.location.href = notif.deepLink;
        n.close();
      };
    } catch {
      // ignore
    }
  }
}
