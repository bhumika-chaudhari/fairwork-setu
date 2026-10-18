# Model 7: Skill Extraction & Course Recommendation

## Purpose
Identify skills mentioned in worker profiles and recommend courses that
may help workers develop relevant skills.

## Approach
- Starter vocabulary matching for skill extraction.
- Sentence Transformers (`all-MiniLM-L6-v2`) for semantic embeddings.
- Cosine similarity for course ranking.
- Human-reviewed relevance labels for evaluation.

## Input files

### data/raw/workers.csv
Required column: `worker_id`

At least one profile text column is required:
- `skills`
- `experience`
- `interests`
- `preferred_jobs`

### data/raw/courses.csv
Required columns:
- `course_id`
- `title`
- `description`
- `skills_taught`

Optional columns:
- `provider`
- `course_url`

## Install dependencies
```powershell
python -m pip install -r model_codes/07_skill_recommendation/requirements.txt
```

## Inspect datasets
```powershell
python model_codes/07_skill_recommendation/eda.py
```

## Generate recommendations for all workers
```powershell
python model_codes/07_skill_recommendation/recommend.py
```

Output:
`data/processed/course_recommendations.csv`

## Recommend courses for one worker
```powershell
python model_codes/07_skill_recommendation/predict.py --worker-id W001 --top-k 5
```

Replace W001 with an ID from workers.csv.

## Evaluate
Create `evaluation/relevance_labels.csv` with columns:
`worker_id,course_id,relevant`

Use human-reviewed labels where relevant is 1 or 0.

Then run:
```powershell
python model_codes/07_skill_recommendation/evaluate.py
```

## Limitations
Skill extraction currently uses a manually defined vocabulary; it is not a
trained NER model and may miss synonyms or skills outside that vocabulary.
Recommendations use a pretrained embedding model, not a model fine-tuned
on Setu data. Real datasets and relevance labels are required.
Course availability, quality and suitability must be verified before
deployment.
