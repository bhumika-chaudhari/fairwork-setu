/**
 * FairWork Setu - Smart Event-Driven Notification Scheduler
 * Monitors application events, model outputs, schedules, and user completion states.
 * Suppresses redundant reminders when actions are completed and enforces quiet hours.
 */

import {
  getStoredPreferences,
  createAndDispatchNotification,
  recordTriggerTimestamp,
  getLastTriggerTimestamp,
} from './notificationService';
import { selectNotificationTemplate } from './notificationTemplates';
import type { ProfileState } from '../hooks/ProfileContext';
import type { FinancialSummary } from '../types/transaction';
import { matchJobsWithWorker } from './aiModelsClient';
import { fetchBookings } from './marketplaceService';

class NotificationScheduler {
  private timer: number | null = null;
  private isRunning = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run first evaluation shortly after startup (3 seconds)
    setTimeout(() => {
      this.evaluateAllTriggers();
    }, 3000);

    // Periodically evaluate every 5 minutes
    this.timer = window.setInterval(() => {
      this.evaluateAllTriggers();
    }, 5 * 60 * 1000);

    // Also evaluate when browser tab regains focus or visibility
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.evaluateAllTriggers();
        }
      });
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  /**
   * Main evaluation loop: checks schedules and real application events.
   */
  public async evaluateAllTriggers() {
    const prefs = getStoredPreferences();
    if (!prefs.enabled) return;

    const workerProfile = this.getProfile();
    const financialSummary = this.getFinancialSummary();

    // 1. Check Evening Expense Tracking Reminder (Money)
    await this.checkExpenseReminder(prefs, financialSummary, workerProfile);

    // 2. Check Hydration & Wellness Reminder (Health)
    await this.checkHydrationReminder(prefs, workerProfile);

    // 3. Check Profile Completion Nudge (Work/Profile)
    await this.checkProfileCompletion(prefs, workerProfile);

    // 4. Check Real Customer Bookings (Work)
    await this.checkCustomerBookings(prefs, workerProfile);

    // 5. Check High-Match Jobs from Model 6 (Work)
    await this.checkJobMatches(prefs, workerProfile);
  }

  // -------------------------------------------------------------------------
  // TRIGGER 1: DAILY EXPENSE REMINDER (MONEY)
  // -------------------------------------------------------------------------
  private async checkExpenseReminder(
    prefs: ReturnType<typeof getStoredPreferences>,
    summary: FinancialSummary | null,
    profile: ProfileState | null
  ) {
    if (!prefs.categories.money || !prefs.schedules.expenseReminderEnabled) return;

    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    const dedupKey = `expense_reminder_${todayDateStr}`;

    // Completed Action Suppression: If worker already logged today's expenses, SUPPRESS!
    if (summary && (summary.todayExpense > 0 || summary.todayIncome > 0)) {
      return;
    }

    // Check scheduled hour (e.g. 20:00)
    const [targetHour, targetMinute] = (prefs.schedules.expenseReminderTime || '20:00')
      .split(':')
      .map((v) => parseInt(v, 10) || 0);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = targetHour * 60 + targetMinute;

    // Trigger window: within 2 hours after scheduled reminder time
    if (currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + 120) {
      const template = selectNotificationTemplate(
        'money',
        prefs.preferredTone,
        prefs.preferredLanguage,
        { name: profile?.name || 'Boss' }
      );

      await createAndDispatchNotification({
        category: 'money',
        title: template.title,
        body: template.body,
        deepLink: template.deepLink,
        tone: prefs.preferredTone,
        actionLabel: template.actionLabel,
        metadata: {
          sourceEvent: 'schedule_daily_expense',
          dedupKey,
        },
        cooldownHours: 18,
      });
    }
  }

  // -------------------------------------------------------------------------
  // TRIGGER 2: HYDRATION & HEAT ADVISORY (HEALTH)
  // -------------------------------------------------------------------------
  private async checkHydrationReminder(
    prefs: ReturnType<typeof getStoredPreferences>,
    profile: ProfileState | null
  ) {
    if (!prefs.categories.health || !prefs.schedules.hydrationEnabled) return;

    const intervalHours = prefs.schedules.hydrationIntervalHours || 2;
    if (intervalHours <= 0) return;

    const now = new Date();
    const currentHour = now.getHours();

    // Only during typical gig work hours (9 AM to 7 PM)
    if (currentHour < 9 || currentHour > 19) return;

    const todayDateStr = now.toISOString().split('T')[0];
    const slotIndex = Math.floor(currentHour / intervalHours);
    const dedupKey = `hydration_reminder_${todayDateStr}_slot_${slotIndex}`;

    const lastTrigger = getLastTriggerTimestamp(dedupKey);
    if (lastTrigger) return;

    const template = selectNotificationTemplate(
      'health',
      prefs.preferredTone,
      prefs.preferredLanguage,
      { name: profile?.name || 'Boss' }
    );

    await createAndDispatchNotification({
      category: 'health',
      title: template.title,
      body: template.body,
      deepLink: template.deepLink,
      tone: prefs.preferredTone,
      actionLabel: template.actionLabel,
      metadata: {
        sourceEvent: 'schedule_hydration',
        dedupKey,
      },
      cooldownHours: intervalHours - 0.2,
    });
  }

  // -------------------------------------------------------------------------
  // TRIGGER 3: PROFILE COMPLETION NUDGE (WORK/PROFILE)
  // -------------------------------------------------------------------------
  private async checkProfileCompletion(
    prefs: ReturnType<typeof getStoredPreferences>,
    profile: ProfileState | null
  ) {
    if (!prefs.schedules.profileCompletionNudge || !profile) return;

    // Compute basic profile strength
    const checks = [
      profile.name.trim().length > 1,
      !!profile.cityKey,
      !!profile.workType,
      (profile.skillKeys?.length || 0) + (profile.customSkills?.length || 0) >= 2,
      (profile.experienceYears || 0) > 0,
      profile.emergencyContact?.trim().length >= 8,
    ];
    const strength = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    // Only if profile is incomplete (< 80%)
    if (strength >= 80) return;

    const dedupKey = 'profile_completion_reminder';
    const lastTrigger = getLastTriggerTimestamp(dedupKey);
    if (lastTrigger && (Date.now() - lastTrigger) / (1000 * 60 * 60) < 48) {
      return;
    }

    const titles: Record<string, string> = {
      en: 'Setu Profile • Complete Your Profile 🚀',
      hi: 'सेतू प्रोफ़ाइल • अपनी प्रोफ़ाइल पूरी करें 🚀',
      mr: 'सेतू प्रोफाईल • तुमची प्रोफाईल पूर्ण करा 🚀',
    };
    const bodies: Record<string, string> = {
      en: `${profile.name}, your profile is ${strength}% complete. Add your skills to get 90%+ match accuracy!`,
      hi: `${profile.name}, आपकी प्रोफ़ाइल ${strength}% तैयार है। 90%+ मैचिंग जॉब्स पाने के लिए अपने हुनर जोड़ें!`,
      mr: `${profile.name}, तुमची प्रोफाईल ${strength}% पूर्ण आहे. अचूक कामे मिळवण्यासाठी कौशल्ये जोडा!`,
    };
    const actions: Record<string, string> = {
      en: 'Complete Profile',
      hi: 'प्रोफ़ाइल पूरी करें',
      mr: 'प्रोफाईल पूर्ण करा',
    };

    const lang = prefs.preferredLanguage || 'en';

    await createAndDispatchNotification({
      category: 'work',
      title: titles[lang] || titles.en,
      body: bodies[lang] || bodies.en,
      deepLink: '/profile',
      tone: prefs.preferredTone,
      actionLabel: actions[lang] || actions.en,
      metadata: {
        sourceEvent: 'profile_incomplete',
        dedupKey,
      },
      cooldownHours: 48,
    });
  }

  // -------------------------------------------------------------------------
  // TRIGGER 4: REAL CUSTOMER BOOKINGS (WORK)
  // -------------------------------------------------------------------------
  private async checkCustomerBookings(
    prefs: ReturnType<typeof getStoredPreferences>,
    profile: ProfileState | null
  ) {
    if (!prefs.categories.work || !profile) return;

    try {
      const bookings = await fetchBookings({ workerId: 'usr-ramesh-kumar' });
      const pendingBookings = bookings.filter((b) => b.status === 'requested');

      for (const booking of pendingBookings.slice(0, 2)) {
        const dedupKey = `customer_booking_${booking.id}`;
        const template = selectNotificationTemplate(
          'work',
          prefs.preferredTone,
          prefs.preferredLanguage,
          {
            name: profile.name,
            trade: booking.serviceCategory || 'Service',
            locality: booking.locality || 'nearby',
          }
        );

        await createAndDispatchNotification({
          category: 'work',
          title: template.title,
          body: template.body,
          deepLink: `/kaam?tab=requests&id=${booking.id}`,
          tone: prefs.preferredTone,
          actionLabel: template.actionLabel,
          metadata: {
            sourceEvent: 'customer_booking_received',
            dedupKey,
            bookingId: booking.id,
          },
          cooldownHours: 72,
        });
      }
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // TRIGGER 5: HIGH MATCH JOBS FROM MODEL 6 (WORK)
  // -------------------------------------------------------------------------
  private async checkJobMatches(
    prefs: ReturnType<typeof getStoredPreferences>,
    profile: ProfileState | null
  ) {
    if (!prefs.categories.work || !profile) return;

    // Only notify once per 24 hours about matching jobs
    const dedupKey = `job_match_nudge_${new Date().toISOString().split('T')[0]}`;
    if (getLastTriggerTimestamp(dedupKey)) return;

    try {
      const matched = await matchJobsWithWorker(
        {
          skills: [...(profile.skillKeys || []), ...(profile.customSkills || [])],
          trade: profile.workType,
          location: 'Pune',
        },
        3
      );

      const topMatch = matched[0];
      if (topMatch && (topMatch.match_percentage >= 70 || (topMatch.similarity_score && topMatch.similarity_score > 0.05))) {
        const template = selectNotificationTemplate(
          'work',
          prefs.preferredTone,
          prefs.preferredLanguage,
          {
            name: profile.name,
            trade: topMatch.title || 'Specialized Work',
          }
        );

        await createAndDispatchNotification({
          category: 'work',
          title: template.title,
          body: template.body,
          deepLink: `/kaam?tab=jobs&id=${topMatch.job_id}`,
          tone: prefs.preferredTone,
          actionLabel: template.actionLabel,
          metadata: {
            sourceEvent: 'job_match_available',
            dedupKey,
            jobId: topMatch.job_id,
          },
          cooldownHours: 24,
        });
      }
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------
  private getProfile(): ProfileState | null {
    try {
      const raw = localStorage.getItem('@setu/profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getFinancialSummary(): FinancialSummary | null {
    try {
      const raw = localStorage.getItem('setu_financial_summary');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
