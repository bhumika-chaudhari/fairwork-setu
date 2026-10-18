# Model 8: Health & Welfare RAG

## Purpose
Retrieve relevant passages from verified health and government welfare
documents to support grounded information access for Setu users.

## Approach
- Text extraction from .txt and .md documents.
- Chunking with overlap.
- Sentence Transformers embeddings.
- FAISS inner-product similarity search on normalized embeddings.
- Retrieved passages with source names for verification.

## Add documents
Place verified, current documents in `data/raw/`.
Supported formats in this starter implementation: `.txt` and `.md`.

Prefer official government or health authority sources. Record the
document title, issuing organization, publication/update date and official
URL inside each document so that users can verify it.

Do not include private patient records or unnecessary personal data.

## Install
```powershell
python -m pip install -r model_codes/08_health_welfare_rag/requirements.txt
```

## Inspect documents
```powershell
python model_codes/08_health_welfare_rag/eda.py
```

## Build the retrieval index
```powershell
python model_codes/08_health_welfare_rag/build_index.py
```

## Search
```powershell
python model_codes/08_health_welfare_rag/predict.py --query "Who may qualify for this welfare scheme?"
```

## Evaluate retrieval
Create `evaluation/retrieval_labels.jsonl` with one JSON object per line.
Example:
{"query":"question about a scheme","relevant_sources":["scheme.md"]}

Then run:
```powershell
python model_codes/08_health_welfare_rag/evaluate.py
```

## Current limitations
This is a retrieval scaffold, not a complete conversational generation
system. It retrieves passages but does not generate answers with an LLM.
It has no verified document corpus until documents are added.
Evaluation requires manually reviewed relevance labels.
Similarity is not proof that a passage is correct or current.

Do not use this system to diagnose illness, prescribe treatment, or make
final welfare eligibility decisions. Direct users to qualified health
professionals or official scheme authorities for consequential decisions.
