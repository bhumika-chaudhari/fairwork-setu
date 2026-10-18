# FairWork Setu — Database and Authentication Audit & Architecture Proposal

**Audit Date:** October 19, 2026  
**Audited Target:** FairWork Setu (React/Vite Web + Render FastAPI Backend + Android APK)  
**Status:** AUDIT COMPLETE — PENDING USER APPROVAL FOR IMPLEMENTATION  
**Document Location:** `docs/DATABASE_AUTH_AUDIT.md`  

---

## Executive Summary

FairWork Setu is currently an **offline-first, client-centric prototype** where almost all user-specific data (identity profile, transactions, grievance cases, bookmarked clinics, and notification settings) resides exclusively inside the client browser's `localStorage`. 

The backend service on Render is a Python FastAPI microservice that currently functions as a **stateless compute and inference engine** (running Machine Learning models and deterministic parsers). Its only persistent state is an uncommitted local JSON file (`marketplace_data.json`) stored on Render's ephemeral container filesystem, which resets on every container restart.

This audit evaluates the codebase to establish a **reliable, persistent, multi-tenant database and authentication system** using **Supabase PostgreSQL** and **FastAPI authorization middleware** without breaking the existing Vercel deployment, Render service, or Android APK.

---

## Phase 1: Deep Repository Audit Findings

### 1. Storage Mechanisms Used Across the Application

A systematic audit of all `src/` files identified that **100% of user data storage currently relies on browser `localStorage`**. No IndexedDB, WebSQL, SQLite, or persistent cloud database connections are implemented.

| Storage Key | Declared In File | Data Type / Contents | Lifecycle / Scope |
| :--- | :--- | :--- | :--- |
| `@setu/profile` | `src/hooks/ProfileContext.tsx` | User profile JSON (name, workType, skills, city, pay range, savings goal, emergency contact) | Persists in browser until cleared. Defaults to hardcoded `"Ramesh Kumar"`. |
| `@setu/onboarding-complete` | `src/hooks/ProfileContext.tsx` | String `'1'` or missing | Determines route access past Landing page. Removed on logout. |
| `setu_transactions` | `src/services/transactionService.ts` | Array of `Transaction` objects (income & expense records) | Seeded with 5 days of synthetic demo records (`tx_demo_*`) if empty. Real user entries are mixed into the same array. |
| `setu_marketplace_apps` | `src/services/marketplaceService.ts` | Array of gig applications | Local mirror of applications submitted by the user. |
| `setu_worker_marketplace_profile` | `src/services/marketplaceService.ts` | Worker trade profile & availability | Local mirror of the user's public worker profile. |
| `setu_service_bookings` | `src/services/marketplaceService.ts` | Array of service booking requests | Local mirror of booking requests. Defaults to `FALLBACK_BOOKINGS` if server is unreachable. |
| `setu_conv_${contextId}` | `src/services/marketplaceService.ts` | Conversation chat messages | Stored per booking/application ID. |
| `setu_health_saved_items` | `src/services/healthService.ts` | Array of bookmarked hospitals/schemes | Local list of saved clinics and welfare programs. |
| `haq_setu_cases` | `src/services/haqService.ts` | Array of grievance & appeal cases | User's deactivation appeal drafts and case logs. |
| `@setu/notification_prefs_v1` | `src/services/notificationService.ts` | Notification settings & quiet hours | User channel preferences and alert categories. |
| `@setu/notifications_v1` | `src/services/notificationService.ts` | Notification inbox history (max 50) | In-app notification center alerts. |
| `@setu/notification_dedup_log_v1` | `src/services/notificationService.ts` | Deduplication timestamps | Prevents duplicate nudges within cooldown windows. |
| `@setu/voice_silence_timeout` | `src/pages/ProfilePage.tsx` | Number (seconds: 3, 5, 7) | Voice assistant continuous silence duration. |
| `@setu/auto_readout` | `src/pages/ProfilePage.tsx` | Boolean string (`'true'` / `'false'`) | Text-to-speech audio auto-play preference. |
| `@setu/expense_alerts` | `src/pages/ProfilePage.tsx` | Boolean string (`'true'` / `'false'`) | Proactive high-expense anomaly notification trigger. |

---

### 2. Transaction Lifecycle & Complete Data Flow

Transactions follow a purely local data flow from user interaction to storage:

```
[User Action in DhanPage / Voice Assistant]
                     │
                     ▼
       `TransactionContext.addTransaction()`
                     │
                     ▼
       `transactionService.addTransaction()`
                     │
                     ├─► Generates client ID: `tx_${Date.now()}_${random}`
                     ├─► Reads existing array from localStorage(`setu_transactions`)
                     ├─► Pre-pends new record
                     ├─► Writes back to localStorage(`setu_transactions`)
                     └─► Dispatches window event `setu_transactions_changed`
                     │
                     ▼
    `TransactionContext.refresh()` triggers React state update
                     │
                     ▼
    UI recalculates deterministic summaries locally
```

**CRUD Operations:**
- **Create:** `addTransaction()` in `src/services/transactionService.ts` (lines 406–425). Creates an ID with format `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.
- **Read:** `getStoredTransactions()` in `src/services/transactionService.ts` (lines 371–389). If `setu_transactions` is null or empty, it automatically executes `generateDemoPastTransactions()`, synthesizing 5 days of dummy transactions and saving them into `localStorage`.
- **Update:** `updateTransaction()` in `src/services/transactionService.ts` (lines 430–452). Finds record by ID in local array, mutates it, and overwrites `setu_transactions`.
- **Delete:** `deleteTransaction()` in `src/services/transactionService.ts` (lines 456–462). Filters array and overwrites `setu_transactions`.
- **Backend Transmission:** The backend **never** stores transactions. Transactions are only sent to the backend as transient payloads in POST requests to `/models/predict` or `/api/models/income-forecast` for computing on-the-fly ML predictions.

---

### 3. Authentication & Identity Audit

- **Current Implementation:** Purely local mock/demo onboarding.
- **Root Protection:** `src/App.tsx` contains a wrapper `RequireOnboarding` which simply checks:
  ```typescript
  const { ready, onboardingComplete } = useProfile();
  if (!onboardingComplete) return <Navigate to="/" replace />;
  ```
- **Login/Signup Mechanism:** There is no login or signup screen. A new user goes to `/onboarding`, enters their name, phone, city, and work type, and clicks "Start".
- **Storage:** `OnboardingPage.tsx` calls `ProfileContext.completeOnboarding()`, which writes `@setu/profile` and `@setu/onboarding-complete = '1'` into `localStorage`.
- **User Identifier Generation:** Because there is no authentication service or database, `src/pages/KaamPage.tsx` synthesizes a fake user ID from the user's name:
  ```typescript
  const userId = 'usr-' + (profile.name || 'worker').toLowerCase().replace(/[^a-z0-9]/g, '-');
  ```
  *Risk:* Every user named "Ramesh Kumar" shares the exact same synthetic ID (`usr-ramesh-kumar`). Any user can impersonate another user simply by typing their name.
- **Logout Behavior:** `ProfileContext.logout()` only removes `@setu/onboarding-complete`. It **leaves all user profile information, transactions, bookings, and cases in `localStorage`**, creating a severe data exposure vulnerability on shared mobile devices.

---

### 4. FastAPI Backend Architecture Audit

- **Framework:** FastAPI 0.115.6 on Python 3.11 with Uvicorn.
- **Dependencies (`ml_service/requirements.txt`):**
  - `fastapi`, `uvicorn`, `scikit-learn`, `torch`, `numpy`, `pandas`, `pydantic`, `joblib`, `python-multipart`.
  - **No database packages installed:** No SQLAlchemy, asyncpg, psycopg2, sqlmodel, tortoise, alembic, or supabase client.
- **Authentication Middleware:** None. Zero endpoints require authentication headers.
- **CORS Configuration (`ml_service/main.py`):**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
  Permissive `*` origin allows any origin to query the API.
- **Backend Persistence:**
  - `ml_service/marketplace.py` reads and writes to `ml_service/marketplace_data.json` via standard Python `json.dump()`.
  - On Render, the free/standard container runs on an **ephemeral disk**. Every time Render redeploys or restarts an inactive container, `marketplace_data.json` is reverted to its git-committed state. All bookings, applications, and messages created during runtime are permanently lost.

---

### 5. Existing Database Configuration

- **Confirmed Fact:** There is **no database currently provisioned, configured, or connected** on Render or externally.
- Neither `.env.example`, `ml_service/`, nor deployment configs contain `DATABASE_URL` or database credentials.
- `project-documentation/08_DATABASE_SCHEMA.md` contains an initial theoretical PostgreSQL schema from early planning, but no database was ever instantiated.

---

### 6. Inter-Module Storage Dependencies & Demo Data Dependencies

| Module | Storage Dependencies | Dependence on Demo Data |
| :--- | :--- | :--- |
| **Home (`HomePage.tsx`)** | `@setu/profile`, `setu_transactions` | If transactions are empty, auto-seeds demo data to render charts. |
| **Dhan (`DhanPage.tsx`)** | `setu_transactions` | Relies on `generateDemoPastTransactions()` if fresh. Has manual "Load Sample Data" button (`sample_*`). |
| **Kaam (`KaamPage.tsx`)** | `marketplace_data.json`, `setu_marketplace_apps`, `setu_service_bookings` | Uses `FALLBACK_BOOKINGS` when offline or when API is unreachable. |
| **Sehat (`SehatPage.tsx`)** | `setu_health_saved_items` | Hardcoded `FALLBACK_FACILITIES` (Sassoon Hospital, Aundh Civil, etc.) used when API fails. |
| **Kaushal (`KaushalPage.tsx`)** | `@setu/profile` | Static course list in `mockData.ts`. AI recommendations via Model 7 (`/api/models/skill-recommend`). |
| **Haq Setu (`HaqSetuPage.tsx`)** | `haq_setu_cases` | Static legal acts (`VERIFIED_LEGAL_SOURCES`). AI retrieval via Model 8 (`/api/models/health-rag`). |
| **Notifications** | `@setu/notifications_v1`, `@setu/notification_prefs_v1` | Context-aware scheduler reads `@setu/profile` and `setu_financial_summary`. |

---

### 7. APK Packaging Inspection

- **Artifacts Present:** `android-res/` directory containing launcher icons (`ic_launcher.png`), adaptive XML (`mipmap-anydpi-v26`), and notification drawables (`ic_notification.png`).
- **Sync Script:** `scripts/sync_android_icons.py` targets `android/app/src/main/res/`.
- **Android Directory:** There is **no `android/` directory committed to the git repository**.
- **Detection Logic:** `src/services/notificationService.ts` checks:
  ```typescript
  win.AndroidNotificationBridge || (win.Capacitor && win.Capacitor.isNativePlatform())
  ```
- **Conclusion:** The APK is a **WebView container / Trusted Web Activity (TWA)** wrapper built around the web application. It executes the exact same React bundle, uses the same browser `localStorage` engine within the Android WebView sandbox, and calls the exact same backend endpoints.

---

### 8. API Base URLs & Environment Variable Configuration

| Environment | Variable Name | Current Setting / Behavior |
| :--- | :--- | :--- |
| **Local Dev** | `VITE_API_BASE_URL` | Defaults to `http://localhost:8000/api` |
| **Local Dev** | `VITE_ML_API_URL` | Defaults to `http://127.0.0.1:8000` |
| **Vercel** | `VITE_ML_API_URL` | In `aiModelsClient.ts` & `marketplaceService.ts`: if unset, defaults to `''` (relative path) which fails on Vercel unless configured in Vercel dashboard. |
| **Vercel** | `healthService.ts` | **Bug Identified:** Hardcoded `http://127.0.0.1:8000/health-service` (line 10). On Vercel, this causes a browser Mixed-Content / connection error and silently falls back to local data. |
| **Render** | `PORT` | Dynamically assigned by Render (handled via `uvicorn --port ${PORT:-8000}`). |
| **Render** | Database variables | None configured. |

---

### 9. Data Loss Matrix Across Lifecycles

| Scenario | `@setu/profile` | `setu_transactions` | Bookings & Apps | Grievance Cases | Saved Health |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Refresh** | Persists | Persists | Persists | Persists | Persists |
| **User Logout** | **Leaks** (Retained) | **Leaks** (Retained) | **Leaks** (Retained) | **Leaks** (Retained) | **Leaks** (Retained) |
| **Clear Site Data / Cache** | **Lost Permanently** | **Lost Permanently** | **Lost Permanently** | **Lost Permanently** | **Lost Permanently** |
| **Render Dyno Restart** | Unaffected (client) | Unaffected (client) | **Server state wiped** | Unaffected (client) | Unaffected (client) |
| **Device Switch / New APK** | **Lost (Starts at default)** | **Lost (Seeds demo data)**| **Lost** | **Lost** | **Lost** |

---

### 10. Secrets & Credential Exposure Scan

- **Scan Results:** Zero secrets, API keys, database connection strings, or service tokens are exposed in `src/`, `public/`, or `ml_service/`.
- All environment variable references in code use public `VITE_` prefixes for API URLs.
- Git repository contains no committed `.env` files (only `.env.example`).

---

## Phase 2: Recommended Safe Architecture

### The Minimum-Change Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │             CLIENTS (Vercel Web & Android APK)          │
   │  - React 18 + Vite Progressive Web App                 │
   │  - Supabase Auth Client (Phone OTP / Email / Password)  │
   │  - Sends JWT: Authorization: Bearer <access_token>     │
   └──────────────────────────┬─────────────────────────────┘
                              │ HTTPS REST Calls
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │            RENDER BACKEND (FastAPI Microservice)        │
   │  - Auth Dependency: Validates Supabase JWT signature   │
   │  - Derives authenticated `user_id = token["sub"]`      │
   │  - Enforces authorization, business rules & validation │
   │  - Hosts AI/ML Inference & Marketplace endpoints       │
   └──────────────────────────┬─────────────────────────────┘
                              │ Secure PostgreSQL Connection
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │         DATABASE LAYER (Supabase PostgreSQL)           │
   │  - Managed PostgreSQL 15+ with PgBouncer / Connection Pool
   │  - Row-Level Security (RLS) enabled on all user tables │
   │  - Strict Foreign Keys, Indexes, and Constraints       │
   └────────────────────────────────────────────────────────┘
```

### Why Supabase PostgreSQL is the Optimal Choice:
1. **Existing Infrastructure Match:** Render backend can connect to Supabase PostgreSQL using standard connection pooling (`DATABASE_URL`) without incurring Render paid disk costs.
2. **Native Phone Authentication:** Indian informal gig workers predominantly authenticate via Mobile Phone Numbers + OTP rather than complex passwords or OAuth. Supabase Auth supports Phone OTP and Email OTP out of the box.
3. **Strict Separation of Privileges:** 
   - The frontend and APK **only receive the public `anon` key**, which is restricted to authentication and public tables via Row Level Security (RLS).
   - FastAPI connects via standard PostgreSQL credentials (`DATABASE_URL`) over TLS to manage authorized data operations.
   - Privileged `service_role` keys are **never** provided to the frontend or APK.

---

## Phase 3: Proposed Normalized Database Schema

All user-owned tables reference `auth.users(id)` (UUID) provided by Supabase Auth.

```sql
-- 1. PROFILES & PREFERENCES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    gender VARCHAR(30),
    city_key VARCHAR(80) NOT NULL DEFAULT 'cities.pune',
    work_type VARCHAR(60) NOT NULL DEFAULT 'driver',
    experience_years INT NOT NULL DEFAULT 1,
    availability VARCHAR(30) NOT NULL DEFAULT 'anytime',
    pay_min NUMERIC(10, 2) DEFAULT 400.00,
    pay_max NUMERIC(10, 2) DEFAULT 700.00,
    emergency_contact VARCHAR(30),
    savings_goal NUMERIC(12, 2) DEFAULT 5000.00,
    weekly_save_goal NUMERIC(12, 2) DEFAULT 350.00,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    speech_rate NUMERIC(3, 2) DEFAULT 0.95,
    voice_silence_timeout INT DEFAULT 5,
    privacy_mask_earnings BOOLEAN DEFAULT FALSE,
    auto_readout BOOLEAN DEFAULT FALSE,
    expense_alerts BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRANSACTIONS (INCOME & EXPENSES)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_tx_id VARCHAR(80), -- For idempotent offline synchronization
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category VARCHAR(60) NOT NULL,
    description TEXT,
    work_ref VARCHAR(120),
    source VARCHAR(30) DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'quick')),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_client_tx UNIQUE (user_id, client_tx_id)
);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, timestamp DESC);
CREATE INDEX idx_transactions_user_cat ON public.transactions(user_id, category);

-- 3. WORKER SERVICE MARKETPLACE PROFILES
CREATE TABLE public.service_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name VARCHAR(120) NOT NULL,
    trade VARCHAR(80) NOT NULL,
    short_description TEXT,
    full_bio TEXT,
    service_area VARCHAR(120),
    phone VARCHAR(30),
    indicative_price NUMERIC(10, 2) DEFAULT 250.00,
    pricing_type VARCHAR(40) DEFAULT 'visit_fee',
    working_days TEXT[] DEFAULT '{"mon","tue","wed","thu","fri","sat"}',
    time_slots TEXT[] DEFAULT '{"09:00 - 13:00","14:00 - 18:00"}',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SERVICE BOOKINGS & REQUESTS
CREATE TABLE public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_address TEXT NOT NULL,
    service_trade VARCHAR(80) NOT NULL,
    service_description TEXT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'proposed', 'completed', 'cancelled')),
    estimated_price NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bookings_worker ON public.service_bookings(worker_id, booking_date DESC);
CREATE INDEX idx_bookings_customer ON public.service_bookings(customer_id);

-- 5. JOB APPLICATIONS
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(80) NOT NULL,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn')),
    cover_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_applicant_job UNIQUE (applicant_id, job_id)
);

-- 6. USER SKILLS
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_key VARCHAR(100) NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    proficiency VARCHAR(30) DEFAULT 'competent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_skill UNIQUE (user_id, skill_key)
);

-- 7. HEALTH SAVED ITEMS
CREATE TABLE public.saved_health_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    notes TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_health_item UNIQUE (user_id, item_id)
);

-- 8. HAQ SETU GRIEVANCE CASES
CREATE TABLE public.haq_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    platform_name VARCHAR(80) NOT NULL,
    deactivation_reason VARCHAR(120),
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'resolved', 'closed')),
    incident_date DATE,
    loss_of_income_est NUMERIC(10, 2),
    appeal_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATION PREFERENCES
CREATE TABLE public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    browser_push_enabled BOOLEAN DEFAULT FALSE,
    android_native_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start VARCHAR(10) DEFAULT '22:00',
    quiet_hours_end VARCHAR(10) DEFAULT '07:00',
    category_money BOOLEAN DEFAULT TRUE,
    category_work BOOLEAN DEFAULT TRUE,
    category_health BOOLEAN DEFAULT TRUE,
    category_skills BOOLEAN DEFAULT TRUE,
    category_rights BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Phase 4: Authentication & Data Security Strategy

### 1. Backend JWT Token Validation (FastAPI)
- FastAPI will include an authentication dependency using `PyJWT` or `fastapi.security.HTTPBearer`.
- The backend validates the signature of the `Authorization: Bearer <token>` header against the Supabase Project JWT Secret or JWKS public keys.
- **Strict Rule:** The client never passes its own `user_id` as a trusted parameter. The backend extracts:
  ```python
  authenticated_user_id = token_payload.get("sub")
  ```
- All database queries and writes strictly bind to `authenticated_user_id`.

### 2. Transitioning from Demo Auth to Real Auth
- **Unauthenticated Users:** The application remains fully browsable in Demo Mode. If no user is logged in, the app uses the existing `localStorage` fallback and synthetic demo data for evaluation and presentations.
- **Login / Signup Dialog:** A simple modal or dedicated screen allows the user to:
  1. Sign in or Sign up with **Phone Number + OTP** (or Email + Password).
  2. Upon successful verification, Supabase returns the session JWT.
  3. The client receives the JWT and fetches the user's remote profile and transactions from FastAPI.

### 3. Safe Handling of Existing Local Data
- **Demo Data Filter:**
  Before uploading any local data to the cloud, records are filtered:
  - If `tx.id.startsWith("tx_demo_")` or `tx.id.startsWith("sample_")`: **DISCARD / DO NOT UPLOAD**.
  - If `tx.id.startsWith("tx_")`: Identified as genuine user-entered transactions.
- **Account Linking Prompt:**
  When a user signs up on a device that already has genuine user-entered transactions in `localStorage`, the app will prompt:  
  *"Found 3 transactions recorded on this device. Save them to your new account? [Yes, Sync] [No, Start Fresh]"*
- **Shared Device Security:**
  On `logout()`, the application will:
  1. Terminate the Supabase session.
  2. Clear all sensitive user keys (`@setu/profile`, `setu_transactions`, `setu_service_bookings`, `haq_setu_cases`, `setu_health_saved_items`).
  3. Reset state to clean Demo Mode.

---

## Phase 5: Implementation Plan for Approval

### 1. Current Architecture vs. Target State
- **Current:** Pure client-side `localStorage` + Ephemeral Render JSON file + No real authentication.
- **Target:** Supabase Auth + Render FastAPI (Authorization & Business Rules) + Supabase Managed PostgreSQL.

### 2. Required Environment Variables (Names Only — Zero Secrets Printed)

#### A. Frontend (Vercel & Local `.env`)
- `VITE_API_BASE_URL` (points to Render FastAPI backend `/api`)
- `VITE_ML_API_URL` (points to Render FastAPI root URL)
- `VITE_SUPABASE_URL` (Supabase Project URL)
- `VITE_SUPABASE_ANON_KEY` (Public client anon key for Auth)

#### B. Backend (Render Dashboard)
- `DATABASE_URL` (PostgreSQL pooled connection string to Supabase)
- `SUPABASE_JWT_SECRET` (used to cryptographically verify user tokens in FastAPI)
- `CORS_ORIGINS` (comma-separated origins: Vercel production domain, preview domains, localhost)

---

### 3. API Endpoints to Add in FastAPI (`ml_service/`)

FastAPI will be structured with clean, user-scoped routers:

```
POST   /api/auth/sync-profile          -> Upsert user profile from auth token
GET    /api/user/profile               -> Fetch authenticated user's profile
PUT    /api/user/profile               -> Update user profile

GET    /api/transactions               -> Fetch user's persistent transactions (with date/cat filters)
POST   /api/transactions               -> Create new transaction
POST   /api/transactions/batch-sync    -> Idempotent sync for offline transactions
PUT    /api/transactions/{id}          -> Update transaction (verifying user ownership)
DELETE /api/transactions/{id}          -> Delete transaction (verifying user ownership)

GET    /api/marketplace/my-bookings    -> Fetch user's bookings (as customer or worker)
POST   /api/marketplace/bookings       -> Create booking request
PATCH  /api/marketplace/bookings/{id}  -> Update booking status (confirm/reject/complete)

GET    /api/haq/cases                  -> Fetch user's grievance cases
POST   /api/haq/cases                  -> Create or update grievance case

GET    /api/health/saved               -> Fetch user's saved clinics & schemes
POST   /api/health/saved               -> Save clinic or scheme
DELETE /api/health/saved/{item_id}     -> Remove saved clinic

GET    /api/notifications/preferences  -> Fetch notification settings
PUT    /api/notifications/preferences  -> Update notification settings
```

---

### 4. Frontend & APK Compatibility Considerations
1. **Zero UI Disruption:** All existing pages (`DhanPage`, `KaamPage`, `SehatPage`, `KaushalPage`, `HaqSetuPage`, `ProfilePage`) maintain their exact UI components and layouts.
2. **Offline-First Resilience:** If the user is offline or the Render backend is cold-starting, the app continues reading from `localStorage` without freezing. When connectivity resumes, the background sync pushes pending entries to FastAPI.
3. **APK Parity:** Because the APK runs the web bundle inside an Android WebView, updating the Vercel deployment automatically updates the APK.

---

### 5. Deployment Steps for Vercel and Render

#### Step 1: Database Setup (Supabase)
- Create a free-tier Supabase project.
- Execute the schema migration SQL via the Supabase SQL Editor.
- Enable RLS policies for table security.

#### Step 2: Backend Deployment (Render)
- Add `asyncpg`, `sqlalchemy`, and `pyjwt` to `ml_service/requirements.txt`.
- Add database connection pool and auth verification dependency.
- Configure `DATABASE_URL` and `SUPABASE_JWT_SECRET` in Render Environment Settings.
- Deploy Render service and verify `/health` and `/api/transactions` status.

#### Step 3: Frontend Deployment (Vercel)
- Install `@supabase/supabase-js` in frontend.
- Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` in Vercel Environment Variables.
- Fix hardcoded `http://127.0.0.1:8000` in `healthService.ts` to use `VITE_API_BASE_URL`.
- Trigger Vercel redeployment.

---

### 6. Security, Integrity, and Regression Tests

1. **Authentication Token Verification Test:**
   - Attempt to call `POST /api/transactions` without token $\to$ Expect `401 Unauthorized`.
   - Attempt to call with an invalid or expired token $\to$ Expect `401 Unauthorized`.
2. **User Isolation Test:**
   - User A attempts to `DELETE /api/transactions/{id}` belonging to User B $\to$ Expect `404 Not Found` or `403 Forbidden`.
3. **Demo Data Contamination Test:**
   - Verify that transactions with ID `tx_demo_*` or `sample_*` are never committed to PostgreSQL.
4. **Offline Sync Idempotency Test:**
   - Submit the same batch of offline transactions twice $\to$ Verify database contains only 1 copy (enforced by `uq_user_client_tx`).
5. **Cold-Start Resilience Test:**
   - Test frontend loading while Render backend is spinning up $\to$ Verify app renders smoothly with local cache without crashing.

---

### 7. Rollback & Disaster Recovery Plan

1. **Feature Flag / Graceful Degradation:**
   - The frontend will retain a fallback flag: if `VITE_SUPABASE_URL` is not provided or if the backend returns a 5xx error, the app automatically operates in Local-First Demo Mode (the exact current behavior).
2. **Database Rollback:**
   - Full migration scripts will include reversible `DOWN` scripts (`DROP TABLE IF EXISTS ...`).
3. **Zero Breaking Changes:**
   - Existing mock data routines and AI model endpoints remain untouched. No existing API contracts will be removed.

---

### 8. Phased Roadmap & Manual Setup Required by You

#### What You Will Need to Do (Manual One-Time Setup):
1. Create a free Supabase account at `https://supabase.com` and click "New Project".
2. Obtain the following details from your Supabase Project Settings:
   - Project URL
   - Project Anon Key (Public)
   - Project JWT Secret (Settings -> API)
   - PostgreSQL URI (Transaction Connection Pooler URL)
3. Add the environment variables into the Vercel and Render dashboards.

#### Phased Implementation Stages (Upon Your Approval):
- **Stage 1:** Setup Supabase schema, connection engine, and JWT verification in FastAPI.
- **Stage 2:** Implement user profile & transaction CRUD endpoints in FastAPI with user-level isolation.
- **Stage 3:** Integrate Supabase Auth client into frontend with seamless Phone/Email sign-in and local-to-cloud migration modal.
- **Stage 4:** Update `transactionService.ts` to sync with FastAPI when authenticated while maintaining offline cache.
- **Stage 5:** Update Marketplace and Haq Setu services to persist bookings and cases in PostgreSQL.
- **Stage 6:** End-to-end testing across Web, Render, and Android APK.

---

## Confirmed Facts vs. Assumptions Matrix

| Item | Status | Verification Source |
| :--- | :--- | :--- |
| Frontend uses `localStorage` for all user data | **Confirmed Fact** | Audited in `src/hooks/ProfileContext.tsx`, `transactionService.ts`, `marketplaceService.ts`, `healthService.ts`, `haqService.ts`. |
| Transactions auto-seed 5 days of dummy data if empty | **Confirmed Fact** | Audited in `transactionService.ts` lines 371–389 (`generateDemoPastTransactions`). |
| Current login is purely local and unauthenticated | **Confirmed Fact** | Audited in `App.tsx` (`RequireOnboarding`) and `ProfileContext.tsx`. |
| FastAPI has no database drivers or database connections | **Confirmed Fact** | Audited in `ml_service/requirements.txt` and `main.py`. |
| Marketplace persistence relies on an uncommitted local JSON file | **Confirmed Fact** | Audited in `ml_service/marketplace.py` (`marketplace_data.json`). |
| No external database is currently configured on Render | **Confirmed Fact** | Audited across all environment configs, Dockerfile, and Procfile. |
| No secrets or API keys are exposed in the frontend | **Confirmed Fact** | Comprehensive regex grep across `src/`, `public/`, and `index.html`. |
| The APK is a WebView wrapper running the same web frontend | **Confirmed Fact** | Audited in `scripts/sync_android_icons.py`, `android-res/`, and `public/manifest.json`. |
| `healthService.ts` has a hardcoded localhost URL bug | **Confirmed Fact** | Audited in `src/services/healthService.ts` line 10 (`http://127.0.0.1:8000/health-service`). |
| Supabase Auth is suitable for this stack | **Confirmed Fact** | Compatible with React 18, Vite, FastAPI (JWT), and mobile responsive views. |
| User desires Phone OTP or Email authentication | **Assumption to Confirm** | Needs user preference confirmation (Phone Number OTP vs. Email + Password). |

---

> **STOPPING HERE PER YOUR INSTRUCTION.**  
> No application code, backend endpoints, or deployment settings have been altered.  
> Please review this audit report and let me know your preferred authentication method (Phone OTP or Email/Password) and if you approve proceeding with Stage 1 of the implementation plan!
