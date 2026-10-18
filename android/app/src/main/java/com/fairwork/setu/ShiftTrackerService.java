package com.fairwork.setu;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class ShiftTrackerService extends Service {

    public static final String CHANNEL_ID = "setu_shift_tracker";
    public static final int NOTIFICATION_ID = 8801;
    public static final String ACTION_STOP_SHIFT = "com.fairwork.setu.ACTION_STOP_SHIFT";
    public static final String ACTION_START_SHIFT = "com.fairwork.setu.ACTION_START_SHIFT";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP_SHIFT.equals(intent.getAction())) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notification = buildShiftNotification();
        startForeground(NOTIFICATION_ID, notification);
        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "FairWork Setu - Live Shift Tracker",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Persistent shift status and quick actions on the lock screen");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildShiftNotification() {
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Main Tap Intent (Opens app)
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(this, 300, openIntent, pendingFlags);

        // Action 1: Add Income
        Intent incomeIntent = new Intent(this, MainActivity.class);
        incomeIntent.setAction(QuickEntryWidgetProvider.ACTION_ADD_INCOME);
        incomeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent incomePending = PendingIntent.getActivity(this, 301, incomeIntent, pendingFlags);

        // Action 2: Add Expense
        Intent expenseIntent = new Intent(this, MainActivity.class);
        expenseIntent.setAction(QuickEntryWidgetProvider.ACTION_ADD_EXPENSE);
        expenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent expensePending = PendingIntent.getActivity(this, 302, expenseIntent, pendingFlags);

        // Action 3: Voice Log
        Intent voiceIntent = new Intent(this, MainActivity.class);
        voiceIntent.setAction(QuickEntryWidgetProvider.ACTION_VOICE_LOG);
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent voicePending = PendingIntent.getActivity(this, 303, voiceIntent, pendingFlags);

        // Action 4: End Shift
        Intent stopIntent = new Intent(this, ShiftTrackerService.class);
        stopIntent.setAction(ACTION_STOP_SHIFT);
        PendingIntent stopPending = PendingIntent.getService(this, 304, stopIntent, pendingFlags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("🟢 Setu Shift Active • ऑन-ड्यूटी")
            .setContentText("Kamai & Kharcha: Lock-screen se 1-tap me log karein")
            .setStyle(new NotificationCompat.BigTextStyle().bigText("🟢 Setu Active Duty\nLive Cash Tracker running. Tap below to log fare or fuel bill instantly."))
            .setContentIntent(openPending)
            .setOngoing(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(R.drawable.ic_notification, "+ Kamai", incomePending)
            .addAction(R.drawable.ic_notification, "- Kharcha", expensePending)
            .addAction(R.drawable.ic_notification, "🎙️ Bolkar", voicePending)
            .addAction(R.drawable.ic_notification, "⏹ End", stopPending)
            .build();
    }
}
