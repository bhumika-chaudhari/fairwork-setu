/**
 * FairWork Setu - Notification Bell Button
 * Compact header & dock action with live unread badge counter.
 */

import React from 'react';
import { AppIcon } from '../../lib/icons';
import { useNotifications } from '../../hooks/NotificationContext';
import { playTap } from '../../lib/feedback';

interface NotificationBellButtonProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function NotificationBellButton({
  className = '',
  size = 'md',
}: NotificationBellButtonProps) {
  const { unreadCount, openCenter } = useNotifications();

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={() => {
        playTap();
        openCenter();
      }}
      className={`relative flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xl shadow-glass border border-[#F4EBDD] text-deepEmerald hover:bg-white hover:text-[#B34A26] hover:border-[#E5953E]/50 transition-all active:scale-95 ${
        isSmall ? 'h-9 w-9' : 'h-10 w-10'
      } ${className}`}
      title="Notifications & Smart Nudges"
      aria-label="Notifications"
    >
      <AppIcon name="notifications" size={isSmall ? 16 : 18} />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-[#B34A26] to-[#7C2D16] text-[10px] font-black text-white shadow-xs ring-2 ring-white animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
