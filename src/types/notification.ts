/**
 * FairWork Setu - Smart Cross-Platform Notification Types
 * Defines data structures for categories, tones, in-app notifications,
 * scheduling preferences, and cross-platform push delivery.
 */

export type NotificationCategory = 'money' | 'work' | 'health' | 'skills' | 'rights';

export type NotificationTone =
  | 'playful'       // Swiggy/Zomato style - witty, energetic, Indian cultural idioms
  | 'caring'        // Warm, supportive, empathetic, protective
  | 'witty'         // Clever, quick, encouraging, lighthearted
  | 'motivational'  // Inspiring, ambitious, progress-focused
  | 'professional'; // Clear, direct, structured, ledger-focused

export type NotificationLanguage = 'en' | 'hi' | 'mr';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  actionType?: 'navigate' | 'dismiss' | 'open_modal';
}

export interface InAppNotification {
  id: string;
  category: NotificationCategory;
  tone: NotificationTone;
  title: string;
  body: string;
  timestamp: string; // ISO 8601
  read: boolean;
  dismissed: boolean;
  deepLink: string;
  actionLabel?: string;
  priority?: NotificationPriority;
  metadata?: {
    sourceEvent: string;
    dedupKey: string;
    jobId?: string;
    bookingId?: string;
    amount?: number;
    skillName?: string;
    isSensitive?: boolean;
  };
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:MM in 24h format, e.g. "22:00"
  end: string;   // HH:MM in 24h format, e.g. "07:00"
}

export interface NotificationSchedulesConfig {
  expenseReminderTime: string;      // e.g. "20:00"
  expenseReminderEnabled: boolean;
  hydrationIntervalHours: number;   // e.g. 2 (0 = disabled)
  hydrationEnabled: boolean;
  savingsProgressWeekly: boolean;
  profileCompletionNudge: boolean;
}

export interface NotificationChannelsConfig {
  inApp: boolean;
  browserPush: boolean;
  nativeAndroid: boolean;
  sound: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  masterPauseUntil: string | null; // ISO date string or null
  categories: {
    money: boolean;
    work: boolean;
    health: boolean;
    skills: boolean;
    rights: boolean;
  };
  preferredTone: NotificationTone;
  preferredLanguage: NotificationLanguage;
  quietHours: QuietHoursConfig;
  schedules: NotificationSchedulesConfig;
  channels: NotificationChannelsConfig;
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  tone: NotificationTone;
  title: Record<NotificationLanguage, string>;
  body: Record<NotificationLanguage, string>;
  actionLabel: Record<NotificationLanguage, string>;
  deepLink: string;
  requiresRealEvent?: boolean;
  dedupKeyPrefix: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  masterPauseUntil: null,
  categories: {
    money: true,
    work: true,
    health: true,
    skills: true,
    rights: true,
  },
  preferredTone: 'playful',
  preferredLanguage: 'en',
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
  schedules: {
    expenseReminderTime: '20:00',
    expenseReminderEnabled: true,
    hydrationIntervalHours: 2,
    hydrationEnabled: true,
    savingsProgressWeekly: true,
    profileCompletionNudge: true,
  },
  channels: {
    inApp: true,
    browserPush: true,
    nativeAndroid: true,
    sound: true,
  },
};
