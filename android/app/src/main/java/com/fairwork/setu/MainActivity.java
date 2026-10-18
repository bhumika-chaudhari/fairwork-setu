package com.fairwork.setu;

import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity implements SensorEventListener {

    private String pendingRoute = null;

    // Shake Detector Variables
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private static final float SHAKE_THRESHOLD_GRAVITY = 2.0F;
    private static final int SHAKE_SLOP_TIME_MS = 1000;
    private long lastShakeTimestamp = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize Shake Sensor
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        }

        // Auto-start Live Shift Tracker Notification for Lock-Screen
        try {
            Intent shiftIntent = new Intent(this, ShiftTrackerService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(this, shiftIntent);
            } else {
                startService(shiftIntent);
            }
        } catch (Exception ignored) {}

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (QuickEntryWidgetProvider.ACTION_ADD_EXPENSE.equals(action)) {
            dispatchRoute("/dhan?action=add-expense");
        } else if (QuickEntryWidgetProvider.ACTION_ADD_INCOME.equals(action)) {
            dispatchRoute("/dhan?action=add-income");
        } else if (QuickEntryWidgetProvider.ACTION_VOICE_LOG.equals(action)) {
            dispatchRoute("/home?action=voice");
        }
    }

    private void dispatchRoute(final String path) {
        this.pendingRoute = path;
        executePendingRoute();
    }

    private void executePendingRoute() {
        if (this.pendingRoute == null) return;
        final String route = this.pendingRoute;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        String js;
                        if (route.contains("action=voice")) {
                            js = "try { window.dispatchEvent(new CustomEvent('setu-open-voice')); } catch(e){} " +
                                 "if (window.location && !window.location.search.includes('action=voice')) { " +
                                 "  window.location.href = '" + route + "'; " +
                                 "}";
                        } else {
                            js = "if (window.location) { window.location.href = '" + route + "'; }";
                        }
                        webView.evaluateJavascript(js, null);
                        pendingRoute = null;
                    }
                } catch (Exception ignored) {}
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        if (sensorManager != null && accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
        }
        if (this.pendingRoute != null) {
            getWindow().getDecorView().postDelayed(new Runnable() {
                @Override
                public void run() {
                    executePendingRoute();
                }
            }, 600);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    // Accelerometer Shake Detection
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            float gX = x / SensorManager.GRAVITY_EARTH;
            float gY = y / SensorManager.GRAVITY_EARTH;
            float gZ = z / SensorManager.GRAVITY_EARTH;

            float gForce = (float) Math.sqrt(gX * gX + gY * gY + gZ * gZ);

            if (gForce > SHAKE_THRESHOLD_GRAVITY) {
                final long now = System.currentTimeMillis();
                if (lastShakeTimestamp + SHAKE_SLOP_TIME_MS > now) {
                    return;
                }
                lastShakeTimestamp = now;

                // Trigger Haptic Feedback Vibration
                vibrateDevice();

                // Open Voice Assistant Logger
                dispatchRoute("/home?action=voice");
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private void vibrateDevice() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createOneShot(180, VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    v.vibrate(180);
                }
            }
        } catch (Exception ignored) {}
    }
}
