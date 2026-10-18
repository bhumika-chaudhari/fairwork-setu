# Problem Statement: Setu (सेतु)

## 1. Final Problem Statement

> **India’s 450+ million informal and gig workers face irregular income, limited savings, weak digital work profiles, and low awareness of government welfare schemes and nearby work opportunities. Because their work is daily, seasonal, cash-based, or app-mediated, they cannot easily plan expenses, handle medical emergencies, prove their skills, or access formal financial and social security support.**
>
> **Setu is an AI-powered, voice-first, multimodal livelihood companion that helps informal and gig workers record income and expenses, forecast earnings, build emergency savings, discover nearby work matching their skills, access verified health and welfare information, and create a verifiable digital Skill Passport—with native Android ergonomics designed for on-duty field workers.**

---

## 2. Why This Problem Matters

India’s informal economy comprises over **90% of the total workforce** and accounts for more than half of the national GDP. Yet, these workers lack basic social protections, job security, and structured financial tools. 

Key challenges include:
* **Thin Financial Profiles:** Informal workers receive cash daily. Without formal pay slips or tax returns, institutional banks reject their loan applications, forcing them into the clutches of local moneylenders charging 36%–120% APR.
* **On-the-Road Physical Barriers:** Delivery riders wearing motorcycle gloves or auto drivers navigating busy traffic cannot type on small smartphone keyboards or navigate nested menus.
* **Welfare Policy Gap:** While landmark initiatives like **e-Shram, PM-SYM (pension), PM-SVANidhi (micro-credit), and Ayushman Bharat (health)** exist, millions of eligible workers remain unenrolled due to intimidating bureaucratic jargon and widespread misinformation.

---

## 3. Core User Problem: The Worker's Daily Reality

An informal worker faces six fundamental daily questions:

1. **🏠 Home (आज का दिन):** *How am I doing on my shift today, and what are my critical reminders?*
2. **💼 Kaam (काम):** *Where can I find verified work nearby that matches my specific practical skills?*
3. **💰 Dhan (कमाई और खर्चे):** *How much net profit did I actually earn today after fuel, tolls, and food, and how much can I expect next week?*
4. **🩺 Sehat (स्वास्थ्य):** *Where is the nearest free government hospital, and what should I do in a medical emergency?*
5. **📜 Kaushal (कौशल):** *How can I formally prove my years of craftsmanship to get hired for higher-paying commercial contracts?*
6. **🛡️ Haq (अधिकार और योजनाएं):** *What government schemes am I legally entitled to, and how do I file a wage grievance if a contractor defaults?*

---

## 4. Scope of the System

### In Scope
* Voice-first vernacular transaction logging (Hindi, Marathi, Hinglish, English).
* Dual cashflow ledger with 7-day predictive forecasting and confidence bands.
* Non-punitive educational Financial Stability Scoring (0–100).
* Semantic job-worker matching using dense vector embeddings (SentenceTransformers).
* Grounded RAG welfare search with zero hallucination guarantee and official gazette citations.
* NCVET-aligned digital Skill Passport generation (downloadable PDF).
* Client-side multimodal camera receipt and bill OCR scanner.
* Native Android hardware integrations: 4x2 Home-Screen Card Widget, Lock-Screen Shift Tracker Foreground Service, Accelerometer "Shake-to-Log", and Quick Settings Tile.

### Out of Scope
* Automated commercial loan approval or binding credit scoring.
* Medical diagnosis or automated prescription generation.
* Automated hiring disqualification or algorithmic termination of gig workers.
* Direct financial transactions, payment gateway processing, or custodial wallet holding.
* Automated legal litigation or court filing.

---

## 5. Success Conditions

FairWork Setu is successful if an informal worker with low digital literacy can, within **3 minutes of first launch**:
1. Create a voice or simple form profile in their native language.
2. Record today's fare or fuel expense using voice, lock-screen notification buttons, or phone shake.
3. View their expected 7-day earnings trajectory.
4. Discover at least one verified nearby gig opportunity matching their skills.
5. Download an NCVET-aligned Skill Passport PDF.
6. Verify eligibility for an official welfare scheme with a direct government source citation.
