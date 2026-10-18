# Model 5: Transaction Information Extraction

## Purpose
Extract transaction amount, type, category and date from text. The text may come from manually entered messages or the output of the Voice Recognition model.

## Current approach
This initial scaffold uses transparent regular expressions and keyword rules. It does not yet train a statistical NER model.

## Expected dataset
Path: data/raw/transactions.csv

Required column:
- text: the original transaction message or transcript

Optional reference columns for future evaluation:
- amount
- transaction_type
- category
- date

Example text:
"Paid Rs. 250 for groceries on 2026-10-15"

## Commands

Install dependencies:

```bash
pip install -r model_codes/05_transaction_extraction/requirements.txt
```

Inspect the dataset:

```bash
python model_codes/05_transaction_extraction/eda.py
```

Extract fields for the dataset:

```bash
python model_codes/05_transaction_extraction/extract.py
```

Predict from one transaction:

```bash
python model_codes/05_transaction_extraction/predict.py --text "Received Rs. 1200 salary on 2026-10-15"
```

## Important limitations
- This is a rule-based starter, not a trained NER model.
- Keyword rules may misclassify ambiguous text and may not cover all Hindi, Hinglish or regional-language expressions.
- Date interpretation and currency formats must be validated against real examples.
- No dataset has been supplied and no model evaluation has been completed.
- Antigravity must adapt and test this implementation using the finalized dataset before integration.
