# Setu AI/ML Models

## Models
1. Expense Classification
2. Income Forecasting
3. Anomaly Detection
4. Voice Recognition
5. Transaction Information Extraction
6. Job Matching
7. Skill and Course Recommendation
8. Health and Welfare RAG


# Setu --- README: All 8 AI/ML Models

**Project:** Setu --- AI-Powered Livelihood Companion for India's
Informal & Gig Workers\
**Repository:** `fairwork-setu` \| **Branch context:** `ai-models`

> **Status disclaimer:** This document consolidates the eight model
> approaches and the current scaffold information available for this
> project. A scaffold is not proof of successful training, validation,
> or production integration. Verify filenames, arguments, datasets,
> dependencies, and metrics against the latest repository before making
> final project claims.

## Table of contents

1.  [Project overview](#1-project-overview)
2.  [All models at a glance](#2-all-models-at-a-glance)
3.  [Repository structure](#3-repository-structure)
4.  [Model 1 --- Expense
    Classification](#4-model-1--expense-classification)
5.  [Model 2 --- Income Forecasting](#5-model-2--income-forecasting)
6.  [Model 3 --- Anomaly Detection](#6-model-3--anomaly-detection)
7.  [Model 4 --- Voice Recognition](#7-model-4--voice-recognition)
8.  [Model 5 --- Transaction Information
    Extraction](#8-model-5--transaction-information-extraction)
9.  [Model 6 --- Job Matching &
    Recommendation](#9-model-6--job-matching--recommendation)
10. [Model 7 --- Skill Extraction & Course
    Recommendation](#10-model-7--skill-extraction--course-recommendation)
11. [Model 8 --- Health & Welfare RAG](#11-model-8--health--welfare-rag)
12. [How the models work together](#12-how-the-models-work-together)
13. [Data and dataset requirements](#13-data-and-dataset-requirements)
14. [Evaluation strategy](#14-evaluation-strategy)
15. [Privacy, safety, and fairness](#15-privacy-safety-and-fairness)
16. [Backend integration](#16-backend-integration)
17. [Setup and execution](#17-setup-and-execution)
18. [Roadmap and definition of done](#18-roadmap-and-definition-of-done)

------------------------------------------------------------------------

## 1. Project overview

Setu is an AI-powered livelihood companion for India's informal and gig
workers. Its product concept connects four areas:

-   **Dhan:** income and expense understanding, cash-flow visibility,
    and financial insights.
-   **Kaam:** job discovery and worker-to-job matching.
-   **Kaushal:** skill identification and learning recommendations.
-   **Sehat:** retrieval of useful health, welfare, and public-benefit
    information.

The eight model modules are separated so each can be developed,
evaluated, and integrated independently. The shared principles are:
useful outputs, transparent limitations, reviewed evaluation data,
privacy by design, and safe fallbacks when a model is uncertain.

## 2. All models at a glance

  ----------------------------------------------------------------------------------
  \#             Model            Approach          Main output    Current maturity
                                                                   note
  -------------- ---------------- ----------------- -------------- -----------------
  1              Expense          TF-IDF + Logistic Expense        Requires labeled
                 Classification   Regression        category       data, training,
                                                                   and evaluation

  2              Income           Random Forest     Forecast for a Requires
                 Forecasting      Regressor +       future period  time-aware data
                                  rolling-average                  and baseline
                                  baseline                         comparison

  3              Anomaly          Isolation Forest  Anomaly        Threshold and
                 Detection                          score/flag     false positives
                                                                   require review

  4              Voice            Pretrained        Speech         Not fine-tuned on
                 Recognition      Whisper/Indic ASR transcript     Setu audio unless
                 (ASR)            inference                        explicitly done

  5              Transaction      Rule-based        Candidate      Starter rules,
                 Information      patterns and      transaction    not a trained NER
                 Extraction       keywords          fields         model

  6              Job Matching &   Sentence          Ranked jobs    Needs worker/job
                 Recommendation   Transformers +                   data and
                                  cosine similarity                relevance
                                                                   judgments

  7              Skill Extraction Skill vocabulary  Extracted      Needs datasets,
                 & Course         rules + Sentence  skills and     vocabulary
                 Recommendation   Transformers      ranked courses validation, and
                                  similarity                       MAP@5 evaluation

  8              Health & Welfare Chunking +        Relevant       Current scaffold
                 RAG              embeddings +      source         is
                                  FAISS             passages       retrieval-only,
                                                                   not LLM answer
                                                                   generation
  ----------------------------------------------------------------------------------

**Numbering is intentional:** Model 4 is voice recognition. Model 6 is
job matching. Model 7 is skill/course recommendation.

## 3. Repository structure

``` text
model_codes/
├── 01_expense_classification/
├── 02_income_forecasting/
├── 03_anomaly_detection/
├── 04_voice_recognition/
├── 05_transaction_extraction/
├── 06_job_matching/
├── 07_skill_recommendation/
└── 08_health_welfare_rag/
```

Depending on the task, a module may contain `config.py`, `eda.py`,
`preprocessing.py`, a task-specific training/prediction script,
`evaluate.py`, `requirements.txt`, and `README.md`. Some modules also
use `data/raw/`, `data/processed/`, `artifacts/`, and `evaluation/`. Do
not assume every module has identical files.

-   `data/raw/`: source inputs; never commit private worker or financial
    records.
-   `data/processed/`: cleaned or transformed data.
-   `artifacts/`: fitted models, vectorizers, indexes, or metadata.
-   `evaluation/`: reviewed labels and evaluation outputs.
-   `config.py`: paths, model identifiers, and settings.

## 4. Model 1 --- Expense Classification

### Objective

Classify a transaction description into a predefined expense category
for Setu's **Dhan** area. Example categories might include food,
transport, rent, utilities, healthcare, education, work supplies, and
other. The final taxonomy must be agreed and used consistently in labels
and the application.

### Method: TF-IDF + Logistic Regression

1.  Normalize transaction text.
2.  Convert the text to numeric features with TF-IDF (term
    frequency--inverse document frequency).
3.  Train Logistic Regression on human-labeled descriptions.
4.  Predict the category for new descriptions.
5.  If supported by the implementation, return class probabilities or a
    confidence indicator.

TF-IDF emphasizes words useful for distinguishing categories; Logistic
Regression learns how those features relate to the labels.

### Input data

At minimum, training data needs `description` and `category`. Other
fields should only be used if intentionally implemented and evaluated.
Avoid identifiers such as names, phone numbers, and bank-account
details.

### Illustrative example

Input: `Diesel for delivery bike`

``` json
{"category": "transport", "status": "predicted"}
```

This is an illustrative response, not a measured prediction from a
trained Setu model.

### Evaluation

Use accuracy, macro F1, per-class precision/recall, and a confusion
matrix. Compare against a majority-class baseline. Inspect errors for
misspellings, mixed Hindi-English text, short descriptions, and unseen
merchants.

### Risks and next steps

The model can struggle with sparse labels, imbalanced classes, unseen
wording, and code-switching. Finalize the category list, build a
representative labeled dataset, use a held-out test set, save the fitted
vectorizer and classifier together, and include an "unknown/needs
review" path for uncertain inputs. A predicted category is not a
verified financial fact.

## 5. Model 2 --- Income Forecasting

### Objective

Estimate income for a future period using a worker's historical records.
This supports planning in **Dhan**, but a forecast is an estimate, not a
guarantee.

### Method: Random Forest Regressor + rolling-average baseline

A Random Forest combines multiple decision trees and can model nonlinear
patterns. A rolling average provides a simple benchmark based on recent
periods. The more complex model should only be preferred if it improves
performance on later, unseen periods.

### Input data and features

At minimum, define a time period (`date` or period) and recorded
`income`. Potential features include lagged income, rolling means,
day/month indicators, and working-day counts, but only features actually
available at forecast time may be used. Missing records must not
automatically be treated as zero income without a defined rule.

### Workflow

1.  Standardize dates and the time interval (daily, weekly, or monthly).
2.  Aggregate records consistently.
3.  Create lag/rolling features using past data only.
4.  Split chronologically into train, validation, and test periods.
5.  Train the regressor and forecast the held-out period.
6.  Compare with the rolling-average baseline.
7.  Review errors across income ranges and worker contexts where sample
    sizes permit.

### Evaluation

Use MAE and RMSE, with baseline results and forecast horizon reported.
MAPE can be unstable or undefined when actual income is zero or near
zero. Random splitting can leak future information and should not be
used as the sole evaluation strategy for time series.

### Risks and next steps

Income varies with demand, weather, health, local events, seasonality,
and hours worked. Sparse history can make forecasts unreliable. Define
the forecast horizon and minimum history, implement leakage-safe
features, evaluate chronologically, and communicate uncertainty
honestly.

## 6. Model 3 --- Anomaly Detection

### Objective

Flag transactions that look unusual relative to a reference dataset,
helping a worker review a potentially unexpected record.

### Method: Isolation Forest

Isolation Forest isolates observations through randomized trees.
Observations that are easier to isolate tend to receive more anomalous
scores. The model requires a defined feature set; possible features
include amount, time-derived attributes, category, and transaction
frequency, but the actual code determines what is used.

### Workflow

1.  Validate and clean records.
2.  Transform supported features into a numeric matrix.
3.  Fit Isolation Forest on a suitable reference population.
4.  Score incoming records and apply a documented threshold.
5.  Present a neutral "review recommended" flag.
6.  Review false positives and false negatives.

### Illustrative output

``` json
{"anomaly_flag": true, "status": "review_recommended"}
```

This is an example schema only. An anomaly does **not** prove fraud,
theft, error, or misconduct.

### Evaluation

If reviewed labels are available, measure precision, recall, F1,
false-positive rate, and review volume at the chosen threshold. Without
reliable labels, report descriptive analyses and expert review rather
than claiming supervised accuracy.

### Risks and next steps

Legitimate seasonal or occupation-specific behavior may be flagged.
Thresholds depend on features and population. Document the reference
data and threshold, review errors, and never use the flag as the sole
basis for an adverse decision or accusation.

## 7. Model 4 --- Voice Recognition

### Objective

Convert spoken input into text so workers can use voice-first
interactions. ASR means Automatic Speech Recognition. This module
transcribes speech; it does not itself understand or execute the user's
request.

### Method: pretrained Whisper/Indic ASR inference

The current scaffold uses a pretrained ASR model for inference. The
precise model identifier and supported settings should be checked in
`config.py` and the transcription script. It is not fine-tuned on
Setu-specific audio unless a separate fine-tuning step is performed.

### Input/output

Input: a supported audio file, within documented size, duration, and
format limits. The current setup may require FFmpeg.

Illustrative output:

``` json
{"language": "hi", "text": "Meri aaj ki kamai ka hisaab batao"}
```

Example format only, not a transcript from a tested file.

### Workflow

Validate the audio, run the configured model, save transcript output as
TXT/JSON if supported, and pass text to the appropriate feature only
after validation. Confirm important amounts, dates, and sensitive
actions with the user when transcription errors could cause harm.

### Evaluation

Use a consented, human-transcribed test set. Measure Word Error Rate
(WER) and Character Error Rate (CER), by language and for code-switched
speech where supported. Also track latency and failures. Test accents,
background noise, speaking speed, and low-quality microphones.

### Risks and next steps

ASR can misrecognize amounts, names, accents, and local words. Define
audio retention and access policies, verify dependencies and supported
formats, benchmark WER/CER, and clearly communicate when a transcript
may be wrong.

## 8. Model 5 --- Transaction Information Extraction

### Objective

Turn unstructured transaction notes into structured candidate fields,
such as amount, date, merchant, or transaction direction where
supported. This differs from Model 1: extraction identifies details,
while classification predicts a category.

### Current method: rule-based patterns and keywords

The current module is a starter rule-based extractor, not a trained
Named Entity Recognition (NER) model. It normalizes text and applies
patterns/keywords to find supported fields.

### Illustrative example

Input: `Paid ₹250 for fuel on 12/10/2026`

``` json
{
  "amount": 250,
  "currency": "INR",
  "transaction_type": "expense",
  "date": "12/10/2026",
  "status": "extracted_candidate"
}
```

Illustrative only. Date parsing and the exact fields supported must be
confirmed against the code.

### Workflow and evaluation

Normalize input; extract candidates; standardize values; validate dates
and amounts; return missing or ambiguous values explicitly. Evaluate
each field using precision, recall, F1, amount/date exact match, and
error analysis for separators, currency symbols, misspellings, and
mixed-language text.

### Risks and next steps

Rules can fail on unseen formats and ambiguous dates. A keyword may
appear in a different context than expected. Document each rule, expand
test coverage, add ambiguity handling, and compare against an NLP/NER
baseline before changing approaches. Treat extracted values as
candidates until validated.

## 9. Model 6 --- Job Matching & Recommendation

### Objective

Rank jobs by relevance to a worker profile for Setu's **Kaam** area.
Ranking should help discovery; it does not guarantee eligibility,
hiring, safety, or job quality.

### Method: Sentence Transformers + cosine similarity

Sentence Transformers encode worker profiles and job descriptions as
dense embeddings. Cosine similarity measures semantic closeness between
vectors. Higher similarity indicates textual/semantic resemblance, not a
probability of being hired.

### Expected data

The current scaffold expects `workers.csv` and `jobs.csv`. Worker fields
may include skills, experience, job preferences, location, and
availability. Job fields may include title, description, required
skills, location, pay, schedule, and conditions. Exact column names must
match the scripts.

### Workflow

Validate records; build consistent text representations; create
embeddings; compute similarity; apply explicit eligibility constraints
separately; rank eligible jobs; return top-k results with scores and job
details. Do not rely on semantic similarity alone for hard constraints
such as location, schedule, or eligibility.

### Example command

``` powershell
python model_codes/06_job_matching/predict.py --worker-id W001 --top-k 5
```

Example only: verify current CLI flags with the module README or
`--help`.

### Evaluation

The scaffold's intended metrics include Mean Reciprocal Rank (MRR) and
Precision@5, using human-reviewed relevance labels. Recall@K or NDCG@K
may be added where appropriate. Inspect relevance across job categories
and locations, and conduct fairness reviews using lawful, necessary,
privacy-protective data.

### Risks and next steps

Generic profiles and job descriptions can produce generic rankings;
pretrained embeddings may miss local terminology. Verify job freshness,
remove duplicates, enforce eligibility filters, create relevance labels,
evaluate ranking quality, and ensure similarity scores are not described
as hiring probabilities.

## 10. Model 7 --- Skill Extraction & Course Recommendation

### Objective

Identify skills mentioned in a worker profile and rank learning
resources that may help build relevant skills. This supports **Kaushal**
and contains two linked tasks: skill extraction and course ranking.

### Current method

-   **Skill extraction:** predefined skill vocabulary and rule-based
    matching.
-   **Course recommendation:** Sentence Transformers embeddings plus
    cosine similarity.
-   **Inputs expected by the scaffold:** `workers.csv` and
    `courses.csv`.
-   **Evaluation plan:** MAP@5 using human-reviewed relevance labels.

### Workflow

1.  Normalize worker profile text.
2.  Match known skill terms using the vocabulary.
3.  Review false matches and missed synonyms.
4.  Encode the worker learning profile and course descriptions.
5.  Compute cosine similarity and rank courses.
6.  Apply filters such as language, price, duration, or accessibility
    only if those fields are implemented and trustworthy.
7.  Display course details and the skills it claims to teach.

### Evaluation

MAP@5 (Mean Average Precision at 5) evaluates the ranking of relevant
courses in the top five. Create reviewed relevance labels for each test
profile. Also evaluate skill extraction precision and recall separately;
a good ranking score cannot compensate for incorrect extracted skills.

### Risks and next steps

The vocabulary can miss synonyms, spelling variations, new skills, and
regional-language terms. Semantic similarity does not prove course
quality, accreditation, or job outcomes. Add finalized datasets, expand
and validate the vocabulary, verify course metadata, create relevance
labels, evaluate both subtasks, and test backend integration. This is a
pretrained-embedding/rule-based scaffold, not a model trained and
validated on Setu-specific data.

## 11. Model 8 --- Health & Welfare RAG

### Objective

Help workers find relevant material in trusted health and welfare
documents, supporting **Sehat**. The current scaffold retrieves passages
from a local document corpus. It does **not yet generate full answers
with an LLM**.

### Method: chunking + embeddings + FAISS

The described scaffold: 1. Reads `.txt` and `.md` files from
`data/raw/`. 2. Cleans text and divides documents into overlapping
chunks. 3. Embeds chunks using the configured Sentence Transformers
model. 4. Builds a FAISS vector index and saves chunk metadata. 5.
Embeds a query and retrieves the top-k similar chunks. 6. Returns
passages and source details for inspection.

Typical module scripts include `config.py`, `eda.py`,
`preprocessing.py`, `build_index.py`, `retrieve.py`, `predict.py`, and
`evaluate.py`. Verify the current directory and filenames in the
repository.

### Example commands

``` powershell
python -m pip install -r model_codes/08_health_welfare_rag/requirements.txt
python model_codes/08_health_welfare_rag/build_index.py
python model_codes/08_health_welfare_rag/predict.py --query "What welfare schemes may be relevant to gig workers?"
```

Add documents before building the index. Check `--help` or the code if
the CLI changes.

### Corpus quality

Use authoritative and current sources. Preserve source name,
URL/provider, jurisdiction, publication/update date, and document
version where available. Rebuild the index when the corpus changes and
record the corpus version. A similarity score does not prove that a
passage is current or authoritative.

### Evaluation

The scaffold's planned metric is MRR@4 using reviewed query-to-passage
relevance labels. This measures retrieval ranking, not the correctness
of generated answers. Review missing evidence, outdated material,
conflicting documents, and unsupported queries.

### What full RAG still needs

A future answer-generation layer must use retrieved passages as
evidence, cite sources, abstain when evidence is insufficient, and be
tested for unsupported claims and hallucinations. It should distinguish
official guidance from explanatory content and avoid unsupported medical
diagnoses or definitive eligibility decisions.

### Risks and next steps

Add verified documents, preserve provenance, build the index, create
relevance labels, evaluate retrieval, then implement grounded answer
generation if required. Until then, describe this module as **document
retrieval**, not a complete conversational RAG system.

## 12. How the models work together

``` text
Voice input ──> Model 4 ASR ──> transcript ──> relevant Setu feature

Transaction text ──> Model 5 extraction ──> structured candidates
                                      ├──> Model 1 expense category
                                      └──> Model 3 anomaly review flag

Historical income records ──> Model 2 income forecast

Worker profile + job data ──> Model 6 ranked jobs

Worker profile + course catalogue ──> Model 7 skills and courses

Question + verified document corpus ──> Model 8 retrieved evidence
```

This is a proposed system-level workflow, not evidence that all modules
are already connected. Each connection needs a defined schema,
validation, error handling, and tests.

## 13. Data and dataset requirements

For each dataset, document its source, owner, collection date, permitted
use, schema, units, missing-value rules, label definitions, reviewer
process, split strategy, and known gaps. Keep personal identifiers
separate from model features and do not commit sensitive data.

  -----------------------------------------------------------------------
  Model                               Minimum data or resource needed
  ----------------------------------- -----------------------------------
  1                                   Labeled transaction descriptions
                                      and category labels

  2                                   Historical income with consistent
                                      dates/periods

  3                                   Transaction features; reviewed
                                      labels are strongly useful for
                                      evaluation

  4                                   Supported audio files and
                                      human-verified transcripts for
                                      evaluation

  5                                   Transaction text plus human-labeled
                                      extracted fields for evaluation

  6                                   Worker profiles, job catalogue, and
                                      relevance judgments

  7                                   Worker profiles, course catalogue,
                                      skill vocabulary, and relevance
                                      judgments

  8                                   Verified `.txt`/`.md` documents,
                                      test questions, and
                                      relevant-passage labels
  -----------------------------------------------------------------------

Never use names, phone numbers, bank account details, Aadhaar numbers,
exact addresses, or other direct identifiers as features unless a
specifically reviewed and approved requirement justifies processing
them. Keep sensitive data out of logs, screenshots, public sample data,
and Git history.

## 14. Evaluation strategy

  -----------------------------------------------------------------------
  Model                   Recommended primary     Additional checks
                          evaluation              
  ----------------------- ----------------------- -----------------------
  1\. Expense             Macro F1                Accuracy, per-class
  Classification                                  precision/recall,
                                                  confusion matrix

  2\. Income Forecasting  MAE versus              RMSE, chronological
                          rolling-average         holdout, forecast
                          baseline                horizon

  3\. Anomaly Detection   Precision/recall where  False positives, review
                          reviewed labels exist   workload

  4\. Voice Recognition   WER                     CER, language-wise
                                                  quality, latency

  5\. Transaction         Field/entity precision, Amount/date exact match
  Extraction              recall, F1              

  6\. Job Matching        MRR and Precision@5     Recall@K/NDCG@K,
                                                  fairness checks

  7\. Skill/Course        MAP@5                   Skill extraction
  Recommendation                                  precision/recall

  8\. Health/Welfare      MRR@4                   Recall@K, source
  Retrieval                                       freshness,
                                                  unsupported-query
                                                  handling
  -----------------------------------------------------------------------

Keep test examples separate from model development and threshold tuning.
Report sample size, time period, data limitations, and baseline results
with every metric. Inspect failure cases; do not claim accuracy or
readiness unless measured.

## 15. Privacy, safety, and fairness

Setu may process financial records, employment information, voice
recordings, worker profiles, and health/welfare questions.

-   Obtain appropriate consent and explain data use.
-   Collect only what is necessary and restrict access.
-   Use secure transport/storage and defined retention/deletion
    policies.
-   Avoid logging raw sensitive content by default.
-   Provide correction paths for incorrect profiles or outputs.
-   Review whether recommendations systematically perform worse for
    particular worker groups.
-   Use human review for high-impact decisions and uncertain cases.
-   Treat outputs as decision support, not authoritative facts.

Specific cautions: - Anomaly flags do not prove fraud. - Income
forecasts are estimates, not guarantees. - Job scores are not hiring
probabilities. - Course similarity is not proof of quality or employment
outcomes. - ASR transcripts may misstate amounts, names, and dates. -
Health/welfare responses require current authoritative sources,
provenance, and abstention when evidence is insufficient.

## 16. Backend integration

Wrap each module behind a clear service/API boundary. A proposed common
response shape is:

``` json
{
  "model": "model_identifier",
  "version": "version_identifier",
  "status": "success",
  "result": {},
  "warnings": []
}
```

This is a suggested contract, not an existing universal API. Define the
`result` schema separately for each model.

Integration checklist: 1. Validate inputs, types, lengths, and ranges.
2. Return structured errors for missing data, artifacts, or
dependencies. 3. Load models/indexes efficiently and safely. 4. Set
timeouts and upload limits, especially for audio. 5. Keep sensitive text
out of logs by default. 6. Record model/artifact versions for
reproducibility. 7. Provide safe fallbacks for uncertain or unsupported
inputs. 8. Test valid, empty, malformed, oversized, and adversarial
requests. 9. Monitor latency, error rates, corrections, and quality
signals with privacy safeguards. 10. Version schemas and endpoints as
the modules evolve.

## 17. Setup and execution

### Prerequisites

-   Python compatible with the versions required by each module.
-   Git and the repository.
-   Internet access for initial downloads where needed.
-   FFmpeg for the current voice pipeline if required.
-   Adequate disk/memory for embedding models, indexes, and ASR.

### Windows PowerShell

``` powershell
cd C:\Projects\fairwork-setu
```

Install one module's dependencies at a time:

``` powershell
python -m pip install -r model_codes/08_health_welfare_rag/requirements.txt
```

Replace the path for another module. Dependencies are not necessarily
shared.

Inspect a module and its CLI:

``` powershell
Get-ChildItem model_codes/07_skill_recommendation -Recurse
python model_codes/07_skill_recommendation/predict.py --help
```

Not all scripts necessarily implement `--help`. Check each module README
and its code for required input files and artifacts before running it. A
script running successfully does not prove model quality.

## 18. Roadmap and definition of done

### Current status summary

  -----------------------------------------------------------------------
  Model                   Current described       Main next step
                          scaffold                
  ----------------------- ----------------------- -----------------------
  1                       TF-IDF + Logistic       Finalize labeled data,
                          Regression approach     train, evaluate, save
                                                  artifacts

  2                       Random Forest +         Leakage-safe time
                          rolling-average         features and
                          baseline approach       chronological
                                                  evaluation

  3                       Isolation Forest        Confirm
                          approach                features/threshold and
                                                  review false positives

  4                       Pretrained ASR          Verify dependencies and
                          inference scaffold      measure WER/CER

  5                       Rule-based extraction   Expand rules and
                          scaffold                evaluate against
                                                  labeled fields

  6                       Sentence Transformers + Add worker/job data and
                          cosine similarity       ranking relevance
                                                  labels

  7                       Vocabulary rules +      Finalize datasets,
                          semantic course ranking validate vocabulary,
                                                  evaluate MAP@5

  8                       Embedding + FAISS       Add verified corpus and
                          retrieval scaffold      evaluate MRR@4; answer
                                                  generation remains
                                                  future work
  -----------------------------------------------------------------------

### Recommended phases

**Phase 1 --- Runnable:** verify paths, dependencies, CLI arguments, and
artifact generation with synthetic test fixtures.\
**Phase 2 --- Data:** finalize appropriate datasets, schemas, labels,
source provenance, and privacy safeguards.\
**Phase 3 --- Evaluation:** create held-out sets, run task metrics,
compare baselines, and document failure cases.\
**Phase 4 --- Integration:** define APIs, schemas, error handling, and
product-level connections.\
**Phase 5 --- Monitoring:** track latency, quality, drift, user
corrections, and fairness; version updates.

### Definition-of-done checklist

-   [ ] Task, input/output schema, and limitations documented.
-   [ ] Dependencies install reproducibly.
-   [ ] Data validation and missing-data handling implemented.
-   [ ] Sensitive data excluded from commits and logs.
-   [ ] Training/inference works in a clean environment.
-   [ ] Artifacts are saved and load correctly.
-   [ ] Evaluation uses held-out representative examples.
-   [ ] Baseline and task-specific metrics are recorded.
-   [ ] Failure cases, uncertainty, and limitations documented.
-   [ ] Privacy, safety, and fairness checks completed.
-   [ ] Backend interface and error cases tested.
-   [ ] README matches actual code and current status.

------------------------------------------------------------------------

## Final note

This document is a consolidated technical overview of all eight Setu
model modules. It intentionally distinguishes intended approaches from
the currently described scaffolds. Before treating it as a final
submission or public technical claim, verify filenames, CLI flags,
dataset schemas, dependencies, and evaluation results against the latest
code. Do not claim model training, measured accuracy, full RAG answer
generation, or production integration until completed and evidenced.
