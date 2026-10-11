# Dataset Specification

## 1. Dataset principles

Setu does not require confidential worker bank data, real employer data, or sensitive medical records.

Use:

- Synthetic worker profiles
- Synthetic income/expense records
- Public job descriptions
- Public government scheme pages
- Public health-resource directories
- Team-recorded voice samples
- Manually labelled NLP examples

## 2. Dataset folders

```text
ml/data/
├── raw/
│   ├── voice/
│   ├── jobs/
│   ├── schemes/
│   └── health/
├── processed/
│   ├── income_expenses.csv
│   ├── expense_classification.csv
│   ├── worker_profiles.csv
│   ├── job_matches.csv
│   └── rag_chunks.jsonl
└── synthetic/
    ├── worker_profiles.csv
    ├── income_expenses.csv
    └── voice_transcripts.csv
```

## 3. Worker profile dataset

File: `worker_profiles.csv`

| Column | Type | Example |
|---|---|---|
| worker_id | string | W001 |
| name | string | Ramesh Kumar |
| city | string | Pune |
| state | string | Maharashtra |
| occupation | string | Electrician |
| skills | string | wiring; fan repair; switchboard repair |
| experience_years | integer | 4 |
| languages | string | Hindi; Marathi |
| availability | string | full_time |
| preferred_work_type | string | repair; construction |
| created_at | datetime | 2026-10-11 10:00:00 |

Generate at least **500 synthetic profiles** for testing.

## 4. Income and expense dataset

File: `income_expenses.csv`

| Column | Type | Example |
|---|---|---|
| entry_id | string | E001 |
| worker_id | string | W001 |
| entry_type | string | income / expense |
| amount | float | 800 |
| category | string | work_income / travel_fuel |
| work_type | string | electrician |
| date | date | 2026-10-11 |
| source | string | voice / manual |
| city | string | Pune |

Generate at least **6 months** of synthetic records for 100–200 simulated workers.

### Income categories

- `daily_wage`
- `delivery_income`
- `ride_income`
- `repair_income`
- `sales_income`
- `bonus`
- `other_income`

### Expense categories

- `travel_fuel`
- `food`
- `rent`
- `tools`
- `mobile_internet`
- `medical`
- `education`
- `family`
- `other`

## 5. Expense classification dataset

File: `expense_classification.csv`

| text | label |
|---|---|
| “150 rupaye petrol mein gaye” | travel_fuel |
| “Auto ka kiraya 60 diya” | travel_fuel |
| “Khane mein 120 kharch kiye” | food |
| “Room ka kiraya diya” | rent |
| “Naya screwdriver liya” | tools |
| “Mobile recharge kiya” | mobile_internet |
| “Dawai kharidi” | medical |

Create at least **1,000 labelled examples**, with at least 80 examples per category.

## 6. Voice dataset

Create a small, team-collected dataset.

| Field | Requirement |
|---|---|
| Total clips | 300–800 |
| Languages | Hindi, English, optionally Marathi |
| Speakers | At least 5–10 |
| Duration | 3–15 seconds per clip |
| Content | Income, expense, work search, skill, health query |
| Format | WAV, 16 kHz preferred |

Example labels:

| audio_file | transcript | intent | extracted_fields |
|---|---|---|---|
| v001.wav | “Aaj 800 kamaye” | money_income | amount: 800 |
| v002.wav | “150 petrol mein gaye” | money_expense | amount: 150, category: travel_fuel |
| v003.wav | “Mujhe Pune mein plumber ka kaam chahiye” | job_search | skill: plumber, city: Pune |

## 7. Job dataset

File: `jobs.csv`

| Column | Example |
|---|---|
| job_id | J001 |
| title | Electrician Helper |
| description | Required for shop wiring and fan repair work |
| skills_required | wiring; fan repair |
| city | Pune |
| locality | Kothrud |
| pay_min | 700 |
| pay_max | 900 |
| work_type | repair |
| duration | 1_day |
| source | synthetic / public listing |

Create at least **300 jobs** for the MVP.

## 8. Health-resource dataset

File: `health_resources.csv`

| Column | Example |
|---|---|
| resource_id | H001 |
| name | Yerawada Municipal Hospital |
| type | government_hospital |
| city | Pune |
| address | Yerawada, Pune |
| services | OPD; emergency; pharmacy |
| latitude | 18.55 |
| longitude | 73.88 |
| source_url | official government/health link |

Use only publicly available and verifiable sources.

## 9. Welfare/scheme dataset

File: `schemes.jsonl`

Each record should contain:

```json
{
  "scheme_id": "S001",
  "title": "e-Shram Registration",
  "category": "social_security",
  "eligibility": "Unorganised sector worker aged 16-59",
  "benefits": "UAN card and access to welfare schemes",
  "application_process": "Register through the official e-Shram portal or Common Service Centre",
  "source_url": "https://eshram.gov.in/",
  "last_verified": "2026-10-11"
}
```

Include only official or clearly reliable public sources.

## 10. RAG chunk dataset

File: `rag_chunks.jsonl`

Each chunk:

```json
{
  "chunk_id": "C001",
  "source_id": "S001",
  "title": "e-Shram Registration",
  "text": "e-Shram provides a UAN to unorganised workers and helps connect them with welfare schemes.",
  "source_url": "https://eshram.gov.in/",
  "language": "en",
  "chunk_length": 42
}
```

Chunk length:

- Minimum: 80 words
- Maximum: 400 words
- Recommended: 200–300 words

## 11. Data quality rules

- Remove duplicate entries.
- Normalize all currency values to INR.
- Standardize dates to `YYYY-MM-DD`.
- Remove personally identifiable information from any real sample.
- Keep a `source_url` for every health/scheme document.
- Maintain a `labelled_by` and `reviewed_by` column for labelled datasets.
- Do not use real worker financial records without explicit informed consent.

## 12. Dataset split

| Dataset | Train | Validation | Test |
|---|---:|---:|---:|
| Expense classification | 70% | 15% | 15% |
| Intent classification | 70% | 15% | 15% |
| Job matching | 70% | 15% | 15% |
| Forecasting | Chronological train/test split |  |  |

For forecasting, never randomly shuffle time-series data. Train on earlier dates and test on later dates.
