# AI/ML Specification

## 1. AI/ML objectives

Setu uses AI/ML to reduce typing, understand worker needs, predict income patterns, match workers to opportunities, and retrieve useful information.

The AI must always be explainable, source-linked where appropriate, and never used for high-stakes automated decisions.

## 2. Model map

| Module | Task | Model | Output |
|---|---|---|---|
| Voice | Speech-to-text | Whisper small/medium or IndicConformer | Transcript |
| Language | Language identification | FastText / langdetect | Language code |
| Money | Entity extraction | spaCy NER / transformer NER | Amount, date, category, work type |
| Money | Expense classification | TF-IDF + Logistic Regression → DistilBERT | Expense category |
| Money | Income forecasting | Linear Regression → Random Forest → LSTM/Prophet | 7-day income forecast |
| Money | Anomaly detection | Isolation Forest | Unusual income/expense alert |
| Money | Stability score | Random Forest / XGBoost | 0–100 score |
| Kaam | Job matching | Sentence Transformers + cosine similarity | Ranked jobs |
| Kaam | Recommendation | Content-based + collaborative filtering | Personalized suggestions |
| Sehat | Intent detection | Logistic Regression / DistilBERT | Health, scheme, work, money intent |
| Sehat/Kaushal | Information retrieval | Sentence Transformers + FAISS/pgvector | Top relevant documents |
| Sehat/Kaushal | Answer generation | LLM + RAG | Source-linked answer |
| Kaushal | Skill extraction | NER / zero-shot classifier | Structured skills |
| Kaushal | Course recommendation | Embedding similarity | Recommended courses |
| Kaushal | Profile generation | Template + LLM summarization | Skill Passport |

## 3. Speech-to-text

### Model choice

Use **Whisper** for the MVP.

Recommended versions:

- `whisper-small`: Faster, suitable for demos
- `whisper-medium`: Better accuracy, needs more compute
- Hosted Whisper API: Easiest for a college project

Whisper supports multilingual speech recognition, speech translation, spoken-language identification, and voice activity detection. [web:89]

### Input

- 5–30 second audio recording
- Formats: WAV, M4A, or MP3
- Sample rate: 16 kHz preferred

### Output

```json
{
  "transcript": "आज 800 रुपये कमाए, 150 पेट्रोल में गए",
  "language": "hi",
  "confidence": 0.91
}
```

## 4. Information extraction

### Example

Input:

```text
आज 800 रुपये कमाए, 150 पेट्रोल में गए
```

Output:

```json
{
  "income": {
    "amount": 800,
    "currency": "INR",
    "date": "2026-10-11"
  },
  "expense": {
    "amount": 150,
    "category": "travel_fuel",
    "date": "2026-10-11"
  }
}
```

### Approach

1. Use regex and number normalization for amounts.
2. Use keyword dictionaries for common categories.
3. Use spaCy NER or a fine-tuned transformer NER model for names, locations, dates, and skills.
4. Ask the user to confirm before saving.

## 5. Expense classification

### Classes

- `travel_fuel`
- `food`
- `rent`
- `tools`
- `mobile_internet`
- `medical`
- `education`
- `family`
- `other`

### Baseline model

```text
Text → TF-IDF → Logistic Regression → Category
```

### Improved model

```text
Text → multilingual MiniLM/DistilBERT embedding → Logistic Regression → Category
```

### Evaluation

Use macro F1 because some categories will have fewer examples.

## 6. Income forecasting

### MVP model

Use a per-worker model only after at least 14 days of data.

Features:

- Day of week
- Month
- Festival/holiday indicator
- Weather indicator, optional
- Previous 7-day income
- Previous 14-day income
- Number of work days
- Average income
- Expense ratio

### Model progression

1. **Baseline:** Rolling 7-day average
2. **Classical ML:** Random Forest Regressor
3. **Time-series:** Prophet or SARIMA
4. **Deep learning:** LSTM only if enough data exists

### Output

Always return a range:

```json
{
  "forecast_start": "2026-10-12",
  "forecast_end": "2026-10-18",
  "predicted_income": 4600,
  "lower_bound": 3900,
  "upper_bound": 5400,
  "confidence": "medium"
}
```

## 7. Job matching

### Worker profile embedding

Combine:

- Occupation
- Skills
- Experience
- City
- Availability

Example:

```text
Electrician in Pune with 4 years experience. Skills: house wiring, fan repair, switchboard repair. Available full-time.
```

### Job embedding

Embed the job title, description, required skills, and location.

### Matching score

\[
	ext{Match Score} = 0.60 	imes 	ext{Skill Similarity} + 0.25 	imes 	ext{Location Score} + 0.15 	imes 	ext{Availability Score}
\]

### Output

```json
{
  "job_id": 102,
  "title": "Electrician Helper",
  "match_score": 0.92,
  "distance_km": 2.4,
  "reason": "Matches wiring and fan-repair skills; located in Pune"
}
```

## 8. Retrieval-Augmented Generation

### Knowledge base

Include only verified public sources:

- Ministry of Labour and Employment pages
- e-Shram information
- National Career Service information
- Skill India / NSDC information
- State health department pages
- Public hospital directories
- Emergency helpline pages

### Retrieval process

1. Split documents into 200–400 word chunks.
2. Generate embeddings using `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` or a similar multilingual model.
3. Store embeddings in FAISS or pgvector.
4. Retrieve top 5 chunks.
5. Generate an answer using only those chunks.
6. Display source links.

### Safety rule

If retrieved context does not contain the answer, respond:

> “इस सवाल का पक्का जवाब उपलब्ध स्रोतों में नहीं मिला। कृपया आधिकारिक स्रोत से जांच करें।”

Do not allow the LLM to invent scheme eligibility or medical advice.

## 9. Financial Stability Score

The score is informational and ranges from 0 to 100.

| Factor | Weight |
|---|---|
| Income regularity | 25% |
| Savings rate | 25% |
| Emergency-fund progress | 20% |
| Work-day consistency | 15% |
| Expense stability | 15% |

### Labels

| Score | Label |
|---|---|
| 0–39 | Needs attention |
| 40–59 | Building stability |
| 60–79 | Stable |
| 80–100 | Strong |

The app must state:

> “यह स्कोर केवल आपकी वित्तीय स्थिति समझने में मदद के लिए है। यह लोन या किसी सेवा के लिए निर्णय का आधार नहीं है।”

## 10. Model training plan

### Phase 1: Rule-based system

- Regex for amounts and dates
- Keyword dictionaries for categories
- Simple average-based forecast

### Phase 2: Classical ML

- TF-IDF + Logistic Regression for expense classification
- Random Forest for forecasting
- Isolation Forest for anomaly detection

### Phase 3: Transformer enhancement

- Multilingual sentence embeddings for matching
- DistilBERT/multilingual MiniLM for classification
- Whisper for speech-to-text

### Phase 4: RAG

- Build document chunks
- Generate embeddings
- Create FAISS index
- Connect LLM with strict retrieved-context prompting

## 11. Model storage

```text
ml/
├── models/
│   ├── expense_classifier.pkl
│   ├── income_forecaster.pkl
│   ├── anomaly_detector.pkl
│   ├── embeddings/
│   └── faiss_index/
├── data/
│   ├── raw/
│   ├── processed/
│   └── synthetic/
└── evaluation/
    ├── classification_report.json
    └── forecast_metrics.json
```
