# System Architecture

## 1. High-level architecture

```text
+---------------------------+
|     React Native App      |
|  Android-first, voice UI  |
+------------+--------------+
             |
             | HTTPS / REST
             v
+---------------------------+
|        FastAPI Backend     |
|  Auth | Jobs | Money | AI |
+-----+---------------+-----+
      |               |
      v               v
+-----------+   +----------------+
| PostgreSQL|   | AI/ML Services |
+-----------+   +----------------+
                     |
        +------------+------------+
        |            |            |
        v            v            v
+-------------+ +----------+ +-----------+
| Whisper ASR | | NLP/NER  | | Embeddings|
+-------------+ +----------+ +-----------+
                     |
                     v
             +---------------+
             | FAISS/pgvector|
             +---------------+
```

## 2. Components

### 2.1 Mobile frontend

Built with **React Native + Expo**.

Responsibilities:

- User registration and login
- Worker profile creation
- Voice recording
- Displaying work, money, health, and skill modules
- Rendering charts, cards, timelines, and PDF download links
- Caching recent data for smoother usage

### 2.2 Backend API

Built with **FastAPI**.

Responsibilities:

- Authentication
- Profile management
- Income/expense CRUD
- Job matching
- Forecasting
- Health/welfare retrieval
- PDF generation
- Model inference orchestration

### 2.3 PostgreSQL database

Stores structured application data:

- Users
- Skills
- Jobs
- Income entries
- Expense entries
- Savings goals
- Health resources
- Welfare schemes
- Voice logs

### 2.4 AI/ML service layer

A separate FastAPI router or microservice handles:

- Speech-to-text
- Named-entity recognition
- Expense classification
- Income forecasting
- Job matching
- Semantic retrieval
- RAG-based answers

For a college MVP, this can remain inside the main FastAPI application.

### 2.5 Vector store

Use **FAISS** for the MVP or **pgvector** if you want everything inside PostgreSQL.

It stores embeddings for:

- Job descriptions
- Worker skills
- Welfare-scheme text
- Health-resource descriptions
- Skill-course descriptions

## 3. Data flow

### 3.1 Voice income entry

```text
Worker speaks
   ↓
Mobile app records audio
   ↓
Backend sends audio to ASR model
   ↓
Whisper returns transcript
   ↓
NLP extracts amount, category, date, work type
   ↓
Worker reviews extracted data
   ↓
FastAPI saves income/expense entries
   ↓
Forecast model updates
   ↓
Dhan dashboard refreshes
```

### 3.2 Job matching

```text
Worker profile + skills
   ↓
Sentence Transformer creates worker embedding
   ↓
Job descriptions are embedded
   ↓
Cosine similarity computed
   ↓
Results filtered by city, distance, availability
   ↓
Ranked job cards displayed
```

### 3.3 Health/welfare question

```text
Worker asks question
   ↓
Question is embedded
   ↓
FAISS/pgvector retrieves top relevant documents
   ↓
LLM generates an answer using only retrieved context
   ↓
Answer is displayed with source links
```

## 4. Folder structure

```text
setu/
├── mobile/
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── ml/
│   │   ├── core/
│   │   └── utils/
│   ├── requirements.txt
│   └── Dockerfile
├── ml/
│   ├── data/
│   ├── notebooks/
│   ├── training/
│   ├── models/
│   └── evaluation/
├── docs/
│   ├── README.md
│   ├── 01_PROJECT_DESCRIPTION.md
│   └── ...
├── docker-compose.yml
└── .env.example
```

## 5. Deployment architecture

### MVP deployment

- Frontend: Expo Go / Android APK
- Backend: FastAPI on Render, Railway, or a college server
- Database: PostgreSQL on Neon, Supabase, Railway, or local Docker
- Vector store: FAISS file stored with backend, or pgvector in PostgreSQL
- ASR: Hosted Whisper API or local smaller Whisper model

### Production-style deployment

- Mobile app distributed as an Android APK
- Backend deployed in Docker containers
- PostgreSQL managed database
- Redis for caching and background jobs
- Object storage for generated PDFs
- Monitoring with logs, error tracking, and model-performance dashboards
