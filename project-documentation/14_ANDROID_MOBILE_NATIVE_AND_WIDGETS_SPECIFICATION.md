# FairWork Setu — Android Mobile Native, Widgets & Mobile Innovations Specification

**Document Identifier:** `SETU-DOC-014`  
**Module:** Mobile Native Platform, AppWidgets, Background Services & Sensor Ergonomics  
**Target Environment:** Android 8.0+ (API Level 26) through Android 15 (API Level 35)  
**Framework:** Capacitor 8 Native Bridge + React 18 / Vite SPA  

---

## 1. Executive Summary & Problem Context

India’s gig and informal workforce—consisting of over 450 million delivery riders, auto-rickshaw drivers, street vendors, and domestic workers—operates primarily in mobile-only, on-the-go environments. Standard mobile web applications fail in this operating context due to:

1. **Physical Obstacles:** Workers wearing riding gloves, having dusty/wet hands, or navigating traffic cannot perform complex multi-step navigation across nested screens.
2. **Time Sensitivity:** Between delivery drops or passenger pickups, workers have only 5 to 10 seconds to record cash exchanges or fuel expenses.
3. **Digital & Language Barriers:** Complex form fields and dropdown menus exclude workers with low digital literacy.

To solve this, **FairWork Setu** was engineered beyond a conventional web application into a **hardware-integrated, native Android application (APK)** featuring home-screen card widgets, lock-screen persistent shift trackers, Android system quick-settings tiles, motion-sensor shake triggers, and camera bill OCR scanning.

```text
+---------------------------------------------------------------------------------+
|                                Android OS Hardware                              |
|   +-------------------+  +--------------------+  +--------------------------+   |
|   |  Accelerometer    |  |  Camera (Receipt)  |  |  Vibrator (Haptic Pulse) |   |
|   +---------+---------+  +---------+----------+  +------------+-------------+   |
+-------------|----------------------|--------------------------|-----------------+
              |                      |                          |
              v                      v                          v
+---------------------------------------------------------------------------------+
|                             Native Android Services                             |
|  +--------------------+  +--------------------+  +---------------------------+  |
|  | SetuQuickTileService| | ShiftTrackerService | | QuickEntryWidgetProvider  |  |
|  |  (Quick Settings)  |  | (Lock-Screen Shift)|  |    (Desktop Card Widget)  |  |
|  +----------+---------+  +---------+----------+  +-------------+-------------+  |
+-------------|----------------------|---------------------------|----------------+
              |                      |                           |
              +----------------------+---------------------------+
                                     | PendingIntent Deep Links
                                     v
+---------------------------------------------------------------------------------+
|                        Capacitor Native Bridge (MainActivity)                   |
|                        Intent Filter & JavaScript Evaluator                     |
+------------------------------------+--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                            Setu React Production SPA                            |
|    /dhan?action=add-expense  |  /dhan?action=add-income  |  /home?action=voice  |
|   +-------------------------------------------------------------------------+   |
|   |   Model 1 (SGDClassifier)   <--->   Model 5 (Hinglish Rule-based Parser)|   |
|   |   Model 4 (Whisper Tiny ASR)<--->   Camera OCR Bill Extraction Pipeline |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## 2. Technical Architecture & Native Bridge

### 2.1 The Capacitor Hybrid Bridge
The application frontend is compiled into production-optimized static bundles (`dist/`) and packaged inside native Android assets. The runtime executes inside an optimized Android `WebView` coordinated by `MainActivity.java` extending `com.getcapacitor.BridgeActivity`.

### 2.2 Deep-Link Routing Mechanism
All native components (Widgets, Shortcuts, Notification Tiles, and Background Services) communicate with the React single-page application using custom Android Intent actions:
* `com.fairwork.setu.ACTION_ADD_EXPENSE` ➔ routes to `/dhan?action=add-expense`
* `com.fairwork.setu.ACTION_ADD_INCOME` ➔ routes to `/dhan?action=add-income`
* `com.fairwork.setu.ACTION_VOICE_LOG` ➔ routes to `/home?action=voice`

In `MainActivity.java`, these intents are intercepted during both cold launch (`onCreate`) and runtime resumption (`onNewIntent`), evaluating dynamic JavaScript inside the WebView:
```java
String js = "if (window.location) { window.location.href = '" + route + "'; }";
webView.evaluateJavascript(js, null);
```

### 2.3 Android Manifest & Permissions Configuration
The application declares essential system capabilities in `android/app/src/main/AndroidManifest.xml`:
* `RECORD_AUDIO` & `MODIFY_AUDIO_SETTINGS`: Required for Whisper Tiny ASR voice assistant input.
* `VIBRATE`: Required for tactile haptic feedback during sensor and action triggers.
* `FOREGROUND_SERVICE` & `POST_NOTIFICATIONS`: Enables persistent lock-screen shift tracking.
* `usesCleartextTraffic="true"`: Permits development and local-network connectivity to Python FastAPI microservices (`ml_service`).

---

## 3. Detailed Specification of Innovations

### 3.1 Feature 1: Home-Screen Card Widget (`QuickEntryWidgetProvider`)
* **Component Type:** Native Android `AppWidgetProvider` (RemoteViews)
* **Files:** 
  * `android/app/src/main/java/com/fairwork/setu/QuickEntryWidgetProvider.java`
  * `android/app/src/main/res/layout/widget_quick_entry.xml`
  * `android/app/src/main/res/xml/widget_quick_entry_info.xml`
* **Design Ergonomics:**
  * Displays a 4x2 interactive card directly on the Android home screen styled in Setu's signature Deep Emerald (`#073B3A`) brand palette.
  * **`➖ Kharcha` (Expense Button):** Coral/crimson rounded button that fires an explicit `PendingIntent` launching the transaction modal with preset type `expense`.
  * **`➕ Kamai` (Income Button):** Forest green rounded button firing a `PendingIntent` for `income`.
  * **`🎙️ Bolkar Log Karein` (Voice Button):** High-contrast cyan button that immediately launches the screen-aware voice assistant.

### 3.2 Feature 2: App Icon Shortcuts (Pinnable Quick Actions)
* **Component Type:** Android Static App Shortcuts (`android.app.shortcuts`)
* **Files:**
  * `android/app/src/main/res/xml/shortcuts.xml`
  * `android/app/src/main/res/values/strings.xml`
* **Functionality:**
  * Long-pressing the Setu app icon exposes 3 immediate shortcuts:
    1. **Log Expense** (*खर्चा दर्ज करें*)
    2. **Add Income** (*कमाई दर्ज करें*)
    3. **Voice Assistant** (*बोलकर दर्ज करें*)
  * Any of these shortcuts can be dragged directly onto the home screen as independent 1x1 1-tap app icons.

### 3.3 Feature 3: Android Quick Settings Control Shade Tile (`SetuQuickTileService`)
* **Component Type:** `android.service.quicksettings.TileService`
* **Files:** `android/app/src/main/java/com/fairwork/setu/SetuQuickTileService.java`
* **Functionality:**
  * Inserts a system tile into the top notification control drawer (alongside Wi-Fi and Flashlight).
  * Uses `startActivityAndCollapse()` to immediately launch the voice logger while collapsing the notification shade in a single fluid gesture.
  * Handles Android 14+ API 34 security requirements using `FLAG_IMMUTABLE` `PendingIntent`.

### 3.4 Feature 4: Live Lock-Screen Shift Tracker (`ShiftTrackerService`)
* **Component Type:** Foreground Sticky Service (`android.app.Service`)
* **Files:** `android/app/src/main/java/com/fairwork/setu/ShiftTrackerService.java`
* **Functionality:**
  * Posts an ongoing notification categorized with `VISIBILITY_PUBLIC` and `setOngoing(true)`.
  * Stays visible directly on the phone's lock screen during the worker's shift.
  * Exposes 4 inline action buttons without requiring the user to unlock their phone:
    * `[ ➕ Kamai ]`: Instant fare log
    * `[ ➖ Kharcha ]`: Instant fuel/toll log
    * `[ 🎙️ Bolkar ]`: Instant speech transcription
    * `[ ⏹ End ]`: Terminates the duty shift and dismisses the foreground notification

### 3.5 Feature 5: Hardware Accelerometer Sensor: "Shake-to-Log"
* **Component Type:** `android.hardware.SensorEventListener` (`Sensor.TYPE_ACCELEROMETER`)
* **Files:** `android/app/src/main/java/com/fairwork/setu/MainActivity.java`
* **Algorithm & Physics:**
  * Normalizes 3-axis acceleration against Earth gravity:
    $$gForce = \frac{\sqrt{x^2 + y^2 + z^2}}{g_{earth}}$$
  * **Multi-Peak Reversal Validation (Anti-False-Trigger):**
    * Threshold condition: $gForce \ge 2.7\text{ G}$ (normal phone handling, walking, or screen tapping stays below 2.0 G).
    * Requires **at least 2 consecutive back-and-forth acceleration peaks** within a 650 ms rolling oscillation window, separated by at least 160 ms. Single-shock impacts (e.g. setting phone on a table or picking it up) only produce 1 peak and are rejected.
    * Post-trigger cooldown: `SHAKE_COOLDOWN_MS = 2500 ms` prevents trailing vibrations from re-triggering.
  * Upon detection:
    1. Triggers a **180ms haptic vibration pulse** (`Vibrator` / `VibrationEffect`).
    2. Directly invokes `window.dispatchEvent(new CustomEvent('setu-open-voice'))` via WebView, opening the Voice Assistant overlay without disruptive full-page navigation or URL pollution.

### 3.6 Feature 6: Camera Bill & Receipt OCR Scanner
* **Component Type:** Client-side Multimodal Image Ingestion & Entity Parser
* **Files:** `src/components/TransactionModal.tsx`
* **Workflow:**
  1. Worker taps **"📸 Scan Bill"** in the Transaction Modal.
  2. Native Android camera opens via `<input type="file" accept="image/*" capture="environment" />`.
  3. Image data is ingested and processed through an intelligent OCR extractor that identifies cash slips, fuel pump meters, and maintenance receipts.
  4. Automatically populates:
     * **Amount** (e.g., `₹350`)
     * **Description** (e.g., `Petrol Fuel Bill (Receipt OCR)`)
     * **Category** (`travel_fuel`, `food`, or `tools`)
  5. The extracted text is automatically fed into **Model 1 (SGDClassifier)** for secondary category validation and confidence scoring.

---

## 4. Build, Packaging & Distribution Specifications

### 4.1 Build Artifacts
* **Output Path:** `android/app/build/outputs/apk/debug/app-debug.apk`
* **Target Package ID:** `com.fairwork.setu`
* **Minimum SDK:** API Level 24 (Android 7.0 Nougat) — covers **99.2%** of active Android devices in India.
* **Target SDK:** API Level 35 (Android 15)
* **Binary Size:** ~6.66 MB (optimized production packaging)

### 4.2 Automation Scripts
* `scripts/sync_android_icons.py`: Automatically copies adaptive launcher icons, circular mipmaps, and status bar notification drawables from `android-res/` into `android/app/src/main/res/`.
* `scripts/generate_app_icons.py`: Generates all requisite DPI densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) from the vector brand logo.

---

## 5. Evaluation & Viva Defense Guide

When presenting this architecture to examiners or evaluation panels, emphasize the following key justifications:

1. **Why not just build a website?**
   > *"Informal gig workers work on roads, auto stands, and delivery hubs. A website requires opening a browser, typing a URL, and manual navigation. Our native Android implementation gives workers a 1-tap lock-screen shift tracker, a home-screen cash widget, and an accelerometer shake trigger that works even when wearing motorcycle gloves."*

2. **How does this connect to your AI/ML models?**
   > *"Every native entry point acts as an ingestion pipeline for our ML services: the Shake trigger routes directly to our Whisper Tiny speech transcription model, the Camera receipt scanner pipes text into our SGDClassifier (Model 1), and the quick cash buttons update the financial time series for our Random Forest income forecaster (Model 2)."*

3. **How is device fragmentation handled in India?**
   > *"By setting `minSdkVersion` to 24, our APK supports affordable entry-level smartphones from brands like Xiaomi, Realme, and Samsung commonly used by informal workers, while maintaining compatibility with modern Android 14/15 features."*

---

*Document Author: Setu Engineering & AIML Development Team*  
*Status: Approved, Built & Deployed to Main Git Repository*
