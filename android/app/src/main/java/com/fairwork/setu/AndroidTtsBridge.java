package com.fairwork.setu;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.util.Locale;
import java.util.UUID;

/**
 * FairWork Setu - Native Android TextToSpeech Bridge
 * Provides direct access to Android's OS-level TTS engine (Google Speech Services / device TTS)
 * inside Capacitor's WebView, overcoming Android WebView's lack of W3C SpeechSynthesis.
 */
public class AndroidTtsBridge {

    private static final String TAG = "SetuAndroidTTS";

    private final Activity activity;
    private final WebView webView;
    private TextToSpeech tts;
    private boolean isReady = false;

    public AndroidTtsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        initTts();
    }

    private void initTts() {
        try {
            this.tts = new TextToSpeech(activity.getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS) {
                        isReady = true;
                        setupProgressListener();
                        Log.i(TAG, "Native Android TextToSpeech initialized successfully");
                        dispatchJsEvent("android-tts-ready", "{}");
                    } else {
                        isReady = false;
                        Log.e(TAG, "Failed to initialize Native Android TextToSpeech. Status code: " + status);
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Exception during TextToSpeech initialization", e);
        }
    }

    private void setupProgressListener() {
        if (tts == null) return;
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                dispatchJsEvent("android-tts-start", "{\"id\":\"" + escapeJson(utteranceId) + "\"}");
            }

            @Override
            public void onDone(String utteranceId) {
                dispatchJsEvent("android-tts-done", "{\"id\":\"" + escapeJson(utteranceId) + "\"}");
            }

            @Override
            public void onError(String utteranceId) {
                dispatchJsEvent("android-tts-error", "{\"id\":\"" + escapeJson(utteranceId) + "\",\"error\":\"synthesis_failed\"}");
            }

            @Override
            public void onError(String utteranceId, int errorCode) {
                dispatchJsEvent("android-tts-error", "{\"id\":\"" + escapeJson(utteranceId) + "\",\"code\":" + errorCode + "}");
            }
        });
    }

    @JavascriptInterface
    public boolean isAvailable() {
        return isReady && tts != null;
    }

    @JavascriptInterface
    public void speak(final String text, final String langCode, final float rate) {
        if (tts == null || !isReady) {
            Log.w(TAG, "speak() called but TextToSpeech engine is not ready");
            dispatchJsEvent("android-tts-error", "{\"error\":\"not_ready\"}");
            return;
        }

        if (text == null || text.trim().isEmpty()) {
            return;
        }

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Locale locale = resolveLocale(langCode);
                    int res = tts.setLanguage(locale);
                    if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.w(TAG, "Locale " + locale + " not fully supported, falling back to English/Default");
                        tts.setLanguage(Locale.ENGLISH);
                    }

                    float safeRate = (rate >= 0.2f && rate <= 3.0f) ? rate : 0.96f;
                    tts.setSpeechRate(safeRate);
                    tts.setPitch(1.0f);

                    String utteranceId = UUID.randomUUID().toString();
                    Bundle params = new Bundle();
                    params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId);

                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
                } catch (Exception e) {
                    Log.e(TAG, "Exception during TTS speak()", e);
                }
            }
        });
    }

    @JavascriptInterface
    public void stop() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (tts != null) {
                        tts.stop();
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Exception during TTS stop()", e);
                }
            }
        });
    }

    public void shutdown() {
        try {
            if (tts != null) {
                tts.stop();
                tts.shutdown();
                tts = null;
                isReady = false;
            }
        } catch (Exception ignored) {}
    }

    private Locale resolveLocale(String lang) {
        if (lang == null) return new Locale("hi", "IN");
        String l = lang.toLowerCase().trim();
        if (l.startsWith("hi")) return new Locale("hi", "IN");
        if (l.startsWith("mr")) return new Locale("mr", "IN");
        if (l.startsWith("gu")) return new Locale("gu", "IN");
        if (l.startsWith("ta")) return new Locale("ta", "IN");
        if (l.startsWith("te")) return new Locale("te", "IN");
        if (l.startsWith("kn")) return new Locale("kn", "IN");
        if (l.startsWith("bn")) return new Locale("bn", "IN");
        if (l.startsWith("pa")) return new Locale("pa", "IN");
        if (l.startsWith("en")) return new Locale("en", "IN");
        return Locale.getDefault();
    }

    private void dispatchJsEvent(final String eventName, final String jsonPayload) {
        if (activity == null || webView == null) return;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    String script = "try { window.dispatchEvent(new CustomEvent('" + eventName + "', { detail: " + jsonPayload + " })); } catch(e){}";
                    webView.evaluateJavascript(script, null);
                } catch (Exception ignored) {}
            }
        });
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
