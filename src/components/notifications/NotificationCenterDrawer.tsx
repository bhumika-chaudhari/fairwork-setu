/**
 * FairWork Setu - In-App Notification Center Drawer & Modal
 * Full-featured notification hub with category filters, unread indicators,
 * deep-link execution, tone badges, and direct settings access.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppIcon } from '../../lib/icons';
import ModalPortal from '../ModalPortal';
import { useNotifications } from '../../hooks/NotificationContext';
import type { InAppNotification, NotificationCategory } from '../../types/notification';
import { playTap, playPop } from '../../lib/feedback';

type FilterTab = 'all' | 'unread' | NotificationCategory;

const CATEGORY_STYLES: Record<
  NotificationCategory,
  { label: string; bg: string; text: string; icon: string }
> = {
  money: {
    label: 'Money',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: 'wallet',
  },
  work: {
    label: 'Work',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: 'briefcase',
  },
  health: {
    label: 'Health',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    icon: 'heart',
  },
  skills: {
    label: 'Skills',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: 'sparkles',
  },
  rights: {
    label: 'Rights',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    icon: 'shield-checkmark',
  },
};

const TONE_BADGES: Record<string, { label: string; icon: string }> = {
  playful: { label: 'Playful', icon: 'sparkles' },
  caring: { label: 'Caring', icon: 'heart' },
  witty: { label: 'Witty', icon: 'bulb-outline' },
  motivational: { label: 'Motivational', icon: 'trending-up' },
  professional: { label: 'Official', icon: 'document-text' },
};

function formatRelativeTime(isoStr: string): string {
  try {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay}d ago`;
  } catch {
    return 'Recently';
  }
}

export default function NotificationCenterDrawer() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isCenterOpen,
    closeCenter,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    triggerTestNotification,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [testingCategory, setTestingCategory] = useState<NotificationCategory | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (item.dismissed) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !item.read;
      return item.category === activeFilter;
    });
  }, [notifications, activeFilter]);

  if (!isCenterOpen) return null;

  const handleNotificationClick = (notif: InAppNotification) => {
    playTap();
    markAsRead(notif.id);
    closeCenter();
    if (notif.deepLink) {
      navigate(notif.deepLink);
    }
  };

  const handleTestTrigger = async (category: NotificationCategory) => {
    setTestingCategory(category);
    playPop();
    await triggerTestNotification(category);
    setTimeout(() => setTestingCategory(null), 600);
  };

  return (
    <ModalPortal
      isOpen={isCenterOpen}
      onClose={closeCenter}
      maxWidthClass="sm:max-w-md w-full"
      panelClassName="bg-[#FFFDF9] border border-[#F4EBDD] flex flex-col h-[90vh] sm:h-[85vh]"
    >
      <div className="flex flex-col h-full overflow-hidden" role="dialog" aria-label="Notification Center">
        {/* Header */}
        <header className="shrink-0 flex items-center justify-between px-5 py-4 bg-white/90 border-b border-[#F4EBDD]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#B34A26]/10 text-[#B34A26]">
              <AppIcon name="notifications" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-warmCocoa">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#B34A26] text-white text-[11px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-textMuted">Smart nudges with a Setu personality</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playTap();
                closeCenter();
                navigate('/profile');
              }}
              className="p-2 rounded-xl text-stone-500 hover:text-warmCocoa hover:bg-stone-100 transition-colors"
              title="Notification Settings"
              aria-label="Notification Settings"
            >
              <AppIcon name="sliders" size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                closeCenter();
              }}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              aria-label="Close Notification Center"
            >
              <AppIcon name="close" size={18} />
            </button>
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="shrink-0 px-4 py-2.5 bg-white border-b border-[#F4EBDD] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playTap();
                setActiveFilter('all');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#B34A26] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                setActiveFilter('unread');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeFilter === 'unread'
                  ? 'bg-[#B34A26] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Unread ({unreadCount})
            </button>

            {(['money', 'work', 'health', 'skills', 'rights'] as NotificationCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playTap();
                    setActiveFilter(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all capitalize whitespace-nowrap ${
                    activeFilter === cat
                      ? 'bg-[#B34A26] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Quick Bulk Action Bar */}
        {notifications.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-5 py-2 bg-stone-50/80 border-b border-stone-200/60 text-xs">
            <button
              type="button"
              onClick={() => {
                playTap();
                markAllAsRead();
              }}
              disabled={unreadCount === 0}
              className="text-[#B34A26] font-bold hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1"
            >
              <AppIcon name="check-all" size={14} />
              <span>Mark all read</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                clearAllNotifications();
              }}
              className="text-stone-400 hover:text-rose-600 font-semibold hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notification List Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FDF8F0] border border-[#F1B96B]/40 text-[#B34A26] mb-3 shadow-xs">
                <AppIcon name="sparkles" size={28} />
              </div>
              <h3 className="text-sm font-black text-warmCocoa">Sab badhiya hai, boss! ✨</h3>
              <p className="text-xs text-textMuted max-w-xs mt-1 mb-5">
                {activeFilter === 'unread'
                  ? 'No unread notifications right now. You are all caught up!'
                  : 'No notifications in this category yet.'}
              </p>

              {/* Instant Test Buttons */}
              <div className="w-full max-w-xs rounded-2xl bg-white p-3.5 border border-[#F4EBDD] shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Try a personality test nudge:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={testingCategory === 'money'}
                    onClick={() => handleTestTrigger('money')}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all text-left flex items-center gap-1.5"
                  >
                    <span>💸 Money</span>
                  </button>
                  <button
                    type="button"
                    disabled={testingCategory === 'work'}
                    onClick={() => handleTestTrigger('work')}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 active:scale-95 transition-all text-left flex items-center gap-1.5"
                  >
                    <span>🛠️ Work</span>
                  </button>
                  <button
                    type="button"
                    disabled={testingCategory === 'health'}
                    onClick={() => handleTestTrigger('health')}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 active:scale-95 transition-all text-left flex items-center gap-1.5"
                  >
                    <span>💧 Health</span>
                  </button>
                  <button
                    type="button"
                    disabled={testingCategory === 'skills'}
                    onClick={() => handleTestTrigger('skills')}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all text-left flex items-center gap-1.5"
                  >
                    <span>✨ Skills</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const catConfig = CATEGORY_STYLES[notif.category] || CATEGORY_STYLES.money;
              const toneConfig = TONE_BADGES[notif.tone] || TONE_BADGES.playful;

              return (
                <div
                  key={notif.id}
                  className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
                    notif.read
                      ? 'bg-white/70 border-stone-200/70 hover:bg-white'
                      : 'bg-white border-[#F1B96B] shadow-sm ring-1 ring-[#F1B96B]/30'
                  }`}
                >
                  {/* Category & Tone Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${catConfig.bg} ${catConfig.text}`}
                      >
                        <AppIcon name={catConfig.icon} size={11} />
                        <span>{catConfig.label}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                        <span>{toneConfig.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400 font-medium">
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                      {!notif.read && (
                        <span
                          className="h-2 w-2 rounded-full bg-[#B34A26] ring-2 ring-white"
                          title="Unread"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playTap();
                          dismissNotification(notif.id);
                        }}
                        className="opacity-60 group-hover:opacity-100 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        title="Dismiss"
                      >
                        <AppIcon name="close" size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h4 className="text-xs sm:text-sm font-extrabold text-stone-800 leading-snug">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">{notif.body}</p>

                  {/* Action Link Button */}
                  {notif.actionLabel && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notif)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all"
                      >
                        <span>{notif.actionLabel}</span>
                        <AppIcon name="arrow-forward" size={12} />
                      </button>

                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => {
                            playTap();
                            markAsRead(notif.id);
                          }}
                          className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with settings quick link */}
        <footer className="shrink-0 p-3 bg-white border-t border-[#F4EBDD] flex items-center justify-between text-xs text-stone-500">
          <span>Setu Smart Notification Engine v1.0</span>
          <button
            type="button"
            onClick={() => {
              playTap();
              closeCenter();
              navigate('/profile');
            }}
            className="text-[#B34A26] font-bold hover:underline"
          >
            Preferences
          </button>
        </footer>
      </div>
    </ModalPortal>
  );
}
