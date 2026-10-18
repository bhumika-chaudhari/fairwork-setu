# Model 6: Job Matching & Recommendation

## Purpose
Rank job listings according to how closely they match a worker's skills,
experience and preferred job type.

## Algorithm
Sentence Transformers (`all-MiniLM-L6-v2`) create semantic embeddings.
Cosine similarity ranks each worker profile against job descriptions.

## Expected files

### data/raw/jobs.csv
Required columns:
- job_id
- title
- description
- skills_required

Optional columns:
- location
- employment_type

### data/raw/workers.csv
Required columns:
- worker_id
- skills
- experience

Optional columns:
- preferred_jobs
- location

## Setup
```powershell
python -m pip install -r model_codes/06_job_matching/requirements.txt
```

## Run dataset inspection
```powershell
python model_codes/06_job_matching/eda.py
```

## Generate recommendations for all workers
```powershell
python model_codes/06_job_matching/match.py
```

Output:
`data/processed/job_recommendations.csv`

## Recommend jobs for one worker
```powershell
python model_codes/06_job_matching/predict.py --worker-id W001 --top-k 5
```

Replace W001 with an ID present in workers.csv.

## Evaluation
Create `evaluation/relevance_labels.csv` with columns:
`worker_id,job_id,relevant`

Use reviewed relevance judgments, where relevant is 1 or 0.

Then run:
```powershell
python model_codes/06_job_matching/evaluate.py
```

Metrics include mean reciprocal rank and precision at 5.

## Limitations
This is a pretrained semantic matching scaffold, not a Setu-specific trained model.
Real job and worker datasets plus reviewed relevance labels are required.
Similarity scores are ranking signals, not probabilities of employment.
Location is displayed but not used as a hard eligibility or distance filter.
Review fairness, job authenticity and recommendation quality before deployment.
