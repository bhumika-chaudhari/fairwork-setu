/**
 * FairWork Setu - Notification Settings Section
 * Full preference management for Profile & Settings page:
 * - Master toggle & 24h snooze
 * - Browser/Native permission status & requests
 * - 5 category switches with personality samples
 * - Tone selector (Playful, Caring, Witty, Motivational, Professional)
 * - Language selector (English, Hindi, Marathi)
 * - Quiet hours & reminder schedules
 * - Live test trigger for every category
 */

import React, { useState } from 'react';
import Card from '../Card';
import { AppIcon } from '../../lib/icons';
import { useNotifications } from '../../hooks/NotificationContext';
import type {
  NotificationCategory,
  NotificationTone,
  NotificationLanguage,
} from '../../types/notification';
import { playTap, playPop } from '../../lib/feedback';

const TONES: { id: NotificationTone; name: string; tag: string; description: string }[] = [
  {
    id: 'playful',
    name: 'Playful (Swiggy / Zomato style)',
    tag: 'Recommended',
    description: 'Energetic, humorous, culturally relatable Hindi/English informal worker nudges.',
  },
  {
    id: 'caring',
    name: 'Caring & Supportive',
    tag: 'Warm',
    description: 'Empathetic, human-centric, health and rest reminders without preachiness.',
  },
  {
    id: 'witty',
    name: 'Witty & Sharp',
    tag: 'Fun',
    description: 'Clever, lighthearted, quick financial tips that make you smile.',
  },
  {
    id: 'motivational',
    name: 'Motivational & Ambitious',
    tag: 'Growth',
    description: 'Inspiring career milestone and savings goal unlock prompts.',
  },
  {
    id: 'professional',
    name: 'Professional & Direct',
    tag: 'Standard',
    description: 'Structured ledger updates, statutory rights codes, and factual notices.',
  },
];

const CATEGORIES: {
  id: NotificationCategory;
  title: string;
  sub: string;
  icon: string;
  sample: string;
}[] = [
  {
    id: 'money',
    title: 'Money • Financial Nudges',
    sub: 'Daily expense ledger check-in, savings goal progress, and weekly balance forecasts.',
    icon: 'wallet',
    sample: '“Paisa aaya, par gaya kahan? 👀 Aaj ka kharcha add kar do!”',
  },
  {
    id: 'work',
    title: 'Work • Opportunity Buddy',
    sub: 'Real Model 6 job matches, incoming customer service requests, and application updates.',
    icon: 'briefcase',
    sample: '“Oye! 👀 Aapke skills se match karta ek naya kaam mila hai.”',
  },
  {
    id: 'health',
    title: 'Health • Caring Guidance',
    sub: 'Hydration reminders during outdoor work, heat advisories, and Ayushman PM-JAY clinics.',
    icon: 'heart',
    sample: '“Boss, paani piya ya bas kaam hi kaam? 💧 Thoda break lo!”',
  },
  {
    id: 'skills',
    title: 'Skills • Tiny Motivation',
    sub: '5-minute microlearning tips, PMKVY certifications, and skill passport milestones.',
    icon: 'sparkles',
    sample: '“Aaj 5 minute kuch naya seekhein? Future wala aap khush hoga. ✨”',
  },
  {
    id: 'rights',
    title: 'Rights • Personal Advocate',
    sub: 'Code on Social Security 2020 updates, grievance tracking, and deactivation guidance.',
    icon: 'shield-checkmark',
    sample: '“Apne haq jaanna bhi zaroori hai, boss. 💪 Jaankari paas rakhein.”',
  },
];

export default function NotificationSettingsSection() {
  const {
    preferences,
    updatePreferences,
    browserPermission,
    requestPermission,
    triggerTestNotification,
    isNativeAndroid,
    isPushSupported,
  } = useNotifications();

  const [testingCategory, setTestingCategory] = useState<NotificationCategory | null>(null);
  const [testSentMsg, setTestSentMsg] = useState('');

  const handleTestTrigger = async (category: NotificationCategory) => {
    setTestingCategory(category);
    playPop();
    const notif = await triggerTestNotification(category);
    if (notif) {
      setTestSentMsg(`Sent test notification: "${notif.title}"`);
      setTimeout(() => setTestSentMsg(''), 4000);
    }
    setTestingCategory(null);
  };

  const isPaused = Boolean(
    preferences.masterPauseUntil &&
      new Date(preferences.masterPauseUntil).getTime() > Date.now()
  );

  const handleTogglePause = async () => {
    playTap();
    if (isPaused) {
      await updatePreferences({ masterPauseUntil: null });
    } else {
      // Pause for next 24 hours
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await updatePreferences({ masterPauseUntil: tomorrow });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Master Toggle & Snooze Control Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-softBorder pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-warmCocoa">Smart Notifications</h3>
            <p className="text-xs text-textMuted">
              Playful, context-aware reminders for money, gigs, health, and worker rights.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playTap();
              updatePreferences({ enabled: !preferences.enabled });
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              preferences.enabled ? 'bg-[#B34A26]' : 'bg-stone-300'
            }`}
            role="switch"
            aria-checked={preferences.enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 24-Hour Snooze Option */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-warmCream/40 border border-softBorder">
          <div>
            <span className="text-xs font-bold text-warmCocoa block">
              Pause All Notifications for 24 Hours
            </span>
            <span className="text-[11px] text-textSecondary">
              {isPaused
                ? 'Active: All alerts muted until tomorrow.'
                : 'Mutes all reminders and background alerts for 24 hours when you need uninterrupted rest.'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isPaused
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {isPaused ? 'Resume Now' : 'Pause 24h'}
          </button>
        </div>

        {/* Browser / Native Permission Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${
                browserPermission === 'granted'
                  ? 'bg-emerald-600'
                  : browserPermission === 'denied'
                  ? 'bg-rose-600'
                  : 'bg-amber-600'
              }`}
            >
              <AppIcon
                name={
                  browserPermission === 'granted'
                    ? 'bell-ring'
                    : browserPermission === 'denied'
                    ? 'bell-off'
                    : 'notifications'
                }
                size={16}
              />
            </div>
            <div>
              <span className="text-xs font-extrabold text-stone-800 block">
                {isNativeAndroid
                  ? 'Android APK Notification Engine'
                  : 'Browser & PWA Push Notifications'}
              </span>
              <span className="text-[11px] text-stone-500">
                Status:{' '}
                <strong
                  className={
                    browserPermission === 'granted'
                      ? 'text-emerald-700'
                      : browserPermission === 'denied'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }
                >
                  {browserPermission === 'granted'
                    ? 'Enabled (Permitted)'
                    : browserPermission === 'denied'
                    ? 'Blocked in Browser Settings'
                    : 'Permission Not Requested Yet'}
                </strong>
              </span>
            </div>
          </div>

          {browserPermission !== 'granted' && isPushSupported && (
            <button
              type="button"
              onClick={async () => {
                playTap();
                await requestPermission();
              }}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>

        {testSentMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <AppIcon name="checkmark-circle" size={14} />
            <span>{testSentMsg}</span>
          </div>
        )}
      </Card>

      {/* 2. Notification Personality & Tone Picker */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-softBorder pb-2">
          <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
            Setu Personality & Tone
          </h3>
          <p className="text-[11px] text-textMuted mt-0.5">
            Choose how Setu speaks to you throughout the day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TONES.map((t) => {
            const isSelected = preferences.preferredTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playTap();
                  updatePreferences({ preferredTone: t.id });
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all active:scale-98 ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#FDF8F0] to-[#FAF1E4] border-[#B34A26] ring-1 ring-[#B34A26] shadow-sm'
                    : 'bg-white border-softBorder hover:border-[#F1B96B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-warmCocoa">{t.name}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#B34A26] text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {t.tag}
                  </span>
                </div>
                <p className="text-[11px] text-textSecondary leading-relaxed">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Preferred Notification Language */}
        <div className="pt-2 border-t border-softBorder">
          <label className="block text-xs font-bold text-warmCocoa mb-2">
            Preferred Notification Language
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English / Hinglish' },
              { id: 'hi', label: 'हिंदी (Hindi)' },
              { id: 'mr', label: 'मराठी (Marathi)' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  playTap();
                  updatePreferences({ preferredLanguage: lang.id as NotificationLanguage });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  preferences.preferredLanguage === lang.id
                    ? 'bg-[#B34A26] text-white shadow-xs'
                    : 'bg-warmCream/60 text-textSecondary border border-softBorder hover:bg-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 3. Category Switches with Live Test Buttons */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-softBorder pb-2">
          <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
            Notification Categories
          </h3>
          <p className="text-[11px] text-textMuted mt-0.5">
            Turn specific topics on or off and test how they appear on your device.
          </p>
        </div>

        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const isEnabled = preferences.categories[cat.id];
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl bg-warmCream/30 border border-softBorder flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-warmCocoa flex items-center gap-1.5">
                      <AppIcon name={cat.icon} size={14} className="text-[#B34A26]" />
                      <span>{cat.title}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary">{cat.sub}</p>
                  <p className="text-[11px] text-[#B34A26] font-medium italic">
                    Sample: {cat.sample}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    disabled={testingCategory === cat.id}
                    onClick={() => handleTestTrigger(cat.id)}
                    className="py-1 px-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                    title={`Send test ${cat.title} notification`}
                  >
                    {testingCategory === cat.id ? 'Sending...' : 'Test'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playTap();
                      updatePreferences({
                        categories: {
                          ...preferences.categories,
                          [cat.id]: !isEnabled,
                        },
                      });
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-[#B34A26]' : 'bg-stone-300'
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Schedules & Quiet Hours */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-softBorder pb-2">
          <h3 className="text-xs font-extrabold text-warmCocoa uppercase tracking-wider">
            Quiet Hours & Daily Schedules
          </h3>
          <p className="text-[11px] text-textMuted mt-0.5">
            Setu respects your rest. No loud sounds or popups during quiet hours.
          </p>
        </div>

        {/* Quiet Hours Window */}
        <div className="p-3.5 rounded-2xl bg-warmCream/40 border border-softBorder space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmCocoa">Enable Quiet Hours</span>
            <button
              type="button"
              onClick={() => {
                playTap();
                updatePreferences({
                  quietHours: {
                    ...preferences.quietHours,
                    enabled: !preferences.quietHours.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences.quietHours.enabled ? 'bg-[#B34A26]' : 'bg-stone-300'
              }`}
              role="switch"
              aria-checked={preferences.quietHours.enabled}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.quietHours.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-softBorder/60">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Start Time (Night)
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => {
                    updatePreferences({
                      quietHours: {
                        ...preferences.quietHours,
                        start: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-softBorder bg-white text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#B34A26]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  End Time (Morning)
                </label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => {
                    updatePreferences({
                      quietHours: {
                        ...preferences.quietHours,
                        end: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-3 py-1.5 rounded-xl border border-softBorder bg-white text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#B34A26]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Daily Expense Check-in Time */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-warmCream/40 border border-softBorder">
          <div>
            <span className="text-xs font-bold text-warmCocoa block">
              Daily Expense Check-In Time
            </span>
            <span className="text-[11px] text-textSecondary">
              Reminds you to balance cash at end of day (suppressed if already logged).
            </span>
          </div>

          <input
            type="time"
            value={preferences.schedules.expenseReminderTime}
            onChange={(e) => {
              updatePreferences({
                schedules: {
                  ...preferences.schedules,
                  expenseReminderTime: e.target.value,
                },
              });
            }}
            className="px-2.5 py-1.5 rounded-xl border border-softBorder bg-white text-xs font-bold text-stone-800 focus:outline-none"
          />
        </div>

        {/* Hydration Interval Selector */}
        <div className="p-3.5 rounded-2xl bg-warmCream/40 border border-softBorder space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmCocoa">
              Work Shift Hydration Reminders
            </span>
            <span className="text-[11px] text-stone-500 font-semibold">
              {preferences.schedules.hydrationEnabled ? 'Every 2 hours' : 'Disabled'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { hours: 0, label: 'Off' },
              { hours: 2, label: 'Every 2h' },
              { hours: 3, label: 'Every 3h' },
            ].map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => {
                  playTap();
                  updatePreferences({
                    schedules: {
                      ...preferences.schedules,
                      hydrationEnabled: opt.hours > 0,
                      hydrationIntervalHours: opt.hours,
                    },
                  });
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  (!preferences.schedules.hydrationEnabled && opt.hours === 0) ||
                  (preferences.schedules.hydrationEnabled &&
                    preferences.schedules.hydrationIntervalHours === opt.hours)
                    ? 'bg-[#B34A26] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-softBorder hover:bg-stone-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
