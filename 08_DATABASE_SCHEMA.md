# Database Schema

## 1. Database

Use **PostgreSQL**.

Use UUIDs or integer primary keys. For a college MVP, integer IDs are simpler.

## 2. Entity relationship overview

```text
users 1---* income_entries
users 1---* expense_entries
users 1---* savings_goals
users 1---* user_skills
users 1---* job_matches
users 1---* voice_logs

skills 1---* user_skills
jobs 1---* job_matches
schemes 1---* rag_chunks
health_resources are standalone reference records
```

## 3. Tables

### `users`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(120),
    city VARCHAR(100),
    state VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    occupation VARCHAR(120),
    experience_years INT DEFAULT 0,
    availability VARCHAR(30),
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `skills`

```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    category VARCHAR(80),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `user_skills`

```sql
CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    experience_years INT DEFAULT 0,
    proficiency VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, skill_id)
);
```

### `jobs`

```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    employer_name VARCHAR(160),
    city VARCHAR(100),
    locality VARCHAR(120),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    pay_min NUMERIC(12,2),
    pay_max NUMERIC(12,2),
    work_type VARCHAR(80),
    duration VARCHAR(60),
    source VARCHAR(120),
    source_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `job_skills`

```sql
CREATE TABLE job_skills (
    id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    UNIQUE (job_id, skill_id)
);
```

### `job_matches`

```sql
CREATE TABLE job_matches (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_score NUMERIC(5,4),
    skill_similarity NUMERIC(5,4),
    distance_km NUMERIC(8,2),
    status VARCHAR(30) DEFAULT 'suggested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, job_id)
);
```

### `income_entries`

```sql
CREATE TABLE income_entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    category VARCHAR(60) DEFAULT 'daily_wage',
    work_type VARCHAR(80),
    source VARCHAR(30) DEFAULT 'voice',
    entry_date DATE NOT NULL,
    city VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `expense_entries`

```sql
CREATE TABLE expense_entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    category VARCHAR(60) NOT NULL,
    entry_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `savings_goals`

```sql
CREATE TABLE savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(120) NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL,
    current_amount NUMERIC(12,2) DEFAULT 0,
    start_date DATE NOT NULL,
    target_date DATE,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `health_resources`

```sql
CREATE TABLE health_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    resource_type VARCHAR(60),
    city VARCHAR(100),
    state VARCHAR(100),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    services TEXT,
    phone VARCHAR(30),
    source_url TEXT,
    last_verified DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `schemes`

```sql
CREATE TABLE schemes (
    id SERIAL PRIMARY KEY,
    scheme_id VARCHAR(40) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80),
    eligibility TEXT,
    benefits TEXT,
    application_process TEXT,
    source_url TEXT NOT NULL,
    last_verified DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `rag_chunks`

```sql
CREATE TABLE rag_chunks (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(40) NOT NULL,
    source_id INT,
    title VARCHAR(200),
    content TEXT NOT NULL,
    source_url TEXT,
    language VARCHAR(10) DEFAULT 'en',
    embedding VECTOR(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

If using FAISS instead of pgvector, remove the `embedding VECTOR(384)` column and store embeddings in a FAISS index file.

### `voice_logs`

```sql
CREATE TABLE voice_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    audio_url TEXT,
    transcript TEXT,
    detected_language VARCHAR(10),
    intent VARCHAR(60),
    extracted_data JSONB,
    model_name VARCHAR(80),
    processing_time_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `skill_passports`

```sql
CREATE TABLE skill_passports (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdf_url TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    summary JSONB
);
```

## 4. Indexes

```sql
CREATE INDEX idx_income_user_date ON income_entries(user_id, entry_date);
CREATE INDEX idx_expense_user_date ON expense_entries(user_id, entry_date);
CREATE INDEX idx_jobs_city_active ON jobs(city, is_active);
CREATE INDEX idx_job_matches_user ON job_matches(user_id);
CREATE INDEX idx_rag_chunks_source ON rag_chunks(source_type, source_id);
```

## 5. Data-retention rules

- Keep only necessary personal fields.
- Allow users to delete their profile and associated data.
- Do not retain raw audio longer than needed for processing.
- Anonymize or delete voice logs after model evaluation unless the user consents to retention.
