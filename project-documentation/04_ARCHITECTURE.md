# System Architecture: Setu (सेतु)

## 1. High-Level 5-Tier Architecture

FairWork Setu is engineered as a hybrid cloud-and-edge system. It connects native physical Android sensors and hardware controllers to client-side progressive web interfaces, bridged via Capacitor 8 to a modular Python FastAPI backend and a multi-model ML inference pipeline.

```mermaid
flowchart TD
    subgraph Tier1 ["1. Android Hardware & Native Services (android/)"]
        direction TB
        Shake["📳 Sensor.TYPE_ACCELEROMETER<br/>(Multi-Peak Reversal Physics)"]
        Cam["📸 Native Camera Subsystem<br/>(capture='environment')"]
        Vib["📳 Vibrator / VibrationEffect<br/>(180ms Haptic Pulse)"]
        Widget["🎛️ QuickEntryWidgetProvider<br/>(4x2 RemoteViews AppWidget)"]
        Shift["🔒 ShiftTrackerService<br/>(Sticky Foreground Service)"]
        Tile["⚡ SetuQuickTileService<br/>(System Control Shade Tile)"]
    end

    subgraph Tier2 ["2. Capacitor Native Bridge & IPC Layer"]
        direction TB
        BridgeActivity["MainActivity.java<br/>(extends BridgeActivity)"]
        IntentRouter["Intent Action Dispatcher<br/>(ACTION_VOICE_LOG, ACTION_ADD_*)"]
        BridgeClear["Intent Action Cleared<br/>(intent.setAction(null))"]
        JSEval["WebView evaluateJavascript()<br/>+ CustomEvent('setu-open-voice')"]
        BridgeActivity --- IntentRouter
        IntentRouter --- BridgeClear
        BridgeClear --- JSEval
    end

    Tier1 -->|"Intents & Sensor Events"| Tier2

    subgraph Tier3 ["3. Frontend Application Tier (React 18 + Vite)"]
        direction TB
        DockNav["Liquid Glass Dock Navigation<br/>(6 Portals: Home, Kaam, Dhan, Sehat, Kaushal, Haq)"]
        VoiceModal["Unified Voice Assistant Modal<br/>(SetuContinuousSpeechRecognizer)"]
        OCRWorker["Client-Side OCR Web Worker<br/>(Tesseract.js 7.0 Wasm Engine)"]
        LocalCache["Offline Persistence Layer<br/>(IndexedDB / LocalStorage)"]
    end

    Tier2 -->|"Deep Links & Custom Events"| Tier3

    subgraph Tier4 ["4. Application API Gateway (FastAPI / Python 3.11)"]
        direction TB
        RouterML["/api/v1/ml<br/>(Models 1–5 Endpoints)"]
        RouterHealth["/api/v1/health<br/>(Symptom Triage & Hospital Locator)"]
        RouterMarket["/api/v1/marketplace<br/>(Kaam Gig Job Recommendations)"]
        RouterNotify["/api/v1/notifications<br/>(Smart Contextual Reminders)"]
    end

    Tier3 -->|"REST API / HTTPS (TLS 1.3)"| Tier4

    subgraph Tier5 ["5. AI/ML Inference & Knowledge Persistence"]
        direction TB
        M1["Model 1: Expense Classification<br/>(SGDClassifier + Modified Huber Loss)"]
        M2["Model 2: Income Forecasting<br/>(Random Forest Regressor)"]
        M3["Model 3: Anomaly Detection<br/>(Isolation Forest)"]
        M6["Model 6: Job-Worker Matching<br/>(SentenceTransformers Cosine Distance)"]
        M7["Model 7: Skill & Course Recommender<br/>(NCVET NOS Vector Matcher)"]
        M8["Model 8: Grounded Welfare RAG<br/>(FAISS Vector DB + Source Citations)"]
        M9["Model 9: Financial Stability Scorer<br/>(5-Factor Weighted Regressor)"]
    end

    Tier4 -->|"Data Frames & Feature Vectors"| Tier5

    classDef t1 fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef t2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef t3 fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef t4 fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#831843;
    classDef t5 fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;

    class Shake,Cam,Vib,Widget,Shift,Tile t1;
    class BridgeActivity,IntentRouter,BridgeClear,JSEval t2;
    class DockNav,VoiceModal,OCRWorker,LocalCache t3;
    class RouterML,RouterHealth,RouterMarket,RouterNotify t4;
    class M1,M2,M3,M6,M7,M8,M9 t5;
```

---

## 2. Detailed Architectural Tiers

### 2.1 Tier 1: Mobile Hardware & Native Android Platform
* **Location:** `android/app/src/main/`
* **Components:**
  1. `QuickEntryWidgetProvider.java`: Native `AppWidgetProvider` rendering a 4x2 interactive card on the Android home screen via `RemoteViews`.
  2. `ShiftTrackerService.java`: Native Android Foreground Sticky Service maintaining an ongoing notification with `VISIBILITY_PUBLIC` on the lock screen.
  3. `MainActivity.java`: Houses the `SensorEventListener` for physical `Sensor.TYPE_ACCELEROMETER`, computing real-time normalized g-forces:
     $$gForce = \frac{\sqrt{x^2 + y^2 + z^2}}{g_{earth}}$$
  4. `SetuQuickTileService.java`: System drawer Quick Settings tile executing `startActivityAndCollapse()` to launch the voice assistant with a single gesture.
  5. `shortcuts.xml`: Static Android launcher app shortcuts for 1-tap home-screen access.

---

### 2.2 Tier 2: Capacitor Hybrid Native Bridge & IPC
* **Core Coordinator:** `MainActivity.java extends BridgeActivity`
* **Lifecycle & Intent Handling:**
  * Cold Launch (`onCreate`): Checks `getIntent()`, caches action in `pendingRoute`, and dispatches once the WebView bridge attaches.
  * Runtime Resumption (`onNewIntent`): Intercepts dynamic widget and notification actions while the app is in the background.
  * **Intent Consuming:** Immediately executes `intent.setAction(null); setIntent(intent);` to prevent unwanted re-triggering upon phone rotation or resume.
  * **Zero-Navigation Event Dispatch:** When the shake gesture triggers, evaluates `window.dispatchEvent(new CustomEvent('setu-open-voice'))` inside the WebView to open the assistant overlay without disrupting the user's active page.

---

### 2.3 Tier 3: Frontend Presentation Tier (React 18 + Vite 7 SPA)
* **Location:** `src/`
* **Key Architecture Patterns:**
  * **Liquid Glass Dock Navigation:** Apple-inspired floating bottom dock housing the 6 primary portals (`/home`, `/kaam`, `/dhan`, `/sehat`, `/kaushal`, `/haq`).
  * **Centralized Voice Assistant (`VoiceAssistantContext.tsx`):** Screen-aware overlay accessible globally across the entire app.
  * **Client-Side Multimodal OCR (`tesseract.js 7.0`):** Dedicated background Web Worker thread executing WebAssembly-compiled Tesseract OCR to parse receipts locally without remote image uploads.
  * **Offline Data Synchronization:** IndexedDB and LocalStorage cache active shift records, enabling full field logging during temporary 4G connectivity loss.

---

### 2.4 Tier 4: Application API Gateway (FastAPI / Python 3.11)
* **Location:** `ml_service/`
* **Framework:** FastAPI with Uvicorn ASGI server and Pydantic v2 data contracts.
* **Responsibilities:**
  * Exposes asynchronous REST endpoints under `/api/v1/`.
  * Orchestrates ML training and inference pipelines.
  * Serves grounded RAG queries against official government welfare gazettes.
  * Formulates synthetic worker datasets for model training benchmarks.

---

### 2.5 Tier 5: AI/ML Inference Pipeline & Vector Knowledge Store
* **Algorithms Deployed:**
  * **Model 1 (Expense Classifier):** `SGDClassifier` with Modified Huber Loss + `TfidfVectorizer` (Sub-15ms classification into 9 classes).
  * **Model 2 (Income Forecaster):** `RandomForestRegressor` (100 Trees) trained on lag features and cyclical day-of-week encodings ($R^2 \ge 0.88$).
  * **Model 3 (Anomaly Detector):** `IsolationForest` (Unsupervised recursive partitioning, ROC-AUC: 0.93).
  * **Model 6 (Job-Worker Matcher):** `SentenceTransformers` (`all-MiniLM-L6-v2`) dense vector cosine distance ranking.
  * **Model 8 (Grounded Welfare RAG):** `FAISS` Vector Store (`faiss.IndexFlatIP`) indexing official scheme documentation with strict source citations and emergency helpline bypass.
  * **Model 9 (Financial Stability Score):** 5-factor weighted educational regressor (0–100 index).

---

## 3. Data Flow Sequences

### 3.1 Cash Transaction Ingestion Flow
```text
[Worker Voice / Receipt Photo / Widget Tap]
                    │
                    ▼
[Native Android Sensor / Camera / RemoteViews]
                    │ PendingIntent / CustomEvent
                    ▼
[Capacitor WebView Bridge (MainActivity.java)]
                    │
                    ▼
[Client State & Tesseract.js Worker / Speech Recognizer]
                    │
                    ▼
[Model 5: Entity Parser & Normalizer] ───► Amount, Date, Category extracted
                    │
                    ▼
[Model 1: SGDClassifier Category Verification]
                    │
                    ▼
[Model 3: Isolation Forest Anomaly Check]
                    │
                    ▼
[Interactive Visual Confirmation Card Presented to Worker]
                    │ Worker Taps "Confirm"
                    ▼
[Ledger Persistence (IndexedDB Local + FastAPI Backend)]
                    │
                    ▼
[Model 2: Income Forecaster & Model 9: Stability Score Updated]
```

---

## 4. Security & Compliance Architecture

* **Zero Sensitive PII Collection:** The platform never requests, processes, or stores Aadhaar numbers, biometric templates, bank passwords, or continuous GPS trails.
* **Ephemeral Audio Processing:** Voice inputs are transcribed to text and immediately purged from RAM; raw audio files are never retained on remote servers.
* **Zero Hallucination Guardrails:** Health and legal information are retrieved strictly from verified government PDFs indexed in FAISS; if an answer is absent, the system refuses to speculate.
