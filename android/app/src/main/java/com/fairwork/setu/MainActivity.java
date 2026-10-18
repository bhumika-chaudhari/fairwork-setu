package com.fairwork.setu;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private String pendingRoute = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
                        String js = "if (window.location) { " +
                                    "  window.location.href = '" + route + "'; " +
                                    "}";
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
        if (this.pendingRoute != null) {
            getWindow().getDecorView().postDelayed(new Runnable() {
                @Override
                public void run() {
                    executePendingRoute();
                }
            }, 600);
        }
    }
}
