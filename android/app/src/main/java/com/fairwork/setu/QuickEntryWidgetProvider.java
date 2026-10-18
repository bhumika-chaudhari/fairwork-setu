package com.fairwork.setu;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

public class QuickEntryWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_ADD_EXPENSE = "com.fairwork.setu.ACTION_ADD_EXPENSE";
    public static final String ACTION_ADD_INCOME = "com.fairwork.setu.ACTION_ADD_INCOME";
    public static final String ACTION_VOICE_LOG = "com.fairwork.setu.ACTION_VOICE_LOG";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_quick_entry);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Expense Intent
        Intent expenseIntent = new Intent(context, MainActivity.class);
        expenseIntent.setAction(ACTION_ADD_EXPENSE);
        expenseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent expensePending = PendingIntent.getActivity(context, 101, expenseIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_widget_expense, expensePending);

        // Income Intent
        Intent incomeIntent = new Intent(context, MainActivity.class);
        incomeIntent.setAction(ACTION_ADD_INCOME);
        incomeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent incomePending = PendingIntent.getActivity(context, 102, incomeIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_widget_income, incomePending);

        // Voice Intent
        Intent voiceIntent = new Intent(context, MainActivity.class);
        voiceIntent.setAction(ACTION_VOICE_LOG);
        voiceIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent voicePending = PendingIntent.getActivity(context, 103, voiceIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_widget_voice, voicePending);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
