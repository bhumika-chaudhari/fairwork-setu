# FairWork Setu — Supabase & Database Configuration Guide

This guide documents the implementation of **Option C: Hybrid Authentication & Persistent Supabase PostgreSQL Storage** for FairWork Setu.

---

## Architecture Overview

```
┌────────────────────────────────┐         ┌───────────────────────────────┐
│  Client (Vercel Web / Android) │ ──────> │  Supabase Auth Service        │
│  Option C: Phone OTP / Email   │ <────── │  (Returns signed JWT token)   │
└────────────────────────────────┘         └───────────────────────────────┘
                │
                │ 'Authorization: Bearer <token>'
                ▼
┌────────────────────────────────┐
│  Render FastAPI Microservice   │
│  - Verifies JWT Signature      │
│  - Derives user_id from 'sub'  │
│  - Enforces User Authorization │
└────────────────────────────────┘
                │
                │ SQLAlchemy (Connection Pool)
                ▼
┌────────────────────────────────┐
│  Supabase PostgreSQL Database  │
│  (Managed Tables + RLS)        │
└────────────────────────────────┘
```

---

## 1. Zero-Disruption Offline & Demo Mode Guarantee

- **Judge / Reviewer Ready:** If no environment variables are configured or if the device is offline, FairWork Setu **never crashes or throws errors**.
- **Mock OTP Acceptance:** When unconfigured, typing any 10-digit number and entering `123456` or clicking **"Continue as Demo Guest"** allows immediate access.
- **Demo Data Protection:** Synthetic records (`tx_demo_*`, `sample_*`) are saved strictly to local device storage and **never committed to the remote PostgreSQL database**.

---

## 2. Environment Variables Setup

### A. Frontend (Vercel & Local `.env`)
Add the following keys to your Vercel Project Settings (`Settings > Environment Variables`):

```bash
# Public URL and Anonymous Public Key (Safe to expose to browsers & APK)
VITE_SUPABASE_URL="https://<your-project-id>.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_API_BASE_URL="https://<your-render-service>.onrender.com/api"
VITE_ML_API_URL="https://<your-render-service>.onrender.com"
```

### B. Backend (Render Environment)
Add the following keys to your Render Dashboard (`Environment > Environment Variables`):

```bash
# PostgreSQL Connection String from Supabase (Database Settings > Connection pooling / URI)
DATABASE_URL="postgresql://postgres.<project-id>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Supabase JWT Secret (Project Settings > API > JWT Settings > JWT Secret)
SUPABASE_JWT_SECRET="<your-supabase-jwt-secret>"
```

*(Note: Render automatically sets up Python dependencies from `ml_service/requirements.txt`, including `SQLAlchemy>=2.0.0`, `psycopg2-binary>=2.9.9`, and `PyJWT>=2.10.0`)*

---

## 3. Database Schema Provisioning

The database schema can be initialized in either of two ways:

1. **Automatic Initialization:** When the FastAPI service boots, `init_db()` in [`ml_service/database.py`](file:///Users/sadiasakharkar/Desktop/Setu/ml_service/database.py) runs `Base.metadata.create_all(bind=engine)` and generates all tables, indexes, and constraints automatically.
2. **Direct Supabase SQL Migration:** Open the **Supabase Dashboard > SQL Editor**, paste the contents of [`ml_service/schema.sql`](file:///Users/sadiasakharkar/Desktop/Setu/ml_service/schema.sql), and run it. This provisions Row Level Security (RLS) policies and triggers.

---

## 4. Key Endpoints Added to FastAPI

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Fetches authenticated user's profile based on token `sub`. |
| `POST` | `/api/user/sync-profile` | Upserts user profile and onboarding settings. |
| `GET` | `/api/transactions` | Lists user-isolated transactions with optional filters. |
| `POST` | `/api/transactions` | Creates transaction (rejects demo records). |
| `PUT` | `/api/transactions/{id}` | Updates existing transaction with user-ownership check. |
| `DELETE` | `/api/transactions/{id}` | Deletes transaction with user-ownership check. |
| `POST` | `/api/transactions/batch-sync` | Idempotent bulk sync of offline local transactions. |

---

## 5. Automated Verification Status

- ✅ Frontend build (`npm run build`) passed with 0 errors.
- ✅ Backend startup (`uvicorn main:app`) initialized database tables successfully.
- ✅ Unauthorized requests correctly rejected with `401 Unauthorized`.
- ✅ Authenticated transactions persisted and isolated by user ID.
- ✅ Demo transactions blocked from committing to production tables.
- ✅ Idempotent batch synchronization verified.
