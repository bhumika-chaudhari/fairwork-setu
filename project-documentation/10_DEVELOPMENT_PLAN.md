# Development Plan: Setu (सेतु)

## 1. Phased Development Roadmap

The development of FairWork Setu followed a phased, modular engineering approach ensuring that each layer (ML models, web interfaces, and native Android hooks) was tested and audited independently before integration.

---

### Phase 1: Foundation & Data Architecture (Weeks 1–2)
* **Goals:**
  * Initialize repository structure and development environment.
  * Establish database contracts for users, transactions, jobs, and welfare schemes.
  * Implement phone-number OTP authentication flow.
* **Deliverables:**
  * Vite + React 18 + TypeScript frontend setup.
  * Python FastAPI backend with Pydantic v2 schemas.
  * Client-side persistent cache (IndexedDB / LocalStorage).

---

### Phase 2: Cashflow & Financial Intelligence (Weeks 3–4)
* **Goals:**
  * Build the **Dhan Setu** dual cashflow ledger (Kamai vs. Kharcha).
  * Train Model 1 (`SGDClassifier` with Modified Huber loss) for expense classification.
  * Train Model 2 (`RandomForestRegressor`) with lag features for 7-day income forecasting.
  * Implement Model 3 (`IsolationForest`) for accidental typo and outlier detection.
* **Deliverables:**
  * Cashflow dashboard with interactive income/expense charts.
  * 7-day forecast visualization with 80% confidence interval bands.
  * Non-punitive 5-factor Financial Stability Score engine.

---

### Phase 3: Conversational Voice AI (Weeks 5–6)
* **Goals:**
  * Integrate continuous speech recognition with Indic audio streaming.
  * Develop Model 5 (Compound Regex Entity Parser) for multi-item sentence splitting.
  * Build interactive visual confirmation cards for speech transactions.
* **Deliverables:**
  * Full-screen conversational Voice Assistant overlay (`UnifiedVoiceAssistantModal.tsx`).
  * Support for mixed Hindi, Marathi, and Hinglish vernacular phrases.

---

### Phase 4: Kaam Setu — Work Discovery & Semantic Matching (Weeks 7–8)
* **Goals:**
  * Ingest and generate hyper-local gig opportunities across urban clusters.
  * Deploy Model 6 (`SentenceTransformers` `all-MiniLM-L6-v2`) for dense vector matching.
* **Deliverables:**
  * Ranked job recommendation cards with explainable match percentages.
  * Travel radius filtering and 1-tap application submissions.

---

### Phase 5: Kaushal Setu — Skill Passport & Upskilling (Weeks 9–10)
* **Goals:**
  * Deploy Model 7 for NCVET National Occupational Standards (NOS) skill alignment.
  * Implement dynamic digital portfolio and PDF resume generator.
* **Deliverables:**
  * Digital Skill Passport card with verified work history.
  * Curated, free PMKVY / Skill India course recommendations.

---

### Phase 6: Sehat Setu — Health Triage & Grounded RAG (Weeks 11–12)
* **Goals:**
  * Build FAISS vector database over public health resources and verified government clinics.
  * Implement automated emergency interceptor for critical health symptoms.
* **Deliverables:**
  * Symptom self-checker with localized hospital discovery.
  * 1-tap emergency dialer cards for **108 (Ambulance)** and **112 (Emergency)**.

---

### Phase 7: Haq Setu — Social Security & Legal Rights (Weeks 13–14)
* **Goals:**
  * Index official government scheme gazettes (e-Shram, PM-SYM, PM-SVANidhi, Ayushman Bharat).
  * Build Grounded RAG search with zero hallucination guarantee.
* **Deliverables:**
  * Source-cited welfare eligibility screening.
  * Printable legal grievance templates for wage disputes.

---

### Phase 8: Android Native Packaging & Capacitor Bridge (Weeks 15–16)
* **Goals:**
  * Initialize Capacitor 8 native container (`com.fairwork.setu`).
  * Configure Android permissions (`RECORD_AUDIO`, `VIBRATE`, `FOREGROUND_SERVICE`, `POST_NOTIFICATIONS`).
  * Implement deep-link intent routing in `MainActivity.java`.
* **Deliverables:**
  * Compilable native Android APK targeting API Level 24 through 35.

---

### Phase 9: Mobile Hardware Ergonomics & Widgets (Weeks 17–18)
* **Goals:**
  * Implement 4x2 Home-Screen Card Widget (`QuickEntryWidgetProvider`, `RemoteViews`).
  * Implement Live Lock-Screen Shift Tracker Foreground Service (`ShiftTrackerService`).
  * Engineer the hardware accelerometer "Shake-to-Log" algorithm with multi-peak reversal physics.
  * Add Android Quick Settings Control Shade Tile (`SetuQuickTileService`).
* **Deliverables:**
  * Functional home-screen card widget with instant `➕ Kamai`, `➖ Kharcha`, and `🎙️ Bolkar` actions.
  * Lock-screen persistent notification controller.
  * Vibration-backed double-shake gesture trigger.

---

### Phase 10: Multimodal OCR Scanner & Final Quality Audit (Weeks 19–20)
* **Goals:**
  * Integrate client-side Tesseract.js WebAssembly OCR worker for paper receipts.
  * Eliminate false shake triggers with 2.7G threshold and 2500ms cooldown.
  * Conduct automated ML unit test suites and comprehensive documentation.
* **Deliverables:**
  * Working camera receipt scanner auto-populating amounts and categories.
  * Production debug APK (`app-debug.apk`, 10.18 MB).
  * 15 comprehensive technical specifications and Academic Project Report.
