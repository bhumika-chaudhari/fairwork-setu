# Agent Handoff Instructions: Setu (सेतु)

This document provides definitive guidance for any AI agent or software engineer working on **FairWork Setu**, ensuring architectural consistency, safety compliance, and preservation of core innovations.

---

## 1. Project Identity & Purpose

* **Name:** FairWork Setu (सेतु)
* **Tagline:** *Aapke Kaam, Dhan, Sehat aur Haq ka Digital Sathi*
* **Target Audience:** Over 450 million informal and gig workers in India (delivery riders, auto/cab drivers, construction labourers, domestic staff, street vendors).
* **Core Philosophy:** Voice-first, mobile-first, privacy-by-design, and assistive (never decisive).

---

## 2. Locked Application Scope

The application comprises **6 Core Portals** and **6 Android Native Innovations**:

### The 6 Portals
1. **🏠 Home (`/home`):** Real-time shift status, daily earnings ticker, smart reminders.
2. **💼 Kaam Setu (`/kaam`):** Semantic gig work matching with explainable match percentages.
3. **💰 Dhan Setu (`/dhan`):** Dual-stream cash ledger, 7-day forecast, stability scoring.
4. **🩺 Sehat Setu (`/sehat`):** Multilingual symptom checker, 108 emergency dialer, hospital locator.
5. **📜 Kaushal Setu (`/kaushal`):** NCVET-aligned digital Skill Passport, free training courses.
6. **🛡️ Haq Setu (`/haq`):** Grounded RAG for welfare schemes (e-Shram, PM-SYM) and grievance templates.

### The 6 Android Native & Hardware Innovations
1. **Home-Screen Card Widget:** 4x2 `RemoteViews` interactive card (`QuickEntryWidgetProvider.java`).
2. **Lock-Screen Shift Tracker:** Ongoing sticky foreground notification (`ShiftTrackerService.java`).
3. **Hardware Accelerometer "Shake-to-Log":** Multi-peak reversal physics algorithm in `MainActivity.java` ($gForce \ge 2.7\text{ G}$).
4. **Quick Settings Control Shade Tile:** Android system drawer tile (`SetuQuickTileService.java`).
5. **Pinnable App Shortcuts:** Android launcher 1x1 quick actions (`shortcuts.xml`).
6. **Camera Receipt OCR Scanner:** Client-side multimodal document parser (`tesseract.js 7.0`).

---

## 3. Production Technology Stack

| Tier | Technology | Source Location |
|---|---|---|
| **Mobile Native Android** | Capacitor 8.5.3, AGP 8.13.0, Gradle 8.14.3, Android SDK 24–35, Java 21 | `android/` |
| **Frontend Presentation** | React 18.3, Vite 7.3, TypeScript 5.7, Tailwind CSS 3.4 | `src/` |
| **Multimodal OCR** | Tesseract.js 7.0 (WebAssembly Worker) | `src/components/TransactionModal.tsx` |
| **API & Backend** | Python 3.11+, FastAPI 0.115+, Uvicorn, Pydantic v2 | `ml_service/` |
| **AI / Machine Learning** | Scikit-Learn, SentenceTransformers, PyTorch, FAISS | `ml_service/ai_models_service.py` |
| **Persistence** | IndexedDB, LocalStorage, PostgreSQL / pgvector ready | Client & Backend |

---

## 4. Critical Engineering Invariants & Guardrails

1. **Gradle Distribution Compatibility:**  
   `android/gradle/wrapper/gradle-wrapper.properties` **must remain** on `gradle-8.14.3-all.zip`. Running `npx cap sync` can occasionally rewrite this to Gradle 9.x, which causes build failures with AGP 8.13.0. Always verify this file before compiling.
2. **Shake Detector False-Trigger Guardrail:**  
   The shake threshold must **never be lowered below 2.7 G**, and the multi-peak reversal condition (`SHAKE_MIN_PEAKS = 2`, `160ms–650ms` window, `2500ms` cooldown) must be maintained to prevent false activations while walking or handling the phone.
3. **Zero Full-Page Reload on Shake:**  
   When the accelerometer triggers, dispatch `window.dispatchEvent(new CustomEvent('setu-open-voice'))`. **Do not** change `window.location.href`, as that forces an unnecessary full WebView reload.
4. **Consume Intent Actions:**  
   When handling deep-link intents in `MainActivity.java`, always call `intent.setAction(null); setIntent(intent);` to prevent intent ghosting across resumes and orientation shifts.
5. **Strict Assistive Boundaries:**  
   Never implement automated loan denials, hiring disqualifications, or medical diagnoses. Always enforce human verification before persisting records.
6. **DPDP Act 2023 Compliance:**  
   Never collect or store Aadhaar numbers, biometric templates, UPI PINs, bank passwords, or continuous live GPS trails.

---

## 5. Key Documentation References

* Architecture & Engineering Specs: [`04_ARCHITECTURE.md`](file:///d:/5th%20sem/AIML/project/project-documentation/04_ARCHITECTURE.md)
* Android Native & Hardware Deep-Dive: [`14_ANDROID_MOBILE_NATIVE_AND_WIDGETS_SPECIFICATION.md`](file:///d:/5th%20sem/AIML/project/project-documentation/14_ANDROID_MOBILE_NATIVE_AND_WIDGETS_SPECIFICATION.md)
* AI/ML Models & Viva Handbook: [`15_COMPLETE_AI_ML_MODELS_AND_VIVA_GUIDE.md`](file:///d:/5th%20sem/AIML/project/project-documentation/15_COMPLETE_AI_ML_MODELS_AND_VIVA_GUIDE.md)
