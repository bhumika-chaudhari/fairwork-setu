# FairWork Setu (सेतु) — Comprehensive System Design & High-Level Architecture (HLD)

**Document Identifier:** `SETU-DOC-016`  
**Module:** Complete System Design & High-Level Architecture Specification  
**Project:** सेतु (FairWork Setu) — AI-Powered Livelihood, Financial Inclusion & Social Security Companion  
**Based on:** Pure code inspection of native Android, Capacitor bridge, React frontend, FastAPI gateway, and ML pipelines  

---

## 📑 Table of Contents

1. [Executive Summary & Architectural Tenets](#1-executive-summary--architectural-tenets)
2. [End-to-End System Design Architecture Diagram](#2-end-to-end-system-design-architecture-diagram)
3. [Deep-Dive: The 6 System Design Tiers](#3-deep-dive-the-6-system-design-tiers)
   * 3.1 [Tier 1: Native Android Hardware & Background Services](#31-tier-1-native-android-hardware--background-services)
   * 3.2 [Tier 2: Capacitor 8 Hybrid Bridge & IPC Layer](#32-tier-2-capacitor-8-hybrid-bridge--ipc-layer)
   * 3.3 [Tier 3: Frontend Presentation & Client-Side Intelligence](#33-tier-3-frontend-presentation--client-side-intelligence)
   * 3.4 [Tier 4: Application API Gateway (FastAPI)](#34-tier-4-application-api-gateway-fastapi)
   * 3.5 [Tier 5: Specialized AI/ML Inference Pipeline & Vector Store](#35-tier-5-specialized-aiml-inference-pipeline--vector-store)
   * 3.6 [Tier 6: Data Persistence & Cloud Storage](#36-tier-6-data-persistence--cloud-storage)
4. [Specialized Subsystem Architecture Diagrams](#4-specialized-subsystem-architecture-diagrams)
   * 4.1 [Android Hardware Ergonomics & Audio TTS Bridge](#41-android-hardware-ergonomics--audio-tts-bridge)
   * 4.2 [Client-Side Multimodal OCR & Offline Sync Pipeline](#42-client-side-multimodal-ocr--offline-sync-pipeline)
   * 4.3 [FastAPI Microservice Gateway & ML Service Orchestration](#43-fastapi-microservice-gateway--ml-service-orchestration)
   * 4.4 [Grounded Welfare & Health RAG Subsystem](#44-grounded-welfare--health-rag-subsystem)
5. [End-to-End Execution Sequence Diagram](#5-end-to-end-execution-sequence-diagram)
6. [Database Schema & Entity-Relationship (ER) Architecture](#6-database-schema--entity-relationship-er-architecture)
7. [Non-Functional Requirements (NFRs) & Security Standards](#7-non-functional-requirements-nfrs--security-standards)
8. [Codebase Traceability Matrix](#8-codebase-traceability-matrix)

---

## 1. Executive Summary & Architectural Tenets

FairWork Setu is architected for India's 450M+ informal and gig workforce, built upon six core principles:
- **Mobile Ergonomics First:** Hardware accelerometer ("Shake-to-Log"), lock-screen shift tracking, 4x2 home-screen widgets.
- **Sub-30ms Task-Optimized ML:** Classical machine learning (`SGDClassifier`, `RandomForestRegressor`, `IsolationForest`) over high-latency monolithic cloud LLMs.
- **Decoupled 6-Tier Architecture:** Clean abstraction across hardware sensors, native bridge, web UI, API gateway, ML inference, and dual-store database.
- **Offline-First Resilience:** Client-side IndexedDB logging with idempotent synchronization (`client_tx_id`), plus automatic database failover between Supabase PostgreSQL and local SQLite.
- **Zero-Hallucination Grounded AI:** FAISS dense vector search over official government gazettes with strict citations and emergency routing (108/14434).
- **Privacy & DPDP Compliance:** Zero collection of Aadhaar, biometric, or continuous GPS data. Ephemeral voice transcription in memory.

---

## 2. Master High-Level Design (HLD) System Architecture Diagram

> **The Unified Master Blueprint:** This single comprehensive diagram explains the complete end-to-end architecture of FairWork Setu—from the physical field worker's multimodal interactions down to hardware sensors, hybrid IPC, presentation, FastAPI microservices, the 10-model ML inference pipeline, and dual-store persistence.

```mermaid
flowchart TB
    %% =========================================================================
    %% USER & MULTIMODAL INGESTION
    %% =========================================================================
    Worker(["👷 Informal & Gig Worker<br/>(Auto/Cab Driver, Delivery Partner, Daily Laborer, Vendor)"])

    subgraph MultimodalInputs ["Multimodal Real-World Inputs & Ergonomics"]
        InVoice["🎙️ Vernacular Spoken Dialect<br/>(Hindi / Marathi / Hinglish)"]
        InReceipt["📸 Paper Receipt / Fuel Bill Snap<br/>(Camera Environment Capture)"]
        InShake["📳 Phone Shake Physical Gesture<br/>(Wearing gloves / Driving)"]
        InWidget["📱 1-Tap Home / Lock Screen Tap<br/>(Zero navigation barrier)"]
    end

    Worker --> InVoice & InReceipt & InShake & InWidget

    %% =========================================================================
    %% TIER 1: HARDWARE & NATIVE ANDROID
    %% =========================================================================
    subgraph TIER1 ["1. Android Hardware & Native OS Services (android/app/src/main/...)"]
        direction TB
        Sensors["📳 Sensor.TYPE_ACCELEROMETER (60 Hz UI)<br/><b>Multi-Peak Direction-Reversal Physics</b><br/>• G-Force: √(x²+y²+z²)/g_earth > 2.7G<br/>• >= 2 Peaks in 650ms Window<br/>• 2500ms Refractory Cooldown"]
        CamHw["📸 Camera Subsystem (capture='environment')"]
        Haptics["📳 Vibrator Motor (180ms Tactile Confirmation Pulse)"]
        NativeTTS["🗣️ AndroidTtsBridge.java (Native TextToSpeech Engine)<br/>• UtteranceProgressListener<br/>• @JavascriptInterface window.AndroidTTS"]
        NativeShift["🔒 ShiftTrackerService.java (Sticky Foreground Service)<br/>• Channel: setu_shift_tracker<br/>• NotificationCompat.VISIBILITY_PUBLIC (Lock-Screen)"]
        NativeWidget["🎛️ QuickEntryWidgetProvider.java (4x2 RemoteViews AppWidget)<br/>• Buttons: Kamai (+), Kharcha (-), Bolkar (🎙️)"]
        NativeTile["⚡ SetuQuickTileService.java (Quick Settings Shade Tile)<br/>• startActivityAndCollapse()"]
        
        Sensors -->|"Valid Shake Event"| Haptics
    end

    InShake --> Sensors
    InReceipt --> CamHw
    InVoice -.->|"Native Voice Readout"| NativeTTS
    InWidget --> NativeShift & NativeWidget & NativeTile

    %% =========================================================================
    %% TIER 2: CAPACITOR 8 HYBRID BRIDGE & IPC
    %% =========================================================================
    subgraph TIER2 ["2. Capacitor 8 Hybrid Bridge & Inter-Process Communication (IPC)"]
        direction TB
        CapBridge["MainActivity.java (extends BridgeActivity)"]
        IntentRouter["Intent Action Dispatcher<br/>• ACTION_ADD_EXPENSE -> /dhan?action=add-expense<br/>• ACTION_ADD_INCOME -> /dhan?action=add-income<br/>• ACTION_VOICE_LOG -> /home?action=voice"]
        IntentGuard["Intent Consuming & Security Guard<br/>• FLAG_IMMUTABLE PendingIntent Compliance<br/>• intent.setAction(null) Anti-Ghost Trigger"]
        JSBridge["IPC Bridge Interfaces<br/>• window.AndroidTTS (Native Speech Synthesis)<br/>• evaluateJavascript() Dynamic Evaluation"]

        CapBridge --- IntentRouter --- IntentGuard --- JSBridge
    end

    Sensors -->|"CustomEvent('setu-open-voice')"| JSBridge
    NativeShift & NativeWidget & NativeTile -->|"PendingIntent Dispatch"| IntentRouter

    %% =========================================================================
    %% TIER 3: FRONTEND PRESENTATION & CLIENT-SIDE AI
    %% =========================================================================
    subgraph TIER3 ["3. Frontend Presentation & Client AI Tier (React 18.3 + TypeScript + Vite 7)"]
        direction TB
        subgraph WebBridge ["Web-Native Polyfill & Event Dispatcher"]
            TTSPolyfill["androidTtsPolyfill.ts<br/>Polyfills window.speechSynthesis<br/>via window.AndroidTTS"]
            EventBus["TabLayout.tsx<br/>window.addEventListener('setu-open-voice')"]
        end

        subgraph GlobalState ["React Context State Orchestration (src/hooks/)"]
            StateCtx["ProfileContext | TransactionContext | VoiceAssistantContext<br/>SpeechContext | NotificationContext | QueryClientProvider"]
        end

        subgraph Portals ["Liquid Glass 6 Core Portals (src/pages/)"]
            HomeP["🏠 Home (Shift & Balance)"]
            KaamP["💼 Kaam Setu (Gig Work & Bookings)"]
            DhanP["💰 Dhan Setu (Cashflow Ledger & Forecast)"]
            SehatP["🩺 Sehat Setu (Symptom Triage & 108 Emergency)"]
            KaushalP["📜 Kaushal Setu (Skill Passport & NCVET Courses)"]
            HaqP["🛡️ Haq Setu (Grievances & Govt Schemes)"]
        end

        subgraph ClientAI ["Client-Side Intelligence & Offline Journaling"]
            WasmOCR["📸 Tesseract.js 7.0 Web Worker (WebAssembly)<br/>• Client-Side Bill Text & Currency Parsing<br/>• Regex Pattern: Total, Cash, Net, INR, ₹"]
            SpeechSTT["🎙️ Continuous Speech Recognizer (5s Silence Timeout)"]
            OfflineJournal["💾 Local Journal (localStorage + IndexedDB)<br/>• Stores records with unique client_tx_id<br/>• Non-blocking offline UI updates"]
        end

        WebBridge --> StateCtx --> Portals --> ClientAI
    end

    JSBridge -->|"DOM Event Dispatch"| WebBridge
    CamHw -->|"Blob Stream"| WasmOCR
    NativeTTS <-->|"IPC Audio Stream"| TTSPolyfill

    %% =========================================================================
    %% TIER 4: APPLICATION API GATEWAY (FASTAPI)
    %% =========================================================================
    subgraph TIER4 ["4. Application API Gateway (FastAPI / Python 3.11 + Uvicorn)"]
        direction TB
        APIGateway["ASGI Gateway (Uvicorn 0.34) + CORS Middleware"]
        AuthFilter["auth.py: Bearer JWT Token Verification<br/>(Supabase HS256 / Dev Mock Fallback)"]

        subgraph Routers ["Modular REST Routers (ml_service/)"]
            R_Models["ai_models_router.py (/api/models)<br/>• ML inference & registry audit"]
            R_Tx["transactions_router.py (/api/v1/transactions)<br/>• Idempotent accounting entries"]
            R_Market["marketplace.py (/api/v1/marketplace)<br/>• Gig discovery & service bookings"]
            R_Health["health_service.py (/api/v1/health)<br/>• Triage engine & hospital directory"]
            R_Notif["notifications_router.py (/api/v1/notifications)<br/>• Contextual nudges & quiet hours"]
            R_User["user_router.py & auth_router.py<br/>• Profiles & Demo authentication"]
        end

        APIGateway --> AuthFilter --> Routers
    end

    Portals & ClientAI -->|"HTTPS REST (TLS 1.3, Axios, Bearer JWT)"| APIGateway

    %% =========================================================================
    %% TIER 5: AI / ML INFERENCE PIPELINE & VECTOR STORE
    %% =========================================================================
    subgraph TIER5 ["5. AI/ML Inference Pipeline & Vector Store (Edge + Microservice)"]
        direction TB
        MLSingleton["ai_models_service.py: AIModelsService Singleton<br/>(Shared SentenceTransformer 'all-MiniLM-L6-v2', 384 Dim)"]

        subgraph Models ["Specialized Model Inventory (model_codes/)"]
            M1["M1: Expense Classifier<br/>SGDClassifier + TfidfVectorizer<br/>(9 Classes, <15ms, 94.2% Acc)"]
            M2["M2: 7-Day Income Forecaster<br/>RandomForestRegressor (Lag Features)<br/>(MAE < ₹68, R² >= 0.88)"]
            M3["M3: Anomaly Detector<br/>IsolationForest + Imputer<br/>(Contamination = 0.05, ROC: 0.93)"]
            M4["M4: Voice ASR Engine<br/>Continuous STT / Whisper Tiny"]
            M5["M5: Entity & Tx Extractor<br/>Hinglish NLP Regex Normalizer (<8ms)"]
            M6["M6: Semantic Job Matcher<br/>Dense Cosine Sim on jobs.csv (Top-5: 91.5%)"]
            M7["M7: Skill & Course Recommender<br/>NCVET NOS Taxonomy Vector Matcher"]
            M8["M8: Grounded Welfare & Health RAG<br/>FAISS Vector Store (faiss.IndexFlatIP)<br/>0.0% Hallucination on Official Govt Gazettes"]
            M9["M9: Financial Stability Scorer<br/>5-Factor Non-Punitive Regressor (0-100)"]
        end

        MLSingleton --> Models
    end

    R_Models --> MLSingleton

    %% =========================================================================
    %% TIER 6: DATA PERSISTENCE & STORAGE
    %% =========================================================================
    subgraph TIER6 ["6. Data Persistence & Cloud Storage (SQLAlchemy Engine)"]
        direction TB
        DBRouter["database.py: Dynamic Database Router"]

        subgraph CloudDB ["Primary: Remote Supabase Cloud PostgreSQL"]
            SupabasePG["PostgreSQL Cluster (psycopg2 / psycopg v3)<br/>Pool Size: 10, Max Overflow: 20"]
            RLS["Row Level Security (RLS) Active<br/>(auth.uid() = user_id)"]
            Tables["Relational Schemas (schema.sql):<br/>• profiles • transactions (uq_user_client_tx)<br/>• service_profiles • service_bookings<br/>• job_applications • haq_cases<br/>• saved_health_items • notification_preferences"]
            SupabasePG --- RLS --- Tables
        end

        subgraph LocalDB ["Zero-Crash Fallback: Local SQLite"]
            SQLiteDB["fairwork_setu.db<br/>(Activates on network loss or dev mode)"]
        end

        DBRouter -->|"Normal Online"| SupabasePG
        DBRouter -.->|"On Connection Failure"| SQLiteDB
    end

    Routers --> DBRouter
    OfflineJournal -.->|"Background Idempotent Delta Sync via client_tx_id"| R_Tx

    %% Styling
    classDef worker fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f,font-weight:bold;
    classDef t1 fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef t2 fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef t3 fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef t4 fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#831843;
    classDef t5 fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef t6 fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a;

    class Worker worker;
    class Sensors,CamHw,Haptics,NativeTTS,NativeShift,NativeWidget,NativeTile t1;
    class CapBridge,IntentRouter,IntentGuard,JSBridge t2;
    class WebBridge,TTSPolyfill,EventBus,StateCtx,Portals,ClientAI,WasmOCR,SpeechSTT,OfflineJournal t3;
    class APIGateway,AuthFilter,Routers,R_Models,R_Tx,R_Market,R_Health,R_Notif,R_User t4;
    class MLSingleton,Models,M1,M2,M3,M4,M5,M6,M7,M8,M9 t5;
    class DBRouter,CloudDB,SupabasePG,RLS,Tables,LocalDB,SQLiteDB t6;
```

### 2.1 The 6-Phase Architectural Walkthrough

To understand the system flow at a glance:

1. **Phase 1: Multimodal Ingestion (Field Ergonomics)**
   The informal worker interacts without complex menus: shaking the phone while driving or wearing gloves, taking a camera photo of a fuel slip, speaking in native Hindi/Marathi/Hinglish, or tapping the 4x2 Android home-screen widget.
2. **Phase 2: Hardware Filtering & Native OS Services**
   The native Android accelerometer computes real-time normalized G-force ($> 2.7\text{G}$) requiring two directional reversals within 650 ms to reject false triggers. `AndroidTtsBridge.java` binds OS-level speech synthesis to the WebView, while `ShiftTrackerService.java` maintains lock-screen access.
3. **Phase 3: Capacitor 8 Native-Web IPC**
   Sensor triggers dispatch zero-navigation custom events (`setu-open-voice`) into the WebView. Pending intents for ledger entries route with `FLAG_IMMUTABLE` and are consumed immediately (`intent.setAction(null)`) to prevent duplicate triggers on device rotation.
4. **Phase 4: Client-Side Processing & Offline Journaling**
   React 18 orchestrates state across 6 portals (Home, Kaam, Dhan, Sehat, Kaushal, Haq). Receipts are processed on-device using WebAssembly `tesseract.js 7.0` to preserve privacy. Transactions are committed instantly to `localStorage` / IndexedDB using unique `client_tx_id` keys.
5. **Phase 5: FastAPI Microservice Gateway & AI/ML Inference**
   The client communicates over HTTPS with a Python 3.11 FastAPI gateway authenticated via Supabase JWT tokens. Requests are routed to an ensemble of 10 specialized ML models (M1–M10) executing in $< 30\text{ ms}$, plus FAISS dense vector search over official government gazettes with 0.0% hallucination.
6. **Phase 6: Resilient Cloud Persistence with Zero-Crash Fallback**
   Transactions are persisted to remote Supabase PostgreSQL protected by Row-Level Security (RLS). If cloud connectivity is lost, FastAPI automatically routes to a local SQLite database (`fairwork_setu.db`), and the client queues entries locally for idempotent synchronization when reconnected.

---

## 3. Deep-Dive: The 6 System Design Tiers

### 3.1 Tier 1: Native Android Hardware & Background Services
- **Hardware Shake-to-Log Physics (`MainActivity.java`):** Normalized Earth G-force calculated at 60 Hz:
  $$gForce = \frac{\sqrt{x^2 + y^2 + z^2}}{9.80665}$$
  Multi-peak detection demands $\ge 2$ peaks $> 2.7\text{ G}$ within 650 ms separated by $\ge 160\text{ ms}$, followed by a 2500 ms cooldown to reject pocket jostles. Haptic feedback emitted via `Vibrator` (180 ms pulse).
- **Native Android TextToSpeech Bridge (`AndroidTtsBridge.java`):** Binds Android OS `android.speech.tts.TextToSpeech` into Capacitor WebView via `@JavascriptInterface` (`AndroidTTS`), overcoming Android WebView's lack of standard W3C `SpeechSynthesis`.
- **Lock-Screen Shift Tracker (`ShiftTrackerService.java`):** Android foreground sticky service (`START_STICKY`) marked `NotificationCompat.VISIBILITY_PUBLIC` on `setu_shift_tracker` channel with 1-tap income, expense, and voice buttons directly accessible on lock screen.
- **Home Card AppWidget (`QuickEntryWidgetProvider.java`):** 4x2 `RemoteViews` widget launching ledger modals via immutable `PendingIntent`.
- **Quick Settings Tile (`SetuQuickTileService.java`):** Android control drawer tile with `startActivityAndCollapse()`.

---

### 3.2 Tier 2: Capacitor 8 Hybrid Bridge & IPC Layer
- **Bridge Coordination:** [`MainActivity.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/MainActivity.java) extends Capacitor `BridgeActivity`.
- **Ghost Intent Protection:** Immediately invokes `intent.setAction(null); setIntent(intent);` after routing deep links to avoid accidental re-execution on orientation change.
- **Zero-Navigation Event Dispatch:** Fires `window.dispatchEvent(new CustomEvent('setu-open-voice'))` into WebView without page reloads.

---

### 3.3 Tier 3: Frontend Presentation & Client-Side Intelligence
- **Framework:** React 18.3, TypeScript 5.7, Vite 7.3, Tailwind CSS 3.4.
- **Liquid Glass Navigation Dock:** Houses the 6 primary portals (`/home`, `/kaam`, `/dhan`, `/sehat`, `/kaushal`, `/haq`).
- **Client-Side Multimodal OCR:** `tesseract.js 7.0` running in a WebAssembly Web Worker extracts totals and categories from receipts on-device without remote image uploads.
- **Web TTS Polyfill:** `src/lib/androidTtsPolyfill.ts` intercepts Web Speech API calls and routes them through `window.AndroidTTS`.
- **Offline Caching:** `localStorage` / IndexedDB store offline records with idempotent delta syncing.

---

### 3.4 Tier 4: Application API Gateway (FastAPI)
- **Engine:** Python 3.11, FastAPI 0.115, Uvicorn 0.34 with Pydantic v2 schemas.
- **JWT Authentication:** `auth.py` validates Supabase Bearer tokens (HS256) and extracts user ID claims (`sub`).
- **Modular Routers:** `/api/models`, `/api/v1/transactions`, `/api/v1/marketplace`, `/api/v1/health`, `/api/v1/notifications`, `/api/users`, `/api/auth`.

---

### 3.5 Tier 5: Specialized AI/ML Inference Pipeline & Vector Store
- **Model 1 (Expense Classification):** `SGDClassifier` + Modified Huber Loss + `TfidfVectorizer` (< 15 ms, 94.2% accuracy).
- **Model 2 (Income Forecasting):** `RandomForestRegressor` (100 Trees + Lag Features, $R^2 \ge 0.88$, MAE < ₹68).
- **Model 3 (Anomaly Detection):** `IsolationForest` (Contamination = 0.05, ROC-AUC: 0.93).
- **Model 4 (Voice Recognition):** Continuous speech recognizer / OpenAI Whisper Tiny.
- **Model 5 (Entity Extraction):** Regex engine + semantic normalizer (< 8 ms).
- **Model 6 (Job Matching):** `SentenceTransformers` (`all-MiniLM-L6-v2`) with cosine distance ranking (Top-5 precision: 91.5%).
- **Model 7 (Skill Recommendation):** Vector search across NCVET NOS course catalog.
- **Model 8 (Grounded Welfare RAG):** `FAISS` vector store (`IndexFlatIP`) indexing verified government welfare PDFs with 0.0% hallucination rate.
- **Model 9 (Financial Stability Scorer):** 5-factor weighted educational regressor (0–100 index).

---

### 3.6 Tier 6: Data Persistence & Cloud Storage
- **Primary:** Supabase PostgreSQL with connection pooling (`pool_size=10, max_overflow=20`).
- **Fallback:** Local SQLite engine (`fairwork_setu.db`) ensuring zero crashes during offline dev/test.
- **Security:** Strict Row-Level Security (RLS) on all 8 tables (`profiles`, `transactions`, `service_profiles`, `service_bookings`, `job_applications`, `haq_cases`, `saved_health_items`, `notification_preferences`).

---

## 4. Specialized Subsystem Architecture Diagrams

### 4.1 Android Hardware Ergonomics & Audio TTS Bridge

```mermaid
flowchart LR
    subgraph HardwareSensors ["Device Hardware Layer"]
        Acc["Accelerometer Sensor"]
        Speaker["Phone Audio Speaker"]
    end

    subgraph NativeJava ["Native Android Subsystem (android/app/...)"]
        MainAct["MainActivity.java<br/><code>SensorEventListener</code>"]
        ShakeEngine["Multi-Peak Detector<br/>• Threshold: 2.7G<br/>• Window: 650ms<br/>• Cooldown: 2500ms"]
        TTS["AndroidTtsBridge.java<br/><code>android.speech.tts.TextToSpeech</code>"]
        Shift["ShiftTrackerService.java<br/><code>START_STICKY</code> Foreground"]
        Widget["QuickEntryWidgetProvider.java<br/><code>RemoteViews</code> 4x2 Card"]
        Tile["SetuQuickTileService.java<br/>Quick Settings Tile"]
    end

    subgraph CapacitorIPC ["Capacitor WebView Bridge Layer"]
        JSInterface["@JavascriptInterface AndroidTTS"]
        JSEval["evaluateJavascript()"]
    end

    subgraph ReactApp ["React Web Client Runtime"]
        DOMEvent["window.addEventListener('setu-open-voice')"]
        TTSPoly["androidTtsPolyfill.ts<br/>(window.speechSynthesis)"]
    end

    Acc --> MainAct --> ShakeEngine
    ShakeEngine -->|"On Valid Shake"| JSEval
    TTS --> Speaker
    MainAct -->|"addJavascriptInterface"| JSInterface
    Shift & Widget & Tile -->|"PendingIntent"| MainAct
    MainAct --> JSEval

    JSEval -->|"CustomEvent"| DOMEvent
    JSInterface -->|"Polyfill Callbacks"| TTSPoly
```

---

### 4.2 Client-Side Multimodal OCR & Offline Sync Pipeline

```mermaid
flowchart TD
    subgraph Capture ["Receipt Ingestion Flow"]
        InputSnap["📸 Camera Bill / Fuel Slip Capture<br/><code>input type='file' capture='environment'</code>"]
    end

    subgraph WasmEngine ["Client-Side WebAssembly Processing (Browser Thread)"]
        BlobURL["URL.createObjectURL(file)<br/>Instant Visual Preview"]
        Worker["Tesseract.js 7.0 Worker Thread<br/>Optical Character Recognition"]
        RegexEngine["Receipt Regex Parser<br/>• Matches: 'total', 'cash paid', 'net payable'<br/>• Currency regex: ₹ / INR / Rs.<br/>• Keyword classification (Fuel, Dhaba, Garage)"]
        
        InputSnap --> BlobURL
        InputSnap --> Worker --> RegexEngine
    end

    subgraph UIConfirm ["Verification Modal (TransactionModal.tsx)"]
        PreFill["Pre-fills Amount, Category & Description"]
        UserVerify["Worker Reviews & Adjusts Values"]
        Commit["Worker Taps 'Confirm' (पक्का करें)"]
        
        RegexEngine --> PreFill --> UserVerify --> Commit
    end

    subgraph StoragePipeline ["Dual-Store Persistence Pipeline"]
        LocalStore["localStorage (setu_transactions_v2)<br/>Instant Local Write"]
        SyncEngine["syncTransactionsWithCloud()<br/>Delta Synchronization"]
        RemoteDB[("Supabase PostgreSQL<br/><code>transactions</code> table")]

        Commit --> LocalStore
        LocalStore --> SyncEngine
        SyncEngine -->|"POST /api/v1/transactions with client_tx_id"| RemoteDB
    end
```

---

### 4.3 FastAPI Microservice Gateway & ML Service Orchestration

```mermaid
flowchart TD
    subgraph ClientReq ["Inbound HTTP Requests"]
        Req["HTTP POST / GET<br/>Headers: Authorization: Bearer <Supabase_JWT>"]
    end

    subgraph GatewayCore ["FastAPI Core (ml_service/main.py)"]
        CORS["CORSMiddleware (allow_origins=[*])"]
        AuthFilter["auth.py: get_current_user<br/>• Decodes Supabase JWT<br/>• Validates sub claim"]
    end

    Req --> CORS --> AuthFilter

    subgraph Routers ["API Routers"]
        R_AI["ai_models_router.py (/api/models)"]
        R_Trans["transactions_router.py (/api/v1/transactions)"]
        R_Market["marketplace.py (/api/v1/marketplace)"]
        R_Health["health_service.py (/api/v1/health)"]
        R_Notif["notifications_router.py (/api/v1/notifications)"]
        R_User["user_router.py & auth_router.py"]
    end

    AuthFilter --> R_AI & R_Trans & R_Market & R_Health & R_Notif & R_User

    subgraph MLService ["AIModelsService (ai_models_service.py)"]
        Singleton["AIModelsService Singleton"]
        Embedder["Shared SentenceTransformer<br/>('all-MiniLM-L6-v2', 384 Dim)"]
    end

    R_AI --> Singleton
    Singleton --- Embedder

    subgraph MLArtifacts ["Loaded ML Models & Artifacts (model_codes/)"]
        M1_Art["M1: expense_classifier.joblib<br/>(SGDClassifier + TfidfVectorizer)"]
        M2_Art["M2: income_forecaster.joblib<br/>(RandomForestRegressor)"]
        M3_Art["M3: anomaly_detector.joblib<br/>(IsolationForest + Imputer)"]
        M6_Art["M6: jobs.csv<br/>(Dense Cosine Job Matcher)"]
        M7_Art["M7: NCVET Catalog<br/>(Course Recommendation Index)"]
        M8_Art["M8: FAISS Vector Index<br/>(faiss.IndexFlatIP + Scheme Chunks)"]
    end

    Singleton --> M1_Art & M2_Art & M3_Art & M6_Art & M7_Art & M8_Art
```

---

### 4.4 Grounded Welfare & Health RAG Subsystem

```mermaid
flowchart TD
    subgraph Document_Ingestion ["Official Government & Health Knowledge Base"]
        G1["Official e-Shram Gazette PDFs"]
        G2["PM-SYM Pension Scheme Guidelines"]
        G3["PM-SVANidhi Micro-Credit Rules"]
        G4["Ayushman Bharat PM-JAY Portals"]
        G5["Public Health First-Aid Protocols"]
    end

    subgraph Vector_Indexing ["Offline Vector Pipeline"]
        Chunker["Semantic Recursive Text Splitter (500 tokens)"]
        Embedder["SentenceTransformers (all-MiniLM-L6-v2, 384 Dim)"]
        FAISSIndex[("FAISS Vector Index<br/><code>IndexFlatIP (Cosine Similarity)</code>")]
        
        G1 & G2 & G3 & G4 & G5 --> Chunker --> Embedder --> FAISSIndex
    end

    subgraph Query_Serving ["Online Query Execution (<85ms)"]
        UserQ["Worker Query (Spoken or Typed)<br/><i>'Accident hone par e-shram se kitna paisa milega?'</i>"]
        QueryEmbed["Query Embedding (384 Dim Vector)"]
        KNN["FAISS Dense k-NN Search (Top-k = 4)"]
        Threshold{"Cos Sim >= 0.62?"}
        Attribution["Attribution & Answer Assembly<br/>Includes: Scheme Name, Benefit Amount,<br/>Official Helpline (14434), Official Portal URL"]
        Fallback["Grounded Fallback<br/><i>'No verified government record found. Please dial national helpline 14434.'</i>"]
        
        UserQ --> QueryEmbed --> KNN --> FAISSIndex
        FAISSIndex --> KNN --> Threshold
        Threshold -->|"Yes"| Attribution
        Threshold -->|"No (Out of Corpus)"| Fallback
    end
```

---

## 5. End-to-End Execution Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Worker as 🛵 Informal / Gig Worker
    participant Acc as 📳 Sensor.TYPE_ACCELEROMETER
    participant MainAct as ☕ MainActivity.java
    participant TTS as 🗣️ AndroidTtsBridge.java
    participant React as ⚛️ React (TabLayout / Modal)
    participant Fast as 🐍 FastAPI (ml_service)
    participant ML as 🧠 AIModelsService (M1, M3, M5)
    participant DB as 🐘 Supabase PostgreSQL / LocalStorage

    Worker->>Acc: Physical phone shake gesture
    Acc->>MainAct: onSensorChanged(SensorEvent)
    MainAct->>MainAct: Multi-peak test: 2 peaks > 2.7G in 650ms? (Passed)
    MainAct->>MainAct: Vibrator.vibrate(180ms pulse)
    MainAct->>React: evaluateJavascript("window.dispatchEvent(new CustomEvent('setu-open-voice'))")
    React->>TTS: AndroidTTS.speak("Boliye, kya kharcha hua?", "hi-IN", 0.95)
    TTS-->>Worker: Audible voice prompt plays via Android TTS engine
    Worker->>React: Spoken utterance: "Bike me 200 ka petrol bharwaya"
    React->>Fast: POST /api/models/extract-transaction {text: ...}
    Fast->>ML: M5 Entity Parser extracts {amount: 200, is_income: false}
    Fast->>ML: M1 SGDClassifier predicts category: "travel_fuel" (conf: 0.98)
    Fast->>ML: M3 IsolationForest tests anomaly: score = -0.15 (Normal)
    Fast-->>React: Returns {amount: 200, category: "travel_fuel", is_anomaly: false}
    React->>Worker: Displays Confirmation Card: [₹200 | Fuel | Pukka Karein?]
    Worker->>React: Taps "Confirm" (Pukka Karein)
    React->>DB: Stores in localStorage (instant offline journal)
    React->>Fast: POST /api/v1/transactions {client_tx_id, amount: 200, ...}
    Fast->>DB: Upserts into Supabase `transactions` table (RLS verified)
    DB-->>Fast: 201 Created
    Fast-->>React: Sync acknowledged
    React->>Fast: POST /api/models/income-forecast
    Fast->>ML: M2 RandomForestRegressor updates 7-day expected cashflow
    Fast-->>React: Updated 7-Day Income Projection & Stability Index
    React-->>Worker: UI updates ledger cards, cash balance, and charts
```

---

## 6. Database Schema & Entity-Relationship (ER) Architecture

```mermaid
erDiagram
    PROFILES ||--o{ TRANSACTIONS : "logs"
    PROFILES ||--o| SERVICE_PROFILES : "registers"
    PROFILES ||--o{ SERVICE_BOOKINGS : "creates/receives"
    PROFILES ||--o{ JOB_APPLICATIONS : "applies"
    PROFILES ||--o{ HAQ_CASES : "files"
    PROFILES ||--o{ SAVED_HEALTH_ITEMS : "bookmarks"
    PROFILES ||--o| NOTIFICATION_PREFERENCES : "configures"

    PROFILES {
        uuid id PK "auth.users(id)"
        string phone_number UK
        string email
        string full_name
        string work_type "driver / delivery / construction / vendor"
        string city_key
        numeric pay_min
        numeric pay_max
        string preferred_language "hi / mr / en"
        text skills
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK "gen_random_uuid()"
        uuid user_id FK "REFERENCES profiles(id)"
        string client_tx_id "Offline idempotency key"
        string type "income | expense"
        numeric amount "CHECK amount > 0"
        string category "travel_fuel, food, health, etc."
        text description
        string source "manual | voice | quick"
        timestamp timestamp
    }

    SERVICE_PROFILES {
        uuid id PK
        uuid user_id FK "REFERENCES profiles(id) UNIQUE"
        string display_name
        string trade "plumbing / electrical / mechanic"
        numeric indicative_price
        string pricing_type "visit_fee | hourly | fixed"
        boolean is_available
    }

    SERVICE_BOOKINGS {
        uuid id PK
        uuid worker_id FK "REFERENCES profiles(id)"
        uuid customer_id FK "REFERENCES profiles(id)"
        string customer_name
        string customer_phone
        text customer_address
        string booking_date
        string status "pending | confirmed | completed | cancelled"
        numeric estimated_price
    }

    JOB_APPLICATIONS {
        uuid id PK
        string job_id
        uuid applicant_id FK "REFERENCES profiles(id)"
        string status "submitted | under_review | accepted"
        text cover_note
        timestamp created_at
    }

    HAQ_CASES {
        uuid id PK
        uuid user_id FK "REFERENCES profiles(id)"
        string case_number UK
        string platform_name "Zomato / Swiggy / Uber / Blinkit"
        string deactivation_reason
        string status "draft | submitted | resolved"
        numeric loss_of_income_est
        text appeal_text
    }

    SAVED_HEALTH_ITEMS {
        uuid id PK
        uuid user_id FK "REFERENCES profiles(id)"
        string item_id
        string item_type "hospital | scheme | protocol"
        string title
        text notes
    }

    NOTIFICATION_PREFERENCES {
        uuid user_id PK "REFERENCES profiles(id)"
        boolean in_app_enabled
        boolean browser_push_enabled
        boolean android_native_enabled
        boolean quiet_hours_enabled
        string quiet_hours_start "22:00"
        string quiet_hours_end "07:00"
    }
```

---

## 7. Non-Functional Requirements (NFRs) & Security Standards

* **Latency Budgets:** FCP $< 400\text{ ms}$, bundle $< 1.8\text{ MB}$, M1 $< 15\text{ ms}$, M2 $< 25\text{ ms}$, M6 $< 40\text{ ms}$, M8 $< 85\text{ ms}$.
* **DPDP Act 2023 Compliance:** Zero Aadhaar, biometric, or continuous GPS data collection. Audio processed ephemerally in RAM and cleared.
* **Non-Punitive Stability Score:** Model 9 generates an educational financial health score (0–100) never shared with commercial credit agencies.
* **Zero Hallucination:** Medical & welfare queries rely solely on verified government gazettes; out-of-domain queries route to national helplines (108 / 14434).

---

## 8. Codebase Traceability Matrix

| Component | File Path | Key Classes & Methods |
|---|---|---|
| **Android Shake Sensor & IPC** | [`android/app/src/main/java/com/fairwork/setu/MainActivity.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/MainActivity.java) | `MainActivity`, `onSensorChanged`, `SHAKE_THRESHOLD_GRAVITY = 2.7F` |
| **Native TextToSpeech Bridge** | [`android/app/src/main/java/com/fairwork/setu/AndroidTtsBridge.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/AndroidTtsBridge.java) | `AndroidTtsBridge`, `@JavascriptInterface speak()` |
| **Lock-Screen Shift Tracker** | [`android/app/src/main/java/com/fairwork/setu/ShiftTrackerService.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/ShiftTrackerService.java) | `ShiftTrackerService`, `START_STICKY`, `NotificationCompat` |
| **Home-Screen Card Widget** | [`android/app/src/main/java/com/fairwork/setu/QuickEntryWidgetProvider.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/QuickEntryWidgetProvider.java) | `QuickEntryWidgetProvider`, `RemoteViews`, `PendingIntent` |
| **Quick Settings Drawer Tile** | [`android/app/src/main/java/com/fairwork/setu/SetuQuickTileService.java`](file:///d:/5th%20sem/AIML/project/android/app/src/main/java/com/fairwork/setu/SetuQuickTileService.java) | `SetuQuickTileService`, `startActivityAndCollapse()` |
| **TTS Web Polyfill** | [`src/lib/androidTtsPolyfill.ts`](file:///d:/5th%20sem/AIML/project/src/lib/androidTtsPolyfill.ts) | `initAndroidTtsPolyfill()`, `window.AndroidTTS` polyfill |
| **Receipt OCR Scanner** | [`src/components/TransactionModal.tsx`](file:///d:/5th%20sem/AIML/project/src/components/TransactionModal.tsx) | `parseReceiptOcr()`, `Tesseract.recognize(file, 'eng')` |
| **Voice State Machine** | [`src/services/voiceAssistantService.ts`](file:///d:/5th%20sem/AIML/project/src/services/voiceAssistantService.ts) | `processUserUtterance()`, `detectSpokenLanguage()` |
| **Client AI & Fallbacks** | [`src/services/aiModelsClient.ts`](file:///d:/5th%20sem/AIML/project/src/services/aiModelsClient.ts) | `classifyExpenseText()`, `fallbackClassifyExpense()` |
| **FastAPI Core Gateway** | [`ml_service/main.py`](file:///d:/5th%20sem/AIML/project/ml_service/main.py) | `app = FastAPI()`, CORS middleware, `init_db()` |
| **AI Models Router** | [`ml_service/ai_models_router.py`](file:///d:/5th%20sem/AIML/project/ml_service/ai_models_router.py) | `/api/models/expense-classify`, `/income-forecast`, `/anomaly-detect` |
| **AI Models Service Engine** | [`ml_service/ai_models_service.py`](file:///d:/5th%20sem/AIML/project/ml_service/ai_models_service.py) | `AIModelsService`, `_load_models()`, `get_shared_embedder()` |
| **Database Router & Engine** | [`ml_service/database.py`](file:///d:/5th%20sem/AIML/project/ml_service/database.py) | `create_engine()`, PostgreSQL pool & SQLite fallback |
| **Relational Schema & RLS** | [`ml_service/schema.sql`](file:///d:/5th%20sem/AIML/project/ml_service/schema.sql) | DDL for 8 tables, indexes, and Row Level Security policies |
| **React Navigation Shell** | [`src/layouts/TabLayout.tsx`](file:///d:/5th%20sem/AIML/project/src/layouts/TabLayout.tsx) | Dock navigation, `setu-open-voice` event listener |
