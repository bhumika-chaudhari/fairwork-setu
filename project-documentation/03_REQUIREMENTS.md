# Requirements Specification: Setu (सेतु)

## 1. Functional Requirements (FR)

### FR-1: User Registration & Authentication
- The worker shall register using a mobile number.
- The system shall support OTP verification for secure worker authentication.
- The worker shall select their preferred UI language: **Hindi, Marathi, or English**, with the ability to switch dynamically at any time.
- The system shall create a persistent, encrypted worker profile.

### FR-2: Worker Profile & Digital Portfolio
The worker shall be able to record:
- Full Name / Nickname
- City and Locality
- Primary & Secondary Occupations (e.g. Electrician, Auto Driver, Delivery Partner)
- Core Skills & Years of Experience
- Work Availability (Full-time, Part-time, Shifts)
- Preferred Daily Pay Rate and Maximum Travel Radius (km)
- Profile creation shall support both manual visual form input and conversational voice dictation.

### FR-3: Conversational Vernacular Voice Assistant
- The worker shall be able to speak naturally in Hindi, Marathi, or Hinglish.
- The system shall support real-time continuous speech-to-text recognition via native audio hooks.
- The system shall parse compound conversational utterances (e.g., *"Aaj 800 kamaye par 150 ka tel bharwaya"*), extracting amounts, dates, and categories into structured items simultaneously.
- The system shall display an interactive confirmation card before committing any voice transaction to the ledger.

### FR-4: Dual-Stream Cashflow Tracking (Dhan Setu)
- The worker shall be able to log income with source tags (fare, tip, daily wage, bonus).
- The worker shall be able to log expenses with automatic ML category classification into 9 standard categories:
  `travel_fuel`, `food`, `tools_maintenance`, `health`, `rent`, `utilities`, `education`, `loan_repayment`, `other`.
- The system shall compute and display net daily, weekly, and monthly cashflow:
  $$\text{Net Income} = \sum \text{Income} - \sum \text{Expenses}$$

### FR-5: 7-Day Predictive Income Forecasting
- The system shall forecast daily expected earnings for the next 7 days based on the worker's historical cashflow and day-of-week cyclical demand patterns.
- The forecast shall display an 80% confidence interval band rather than a single misleading static number.

### FR-6: Emergency Savings Buffer & Goals
- The worker shall be able to define a target 30-day emergency subsistence fund.
- The system shall track daily progress and recommend small, achievable daily saving amounts based on the day's forecasted earnings.

### FR-7: Non-Punitive Financial Stability Score
- The system shall compute an educational financial health score (0–100) based on 5 weighted pillars:
  1. Income Regularity (25%)
  2. Savings Surplus Rate (25%)
  3. Emergency Buffer Progress (20%)
  4. Work-Day Consistency (15%)
  5. Expense Volatility (15%)
- The score shall be strictly informational and educational; it shall **never** be shared with commercial lenders or used for loan denial.

### FR-8: Semantic Work Discovery & Gig Matching (Kaam Setu)
- The system shall match workers to nearby gig opportunities using dense vector semantic similarity (**SentenceTransformers**).
- Each job recommendation shall display an explainable match percentage and transparent reasoning (e.g. *"92% Match: Requires domestic wiring and motor pump troubleshooting"*).
- The worker shall be able to express interest or apply with a 1-tap action.

### FR-9: Social Security, Welfare & Legal Advisory (Haq Setu)
- The worker shall be able to query eligibility criteria for central and state government welfare schemes (e-Shram, PM-SYM pension, PM-SVANidhi micro-credit, Ayushman Bharat, BOCW welfare boards).
- The system shall utilize Grounded Retrieval-Augmented Generation (RAG) with a **FAISS vector database** to provide 100% source-cited answers with official portal links.
- The system shall provide structured, printable legal grievance templates for wage non-payment or platform deactivation.

### FR-10: Android Home-Screen Card Widget
- The system shall provide an interactive 4x2 `AppWidgetProvider` card on the Android home screen (`QuickEntryWidgetProvider`).
- The widget shall expose three direct PendingIntent triggers:
  1. `[ ➖ Kharcha ]`: Opens the expense ledger modal.
  2. `[ ➕ Kamai ]`: Opens the income credit modal.
  3. `[ 🎙️ Bolkar Log Karein ]`: Immediately awakens the voice assistant.

### FR-11: Live Lock-Screen Shift Tracker Foreground Service
- The system shall provide a native Android Foreground Sticky Service (`ShiftTrackerService`) that activates during work shifts.
- The service shall maintain an ongoing notification categorized with `VISIBILITY_PUBLIC` and `setOngoing(true)` visible directly on the phone's lock screen.
- The notification shall expose 4 inline buttons without requiring the worker to unlock the phone:
  `[ ➕ Kamai ]` • `[ ➖ Kharcha ]` • `[ 🎙️ Bolkar ]` • `[ ⏹ End Shift ]`.

### FR-12: Hardware Accelerometer Sensor "Shake-to-Log"
- The system shall monitor the physical `Sensor.TYPE_ACCELEROMETER` in real time.
- The system shall implement a multi-peak direction-reversal physics algorithm requiring $gForce \ge 2.7\text{ G}$ across at least 2 consecutive peaks within a 650ms window.
- Upon detection, the phone shall emit a 180ms haptic vibration pulse and display the Voice Assistant overlay without full-page navigation.

### FR-13: Multimodal Camera Receipt & Bill Scanner
- The worker shall be able to capture fuel meter readings, roadside receipts, and parts slips using the device camera.
- The system shall process images client-side via **Tesseract.js WebAssembly** to extract numeric bill amounts, dates, and vendor categories.

### FR-14: Android Quick Settings Control Shade Tile
- The system shall provide a system tile in Android's top control drawer (`SetuQuickTileService`).
- Tapping the tile shall invoke `startActivityAndCollapse()` to launch the voice logger and collapse the notification shade in a single fluid gesture.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Edge Latency & Performance
- Expense classification (Model 1) shall return inferences in **< 20 milliseconds**.
- Income forecasting (Model 2) shall compute 7-day trajectories in **< 30 milliseconds**.
- Speech-to-text transcription shall stream with **< 150 milliseconds** perceived delay.
- The native Android APK cold launch time shall be under **1.2 seconds**.

### NFR-2: Mobile Device & OS Compatibility
- The native Android APK shall support **Android 7.0 (API Level 24 / Nougat) through Android 15 (API Level 35)**, covering over 99.2% of active Android smartphones in India.
- The application UI shall adapt responsively to screen sizes ranging from small 5.0-inch 720p budget devices to modern 6.7-inch OLED smartphones.

### NFR-3: Battery & Sensor Conservation
- Accelerometer listening shall be paused in `onPause()` to eliminate background battery drain when the app is minimized.
- The lock-screen shift tracker shall utilize `NotificationManager.IMPORTANCE_LOW` to prevent unnecessary screen wake-ups.

### NFR-4: Data Privacy & Security (DPDP Act, 2023)
- The system shall never request or store Aadhaar numbers, biometric templates, UPI PINs, bank passwords, or continuous live GPS trails.
- All network communications shall be strictly encrypted over HTTPS with TLS 1.3.
- Audio recordings shall be converted to text and immediately purged from RAM; raw audio shall never be stored without explicit informed consent.

### NFR-5: Accessibility & Low-Literacy Ergonomics
- All interactive touch targets shall meet a minimum bounding size of **48 × 48 dp**.
- Text contrast ratios shall strictly exceed **4.5:1** against backgrounds as per WCAG 2.1 AA standards.
- Critical actions shall be reinforced with tactile haptic pulses and distinct audio chimes (`playTap()`, `playSuccess()`).

### NFR-6: Offline Resilience
- The system shall cache active shift data and recent transactions in client-side **IndexedDB / LocalStorage**.
- Camera receipt OCR parsing and rule-based entity parsing shall execute fully client-side, permitting offline field logging that synchronizes when connectivity resumes.

### NFR-7: Safety & Emergency Interceptors
- The system shall never generate automated medical diagnoses or treatment regimens.
- Critical medical symptom queries shall immediately bypass AI generation and present direct calling cards for **108 (Ambulance)** and **112 (Emergency)**.

### NFR-8: Zero-Hallucination Welfare Compliance
- The RAG pipeline shall strictly cite verified government gazettes and official circulars for all scheme rules.
- If a query cannot be answered using official verified context, the model must declare uncertainty rather than generate plausible falsehoods.
