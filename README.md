<p align="center">
  <img src="https://img.shields.io/badge/Expo-57-blue?logo=expo" alt="Expo 57" />
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-Android_First-3DDC84?logo=android" alt="Android" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

<h1 align="center">सेतु — Setu</h1>
<h3 align="center">AI-Powered Livelihood Companion for India's Informal & Gig Workers</h3>
<p align="center"><em>"Aapke Kaam, Paisa, Sehat aur Skill ka Sathi"</em></p>

---

## 🏗️ Overview

**Setu** (meaning "bridge" in Hindi) is an AI-powered mobile application that acts as a livelihood companion for India's estimated **450 million informal and gig workers** — construction labourers, electricians, domestic workers, drivers, delivery personnel, street vendors, plumbers, tailors, and daily-wage earners.

The app bridges the gap between:
- A worker's **skills** and nearby **work opportunities** via ML-driven job matching
- **Irregular daily income** and **planned savings** via intelligent forecasting
- **Health needs** and **verified public resources** via Retrieval-Augmented Generation (RAG)
- **Informal experience** and a structured **digital Skill Passport** via NER-based skill extraction

> **Legal Disclaimer:** Setu is an informational and record-keeping tool only. It does **not** constitute legal, medical, employment, or financial advice. It does not make automated decisions regarding employment eligibility, loan approvals, insurance claims, welfare benefits, or medical diagnoses. Users must verify all information with official government sources or qualified professionals before acting on any suggestion.

---

## 🏛️ System Architecture

Setu follows a 4-tier modular architecture designed for offline resilience, low latency, and strict privacy compliance:

```mermaid
flowchart TD
    subgraph ClientTier ["📱 Client Layer (Mobile Application)"]
        direction TB
        RN["React Native / Expo App (Android-First)"]
        VoiceRec["🎙️ Voice Recorder & Audio Streaming"]
        LocalCache["💾 Local Storage / Offline Cache"]
        i18n["🌐 Bilingual UI (Hindi & English)"]
        RN --- VoiceRec
        RN --- LocalCache
        RN --- i18n
    end

    subgraph APITier ["⚡ Application & API Gateway Layer (FastAPI Backend)"]
        direction TB
        AuthSvc["🔐 Auth & Worker Profiles (JWT / Phone)"]
        DhanSvc["💰 Dhan Service (Income, Expense, Score)"]
        KaamSvc["💼 Kaam Service (Job Matching & Feeds)"]
        SehatSvc["🩺 Sehat Service (Welfare & Health RAG)"]
        KaushalSvc["📜 Kaushal Service (Skill Passport & Courses)"]
    end

    ClientTier -->|"HTTPS / REST API & Audio Upload"| APITier

    subgraph DataTier ["🗄️ Persistence & Storage Layer"]
        direction TB
        Postgres[("🐘 PostgreSQL Database<br/>Users, Ledgers, Jobs, Schemes, Audio Logs")]
        VectorDB[("🔍 Vector Store (FAISS / pgvector)<br/>Document & Skill Embeddings")]
    end

    APITier -->|"Read / Write Records"| Postgres
    APITier -->|"Vector Similarity Search"| VectorDB

    subgraph MLSvcTier ["🤖 AI/ML Inference Pipeline & Models"]
        direction TB
        WhisperASR["🎙️ Whisper / IndicConformer (STT Engine)"]
        NLP_NER["🏷️ spaCy & Transformer NER Engine"]
        Classifiers["🧠 Classifiers & Forecasters (DistilBERT / RF / LSTM)"]
        Embedder["📐 Sentence Transformers (Embedding Generator)"]
        RAG_LLM["📖 RAG LLM Engine (Grounded Answers)"]
    end

    APITier -->|"Audio & Data Inference"| MLSvcTier
    Embedder -.->|"Generate & Index Vectors"| VectorDB

    classDef client fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef api fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef data fill:#fefce8,stroke:#ca8a04,stroke-width:2px,color:#713f12;
    classDef ml fill:#fdf2f8,stroke:#db2777,stroke-width:2px,color:#831843;

    class RN,VoiceRec,LocalCache,i18n client;
    class AuthSvc,DhanSvc,KaamSvc,SehatSvc,KaushalSvc api;
    class Postgres,VectorDB data;
    class WhisperASR,NLP_NER,Classifiers,Embedder,RAG_LLM ml;
```

---

## 🤖 AI/ML Architecture

Setu's intelligence layer is designed as a **multi-model pipeline** combining classical ML, deep learning, and large language models — each selected for a specific task with explainability and fairness constraints.

### Model Map

| Module | Task | Model / Approach | Output |
|---|---|---|---|
| **Voice** | Speech-to-Text (Hindi/English) | OpenAI Whisper `small`/`medium`, IndicConformer | Transcript + language code + confidence | 
| **Voice** | Language Identification | FastText `lid.176.bin` / `langdetect` | ISO 639-1 language code | 
| **Money** | Named Entity Recognition | spaCy NER → Transformer NER (fine-tuned) | Amount, date, category, work-type entities | 
| **Money** | Expense Classification | TF-IDF + Logistic Regression → DistilBERT | 9-class expense category | 
| **Money** | Income Forecasting | Rolling Average → Random Forest → LSTM/Prophet | 7-day income forecast with confidence interval | 
| **Money** | Anomaly Detection | Isolation Forest | Unusual income/expense alerts | 
| **Money** | Financial Stability Score | Random Forest / XGBoost (5-factor weighted) | 0–100 informational score | 
| **Kaam** | Job-Worker Matching | Sentence Transformers + Cosine Similarity | Ranked jobs with match % and explainability | 
| **Kaam** | Recommendation Engine | Content-based + Collaborative Filtering | Personalized work suggestions | 
| **Sehat** | Intent Detection | Logistic Regression → DistilBERT | Health / scheme / work / money intent | 
| **Sehat** | Information Retrieval (RAG) | Sentence Transformers + FAISS/pgvector + LLM | Source-linked answers with citations | 
| **Kaushal** | Skill Extraction | NER / Zero-shot Classifier | Structured skill taxonomy | 
| **Kaushal** | Course Recommendation | Embedding Similarity | Recommended upskilling courses | 
| **Kaushal** | Profile Generation | Template + LLM Summarization | Downloadable Skill Passport PDF | 

### 🧩 ML Pipeline Architecture

```mermaid
flowchart TD
    subgraph VoiceEngine ["Voice Ingestion & Speech Engine"]
        V_In["Voice Input<br/>(Audio Recording)"]
        V_Whisper["Whisper STT Engine<br/>(OpenAI Whisper small/medium)"]
        V_Lang["Language Detection<br/>(FastText lid.176)"]

        V_In --> V_Whisper
        V_Whisper --> V_Lang
    end

    subgraph NEREngine ["Entity Extraction Pipeline"]
        NER_Box["NER Pipeline<br/>├─ Regex layer<br/>├─ spaCy NER<br/>└─ Transformer NER"]
    end

    V_Whisper --> NER_Box

    subgraph DownstreamML ["Task-Specific ML Inference Models"]
        direction LR
        M_Expense["Expense Classify<br/>(TF-IDF / DistilBERT)"]
        M_Income["Income Forecast<br/>(RF / LSTM / Prophet)"]
        M_Job["Job Matching<br/>(SentTrans + Cosine Sim)"]
    end

    NER_Box --> M_Expense
    NER_Box --> M_Income
    NER_Box --> M_Job

    subgraph RAGModule ["RAG — Retrieval-Augmented Generation"]
        direction LR
        R_Chunk["Document Chunking<br/>(200–400 words)"]
        R_Index["FAISS / pgvector Index<br/>(Vector Store)"]
        R_LLM["LLM Answer Generator<br/>(Source-cited only, Zero Hallucination)"]

        R_Chunk --> R_Index
        R_Index --> R_LLM
    end

    subgraph ScoreModule ["Financial Stability Score Engine (Informational Only)"]
        direction TB
        F_Score["5-Factor Weighted Score Model (RF / XGBoost)<br/>├─ Income Regularity (25%)<br/>├─ Savings Rate (25%)<br/>├─ Emergency Fund Progress (20%)<br/>├─ Work-Day Consistency (15%)<br/>└─ Expense Stability (15%)"]
    end

    M_Income -.-> F_Score
    M_Expense -.-> F_Score

    classDef voice fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef ner fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#075985;
    classDef models fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#14532d;
    classDef rag fill:#faf5ff,stroke:#9333ea,stroke-width:2px,color:#581c87;
    classDef score fill:#fff7ed,stroke:#ea580c,stroke-width:2px,color:#7c2d12;

    class V_In,V_Whisper,V_Lang voice;
    class NER_Box ner;
    class M_Expense,M_Income,M_Job models;
    class R_Chunk,R_Index,R_LLM rag;
    class F_Score score;
```

---

### 🗺️ AI/ML End-to-End Pipeline Architecture

```mermaid
flowchart TD
    %% User Inputs
    subgraph Inputs ["1. Input & Ingestion Layer"]
        VoiceIn["🎙️ Worker Voice Input<br/>(Hindi / Hinglish / English Audio)"]
        TextIn["✍️ Text / Manual Entry<br/>(App UI Form / Search Query)"]
    end

    %% Voice Module
    subgraph VoiceModule ["2. Voice & Speech Processing (Voice Module)"]
        STT["OpenAI Whisper (small/medium)<br/>IndicConformer STT Engine"]
        LID["Language Identification<br/>FastText lid.176 / langdetect"]
        Transcript["Normalized Transcript<br/>+ ISO 639-1 Lang Code + Confidence"]
        VoiceIn --> STT
        STT --> LID
        LID --> Transcript
    end

    TextIn --> Router{"Domain & Intent Router"}
    Transcript --> Router

    %% Extraction & Intent
    subgraph ExtractionLayer ["3. NLU & Semantic Understanding"]
        NER["Hybrid Named Entity Recognition (NER)<br/>Regex Rules ➔ spaCy NER ➔ Fine-Tuned Transformer"]
        IntentDet["Intent Detection & Classification<br/>TF-IDF + Logistic Regression ➔ DistilBERT"]
    end

    Router -->|"Financial Note / Expense Log"| NER
    Router -->|"Search, Health or Scheme Query"| IntentDet

    %% Money Module
    subgraph MoneyModule ["4. Dhan Intelligence (Money Module)"]
        direction TB
        ExpClass["Expense Classifier<br/>TF-IDF + LogReg ➔ DistilBERT<br/>(9 Expense Categories)"]
        IncFore["Income Forecaster<br/>Rolling Avg ➔ Random Forest ➔ LSTM/Prophet<br/>(7-Day Forecast + CI)"]
        AnomDet["Anomaly Detector<br/>Isolation Forest<br/>(Unusual Earning/Expense Alerts)"]
        StabScore["Financial Stability Score<br/>Random Forest / XGBoost<br/>(5-Factor Weighted Informational Score)"]

        NER -->|"Amount, Date, Category"| ExpClass
        NER -->|"Earnings & Date Record"| IncFore
        ExpClass --> AnomDet
        IncFore --> AnomDet
        IncFore --> StabScore
        ExpClass --> StabScore
    end

    %% Kaam Module
    subgraph KaamModule ["5. Kaam Matching & Recommendation (Kaam Module)"]
        direction TB
        SkillExtract["Skill Extraction<br/>NER / Zero-shot Classifier"]
        JobEmbed["Semantic Encoder<br/>Sentence Transformers"]
        JobRanker["Job-Worker Matcher<br/>Cosine Similarity + Content & Collaborative Filtering"]

        Router -->|"Worker Profile & Skills"| SkillExtract
        SkillExtract --> JobEmbed
        JobEmbed --> JobRanker
    end

    %% Sehat Module
    subgraph SehatModule ["6. Sehat Health & Welfare RAG (Sehat Module)"]
        direction TB
        EmergencyCheck{"Emergency Triage?"}
        Helpline["🚨 Emergency Helpline Protocol<br/>(108 Ambulance / 112 SOS - Instant Routing)"]
        VectorDB[("Vector Knowledge Store<br/>FAISS / pgvector<br/>(Govt Schemes & Health Docs)")]
        DenseRetrieval["Dense Semantic Retrieval<br/>Sentence Transformers"]
        RAGGen["Grounded LLM Answer Generator<br/>Strict Source-Citations & Guardrails"]

        IntentDet -->|"Health / Scheme Query"| EmergencyCheck
        EmergencyCheck -->|"Critical Health Warning"| Helpline
        EmergencyCheck -->|"Informational Query"| DenseRetrieval
        VectorDB -.->|"Top-k Chunks (200-400w)"| DenseRetrieval
        DenseRetrieval --> RAGGen
    end

    %% Kaushal Module
    subgraph KaushalModule ["7. Kaushal Upskilling & Growth (Kaushal Module)"]
        direction TB
        CourseRec["Course Recommendation<br/>Embedding Cosine Similarity"]
        PassportGen["Skill Passport Generator<br/>Template + LLM Summarization"]

        SkillExtract --> CourseRec
        SkillExtract --> PassportGen
    end

    %% User Facing Delivery
    subgraph Delivery ["8. User-Facing Verified Outputs"]
        OutDhan["📊 Dhan Dashboard<br/>Cashflow History, 7-Day Trend & Stability Score"]
        OutKaam["💼 Ranked Job Cards<br/>Match % with Explainable Reasoning"]
        OutSehat["🩺 Verified Welfare Guidance<br/>Official Source Links, Zero Hallucination"]
        OutKaushal["📜 Verified Skill Passport<br/>Downloadable PDF Profile"]
    end

    MoneyModule --> OutDhan
    KaamModule --> OutKaam
    RAGGen --> OutSehat
    KaushalModule --> OutKaushal

    %% Styling
    classDef input fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef voice fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a;
    classDef model fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a;
    classDef alert fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef card fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a;

    class VoiceIn,TextIn input;
    class STT,LID,Transcript voice;
    class ExpClass,IncFore,AnomDet,StabScore,JobRanker,RAGGen,PassportGen,CourseRec model;
    class Helpline alert;
    class OutDhan,OutKaam,OutSehat,OutKaushal card;
```

---

### 📈 AI/ML Model Evolutionary Progression Roadmap

Each intelligence component follows an incremental development path from explainable heuristics to state-of-the-art transformer and deep learning models:

```mermaid
flowchart LR
    subgraph S1 ["Stage 1: Baseline MVP (Heuristic / Classical ML)"]
        direction TB
        B_Voice["Voice: Whisper Small API"]
        B_NER["NER: Regex Rules + Keyword Dict"]
        B_Exp["Expense: TF-IDF + Logistic Regression"]
        B_Inc["Income: 7-Day Rolling Average"]
        B_Score["Score: Fixed 5-Factor Weighted Rules"]
        B_Job["Job: Keyword & Exact Skill Match"]
        B_Sehat["Sehat: Static FAQ Keyword Search"]
    end

    subgraph S2 ["Stage 2: Statistical & Ensemble ML"]
        direction TB
        M_Voice["Voice: Whisper Medium + FastText LID"]
        M_NER["NER: spaCy Statistical Named Entity Model"]
        M_Exp["Expense: Scikit-learn Ensemble Classifier"]
        M_Inc["Income: Random Forest Regressor"]
        M_Score["Score: Random Forest / XGBoost Regressor"]
        M_Job["Job: Sentence Transformers + Cosine Sim"]
        M_Sehat["Sehat: Intent Classifier + FAISS Vector DB"]
    end

    subgraph S3 ["Stage 3: Deep Learning, Transformers & LLM RAG"]
        direction TB
        A_Voice["Voice: IndicConformer (Low-latency On-device)"]
        A_NER["NER: Domain Fine-tuned Transformer NER"]
        A_Exp["Expense: DistilBERT Multi-class Sequence Model"]
        A_Inc["Income: LSTM / Neural Prophet with CI"]
        A_Score["Score: Non-binding Informational Scoring Model"]
        A_Job["Job: Hybrid Content + Collaborative Filtering"]
        A_Sehat["Sehat: Grounded LLM RAG + Verified Citations"]
    end

    B_Voice --> M_Voice --> A_Voice
    B_NER --> M_NER --> A_NER
    B_Exp --> M_Exp --> A_Exp
    B_Inc --> M_Inc --> A_Inc
    B_Score --> M_Score --> A_Score
    B_Job --> M_Job --> A_Job
    B_Sehat --> M_Sehat --> A_Sehat

    classDef s1 fill:#f8fafc,stroke:#94a3b8,stroke-width:1px,color:#334155;
    classDef s2 fill:#eff6ff,stroke:#3b82f6,stroke-width:1.5px,color:#1e3a8a;
    classDef s3 fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#064e3b;

    class B_Voice,B_NER,B_Exp,B_Inc,B_Score,B_Job,B_Sehat s1;
    class M_Voice,M_NER,M_Exp,M_Inc,M_Score,M_Job,M_Sehat s2;
    class A_Voice,A_NER,A_Exp,A_Inc,A_Score,A_Job,A_Sehat s3;
```

---

### 🗓️ Phased Development & Implementation Roadmap


#### Financial Stability Score Breakdown (Informational Only)
- **Income Regularity (25%):** Variance of day-to-day income over a 30-day window
- **Savings Rate (25%):** Net surplus percentage saved over monthly earnings
- **Emergency Fund Progress (20%):** Progress towards 30-day baseline buffer
- **Work-Day Consistency (15%):** Predictability of active working days per week
- **Expense Stability (15%):** Non-volatile recurring expense profile

---

## ⚖️ Legal, Ethics & AI Safety Framework

Setu follows a **responsible AI framework** with strict guardrails around automated decision-making, data privacy, and worker protection.

### Legal Compliance

| Regulation / Principle | Setu's Compliance |
|------------------------|-------------------|
| **IT Act, 2000 (India)** | All data transmitted over HTTPS; sensitive personal data encrypted at rest |
| **DPDP Act, 2023 (India)** | Data minimization; explicit consent; right to erasure; purpose limitation |
| **Right to Privacy (Puttaswamy)** | No Aadhaar, biometric, or financial credential collection |
| **EU AI Act (Transparency)** | All AI outputs are explainable; no opaque automated decisions |
| **No Automated Decision-Making** | Financial score is informational only; not shared with lenders/employers |

### AI Fairness & Bias Mitigation

- **Job Matching Fairness:** Recommendations tested across gender, city, occupation, and language groups to prevent discriminatory ranking
- **Income Forecasting Limitations:** Seasonal workers receive wider confidence intervals; system does not penalize irregular earners
- **Financial Score Guardrails:** Explicitly labeled as non-binding; never used for creditworthiness assessment, loan eligibility, or insurance decisions
- **Explainability Mandate:** Every AI recommendation includes a human-readable reason (e.g., "यह काम सुझाया गया क्योंकि इसमें वायरिंग और फैन रिपेयर स्किल मैच हुई।")

### Data Privacy Architecture

```
┌────────────────────────────────────────────┐
│           DATA COLLECTED (Minimal)          │
│  ✅ Mobile number    ✅ Name                │
│  ✅ City/locality    ✅ Occupation + Skills  │
│  ✅ Income/Expense   ✅ Optional location    │
├────────────────────────────────────────────┤
│         DATA NEVER COLLECTED                │
│  ❌ Aadhaar number   ❌ Bank passwords      │
│  ❌ UPI PINs         ❌ Full ID documents   │
│  ❌ Exact live GPS   ❌ Health records      │
│  ❌ Biometric data   ❌ Caste/religion      │
├────────────────────────────────────────────┤
│         AUDIO DATA HANDLING                 │
│  • Process → Transcript → Delete raw audio │
│  • No raw audio retention without consent   │
│  • No voice data used for public model      │
│    training without explicit informed consent│
└────────────────────────────────────────────┘
```

### Safety Disclaimers (Embedded in App)

| Domain | Disclaimer |
|--------|-----------|
| **Medical** | "Setu चिकित्सा सलाह नहीं देता। कृपया आधिकारिक स्रोत से पुष्टि करें।" |
| **Financial** | "यह स्कोर केवल जानकारी के लिए है, लोन निर्णय के लिए नहीं।" |
| **Employment** | Job listings include source, pay range, location, and "Verify before joining" warning |
| **General** | "Setu केवल सूचना और सुझाव देने के लिए है। यह कानूनी, चिकित्सा, या वित्तीय सलाह नहीं देता।" |

### Health Emergency Protocol

When a worker reports emergency symptoms, Setu:
1. Immediately displays emergency numbers (108 Ambulance, 112 Emergency)
2. Shows nearest verified government health facilities
3. **Never** provides treatment instructions or diagnoses

---

## 📱 Current Implementation (Frontend Demo)

This repository contains the **Phase 1 frontend prototype** — a demo-ready UI built with:

- **Expo SDK 57** + **React Native 0.86**
- **Expo Router** (file-based routing)
- **TypeScript** (strict mode)
- **Custom styled components** (no external UI library)

### Screens Implemented

| # | Screen | Route | Description |
|---|--------|-------|-------------|
| 1 | Onboarding | `/onboarding` | Language selection (Hindi/English) + worker type |
| 2 | Home (होम) | `/(tabs)/` | Greeting, income card, voice CTA, job suggestions |
| 3 | Kaam (काम) | `/(tabs)/kaam` | Job listings with skill filters + empty state |
| 4 | Dhan (पैसा) | `/(tabs)/dhan` | Income chart, expenses, savings, financial score |
| 5 | Voice Modal | Modal overlay | Listening → result → saved (3-stage UX) |
| 6 | Sehat (सेहत) | Via "सेवा" tab | Health resources, emergency numbers, search |
| 7 | Kaushal (कौशल) | Via "सेवा" tab | Skill Passport, profile, courses |

### Design System

| Token | Value |
|-------|-------|
| Primary | `#0F766E` (Deep Teal) |
| Accent | `#F59E0B` (Saffron) |
| Background | `#FAF7F2` (Off-white) |
| Card Radius | `16px` |
| Min Touch Target | `48 × 48px` |
| Body Text | `16px` |
| Income Numbers | `36–48px bold` |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20.x
- npm or yarn
- Expo Go app on Android phone (for device testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/sadiasakharkar/fairwork-setu.git
cd fairwork-setu/setu-app

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Device

1. Install **Expo Go** from Google Play Store
2. Run `npx expo start`
3. Scan the QR code with Expo Go

---

## 📁 Project Structure

```
fairwork-setu/
├── 01_PROJECT_DESCRIPTION.md      # Product vision and user pain points
├── 02_PROBLEM_STATEMENT.md        # Problem analysis
├── 03_REQUIREMENTS.md             # Functional/non-functional requirements
├── 04_ARCHITECTURE.md             # System architecture
├── 05_UI_UX_DESIGN.md             # UI/UX specification
├── 06_AI_ML_SPECIFICATION.md      # ⭐ Complete AI/ML model map and pipeline
├── 07_DATASET_SPECIFICATION.md    # Dataset design for training
├── 08_DATABASE_SCHEMA.md          # Database schema design
├── 09_API_SPECIFICATION.md        # API endpoint specification
├── 10_DEVELOPMENT_PLAN.md         # Development roadmap
├── 11_EVALUATION_METRICS.md       # ML evaluation metrics
├── 12_ETHICS_PRIVACY_SAFETY.md    # ⭐ Legal, ethics, and safety framework
├── 13_AGENT_HANDOFF.md            # Agent handoff specification
└── setu-app/                      # ⭐ React Native frontend
    ├── app/                       # Expo Router screens
    │   ├── _layout.tsx            # Root stack navigator
    │   ├── index.tsx              # Entry redirect
    │   ├── onboarding.tsx         # Language + worker type selection
    │   └── (tabs)/               # Bottom tab navigator
    │       ├── _layout.tsx        # Tab configuration
    │       ├── index.tsx          # Home screen
    │       ├── kaam.tsx           # Work discovery screen
    │       ├── dhan.tsx           # Money tracker screen
    │       └── more.tsx           # Services hub (Sehat + Kaushal)
    ├── components/                # Reusable UI components
    │   ├── Card.tsx
    │   ├── PrimaryButton.tsx
    │   ├── SectionHeader.tsx
    │   ├── IncomeCard.tsx
    │   ├── JobCard.tsx
    │   ├── HealthResourceCard.tsx
    │   ├── SavingsProgressCard.tsx
    │   ├── SkillChip.tsx
    │   ├── VoiceButton.tsx
    │   ├── VoiceEntryModal.tsx
    │   ├── EmptyState.tsx
    │   ├── DisclaimerText.tsx
    │   ├── SehatScreen.tsx
    │   └── KaushalScreen.tsx
    ├── constants/
    │   └── theme.ts               # Design tokens
    └── data/
        └── mockData.ts            # Mock data for demo
```

---
---

## 🛡️ Responsible AI Principles

1. **Assistive, Not Decisive** — AI suggests; humans decide
2. **Explainable** — Every recommendation shows its reasoning
3. **Source-Linked** — Health/welfare answers cite official sources
4. **Privacy-First** — Minimal data collection; no biometric/Aadhaar storage
5. **Fair** — Tested across gender, language, geography, and occupation
6. **Safe** — No medical diagnosis, no loan approval, no employment guarantees
7. **Transparent** — Users can view, edit, and delete all their data

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>सेतु — Building bridges to better livelihoods through responsible AI</strong>
</p>
