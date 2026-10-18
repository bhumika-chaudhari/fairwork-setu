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

    // Robust Multi-Peak Shake Detector Variables
    private SensorManager sensorManager;
    private Sensor accelerometer;

    // Physics thresholds:
    // Earth gravity = 1.0G. Normal handling/walking/typing is < 2.0G.
    // A deliberate shake exceeds 2.7G across at least 2 distinct back-and-forth oscillations.
    private static final float SHAKE_THRESHOLD_GRAVITY = 2.7F;
    private static final int SHAKE_MIN_PEAKS = 2;
    private static final int SHAKE_WINDOW_MS = 650;
    private static final int SHAKE_MIN_PEAK_INTERVAL_MS = 160;
    private static final int SHAKE_COOLDOWN_MS = 2500;

    private int shakePeakCount = 0;
    private long firstPeakTimestamp = 0;
    private long lastPeakTimestamp = 0;
    private long lastShakeTriggerTimestamp = 0;

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
        if (action == null) return;

        if (QuickEntryWidgetProvider.ACTION_ADD_EXPENSE.equals(action)) {
            dispatchRoute("/dhan?action=add-expense");
            intent.setAction(null);
            setIntent(intent);
        } else if (QuickEntryWidgetProvider.ACTION_ADD_INCOME.equals(action)) {
            dispatchRoute("/dhan?action=add-income");
            intent.setAction(null);
            setIntent(intent);
        } else if (QuickEntryWidgetProvider.ACTION_VOICE_LOG.equals(action)) {
            dispatchRoute("/home?action=voice");
            intent.setAction(null);
            setIntent(intent);
        }
    }

    private void dispatchRoute(final String path) {
        this.pendingRoute = path;
        executePendingRoute();
    }

    private void executePendingRoute() {
        if (this.pendingRoute == null) return;
        final String route = this.pendingRoute;
        this.pendingRoute = null;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        String js;
                        if (route.contains("action=voice")) {
                            js = "try { window.dispatchEvent(new CustomEvent('setu-open-voice')); } catch(e){} " +
                                 "if (window.location && !window.location.pathname.startsWith('/home') && !window.location.search.includes('action=voice')) { " +
                                 "  window.location.href = '" + route + "'; " +
                                 "}";
                        } else {
                            js = "if (window.location) { window.location.href = '" + route + "'; }";
                        }
                        webView.evaluateJavascript(js, null);
                    }
                } catch (Exception ignored) {}
            }
        });
    }

    private void triggerVoiceOverlayDirectly() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        // Open voice overlay cleanly without page navigation or URL reloads
                        webView.evaluateJavascript("try { window.dispatchEvent(new CustomEvent('setu-open-voice')); } catch(e){}", null);
                    }
                } catch (Exception ignored) {}
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        resetShakeState();
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
        resetShakeState();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    private void resetShakeState() {
        shakePeakCount = 0;
        firstPeakTimestamp = 0;
        lastPeakTimestamp = 0;
    }

    // Accelerometer Shake Detection with Multi-Peak Reversal Validation
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            final long now = System.currentTimeMillis();

            // Ignore while in post-trigger cooldown (2.5s)
            if (now - lastShakeTriggerTimestamp < SHAKE_COOLDOWN_MS) {
                return;
            }

            float x = event.values[0];
            float y = event.values[1];
            float z = event.values[2];

            float gX = x / SensorManager.GRAVITY_EARTH;
            float gY = y / SensorManager.GRAVITY_EARTH;
            float gZ = z / SensorManager.GRAVITY_EARTH;

            float gForce = (float) Math.sqrt(gX * gX + gY * gY + gZ * gZ);

            if (gForce >= SHAKE_THRESHOLD_GRAVITY) {
                if (shakePeakCount == 0) {
                    // First acceleration peak detected
                    shakePeakCount = 1;
                    firstPeakTimestamp = now;
                    lastPeakTimestamp = now;
                } else if ((now - lastPeakTimestamp >= SHAKE_MIN_PEAK_INTERVAL_MS) &&
                           (now - firstPeakTimestamp <= SHAKE_WINDOW_MS)) {
                    // Subsequent distinct peak within valid oscillation window
                    shakePeakCount++;
                    lastPeakTimestamp = now;

                    if (shakePeakCount >= SHAKE_MIN_PEAKS) {
                        // Confirmed intentional shake gesture!
                        resetShakeState();
                        lastShakeTriggerTimestamp = now;

                        // Trigger Haptic Feedback Vibration
                        vibrateDevice();

                        // Open Voice Assistant Overlay directly without full page reload
                        triggerVoiceOverlayDirectly();
                    }
                } else if (now - firstPeakTimestamp > SHAKE_WINDOW_MS) {
                    // Window expired; reset to single peak starting now
                    shakePeakCount = 1;
                    firstPeakTimestamp = now;
                    lastPeakTimestamp = now;
                }
            } else if (shakePeakCount > 0 && (now - firstPeakTimestamp > SHAKE_WINDOW_MS)) {
                // Decay peak count if no subsequent peaks arrive within window
                resetShakeState();
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
