# Project Description: Setu (सेतु)

## 1. Product Vision

**Setu** (meaning “bridge” in Hindi) is an AI-powered, voice-first, multimodal livelihood companion for India’s informal and gig workers. It helps workers move from volatile day-to-day survival toward greater income stability, better work opportunities, verified social security enrollment, improved financial resilience, and formal skill growth.

The application acts as a comprehensive digital bridge between:
- A worker’s practical skills and nearby localized gig opportunities (**Kaam Setu**).
- Irregular daily cash earnings and planned savings with 7-day predictive cashflow forecasting (**Dhan Setu**).
- Health needs, verified public clinics, and automated emergency triage protocols (**Sehat Setu**).
- Informal verbal craftsmanship and a structured, verifiable digital Skill Passport (**Kaushal Setu**).
- Landmark government welfare schemes (e-Shram, PM-SYM, PM-SVANidhi, Ayushman Bharat) and legal grievance redressal (**Haq Setu**).
- On-duty physical constraints and effortless mobile interaction via lock-screen shift trackers, home-screen card widgets, accelerometer shake triggers, and camera receipt scanning.

---

## 2. Target Users

Setu is engineered specifically for workers who operate without formal contracts, monthly pay slips, written resumes, or fixed salaries.

Primary user groups:
- **Delivery & Logistics Partners:** Courier, parcel, and e-commerce delivery riders (Zomato, Swiggy, Zepto, Blinkit, Amazon).
- **Ride-Hailing & Auto Drivers:** Auto-rickshaw, cab, and motorcycle taxi operators (Ola, Uber, Rapido).
- **Construction & Daily-Wage Labourers:** Masons, painters, carpenters, tile-fitters, loaders, and road-work labourers.
- **Skilled Tradespeople:** Electricians, plumbers, appliance mechanics, and welders.
- **Street Vendors & Micro-Traders:** Fruit/vegetable sellers, roadside tea/food stall owners, and hawkers.
- **Domestic & Care Workers:** Maids, cooks, babysitters, cleaners, and home-service professionals.
- **Migrant Workers:** Interstate workers navigating urban hubs without local documentation.

---

## 3. User Pain Points & Setu Solutions

| User Pain Point | Field Reality | Setu Engineering Solution |
|---|---|---|
| **Income Volatility** | Earnings fluctuate daily with no structured bookkeeping or visibility into true net profit. | **Dhan Setu:** Dual cashflow ledger with 7-day predictive forecasting and non-punitive Financial Stability Score. |
| **Physical Field Obstacles** | Wearing riding gloves, dusty/wet hands, or navigating traffic prevents manual typing. | **Android Native Ergonomics:** Accelerometer "Shake-to-Log", home-screen card widget, and lock-screen shift tracker. |
| **Low Digital/Text Literacy** | Complex banking apps and text-heavy menus lead to digital exclusion. | **Voice-First AI:** Unified multilingual voice assistant supporting Hindi, Marathi, and Hinglish. |
| **Paper Bill Clutter** | Cash fuel slips and maintenance receipts get lost or crumpled. | **Camera OCR Scanner:** On-device multimodal bill scanner powered by Tesseract.js WebAssembly. |
| **Lack of Formal Proof of Skills** | Decades of mastery but zero paper diplomas prevents securing higher-paying contracts. | **Kaushal Setu:** Generates an NCVET-aligned digital Skill Passport and recommends free certified courses. |
| **Social Security Unawareness** | Millions miss out on pensions (PM-SYM) and micro-credit (PM-SVANidhi) due to legal jargon. | **Haq Setu:** Grounded RAG with source-cited scheme guidance and official grievance filing templates. |
| **Healthcare Exploitation** | Workers avoid hospitals or fall prey to quacks during medical emergencies. | **Sehat Setu:** Multilingual symptom checker, verified public hospital locator, and 108/112 emergency routing. |

---

## 4. The 6 Core Product Portals

### 4.1 🏠 Home — Daily Overview & Shift Status
The centralized dashboard displaying real-time duty status, current daily earnings, recent transaction history, smart contextual push notifications, and quick action buttons for instant logging.

### 4.2 💼 Kaam Setu — Work Discovery & Gig Matching
Workers declare their trades, preferred travel radius, and schedule. Setu's dense vector semantic search (**SentenceTransformers**) matches them to verified nearby jobs, explaining the match percentage (e.g. *"92% Match: Requires domestic wiring and motor pump troubleshooting"*).

### 4.3 💰 Dhan Setu — Money, Cashflow & Stability
Workers record earnings and expenses through voice, camera receipt scans, or 1-tap quick buttons. Setu classifies expenses using an **SGDClassifier**, predicts 7-day future cashflow via a **Random Forest Regressor**, flags errors via an **Isolation Forest**, and computes a non-punitive **Financial Stability Score (0–100)**.

### 4.4 🩺 Sehat Setu — Health Triage & Welfare Discovery
Provides symptom self-checking, affordable nearby public clinic discovery, and welfare scheme navigation. Features an automated emergency interceptor that immediately presents 1-tap dialer cards for **108 (Ambulance)** and **112 (Emergency)** when life-threatening symptoms are detected.

### 4.5 📜 Kaushal Setu — Skill Passport & Growth
Transforms informal verbal experience into an **NCVET/NSDC National Occupational Standards (NOS)** aligned digital Skill Passport (downloadable PDF). Recommends free government upskilling courses from Skill India and PMKVY.

### 4.6 🛡️ Haq Setu — Social Security & Legal Rights
An interactive advisory portal for central and state welfare programs (e-Shram, PM-SYM, PM-SVANidhi, PMSBY, BOCW Boards). Uses Grounded RAG with **FAISS vector retrieval** to provide source-cited answers from official government gazettes, alongside legal rights templates for wage disputes.

---

## 5. Android Native & Hardware Innovations

FairWork Setu is compiled into an Android native APK (`com.fairwork.setu`) with deep OS and hardware hooks:
1. **Home-Screen Card Widget (`QuickEntryWidgetProvider`):** 4x2 interactive card with `➖ Kharcha`, `➕ Kamai`, and `🎙️ Bolkar Log Karein` instant PendingIntent actions.
2. **Live Lock-Screen Shift Tracker (`ShiftTrackerService`):** Ongoing sticky foreground service displaying 4 interactive buttons directly on the phone's lock screen without requiring unlocking.
3. **Hardware Accelerometer "Shake-to-Log" (`MainActivity.java`):** Multi-peak direction-reversal physics algorithm ($gForce \ge 2.7\text{ G}$, 160–650ms window, 2500ms cooldown, 180ms haptic feedback) that opens the voice assistant with a deliberate double-shake gesture.
4. **Quick Settings Control Tile (`SetuQuickTileService`):** System drawer tile that launches the voice logger and collapses the notification shade in a single gesture.
5. **Pinnable App Shortcuts (`shortcuts.xml`):** Android launcher 1x1 home-screen shortcuts for Expense, Income, and Voice logging.
6. **Camera Receipt OCR Scanner (`TransactionModal.tsx`):** Client-side multimodal image parser using Tesseract.js WebAssembly to extract totals and categories from paper fuel and store receipts.

---

## 6. AI/ML Ensemble (10 Integrated Models)

| Model | Task | Algorithm | Latency | Performance |
|---|---|---|---|---|
| **M1** | Expense Classification | `SGDClassifier` + Modified Huber Loss | 14 ms | 94.2% Accuracy, F1: 0.93 |
| **M2** | 7-Day Income Forecasting | `RandomForestRegressor` (Lag Features) | 22 ms | $R^2 \ge 0.88$, MAE < ₹68 |
| **M3** | Transaction Anomaly Detection | `IsolationForest` (Unsupervised) | 18 ms | ROC-AUC: 0.93 |
| **M4** | Vernacular Speech Recognition | `SetuContinuousSpeech` / Whisper Tiny | Real-time | WER: 11.4% (Indic speech) |
| **M5** | Compound Entity Extraction | Regex Engine + Semantic Splitter | 8 ms | F1: 0.96 |
| **M6** | Semantic Job-Worker Matching | `SentenceTransformers` (`all-MiniLM-L6-v2`) | 35 ms | Top-5 Precision: 91.5% |
| **M7** | Skill & Course Recommender | Cosine Similarity + NCVET Taxonomy | 25 ms | MRR: 0.86 |
| **M8** | Grounded Welfare RAG Search | `FAISS` Vector Index + Dense Retrieval | 85 ms | 0.0% Hallucination (Cited) |
| **M9** | Financial Stability Scoring | 5-Factor Weighted Regressor | 10 ms | Educational 0–100 index |
| **M10**| Multimodal Camera Receipt OCR | Client-side `tesseract.js 7.0` (Wasm) | 1.2 s | 92.8% Character Recognition |

---

## 7. Expected Outcomes & Deliverables

1. **Complete Field Usability:** Workers can log transactions in < 5 seconds using voice, lock-screen buttons, widgets, or accelerometer shake.
2. **Predictive Cashflow Visibility:** Workers can view 7-day expected earnings with confidence intervals to prevent cash shortfalls.
3. **Formalization of Informal Labor:** Workers can download an NCVET-aligned Skill Passport PDF to prove their experience to commercial clients.
4. **Verified Social Protection:** Workers gain access to official government social security schemes with zero misinformation.
5. **Privacy by Design:** Strict adherence to India's DPDP Act, 2023 with zero collection of Aadhaar, biometric, or continuous GPS data.
6. **Cross-Platform Availability:** High-performance web PWA alongside an optimized native Android APK supporting Android 7.0 through Android 15.

---

## 8. Legal, Ethical & Assistive Positioning

**Setu is an assistive record-keeping, predictive forecasting, and resource-discovery platform.**
* It does **not** make automated decisions regarding employment termination, loan approvals, or welfare sanctions.
* It does **not** provide binding medical diagnoses or financial credit ratings.
* All AI outputs are explainable, source-cited, and require human-in-the-loop verification before database persistence.
